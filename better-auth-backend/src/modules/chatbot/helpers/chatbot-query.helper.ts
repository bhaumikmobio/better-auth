import { Injectable } from '@nestjs/common';
import type {
  ChatbotSource,
  StandupIndexSource,
} from '../interfaces/chatbot.interfaces';

@Injectable()
export class ChatbotQueryHelper {
  private readonly defaultAllResultsLimit = 100;
  private readonly monthMap = new Map<string, number>([
    ['january', 0],
    ['february', 1],
    ['march', 2],
    ['april', 3],
    ['may', 4],
    ['june', 5],
    ['july', 6],
    ['august', 7],
    ['september', 8],
    ['october', 9],
    ['november', 10],
    ['december', 11],
  ]);

  private normalizeText(value: string): string {
    return value.toLowerCase().trim();
  }

  private extractFieldValue(content: string, field: string): string | null {
    const escapedField = field.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`^${escapedField}:\\s*(.+)$`, 'im');
    const match = content.match(regex);
    return match?.[1]?.trim() ?? null;
  }

  extractMoodToken(query: string): string | null {
    const normalized = this.normalizeText(query);
    const match =
      normalized.match(/\bwhose\s+mood\s+is\s+([a-z]+)/i) ??
      normalized.match(/\bmood\s+is\s+([a-z]+)/i) ??
      normalized.match(/\bmood\s+([a-z]+)/i);
    return match?.[1] ?? null;
  }

  extractUserToken(query: string): string | null {
    const normalized = this.normalizeText(query);
    const match = normalized.match(/\b(?:of|from|for)\s+([a-z][a-z\s]{1,40})/i);
    const directToken = match?.[1] ?? null;

    const token = (directToken ?? normalized)
      .replace(/\b(?:in|on|for|with)\b.*$/i, '')
      .replace(/[^a-z\s]/gi, '')
      .trim();
    const ignoredExact = new Set([
      'all users',
      'all user',
      'everyone',
      'latest response',
      'latest',
      'old logs',
      'old log',
      'logs',
      'log',
      'responses',
      'response',
      'updates',
      'update',
    ]);
    if (!token || ignoredExact.has(token)) {
      return null;
    }

    if (directToken) {
      return token;
    }

    if (/^[a-z]+(?:\s+[a-z]+)?$/i.test(token) && token.length >= 3) {
      return token;
    }
    return null;
  }

  resolveEffectiveLimit(query: string, defaultLimit: number): number {
    const normalized = this.normalizeText(query);
    if (this.isAllHistoryQuery(normalized) || normalized.includes('all')) {
      return this.defaultAllResultsLimit;
    }
    return defaultLimit;
  }

  sortByQueryIntent(query: string, sources: ChatbotSource[]): ChatbotSource[] {
    const normalized = this.normalizeText(query);
    const sorted = [...sources];
    if (
      normalized.includes('latest') ||
      normalized.includes('newest') ||
      normalized.includes('recent')
    ) {
      return sorted.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      );
    }
    if (normalized.includes('old') || normalized.includes('oldest')) {
      return sorted.sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
      );
    }
    return sorted;
  }

  filterSourcesByIntent(
    query: string,
    sources: ChatbotSource[],
  ): ChatbotSource[] {
    const moodToken = this.extractMoodToken(query);
    const userToken = this.extractUserToken(query);
    if (!moodToken && !userToken) {
      return sources;
    }

    return sources.filter((source) => {
      const moodMatches = moodToken
        ? this.normalizeText(
            this.extractFieldValue(source.content, 'Mood') ?? '',
          ) === this.normalizeText(moodToken)
        : true;
      const userMatches = userToken
        ? this.matchesUserToken(
            this.extractFieldValue(source.content, 'Author') ?? '',
            userToken,
          )
        : true;
      return moodMatches && userMatches;
    });
  }

  filterStandupsByUserToken(
    standups: StandupIndexSource[],
    userToken: string,
  ): StandupIndexSource[] {
    const directMatches = standups.filter((standup) =>
      this.matchesUserToken(standup.userName, userToken),
    );
    if (directMatches.length === 0) {
      return directMatches;
    }

    const matchedUserIds = new Set(directMatches.map((entry) => entry.userId));
    return standups.filter((entry) => matchedUserIds.has(entry.userId));
  }

  buildRetrievalAnswer(sources: ChatbotSource[], query?: string): string {
    const isAllHistory = query
      ? this.isAllHistoryQuery(this.normalizeText(query))
      : false;
    return sources
      .map((source, index) => {
        const submittedAt = source.createdAt.toISOString().split('T')[0];
        const cleanedContent = source.content
          .split('\n')
          .filter((line) => !/^submitted at:/i.test(line.trim()))
          .join('\n');
        return isAllHistory
          ? [`${index + 1}. Date: ${submittedAt}`, cleanedContent].join('\n')
          : [`${index + 1}.`, `Date: ${submittedAt}`, cleanedContent].join(
              '\n',
            );
      })
      .join('\n\n');
  }

  isAllHistoryUserQuery(query: string): boolean {
    const normalized = this.normalizeText(query);
    return this.isAllHistoryQuery(normalized) && !!this.extractUserToken(query);
  }

  resolveStructuredStandups(
    query: string,
    standups: StandupIndexSource[],
    limit: number,
  ): StandupIndexSource[] | null {
    const normalized = this.normalizeText(query);
    const byDate = this.extractDateFromQuery(normalized);
    const latestSorted = [...standups].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
    let filtered = latestSorted;

    if (byDate) {
      filtered = filtered.filter((entry) =>
        this.isSameDate(entry.createdAt, byDate),
      );
    }

    const userToken = this.extractUserToken(query);
    if (userToken) {
      filtered = this.filterStandupsByUserToken(filtered, userToken);
    }
    const allHistoryQuery = this.isAllHistoryQuery(normalized);

    if (
      normalized.includes('blocker') &&
      (normalized.includes('who') ||
        normalized.includes('anyone') ||
        normalized.includes('show'))
    ) {
      return filtered
        .filter((entry) => this.hasBlockers(entry.blockers))
        .slice(0, limit);
    }

    if (normalized.includes('team') && normalized.includes('mood')) {
      return this.toLatestPerUser(filtered).slice(0, limit);
    }

    if (normalized.includes('submitted') && normalized.includes('mood')) {
      return filtered.filter((entry) => !!entry.mood?.trim()).slice(0, limit);
    }

    if (
      allHistoryQuery &&
      ((normalized.includes('all') &&
        (normalized.includes('users') || normalized.includes('user'))) ||
        normalized.includes('standup history') ||
        !!userToken)
    ) {
      return filtered.slice(0, limit);
    }

    if (
      normalized.includes('submitted a standup') ||
      normalized.includes('submitted updates')
    ) {
      return this.toLatestPerUser(filtered).slice(0, limit);
    }

    const workKeyword = this.extractWorkKeyword(normalized);
    if (workKeyword) {
      return filtered
        .filter((entry) =>
          `${entry.today} ${entry.yesterday}`
            .toLowerCase()
            .includes(workKeyword.toLowerCase()),
        )
        .slice(0, limit);
    }

    if (
      normalized.includes('latest standup update') ||
      normalized.includes('working on today') ||
      normalized.includes('did') ||
      normalized.includes('yesterday') ||
      normalized.includes('mood today') ||
      normalized.includes('latest response')
    ) {
      return userToken ? filtered.slice(0, 1) : filtered.slice(0, limit);
    }

    if (userToken) {
      return filtered.slice(0, limit);
    }

    return null;
  }

  buildTeamCompareAnswer(standups: StandupIndexSource[]): string | null {
    if (standups.length === 0) {
      return null;
    }

    return standups
      .map((entry, index) =>
        [
          `${index + 1}. ${entry.userName}`,
          `Yesterday: ${entry.yesterday || 'N/A'}`,
          `Today: ${entry.today || 'N/A'}`,
        ].join('\n'),
      )
      .join('\n\n');
  }

  private matchesUserToken(authorName: string, userToken: string): boolean {
    const author = this.normalizeText(authorName);
    if (!author) {
      return false;
    }
    const tokenParts = this.normalizeText(userToken)
      .split(/\s+/g)
      .filter(Boolean);
    return tokenParts.every((part) => author.includes(part));
  }

  private hasBlockers(value: string): boolean {
    const normalized = this.normalizeText(value);
    return ['yes', 'true', 'blocked', 'y'].includes(normalized);
  }

  private toLatestPerUser(
    standups: StandupIndexSource[],
  ): StandupIndexSource[] {
    const map = new Map<string, StandupIndexSource>();
    for (const entry of standups) {
      if (!map.has(entry.userId)) {
        map.set(entry.userId, entry);
      }
    }
    return Array.from(map.values());
  }

  private extractWorkKeyword(query: string): string | null {
    const match =
      query.match(/\bworking on\s+(.+)/i) ??
      query.match(/\bworked on\s+(.+)/i) ??
      query.match(/\bmentioning\s+(.+)/i);
    const token = match?.[1]?.replace(/[?.!]+$/g, '').trim();
    return token && token.length >= 2 ? token : null;
  }

  private extractDateFromQuery(query: string): Date | null {
    if (query.includes('today')) {
      const now = new Date();
      return new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
      );
    }

    const monthDay = query.match(
      /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})\b/i,
    );
    if (!monthDay) {
      return null;
    }

    const month = this.monthMap.get(monthDay[1].toLowerCase());
    if (month === undefined) {
      return null;
    }

    const day = Number.parseInt(monthDay[2], 10);
    if (!Number.isFinite(day)) {
      return null;
    }

    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), month, day));
  }

  private isSameDate(left: Date, right: Date): boolean {
    return (
      left.getUTCFullYear() === right.getUTCFullYear() &&
      left.getUTCMonth() === right.getUTCMonth() &&
      left.getUTCDate() === right.getUTCDate()
    );
  }

  private isAllHistoryQuery(normalizedQuery: string): boolean {
    return (
      normalizedQuery.includes('all update') ||
      normalizedQuery.includes('all updates') ||
      normalizedQuery.includes('all response') ||
      normalizedQuery.includes('all responses') ||
      normalizedQuery.includes('standup history') ||
      normalizedQuery.includes('all logs') ||
      normalizedQuery.includes('all log')
    );
  }
}
