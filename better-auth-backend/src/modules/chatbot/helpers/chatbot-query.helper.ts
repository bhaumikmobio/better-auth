import { Injectable } from '@nestjs/common';
import type { ChatbotSource } from '../interfaces/chatbot.interfaces';

@Injectable()
export class ChatbotQueryHelper {
  private readonly defaultAllResultsLimit = 100;

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
