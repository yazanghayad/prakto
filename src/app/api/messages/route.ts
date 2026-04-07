import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/appwrite-server';
import { ID, Query, type Databases } from 'node-appwrite';

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'prakto';

// ─── Auth helper ───────────────────────────────────────────────

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

async function verifyCompanyOwnership(
  databases: Databases,
  userId: string,
  companyId: string
): Promise<boolean> {
  try {
    const company = await databases.getDocument(DATABASE_ID, 'companies', companyId);
    return company.userId === userId;
  } catch {
    return false;
  }
}

async function verifyConversationAccess(
  databases: Databases,
  userId: string,
  role: string,
  conversationId: string
): Promise<{ hasAccess: boolean; conv: Record<string, unknown> | null }> {
  try {
    const conv = await databases.getDocument(DATABASE_ID, 'conversations', conversationId);
    const hasAccess =
      (role === 'company' &&
        (await verifyCompanyOwnership(databases, userId, conv.companyId as string))) ||
      (role === 'student' && conv.studentId === userId);
    return { hasAccess, conv };
  } catch {
    return { hasAccess: false, conv: null };
  }
}

interface AuthContext {
  userId: string;
  databases: Databases;
  users: ReturnType<typeof createAdminClient>['users'];
  profile: Record<string, unknown>;
  role: string;
}

async function getAuthContext(request: NextRequest): Promise<AuthContext | NextResponse> {
  const userId = getUserIdFromCookie(request);
  if (!userId) {
    return NextResponse.json({ error: 'Ej autentiserad.' }, { status: 401 });
  }

  const { databases, users } = createAdminClient();

  const userDocs = await databases.listDocuments(DATABASE_ID, 'users', [
    Query.equal('userId', userId),
    Query.limit(1)
  ]);
  if (userDocs.total === 0) {
    return NextResponse.json({ error: 'Profil saknas.' }, { status: 404 });
  }

  return {
    userId,
    databases,
    users,
    profile: userDocs.documents[0],
    role: userDocs.documents[0].role as string
  };
}

// ─── GET Action Handlers ───────────────────────────────────────

async function handleGetConversations(ctx: AuthContext, searchParams: URLSearchParams) {
  const { databases, userId, role } = ctx;
  const status = searchParams.get('status') || '';
  const search = searchParams.get('search') || '';
  const internshipId = searchParams.get('internshipId') || '';
  const filterType = searchParams.get('filter') || 'all';

  const queries: string[] = [Query.orderDesc('lastMessageAt'), Query.limit(50)];

  // Scope by role
  let companyId: string | null = null;
  if (role === 'company') {
    const companyDocs = await databases.listDocuments(DATABASE_ID, 'companies', [
      Query.equal('userId', userId),
      Query.limit(1)
    ]);
    if (companyDocs.total === 0) {
      return NextResponse.json({
        conversations: [],
        internships: [],
        total: 0,
        unreadTotal: 0
      });
    }
    companyId = companyDocs.documents[0].$id;
    queries.push(Query.equal('companyId', companyId));
  } else if (role === 'student') {
    queries.push(Query.equal('studentId', userId));
  } else {
    return NextResponse.json({ error: 'Rollen stöds inte.' }, { status: 403 });
  }

  if (status && status !== 'all') queries.push(Query.equal('status', status));

  if (filterType === 'unread') {
    const readField = role === 'company' ? 'isReadByCompany' : 'isReadByStudent';
    queries.push(Query.equal(readField, false));
  } else if (filterType === 'starred') {
    queries.push(Query.equal('isStarred', true));
  }

  if (internshipId) queries.push(Query.equal('internshipId', internshipId));
  if (search) queries.push(Query.search('studentName', search));

  // Run conversations, internships, and unread count in parallel
  const internshipPromise = companyId
    ? databases.listDocuments(DATABASE_ID, 'internships', [
        Query.equal('companyId', companyId),
        Query.limit(50)
      ])
    : Promise.resolve(null);

  const unreadQueries: string[] = buildUnreadQueries(role, companyId, userId);

  const [response, internshipDocs, unreadResp] = await Promise.all([
    databases.listDocuments(DATABASE_ID, 'conversations', queries),
    internshipPromise,
    databases.listDocuments(DATABASE_ID, 'conversations', unreadQueries)
  ]);

  const internships: { $id: string; title: string }[] = internshipDocs
    ? internshipDocs.documents.map((d) => ({
        $id: d.$id,
        title: d.title as string
      }))
    : [];

  // Enrich conversations with company name for students
  let enrichedConversations = response.documents;
  if (role === 'student' && response.documents.length > 0) {
    const companyIds = [...new Set(response.documents.map((d) => d.companyId as string))];
    const companyNames = new Map<string, string>();
    await Promise.all(
      companyIds.map(async (cId) => {
        try {
          const doc = await databases.getDocument(DATABASE_ID, 'companies', cId);
          companyNames.set(cId, doc.name as string);
        } catch {
          companyNames.set(cId, 'Företag');
        }
      })
    );
    enrichedConversations = response.documents.map((d) => ({
      ...d,
      companyName: companyNames.get(d.companyId as string) || 'Företag'
    }));
  }

  return NextResponse.json({
    conversations: enrichedConversations,
    internships,
    total: response.total,
    unreadTotal: unreadResp.total
  });
}

function buildUnreadQueries(role: string, companyId: string | null, userId: string): string[] {
  if (role === 'company' && companyId) {
    return [
      Query.limit(1),
      Query.equal('companyId', companyId),
      Query.equal('isReadByCompany', false)
    ];
  }
  return [Query.limit(1), Query.equal('studentId', userId), Query.equal('isReadByStudent', false)];
}

async function handleGetMessages(ctx: AuthContext, searchParams: URLSearchParams) {
  const { databases, userId, role } = ctx;
  const conversationId = searchParams.get('conversationId');
  if (!conversationId) {
    return NextResponse.json({ error: 'conversationId krävs.' }, { status: 400 });
  }

  const { hasAccess, conv } = await verifyConversationAccess(
    databases,
    userId,
    role,
    conversationId
  );
  if (!hasAccess || !conv) {
    return NextResponse.json({ error: 'Åtkomst nekad.' }, { status: 403 });
  }

  // Mark as read — only when conversation was unread (skip on subsequent polls)
  const readField = role === 'company' ? 'isReadByCompany' : 'isReadByStudent';
  const wasUnread = !conv[readField];

  // Fetch messages in parallel with marking read
  const messagesPromise = databases.listDocuments(DATABASE_ID, 'messages', [
    Query.equal('conversationId', conversationId),
    Query.orderAsc('createdAt'),
    Query.limit(200)
  ]);

  if (wasUnread) {
    // Mark conversation + individual messages as read
    const [, unreadMsgs] = await Promise.all([
      databases.updateDocument(DATABASE_ID, 'conversations', conversationId, {
        [readField]: true,
        unreadCount: 0
      }),
      databases.listDocuments(DATABASE_ID, 'messages', [
        Query.equal('conversationId', conversationId),
        Query.equal('isRead', false),
        Query.notEqual('senderId', userId),
        Query.limit(100)
      ])
    ]);
    if (unreadMsgs.total > 0) {
      await Promise.all(
        unreadMsgs.documents.map((msg) =>
          databases.updateDocument(DATABASE_ID, 'messages', msg.$id, {
            isRead: true
          })
        )
      );
    }
  }

  const messages = await messagesPromise;

  return NextResponse.json({
    messages: messages.documents,
    conversation: conv,
    total: messages.total
  });
}

async function handleGetStudentDetails(ctx: AuthContext, searchParams: URLSearchParams) {
  const { databases } = ctx;
  const studentId = searchParams.get('studentId');
  if (!studentId) {
    return NextResponse.json({ error: 'studentId krävs.' }, { status: 400 });
  }

  const [userDoc, studentDoc] = await Promise.all([
    databases.listDocuments(DATABASE_ID, 'users', [
      Query.equal('userId', studentId),
      Query.limit(1)
    ]),
    databases.listDocuments(DATABASE_ID, 'students', [
      Query.equal('userId', studentId),
      Query.limit(1)
    ])
  ]);

  return NextResponse.json({
    user: userDoc.documents[0] || null,
    student: studentDoc.documents[0] || null
  });
}

async function handleGetCompanyDetails(ctx: AuthContext, searchParams: URLSearchParams) {
  const { databases } = ctx;
  const companyId = searchParams.get('companyId');
  if (!companyId) {
    return NextResponse.json({ error: 'companyId krävs.' }, { status: 400 });
  }

  try {
    const companyDoc = await databases.getDocument(DATABASE_ID, 'companies', companyId);

    let userDoc = null;
    if (companyDoc.userId) {
      const userDocs = await databases.listDocuments(DATABASE_ID, 'users', [
        Query.equal('userId', companyDoc.userId as string),
        Query.limit(1)
      ]);
      userDoc = userDocs.documents[0] || null;
    }

    return NextResponse.json({
      company: {
        $id: companyDoc.$id,
        name: companyDoc.name,
        industry: companyDoc.industry || null,
        city: companyDoc.city || null,
        website: companyDoc.website || null,
        description: companyDoc.description || null,
        contactEmail: companyDoc.contactEmail || null,
        contactPhone: companyDoc.contactPhone || null,
        logoUrl: companyDoc.logoUrl || null
      },
      user: userDoc
    });
  } catch {
    return NextResponse.json({ company: null, user: null });
  }
}

// ─── POST Action Handlers ──────────────────────────────────────

async function handleSendMessage(ctx: AuthContext, body: Record<string, unknown>) {
  const { databases, userId, role, profile } = ctx;
  const { conversationId, text } = body;
  if (!conversationId || !(text as string)?.trim()) {
    return NextResponse.json({ error: 'conversationId och text krävs.' }, { status: 400 });
  }

  const sanitizedText = (text as string).trim().slice(0, 5000);

  const { hasAccess, conv } = await verifyConversationAccess(
    databases,
    userId,
    role,
    conversationId as string
  );
  if (!hasAccess || !conv) {
    return NextResponse.json({ error: 'Åtkomst nekad.' }, { status: 403 });
  }

  const now = new Date().toISOString();

  const msg = await databases.createDocument(DATABASE_ID, 'messages', ID.unique(), {
    conversationId,
    senderId: userId,
    senderName: profile.displayName as string,
    senderRole: role === 'company' ? 'company' : 'student',
    text: sanitizedText,
    isRead: false,
    createdAt: now
  });

  // Update conversation metadata
  const updateData: Record<string, unknown> = {
    lastMessage: sanitizedText.slice(0, 500),
    lastSenderId: userId,
    lastMessageAt: now,
    isReadByStudent: role !== 'company',
    isReadByCompany: role === 'company'
  };
  await databases.updateDocument(
    DATABASE_ID,
    'conversations',
    conversationId as string,
    updateData
  );

  // Notify other party
  await createMessageNotification(
    databases,
    conv,
    role,
    profile.displayName as string,
    sanitizedText
  );

  return NextResponse.json({ message: msg });
}

async function createMessageNotification(
  databases: Databases,
  conv: Record<string, unknown>,
  senderRole: string,
  senderName: string,
  text: string
) {
  try {
    let recipientId: string;
    if (senderRole === 'student') {
      const companyDoc = await databases.getDocument(
        DATABASE_ID,
        'companies',
        conv.companyId as string
      );
      recipientId = companyDoc.userId as string;
    } else {
      recipientId = conv.studentId as string;
    }

    await databases.createDocument(DATABASE_ID, 'notifications', ID.unique(), {
      recipientId,
      type: 'new_message',
      title: `Nytt meddelande från ${senderName}`,
      message: text.slice(0, 200),
      linkUrl: '/dashboard/inbox',
      isRead: false,
      createdAt: new Date().toISOString()
    });
  } catch {
    // Non-critical
  }
}

async function handleCreateConversation(ctx: AuthContext, body: Record<string, unknown>) {
  const { databases, userId, role, profile } = ctx;
  const { studentId, internshipId, applicationId, initialMessage } = body;

  if (!studentId) {
    return NextResponse.json({ error: 'studentId krävs.' }, { status: 400 });
  }
  if (role !== 'company') {
    return NextResponse.json(
      { error: 'Endast företag kan starta konversationer.' },
      { status: 403 }
    );
  }

  // Get company
  const companyDocs = await databases.listDocuments(DATABASE_ID, 'companies', [
    Query.equal('userId', userId),
    Query.limit(1)
  ]);
  if (companyDocs.total === 0) {
    return NextResponse.json({ error: 'Företagsprofil saknas.' }, { status: 404 });
  }
  const companyId = companyDocs.documents[0].$id;

  // Get student info
  const studentUserDoc = await databases.listDocuments(DATABASE_ID, 'users', [
    Query.equal('userId', studentId as string),
    Query.limit(1)
  ]);
  const studentName =
    studentUserDoc.total > 0 ? (studentUserDoc.documents[0].displayName as string) : 'Student';
  const studentEmail =
    studentUserDoc.total > 0 ? (studentUserDoc.documents[0].email as string) : '';

  // Get internship title
  let internshipTitle = '';
  if (internshipId) {
    try {
      const doc = await databases.getDocument(DATABASE_ID, 'internships', internshipId as string);
      internshipTitle = doc.title as string;
    } catch {
      // Not found — fine
    }
  }

  const now = new Date().toISOString();
  const msgText = ((initialMessage as string) || '').trim();

  const conv = await databases.createDocument(DATABASE_ID, 'conversations', ID.unique(), {
    companyId,
    studentId,
    internshipId: (internshipId as string) || '',
    applicationId: (applicationId as string) || '',
    studentName,
    studentEmail,
    internshipTitle,
    lastMessage: msgText.slice(0, 500),
    lastSenderId: msgText ? userId : '',
    status: 'open',
    isStarred: false,
    isReadByCompany: true,
    isReadByStudent: !msgText,
    unreadCount: msgText ? 1 : 0,
    lastMessageAt: now,
    createdAt: now
  });

  if (msgText) {
    await databases.createDocument(DATABASE_ID, 'messages', ID.unique(), {
      conversationId: conv.$id,
      senderId: userId,
      senderName: profile.displayName as string,
      senderRole: 'company',
      text: msgText.slice(0, 5000),
      isRead: false,
      createdAt: now
    });
  }

  return NextResponse.json({ conversation: conv });
}

async function handleUpdateStatus(ctx: AuthContext, body: Record<string, unknown>) {
  const { databases, userId, role } = ctx;
  const { conversationId, status } = body;
  if (!conversationId || !['open', 'snoozed', 'done'].includes(status as string)) {
    return NextResponse.json({ error: 'conversationId och giltig status krävs.' }, { status: 400 });
  }

  const { hasAccess } = await verifyConversationAccess(
    databases,
    userId,
    role,
    conversationId as string
  );
  if (!hasAccess) {
    return NextResponse.json({ error: 'Åtkomst nekad.' }, { status: 403 });
  }

  await databases.updateDocument(DATABASE_ID, 'conversations', conversationId as string, {
    status
  });

  return NextResponse.json({ success: true });
}

async function handleToggleStar(ctx: AuthContext, body: Record<string, unknown>) {
  const { databases, userId, role } = ctx;
  const { conversationId } = body;
  if (!conversationId) {
    return NextResponse.json({ error: 'conversationId krävs.' }, { status: 400 });
  }

  const { hasAccess, conv } = await verifyConversationAccess(
    databases,
    userId,
    role,
    conversationId as string
  );
  if (!hasAccess || !conv) {
    return NextResponse.json({ error: 'Åtkomst nekad.' }, { status: 403 });
  }

  await databases.updateDocument(DATABASE_ID, 'conversations', conversationId as string, {
    isStarred: !conv.isStarred
  });

  return NextResponse.json({ success: true, isStarred: !conv.isStarred });
}

async function handleDeleteConversation(ctx: AuthContext, body: Record<string, unknown>) {
  const { databases, userId, role } = ctx;
  const { conversationId } = body;
  if (!conversationId) {
    return NextResponse.json({ error: 'conversationId krävs.' }, { status: 400 });
  }

  if (role !== 'company' && role !== 'student') {
    return NextResponse.json({ error: 'Åtkomst nekad.' }, { status: 403 });
  }

  const { hasAccess } = await verifyConversationAccess(
    databases,
    userId,
    role,
    conversationId as string
  );
  if (!hasAccess) {
    return NextResponse.json({ error: 'Åtkomst nekad.' }, { status: 403 });
  }

  await databases.updateDocument(DATABASE_ID, 'conversations', conversationId as string, {
    status: 'done'
  });

  return NextResponse.json({ success: true });
}

// ─── Get Applicants (company only) ─────────────────────────────

async function handleGetApplicants(ctx: AuthContext, searchParams: URLSearchParams) {
  const { databases, userId, role } = ctx;

  if (role !== 'company') {
    return NextResponse.json({ error: 'Åtkomst nekad.' }, { status: 403 });
  }

  // Get company
  const companyDocs = await databases.listDocuments(DATABASE_ID, 'companies', [
    Query.equal('userId', userId),
    Query.limit(1)
  ]);
  if (companyDocs.total === 0) {
    return NextResponse.json({ applicants: [] });
  }
  const companyId = companyDocs.documents[0].$id;

  // Get applications for this company
  const statusFilter = searchParams.get('appStatus') || '';
  const queries: string[] = [
    Query.equal('companyId', companyId),
    Query.orderDesc('appliedAt'),
    Query.limit(100)
  ];
  if (statusFilter) {
    queries.push(Query.equal('status', statusFilter));
  }

  const appDocs = await databases.listDocuments(DATABASE_ID, 'applications', queries);

  // Deduplicate by studentId, enrich with names + internship titles
  const studentIds = [...new Set(appDocs.documents.map((d) => d.studentId as string))];
  const internshipIds = [...new Set(appDocs.documents.map((d) => d.internshipId as string))];

  // Batch fetch student names, internship titles, and conversations in parallel
  const [studentNameResults, internshipTitleResults, existingConvs] = await Promise.all([
    // Student names — batch with Query.equal (supports arrays in Appwrite)
    studentIds.length > 0
      ? databases.listDocuments(DATABASE_ID, 'users', [
          Query.equal('userId', studentIds),
          Query.limit(studentIds.length)
        ])
      : Promise.resolve({ documents: [] }),
    // Internship titles
    internshipIds.length > 0
      ? databases.listDocuments(DATABASE_ID, 'internships', [
          Query.equal('$id', internshipIds),
          Query.limit(internshipIds.length)
        ])
      : Promise.resolve({ documents: [] }),
    // Existing conversations
    databases.listDocuments(DATABASE_ID, 'conversations', [
      Query.equal('companyId', companyId),
      Query.limit(500)
    ])
  ]);

  const studentNames = new Map<string, string>();
  for (const doc of studentNameResults.documents) {
    studentNames.set(doc.userId as string, doc.displayName as string);
  }

  const internshipTitles = new Map<string, string>();
  for (const doc of internshipTitleResults.documents) {
    internshipTitles.set(doc.$id as string, doc.title as string);
  }

  const convMap = new Map<string, string>();
  for (const c of existingConvs.documents) {
    convMap.set(c.studentId as string, c.$id as string);
  }

  const applicants = appDocs.documents.map((app) => ({
    $id: app.$id,
    studentId: app.studentId,
    studentName: studentNames.get(app.studentId as string) || 'Student',
    internshipId: app.internshipId,
    internshipTitle: internshipTitles.get(app.internshipId as string) || '',
    status: app.status,
    appliedAt: app.appliedAt,
    conversationId: convMap.get(app.studentId as string) || null
  }));

  return NextResponse.json({ applicants });
}

// ─── Route Handlers ────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const authResult = await getAuthContext(request);
  if (authResult instanceof NextResponse) return authResult;

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'conversations';

  try {
    const handlers: Record<
      string,
      (ctx: AuthContext, sp: URLSearchParams) => Promise<NextResponse>
    > = {
      conversations: handleGetConversations,
      messages: handleGetMessages,
      studentDetails: handleGetStudentDetails,
      companyDetails: handleGetCompanyDetails,
      applicants: handleGetApplicants
    };

    const handler = handlers[action];
    if (!handler) {
      return NextResponse.json({ error: 'Okänd action.' }, { status: 400 });
    }
    return await handler(authResult, searchParams);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Serverfel';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authResult = await getAuthContext(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const { action } = body;

    const handlers: Record<
      string,
      (ctx: AuthContext, b: Record<string, unknown>) => Promise<NextResponse>
    > = {
      sendMessage: handleSendMessage,
      createConversation: handleCreateConversation,
      updateStatus: handleUpdateStatus,
      toggleStar: handleToggleStar,
      deleteConversation: handleDeleteConversation
    };

    const handler = handlers[action];
    if (!handler) {
      return NextResponse.json({ error: 'Okänd åtgärd.' }, { status: 400 });
    }
    return await handler(authResult, body);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Serverfel';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
