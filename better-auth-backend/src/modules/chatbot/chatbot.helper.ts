import { Injectable } from '@nestjs/common';
import { UNKNOWN_USER_NAME } from '../../common/constants/app.constants';
import type {
  ChatbotSource,
  StandupIndexSource,
} from './interfaces/chatbot.interfaces';

@Injectable()
export class ChatbotHelper {
  buildStandupChunk(standup: StandupIndexSource): string | null {
    const author = this.resolveUserLabel(standup);
    const lines = [
      `Author: ${author}`,
      `Submitted At: ${standup.createdAt.toISOString()}`,
      `Yesterday: ${standup.yesterday.trim()}`,
      `Today: ${standup.today.trim()}`,
      `Blockers: ${standup.blockers.trim()}`,
    ];

    if (standup.mood?.trim()) {
      lines.push(`Mood: ${standup.mood.trim()}`);
    }

    const content = lines.join('\n').trim();
    return content.length > 0 ? content : null;
  }

  enrichSourcesForPrompt(
    sources: ChatbotSource[],
    standups: StandupIndexSource[],
  ): ChatbotSource[] {
    const byStandupId = new Map(
      standups.map((entry) => [entry.standupId, entry]),
    );
    return sources.map((source) => {
      const standup = byStandupId.get(source.standupId);
      if (standup) {
        const chunk = this.buildStandupChunk(standup);
        return chunk ? { ...source, content: chunk } : source;
      }
      const stripped = this.stripInternalIdsFromChunkText(source.content);
      return stripped.length > 0 ? { ...source, content: stripped } : source;
    });
  }

  buildFallbackSources(
    query: string,
    standups: StandupIndexSource[],
    limit: number,
  ): ChatbotSource[] {
    const tokens = this.tokenize(query);
    type ScoredSource = ChatbotSource & { hits: number };
    const scored: ScoredSource[] = [];

    for (const standup of standups) {
      const content = this.buildStandupChunk(standup);
      if (!content) {
        continue;
      }
      const lowered = content.toLowerCase();
      const hits = tokens.reduce(
        (sum, token) => sum + (lowered.includes(token) ? 1 : 0),
        0,
      );
      scored.push({
        standupId: standup.standupId,
        userId: standup.userId,
        createdAt: standup.createdAt,
        content,
        score: tokens.length > 0 ? hits / tokens.length : 0,
        hits,
      });
    }

    return scored
      .sort((a, b) => {
        if (a.hits !== b.hits) {
          return b.hits - a.hits;
        }
        return b.createdAt.getTime() - a.createdAt.getTime();
      })
      .slice(0, limit)
      .map(({ standupId, userId, createdAt, content, score }) => ({
        standupId,
        userId,
        createdAt,
        content,
        score,
      }));
  }

  buildDirectAnswer(
    query: string,
    standups: StandupIndexSource[],
    dailyPrompt: string,
  ): string | null {
    const lowered = query.toLowerCase();

    if (
      lowered.includes('daily prompt') ||
      (lowered.includes('system') && lowered.includes('setting'))
    ) {
      return `Current standup daily prompt: ${dailyPrompt}`;
    }

    if (lowered.includes('yester')) {
      if (standups.length === 0) {
        return 'No standup entries are available yet.';
      }
      const lines = standups
        .slice(0, 10)
        .map(
          (item, index) =>
            `${index + 1}. ${this.resolveUserLabel(item)}: ${item.yesterday || 'N/A'}`,
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
          namesByUser.set(item.userId, this.resolveUserLabel(item));
        }
        return `Users with mood "${moodQuery}": ${Array.from(
          namesByUser.values(),
        ).join(', ')}.`;
      }
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
    const asksForAllUsers =
      rawSegment === 'all' ||
      rawSegment === 'all users' ||
      rawSegment === 'everyone' ||
      rawSegment === 'all user';

    if (asksForAllUsers) {
      if (standups.length === 0) {
        return 'No standup entries are available yet.';
      }
      const latestByUser = new Map<string, StandupIndexSource>();
      const sorted = [...standups].sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      );
      for (const item of sorted) {
        if (!latestByUser.has(item.userId)) {
          latestByUser.set(item.userId, item);
        }
      }

      return Array.from(latestByUser.values())
        .map((latest) => this.formatLatestStandupResponse(latest))
        .join('\n\n');
    }

    const requestedUsers = rawSegment
      .split(/\s*(?:and|,|&)\s*/g)
      .map((token) => token.trim())
      .filter(Boolean);

    if (requestedUsers.length === 0) {
      return null;
    }

    const responses = requestedUsers.map((userToken) => {
      const matched = standups
        .filter((item) => {
          const normalizedName = item.userName.toLowerCase().trim();
          return (
            normalizedName.includes(userToken) ||
            item.userId.toLowerCase() === userToken
          );
        })
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      if (matched.length === 0) {
        return `No matching standup context found for user "${userToken}".`;
      }

      return this.formatLatestStandupResponse(matched[0]);
    });

    return responses.join('\n\n');
  }

  buildPromptMessages(
    query: string,
    requesterLabel: string,
    dailyPrompt: string,
    sources: ChatbotSource[],
  ): Array<{ role: 'system' | 'user'; content: string }> {
    return [
      { role: 'system', content: this.buildSystemPrompt() },
      {
        role: 'user',
        content: this.buildUserPrompt(
          query,
          requesterLabel,
          dailyPrompt,
          sources,
        ),
      },
    ];
  }

  resolveRequesterLabel(name?: string | null): string {
    return name?.trim() && name.trim().length > 0
      ? name.trim()
      : 'Authenticated user';
  }

  private buildSystemPrompt(): string {
    return [
      'You are an internal standup assistant.',
      'Use only the provided standup and daily prompt context.',
      'Do not invent tasks, users, or status updates.',
      'If context is missing, say "No matching standup context found."',
      'Refer to people using Author names from the context only.',
      'Do not mention standup IDs, user IDs, ObjectIds, or other database identifiers.',
      'Distinguish multiple entries by Submitted At when needed.',
      'Keep answers concise and factual.',
    ].join(' ');
  }

  private buildUserPrompt(
    query: string,
    requesterLabel: string,
    dailyPrompt: string,
    sources: ChatbotSource[],
  ): string {
    const context = sources
      .map(
        (source, index) =>
          `[Source ${index + 1}] (score=${source.score.toFixed(4)})\n${source.content}`,
      )
      .join('\n\n');

    return [
      'Answer the question using the context below.',
      'If unsure, state what is missing.',
      '',
      `Requester: ${requesterLabel}`,
      `Current Daily Prompt: ${dailyPrompt}`,
      '',
      `Question:\n${query}`,
      '',
      `Context:\n${context || 'No context found.'}`,
    ].join('\n');
  }

  private stripInternalIdsFromChunkText(content: string): string {
    return content
      .split('\n')
      .filter((line) => {
        const t = line.trimStart();
        return (
          !/^standup id:/i.test(t) &&
          !/^author id:/i.test(t) &&
          !/^author name:/i.test(t)
        );
      })
      .join('\n')
      .trim();
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .split(/[^a-z0-9]+/g)
      .map((token) => token.trim())
      .filter((token) => token.length >= 3);
  }

  private resolveUserLabel(
    item: Pick<StandupIndexSource, 'userName' | 'userId'>,
  ): string {
    return item.userName?.trim() || item.userId || UNKNOWN_USER_NAME;
  }

  private formatLatestStandupResponse(latest: StandupIndexSource): string {
    return [
      `Latest standup response from ${latest.userName}:`,
      `Today: ${latest.today || 'N/A'}`,
      `Yesterday: ${latest.yesterday || 'N/A'}`,
      `Blockers: ${latest.blockers || 'N/A'}`,
      `Mood: ${latest.mood || 'N/A'}`,
    ].join('\n');
  }
}
