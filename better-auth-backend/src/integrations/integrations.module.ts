import { Module } from '@nestjs/common';
import { EmbeddingsService } from './embeddings/embeddings.service';
import { LlmService } from './llm/llm.service';

@Module({
  providers: [LlmService, EmbeddingsService],
  exports: [LlmService, EmbeddingsService],
})
export class IntegrationsModule {}
