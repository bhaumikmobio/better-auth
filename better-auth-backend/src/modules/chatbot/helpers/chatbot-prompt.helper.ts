import { Injectable } from '@nestjs/common';
import type { ChatbotSource } from '../interfaces/chatbot.interfaces';

export type ChatbotPromptMessage = {
  role: 'system' | 'user';
  content: string;
};

@Injectable()
export class ChatbotPromptHelper {
  buildPromptMessages(
    query: string,
    requesterLabel: string,
    dailyPrompt: string,
    sources: ChatbotSource[],
  ): ChatbotPromptMessage[] {
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
}
