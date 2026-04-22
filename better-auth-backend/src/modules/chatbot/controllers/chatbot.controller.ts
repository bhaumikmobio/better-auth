import {
  Body,
  Controller,
  Param,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import type { AskChatbotDto } from '../dto/ask-chatbot.dto';
import type { ReindexChatbotDto } from '../dto/reindex-chatbot.dto';
import { ChatbotService } from '../services/chatbot.service';

@Controller('chatbot')
@UseGuards(AuthGuard, RolesGuard)
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('ask')
  async ask(@Body() body: AskChatbotDto, @Req() request: Request) {
    const userId = request.user?.id;
    if (!userId) {
      throw new UnauthorizedException('Authentication required.');
    }

    const result = await this.chatbotService.askQuestion({
      userId,
      requesterName: request.user?.name ?? undefined,
      query: this.chatbotService.validateQuestion(body?.query),
      topK: this.chatbotService.validateTopK(body?.topK),
    });

    return {
      message: 'Chatbot answer generated successfully.',
      data: result,
    };
  }

  @Post('admin/reindex')
  @Roles('admin')
  async reindex(@Body() body: ReindexChatbotDto) {
    const result = await this.chatbotService.reindexStandups(
      this.chatbotService.validateReindexLimit(body?.limit),
    );
    return {
      message: 'Vector index refreshed successfully.',
      data: result,
    };
  }

  @Post('admin/reindex/:standupId')
  @Roles('admin')
  async reindexOne(@Param('standupId') standupId: string) {
    const result = await this.chatbotService.reindexSingleStandup(standupId);
    return {
      message: 'Stand-up vector chunk refreshed successfully.',
      data: result,
    };
  }
}
