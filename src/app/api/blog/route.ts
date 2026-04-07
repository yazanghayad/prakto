import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/appwrite-server';
import { Query, ID } from 'node-appwrite';
import { cookies } from 'next/headers';

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'prakto';
const COLLECTION_ID = 'blog_posts';

// ─── Auth helper ──────────────────────────────────────────────

async function getSessionUser() {
  const cookieStore = await cookies();
  const session = cookieStore.get('appwrite_session')?.value;
  if (!session) return null;

  try {
    const { databases } = createAdminClient();
    // Decode session to get userId — the session cookie is "userId:secret"
    const userId = session.split(':')[0];
    if (!userId) return null;

    const userDoc = await databases.getDocument(DATABASE_ID, 'users', userId);
    return { userId, role: userDoc.role as string };
  } catch {
    return null;
  }
}

// ─── GET /api/blog — list published posts or single post ──────

export async function GET(request: NextRequest) {
  try {
    const { databases } = createAdminClient();
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('id');
    const slug = searchParams.get('slug');
    const category = searchParams.get('category');
    const page = Number(searchParams.get('page') ?? 1);
    const limit = Math.min(Number(searchParams.get('limit') ?? 12), 50);

    // Single post by ID
    if (postId) {
      const doc = await databases.getDocument(DATABASE_ID, COLLECTION_ID, postId);
      return NextResponse.json({ post: doc });
    }

    // Single post by slug
    if (slug) {
      const result = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
        Query.equal('slug', slug),
        Query.limit(1)
      ]);
      if (result.total === 0) {
        return NextResponse.json({ error: 'Inlägget hittades inte.' }, { status: 404 });
      }
      return NextResponse.json({ post: result.documents[0] });
    }

    // List posts
    const queries = [
      Query.equal('status', 'published'),
      Query.orderDesc('publishedAt'),
      Query.limit(limit),
      Query.offset((page - 1) * limit)
    ];

    if (category) {
      queries.push(Query.equal('category', category));
    }

    const response = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, queries);

    return NextResponse.json({
      posts: response.documents,
      total: response.total,
      page,
      totalPages: Math.ceil(response.total / limit)
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Kunde inte hämta blogginlägg.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ─── POST /api/blog — create or update post (admin only) ──────

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Ej inloggad.' }, { status: 401 });
    }
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Bara admin kan skapa blogginlägg.' }, { status: 403 });
    }

    const { databases } = createAdminClient();
    const body = await request.json();
    const { id, title, slug, excerpt, content, category, coverImageUrl, status } = body;

    if (!title || !content) {
      return NextResponse.json({ error: 'Titel och innehåll krävs.' }, { status: 400 });
    }

    const postSlug =
      slug ||
      title
        .toLowerCase()
        .replace(/[åä]/g, 'a')
        .replace(/ö/g, 'o')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

    const postData = {
      title,
      slug: postSlug,
      excerpt: excerpt || '',
      content,
      category: category || 'tips',
      coverImageUrl: coverImageUrl || '',
      authorId: user.userId,
      status: status || 'draft',
      ...(status === 'published' && !id ? { publishedAt: new Date().toISOString() } : {}),
      updatedAt: new Date().toISOString()
    };

    if (id) {
      // Update
      const doc = await databases.updateDocument(DATABASE_ID, COLLECTION_ID, id, postData);
      return NextResponse.json({ post: doc });
    }

    // Create
    const doc = await databases.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), {
      ...postData,
      createdAt: new Date().toISOString()
    });
    return NextResponse.json({ post: doc }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Kunde inte spara blogginlägg.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ─── DELETE /api/blog — delete post (admin only) ──────────────

export async function DELETE(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Behörighet saknas.' }, { status: 403 });
    }

    const { databases } = createAdminClient();
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('id');

    if (!postId) {
      return NextResponse.json({ error: 'Post-ID krävs.' }, { status: 400 });
    }

    await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, postId);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Kunde inte ta bort blogginlägg.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
