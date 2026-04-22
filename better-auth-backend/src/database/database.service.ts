import {
  resolveDatabaseProvider as resolveProviderFromConfig,
  type DatabaseProvider,
} from '../config/database.config';
import { createMongoDatabase as createMongoDatabaseInternal } from './mongodb/database.service';

export type { DatabaseProvider };

export const resolveDatabaseProvider = (): DatabaseProvider =>
  resolveProviderFromConfig();

export const createMongoDatabase = (mongodbUri: string) =>
  createMongoDatabaseInternal(mongodbUri);
