import { BadRequestException, Injectable } from '@nestjs/common';
import { LlmService } from '../../../integrations/llm/llm.service';

type OllamaChatResponse = {
  message?: {
    content?: string;
  };
};

@Injectable()
export class ChatbotLlmService {
  constructor(private readonly llmService: LlmService) {}

  getChatModel(): string {
    return process.env.OLLAMA_CHAT_MODEL?.trim() || 'llama3';
  }

  async generate(
    messages: Array<{ role: 'system' | 'user'; content: string }>,
  ) {
    const payload = await this.llmService.postJson<OllamaChatResponse>(
      '/api/chat',
      {
        model: this.getChatModel(),
        stream: false,
        messages,
      },
    );

    const content = payload.message?.content;
    if (typeof content !== 'string' || content.trim().length === 0) {
      throw new BadRequestException('Ollama chat response was empty.');
    }

    return content.trim();
  }
}
