import type { Models } from 'appwrite';

export interface JournalEntryDoc extends Models.Document {
  userId: string;
  weekNumber: number;
  year: number;
  content: string;
  highlights: string[];
  challenges: string;
  learnings: string;
  mood: 'great' | 'good' | 'okay' | 'tough';
}

export interface JournalEntryPayload {
  weekNumber: number;
  year: number;
  content: string;
  highlights: string[];
  challenges: string;
  learnings: string;
  mood: 'great' | 'good' | 'okay' | 'tough';
}
