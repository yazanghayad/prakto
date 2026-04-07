import type { Models } from 'appwrite';

export interface FeedbackDoc extends Models.Document {
  userId: string;
  date: string; // YYYY-MM-DD
  from: string; // person who gave feedback
  type: 'positive' | 'improvement';
  content: string;
  category: string; // 'technical' | 'communication' | 'teamwork' | 'other'
}

export interface FeedbackPayload {
  date: string;
  from: string;
  type: 'positive' | 'improvement';
  content: string;
  category: string;
}
