import { ConflictException, NotFoundException } from '@nestjs/common';
import { ObjectId, type Db } from 'mongodb';
import {
  MONGODB_URI_REQUIRED_MESSAGE,
  UNKNOWN_USER_NAME,
} from '../../../common/constants/app.constants';
import { createMongoDatabase } from '../../../database/database.service';
import {
  DEFAULT_PROMPT,
  groupReactions,
  STANDUP_NOT_FOUND_MESSAGE,
  STANDUP_REACTION_NOT_FOUND_MESSAGE,
  STANDUP_SETTINGS_DOC_ID,
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
  StandupHistoryFilters,
  StandupHistoryResult,
  StandupStore,
  SubmitStandupArgs,
} from '../standup.types';

type MongoStandupDoc = {
  _id: ObjectId;
  userId: string;
  yesterday: string;
  today: string;
  blockers: string;
  mood?: string | null;
  createdAt: Date;
};

type MongoReactionDoc = {
  standupId: string;
  userId: string;
  emoji: string;
  createdAt?: Date;
};

type MongoUserDoc = {
  _id: ObjectId;
  id?: string;
  name?: string;
};

type MongoSettingsDoc = {
  _id: string;
  dailyPrompt?: string;
  updatedAt?: Date;
  createdAt?: Date;
};

export class MongoDbStandupStore implements StandupStore {
  private mongoDb: Db | null = null;

  private async getMongoDb(): Promise<Db> {
    if (this.mongoDb) {
      return this.mongoDb;
    }

    const mongodbUri = process.env.MONGODB_URI;
    if (!mongodbUri) {
      throw new Error(MONGODB_URI_REQUIRED_MESSAGE);
    }

    const { database, client } = createMongoDatabase(mongodbUri);
    await client.connect();
    this.mongoDb = database;
    return this.mongoDb;
  }

  private normalizeStandupId(value: unknown): string | null {
    if (value instanceof ObjectId) {
      return value.toHexString();
    }
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
    return null;
  }

  private async getMongoUserNameMap(
    userIds: string[],
  ): Promise<Map<string, string>> {
    const db = await this.getMongoDb();
    const uniqueUserIds = Array.from(new Set(userIds.filter(Boolean)));
    if (uniqueUserIds.length === 0) {
      return new Map();
    }

    const objectIds = uniqueUserIds
      .filter((id) => ObjectId.isValid(id))
      .map((id) => new ObjectId(id));

    const userFilter =
      objectIds.length > 0
        ? { $or: [{ id: { $in: uniqueUserIds } }, { _id: { $in: objectIds } }] }
        : { id: { $in: uniqueUserIds } };

    const users = await db
      .collection<MongoUserDoc>('user')
      .find(userFilter, { projection: { _id: 1, id: 1, name: 1 } })
      .toArray();

    const userNameMap = new Map<string, string>();
    for (const user of users) {
      const name =
        typeof user.name === 'string' && user.name.trim().length > 0
          ? user.name
          : UNKNOWN_USER_NAME;
      const keyFromId = typeof user.id === 'string' ? user.id : null;
      const keyFromObjectId = this.normalizeStandupId(user._id);
      if (keyFromId) {
        userNameMap.set(keyFromId, name);
      }
      if (keyFromObjectId) {
        userNameMap.set(keyFromObjectId, name);
      }
    }

    return userNameMap;
  }

  async submitStandup(args: SubmitStandupArgs): Promise<StandupCreateResult> {
    const db = await this.getMongoDb();
    const todayRange = toTodayRange();
    const existingToday = await db
      .collection<MongoStandupDoc>('standup')
      .findOne({
        userId: args.userId,
        createdAt: {
          $gte: todayRange.start,
          $lt: todayRange.end,
        },
      });
    if (existingToday) {
      throw new ConflictException(
        'You have already submitted a stand-up today.',
      );
    }

    const createdAt = new Date();
    const insertResult = await db.collection('standup').insertOne({
      userId: args.userId,
      yesterday: args.yesterday,
      today: args.today,
      blockers: args.blockers,
      mood: toOptionalString(args.mood),
      createdAt,
    });

    return {
      id: insertResult.insertedId.toHexString(),
      createdAt,
    };
  }

  async getDailyPrompt(): Promise<string> {
    const db = await this.getMongoDb();
    const settingsCollection =
      db.collection<MongoSettingsDoc>('system_settings');
    const settings = await settingsCollection.findOne({
      _id: STANDUP_SETTINGS_DOC_ID,
    });
    return typeof settings?.dailyPrompt === 'string'
      ? settings.dailyPrompt
      : DEFAULT_PROMPT;
  }

  async getTodayFeed(currentUserId: string): Promise<StandupFeedResult> {
    const db = await this.getMongoDb();
    const todayRange = toTodayRange();
    const [dailyPrompt, standups] = await Promise.all([
      this.getDailyPrompt(),
      db
        .collection<MongoStandupDoc>('standup')
        .find({
          createdAt: {
            $gte: todayRange.start,
            $lt: todayRange.end,
          },
        })
        .sort({ createdAt: -1 })
        .toArray(),
    ]);

    const standupEntries = standups
      .map((item) => {
        const id = this.normalizeStandupId(item._id);
        if (!id || typeof item.userId !== 'string') {
          return null;
        }
        return {
          id,
          userId: item.userId,
          createdAt:
            item.createdAt instanceof Date
              ? item.createdAt
              : new Date(item.createdAt),
          yesterday: typeof item.yesterday === 'string' ? item.yesterday : '',
          today: typeof item.today === 'string' ? item.today : '',
          blockers: typeof item.blockers === 'string' ? item.blockers : '',
          mood: typeof item.mood === 'string' ? item.mood : null,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    const [userNameMap, reactions] = await Promise.all([
      this.getMongoUserNameMap(standupEntries.map((item) => item.userId)),
      standupEntries.length > 0
        ? db
            .collection<MongoReactionDoc>('reaction')
            .find({
              standupId: { $in: standupEntries.map((item) => item.id) },
            })
            .toArray()
        : Promise.resolve([]),
    ]);

    const reactionsByStandupId = new Map<
      string,
      Array<{ emoji: string; userId: string }>
    >();
    for (const reaction of reactions) {
      if (
        typeof reaction.standupId !== 'string' ||
        typeof reaction.emoji !== 'string' ||
        typeof reaction.userId !== 'string'
      ) {
        continue;
      }
      const list = reactionsByStandupId.get(reaction.standupId) ?? [];
      list.push({ emoji: reaction.emoji, userId: reaction.userId });
      reactionsByStandupId.set(reaction.standupId, list);
    }

    return {
      dailyPrompt,
      hasSubmittedToday: standupEntries.some(
        (standup) => standup.userId === currentUserId,
      ),
      standups: standupEntries.map((standup) => ({
        id: standup.id,
        createdAt: standup.createdAt,
        yesterday: standup.yesterday,
        today: standup.today,
        blockers: standup.blockers,
        mood: standup.mood,
        user: {
          id: standup.userId,
          name: userNameMap.get(standup.userId) ?? UNKNOWN_USER_NAME,
        },
        reactions: groupReactions(
          reactionsByStandupId.get(standup.id) ?? [],
          currentUserId,
        ),
      })),
    };
  }

  async getHistoryFeed(
    currentUserId: string,
    query: StandupHistoryFilters,
  ): Promise<StandupHistoryResult> {
    const db = await this.getMongoDb();
    const fromDate = new Date(query.from);
    const toDate = new Date(query.to);
    const [standups, total] = await Promise.all([
      db
        .collection<MongoStandupDoc>('standup')
        .find({
          createdAt: {
            $gte: fromDate,
            $lt: toDate,
          },
        })
        .sort({ createdAt: -1 })
        .skip(query.offset)
        .limit(query.limit)
        .toArray(),
      db.collection<MongoStandupDoc>('standup').countDocuments({
        createdAt: {
          $gte: fromDate,
          $lt: toDate,
        },
      }),
    ]);

    const standupEntries = standups
      .map((item) => {
        const id = this.normalizeStandupId(item._id);
        if (!id || typeof item.userId !== 'string') {
          return null;
        }
        return {
          id,
          userId: item.userId,
          createdAt:
            item.createdAt instanceof Date
              ? item.createdAt
              : new Date(item.createdAt),
          yesterday: typeof item.yesterday === 'string' ? item.yesterday : '',
          today: typeof item.today === 'string' ? item.today : '',
          blockers: typeof item.blockers === 'string' ? item.blockers : '',
          mood: typeof item.mood === 'string' ? item.mood : null,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    const [userNameMap, reactions] = await Promise.all([
      this.getMongoUserNameMap(standupEntries.map((item) => item.userId)),
      standupEntries.length > 0
        ? db
            .collection<MongoReactionDoc>('reaction')
            .find({
              standupId: { $in: standupEntries.map((item) => item.id) },
            })
            .toArray()
        : Promise.resolve([]),
    ]);

    const reactionsByStandupId = new Map<
      string,
      Array<{ emoji: string; userId: string }>
    >();
    for (const reaction of reactions) {
      if (
        typeof reaction.standupId !== 'string' ||
        typeof reaction.emoji !== 'string' ||
        typeof reaction.userId !== 'string'
      ) {
        continue;
      }
      const list = reactionsByStandupId.get(reaction.standupId) ?? [];
      list.push({ emoji: reaction.emoji, userId: reaction.userId });
      reactionsByStandupId.set(reaction.standupId, list);
    }

    return {
      standups: standupEntries.map((standup) => ({
        id: standup.id,
        createdAt: standup.createdAt,
        yesterday: standup.yesterday,
        today: standup.today,
        blockers: standup.blockers,
        mood: standup.mood,
        user: {
          id: standup.userId,
          name: userNameMap.get(standup.userId) ?? UNKNOWN_USER_NAME,
        },
        reactions: groupReactions(
          reactionsByStandupId.get(standup.id) ?? [],
          currentUserId,
        ),
      })),
      filters: {
        from: query.from,
        to: query.to,
        limit: query.limit,
        offset: query.offset,
        total,
      },
    };
  }

  async getTodayAdminSummary(): Promise<AdminSummary> {
    const db = await this.getMongoDb();
    const todayRange = toTodayRange();
    const [totalCount, standups] = await Promise.all([
      db.collection<MongoStandupDoc>('standup').countDocuments({
        createdAt: {
          $gte: todayRange.start,
          $lt: todayRange.end,
        },
      }),
      db
        .collection<MongoStandupDoc>('standup')
        .find({
          createdAt: {
            $gte: todayRange.start,
            $lt: todayRange.end,
          },
          blockers: {
            $ne: '',
          },
        })
        .sort({ createdAt: -1 })
        .toArray(),
    ]);

    const normalizedStandups = standups
      .map((standup) => {
        const standupId = this.normalizeStandupId(standup._id);
        if (!standupId || typeof standup.userId !== 'string') {
          return null;
        }
        return {
          standupId,
          blockers:
            typeof standup.blockers === 'string' ? standup.blockers : '',
          createdAt:
            standup.createdAt instanceof Date
              ? standup.createdAt
              : new Date(standup.createdAt),
          userId: standup.userId,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    const userNameMap = await this.getMongoUserNameMap(
      normalizedStandups.map((item) => item.userId),
    );

    return {
      totalCount,
      blockers: normalizedStandups.map((standup) => ({
        standupId: standup.standupId,
        blockers: standup.blockers,
        createdAt: standup.createdAt,
        user: {
          id: standup.userId,
          name: userNameMap.get(standup.userId) ?? UNKNOWN_USER_NAME,
        },
      })),
    };
  }

  async updateSettings(dailyPrompt: string): Promise<SettingsResult> {
    const db = await this.getMongoDb();
    const now = new Date();
    const settingsCollection =
      db.collection<MongoSettingsDoc>('system_settings');
    await settingsCollection.updateOne(
      { _id: STANDUP_SETTINGS_DOC_ID },
      {
        $set: {
          dailyPrompt,
          updatedAt: now,
        },
        $setOnInsert: {
          createdAt: now,
        },
      },
      { upsert: true },
    );

    return {
      dailyPrompt,
      updatedAt: now,
    };
  }

  async addReaction(args: AddReactionArgs): Promise<void> {
    const db = await this.getMongoDb();
    if (!ObjectId.isValid(args.standupId)) {
      throw new NotFoundException(STANDUP_NOT_FOUND_MESSAGE);
    }
    const standupObjectId = new ObjectId(args.standupId);
    const standup = await db.collection<MongoStandupDoc>('standup').findOne({
      _id: standupObjectId,
    });
    if (!standup) {
      throw new NotFoundException(STANDUP_NOT_FOUND_MESSAGE);
    }

    await db.collection<MongoReactionDoc>('reaction').updateOne(
      {
        standupId: args.standupId,
        userId: args.userId,
        emoji: args.emoji,
      },
      {
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true },
    );
  }

  async removeReaction(args: RemoveReactionArgs): Promise<void> {
    const db = await this.getMongoDb();
    const deleted = await db
      .collection<MongoReactionDoc>('reaction')
      .deleteOne({
        standupId: args.standupId,
        userId: args.userId,
        emoji: args.emoji,
      });
    if (deleted.deletedCount === 0) {
      throw new NotFoundException(STANDUP_REACTION_NOT_FOUND_MESSAGE);
    }
  }
}
