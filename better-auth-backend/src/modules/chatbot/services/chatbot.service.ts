import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { resolveDatabaseProvider } from '../../../database/database-provider';
import { MongoDbChatbotStore } from '../stores/chatbot.mongodb.store';
import type {
  ChatbotAnswerResult,
  ChatbotAskArgs,
  ChatbotReindexResult,
  ChatbotSource,
  StandupIndexSource,
} from '../interfaces/chatbot.interfaces';
import { ChatbotEmbeddingService } from './embedding.service';
import { ChatbotLlmService } from './llm.service';

@Injectable()
export class ChatbotService {
  private readonly mongodbStore = new MongoDbChatbotStore();
  private readonly databaseProvider = resolveDatabaseProvider();
  private readonly defaultBootstrapReindexLimit = 200;

  constructor(
    private readonly embeddingService: ChatbotEmbeddingService,
    private readonly llmService: ChatbotLlmService,
  ) {}

  validateQuestion(value: unknown): string {
    if (typeof value !== 'string' || value.trim().length < 3) {
      throw new BadRequestException('query must be at least 3 characters.');
    }
    return value.trim();
  }

  validateTopK(value: unknown): number | undefined {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 8) {
      throw new BadRequestException('topK must be an integer between 1 and 8.');
    }

    return parsed;
  }

  validateReindexLimit(value: unknown): number | undefined {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 1000) {
      throw new BadRequestException(
        'limit must be an integer between 1 and 1000.',
      );
    }

    return parsed;
  }

  private assertMongoProvider(): void {
    if (this.databaseProvider !== 'mongodb') {
      throw new BadRequestException(
        'Chatbot vector search is available only when DATABASE=mongodb.',
      );
    }
  }

  private buildStandupChunk(standup: StandupIndexSource): string | null {
    const author =
      standup.userName?.trim() && standup.userName.trim().length > 0
        ? standup.userName.trim()
        : 'Unknown user';
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

  /** Prefer fresh chunks (names, no IDs); strip legacy ID lines from stored vector text. */
  private enrichSourcesForPrompt(
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
      return stripped.length > 0
        ? { ...source, content: stripped }
        : source;
    });
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

  private async generateAnswer(
    query: string,
    requesterLabel: string,
    dailyPrompt: string,
    sources: ChatbotSource[],
  ): Promise<string> {
    return this.llmService.generate([
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
    ]);
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .split(/[^a-z0-9]+/g)
      .map((token) => token.trim())
      .filter((token) => token.length >= 3);
  }

  private buildFallbackSources(
    query: string,
    standups: StandupIndexSource[],
    limit: number,
  ): ChatbotSource[] {
    const tokens = this.tokenize(query);
    const scored = standups
      .map((standup) => {
        const content = this.buildStandupChunk(standup);
        if (!content) {
          return null;
        }
        const lowered = content.toLowerCase();
        const hits = tokens.reduce(
          (sum, token) => sum + (lowered.includes(token) ? 1 : 0),
          0,
        );
        return {
          standupId: standup.standupId,
          userId: standup.userId,
          createdAt: standup.createdAt,
          content,
          score: tokens.length > 0 ? hits / tokens.length : 0,
          hits,
        };
      })
      .filter(
        (item): item is NonNullable<typeof item> & { hits: number } =>
          item !== null,
      )
      .sort((a, b) => {
        if (a.hits !== b.hits) {
          return b.hits - a.hits;
        }
        return b.createdAt.getTime() - a.createdAt.getTime();
      })
      .slice(0, limit);

    return scored.map((sourceWithHits) => {
      const { hits, ...source } = sourceWithHits;
      void hits;
      return source;
    });
  }

  private buildDirectAnswer(
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
        .map((item, index) => {
          const who =
            item.userName?.trim() ||
            item.userId ||
            'Unknown user';
          return `${index + 1}. ${who}: ${item.yesterday || 'N/A'}`;
        })
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
          const label =
            item.userName?.trim() ||
            item.userId ||
            'Unknown user';
          namesByUser.set(item.userId, label);
        }
        return `Users with mood "${moodQuery}": ${Array.from(
          namesByUser.values(),
        ).join(', ')}.`;
      }
    }

    const userResponseMatch = lowered.match(
      /response(?:s)?\s+(?:of|from)\s+(?:user\s+)?(.+)/i,
    );
    if (userResponseMatch?.[1]) {
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
          .map((latest) =>
            [
              `Latest standup response from ${latest.userName}:`,
              `Today: ${latest.today || 'N/A'}`,
              `Yesterday: ${latest.yesterday || 'N/A'}`,
              `Blockers: ${latest.blockers || 'N/A'}`,
              `Mood: ${latest.mood || 'N/A'}`,
            ].join('\n'),
          )
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

        const latest = matched[0];
        return [
          `Latest standup response from ${latest.userName}:`,
          `Today: ${latest.today || 'N/A'}`,
          `Yesterday: ${latest.yesterday || 'N/A'}`,
          `Blockers: ${latest.blockers || 'N/A'}`,
          `Mood: ${latest.mood || 'N/A'}`,
        ].join('\n');
      });

      return responses.join('\n\n');
    }

    return null;
  }

  private async indexSingleStandup(
    source: StandupIndexSource,
  ): Promise<boolean> {
    const chunk = this.buildStandupChunk(source);
    if (!chunk) {
      return false;
    }

    const embedding = await this.embeddingService.createEmbedding(chunk);
    await this.mongodbStore.upsertStandupChunk({
      standupId: source.standupId,
      userId: source.userId,
      createdAt: source.createdAt,
      content: chunk,
      embedding,
    });
    return true;
  }

  async reindexStandups(limit?: number): Promise<ChatbotReindexResult> {
    this.assertMongoProvider();
    await this.mongodbStore.ensureVectorIndex();

    const standups = await this.mongodbStore.listStandupsForIndexing(limit);
    let indexed = 0;
    let skipped = 0;
    for (const standup of standups) {
      const didIndex = await this.indexSingleStandup(standup);
      if (didIndex) {
        indexed += 1;
      } else {
        skipped += 1;
      }
    }

    return {
      processed: standups.length,
      indexed,
      skipped,
    };
  }

  async reindexSingleStandup(standupId: string): Promise<{ indexed: boolean }> {
    this.assertMongoProvider();
    await this.mongodbStore.ensureVectorIndex();
    const source = await this.mongodbStore.findStandupForIndexing(standupId);
    if (!source) {
      throw new NotFoundException('Stand-up entry not found.');
    }

    return { indexed: await this.indexSingleStandup(source) };
  }

  async askQuestion(args: ChatbotAskArgs): Promise<ChatbotAnswerResult> {
    this.assertMongoProvider();
    await this.mongodbStore.ensureVectorIndex();
    const limit = args.topK ?? 4;
    const [standupsForContext, dailyPrompt] = await Promise.all([
      this.mongodbStore.listStandupsForIndexing(200),
      this.mongodbStore.getStandupDailyPrompt(),
    ]);
    const directAnswer = this.buildDirectAnswer(
      args.query,
      standupsForContext,
      dailyPrompt,
    );
    if (directAnswer) {
      return {
        answer: directAnswer,
        sources: this.buildFallbackSources(
          args.query,
          standupsForContext,
          limit,
        ),
      };
    }

    const queryEmbedding = await this.embeddingService.createEmbedding(
      args.query,
    );
    let sources = await this.mongodbStore.searchSimilarChunks(
      queryEmbedding,
      limit,
    );

    if (sources.length === 0) {
      const reindex = await this.reindexStandups(
        this.defaultBootstrapReindexLimit,
      );
      if (reindex.indexed > 0) {
        sources = await this.mongodbStore.searchSimilarChunks(
          queryEmbedding,
          limit,
        );
      }
    }

    if (sources.length === 0) {
      sources = this.buildFallbackSources(
        args.query,
        standupsForContext,
        limit,
      );
    }

    const enrichedSources = this.enrichSourcesForPrompt(
      sources,
      standupsForContext,
    );
    const requesterLabel =
      args.requesterName?.trim() && args.requesterName.trim().length > 0
        ? args.requesterName.trim()
        : 'Authenticated user';

    const answer = await this.generateAnswer(
      args.query,
      requesterLabel,
      dailyPrompt,
      enrichedSources,
    );

    return { answer, sources: enrichedSources };
  }
}
