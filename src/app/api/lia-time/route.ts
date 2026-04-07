import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/appwrite-server';
import { Query, ID } from 'node-appwrite';

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'prakto';
const COLLECTION = 'lia_time';

export async function GET(request: NextRequest) {
  try {
    const { databases } = createAdminClient();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) return NextResponse.json({ items: [] });

    const response = await databases.listDocuments(DATABASE_ID, COLLECTION, [
      Query.equal('userId', userId),
      Query.orderDesc('date'),
      Query.limit(500)
    ]);

    return NextResponse.json({ items: response.documents });
  } catch {
    return NextResponse.json({ error: 'Serverfel.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const sessionCookie = request.cookies.get('appwrite_session');
  if (!sessionCookie) return NextResponse.json({ error: 'Ej autentiserad.' }, { status: 401 });

  try {
    const { databases, users } = createAdminClient();
    const decoded = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString('utf-8'));
    const userId = decoded.id;
    if (!userId) return NextResponse.json({ error: 'Ej autentiserad.' }, { status: 401 });

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
        date: data.date,
        hours: Number(data.hours),
        description: data.description ?? '',
        category: data.category ?? 'other'
      };
      const doc = await databases.createDocument(DATABASE_ID, COLLECTION, ID.unique(), payload);
      return NextResponse.json({ success: true, item: doc });
    }

    if (action === 'update') {
      if (!itemId) return NextResponse.json({ error: 'itemId krävs.' }, { status: 400 });
      const existing = await databases.getDocument(DATABASE_ID, COLLECTION, itemId);
      if (existing.userId !== userId)
        return NextResponse.json({ error: 'Åtkomst nekad.' }, { status: 403 });

      const u: Record<string, unknown> = {};
      if (data.date !== undefined) u.date = data.date;
      if (data.hours !== undefined) u.hours = Number(data.hours);
      if (data.description !== undefined) u.description = data.description;
      if (data.category !== undefined) u.category = data.category;

      const doc = await databases.updateDocument(DATABASE_ID, COLLECTION, itemId, u);
      return NextResponse.json({ success: true, item: doc });
    }

    if (action === 'delete') {
      if (!itemId) return NextResponse.json({ error: 'itemId krävs.' }, { status: 400 });
      const existing = await databases.getDocument(DATABASE_ID, COLLECTION, itemId);
      if (existing.userId !== userId)
        return NextResponse.json({ error: 'Åtkomst nekad.' }, { status: 403 });
      await databases.deleteDocument(DATABASE_ID, COLLECTION, itemId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Okänd åtgärd.' }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Serverfel.';
    console.error('[POST /api/lia-time]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
