import { config } from 'dotenv';
import { resolve } from 'node:path';

/**
 * Load `.env` from the project root so `process.env` is populated before
 * the rest of the app (and auth/prisma entrypoints) read configuration.
 */
config({ path: resolve(process.cwd(), '.env') });
