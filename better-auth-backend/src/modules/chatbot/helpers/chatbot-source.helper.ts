import { Injectable } from '@nestjs/common';
import type {
  ChatbotSource,
  StandupIndexSource,
} from '../interfaces/chatbot.interfaces';
import { ChatbotChunkHelper } from './chatbot-chunk.helper';

@Injectable()
export class ChatbotSourceHelper {
  constructor(private readonly chunkHelper: ChatbotChunkHelper) {}

  enrichSourcesForPrompt(
    sources: ChatbotSource[],
    standups: StandupIndexSource[],
  ): ChatbotSource[] {
    const byStandupId = new Map(
      standups.map((entry) => [entry.standupId, entry]),
    );
    return sources.map((source) =>
      this.chunkHelper.enrichSourceChunkIfPossible(
        source,
        byStandupId.get(source.standupId),
      ),
    );
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
      const content = this.chunkHelper.buildStandupChunk(standup);
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

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .split(/[^a-z0-9]+/g)
      .map((token) => token.trim())
      .filter((token) => token.length >= 3);
  }
}
