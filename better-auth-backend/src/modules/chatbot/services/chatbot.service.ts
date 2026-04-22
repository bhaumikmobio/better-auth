import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { resolveDatabaseProvider } from '../../../config/database.config';
import { EmbeddingsService } from '../../../integrations/embeddings/embeddings.service';
import { STANDUP_NOT_FOUND_MESSAGE } from '../../standup/standup.shared';
import { MongoDbChatbotStore } from '../stores/chatbot.mongodb.store';
import type {
  ChatbotAnswerResult,
  ChatbotAskArgs,
  ChatbotReindexResult,
  StandupIndexSource,
} from '../interfaces/chatbot.interfaces';
import { ChatbotHelper } from '../chatbot.helper';
import { ChatbotLlmService } from './llm.service';

@Injectable()
export class ChatbotService {
  private readonly mongodbStore = new MongoDbChatbotStore();
  private readonly defaultBootstrapReindexLimit = 200;
  private readonly defaultTopK = 4;

  constructor(
    private readonly chatbotHelper: ChatbotHelper,
    private readonly embeddingsService: EmbeddingsService,
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
    if (resolveDatabaseProvider() !== 'mongodb') {
      throw new BadRequestException(
        'Chatbot vector search is available only when DATABASE=mongodb.',
      );
    }
  }

  private async generateAnswer(
    query: string,
    requesterLabel: string,
    dailyPrompt: string,
    sources: ChatbotAnswerResult['sources'],
  ): Promise<string> {
    return this.llmService.generate(
      this.chatbotHelper.buildPromptMessages(
        query,
        requesterLabel,
        dailyPrompt,
        sources,
      ),
    );
  }

  private async indexSingleStandup(
    source: StandupIndexSource,
  ): Promise<boolean> {
    const chunk = this.chatbotHelper.buildStandupChunk(source);
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
      throw new NotFoundException(STANDUP_NOT_FOUND_MESSAGE);
    }

    return { indexed: await this.indexSingleStandup(source) };
  }

  async askQuestion(args: ChatbotAskArgs): Promise<ChatbotAnswerResult> {
    this.assertMongoProvider();
    await this.mongodbStore.ensureVectorIndex();
    const limit = args.topK ?? this.defaultTopK;
    const [standupsForContext, dailyPrompt] = await Promise.all([
      this.mongodbStore.listStandupsForIndexing(200),
      this.mongodbStore.getStandupDailyPrompt(),
    ]);
    const directAnswer = this.chatbotHelper.buildDirectAnswer(
      args.query,
      standupsForContext,
      dailyPrompt,
    );
    if (directAnswer) {
      return {
        answer: directAnswer,
        sources: this.chatbotHelper.buildFallbackSources(
          args.query,
          standupsForContext,
          limit,
        ),
      };
    }

    const queryEmbedding = await this.embeddingsService.createEmbedding(
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
      sources = this.chatbotHelper.buildFallbackSources(
        args.query,
        standupsForContext,
        limit,
      );
    }

    const enrichedSources = this.chatbotHelper.enrichSourcesForPrompt(
      sources,
      standupsForContext,
    );
    const requesterLabel = this.chatbotHelper.resolveRequesterLabel(
      args.requesterName,
    );

    const answer = await this.generateAnswer(
      args.query,
      requesterLabel,
      dailyPrompt,
      enrichedSources,
    );

    return { answer, sources: enrichedSources };
  }
}
