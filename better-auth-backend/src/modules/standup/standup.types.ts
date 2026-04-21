export type DateRange = {
  start: Date;
  end: Date;
};

export type FeedReaction = {
  emoji: string;
  count: number;
  reactedByMe: boolean;
};

export type FeedStandup = {
  id: string;
  createdAt: Date;
  yesterday: string;
  today: string;
  blockers: string;
  mood: string | null;
  user: {
    id: string;
    name: string;
  };
  reactions: FeedReaction[];
};

export type SubmitStandupArgs = {
  userId: string;
  yesterday: string;
  today: string;
  blockers: string;
  mood?: string;
};

export type AddReactionArgs = {
  standupId: string;
  userId: string;
  emoji: string;
};

export type RemoveReactionArgs = AddReactionArgs;

export type StandupCreateResult = {
  id: string;
  createdAt: Date;
};

export type SettingsResult = {
  dailyPrompt: string;
  updatedAt: Date;
};

export type AdminSummary = {
  totalCount: number;
  blockers: Array<{
    standupId: string;
    blockers: string;
    createdAt: Date;
    user: {
      id: string;
      name: string;
    };
  }>;
};

export type StandupFeedResult = {
  dailyPrompt: string;
  hasSubmittedToday: boolean;
  standups: FeedStandup[];
};

export interface StandupStore {
  submitStandup(args: SubmitStandupArgs): Promise<StandupCreateResult>;
  getDailyPrompt(): Promise<string>;
  getTodayFeed(currentUserId: string): Promise<StandupFeedResult>;
  getTodayAdminSummary(): Promise<AdminSummary>;
  updateSettings(dailyPrompt: string): Promise<SettingsResult>;
  addReaction(args: AddReactionArgs): Promise<void>;
  removeReaction(args: RemoveReactionArgs): Promise<void>;
}
