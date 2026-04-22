import { BadRequestException, Injectable } from '@nestjs/common';
import { resolveDatabaseProvider } from '../../database/database.service';
import { PrismaService } from '../../database/prisma/prisma.service';
import { MongoDbStandupStore } from './stores/standup.mongodb.store';
import { MysqlStandupStore } from './stores/standup.mysql.store';
import { PostgresStandupStore } from './stores/standup.postgres.store';
import type {
  AddReactionArgs,
  RemoveReactionArgs,
  StandupStore,
  SubmitStandupArgs,
} from './standup.types';

@Injectable()
export class StandupService {
  private readonly store: StandupStore;

  constructor(prisma: PrismaService) {
    const provider = resolveDatabaseProvider();
    switch (provider) {
      case 'postgres':
        this.store = new PostgresStandupStore(prisma);
        break;
      case 'mysql':
        this.store = new MysqlStandupStore();
        break;
      case 'mongodb':
        this.store = new MongoDbStandupStore();
        break;
    }
  }

  async submitStandup(args: SubmitStandupArgs) {
    return this.store.submitStandup(args);
  }

  async getDailyPrompt() {
    return this.store.getDailyPrompt();
  }

  async getTodayFeed(currentUserId: string) {
    return this.store.getTodayFeed(currentUserId);
  }

  async getTodayAdminSummary() {
    return this.store.getTodayAdminSummary();
  }

  async updateSettings(dailyPrompt: string) {
    return this.store.updateSettings(dailyPrompt);
  }

  async addReaction(args: AddReactionArgs) {
    return this.store.addReaction(args);
  }

  async removeReaction(args: RemoveReactionArgs) {
    return this.store.removeReaction(args);
  }

  validateTextField(value: unknown, fieldName: string): string {
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new BadRequestException(`${fieldName} is required.`);
    }

    return value.trim();
  }

  validateEmoji(value: unknown): string {
    const emoji = this.validateTextField(value, 'emoji');
    if (emoji.length > 16) {
      throw new BadRequestException('emoji is too long.');
    }

    return emoji;
  }
}
