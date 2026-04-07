import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/appwrite-server';
import { Query, ID } from 'node-appwrite';

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'prakto';

// GET /api/calendar/availability — get availability slots for a user
export async function GET(request: NextRequest) {
  try {
    const { databases } = createAdminClient();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ slots: [] });
    }

    const response = await databases.listDocuments(DATABASE_ID, 'availability', [
      Query.equal('userId', userId),
      Query.limit(50)
    ]);

    return NextResponse.json({ slots: response.documents });
  } catch {
    return NextResponse.json({ error: 'Serverfel.' }, { status: 500 });
  }
}

// POST /api/calendar/availability — set availability slots (replace all)
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

    const body = await request.json();
    const { slots } = body;

    if (!Array.isArray(slots)) {
      return NextResponse.json({ error: 'slots måste vara en array.' }, { status: 400 });
    }

    // Delete existing availability for this user
    const existing = await databases.listDocuments(DATABASE_ID, 'availability', [
      Query.equal('userId', userId),
      Query.limit(100)
    ]);

    for (const doc of existing.documents) {
      await databases.deleteDocument(DATABASE_ID, 'availability', doc.$id);
    }

    // Create new slots
    const created = [];
    for (const slot of slots) {
      const doc = await databases.createDocument(DATABASE_ID, 'availability', ID.unique(), {
        userId,
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        isRecurring: slot.isRecurring ?? true
      });
      created.push(doc);
    }

    return NextResponse.json({ success: true, slots: created });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Serverfel.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
