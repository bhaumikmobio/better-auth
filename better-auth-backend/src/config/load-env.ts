import { config } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Load `.env` before any config reads.
 * Supports starting from repo root, backend root, or compiled dist runtime.
 */
const envCandidates = [
  resolve(process.cwd(), '.env'),
  resolve(__dirname, '../../.env'),
  resolve(__dirname, '../../../.env'),
];
const envPath = Array.from(new Set(envCandidates)).find((path) =>
  existsSync(path),
);

if (envPath) {
  config({ path: envPath, override: false });
} else {
  config({ override: false });
}
