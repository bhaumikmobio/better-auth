import type { ObjectId } from 'mongodb';

export type MongoStandupDoc = {
  _id: ObjectId;
  userId?: string;
  createdAt?: Date;
  yesterday?: string;
  today?: string;
  blockers?: string;
  mood?: string | null;
};

export type MongoUserDoc = {
  _id: ObjectId;
  id?: string;
  name?: string;
};

export type MongoStandupChunkDoc = {
  standupId: string;
  userId: string;
  createdAt: Date;
  content: string;
  embedding: number[];
  updatedAt: Date;
};

export type MongoSettingsDoc = {
  _id: string;
  dailyPrompt?: string;
};
