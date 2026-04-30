import { BadRequestException } from '@nestjs/common';

/**
 * Chatbot embedding settings — no application defaults; set both in `.env`
 * when using MongoDB Atlas vector search / the chatbot (see `env.example`).
 */
const ENV_MODEL = 'CHATBOT_EMBED_MODEL';
const ENV_DIMS = 'CHATBOT_EMBEDDING_DIMENSIONS';

export function getChatbotEmbeddingModelId(): string {
  const v = process.env.CHATBOT_EMBED_MODEL?.trim();
  if (!v) {
    throw new BadRequestException(
      `${ENV_MODEL} is required for chatbot embeddings (Transformers.js model id). See env.example.`,
    );
  }
  return v;
}

export function getEmbeddingDimensions(): number {
  const raw = process.env.CHATBOT_EMBEDDING_DIMENSIONS?.trim();
  if (!raw) {
    throw new BadRequestException(
      `${ENV_DIMS} is required and must match your embedding model output and Atlas vector index numDimensions. See env.example.`,
    );
  }
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0) {
    throw new BadRequestException(
      `${ENV_DIMS} must be a positive integer (got "${raw}").`,
    );
  }
  return n;
}
