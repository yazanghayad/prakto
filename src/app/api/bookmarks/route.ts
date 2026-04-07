import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/appwrite-server';
import { Query, ID } from 'node-appwrite';

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'prakto';

// GET /api/bookmarks — list bookmarks for a student
export async function GET(request: NextRequest) {
  try {
    const { databases } = createAdminClient();
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const internshipId = searchParams.get('internshipId');

    if (!studentId) {
      return NextResponse.json({ error: 'studentId krävs.' }, { status: 400 });
    }

    const queries = [Query.equal('studentId', studentId), Query.orderDesc('createdAt')];

    // Check if a specific internship is bookmarked
    if (internshipId) {
      queries.push(Query.equal('internshipId', internshipId));
      queries.push(Query.limit(1));
      const response = await databases.listDocuments(DATABASE_ID, 'bookmarks', queries);
      return NextResponse.json({
        isBookmarked: response.total > 0,
        bookmark: response.documents[0] ?? null
      });
    }

    // List all bookmarks
    const limit = Number(searchParams.get('limit') ?? 100);
    queries.push(Query.limit(limit));
    const response = await databases.listDocuments(DATABASE_ID, 'bookmarks', queries);

    // Enrich with internship data
    const internshipIds = [...new Set(response.documents.map((d) => d.internshipId as string))];

    let internshipMap = new Map<string, Record<string, unknown>>();
    if (internshipIds.length > 0) {
      // Batch fetch internships (max 100 per query)
      const batches = [];
      for (let i = 0; i < internshipIds.length; i += 100) {
        batches.push(internshipIds.slice(i, i + 100));
      }
      const results = await Promise.all(
        batches.map((batch) =>
          databases.listDocuments(DATABASE_ID, 'internships', [
            Query.equal('$id', batch),
            Query.limit(100)
          ])
        )
      );
      for (const result of results) {
        for (const doc of result.documents) {
          internshipMap.set(doc.$id, doc);
        }
      }
    }

    // Enrich with company names
    const companyIds = [
      ...new Set([...internshipMap.values()].map((i) => i.companyId as string).filter(Boolean))
    ];
    let companyMap = new Map<string, string>();
    if (companyIds.length > 0) {
      const companyResult = await databases.listDocuments(DATABASE_ID, 'companies', [
        Query.equal('$id', companyIds),
        Query.limit(100)
      ]);
      for (const doc of companyResult.documents) {
        companyMap.set(doc.$id, doc.companyName as string);
      }
    }

    const bookmarks = response.documents.map((doc) => {
      const internship = internshipMap.get(doc.internshipId as string);
      return {
        ...doc,
        internship: internship
          ? {
              ...internship,
              companyName: companyMap.get(internship.companyId as string) ?? ''
            }
          : null
      };
    });

    return NextResponse.json({ total: response.total, bookmarks });
  } catch {
    return NextResponse.json({ error: 'Serverfel.' }, { status: 500 });
  }
}

// POST /api/bookmarks — toggle bookmark (create or delete)
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

    // Verify student role
    await users.get(userId);
    const userProfile = await databases.getDocument(DATABASE_ID, 'users', userId);
    if (userProfile.role !== 'student') {
      return NextResponse.json({ error: 'Åtkomst nekad.' }, { status: 403 });
    }

    const body = await request.json();
    const { internshipId } = body;

    if (!internshipId) {
      return NextResponse.json({ error: 'internshipId krävs.' }, { status: 400 });
    }

    // Check if bookmark already exists
    const existing = await databases.listDocuments(DATABASE_ID, 'bookmarks', [
      Query.equal('studentId', userId),
      Query.equal('internshipId', internshipId),
      Query.limit(1)
    ]);

    if (existing.total > 0) {
      // Remove bookmark
      await databases.deleteDocument(DATABASE_ID, 'bookmarks', existing.documents[0].$id);
      return NextResponse.json({ action: 'removed', isBookmarked: false });
    }

    // Create bookmark
    const doc = await databases.createDocument(DATABASE_ID, 'bookmarks', ID.unique(), {
      studentId: userId,
      internshipId,
      createdAt: new Date().toISOString()
    });

    return NextResponse.json({ action: 'added', isBookmarked: true, bookmark: doc });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Serverfel.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
