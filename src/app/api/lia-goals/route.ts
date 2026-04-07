import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/appwrite-server';
import { Query, ID } from 'node-appwrite';

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'prakto';
const COLLECTION = 'lia_goals';

export async function GET(request: NextRequest) {
  try {
    const { databases } = createAdminClient();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ items: [] });
    }

    const response = await databases.listDocuments(DATABASE_ID, COLLECTION, [
      Query.equal('userId', userId),
      Query.orderAsc('sortOrder'),
      Query.limit(100)
    ]);

    return NextResponse.json({ items: response.documents });
  } catch {
    return NextResponse.json({ error: 'Serverfel.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const sessionCookie = request.cookies.get('appwrite_session');
  if (!sessionCookie) {
    return NextResponse.json({ error: 'Ej autentiserad.' }, { status: 401 });
  }

  try {
    const { databases, users } = createAdminClient();

    const decoded = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString('utf-8'));
    const userId = decoded.id;
    if (!userId) {
      return NextResponse.json({ error: 'Ej autentiserad.' }, { status: 401 });
    }

    await users.get(userId);
    const userProfile = await databases.getDocument(DATABASE_ID, 'users', userId);
    if (userProfile.role !== 'student') {
      return NextResponse.json({ error: 'Åtkomst nekad.' }, { status: 403 });
    }

    const body = await request.json();
    const { action, data, itemId } = body;

    if (action === 'create') {
      const payload = {
        userId,
        title: data.title,
        description: data.description ?? '',
        completed: false,
        completedAt: null,
        category: data.category ?? 'Övrigt',
        sortOrder: data.sortOrder ?? 0
      };

      const doc = await databases.createDocument(DATABASE_ID, COLLECTION, ID.unique(), payload);
      return NextResponse.json({ success: true, item: doc });
    }

    if (action === 'update') {
      if (!itemId) {
        return NextResponse.json({ error: 'itemId krävs.' }, { status: 400 });
      }

      const existingDoc = await databases.getDocument(DATABASE_ID, COLLECTION, itemId);
      if (existingDoc.userId !== userId) {
        return NextResponse.json({ error: 'Åtkomst nekad.' }, { status: 403 });
      }

      const updatePayload: Record<string, unknown> = {};
      if (data.title !== undefined) updatePayload.title = data.title;
      if (data.description !== undefined) updatePayload.description = data.description;
      if (data.completed !== undefined) {
        updatePayload.completed = data.completed;
        updatePayload.completedAt = data.completed ? new Date().toISOString() : null;
      }
      if (data.category !== undefined) updatePayload.category = data.category;
      if (data.sortOrder !== undefined) updatePayload.sortOrder = data.sortOrder;

      const doc = await databases.updateDocument(DATABASE_ID, COLLECTION, itemId, updatePayload);
      return NextResponse.json({ success: true, item: doc });
    }

    if (action === 'delete') {
      if (!itemId) {
        return NextResponse.json({ error: 'itemId krävs.' }, { status: 400 });
      }

      const existingDoc = await databases.getDocument(DATABASE_ID, COLLECTION, itemId);
      if (existingDoc.userId !== userId) {
        return NextResponse.json({ error: 'Åtkomst nekad.' }, { status: 403 });
      }

      await databases.deleteDocument(DATABASE_ID, COLLECTION, itemId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Okänd åtgärd.' }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Serverfel.';
    console.error('[POST /api/lia-goals]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
