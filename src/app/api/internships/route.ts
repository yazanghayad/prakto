import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/appwrite-server';
import { Query, ID } from 'node-appwrite';

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'prakto';

// GET /api/internships — list internships (server-side, admin SDK)
export async function GET(request: NextRequest) {
  try {
    const { databases } = createAdminClient();
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const search = searchParams.get('search') || '';
    const field = searchParams.get('field') || '';
    const city = searchParams.get('city') || '';
    const internshipType = searchParams.get('internshipType') || '';
    const status = searchParams.get('status') || '';
    const companyId = searchParams.get('companyId') || '';
    const sort = searchParams.get('sort') || '';
    const id = searchParams.get('id') || '';

    // Single document fetch
    if (id) {
      const doc = await databases.getDocument(DATABASE_ID, 'internships', id);
      return NextResponse.json({ internship: doc });
    }

    // List with filters
    const queries: string[] = [];
    queries.push(Query.limit(limit));
    queries.push(Query.offset((page - 1) * limit));

    if (search) queries.push(Query.search('title', search));
    if (field) queries.push(Query.equal('field', field));
    if (city) queries.push(Query.equal('city', city));
    if (internshipType) queries.push(Query.equal('internshipType', internshipType));

    if (status) {
      queries.push(Query.equal('status', status));
    } else if (!companyId) {
      // Public view: only show published
      queries.push(Query.equal('status', 'published'));
    } else {
      // companyId provided — verify ownership via session before showing all statuses
      const sessionCookie = request.cookies.get('appwrite_session');
      let isOwner = false;
      if (sessionCookie) {
        try {
          const decoded = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString('utf-8'));
          const sessionUserId = decoded.id;
          if (sessionUserId) {
            const company = await databases.getDocument(DATABASE_ID, 'companies', companyId);
            isOwner = company.userId === sessionUserId;
          }
        } catch {
          // ignore decode errors
        }
      }
      if (!isOwner) {
        // Non-owner can only see published
        queries.push(Query.equal('status', 'published'));
      }
    }

    if (companyId) queries.push(Query.equal('companyId', companyId));

    if (sort) {
      const [sortField, dir] = sort.split('.');
      if (sortField && dir) {
        queries.push(dir === 'desc' ? Query.orderDesc(sortField) : Query.orderAsc(sortField));
      }
    } else {
      queries.push(Query.orderDesc('createdAt'));
    }

    const response = await databases.listDocuments(DATABASE_ID, 'internships', queries);

    return NextResponse.json({
      total: response.total,
      internships: response.documents
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Serverfel';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/internships — create, update, or delete internships (server-side)
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
    const { action, data, internshipId, companyId } = body;

    if (action === 'create') {
      if (!companyId) {
        return NextResponse.json({ error: 'companyId krävs.' }, { status: 400 });
      }

      // Verify the company belongs to the user
      const company = await databases.getDocument(DATABASE_ID, 'companies', companyId);
      if (company.userId !== userId) {
        return NextResponse.json({ error: 'Åtkomst nekad.' }, { status: 403 });
      }

      const now = new Date().toISOString();
      const payload: Record<string, unknown> = {
        companyId,
        title: data.title,
        description: data.description,
        field: data.field,
        internshipType: data.internshipType,
        city: data.city,
        workplaceType: data.workplaceType ?? 'on_site',
        spots: typeof data.spots === 'string' ? parseInt(data.spots, 10) : (data.spots ?? 1),
        applicationMethod: data.applicationMethod ?? 'platform',
        status: 'published',
        createdAt: now,
        updatedAt: now
      };
      // Only include optional fields when they have a value
      if (data.contactEmail) payload.contactEmail = data.contactEmail;
      if (data.responsibilities) payload.responsibilities = data.responsibilities;
      if (data.requirements) payload.requirements = data.requirements;
      if (data.preferredQualifications)
        payload.preferredQualifications = data.preferredQualifications;
      if (data.duration) payload.duration = data.duration;
      if (data.startDate) payload.startDate = new Date(data.startDate).toISOString();
      if (data.applicationDeadline)
        payload.applicationDeadline = new Date(data.applicationDeadline).toISOString();
      if (data.cvRequired !== undefined) payload.cvRequired = data.cvRequired;
      if (data.coverLetterRequired !== undefined)
        payload.coverLetterRequired = data.coverLetterRequired;
      if (data.screeningQuestions?.length) payload.screeningQuestions = data.screeningQuestions;
      if (data.educationLevel) payload.educationLevel = data.educationLevel;
      if (data.rejectionMessage) payload.rejectionMessage = data.rejectionMessage;

      const doc = await databases.createDocument(DATABASE_ID, 'internships', ID.unique(), payload);

      return NextResponse.json({ success: true, internship: doc });
    }

    if (action === 'update') {
      if (!internshipId) {
        return NextResponse.json({ error: 'internshipId krävs.' }, { status: 400 });
      }

      // Verify ownership through company
      const internship = await databases.getDocument(DATABASE_ID, 'internships', internshipId);
      const company = await databases.getDocument(
        DATABASE_ID,
        'companies',
        internship.companyId as string
      );
      if (company.userId !== userId) {
        return NextResponse.json({ error: 'Åtkomst nekad.' }, { status: 403 });
      }

      // Convert date strings to ISO datetime for Appwrite
      const updateData = { ...data };
      if (updateData.startDate && !updateData.startDate.includes('T')) {
        updateData.startDate = new Date(updateData.startDate).toISOString();
      }
      if (updateData.applicationDeadline && !updateData.applicationDeadline.includes('T')) {
        updateData.applicationDeadline = new Date(updateData.applicationDeadline).toISOString();
      }

      const doc = await databases.updateDocument(DATABASE_ID, 'internships', internshipId, {
        ...updateData,
        updatedAt: new Date().toISOString()
      });

      return NextResponse.json({ success: true, internship: doc });
    }

    if (action === 'delete') {
      if (!internshipId) {
        return NextResponse.json({ error: 'internshipId krävs.' }, { status: 400 });
      }

      // Verify ownership
      const internship = await databases.getDocument(DATABASE_ID, 'internships', internshipId);
      const company = await databases.getDocument(
        DATABASE_ID,
        'companies',
        internship.companyId as string
      );
      if (company.userId !== userId) {
        return NextResponse.json({ error: 'Åtkomst nekad.' }, { status: 403 });
      }

      await databases.deleteDocument(DATABASE_ID, 'internships', internshipId);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Okänd åtgärd.' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Serverfel';
    console.error('[POST /api/internships] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
