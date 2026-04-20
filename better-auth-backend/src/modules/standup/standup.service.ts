import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

type DateRange = {
  start: Date;
  end: Date;
};

type FeedReaction = {
  emoji: string;
  count: number;
  reactedByMe: boolean;
};

type FeedStandup = {
  id: string;
  createdAt: Date;
  yesterday: string;
  today: string;
  blockers: string;
  mood: string | null;
  user: {
    id: string;
    name: string;
  };
  reactions: FeedReaction[];
};

const DEFAULT_PROMPT = 'What is your main goal today?';

const toTodayRange = (): DateRange => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
};

const toOptionalString = (value: string | undefined): string | null => {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const groupReactions = (
  reactions: Array<{ emoji: string; userId: string }>,
  currentUserId: string,
): FeedReaction[] => {
  const grouped = new Map<string, FeedReaction>();

  for (const reaction of reactions) {
    const existing = grouped.get(reaction.emoji);
    if (existing) {
      existing.count += 1;
      existing.reactedByMe =
        existing.reactedByMe || reaction.userId === currentUserId;
      continue;
    }

    grouped.set(reaction.emoji, {
      emoji: reaction.emoji,
      count: 1,
      reactedByMe: reaction.userId === currentUserId,
    });
  }

  return Array.from(grouped.values()).sort((a, b) => b.count - a.count);
};

@Injectable()
export class StandupService {
  constructor(private readonly prisma: PrismaService) {}

  async submitStandup(args: {
    userId: string;
    yesterday: string;
    today: string;
    blockers: string;
    mood?: string;
  }) {
    const todayRange = toTodayRange();

    const existingToday = await this.prisma.standup.findFirst({
      where: {
        userId: args.userId,
        createdAt: {
          gte: todayRange.start,
          lt: todayRange.end,
        },
      },
      select: { id: true },
    });

    if (existingToday) {
      throw new ConflictException(
        'You have already submitted a stand-up today.',
      );
    }

    return this.prisma.standup.create({
      data: {
        userId: args.userId,
        yesterday: args.yesterday,
        today: args.today,
        blockers: args.blockers,
        mood: toOptionalString(args.mood ?? undefined),
      },
    });
  }

  async getDailyPrompt() {
    const settings = await this.prisma.systemSettings.findUnique({
      where: { id: 1 },
      select: { dailyPrompt: true },
    });

    return settings?.dailyPrompt ?? DEFAULT_PROMPT;
  }

  async getTodayFeed(currentUserId: string): Promise<{
    dailyPrompt: string;
    standups: FeedStandup[];
  }> {
    const todayRange = toTodayRange();

    const [dailyPrompt, standups] = await Promise.all([
      this.getDailyPrompt(),
      this.prisma.standup.findMany({
        where: {
          createdAt: {
            gte: todayRange.start,
            lt: todayRange.end,
          },
        },
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
          reactions: {
            select: {
              emoji: true,
              userId: true,
            },
          },
        },
      }),
    ]);

    return {
      dailyPrompt,
      standups: standups.map((standup) => ({
        id: standup.id,
        createdAt: standup.createdAt,
        yesterday: standup.yesterday,
        today: standup.today,
        blockers: standup.blockers,
        mood: standup.mood,
        user: {
          id: standup.user.id,
          name: standup.user.name,
        },
        reactions: groupReactions(standup.reactions, currentUserId),
      })),
    };
  }

  async getTodayAdminSummary() {
    const todayRange = toTodayRange();

    const [totalCount, standups] = await Promise.all([
      this.prisma.standup.count({
        where: {
          createdAt: {
            gte: todayRange.start,
            lt: todayRange.end,
          },
        },
      }),
      this.prisma.standup.findMany({
        where: {
          createdAt: {
            gte: todayRange.start,
            lt: todayRange.end,
          },
          blockers: {
            not: '',
          },
        },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          blockers: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
    ]);

    return {
      totalCount,
      blockers: standups.map((standup) => ({
        standupId: standup.id,
        blockers: standup.blockers,
        createdAt: standup.createdAt,
        user: standup.user,
      })),
    };
  }

  async updateSettings(dailyPrompt: string) {
    return this.prisma.systemSettings.upsert({
      where: { id: 1 },
      update: { dailyPrompt },
      create: {
        id: 1,
        dailyPrompt,
      },
      select: {
        dailyPrompt: true,
        updatedAt: true,
      },
    });
  }

  async addReaction(args: {
    standupId: string;
    userId: string;
    emoji: string;
  }) {
    const standup = await this.prisma.standup.findUnique({
      where: { id: args.standupId },
      select: { id: true },
    });

    if (!standup) {
      throw new NotFoundException('Stand-up entry not found.');
    }

    await this.prisma.reaction.upsert({
      where: {
        standupId_userId_emoji: {
          standupId: args.standupId,
          userId: args.userId,
          emoji: args.emoji,
        },
      },
      update: {},
      create: {
        standupId: args.standupId,
        userId: args.userId,
        emoji: args.emoji,
      },
    });
  }

  async removeReaction(args: {
    standupId: string;
    userId: string;
    emoji: string;
  }) {
    const deleted = await this.prisma.reaction.deleteMany({
      where: {
        standupId: args.standupId,
        userId: args.userId,
        emoji: args.emoji,
      },
    });

    if (deleted.count === 0) {
      throw new NotFoundException('Reaction not found for this stand-up.');
    }
  }

  validateTextField(value: unknown, fieldName: string): string {
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new BadRequestException(`${fieldName} is required.`);
    }

    return value.trim();
  }

  validateEmoji(value: unknown): string {
    const emoji = this.validateTextField(value, 'emoji');
    if (emoji.length > 16) {
      throw new BadRequestException('emoji is too long.');
    }

    return emoji;
  }
}
