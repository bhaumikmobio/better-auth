import { Module } from '@nestjs/common';
import { IntegrationsModule } from '../../integrations/integrations.module';
import { ChatbotController } from './chatbot.controller';
import { ChatbotHelper } from './chatbot.helper';
import { ChatbotLlmService } from './services/llm.service';
import { ChatbotService } from './services/chatbot.service';

@Module({
  imports: [IntegrationsModule],
  controllers: [ChatbotController],
  providers: [ChatbotService, ChatbotHelper, ChatbotLlmService],
})
export class ChatbotModule {}
