import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/appwrite-server';
import { ID, Query } from 'node-appwrite';

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'prakto';

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

// GET /api/notifications — list notifications for the authenticated user
export async function GET(request: NextRequest) {
  const userId = getUserIdFromCookie(request);
  if (!userId) {
    return NextResponse.json({ error: 'Ej autentiserad.' }, { status: 401 });
  }

  try {
    const { databases, users } = createAdminClient();
    await users.get(userId);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const isRead = searchParams.get('isRead');

    const queries: string[] = [
      Query.equal('recipientId', userId),
      Query.limit(limit),
      Query.offset((page - 1) * limit),
      Query.orderDesc('createdAt')
    ];

    if (isRead === 'true') queries.push(Query.equal('isRead', true));
    if (isRead === 'false') queries.push(Query.equal('isRead', false));

    const response = await databases.listDocuments(DATABASE_ID, 'notifications', queries);

    // Count unread
    const unreadResponse = await databases.listDocuments(DATABASE_ID, 'notifications', [
      Query.equal('recipientId', userId),
      Query.equal('isRead', false),
      Query.limit(1)
    ]);

    return NextResponse.json({
      total: response.total,
      unreadCount: unreadResponse.total,
      notifications: response.documents
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Serverfel';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/notifications — mark as read, mark all as read, or create (server-internal)
export async function POST(request: NextRequest) {
  const userId = getUserIdFromCookie(request);
  if (!userId) {
    return NextResponse.json({ error: 'Ej autentiserad.' }, { status: 401 });
  }

  try {
    const { databases, users } = createAdminClient();
    await users.get(userId);

    const body = await request.json();
    const { action } = body;

    if (action === 'markAsRead') {
      const { notificationId } = body;
      if (!notificationId) {
        return NextResponse.json({ error: 'notificationId krävs.' }, { status: 400 });
      }

      // Verify the notification belongs to this user
      const notification = await databases.getDocument(
        DATABASE_ID,
        'notifications',
        notificationId
      );
      if (notification.recipientId !== userId) {
        return NextResponse.json({ error: 'Åtkomst nekad.' }, { status: 403 });
      }

      await databases.updateDocument(DATABASE_ID, 'notifications', notificationId, {
        isRead: true
      });

      return NextResponse.json({ success: true });
    }

    if (action === 'markAllAsRead') {
      // Fetch all unread for this user
      const unread = await databases.listDocuments(DATABASE_ID, 'notifications', [
        Query.equal('recipientId', userId),
        Query.equal('isRead', false),
        Query.limit(100)
      ]);

      await Promise.all(
        unread.documents.map((doc) =>
          databases.updateDocument(DATABASE_ID, 'notifications', doc.$id, { isRead: true })
        )
      );

      return NextResponse.json({ success: true, updated: unread.total });
    }

    return NextResponse.json({ error: 'Okänd åtgärd.' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Serverfel';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ─── Helper: create a notification (called from other API routes) ──────────
export async function createNotification(params: {
  recipientId: string;
  type: string;
  title: string;
  message: string;
  linkUrl?: string;
}) {
  const { databases } = createAdminClient();
  try {
    await databases.createDocument(DATABASE_ID, 'notifications', ID.unique(), {
      recipientId: params.recipientId,
      type: params.type,
      title: params.title,
      message: params.message,
      linkUrl: params.linkUrl ?? '',
      isRead: false,
      createdAt: new Date().toISOString()
    });
  } catch (err) {
    // Log but don't fail the main operation
    console.error('Failed to create notification:', err);
  }
}
