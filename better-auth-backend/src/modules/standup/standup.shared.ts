import type { DateRange, FeedReaction } from './standup.types';

export const DEFAULT_PROMPT = 'What is your main goal today?';
export const STANDUP_SETTINGS_DOC_ID = 'standup_settings';
export const STANDUP_NOT_FOUND_MESSAGE = 'Stand-up entry not found.';
export const STANDUP_REACTION_NOT_FOUND_MESSAGE =
  'Reaction not found for this stand-up.';
export const STANDUP_HISTORY_DEFAULT_LIMIT = 50;
export const STANDUP_HISTORY_MAX_LIMIT = 100;
export const STANDUP_HISTORY_DEFAULT_OFFSET = 0;
export const STANDUP_HISTORY_DEFAULT_DAYS = 36500;

export const toTodayRange = (): DateRange => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
};

const toDayStart = (date: Date): Date => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
};

export const toDateRange = (
  from?: string,
  to?: string,
  defaultDays = STANDUP_HISTORY_DEFAULT_DAYS,
): DateRange => {
  if (!from && !to) {
    const end = toDayStart(new Date());
    end.setDate(end.getDate() + 1);
    const start = new Date(end);
    start.setDate(start.getDate() - defaultDays);
    return { start, end };
  }

  const parsedFrom = from ? new Date(from) : null;
  const parsedTo = to ? new Date(to) : null;

  const start = toDayStart(parsedFrom ?? parsedTo ?? new Date());
  const endAnchor = toDayStart(parsedTo ?? parsedFrom ?? new Date());
  const end = new Date(endAnchor);
  end.setDate(end.getDate() + 1);

  return { start, end };
};

export const toOptionalString = (value: string | undefined): string | null => {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export const groupReactions = (
  reactions: Array<{ emoji: string; userId: string }>,
  currentUserId: string,
): FeedReaction[] => {
  const grouped = new Map<string, FeedReaction>();

  for (const reaction of reactions) {
    const existing = grouped.get(reaction.emoji);
    if (existing) {
      existing.count += 1;
      existing.reactedByMe =
        existing.reactedByMe || reaction.userId === currentUserId;
      continue;
    }

    grouped.set(reaction.emoji, {
      emoji: reaction.emoji,
      count: 1,
      reactedByMe: reaction.userId === currentUserId,
    });
  }

  return Array.from(grouped.values()).sort((a, b) => b.count - a.count);
};
