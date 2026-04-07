import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/appwrite-server';
import { ID, Query } from 'node-appwrite';

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'prakto';
const COLLECTION_ID = 'support_tickets';

function getUserIdFromCookie(request: NextRequest): string | null {
  const sessionCookie = request.cookies.get('appwrite_session');
  if (!sessionCookie) return null;
  try {
    const decoded = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString('utf-8'));
    return decoded.id || null;
  } catch {
    return null;
  }
}

// GET /api/support — list support tickets for the authenticated user
export async function GET(request: NextRequest) {
  const userId = getUserIdFromCookie(request);
  if (!userId) {
    return NextResponse.json({ error: 'Ej autentiserad.' }, { status: 401 });
  }

  try {
    const { databases } = createAdminClient();

    const response = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
      Query.equal('userId', userId),
      Query.orderDesc('$createdAt'),
      Query.limit(50)
    ]);

    return NextResponse.json({
      total: response.total,
      tickets: response.documents
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Serverfel';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/support — create a new support ticket
export async function POST(request: NextRequest) {
  const userId = getUserIdFromCookie(request);
  if (!userId) {
    return NextResponse.json({ error: 'Ej autentiserad.' }, { status: 401 });
  }

  try {
    const { databases } = createAdminClient();
    const body = await request.json();
    const { action, data } = body;

    if (action !== 'create' || !data) {
      return NextResponse.json({ error: 'Ogiltig förfrågan.' }, { status: 400 });
    }

    const { name, email, category, subject, message } = data;

    if (!subject?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'Ämne och meddelande krävs.' }, { status: 400 });
    }

    const doc = await databases.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), {
      userId,
      name: name?.trim() || '',
      email: email?.trim() || '',
      category: category || 'other',
      subject: subject.trim(),
      message: message.trim(),
      status: 'open'
    });

    return NextResponse.json({ item: doc }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Serverfel';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
