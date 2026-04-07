import type { Models } from 'appwrite';

export interface LiaNoteDoc extends Models.Document {
  userId: string;
  title: string;
  content: string;
  pinned: boolean;
}

export interface LiaNotePayload {
  title: string;
  content: string;
}
