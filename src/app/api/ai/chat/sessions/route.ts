import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/appwrite-server';
import { DATABASE_ID, COLLECTION_IDS } from '@/lib/appwrite';
import { ID, Query } from 'node-appwrite';

function getSessionUserId(request: NextRequest): string | null {
  const sessionCookie = request.cookies.get('appwrite_session');
  if (!sessionCookie) return null;
  try {
    const decoded = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString('utf-8'));
    return (decoded.id as string) || null;
  } catch {
    return null;
  }
}

// GET /api/ai/chat/sessions — list user's chat sessions
// GET /api/ai/chat/sessions?id=xxx — get a single session
export async function GET(request: NextRequest) {
  const userId = getSessionUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Ej autentiserad.' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('id');

  try {
    const { databases } = createAdminClient();

    if (sessionId) {
      const doc = await databases.getDocument(DATABASE_ID, COLLECTION_IDS.aiChats, sessionId);
      if (doc.userId !== userId) {
        return NextResponse.json({ error: 'Ej behörig.' }, { status: 403 });
      }
      return NextResponse.json({
        session: {
          id: doc.$id,
          title: doc.title,
          messages: JSON.parse(doc.messages as string),
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt
        }
      });
    }

    // List sessions (newest first, max 25)
    const result = await databases.listDocuments(DATABASE_ID, COLLECTION_IDS.aiChats, [
      Query.equal('userId', userId),
      Query.orderDesc('updatedAt'),
      Query.limit(25)
    ]);

    const sessions = result.documents.map((doc) => ({
      id: doc.$id,
      title: doc.title,
      messageCount: JSON.parse(doc.messages as string).length,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    }));

    return NextResponse.json({ sessions });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Kunde inte hämta sessioner.';
    console.error('[GET /api/ai/chat/sessions]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/ai/chat/sessions — create or update a chat session
export async function POST(request: NextRequest) {
  const userId = getSessionUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Ej autentiserad.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, sessionId, messages, title } = body as {
      action: 'create' | 'update';
      sessionId?: string;
      messages: { role: string; content: string; timestamp: string }[];
      title?: string;
    };

    const { databases } = createAdminClient();
    const now = new Date().toISOString();

    if (action === 'create') {
      const autoTitle = title || messages[0]?.content.slice(0, 100) || 'Ny chatt';
      const doc = await databases.createDocument(DATABASE_ID, COLLECTION_IDS.aiChats, ID.unique(), {
        userId,
        title: autoTitle,
        messages: JSON.stringify(messages),
        createdAt: now,
        updatedAt: now
      });
      return NextResponse.json({
        session: { id: doc.$id, title: autoTitle, createdAt: now }
      });
    }

    if (action === 'update' && sessionId) {
      // Verify ownership
      const existing = await databases.getDocument(DATABASE_ID, COLLECTION_IDS.aiChats, sessionId);
      if (existing.userId !== userId) {
        return NextResponse.json({ error: 'Ej behörig.' }, { status: 403 });
      }

      await databases.updateDocument(DATABASE_ID, COLLECTION_IDS.aiChats, sessionId, {
        messages: JSON.stringify(messages),
        updatedAt: now
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Okänd åtgärd.' }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Kunde inte spara session.';
    console.error('[POST /api/ai/chat/sessions]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/ai/chat/sessions?id=xxx — delete a chat session
export async function DELETE(request: NextRequest) {
  const userId = getSessionUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Ej autentiserad.' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('id');
  if (!sessionId) {
    return NextResponse.json({ error: 'Session-ID saknas.' }, { status: 400 });
  }

  try {
    const { databases } = createAdminClient();

    const doc = await databases.getDocument(DATABASE_ID, COLLECTION_IDS.aiChats, sessionId);
    if (doc.userId !== userId) {
      return NextResponse.json({ error: 'Ej behörig.' }, { status: 403 });
    }

    await databases.deleteDocument(DATABASE_ID, COLLECTION_IDS.aiChats, sessionId);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Kunde inte radera session.';
    console.error('[DELETE /api/ai/chat/sessions]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
