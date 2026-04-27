import { Injectable } from '@nestjs/common';
import type { StandupIndexSource } from '../interfaces/chatbot.interfaces';
import { ChatbotChunkHelper } from './chatbot-chunk.helper';

@Injectable()
export class ChatbotDirectAnswerHelper {
  private readonly noStandupsMessage = 'No standup entries are available yet.';

  constructor(private readonly chunkHelper: ChatbotChunkHelper) {}

  buildDirectAnswer(
    query: string,
    standups: StandupIndexSource[],
    dailyPrompt: string,
  ): string | null {
    const lowered = query.toLowerCase();
    const asksAllUsersAllResponses =
      lowered.includes('all users') &&
      (lowered.includes('all response') || lowered.includes('all responses'));

    if (
      lowered.includes('daily prompt') ||
      (lowered.includes('system') && lowered.includes('setting'))
    ) {
      return `Current standup daily prompt: ${dailyPrompt}`;
    }

    if (lowered.includes('yester')) {
      if (standups.length === 0) {
        return this.noStandupsMessage;
      }
      const lines = standups
        .slice(0, 10)
        .map(
          (item, index) =>
            `${index + 1}. ${this.chunkHelper.resolveUserLabel(item)}: ${item.yesterday || 'N/A'}`,
        )
        .join('\n');
      return `Yesterday updates from recent standups:\n${lines}`;
    }

    if (lowered.includes('mood')) {
      const moodMatch = lowered.match(/mood[^a-z0-9]+is[^a-z0-9]+([a-z]+)/i);
      if (moodMatch?.[1]) {
        const moodQuery = moodMatch[1].toLowerCase();
        const matched = standups.filter(
          (item) => (item.mood ?? '').toLowerCase() === moodQuery,
        );
        if (matched.length === 0) {
          return `No standup entries found with mood "${moodQuery}".`;
        }
        const namesByUser = new Map<string, string>();
        for (const item of matched) {
          namesByUser.set(item.userId, this.chunkHelper.resolveUserLabel(item));
        }
        return `Users with mood "${moodQuery}": ${Array.from(namesByUser.values()).join(', ')}.`;
      }
    }

    if (asksAllUsersAllResponses) {
      if (standups.length === 0) {
        return this.noStandupsMessage;
      }
      return this.formatAllUsersStandupHistoryResponse(standups);
    }

    const userResponseMatch = lowered.match(
      /response(?:s)?\s+(?:of|from)\s+(?:user\s+)?(.+)/i,
    );
    if (!userResponseMatch?.[1]) {
      return null;
    }

    const rawSegment = userResponseMatch[1]
      .replace(/[?.!]+$/g, '')
      .trim()
      .toLowerCase();
    const asksForAllUsers = this.isAllUsersRequest(rawSegment);
    const responseMode = this.resolveUserResponseMode(lowered);

    if (asksForAllUsers) {
      if (standups.length === 0) {
        return this.noStandupsMessage;
      }
      return this.getLatestStandupByUser(standups)
        .map((latestEntry) => this.formatLatestStandupResponse(latestEntry))
        .join('\n\n');
    }

    const requestedUsers = this.parseRequestedUsers(rawSegment);

    if (requestedUsers.length === 0) {
      return null;
    }

    const responses = requestedUsers.map((userToken) => {
      const matched = this.findStandupsByUserToken(standups, userToken);

      if (matched.length === 0) {
        return `No matching standup context found for user "${userToken}".`;
      }

      if (responseMode === 'history') {
        return this.formatUserStandupHistoryResponse(matched);
      }

      return this.formatLatestStandupResponse(matched[0]);
    });

    return responses.join('\n\n');
  }

  private formatLatestStandupResponse(latest: StandupIndexSource): string {
    return [
      `Latest standup response from ${this.chunkHelper.resolveUserLabel(latest)}:`,
      `Date: ${this.formatSubmittedDate(latest.createdAt)}`,
      `Today: ${latest.today || 'N/A'}`,
      `Yesterday: ${latest.yesterday || 'N/A'}`,
      `Blockers: ${latest.blockers || 'N/A'}`,
      `Mood: ${latest.mood || 'N/A'}`,
    ].join('\n');
  }

  private formatUserStandupHistoryResponse(
    entries: StandupIndexSource[],
  ): string {
    const sorted = [...entries].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
    const userLabel = this.chunkHelper.resolveUserLabel(sorted[0]);
    const lines = sorted.map((entry, index) => {
      const submittedAt = this.formatSubmittedDate(entry.createdAt);
      return [
        `${index + 1}. Date: ${submittedAt}`,
        `   Today: ${entry.today || 'N/A'}`,
        `   Yesterday: ${entry.yesterday || 'N/A'}`,
        `   Blockers: ${entry.blockers || 'N/A'}`,
        `   Mood: ${entry.mood || 'N/A'}`,
      ].join('\n');
    });

    return [
      `Standup responses from ${userLabel} (newest to oldest):`,
      ...lines,
    ].join('\n');
  }

  private formatSubmittedDate(value: Date): string {
    return value.toISOString().split('T')[0];
  }

  private formatAllUsersStandupHistoryResponse(
    entries: StandupIndexSource[],
  ): string {
    const groupedByUser = new Map<string, StandupIndexSource[]>();
    for (const entry of entries) {
      const key = entry.userId;
      const list = groupedByUser.get(key) ?? [];
      list.push(entry);
      groupedByUser.set(key, list);
    }

    const grouped = Array.from(groupedByUser.values())
      .map((userEntries) => {
        const sorted = [...userEntries].sort(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
        );
        const latest = sorted[0];
        return {
          latestDate: latest.createdAt,
          content: this.formatUserStandupHistoryResponse(sorted),
        };
      })
      .sort((a, b) => b.latestDate.getTime() - a.latestDate.getTime());

    return grouped.map((item) => item.content).join('\n\n');
  }

  private parseRequestedUsers(rawSegment: string): string[] {
    return rawSegment
      .split(/\s*(?:and|,|&)\s*/g)
      .map((token) => token.trim())
      .filter(Boolean);
  }

  private isAllUsersRequest(rawSegment: string): boolean {
    return (
      rawSegment === 'all' ||
      rawSegment === 'all users' ||
      rawSegment === 'everyone' ||
      rawSegment === 'all user'
    );
  }

  private resolveUserResponseMode(loweredQuery: string): 'latest' | 'history' {
    const asksForLatest =
      loweredQuery.includes('latest response') ||
      loweredQuery.includes('newest response') ||
      loweredQuery.includes('recent response');
    const asksForDateWiseHistory =
      loweredQuery.includes('all response') ||
      loweredQuery.includes('all responses') ||
      loweredQuery.includes('date wise') ||
      loweredQuery.includes('history');

    return asksForDateWiseHistory && !asksForLatest ? 'history' : 'latest';
  }

  private findStandupsByUserToken(
    standups: StandupIndexSource[],
    userToken: string,
  ): StandupIndexSource[] {
    const normalizedToken = userToken.toLowerCase().trim();
    const tokenParts = normalizedToken
      .split(/\s+/g)
      .map((part) => part.trim())
      .filter(Boolean);

    return standups
      .filter((item) => {
        const normalizedName = item.userName.toLowerCase().trim();
        const normalizedUserId = item.userId.toLowerCase().trim();
        const matchesByName =
          normalizedName.includes(normalizedToken) ||
          (tokenParts.length > 1 &&
            tokenParts.every((part) => normalizedName.includes(part)));
        const matchesByUserId =
          normalizedUserId === normalizedToken ||
          (tokenParts.length > 1 &&
            tokenParts.every((part) => normalizedUserId.includes(part)));
        return matchesByName || matchesByUserId;
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  private getLatestStandupByUser(
    standups: StandupIndexSource[],
  ): StandupIndexSource[] {
    const latestByUser = new Map<string, StandupIndexSource>();
    const sorted = [...standups].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
    for (const item of sorted) {
      if (!latestByUser.has(item.userId)) {
        latestByUser.set(item.userId, item);
      }
    }
    return Array.from(latestByUser.values());
  }
}
