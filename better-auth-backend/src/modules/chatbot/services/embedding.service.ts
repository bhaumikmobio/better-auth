import { Injectable } from '@nestjs/common';
import { EmbeddingService as SharedEmbeddingService } from '../../../integrations/embeddings/embedding.service';

@Injectable()
export class ChatbotEmbeddingService {
  constructor(private readonly embeddingService: SharedEmbeddingService) {}

  async createEmbedding(text: string): Promise<number[]> {
    return this.embeddingService.createEmbedding(text);
  }
}
