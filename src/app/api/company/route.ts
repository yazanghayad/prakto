import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/appwrite-server';
import { Query, ID } from 'node-appwrite';

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'prakto';

// GET /api/company — get company profile by userId or document id
export async function GET(request: NextRequest) {
  try {
    const { databases } = createAdminClient();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const id = searchParams.get('id');

    if (id) {
      // Fetch by document ID
      const doc = await databases.getDocument(DATABASE_ID, 'companies', id);
      return NextResponse.json({ profile: doc });
    }

    if (userId) {
      // Fetch by userId
      const response = await databases.listDocuments(DATABASE_ID, 'companies', [
        Query.equal('userId', userId),
        Query.limit(1)
      ]);

      if (response.total === 0) {
        return NextResponse.json({ profile: null });
      }

      return NextResponse.json({ profile: response.documents[0] });
    }

    // Fallback: use session cookie
    const sessionCookie = request.cookies.get('appwrite_session');
    if (!sessionCookie) {
      return NextResponse.json({ profile: null });
    }

    const decoded = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString('utf-8'));
    const sessionUserId = decoded.id;
    if (!sessionUserId) {
      return NextResponse.json({ profile: null });
    }

    const response = await databases.listDocuments(DATABASE_ID, 'companies', [
      Query.equal('userId', sessionUserId),
      Query.limit(1)
    ]);

    if (response.total === 0) {
      return NextResponse.json({ profile: null });
    }

    return NextResponse.json({ profile: response.documents[0] });
  } catch {
    return NextResponse.json({ error: 'Serverfel.' }, { status: 500 });
  }
}

// POST /api/company — create or update company profile (server-side, bypasses permissions)
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

    // Verify user exists and has company role
    await users.get(userId);
    const userProfile = await databases.getDocument(DATABASE_ID, 'users', userId);

    if (userProfile.role !== 'company') {
      return NextResponse.json({ error: 'Åtkomst nekad.' }, { status: 403 });
    }

    const body = await request.json();
    const { action, data, companyId } = body;

    if (action === 'create') {
      // Check if a company profile already exists for this user
      const existing = await databases.listDocuments(DATABASE_ID, 'companies', [
        Query.equal('userId', userId),
        Query.limit(1)
      ]);
      if (existing.total > 0) {
        return NextResponse.json({ error: 'Du har redan en företagsprofil.' }, { status: 409 });
      }

      const payload: Record<string, unknown> = {
        userId,
        companyName: data.companyName,
        orgNumber: data.orgNumber,
        industry: data.industry,
        description: data.description || '',
        city: data.city,
        contactEmail: data.contactEmail,
        approvalStatus: 'pending'
      };
      // Only include optional URL/string fields when they have a value
      if (data.website) payload.website = data.website;
      if (data.contactPhone) payload.contactPhone = data.contactPhone;

      const doc = await databases.createDocument(DATABASE_ID, 'companies', ID.unique(), payload);

      return NextResponse.json({ success: true, profile: doc });
    }

    if (action === 'update') {
      if (!companyId) {
        return NextResponse.json({ error: 'companyId krävs.' }, { status: 400 });
      }

      // Verify ownership
      const existing = await databases.getDocument(DATABASE_ID, 'companies', companyId);

      if (existing.userId !== userId) {
        return NextResponse.json({ error: 'Åtkomst nekad.' }, { status: 403 });
      }

      const doc = await databases.updateDocument(DATABASE_ID, 'companies', companyId, data);

      return NextResponse.json({ success: true, profile: doc });
    }

    return NextResponse.json({ error: 'Okänd åtgärd.' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Serverfel';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
