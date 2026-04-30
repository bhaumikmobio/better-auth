import { ObjectId, type Document } from 'mongodb';
import { UNKNOWN_USER_NAME } from '../../../common/constants/app.constants';
import { getEmbeddingDimensions } from '../../../config/embedding.config';
import type {
  ChatbotSource,
  StandupIndexSource,
} from '../interfaces/chatbot.interfaces';
import type { MongoStandupDoc } from './chatbot.mongodb.types';

export { getEmbeddingDimensions };

export const STANDUP_CHUNKS_COLLECTION = 'standup_chunks';
export const DEFAULT_VECTOR_INDEX_NAME = 'standup_chunks_vector_index';
export const MAX_STANDUP_INDEX_LIMIT = 1000;
export const DEFAULT_STANDUP_LIST_LIMIT = 200;

export function getVectorIndexName(): string {
  const configured = process.env.MONGODB_VECTOR_INDEX?.trim();
  return configured && configured.length > 0
    ? configured
    : DEFAULT_VECTOR_INDEX_NAME;
}

export function resolveStandupListLimit(limit?: number): number {
  return typeof limit === 'number' && Number.isFinite(limit) && limit > 0
    ? Math.min(Math.floor(limit), MAX_STANDUP_INDEX_LIMIT)
    : DEFAULT_STANDUP_LIST_LIMIT;
}

export function toStandupSource(
  doc: MongoStandupDoc,
): StandupIndexSource | null {
  if (!doc._id || typeof doc.userId !== 'string') {
    return null;
  }

  return {
    standupId: doc._id.toHexString(),
    userId: doc.userId,
    userName: UNKNOWN_USER_NAME,
    createdAt: doc.createdAt instanceof Date ? doc.createdAt : new Date(),
    yesterday: typeof doc.yesterday === 'string' ? doc.yesterday : '',
    today: typeof doc.today === 'string' ? doc.today : '',
    blockers: typeof doc.blockers === 'string' ? doc.blockers : '',
    mood: typeof doc.mood === 'string' ? doc.mood : null,
  };
}

export function isObjectId(value: string): boolean {
  return ObjectId.isValid(value);
}

export function toObjectId(value: string): ObjectId {
  return new ObjectId(value);
}

export function mapVectorSearchResults(results: Document[]): ChatbotSource[] {
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
