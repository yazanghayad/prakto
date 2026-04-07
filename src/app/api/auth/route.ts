import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/appwrite-server';
import { ID } from 'node-appwrite';
import { generateVerificationCode, createVerificationToken } from '@/lib/email-verification';
import { sendVerificationEmail } from '@/lib/resend';

// GET /api/auth — check current session and return user profile
export async function GET(request: NextRequest) {
  const sessionCookie = request.cookies.get('appwrite_session');
  if (!sessionCookie) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  try {
    const { databases, users } = createAdminClient();
    const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'prakto';

    // Decode the session cookie to get user ID
    const decoded = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString('utf-8'));
    const userId = decoded.id;

    if (!userId) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // Verify user exists
    const user = await users.get(userId);

    // Get profile from users collection
    let profile = null;
    try {
      const doc = await databases.getDocument(DATABASE_ID, 'users', userId);
      profile = {
        userId: doc.userId,
        role: doc.role,
        displayName: doc.displayName,
        email: doc.email,
        phone: doc.phone,
        avatarUrl: doc.avatarUrl,
        status: doc.status,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt
      };
    } catch {
      // Profile may not exist yet
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        $id: user.$id,
        name: user.name,
        email: user.email,
        emailVerification: user.emailVerification
      },
      profile
    });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, email, password, name, role } = body;

    if (!action) {
      return NextResponse.json({ error: 'Saknad åtgärd.' }, { status: 400 });
    }

    const { account, users, databases } = createAdminClient();
    const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'prakto';

    if (action === 'login') {
      if (!email || !password) {
        return NextResponse.json({ error: 'E-post och lösenord krävs.' }, { status: 400 });
      }
      // Create session using admin SDK (bypasses rate limits)
      const session = await account.createEmailPasswordSession(email, password);

      // Set session cookie
      const response = NextResponse.json({
        success: true,
        userId: session.userId,
        sessionId: session.$id,
        secret: session.secret
      });

      // Set Appwrite session cookie for middleware
      response.cookies.set('appwrite_session', session.secret, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30 // 30 days
      });

      return response;
    }

    if (action === 'register') {
      if (!email || !password || !name || !role) {
        return NextResponse.json(
          { error: 'Alla fält krävs (namn, e-post, lösenord, roll).' },
          { status: 400 }
        );
      }

      // 1. Create user via admin SDK (no session — user must verify email first)
      const user = await users.create(ID.unique(), email, undefined, password, name);

      // 2. Create user profile document
      const now = new Date().toISOString();
      await databases.createDocument(DATABASE_ID, 'users', user.$id, {
        userId: user.$id,
        role,
        displayName: name,
        email,
        status: role === 'company' ? 'pending' : 'active',
        createdAt: now,
        updatedAt: now
      });

      // 3. Send verification email via Resend
      let verificationToken: string | null = null;
      try {
        const code = generateVerificationCode();
        verificationToken = createVerificationToken(user.$id, email, code);
        await sendVerificationEmail({
          to: email,
          name,
          code
        });
      } catch {
        // Don't block registration if email fails — user can resend later
      }

      const response = NextResponse.json({
        success: true,
        userId: user.$id
      });

      // Set verification cookie (for code validation)
      if (verificationToken) {
        response.cookies.set('email_verification', verificationToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 15 * 60 // 15 minutes
        });
      }

      return response;
    }

    if (action === 'logout') {
      const sessionCookie = request.cookies.get('appwrite_session');
      if (sessionCookie) {
        try {
          // Delete session via admin SDK
          const sessionsList = await account.listSessions();
          for (const s of sessionsList.sessions) {
            if (s.secret === sessionCookie.value) {
              await account.deleteSession(s.$id);
              break;
            }
          }
        } catch {
          // Session already expired, ok
        }
      }

      const response = NextResponse.json({ success: true });
      response.cookies.delete('appwrite_session');
      return response;
    }

    return NextResponse.json({ error: 'Okänd åtgärd.' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Serverfel';
    const code =
      err && typeof err === 'object' && 'code' in err ? (err as { code: number }).code : 500;

    // Map Appwrite errors to Swedish
    let userMessage = message;
    if (code === 401 || message.includes('credentials')) {
      userMessage = 'Felaktigt e-postadress eller lösenord.';
    } else if (code === 409 || message.includes('already exists')) {
      userMessage = 'Ett konto med denna e-postadress finns redan.';
    } else if (code === 429) {
      userMessage = 'För många försök. Vänta en stund.';
    }

    return NextResponse.json(
      { error: userMessage },
      { status: code >= 400 && code < 600 ? code : 500 }
    );
  }
}
