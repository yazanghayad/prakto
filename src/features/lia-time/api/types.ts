import type { Models } from 'appwrite';

export interface TimeEntryDoc extends Models.Document {
  userId: string;
  date: string; // YYYY-MM-DD
  hours: number;
  description: string;
  category: string; // 'development' | 'meeting' | 'learning' | 'other'
}

export interface TimeEntryPayload {
  date: string;
  hours: number;
  description: string;
  category: string;
}
