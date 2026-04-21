import { Module } from '@nestjs/common';
import { EmbeddingService } from '../../integrations/embeddings/embedding.service';
import { OllamaService } from '../../integrations/ollama/ollama.service';
import { ChatbotController } from './controllers/chatbot.controller';
import { ChatbotEmbeddingService } from './services/embedding.service';
import { ChatbotLlmService } from './services/llm.service';
import { ChatbotService } from './services/chatbot.service';

@Module({
  controllers: [ChatbotController],
  providers: [
    ChatbotService,
    ChatbotLlmService,
    ChatbotEmbeddingService,
    OllamaService,
    EmbeddingService,
  ],
})
export class ChatbotModule {}
