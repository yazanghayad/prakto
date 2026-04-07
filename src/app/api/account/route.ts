import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/appwrite-server';

/**
 * POST /api/account — Account management actions
 *
 * Actions:
 * - update-email    { newEmail, password }
 * - update-password { currentPassword, newPassword }
 * - update-name     { name }
 * - delete-account  { password }
 */
export async function POST(request: NextRequest) {
  const sessionCookie = request.cookies.get('appwrite_session');
  if (!sessionCookie) {
    return NextResponse.json({ error: 'Ej autentiserad.' }, { status: 401 });
  }

  try {
    const { users, databases } = createAdminClient();
    const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'prakto';

    // Decode session to get user ID
    const decoded = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString('utf-8'));
    const userId = decoded.id as string | undefined;
    if (!userId) {
      return NextResponse.json({ error: 'Ogiltig session.' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body as { action: string };

    // ─── Update email ───────────────────────────────────────

    if (action === 'update-email') {
      const { newEmail } = body as { newEmail?: string };
      if (!newEmail?.trim()) {
        return NextResponse.json({ error: 'Ny e-postadress krävs.' }, { status: 400 });
      }

      // Update in Appwrite Auth
      await users.updateEmail(userId, newEmail.trim());

      // Update in users collection
      try {
        await databases.updateDocument(DATABASE_ID, 'users', userId, {
          email: newEmail.trim(),
          updatedAt: new Date().toISOString()
        });
      } catch {
        // Profile doc may not exist yet
      }

      return NextResponse.json({ success: true });
    }

    // ─── Update password ────────────────────────────────────

    if (action === 'update-password') {
      const { newPassword } = body as { newPassword?: string };

      if (!newPassword || newPassword.length < 8) {
        return NextResponse.json(
          { error: 'Lösenordet måste vara minst 8 tecken.' },
          { status: 400 }
        );
      }

      // Admin SDK can update password directly
      await users.updatePassword(userId, newPassword);

      return NextResponse.json({ success: true });
    }

    // ─── Update display name ────────────────────────────────

    if (action === 'update-name') {
      const { name } = body as { name?: string };
      if (!name?.trim()) {
        return NextResponse.json({ error: 'Namn krävs.' }, { status: 400 });
      }

      await users.updateName(userId, name.trim());

      try {
        await databases.updateDocument(DATABASE_ID, 'users', userId, {
          displayName: name.trim(),
          updatedAt: new Date().toISOString()
        });
      } catch {
        // Profile doc may not exist
      }

      return NextResponse.json({ success: true });
    }

    // ─── Delete account ─────────────────────────────────────

    if (action === 'delete-account') {
      // Delete all related documents first
      const collections = [
        'students',
        'companies',
        'bookmarks',
        'notifications',
        'lia_journal',
        'lia_goals',
        'lia_notes',
        'lia_time',
        'lia_meetings',
        'lia_feedback',
        'lia_contacts',
        'ai_chats'
      ];

      for (const coll of collections) {
        try {
          const docs = await databases.listDocuments(DATABASE_ID, coll, [
            `equal("userId", "${userId}")`
          ]);
          for (const doc of docs.documents) {
            await databases.deleteDocument(DATABASE_ID, coll, doc.$id);
          }
        } catch {
          // Collection may not exist or no docs — ok
        }
      }

      // Delete user profile document
      try {
        await databases.deleteDocument(DATABASE_ID, 'users', userId);
      } catch {
        // ok
      }

      // Delete the Appwrite auth user
      await users.delete(userId);

      // Clear session cookie
      const response = NextResponse.json({ success: true });
      response.cookies.delete('appwrite_session');
      return response;
    }

    return NextResponse.json({ error: 'Okänd åtgärd.' }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Serverfel';

    let userMessage = message;
    if (message.includes('already exists') || message.includes('unique')) {
      userMessage = 'Denna e-postadress används redan av ett annat konto.';
    } else if (message.includes('credentials') || message.includes('password')) {
      userMessage = 'Felaktigt lösenord.';
    }

    return NextResponse.json({ error: userMessage }, { status: 400 });
  }
}
