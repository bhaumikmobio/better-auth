import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { STANDUP_MESSAGES } from '../../common/constants/app.constants';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import {
  messageDataResponse,
  messageOnlyResponse,
} from '../../common/response/api-response.util';
import { requireAuthenticatedUserId } from '../../common/utils/request-user.util';
import type {
  CreateReactionDto,
  CreateStandupDto,
  StandupHistoryQueryDto,
  UpdateStandupSettingsDto,
} from './dto/standup.dto';
import { StandupService } from './standup.service';

@Controller('standup')
@UseGuards(AuthGuard, RolesGuard)
export class StandupController {
  constructor(private readonly standupService: StandupService) {}

  private requireUserId(request: Request): string {
    return requireAuthenticatedUserId(request);
  }

  @Post()
  async submitStandup(@Body() body: CreateStandupDto, @Req() request: Request) {
    const userId = this.requireUserId(request);

    const standup = await this.standupService.submitStandup({
      userId,
      yesterday: this.standupService.validateTextField(
        body?.yesterday,
        'yesterday',
      ),
      today: this.standupService.validateTextField(body?.today, 'today'),
      blockers: this.standupService.validateTextField(
        body?.blockers,
        'blockers',
      ),
      mood:
        typeof body?.mood === 'string' && body.mood.trim().length > 0
          ? body.mood.trim()
          : undefined,
    });

    return messageDataResponse(STANDUP_MESSAGES.SUBMITTED, {
      id: standup.id,
      createdAt: standup.createdAt,
    });
  }

  @Get('feed')
  async getFeed(@Req() request: Request) {
    const userId = this.requireUserId(request);

    const feed = await this.standupService.getTodayFeed(userId);
    return messageDataResponse(STANDUP_MESSAGES.FEED_FETCHED, feed);
  }

  @Get('history')
  async getHistory(
    @Query() query: StandupHistoryQueryDto,
    @Req() request: Request,
  ) {
    const userId = this.requireUserId(request);
    const historyQuery = this.standupService.validateHistoryQuery({
      from: query?.from,
      to: query?.to,
      limit:
        typeof query?.limit === 'string' && query.limit.trim().length > 0
          ? Number(query.limit)
          : undefined,
      offset:
        typeof query?.offset === 'string' && query.offset.trim().length > 0
          ? Number(query.offset)
          : undefined,
    });
    const history = await this.standupService.getHistoryFeed(
      userId,
      historyQuery,
    );

    return messageDataResponse(STANDUP_MESSAGES.HISTORY_FETCHED, history);
  }

  @Get('admin/summary')
  @Roles('admin')
  async getAdminSummary() {
    const summary = await this.standupService.getTodayAdminSummary();
    return messageDataResponse(STANDUP_MESSAGES.SUMMARY_FETCHED, summary);
  }

  @Patch('admin/settings')
  @Roles('admin')
  async updateSettings(@Body() body: UpdateStandupSettingsDto) {
    const dailyPrompt = this.standupService.validateTextField(
      body?.dailyPrompt,
      'dailyPrompt',
    );
    const settings = await this.standupService.updateSettings(dailyPrompt);

    return messageDataResponse(STANDUP_MESSAGES.SETTINGS_UPDATED, settings);
  }

  @Post(':standupId/reactions')
  async addReaction(
    @Param('standupId') standupId: string,
    @Body() body: CreateReactionDto,
    @Req() request: Request,
  ) {
    const userId = this.requireUserId(request);

    await this.standupService.addReaction({
      standupId,
      userId,
      emoji: this.standupService.validateEmoji(body?.emoji),
    });

    return messageOnlyResponse(STANDUP_MESSAGES.REACTION_ADDED);
  }

  @Delete(':standupId/reactions/:emoji')
  async removeReaction(
    @Param('standupId') standupId: string,
    @Param('emoji') emoji: string,
    @Req() request: Request,
  ) {
    const userId = this.requireUserId(request);

    await this.standupService.removeReaction({
      standupId,
      userId,
      emoji: this.standupService.validateEmoji(emoji),
    });

    return messageOnlyResponse(STANDUP_MESSAGES.REACTION_REMOVED);
  }
}
