import { NextRequest } from 'next/server';
import { getOpenAIClient, AI_MODEL_CREATIVE } from '@/lib/openai';
import { createAdminClient } from '@/lib/appwrite-server';
import { DATABASE_ID, COLLECTION_IDS } from '@/lib/appwrite';
import { Query } from 'node-appwrite';

// ─── Types for user context ──────────────────────────────────────

interface UserContext {
  user: Record<string, unknown> | null;
  student: Record<string, unknown> | null;
  applications: Record<string, unknown>[];
  internships: Record<string, unknown>[];
  bookmarks: Record<string, unknown>[];
  conversations: Record<string, unknown>[];
  notifications: Record<string, unknown>[];
  portfolio: Record<string, unknown>[];
  calendarEvents: Record<string, unknown>[];
  liaJournal: Record<string, unknown>[];
  liaGoals: Record<string, unknown>[];
  liaNotes: Record<string, unknown>[];
  liaTime: Record<string, unknown>[];
  liaMeetings: Record<string, unknown>[];
  liaFeedback: Record<string, unknown>[];
  liaContacts: Record<string, unknown>[];
}

// ─── System prompt builder ───────────────────────────────────────

const BASE_SYSTEM_PROMPT = `Du är Prakto AI — en hjälpsam assistent för svenska studenter som söker praktikplatser (LIA, VFU, APL).

REGLER:
- Svara KORT och KÄRNFULLT. Max 2-3 meningar per svar om inte användaren ber om mer detaljer.
- Använd INTE långa listor eller uppräkningar om det inte är nödvändigt.
- Svara BARA på frågor relaterade till: praktik, studier, karriär, ansökningar, CV, kompetenser, LIA-dagbok, portfolio, plattformen Prakto och användarens data.
- Om användaren ställer frågor som INTE rör ovanstående ämnen (t.ex. politik, nöje, allmänbildning, sport), svara: "Jag kan bara hjälpa dig med frågor om din praktik, studier och karriär. Finns det något jag kan hjälpa dig med där?"
- Svara alltid på svenska. Var vänlig men kortfattad.
- Om data saknas i kontexten, säg det ärligt.`;

function summarizeList(
  label: string,
  items: Record<string, unknown>[],
  formatter: (item: Record<string, unknown>) => string
): string {
  if (items.length === 0) return '';
  const lines = items.map((item, i) => `  ${i + 1}. ${formatter(item)}`);
  return `\n── ${label} (${items.length} st) ──\n${lines.join('\n')}`;
}

function buildSystemPrompt(ctx: UserContext): string {
  let prompt = BASE_SYSTEM_PROMPT;

  // ── User identity ──
  if (ctx.user) {
    const u = ctx.user;
    prompt += `\n\n── Användare ──\nNamn: ${u.displayName}\nE-post: ${u.email}\nRoll: ${u.role}\nStatus: ${u.status}`;
    if (u.phone) prompt += `\nTelefon: ${u.phone}`;
  }

  // ── Student profile ──
  if (ctx.student) {
    const s = ctx.student;
    const parts = [
      s.school ? `Skola: ${s.school}` : '',
      s.program ? `Program: ${s.program}` : '',
      s.educationLevel ? `Utbildningsnivå: ${s.educationLevel}` : '',
      s.city ? `Stad: ${s.city}` : '',
      Array.isArray(s.skills) && s.skills.length > 0
        ? `Kompetenser: ${(s.skills as string[]).join(', ')}`
        : '',
      Array.isArray(s.internshipType) && s.internshipType.length > 0
        ? `Söker praktiktyp: ${(s.internshipType as string[]).join(', ')}`
        : '',
      s.placementStatus ? `Placeringsstatus: ${s.placementStatus}` : '',
      s.linkedinUrl ? `LinkedIn: ${s.linkedinUrl}` : '',
      s.cvFileId ? 'CV: Uppladdad ✓' : 'CV: Ej uppladdad',
      s.bio ? `Bio: ${s.bio}` : ''
    ].filter(Boolean);
    prompt += `\n\n── Studentprofil ──\n${parts.join('\n')}`;
  }

  // ── Applications ──
  prompt += summarizeList('Ansökningar', ctx.applications, (a) => {
    const internship = ctx.internships.find((i) => i.$id === a.internshipId);
    const title = internship ? (internship.title as string) : (a.internshipId as string);
    const company = internship ? (internship.companyName as string) || '' : '';
    return `"${title}"${company ? ` hos ${company}` : ''} — Status: ${a.status}${a.appliedAt ? `, sökt: ${new Date(a.appliedAt as string).toLocaleDateString('sv-SE')}` : ''}`;
  });

  // ── Published internships (available to apply) ──
  prompt += summarizeList(
    'Tillgängliga praktikplatser',
    ctx.internships.filter((i) => i.status === 'published'),
    (i) => {
      return `"${i.title}" i ${i.city} (${i.internshipType}) — ${i.field}${i.spots ? `, ${i.spots} platser` : ''}`;
    }
  );

  // ── Bookmarks ──
  prompt += summarizeList('Sparade praktikplatser (bokmärken)', ctx.bookmarks, (b) => {
    const internship = ctx.internships.find((i) => i.$id === b.internshipId);
    return internship ? `"${internship.title}" i ${internship.city}` : `ID: ${b.internshipId}`;
  });

  // ── Conversations & unread messages ──
  if (ctx.conversations.length > 0) {
    const unread = ctx.conversations.filter((c) => (c.unreadCount as number) > 0);
    const total = ctx.conversations.length;
    let msgSection = `\n── Meddelanden (${total} konversationer) ──`;
    if (unread.length > 0) {
      msgSection += `\n  ⚠ ${unread.length} konversation(er) med olästa meddelanden:`;
      for (const c of unread) {
        msgSection += `\n  - ${c.participantName || c.companyName || 'Okänd'}: ${c.unreadCount} olästa`;
      }
    } else {
      msgSection += '\n  Inga olästa meddelanden.';
    }
    prompt += msgSection;
  }

  // ── Notifications ──
  if (ctx.notifications.length > 0) {
    const unread = ctx.notifications.filter((n) => !(n.isRead as boolean));
    prompt += `\n── Notifikationer ──\n  Totalt: ${ctx.notifications.length}, Olästa: ${unread.length}`;
    if (unread.length > 0) {
      for (const n of unread.slice(0, 5)) {
        prompt += `\n  - ${n.title || n.type}: ${n.message || n.body || ''}`;
      }
    }
  }

  // ── LIA Journal ──
  prompt += summarizeList('LIA-dagbok', ctx.liaJournal.slice(0, 5), (j) => {
    return `Vecka ${j.weekNumber}, ${j.year}${j.mood ? ` (${j.mood})` : ''}${j.highlights ? ` — ${(j.highlights as string).slice(0, 80)}...` : ''}`;
  });

  // ── LIA Goals ──
  prompt += summarizeList('Mål', ctx.liaGoals, (g) => {
    const status = g.completed ? '✅' : '⬜';
    return `${status} ${g.title}${g.category ? ` [${g.category}]` : ''}`;
  });

  // ── LIA Time tracking ──
  if (ctx.liaTime.length > 0) {
    const totalHours = ctx.liaTime.reduce((sum, t) => sum + ((t.hours as number) || 0), 0);
    prompt += `\n── Tidsrapportering ──\n  Totalt: ${totalHours} timmar loggade (${ctx.liaTime.length} poster)`;
  }

  // ── LIA Meetings ──
  prompt += summarizeList('Handledarmöten', ctx.liaMeetings.slice(0, 5), (m) => {
    return `${m.date}${m.summary ? ` — ${(m.summary as string).slice(0, 80)}` : ''}`;
  });

  // ── LIA Feedback ──
  prompt += summarizeList('Feedback', ctx.liaFeedback.slice(0, 5), (f) => {
    return `${f.date} från ${f.from || 'Okänd'} (${f.type || f.category || 'allmän'})${f.content ? `: ${(f.content as string).slice(0, 80)}` : ''}`;
  });

  // ── LIA Contacts ──
  prompt += summarizeList('Kontakter', ctx.liaContacts, (c) => {
    return `${c.name}${c.role ? ` (${c.role})` : ''}${c.company ? ` — ${c.company}` : ''}`;
  });

  // ── LIA Notes ──
  if (ctx.liaNotes.length > 0) {
    prompt += `\n── Anteckningar ──\n  ${ctx.liaNotes.length} anteckningar sparade`;
    const pinned = ctx.liaNotes.filter((n) => n.pinned);
    if (pinned.length > 0) {
      prompt += ` (${pinned.length} fästa)`;
      for (const n of pinned.slice(0, 3)) {
        prompt += `\n  📌 ${n.title || 'Utan titel'}`;
      }
    }
  }

  // ── Portfolio ──
  prompt += summarizeList('Portfolio', ctx.portfolio, (p) => {
    return `"${p.title}"${p.type ? ` (${p.type})` : ''}${p.description ? ` — ${(p.description as string).slice(0, 60)}` : ''}`;
  });

  // ── Calendar events ──
  const now = new Date().toISOString();
  const upcoming = ctx.calendarEvents.filter((e) => (e.startDate as string) >= now);
  if (upcoming.length > 0) {
    prompt += summarizeList('Kommande händelser', upcoming.slice(0, 5), (e) => {
      return `${e.title} — ${new Date(e.startDate as string).toLocaleDateString('sv-SE')}${e.location ? ` (${e.location})` : ''}`;
    });
  }

  prompt += `\n\n── Instruktioner ──
Använd ALL data ovan för att ge personliga, specifika svar. Exempel:
- "Vilka platser har jag sökt?" → Lista ansökningarna med status
- "Har jag olästa meddelanden?" → Kolla konversationerna
- "Hur många timmar har jag loggat?" → Summera tidsrapporteringen
- "Vilka mål har jag kvar?" → Lista ofärdiga mål
Du har tillgång till allt — svara direkt med konkret data, inte generella tips.`;

  return prompt;
}

// ─── Data loader ─────────────────────────────────────────────────

async function loadUserContext(userId: string): Promise<UserContext> {
  const empty: UserContext = {
    user: null,
    student: null,
    applications: [],
    internships: [],
    bookmarks: [],
    conversations: [],
    notifications: [],
    portfolio: [],
    calendarEvents: [],
    liaJournal: [],
    liaGoals: [],
    liaNotes: [],
    liaTime: [],
    liaMeetings: [],
    liaFeedback: [],
    liaContacts: []
  };

  try {
    const { databases } = createAdminClient();

    const byUser = (coll: string, field = 'userId', limit = 50) =>
      databases
        .listDocuments(DATABASE_ID, coll, [
          Query.equal(field, userId),
          Query.limit(limit),
          Query.orderDesc('$createdAt')
        ])
        .then((r) => r.documents as unknown as Record<string, unknown>[])
        .catch(() => [] as Record<string, unknown>[]);

    // Fire all queries in parallel for speed
    const [
      userDoc,
      studentDocs,
      applications,
      internships,
      bookmarks,
      conversations,
      notifications,
      portfolio,
      calendarEvents,
      liaJournal,
      liaGoals,
      liaNotes,
      liaTime,
      liaMeetings,
      liaFeedback,
      liaContacts
    ] = await Promise.all([
      databases
        .getDocument(DATABASE_ID, COLLECTION_IDS.users, userId)
        .then((d) => d as unknown as Record<string, unknown>)
        .catch(() => null),
      byUser(COLLECTION_IDS.students),
      byUser(COLLECTION_IDS.applications, 'studentId'),
      // Load all published internships (for reference in applications/bookmarks)
      databases
        .listDocuments(DATABASE_ID, COLLECTION_IDS.internships, [
          Query.limit(100),
          Query.orderDesc('$createdAt')
        ])
        .then((r) => r.documents as unknown as Record<string, unknown>[])
        .catch(() => [] as Record<string, unknown>[]),
      byUser(COLLECTION_IDS.bookmarks),
      byUser(COLLECTION_IDS.conversations, 'studentId', 25),
      byUser(COLLECTION_IDS.notifications),
      byUser(COLLECTION_IDS.portfolio),
      byUser(COLLECTION_IDS.calendarEvents),
      byUser(COLLECTION_IDS.liaJournal, 'userId', 10),
      byUser(COLLECTION_IDS.liaGoals),
      byUser(COLLECTION_IDS.liaNotes, 'userId', 20),
      byUser(COLLECTION_IDS.liaTime, 'userId', 100),
      byUser(COLLECTION_IDS.liaMeetings, 'userId', 10),
      byUser(COLLECTION_IDS.liaFeedback, 'userId', 10),
      byUser(COLLECTION_IDS.liaContacts)
    ]);

    return {
      user: userDoc,
      student: studentDocs[0] || null,
      applications,
      internships,
      bookmarks,
      conversations,
      notifications,
      portfolio,
      calendarEvents,
      liaJournal,
      liaGoals,
      liaNotes,
      liaTime,
      liaMeetings,
      liaFeedback,
      liaContacts
    };
  } catch (err) {
    console.error('[loadUserContext] Error:', err);
    return empty;
  }
}

export async function POST(request: NextRequest) {
  // Verify authentication
  const sessionCookie = request.cookies.get('appwrite_session');
  if (!sessionCookie) {
    return new Response(JSON.stringify({ error: 'Ej autentiserad.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  let userId: string;
  try {
    const decoded = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString('utf-8'));
    if (!decoded.id) {
      return new Response(JSON.stringify({ error: 'Ej autentiserad.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    userId = decoded.id as string;
  } catch {
    return new Response(JSON.stringify({ error: 'Ogiltig session.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const { messages } = (await request.json()) as {
      messages: { role: 'user' | 'assistant'; content: string }[];
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Meddelanden saknas.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Load ALL user data for personalized responses
    const ctx = await loadUserContext(userId);
    const systemPrompt = buildSystemPrompt(ctx);

    // Limit conversation history to last 20 messages to control token usage
    const recentMessages = messages.slice(-20);

    const openai = getOpenAIClient();
    const stream = await openai.chat.completions.create({
      model: AI_MODEL_CREATIVE,
      temperature: 0.6,
      max_tokens: 1024,
      stream: true,
      messages: [{ role: 'system', content: systemPrompt }, ...recentMessages]
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content;
            if (text) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      }
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive'
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'AI-chatten misslyckades.';
    console.error('[POST /api/ai/chat] Error:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
