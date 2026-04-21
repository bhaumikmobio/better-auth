import { BadRequestException, Injectable } from '@nestjs/common';
import { OllamaService } from '../../../integrations/ollama/ollama.service';

type OllamaChatResponse = {
  message?: {
    content?: string;
  };
};

@Injectable()
export class ChatbotLlmService {
  constructor(private readonly ollamaService: OllamaService) {}

  getChatModel(): string {
    return process.env.OLLAMA_CHAT_MODEL?.trim() || 'llama3';
  }

  async generate(
    messages: Array<{ role: 'system' | 'user'; content: string }>,
  ) {
    const payload = await this.ollamaService.postJson<OllamaChatResponse>(
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
