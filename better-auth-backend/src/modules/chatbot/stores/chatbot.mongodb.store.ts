import { ObjectId, type Db, type Document, type MongoClient } from 'mongodb';
import { createMongoDatabase } from '../../../database/database-provider';
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

type MongoStandupDoc = {
  _id: ObjectId;
  userId?: string;
  createdAt?: Date;
  yesterday?: string;
  today?: string;
  blockers?: string;
  mood?: string | null;
};

type MongoUserDoc = {
  _id: ObjectId;
  id?: string;
  name?: string;
};

type MongoStandupChunkDoc = {
  standupId: string;
  userId: string;
  createdAt: Date;
  content: string;
  embedding: number[];
  updatedAt: Date;
};

type MongoSettingsDoc = {
  _id: string;
  dailyPrompt?: string;
};

export class MongoDbChatbotStore implements ChatbotStore {
  private mongoClient: MongoClient | null = null;
  private mongoDb: Db | null = null;
  private hasEnsuredChunkCollection = false;

  private getVectorIndexName(): string {
    const configured = process.env.CHATBOT_VECTOR_INDEX?.trim();
    return configured && configured.length > 0
      ? configured
      : 'standup_chunks_vector_index';
  }

  private getEmbeddingDimensions(): number {
    const raw = Number.parseInt(
      process.env.OLLAMA_EMBED_DIMENSIONS?.trim() ?? '768',
      10,
    );
    if (Number.isNaN(raw) || raw < 64) {
      return 768;
    }
    return raw;
  }

  private async getMongoDb(): Promise<Db> {
    if (this.mongoDb) {
      return this.mongoDb;
    }

    const mongodbUri = process.env.MONGODB_URI;
    if (!mongodbUri) {
      throw new Error('MONGODB_URI is required when DATABASE=mongodb');
    }

    const { database, client } = createMongoDatabase(mongodbUri);
    const mongoClient = client as MongoClient;
    await mongoClient.connect();
    this.mongoClient = mongoClient;
    this.mongoDb = database as Db;
    return this.mongoDb;
  }

  private async ensureChunksCollection(): Promise<void> {
    if (this.hasEnsuredChunkCollection) {
      return;
    }

    const db = await this.getMongoDb();
    const chunksCollectionName = 'standup_chunks';
    const existing = await db
      .listCollections({ name: chunksCollectionName }, { nameOnly: true })
      .toArray();
    if (existing.length === 0) {
      await db.createCollection(chunksCollectionName);
    }
    this.hasEnsuredChunkCollection = true;
  }

  private toStandupSource(doc: MongoStandupDoc): StandupIndexSource | null {
    if (!doc._id || typeof doc.userId !== 'string') {
      return null;
    }

    return {
      standupId: doc._id.toHexString(),
      userId: doc.userId,
      userName: 'Unknown user',
      createdAt: doc.createdAt instanceof Date ? doc.createdAt : new Date(),
      yesterday: typeof doc.yesterday === 'string' ? doc.yesterday : '',
      today: typeof doc.today === 'string' ? doc.today : '',
      blockers: typeof doc.blockers === 'string' ? doc.blockers : '',
      mood: typeof doc.mood === 'string' ? doc.mood : null,
    };
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
      const normalizedName =
        typeof user.name === 'string' && user.name.trim().length > 0
          ? user.name.trim()
          : 'Unknown user';
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
  }

  async ensureVectorIndex(): Promise<void> {
    const db = await this.getMongoDb();
    await this.ensureChunksCollection();
    const indexName = this.getVectorIndexName();
    const dimensions = this.getEmbeddingDimensions();

    try {
      await db.command({
        createSearchIndexes: 'standup_chunks',
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
    const db = await this.getMongoDb();
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
  }

  async listStandupsForIndexing(limit?: number): Promise<StandupIndexSource[]> {
    const db = await this.getMongoDb();
    const safeLimit =
      typeof limit === 'number' && Number.isFinite(limit) && limit > 0
        ? Math.min(Math.floor(limit), 1000)
        : 200;

    const docs = await db
      .collection<MongoStandupDoc>('standup')
      .find({})
      .sort({ createdAt: -1 })
      .limit(safeLimit)
      .toArray();

    const standups = docs
      .map((doc) => this.toStandupSource(doc))
      .filter((doc): doc is StandupIndexSource => doc !== null);
    const userNameMap = await this.getMongoUserNameMap(
      standups.map((entry) => entry.userId),
    );

    return standups.map((entry) => ({
      ...entry,
      userName: userNameMap.get(entry.userId) ?? 'Unknown user',
    }));
  }

  async findStandupForIndexing(
    standupId: string,
  ): Promise<StandupIndexSource | null> {
    if (!ObjectId.isValid(standupId)) {
      return null;
    }

    const db = await this.getMongoDb();
    const doc = await db.collection<MongoStandupDoc>('standup').findOne({
      _id: new ObjectId(standupId),
    });
    if (!doc) {
      return null;
    }

    const standup = this.toStandupSource(doc);
    if (!standup) {
      return null;
    }
    const userNameMap = await this.getMongoUserNameMap([standup.userId]);
    return {
      ...standup,
      userName: userNameMap.get(standup.userId) ?? 'Unknown user',
    };
  }

  async upsertStandupChunk(payload: StandupChunkUpsert): Promise<void> {
    const db = await this.getMongoDb();
    await this.ensureChunksCollection();
    const doc: MongoStandupChunkDoc = {
      standupId: payload.standupId,
      userId: payload.userId,
      createdAt: payload.createdAt,
      content: payload.content,
      embedding: payload.embedding,
      updatedAt: new Date(),
    };

    await db
      .collection<MongoStandupChunkDoc>('standup_chunks')
      .replaceOne({ standupId: payload.standupId }, doc, { upsert: true });
  }

  async searchSimilarChunks(
    embedding: number[],
    limit: number,
  ): Promise<ChatbotSource[]> {
    const db = await this.getMongoDb();
    await this.ensureChunksCollection();
    const indexName = this.getVectorIndexName();
    const safeLimit = Math.max(1, Math.min(limit, 8));

    let results: Document[];
    try {
      results = await db
        .collection<MongoStandupChunkDoc>('standup_chunks')
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
        .toArray();
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

    return results
      .map((item) => {
        if (
          typeof item.standupId !== 'string' ||
          typeof item.userId !== 'string' ||
          typeof item.content !== 'string'
        ) {
          return null;
        }
        const date =
          item.createdAt instanceof Date
            ? item.createdAt
            : new Date(String(item.createdAt ?? ''));
        return {
          standupId: item.standupId,
          userId: item.userId,
          createdAt: Number.isNaN(date.getTime()) ? new Date() : date,
          content: item.content,
          score:
            typeof item.score === 'number' && Number.isFinite(item.score)
              ? item.score
              : 0,
        } satisfies ChatbotSource;
      })
      .filter((item): item is ChatbotSource => item !== null);
  }
}
