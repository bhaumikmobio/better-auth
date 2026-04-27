import { BadRequestException, Injectable } from '@nestjs/common';
import { resolveDatabaseProvider } from '../../../config/database.config';

@Injectable()
export class ChatbotValidationService {
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

  assertMongoProvider(): void {
    if (resolveDatabaseProvider() !== 'mongodb') {
      throw new BadRequestException(
        'Chatbot vector search is available only when DATABASE=mongodb.',
      );
    }
  }
}
