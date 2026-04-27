import { Module } from '@nestjs/common';
import { IntegrationsModule } from '../../integrations/integrations.module';
import { ChatbotController } from './chatbot.controller';
import { ChatbotHelper } from './chatbot.helper';
import { ChatbotChunkHelper } from './helpers/chatbot-chunk.helper';
import { ChatbotDirectAnswerHelper } from './helpers/chatbot-direct-answer.helper';
import { ChatbotPromptHelper } from './helpers/chatbot-prompt.helper';
import { ChatbotSourceHelper } from './helpers/chatbot-source.helper';
import { ChatbotLlmService } from './services/llm.service';
import { ChatbotService } from './services/chatbot.service';
import { ChatbotValidationService } from './services/chatbot-validation.service';

@Module({
  imports: [IntegrationsModule],
  controllers: [ChatbotController],
  providers: [
    ChatbotService,
    ChatbotHelper,
    ChatbotLlmService,
    ChatbotChunkHelper,
    ChatbotSourceHelper,
    ChatbotPromptHelper,
    ChatbotDirectAnswerHelper,
    ChatbotValidationService,
  ],
})
export class ChatbotModule {}
