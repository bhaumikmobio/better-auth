import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class LlmService {
  getBaseUrl(): string {
    const value =
      process.env.OLLAMA_BASE_URL?.trim() ?? 'http://localhost:11434';
    return value.endsWith('/') ? value.slice(0, -1) : value;
  }

  async postJson<T>(path: string, payload: unknown): Promise<T> {
    const response = await fetch(`${this.getBaseUrl()}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new BadRequestException(
        `Failed calling Ollama (${response.status}): ${text || 'Unknown error'}`,
      );
    }

    return (await response.json()) as T;
  }
}
