import { Injectable } from '@nestjs/common';
import { UNKNOWN_USER_NAME } from '../../../common/constants/app.constants';
import type {
  ChatbotSource,
  StandupIndexSource,
} from '../interfaces/chatbot.interfaces';

@Injectable()
export class ChatbotChunkHelper {
  buildStandupChunk(standup: StandupIndexSource): string | null {
    const author = this.resolveUserLabel(standup);
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

  stripInternalIdsFromChunkText(content: string): string {
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

  resolveUserLabel(
    item: Pick<StandupIndexSource, 'userName' | 'userId'>,
  ): string {
    return item.userName?.trim() || item.userId || UNKNOWN_USER_NAME;
  }

  enrichSourceChunkIfPossible(
    source: ChatbotSource,
    standup?: StandupIndexSource,
  ): ChatbotSource {
    if (standup) {
      const chunk = this.buildStandupChunk(standup);
      return chunk ? { ...source, content: chunk } : source;
    }

    const stripped = this.stripInternalIdsFromChunkText(source.content);
    return stripped.length > 0 ? { ...source, content: stripped } : source;
  }
}
