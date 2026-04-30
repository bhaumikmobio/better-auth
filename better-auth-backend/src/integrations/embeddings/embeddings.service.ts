import { BadRequestException, Injectable } from '@nestjs/common';
import { pipeline } from '@xenova/transformers';
import type { FeatureExtractionPipeline } from '@xenova/transformers';
import {
  getChatbotEmbeddingModelId,
  getEmbeddingDimensions,
} from '../../config/embedding.config';

@Injectable()
export class EmbeddingsService {
  private extractorPromise: Promise<FeatureExtractionPipeline> | null = null;

  getEmbeddingModelId(): string {
    return getChatbotEmbeddingModelId();
  }

  private async getExtractor(): Promise<FeatureExtractionPipeline> {
    if (!this.extractorPromise) {
      const modelId = getChatbotEmbeddingModelId();
      this.extractorPromise = pipeline(
        'feature-extraction',
        modelId,
      ) as Promise<FeatureExtractionPipeline>;
    }
    return this.extractorPromise;
  }

  private tensorToVector(output: unknown): number[] {
    if (output && typeof output === 'object' && 'data' in output) {
      const data = (output as { data: Float32Array | Float64Array }).data;
      if (data && data.length > 0) {
        return Array.from(data);
      }
    }
    throw new BadRequestException(
      'Embedding model returned an empty or invalid tensor.',
    );
  }

  async createEmbedding(text: string): Promise<number[]> {
    const trimmed = text.trim();
    if (!trimmed) {
      throw new BadRequestException('Embedding input cannot be empty.');
    }

    const extractor = await this.getExtractor();
    const raw = await extractor(trimmed, {
      pooling: 'mean',
      normalize: true,
    });

    const vector = this.tensorToVector(raw);
    const expected = getEmbeddingDimensions();
    if (vector.length !== expected) {
      throw new BadRequestException(
        `Embedding length ${vector.length} does not match configured dimensions (${expected}). Set CHATBOT_EMBEDDING_DIMENSIONS to the model output size, or pick a model that matches your vector index.`,
      );
    }

    return vector;
  }
}
