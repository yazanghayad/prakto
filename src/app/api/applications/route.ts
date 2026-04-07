import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/appwrite-server';
import { ID, Query } from 'node-appwrite';
import { createNotification } from '@/app/api/notifications/route';

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'prakto';

// GET /api/applications — list applications (server-side, admin SDK)
// Auth required: students see only their own, companies see only theirs
export async function GET(request: NextRequest) {
  const sessionCookie = request.cookies.get('appwrite_session');
  if (!sessionCookie) {
    return NextResponse.json({ error: 'Ej autentiserad.' }, { status: 401 });
  }

  try {
    const { databases } = createAdminClient();

    const decoded = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString('utf-8'));
    const userId = decoded.id;
    if (!userId) {
      return NextResponse.json({ error: 'Ej autentiserad.' }, { status: 401 });
    }

    // Determine user role
    const userDocs = await databases.listDocuments(DATABASE_ID, 'users', [
      Query.equal('userId', userId),
      Query.limit(1)
    ]);
    if (userDocs.total === 0) {
      return NextResponse.json({ error: 'Profil saknas.' }, { status: 404 });
    }
    const userRole = userDocs.documents[0].role as string;

    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const status = searchParams.get('status') || '';
    const studentId = searchParams.get('studentId') || '';
    const internshipId = searchParams.get('internshipId') || '';
    const companyId = searchParams.get('companyId') || '';
    const sort = searchParams.get('sort') || '';

    // ── Data isolation: enforce ownership ──
    // Students can only see their own applications
    // Companies can only see applications to their own internships
    let scopedStudentId = studentId;
    let scopedCompanyId = companyId;

    if (userRole === 'student') {
      // Student MUST only see their own applications — override any query param
      scopedStudentId = userId;
    } else if (userRole === 'company') {
      // Company MUST only see applications to their own company
      const companyDocs = await databases.listDocuments(DATABASE_ID, 'companies', [
        Query.equal('userId', userId),
        Query.limit(1)
      ]);
      if (companyDocs.total === 0) {
        return NextResponse.json({ total: 0, applications: [] });
      }
      // Override companyId to the authenticated user's company
      scopedCompanyId = companyDocs.documents[0].$id;
    } else {
      // Unknown role — return nothing
      return NextResponse.json({ total: 0, applications: [] });
    }

    const queries: string[] = [];
    queries.push(Query.limit(limit));
    queries.push(Query.offset((page - 1) * limit));

    if (status) queries.push(Query.equal('status', status));
    if (scopedStudentId) queries.push(Query.equal('studentId', scopedStudentId));
    if (internshipId) queries.push(Query.equal('internshipId', internshipId));
    if (scopedCompanyId) queries.push(Query.equal('companyId', scopedCompanyId));

    if (sort) {
      const [sortField, dir] = sort.split('.');
      if (sortField && dir) {
        queries.push(dir === 'desc' ? Query.orderDesc(sortField) : Query.orderAsc(sortField));
      }
    } else {
      queries.push(Query.orderDesc('$createdAt'));
    }

    const response = await databases.listDocuments(DATABASE_ID, 'applications', queries);

    // Enrich applications with internship titles, student names, company names
    const internshipIds = [
      ...new Set(response.documents.map((d) => d.internshipId).filter(Boolean))
    ];
    const studentIds = [...new Set(response.documents.map((d) => d.studentId).filter(Boolean))];
    const companyIds = [...new Set(response.documents.map((d) => d.companyId).filter(Boolean))];

    // Batch-fetch related documents
    const [internships, students, companies] = await Promise.all([
      internshipIds.length > 0
        ? databases
            .listDocuments(DATABASE_ID, 'internships', [
              Query.equal('$id', internshipIds),
              Query.limit(internshipIds.length)
            ])
            .then((r) => r.documents)
        : Promise.resolve([]),
      studentIds.length > 0
        ? databases
            .listDocuments(DATABASE_ID, 'users', [
              Query.equal('userId', studentIds),
              Query.limit(studentIds.length)
            ])
            .then((r) => r.documents)
        : Promise.resolve([]),
      companyIds.length > 0
        ? databases
            .listDocuments(DATABASE_ID, 'companies', [
              Query.equal('$id', companyIds),
              Query.limit(companyIds.length)
            ])
            .then((r) => r.documents)
        : Promise.resolve([])
    ]);

    const internshipMap = new Map(internships.map((d) => [d.$id, d]));
    const studentMap = new Map(students.map((d) => [d.userId as string, d]));
    const companyMap = new Map(companies.map((d) => [d.$id, d]));

    const enriched = response.documents.map((app) => ({
      ...app,
      internshipTitle: internshipMap.get(app.internshipId)?.title || app.internshipTitle || '',
      studentName: studentMap.get(app.studentId)?.displayName || app.studentName || '',
      companyName: companyMap.get(app.companyId)?.companyName || app.companyName || ''
    }));

    return NextResponse.json({
      total: response.total,
      applications: enriched
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Serverfel';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/applications — create application or update application status
export async function POST(request: NextRequest) {
  const sessionCookie = request.cookies.get('appwrite_session');
  if (!sessionCookie) {
    return NextResponse.json({ error: 'Ej autentiserad.' }, { status: 401 });
  }

  try {
    const { databases } = createAdminClient();

    const decoded = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString('utf-8'));
    const userId = decoded.id;
    if (!userId) {
      return NextResponse.json({ error: 'Ej autentiserad.' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'create') {
      const { data } = body;
      const now = new Date().toISOString();

      // Always use authenticated userId as studentId — never trust client input
      const doc = await databases.createDocument(DATABASE_ID, 'applications', ID.unique(), {
        studentId: userId,
        internshipId: data.internshipId,
        companyId: data.companyId,
        cvFileId: data.cvFileId ?? '',
        message: data.message ?? '',
        status: 'submitted',
        appliedAt: now,
        updatedAt: now
      });

      // ── Notify the company that a new application was received ──
      try {
        const internship = await databases.getDocument(
          DATABASE_ID,
          'internships',
          data.internshipId
        );
        const company = await databases.getDocument(DATABASE_ID, 'companies', data.companyId);
        // Send notification to the company owner (userId on company doc)
        if (company.userId) {
          const studentProfile = await databases.getDocument(DATABASE_ID, 'users', userId);
          const studentName = studentProfile.displayName || 'En student';
          await createNotification({
            recipientId: company.userId,
            type: 'new_application',
            title: 'Ny ansökan mottagen',
            message: `${studentName} har ansökt till "${internship.title || 'din praktikplats'}".`,
            linkUrl: '/dashboard/company-applications'
          });
        }
      } catch {
        // Don't fail the main operation if notification fails
      }

      return NextResponse.json({ success: true, application: doc });
    }

    if (action === 'updateStatus') {
      const { applicationId, status, statusNote } = body;

      if (!applicationId || !status) {
        return NextResponse.json({ error: 'applicationId och status krävs.' }, { status: 400 });
      }

      // Verify user has permission (company owns the application's internship, or student withdraws their own)
      const application = await databases.getDocument(DATABASE_ID, 'applications', applicationId);

      const userProfile = await databases.getDocument(DATABASE_ID, 'users', userId);

      let isCompanyOwner = false;
      if (userProfile.role === 'company') {
        // Verify this company user actually owns the company that the application belongs to
        const companyDocs = await databases.listDocuments(DATABASE_ID, 'companies', [
          Query.equal('userId', userId),
          Query.limit(1)
        ]);
        isCompanyOwner =
          companyDocs.total > 0 && application.companyId === companyDocs.documents[0].$id;
      }

      const isStudentOwner =
        userProfile.role === 'student' &&
        application.studentId === userId &&
        status === 'withdrawn';

      if (!isCompanyOwner && !isStudentOwner) {
        return NextResponse.json({ error: 'Åtkomst nekad.' }, { status: 403 });
      }

      const doc = await databases.updateDocument(DATABASE_ID, 'applications', applicationId, {
        status,
        ...(statusNote && { statusNote }),
        updatedAt: new Date().toISOString()
      });

      // ── Notify the student about the status change ──
      if (isCompanyOwner && application.studentId) {
        try {
          const STATUS_LABELS: Record<string, string> = {
            reviewed: 'granskad',
            interview: 'intervju',
            accepted: 'accepterad',
            rejected: 'avvisad'
          };
          const statusLabel = STATUS_LABELS[status] || status;
          let internshipTitle = 'din praktikplats';
          try {
            const internship = await databases.getDocument(
              DATABASE_ID,
              'internships',
              application.internshipId
            );
            internshipTitle = internship.title || internshipTitle;
          } catch {
            // ignore
          }

          await createNotification({
            recipientId: application.studentId,
            type: 'application_status',
            title: 'Status uppdaterad',
            message: `Din ansökan till "${internshipTitle}" har ändrats till ${statusLabel}.`,
            linkUrl: '/dashboard/applications'
          });
        } catch {
          // Don't fail the main operation if notification fails
        }
      }

      return NextResponse.json({ success: true, application: doc });
    }

    return NextResponse.json({ error: 'Okänd åtgärd.' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Serverfel';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
