export type CreateStandupDto = {
  yesterday: string;
  today: string;
  blockers: string;
  mood?: string;
};

export type CreateReactionDto = {
  emoji: string;
};

export type UpdateStandupSettingsDto = {
  dailyPrompt: string;
};

export type StandupHistoryQueryDto = {
  from?: string;
  to?: string;
  limit?: string;
  offset?: string;
};
