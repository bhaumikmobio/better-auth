import { BadRequestException, Injectable } from '@nestjs/common';
import { resolveDatabaseProvider } from '../../database/database.service';
import { PrismaService } from '../../database/prisma/prisma.service';
import { MongoDbStandupStore } from './stores/standup.mongodb.store';
import { MysqlStandupStore } from './stores/standup.mysql.store';
import { PostgresStandupStore } from './stores/standup.postgres.store';
import {
  STANDUP_HISTORY_DEFAULT_LIMIT,
  STANDUP_HISTORY_DEFAULT_OFFSET,
  STANDUP_HISTORY_MAX_LIMIT,
  toDateRange,
} from './standup.shared';
import type {
  AddReactionArgs,
  RemoveReactionArgs,
  StandupHistoryFilters,
  StandupHistoryQuery,
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

  async getHistoryFeed(currentUserId: string, query: StandupHistoryFilters) {
    return this.store.getHistoryFeed(currentUserId, query);
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

  validateHistoryQuery(query: StandupHistoryQuery): StandupHistoryFilters {
    const from = this.parseIsoDateQuery(query.from, 'from');
    const to = this.parseIsoDateQuery(query.to, 'to');

    if (
      from &&
      to &&
      new Date(`${from}T00:00:00.000Z`) > new Date(`${to}T00:00:00.000Z`)
    ) {
      throw new BadRequestException('from must be on or before to.');
    }

    const range = toDateRange(from, to);

    const limit = this.parseQueryNumber(
      query.limit,
      'limit',
      STANDUP_HISTORY_DEFAULT_LIMIT,
      {
        min: 1,
        max: STANDUP_HISTORY_MAX_LIMIT,
      },
    );
    const offset = this.parseQueryNumber(
      query.offset,
      'offset',
      STANDUP_HISTORY_DEFAULT_OFFSET,
      {
        min: 0,
      },
    );

    return {
      from: range.start.toISOString(),
      to: range.end.toISOString(),
      limit,
      offset,
    };
  }

  private parseIsoDateQuery(value: string | undefined, fieldName: string) {
    if (value === undefined) {
      return undefined;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      throw new BadRequestException(
        `${fieldName} must be in YYYY-MM-DD format.`,
      );
    }

    const parsed = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException(`${fieldName} must be a valid ISO date.`);
    }

    return value;
  }

  private parseQueryNumber(
    value: number | undefined,
    fieldName: string,
    defaultValue: number,
    options?: { min?: number; max?: number },
  ): number {
    if (value === undefined) {
      return defaultValue;
    }

    if (!Number.isInteger(value)) {
      throw new BadRequestException(`${fieldName} must be an integer.`);
    }

    const min = options?.min ?? Number.MIN_SAFE_INTEGER;
    const max = options?.max ?? Number.MAX_SAFE_INTEGER;
    if (value < min || value > max) {
      throw new BadRequestException(
        `${fieldName} must be between ${min} and ${max}.`,
      );
    }

    return value;
  }
}
