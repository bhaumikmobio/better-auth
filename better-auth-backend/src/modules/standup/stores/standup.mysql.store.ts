/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument */
import { ConflictException, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { getMysqlKysely } from '../../../database/kysely.service';
import {
  DEFAULT_PROMPT,
  groupReactions,
  toOptionalString,
  toTodayRange,
} from '../standup.shared';
import type {
  AddReactionArgs,
  AdminSummary,
  RemoveReactionArgs,
  SettingsResult,
  StandupCreateResult,
  StandupFeedResult,
  StandupStore,
  SubmitStandupArgs,
} from '../standup.types';

export class MysqlStandupStore implements StandupStore {
  async submitStandup(args: SubmitStandupArgs): Promise<StandupCreateResult> {
    const todayRange = toTodayRange();
    const db = getMysqlKysely() as any;
    const existingToday = await db
      .selectFrom('standup')
      .select('id')
      .where('userId', '=', args.userId)
      .where('createdAt', '>=', todayRange.start)
      .where('createdAt', '<', todayRange.end)
      .executeTakeFirst();

    if (existingToday) {
      throw new ConflictException(
        'You have already submitted a stand-up today.',
      );
    }

    const createdAt = new Date();
    const id = randomUUID();
    await db
      .insertInto('standup')
      .values({
        id,
        userId: args.userId,
        yesterday: args.yesterday,
        today: args.today,
        blockers: args.blockers,
        mood: toOptionalString(args.mood),
        createdAt,
      })
      .execute();

    return { id, createdAt };
  }

  async getDailyPrompt(): Promise<string> {
    const db = getMysqlKysely() as any;
    const settings = await db
      .selectFrom('system_settings')
      .select('dailyPrompt')
      .where('id', '=', 1)
      .executeTakeFirst();
    return (settings?.dailyPrompt as string | undefined) ?? DEFAULT_PROMPT;
  }

  async getTodayFeed(currentUserId: string): Promise<StandupFeedResult> {
    const db = getMysqlKysely() as any;
    const todayRange = toTodayRange();
    const [dailyPrompt, standups] = await Promise.all([
      this.getDailyPrompt(),
      db
        .selectFrom('standup as s')
        .innerJoin('user as u', 'u.id', 's.userId')
        .select([
          's.id as id',
          's.createdAt as createdAt',
          's.yesterday as yesterday',
          's.today as today',
          's.blockers as blockers',
          's.mood as mood',
          'u.id as userId',
          'u.name as userName',
        ])
        .where('s.createdAt', '>=', todayRange.start)
        .where('s.createdAt', '<', todayRange.end)
        .orderBy('s.createdAt', 'desc')
        .execute(),
    ]);

    const standupIds = standups.map((standup: any) => standup.id);
    const reactions =
      standupIds.length > 0
        ? await db
            .selectFrom('reaction')
            .select(['standupId', 'emoji', 'userId'])
            .where('standupId', 'in', standupIds)
            .execute()
        : [];

    const reactionsByStandupId = new Map<
      string,
      Array<{ emoji: string; userId: string }>
    >();
    for (const reaction of reactions as Array<{
      standupId: string;
      emoji: string;
      userId: string;
    }>) {
      const list = reactionsByStandupId.get(reaction.standupId) ?? [];
      list.push({ emoji: reaction.emoji, userId: reaction.userId });
      reactionsByStandupId.set(reaction.standupId, list);
    }

    return {
      dailyPrompt,
      hasSubmittedToday: standups.some(
        (standup: any) => standup.userId === currentUserId,
      ),
      standups: standups.map((standup: any) => ({
        id: standup.id,
        createdAt: new Date(standup.createdAt),
        yesterday: standup.yesterday,
        today: standup.today,
        blockers: standup.blockers,
        mood: standup.mood,
        user: {
          id: standup.userId,
          name: standup.userName,
        },
        reactions: groupReactions(
          reactionsByStandupId.get(standup.id) ?? [],
          currentUserId,
        ),
      })),
    };
  }

  async getTodayAdminSummary(): Promise<AdminSummary> {
    const db = getMysqlKysely() as any;
    const todayRange = toTodayRange();
    const [countRow, standups] = await Promise.all([
      db
        .selectFrom('standup')
        .select((eb: any) => eb.fn.count('id').as('count'))
        .where('createdAt', '>=', todayRange.start)
        .where('createdAt', '<', todayRange.end)
        .executeTakeFirst(),
      db
        .selectFrom('standup as s')
        .innerJoin('user as u', 'u.id', 's.userId')
        .select([
          's.id as standupId',
          's.blockers as blockers',
          's.createdAt as createdAt',
          'u.id as userId',
          'u.name as userName',
        ])
        .where('s.createdAt', '>=', todayRange.start)
        .where('s.createdAt', '<', todayRange.end)
        .where('s.blockers', '!=', '')
        .orderBy('s.createdAt', 'desc')
        .execute(),
    ]);

    return {
      totalCount: Number(countRow?.count ?? 0),
      blockers: (standups as Array<any>).map((standup) => ({
        standupId: standup.standupId,
        blockers: standup.blockers,
        createdAt: new Date(standup.createdAt),
        user: {
          id: standup.userId,
          name: standup.userName,
        },
      })),
    };
  }

  async updateSettings(dailyPrompt: string): Promise<SettingsResult> {
    const db = getMysqlKysely() as any;
    const now = new Date();
    await db
      .insertInto('system_settings')
      .values({
        id: 1,
        dailyPrompt,
        createdAt: now,
        updatedAt: now,
      })
      .onDuplicateKeyUpdate({
        dailyPrompt,
        updatedAt: now,
      })
      .execute();

    const settings = await db
      .selectFrom('system_settings')
      .select(['dailyPrompt', 'updatedAt'])
      .where('id', '=', 1)
      .executeTakeFirst();

    return {
      dailyPrompt: (settings?.dailyPrompt as string | undefined) ?? dailyPrompt,
      updatedAt: settings?.updatedAt instanceof Date ? settings.updatedAt : now,
    };
  }

  async addReaction(args: AddReactionArgs): Promise<void> {
    const db = getMysqlKysely() as any;
    const standup = await db
      .selectFrom('standup')
      .select('id')
      .where('id', '=', args.standupId)
      .executeTakeFirst();
    if (!standup) {
      throw new NotFoundException('Stand-up entry not found.');
    }

    await db
      .insertInto('reaction')
      .values({
        id: randomUUID(),
        standupId: args.standupId,
        userId: args.userId,
        emoji: args.emoji,
        createdAt: new Date(),
      })
      .onDuplicateKeyIgnore()
      .execute();
  }

  async removeReaction(args: RemoveReactionArgs): Promise<void> {
    const db = getMysqlKysely() as any;
    const deleted = await db
      .deleteFrom('reaction')
      .where('standupId', '=', args.standupId)
      .where('userId', '=', args.userId)
      .where('emoji', '=', args.emoji)
      .executeTakeFirst();

    const deletedCount = Number(
      (deleted?.numDeletedRows as bigint | number | undefined) ?? 0,
    );
    if (deletedCount === 0) {
      throw new NotFoundException('Reaction not found for this stand-up.');
    }
  }
}
