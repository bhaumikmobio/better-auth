import { ConflictException, NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../../../database/prisma/prisma.service';
import {
  DEFAULT_PROMPT,
  groupReactions,
  toOptionalString,
  toTodayRange,
} from '../standup.shared';
import type {
  AddReactionArgs,
  AdminSummary,
  SettingsResult,
  StandupCreateResult,
  StandupFeedResult,
  SubmitStandupArgs,
  RemoveReactionArgs,
  StandupStore,
} from '../standup.types';

export class PostgresStandupStore implements StandupStore {
  constructor(private readonly prisma: PrismaService) {}

  async submitStandup(args: SubmitStandupArgs): Promise<StandupCreateResult> {
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
        mood: toOptionalString(args.mood),
      },
      select: {
        id: true,
        createdAt: true,
      },
    });
  }

  async getDailyPrompt(): Promise<string> {
    const settings = await this.prisma.systemSettings.findUnique({
      where: { id: 1 },
      select: { dailyPrompt: true },
    });
    return settings?.dailyPrompt ?? DEFAULT_PROMPT;
  }

  async getTodayFeed(currentUserId: string): Promise<StandupFeedResult> {
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
      hasSubmittedToday: standups.some(
        (standup) => standup.user.id === currentUserId,
      ),
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

  async getTodayAdminSummary(): Promise<AdminSummary> {
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

  async updateSettings(dailyPrompt: string): Promise<SettingsResult> {
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

  async addReaction(args: AddReactionArgs): Promise<void> {
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

  async removeReaction(args: RemoveReactionArgs): Promise<void> {
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
}
