import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/appwrite-server';
import { Query, ID } from 'node-appwrite';

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'prakto';

// GET /api/calendar — get events by userId, optionally filtered by date range
export async function GET(request: NextRequest) {
  try {
    const { databases } = createAdminClient();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const id = searchParams.get('id');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    if (id) {
      const doc = await databases.getDocument(DATABASE_ID, 'calendar_events', id);
      return NextResponse.json({ event: doc });
    }

    if (userId) {
      const queries = [
        Query.equal('userId', userId),
        Query.orderAsc('startTime'),
        Query.limit(100)
      ];
      if (from) queries.push(Query.greaterThanEqual('startTime', from));
      if (to) queries.push(Query.lessThanEqual('startTime', to));

      const response = await databases.listDocuments(DATABASE_ID, 'calendar_events', queries);
      return NextResponse.json({ events: response.documents });
    }

    return NextResponse.json({ events: [] });
  } catch {
    return NextResponse.json({ error: 'Serverfel.' }, { status: 500 });
  }
}

// POST /api/calendar — create, update, or delete calendar events
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
    const { action, data, eventId } = body;

    if (action === 'create') {
      const payload: Record<string, unknown> = {
        userId,
        title: data.title,
        startTime: data.startTime,
        endTime: data.endTime,
        type: data.type,
        status: 'scheduled'
      };
      if (data.description) payload.description = data.description;
      if (data.location) payload.location = data.location;
      if (data.meetingUrl) payload.meetingUrl = data.meetingUrl;
      if (data.relatedId) payload.relatedId = data.relatedId;

      const doc = await databases.createDocument(
        DATABASE_ID,
        'calendar_events',
        ID.unique(),
        payload
      );
      return NextResponse.json({ success: true, event: doc });
    }

    if (action === 'update') {
      if (!eventId) {
        return NextResponse.json({ error: 'eventId krävs.' }, { status: 400 });
      }

      const existingDoc = await databases.getDocument(DATABASE_ID, 'calendar_events', eventId);
      if (existingDoc.userId !== userId) {
        return NextResponse.json({ error: 'Åtkomst nekad.' }, { status: 403 });
      }

      const updatePayload: Record<string, unknown> = {};
      if (data.title !== undefined) updatePayload.title = data.title;
      if (data.description !== undefined) updatePayload.description = data.description;
      if (data.startTime !== undefined) updatePayload.startTime = data.startTime;
      if (data.endTime !== undefined) updatePayload.endTime = data.endTime;
      if (data.type !== undefined) updatePayload.type = data.type;
      if (data.status !== undefined) updatePayload.status = data.status;
      if (data.location !== undefined) updatePayload.location = data.location;
      if (data.meetingUrl !== undefined) updatePayload.meetingUrl = data.meetingUrl;

      const doc = await databases.updateDocument(
        DATABASE_ID,
        'calendar_events',
        eventId,
        updatePayload
      );
      return NextResponse.json({ success: true, event: doc });
    }

    if (action === 'delete') {
      if (!eventId) {
        return NextResponse.json({ error: 'eventId krävs.' }, { status: 400 });
      }

      const existingDoc = await databases.getDocument(DATABASE_ID, 'calendar_events', eventId);
      if (existingDoc.userId !== userId) {
        return NextResponse.json({ error: 'Åtkomst nekad.' }, { status: 403 });
      }

      await databases.deleteDocument(DATABASE_ID, 'calendar_events', eventId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Ogiltig åtgärd.' }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Serverfel.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
