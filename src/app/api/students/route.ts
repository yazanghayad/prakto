import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/appwrite-server';
import { Query, ID } from 'node-appwrite';

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'prakto';

// GET /api/students — get student profile by userId or document id
export async function GET(request: NextRequest) {
  try {
    const { databases } = createAdminClient();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const id = searchParams.get('id');

    if (id) {
      const doc = await databases.getDocument(DATABASE_ID, 'students', id);
      return NextResponse.json({ profile: doc });
    }

    if (userId) {
      const response = await databases.listDocuments(DATABASE_ID, 'students', [
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

    const response = await databases.listDocuments(DATABASE_ID, 'students', [
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

// POST /api/students — create or update student profile
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

    const body = await request.json();
    const { action, data, studentId } = body;

    if (action === 'onboard') {
      // Full onboarding: update user profile + create student profile
      const existing = await databases.listDocuments(DATABASE_ID, 'students', [
        Query.equal('userId', userId),
        Query.limit(1)
      ]);
      if (existing.total > 0) {
        return NextResponse.json({ error: 'Du har redan en studentprofil.' }, { status: 409 });
      }

      // 1. Update user profile (displayName, email, phone, avatarUrl)
      const userUpdate: Record<string, unknown> = {
        updatedAt: new Date().toISOString()
      };
      if (data.displayName) userUpdate.displayName = data.displayName;
      if (data.email) userUpdate.email = data.email;
      if (data.phone) userUpdate.phone = data.phone;
      if (data.avatarFileId) {
        const endpoint =
          process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
        const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '';
        userUpdate.avatarUrl = `${endpoint}/storage/buckets/avatars/files/${data.avatarFileId}/view?project=${projectId}`;
      }
      await databases.updateDocument(DATABASE_ID, 'users', userId, userUpdate);

      // 2. Create student profile
      const studentPayload: Record<string, unknown> = {
        userId,
        school: data.school,
        program: data.program,
        educationLevel: data.educationLevel,
        internshipType: data.internshipType,
        city: data.city,
        skills: data.skills,
        bio: data.bio,
        placementStatus: 'searching'
      };
      if (data.linkedinUrl) studentPayload.linkedinUrl = data.linkedinUrl;
      if (data.cvFileId) studentPayload.cvFileId = data.cvFileId;

      const doc = await databases.createDocument(
        DATABASE_ID,
        'students',
        ID.unique(),
        studentPayload
      );

      return NextResponse.json({ success: true, profile: doc });
    }

    if (action === 'create') {
      // Check if student profile already exists
      const existing = await databases.listDocuments(DATABASE_ID, 'students', [
        Query.equal('userId', userId),
        Query.limit(1)
      ]);
      if (existing.total > 0) {
        return NextResponse.json({ error: 'Du har redan en studentprofil.' }, { status: 409 });
      }

      const payload: Record<string, unknown> = {
        userId,
        school: data.school,
        program: data.program,
        educationLevel: data.educationLevel,
        internshipType: data.internshipType,
        city: data.city,
        skills: data.skills,
        bio: data.bio,
        placementStatus: 'searching'
      };
      if (data.linkedinUrl) payload.linkedinUrl = data.linkedinUrl;
      if (data.cvFileId) payload.cvFileId = data.cvFileId;

      const doc = await databases.createDocument(DATABASE_ID, 'students', ID.unique(), payload);

      return NextResponse.json({ success: true, profile: doc });
    }

    if (action === 'update') {
      if (!studentId) {
        return NextResponse.json({ error: 'studentId krävs.' }, { status: 400 });
      }

      // Verify ownership
      const existingDoc = await databases.getDocument(DATABASE_ID, 'students', studentId);
      if (existingDoc.userId !== userId) {
        return NextResponse.json({ error: 'Åtkomst nekad.' }, { status: 403 });
      }

      const updatePayload: Record<string, unknown> = {};
      if (data.school !== undefined) updatePayload.school = data.school;
      if (data.program !== undefined) updatePayload.program = data.program;
      if (data.educationLevel !== undefined) updatePayload.educationLevel = data.educationLevel;
      if (data.internshipType !== undefined) updatePayload.internshipType = data.internshipType;
      if (data.city !== undefined) updatePayload.city = data.city;
      if (data.skills !== undefined) updatePayload.skills = data.skills;
      if (data.bio !== undefined) updatePayload.bio = data.bio;
      if (data.linkedinUrl !== undefined) updatePayload.linkedinUrl = data.linkedinUrl;
      if (data.cvFileId !== undefined) updatePayload.cvFileId = data.cvFileId;

      const doc = await databases.updateDocument(DATABASE_ID, 'students', studentId, updatePayload);

      return NextResponse.json({ success: true, profile: doc });
    }

    return NextResponse.json({ error: 'Ogiltig åtgärd.' }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Serverfel.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
