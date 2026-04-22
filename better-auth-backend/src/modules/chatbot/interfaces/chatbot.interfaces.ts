export type ChatbotAskArgs = {
  userId: string;
  requesterName?: string | null;
  query: string;
  topK?: number;
};

export type ChatbotSource = {
  standupId: string;
  userId: string;
  createdAt: Date;
  content: string;
  score: number;
};

export type ChatbotAnswerResult = {
  answer: string;
  sources: ChatbotSource[];
};

export type ChatbotReindexResult = {
  processed: number;
  indexed: number;
  skipped: number;
};

export type StandupIndexSource = {
  standupId: string;
  userId: string;
  userName: string;
  createdAt: Date;
  yesterday: string;
  today: string;
  blockers: string;
  mood: string | null;
};

export type StandupChunkUpsert = {
  standupId: string;
  userId: string;
  createdAt: Date;
  content: string;
  embedding: number[];
};

export interface ChatbotStore {
  ensureVectorIndex(): Promise<void>;
  getStandupDailyPrompt(): Promise<string>;
  listStandupsForIndexing(limit?: number): Promise<StandupIndexSource[]>;
  findStandupForIndexing(standupId: string): Promise<StandupIndexSource | null>;
  upsertStandupChunk(payload: StandupChunkUpsert): Promise<void>;
  searchSimilarChunks(
    embedding: number[],
    limit: number,
  ): Promise<ChatbotSource[]>;
}
