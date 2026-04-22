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
