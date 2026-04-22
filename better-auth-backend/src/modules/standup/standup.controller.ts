import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type {
  CreateReactionDto,
  CreateStandupDto,
  UpdateStandupSettingsDto,
} from './dto/standup.dto';
import { StandupService } from './standup.service';

@Controller('standup')
@UseGuards(AuthGuard, RolesGuard)
export class StandupController {
  constructor(private readonly standupService: StandupService) {}

  private requireUserId(request: Request): string {
    const userId = request.user?.id;
    if (!userId) {
      throw new UnauthorizedException('Authentication required.');
    }
    return userId;
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

    return {
      message: 'Stand-up submitted successfully.',
      data: {
        id: standup.id,
        createdAt: standup.createdAt,
      },
    };
  }

  @Get('feed')
  async getFeed(@Req() request: Request) {
    const userId = this.requireUserId(request);

    const feed = await this.standupService.getTodayFeed(userId);
    return {
      message: 'Stand-up feed fetched successfully.',
      data: feed,
    };
  }

  @Get('admin/summary')
  @Roles('admin')
  async getAdminSummary() {
    const summary = await this.standupService.getTodayAdminSummary();
    return {
      message: 'Today summary fetched successfully.',
      data: summary,
    };
  }

  @Patch('admin/settings')
  @Roles('admin')
  async updateSettings(@Body() body: UpdateStandupSettingsDto) {
    const dailyPrompt = this.standupService.validateTextField(
      body?.dailyPrompt,
      'dailyPrompt',
    );
    const settings = await this.standupService.updateSettings(dailyPrompt);

    return {
      message: 'Stand-up settings updated successfully.',
      data: settings,
    };
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

    return {
      message: 'Reaction added successfully.',
    };
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

    return {
      message: 'Reaction removed successfully.',
    };
  }
}
