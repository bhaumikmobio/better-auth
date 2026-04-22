import { BadRequestException, Injectable } from '@nestjs/common';
import { LlmService } from '../llm/llm.service';

type OllamaEmbeddingResponse = {
  embedding?: number[];
};

@Injectable()
export class EmbeddingsService {
  constructor(private readonly llmService: LlmService) {}

  getEmbeddingModel(): string {
    return process.env.OLLAMA_EMBED_MODEL?.trim() || 'nomic-embed-text';
  }

  async createEmbedding(text: string): Promise<number[]> {
    const payload = await this.llmService.postJson<OllamaEmbeddingResponse>(
      '/api/embeddings',
      {
        model: this.getEmbeddingModel(),
        prompt: text,
      },
    );

    if (
      !Array.isArray(payload.embedding) ||
      payload.embedding.length === 0 ||
      !payload.embedding.every((value) => typeof value === 'number')
    ) {
      throw new BadRequestException(
        'Ollama embedding response is missing a valid embedding vector.',
      );
    }

    return payload.embedding;
  }
}
