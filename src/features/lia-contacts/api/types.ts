import type { Models } from 'appwrite';

export interface ContactDoc extends Models.Document {
  userId: string;
  name: string;
  role: string;
  company: string;
  email: string;
  phone: string;
  notes: string;
}

export interface ContactPayload {
  name: string;
  role: string;
  company: string;
  email: string;
  phone: string;
  notes: string;
}
