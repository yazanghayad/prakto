import { Client, Databases, Users, Storage, Teams, Account } from 'node-appwrite';
import { cookies } from 'next/headers';

// Appwrite server-side SDK
// Used in server components, API routes, and middleware
// Requires APPWRITE_API_KEY (never expose to client)

const APPWRITE_ENDPOINT =
  process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '';
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY || '';

export function createAdminClient() {
  const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID)
    .setKey(APPWRITE_API_KEY);

  return {
    account: new Account(client),
    databases: new Databases(client),
    users: new Users(client),
    storage: new Storage(client),
    teams: new Teams(client),
    client
  };
}

export function createSessionClient(session: string) {
  const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID)
    .setSession(session);

  return {
    databases: new Databases(client),
    storage: new Storage(client),
    teams: new Teams(client)
  };
}

/**
 * Get the authenticated user's ID and role from the session cookie.
 * Safe to call from server components and API routes.
 * Returns null if not authenticated.
 */
export async function getServerUser(): Promise<{
  userId: string;
  role: string;
} | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('appwrite_session');
    if (!sessionCookie) return null;

    const decoded = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString('utf-8'));
    const userId = decoded.id as string | undefined;
    if (!userId) return null;

    const { databases } = createAdminClient();
    const userDoc = await databases.getDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'prakto',
      'users',
      userId
    );

    return { userId, role: userDoc.role as string };
  } catch {
    return null;
  }
}
