/**
 * Chatbot embedding settings — no application defaults; set both in `.env`
 * when using MongoDB Atlas vector search / the chatbot (see `env.example`).
 */
const ENV_MODEL = 'CHATBOT_EMBED_MODEL';
const ENV_DIMS = 'CHATBOT_EMBEDDING_DIMENSIONS';

function requireNonEmptyEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required. See env.example.`);
  }
  return value;
}

export function getChatbotEmbeddingModelId(): string {
  return requireNonEmptyEnv(ENV_MODEL);
}

export function getEmbeddingDimensions(): number {
  const raw = requireNonEmptyEnv(ENV_DIMS);
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error(`${ENV_DIMS} must be a positive integer (got "${raw}").`);
  }
  return n;
}
