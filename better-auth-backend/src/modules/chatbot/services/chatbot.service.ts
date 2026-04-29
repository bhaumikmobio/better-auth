import { Injectable, NotFoundException } from '@nestjs/common';
import { EmbeddingsService } from '../../../integrations/embeddings/embeddings.service';
import { STANDUP_NOT_FOUND_MESSAGE } from '../../standup/standup.shared';
import { MongoDbChatbotStore } from '../stores/chatbot.mongodb.store';
import type {
  ChatbotAnswerResult,
  ChatbotAskArgs,
  ChatbotReindexResult,
  ChatbotSource,
  StandupIndexSource,
} from '../interfaces/chatbot.interfaces';
import { ChatbotChunkHelper } from '../helpers/chatbot-chunk.helper';
import { ChatbotQueryHelper } from '../helpers/chatbot-query.helper';
import { ChatbotValidationService } from './chatbot-validation.service';

@Injectable()
export class ChatbotService {
  private readonly mongodbStore = new MongoDbChatbotStore();
  private readonly defaultBootstrapReindexLimit = 200;
  private readonly defaultTopK = 4;
  private readonly noContextMessage = 'No matching standup context found.';

  constructor(
    private readonly chunkHelper: ChatbotChunkHelper,
    private readonly queryHelper: ChatbotQueryHelper,
    private readonly embeddingsService: EmbeddingsService,
    private readonly validationService: ChatbotValidationService,
  ) {}

  validateQuestion(value: unknown): string {
    return this.validationService.validateQuestion(value);
  }

  validateTopK(value: unknown): number | undefined {
    return this.validationService.validateTopK(value);
  }

  validateReindexLimit(value: unknown): number | undefined {
    return this.validationService.validateReindexLimit(value);
  }

  private sanitizeAndRefreshSources(
    sources: ChatbotSource[],
    standups: StandupIndexSource[],
  ): ChatbotSource[] {
    if (sources.length === 0) {
      return sources;
    }

    const byStandupId: Map<string, StandupIndexSource> = new Map(
      standups.map((item): [string, StandupIndexSource] => [
        item.standupId,
        item,
      ]),
    );
    const refreshed: ChatbotSource[] = [];
    for (const source of sources) {
      const standup = byStandupId.get(source.standupId);
      if (!standup) {
        refreshed.push(this.chunkHelper.enrichSourceChunkIfPossible(source));
        continue;
      }

      refreshed.push(
        this.chunkHelper.enrichSourceChunkIfPossible(source, standup),
      );
    }
    return refreshed;
  }

  private prepareSourcesForResponse(
    query: string,
    sources: ChatbotSource[],
    standups: StandupIndexSource[],
  ): ChatbotSource[] {
    const sanitized = this.sanitizeAndRefreshSources(sources, standups);
    const filtered = this.queryHelper.filterSourcesByIntent(query, sanitized);
    return this.queryHelper.sortByQueryIntent(query, filtered);
  }

  private buildSourcesFromStandups(
    standups: StandupIndexSource[],
    limit: number,
  ): ChatbotSource[] {
    return standups.slice(0, limit).flatMap((standup) => {
      const content = this.chunkHelper.buildStandupChunk(standup);
      if (!content) {
        return [];
      }

      return [
        {
          standupId: standup.standupId,
          userId: standup.userId,
          createdAt: standup.createdAt,
          content,
          score: 0,
        } satisfies ChatbotSource,
      ];
    });
  }

  private buildAnswerResult(
    sources: ChatbotSource[],
    query: string,
  ): ChatbotAnswerResult {
    return {
      answer:
        sources.length > 0
          ? this.queryHelper.buildRetrievalAnswer(sources, query)
          : this.noContextMessage,
      sources,
    };
  }

  private async indexSingleStandup(
    source: StandupIndexSource,
  ): Promise<boolean> {
    const chunk = this.chunkHelper.buildStandupChunk(source);
    if (!chunk) {
      return false;
    }

    const embedding = await this.embeddingsService.createEmbedding(chunk);
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
    this.validationService.assertMongoProvider();
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
    this.validationService.assertMongoProvider();
    await this.mongodbStore.ensureVectorIndex();
    const source = await this.mongodbStore.findStandupForIndexing(standupId);
    if (!source) {
      throw new NotFoundException(STANDUP_NOT_FOUND_MESSAGE);
    }

    return { indexed: await this.indexSingleStandup(source) };
  }

  async askQuestion(args: ChatbotAskArgs): Promise<ChatbotAnswerResult> {
    this.validationService.assertMongoProvider();
    await this.mongodbStore.ensureVectorIndex();
    const defaultLimit = args.topK ?? this.defaultTopK;
    const effectiveLimit = this.queryHelper.resolveEffectiveLimit(
      args.query,
      defaultLimit,
    );
    const vectorLimit = Math.min(effectiveLimit, 8);
    const standups = await this.mongodbStore.listStandupsForIndexing(1000);
    const userToken = this.queryHelper.extractUserToken(args.query);
    if (userToken && this.queryHelper.isAllHistoryUserQuery(args.query)) {
      const standupsByUser = this.queryHelper
        .filterStandupsByUserToken(standups, userToken)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      const sources = this.buildSourcesFromStandups(
        standupsByUser,
        effectiveLimit,
      );
      return this.buildAnswerResult(sources, args.query);
    }

    const structuredStandups = this.queryHelper.resolveStructuredStandups(
      args.query,
      standups,
      effectiveLimit,
    );
    if (structuredStandups) {
      const sortedStructuredStandups = [...structuredStandups].sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      );
      const structuredSources = this.buildSourcesFromStandups(
        sortedStructuredStandups,
        effectiveLimit,
      );
      const teamCompare = this.queryHelper.buildTeamCompareAnswer(
        sortedStructuredStandups,
      );
      const normalizedQuery = args.query.toLowerCase();
      return {
        answer:
          teamCompare &&
          normalizedQuery.includes('compare') &&
          normalizedQuery.includes('yesterday') &&
          normalizedQuery.includes('today')
            ? teamCompare
            : this.queryHelper.buildRetrievalAnswer(
                structuredSources,
                args.query,
              ),
        sources: structuredSources,
      };
    }

    const queryEmbedding = await this.embeddingsService.createEmbedding(
      args.query,
    );

    let sources = await this.mongodbStore.searchSimilarChunks(
      queryEmbedding,
      vectorLimit,
    );

    if (sources.length === 0) {
      const reindex = await this.reindexStandups(
        this.defaultBootstrapReindexLimit,
      );
      if (reindex.indexed > 0) {
        sources = await this.mongodbStore.searchSimilarChunks(
          queryEmbedding,
          vectorLimit,
        );
      }
    }
    sources = this.prepareSourcesForResponse(args.query, sources, standups);

    if (sources.length === 0 && userToken) {
      await this.reindexStandups(this.defaultBootstrapReindexLimit);
      const expanded = await this.mongodbStore.searchSimilarChunks(
        queryEmbedding,
        8,
      );
      sources = this.prepareSourcesForResponse(args.query, expanded, standups);
    }

    if (sources.length === 0 && userToken) {
      const standupsByUser = this.queryHelper.filterStandupsByUserToken(
        standups,
        userToken,
      );
      const sortedStandupsByUser = [...standupsByUser].sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      );
      sources = this.buildSourcesFromStandups(
        sortedStandupsByUser,
        effectiveLimit,
      );
    }

    return this.buildAnswerResult(sources, args.query);
  }
}
