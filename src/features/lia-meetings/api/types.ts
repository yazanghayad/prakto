import type { Models } from 'appwrite';

export interface MentorMeetingDoc extends Models.Document {
  userId: string;
  date: string; // YYYY-MM-DD
  summary: string;
  feedback: string;
  actions: string; // comma-separated or free text
  nextSteps: string;
}

export interface MentorMeetingPayload {
  date: string;
  summary: string;
  feedback: string;
  actions: string;
  nextSteps: string;
}
