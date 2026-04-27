import { Injectable } from '@nestjs/common';
import type {
  ChatbotSource,
  StandupIndexSource,
} from './interfaces/chatbot.interfaces';
import {
  ChatbotPromptHelper,
  type ChatbotPromptMessage,
} from './helpers/chatbot-prompt.helper';
import { ChatbotChunkHelper } from './helpers/chatbot-chunk.helper';
import { ChatbotSourceHelper } from './helpers/chatbot-source.helper';
import { ChatbotDirectAnswerHelper } from './helpers/chatbot-direct-answer.helper';

@Injectable()
export class ChatbotHelper {
  constructor(
    private readonly chunkHelper: ChatbotChunkHelper,
    private readonly sourceHelper: ChatbotSourceHelper,
    private readonly promptHelper: ChatbotPromptHelper,
    private readonly directAnswerHelper: ChatbotDirectAnswerHelper,
  ) {}

  buildStandupChunk(standup: StandupIndexSource): string | null {
    return this.chunkHelper.buildStandupChunk(standup);
  }

  enrichSourcesForPrompt(
    sources: ChatbotSource[],
    standups: StandupIndexSource[],
  ): ChatbotSource[] {
    return this.sourceHelper.enrichSourcesForPrompt(sources, standups);
  }

  buildFallbackSources(
    query: string,
    standups: StandupIndexSource[],
    limit: number,
  ): ChatbotSource[] {
    return this.sourceHelper.buildFallbackSources(query, standups, limit);
  }

  buildDirectAnswer(
    query: string,
    standups: StandupIndexSource[],
    dailyPrompt: string,
  ): string | null {
    return this.directAnswerHelper.buildDirectAnswer(
      query,
      standups,
      dailyPrompt,
    );
  }

  buildPromptMessages(
    query: string,
    requesterLabel: string,
    dailyPrompt: string,
    sources: ChatbotSource[],
  ): ChatbotPromptMessage[] {
    return this.promptHelper.buildPromptMessages(
      query,
      requesterLabel,
      dailyPrompt,
      sources,
    );
  }

  resolveRequesterLabel(name?: string | null): string {
    return this.promptHelper.resolveRequesterLabel(name);
  }
}
