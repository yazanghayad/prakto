import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/appwrite-server';
import { Query, ID } from 'node-appwrite';

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'prakto';

// GET /api/portfolio — get portfolio items by userId or single item by id
export async function GET(request: NextRequest) {
  try {
    const { databases } = createAdminClient();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const id = searchParams.get('id');

    if (id) {
      const doc = await databases.getDocument(DATABASE_ID, 'portfolio', id);
      return NextResponse.json({ item: doc });
    }

    if (userId) {
      const response = await databases.listDocuments(DATABASE_ID, 'portfolio', [
        Query.equal('userId', userId),
        Query.orderDesc('$createdAt'),
        Query.limit(50)
      ]);
      return NextResponse.json({ items: response.documents });
    }

    return NextResponse.json({ items: [] });
  } catch {
    return NextResponse.json({ error: 'Serverfel.' }, { status: 500 });
  }
}

// POST /api/portfolio — create, update, or delete portfolio items
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

    // Verify user exists and has student role
    await users.get(userId);
    const userProfile = await databases.getDocument(DATABASE_ID, 'users', userId);

    if (userProfile.role !== 'student') {
      return NextResponse.json({ error: 'Åtkomst nekad.' }, { status: 403 });
    }

    // Get student profile ID
    const studentDocs = await databases.listDocuments(DATABASE_ID, 'students', [
      Query.equal('userId', userId),
      Query.limit(1)
    ]);
    const studentId = studentDocs.total > 0 ? studentDocs.documents[0].$id : '';

    const body = await request.json();
    const { action, data, itemId } = body;

    if (action === 'create') {
      const payload: Record<string, unknown> = {
        userId,
        studentId,
        title: data.title,
        description: data.description,
        type: data.type
      };
      if (data.projectUrl) payload.projectUrl = data.projectUrl;
      if (data.githubUrl) payload.githubUrl = data.githubUrl;
      if (data.fileIds) payload.fileIds = data.fileIds;
      if (data.tags) payload.tags = data.tags;

      const doc = await databases.createDocument(DATABASE_ID, 'portfolio', ID.unique(), payload);
      return NextResponse.json({ success: true, item: doc });
    }

    if (action === 'update') {
      if (!itemId) {
        return NextResponse.json({ error: 'itemId krävs.' }, { status: 400 });
      }

      // Verify ownership
      const existingDoc = await databases.getDocument(DATABASE_ID, 'portfolio', itemId);
      if (existingDoc.userId !== userId) {
        return NextResponse.json({ error: 'Åtkomst nekad.' }, { status: 403 });
      }

      const updatePayload: Record<string, unknown> = {};
      if (data.title !== undefined) updatePayload.title = data.title;
      if (data.description !== undefined) updatePayload.description = data.description;
      if (data.type !== undefined) updatePayload.type = data.type;
      if (data.projectUrl !== undefined) updatePayload.projectUrl = data.projectUrl;
      if (data.githubUrl !== undefined) updatePayload.githubUrl = data.githubUrl;
      if (data.fileIds !== undefined) updatePayload.fileIds = data.fileIds;
      if (data.tags !== undefined) updatePayload.tags = data.tags;

      const doc = await databases.updateDocument(DATABASE_ID, 'portfolio', itemId, updatePayload);
      return NextResponse.json({ success: true, item: doc });
    }

    if (action === 'delete') {
      if (!itemId) {
        return NextResponse.json({ error: 'itemId krävs.' }, { status: 400 });
      }

      // Verify ownership
      const existingDoc = await databases.getDocument(DATABASE_ID, 'portfolio', itemId);
      if (existingDoc.userId !== userId) {
        return NextResponse.json({ error: 'Åtkomst nekad.' }, { status: 403 });
      }

      await databases.deleteDocument(DATABASE_ID, 'portfolio', itemId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Ogiltig åtgärd.' }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Serverfel.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
