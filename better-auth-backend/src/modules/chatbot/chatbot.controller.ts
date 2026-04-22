import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { CHATBOT_MESSAGES } from '../../common/constants/app.constants';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthGuard } from '../../common/guards/auth.guard';
import { messageDataResponse } from '../../common/response/api-response.util';
import { requireAuthenticatedUserId } from '../../common/utils/request-user.util';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { AskChatbotDto } from './dto/ask-chatbot.dto';
import type { ReindexChatbotDto } from './dto/reindex-chatbot.dto';
import { ChatbotService } from './services/chatbot.service';

@Controller('chatbot')
@UseGuards(AuthGuard, RolesGuard)
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('ask')
  async ask(@Body() body: AskChatbotDto, @Req() request: Request) {
    requireAuthenticatedUserId(request);

    const result = await this.chatbotService.askQuestion({
      requesterName: request.user?.name ?? undefined,
      query: this.chatbotService.validateQuestion(body?.query),
      topK: this.chatbotService.validateTopK(body?.topK),
    });

    return messageDataResponse(CHATBOT_MESSAGES.ANSWER_GENERATED, result);
  }

  @Post('admin/reindex')
  @Roles('admin')
  async reindex(@Body() body: ReindexChatbotDto) {
    const result = await this.chatbotService.reindexStandups(
      this.chatbotService.validateReindexLimit(body?.limit),
    );
    return messageDataResponse(CHATBOT_MESSAGES.INDEX_REFRESHED, result);
  }

  @Post('admin/reindex/:standupId')
  @Roles('admin')
  async reindexOne(@Param('standupId') standupId: string) {
    const result = await this.chatbotService.reindexSingleStandup(standupId);
    return messageDataResponse(CHATBOT_MESSAGES.CHUNK_REFRESHED, result);
  }
}
