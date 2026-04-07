import type { Models } from 'appwrite';

export interface LiaGoalDoc extends Models.Document {
  userId: string;
  title: string;
  description: string;
  completed: boolean;
  completedAt: string | null;
  category: string;
  sortOrder: number;
}

export interface LiaGoalPayload {
  title: string;
  description: string;
  category: string;
  sortOrder?: number;
}
