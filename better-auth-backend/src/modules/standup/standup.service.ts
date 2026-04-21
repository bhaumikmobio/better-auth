import { BadRequestException, Injectable } from '@nestjs/common';
import { resolveDatabaseProvider } from '../../database/database-provider';
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
  private readonly postgresStore: PostgresStandupStore;
  private readonly mysqlStore = new MysqlStandupStore();
  private readonly mongodbStore = new MongoDbStandupStore();
  private readonly databaseProvider = resolveDatabaseProvider();

  constructor(private readonly prisma: PrismaService) {
    this.postgresStore = new PostgresStandupStore(prisma);
  }

  private getStore(): StandupStore {
    switch (this.databaseProvider) {
      case 'postgres':
        return this.postgresStore;
      case 'mysql':
        return this.mysqlStore;
      case 'mongodb':
        return this.mongodbStore;
    }
  }

  async submitStandup(args: SubmitStandupArgs) {
    return this.getStore().submitStandup(args);
  }

  async getDailyPrompt() {
    return this.getStore().getDailyPrompt();
  }

  async getTodayFeed(currentUserId: string) {
    return this.getStore().getTodayFeed(currentUserId);
  }

  async getTodayAdminSummary() {
    return this.getStore().getTodayAdminSummary();
  }

  async updateSettings(dailyPrompt: string) {
    return this.getStore().updateSettings(dailyPrompt);
  }

  async addReaction(args: AddReactionArgs) {
    return this.getStore().addReaction(args);
  }

  async removeReaction(args: RemoveReactionArgs) {
    return this.getStore().removeReaction(args);
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
