import { Client, Account, Databases, Storage, Teams, Avatars } from 'appwrite';

// Appwrite client-side SDK singleton
// Used in client components ('use client') for auth, data fetching, file uploads

const APPWRITE_ENDPOINT =
  process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '';

let client: Client | undefined;

function getClient(): Client {
  if (!client) {
    client = new Client().setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT_ID);
  }
  return client;
}

// Singleton instances for client-side use
export const account = new Account(getClient());
export const databases = new Databases(getClient());
export const storage = new Storage(getClient());
export const teams = new Teams(getClient());
export const avatars = new Avatars(getClient());

// Re-export client for advanced use cases
export { getClient };

// Appwrite IDs — centralized so they're never hardcoded in components
export const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'prakto';

export const COLLECTION_IDS = {
  users: 'users',
  students: 'students',
  companies: 'companies',
  educationManagers: 'education_managers',
  programs: 'programs',
  internships: 'internships',
  applications: 'applications',
  bookmarks: 'bookmarks',
  notifications: 'notifications',
  conversations: 'conversations',
  messages: 'messages',
  auditLogs: 'audit_logs',
  categories: 'categories',
  blogPosts: 'blog_posts',
  portfolio: 'portfolio',
  calendarEvents: 'calendar_events',
  availability: 'availability',
  liaJournal: 'lia_journal',
  liaGoals: 'lia_goals',
  liaNotes: 'lia_notes',
  liaTime: 'lia_time',
  liaMeetings: 'lia_meetings',
  liaFeedback: 'lia_feedback',
  liaContacts: 'lia_contacts',
  aiChats: 'ai_chats'
} as const;

export const BUCKET_IDS = {
  cvs: 'cvs',
  logos: 'logos',
  documents: 'documents',
  portfolio: 'portfolio',
  avatars: 'avatars'
} as const;
