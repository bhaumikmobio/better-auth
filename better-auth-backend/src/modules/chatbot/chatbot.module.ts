import { Module } from '@nestjs/common';
import { IntegrationsModule } from '../../integrations/integrations.module';
import { ChatbotController } from './chatbot.controller';
import { ChatbotChunkHelper } from './helpers/chatbot-chunk.helper';
import { ChatbotQueryHelper } from './helpers/chatbot-query.helper';
import { ChatbotService } from './services/chatbot.service';
import { ChatbotValidationService } from './services/chatbot-validation.service';

@Module({
  imports: [IntegrationsModule],
  controllers: [ChatbotController],
  providers: [
    ChatbotService,
    ChatbotChunkHelper,
    ChatbotQueryHelper,
    ChatbotValidationService,
  ],
})
export class ChatbotModule {}
