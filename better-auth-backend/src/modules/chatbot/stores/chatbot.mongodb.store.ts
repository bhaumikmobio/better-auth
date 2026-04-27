import { ObjectId, type Db, type Document } from 'mongodb';
import {
  MONGODB_URI_REQUIRED_MESSAGE,
  UNKNOWN_USER_NAME,
} from '../../../common/constants/app.constants';
import { createMongoDatabase } from '../../../database/database.service';
import {
  DEFAULT_PROMPT,
  STANDUP_SETTINGS_DOC_ID,
} from '../../standup/standup.shared';
import type {
  ChatbotSource,
  ChatbotStore,
  StandupChunkUpsert,
  StandupIndexSource,
} from '../interfaces/chatbot.interfaces';
import type {
  MongoSettingsDoc,
  MongoStandupChunkDoc,
  MongoStandupDoc,
  MongoUserDoc,
} from './chatbot.mongodb.types';
import {
  STANDUP_CHUNKS_COLLECTION,
  getEmbeddingDimensions,
  getVectorIndexName,
  isObjectId,
  mapVectorSearchResults,
  resolveStandupListLimit,
  toObjectId,
  toStandupSource,
} from './chatbot.mongodb.utils';

export class MongoDbChatbotStore implements ChatbotStore {
  private mongoDb: Db | null = null;
  private hasEnsuredChunkCollection = false;

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

  private async withDb<T>(work: (db: Db) => Promise<T>): Promise<T> {
    const db = await this.getMongoDb();
    return work(db);
  }

  private async ensureChunksCollection(): Promise<void> {
    if (this.hasEnsuredChunkCollection) {
      return;
    }

    await this.withDb(async (db) => {
      const chunksCollectionName = STANDUP_CHUNKS_COLLECTION;
      const existing = await db
        .listCollections({ name: chunksCollectionName }, { nameOnly: true })
        .toArray();
      if (existing.length === 0) {
        await db.createCollection(chunksCollectionName);
      }
    });
    this.hasEnsuredChunkCollection = true;
  }

  private async getMongoUserNameMap(
    userIds: string[],
  ): Promise<Map<string, string>> {
    const uniqueUserIds = Array.from(new Set(userIds.filter(Boolean)));
    if (uniqueUserIds.length === 0) {
      return new Map();
    }

    return this.withDb(async (db) => {
      const objectIds = uniqueUserIds
        .filter((id) => ObjectId.isValid(id))
        .map((id) => new ObjectId(id));

      const userFilter =
        objectIds.length > 0
          ? {
              $or: [
                { id: { $in: uniqueUserIds } },
                { _id: { $in: objectIds } },
              ],
            }
          : { id: { $in: uniqueUserIds } };

      const users = await db
        .collection<MongoUserDoc>('user')
        .find(userFilter, { projection: { _id: 1, id: 1, name: 1 } })
        .toArray();

      const userNameMap = new Map<string, string>();
      for (const user of users) {
        const normalizedName =
          typeof user.name === 'string' && user.name.trim().length > 0
            ? user.name.trim()
            : UNKNOWN_USER_NAME;
        const idKey =
          typeof user.id === 'string' && user.id.trim() ? user.id : null;
        const objectIdKey =
          user._id instanceof ObjectId ? user._id.toHexString() : null;
        if (idKey) {
          userNameMap.set(idKey, normalizedName);
        }
        if (objectIdKey) {
          userNameMap.set(objectIdKey, normalizedName);
        }
      }
      return userNameMap;
    });
  }

  async ensureVectorIndex(): Promise<void> {
    await this.ensureChunksCollection();
    const indexName = getVectorIndexName();
    const dimensions = getEmbeddingDimensions();

    try {
      await this.withDb(async (db) => {
        await db.command({
          createSearchIndexes: STANDUP_CHUNKS_COLLECTION,
          indexes: [
            {
              name: indexName,
              type: 'vectorSearch',
              definition: {
                fields: [
                  {
                    type: 'vector',
                    path: 'embedding',
                    numDimensions: dimensions,
                    similarity: 'cosine',
                  },
                ],
              },
            },
          ],
        });
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      const allowed = [
        'already exists',
        'Index already exists',
        'duplicate index',
      ].some((token) => message.toLowerCase().includes(token.toLowerCase()));
      if (!allowed) {
        throw error;
      }
    }
  }

  async getStandupDailyPrompt(): Promise<string> {
    return this.withDb(async (db) => {
      const settings = await db
        .collection<MongoSettingsDoc>('system_settings')
        .findOne({
          _id: STANDUP_SETTINGS_DOC_ID,
        });
      if (
        typeof settings?.dailyPrompt === 'string' &&
        settings.dailyPrompt.trim()
      ) {
        return settings.dailyPrompt.trim();
      }
      return DEFAULT_PROMPT;
    });
  }

  async listStandupsForIndexing(limit?: number): Promise<StandupIndexSource[]> {
    const safeLimit = resolveStandupListLimit(limit);

    const docs = await this.withDb(async (db) =>
      db
        .collection<MongoStandupDoc>('standup')
        .find({})
        .sort({ createdAt: -1 })
        .limit(safeLimit)
        .toArray(),
    );

    const standups = docs
      .map((doc) => toStandupSource(doc))
      .filter((doc): doc is StandupIndexSource => doc !== null);
    const userNameMap = await this.getMongoUserNameMap(
      standups.map((entry) => entry.userId),
    );

    return standups.map((entry) => ({
      ...entry,
      userName: userNameMap.get(entry.userId) ?? UNKNOWN_USER_NAME,
    }));
  }

  async findStandupForIndexing(
    standupId: string,
  ): Promise<StandupIndexSource | null> {
    if (!isObjectId(standupId)) {
      return null;
    }

    const doc = await this.withDb((db) =>
      db.collection<MongoStandupDoc>('standup').findOne({
        _id: toObjectId(standupId),
      }),
    );
    if (!doc) {
      return null;
    }

    const standup = toStandupSource(doc);
    if (!standup) {
      return null;
    }
    const userNameMap = await this.getMongoUserNameMap([standup.userId]);
    return {
      ...standup,
      userName: userNameMap.get(standup.userId) ?? UNKNOWN_USER_NAME,
    };
  }

  async upsertStandupChunk(payload: StandupChunkUpsert): Promise<void> {
    await this.ensureChunksCollection();
    const doc: MongoStandupChunkDoc = {
      standupId: payload.standupId,
      userId: payload.userId,
      createdAt: payload.createdAt,
      content: payload.content,
      embedding: payload.embedding,
      updatedAt: new Date(),
    };

    await this.withDb(async (db) => {
      await db
        .collection<MongoStandupChunkDoc>(STANDUP_CHUNKS_COLLECTION)
        .replaceOne({ standupId: payload.standupId }, doc, { upsert: true });
    });
  }

  async searchSimilarChunks(
    embedding: number[],
    limit: number,
  ): Promise<ChatbotSource[]> {
    await this.ensureChunksCollection();
    const indexName = getVectorIndexName();
    const safeLimit = Math.max(1, Math.min(limit, 8));

    let results: Document[];
    try {
      results = await this.withDb((db) =>
        db
          .collection<MongoStandupChunkDoc>(STANDUP_CHUNKS_COLLECTION)
          .aggregate<Document>([
            {
              $vectorSearch: {
                index: indexName,
                path: 'embedding',
                queryVector: embedding,
                numCandidates: Math.max(safeLimit * 8, 40),
                limit: safeLimit,
              },
            },
            {
              $project: {
                standupId: 1,
                userId: 1,
                createdAt: 1,
                content: 1,
                score: { $meta: 'vectorSearchScore' },
              },
            },
          ])
          .toArray(),
      );
    } catch (error: unknown) {
      const codeName =
        typeof error === 'object' &&
        error !== null &&
        'codeName' in error &&
        typeof (error as { codeName?: unknown }).codeName === 'string'
          ? (error as { codeName: string }).codeName
          : '';
      if (codeName === 'NamespaceNotFound') {
        return [];
      }
      throw error;
    }

    return mapVectorSearchResults(results);
  }
}
