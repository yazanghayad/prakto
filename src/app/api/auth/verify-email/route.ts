import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/appwrite-server';
import {
  verifyCode,
  generateVerificationCode,
  createVerificationToken
} from '@/lib/email-verification';
import { sendVerificationEmail } from '@/lib/resend';
import { Query } from 'node-appwrite';

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'prakto';
const COOKIE_NAME = 'email_verification';

// POST /api/auth/verify-email — verify code OR resend code
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    // ─── Verify code ────────────────────────────────────
    if (action === 'verify') {
      const { code } = body;
      if (!code || code.length !== 6) {
        return NextResponse.json({ error: 'Ange en 6-siffrig kod.' }, { status: 400 });
      }

      const token = request.cookies.get(COOKIE_NAME)?.value;
      if (!token) {
        return NextResponse.json(
          { error: 'Verifieringssessionen har gått ut. Begär en ny kod.' },
          { status: 400 }
        );
      }

      const result = verifyCode(token, code);
      if (!result) {
        return NextResponse.json({ error: 'Felaktig eller utgången kod.' }, { status: 400 });
      }

      const { userId } = result;
      const { databases, users } = createAdminClient();

      // Mark email as verified in Appwrite Auth
      await users.updateEmailVerification(userId, true);

      // Update profile
      try {
        await databases.updateDocument(DATABASE_ID, 'users', userId, {
          emailVerified: true,
          updatedAt: new Date().toISOString()
        });
      } catch {
        // Field might not exist in schema — Appwrite Auth verification is enough
      }

      // Clear verification cookie
      const response = NextResponse.json({ success: true });
      response.cookies.delete(COOKIE_NAME);
      return response;
    }

    // ─── Resend code ────────────────────────────────────
    if (action === 'resend') {
      const { email } = body;
      if (!email) {
        return NextResponse.json({ error: 'E-postadress krävs.' }, { status: 400 });
      }

      const { users } = createAdminClient();

      // Find user by email
      const usersList = await users.list([Query.equal('email', email)]);
      if (usersList.total === 0) {
        // Don't reveal if user exists
        return NextResponse.json({ success: true });
      }

      const user = usersList.users[0];

      // Already verified
      if (user.emailVerification) {
        return NextResponse.json({ success: true, alreadyVerified: true });
      }

      // Generate new code and send
      const code = generateVerificationCode();
      const token = createVerificationToken(user.$id, email, code);

      await sendVerificationEmail({
        to: email,
        name: user.name || 'Användare',
        code
      });

      // Set new verification cookie
      const response = NextResponse.json({ success: true });
      response.cookies.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 15 * 60 // 15 minutes
      });

      return response;
    }

    return NextResponse.json({ error: 'Okänd åtgärd.' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Kunde inte behandla förfrågan.' }, { status: 500 });
  }
}
