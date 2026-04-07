#!/usr/bin/env node

/**
 * Seed test conversations & messages for the Inbox feature.
 *
 * Usage:
 *   node scripts/seed-inbox.mjs
 *
 * Requires .env.local with APPWRITE_API_KEY set.
 * Finds an existing company and student in the database and creates
 * test conversations with sample messages between them.
 */

import { Client, Databases, ID, Query } from 'node-appwrite';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '..', '.env.local') });

const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const API_KEY = process.env.APPWRITE_API_KEY;
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'prakto';

if (!ENDPOINT || !PROJECT_ID || !API_KEY) {
  console.error('❌  Missing APPWRITE env vars in .env.local');
  process.exit(1);
}

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const databases = new Databases(client);

// ─── Sample messages ───────────────────────────────────────────

const SAMPLE_THREADS = [
  {
    internshipTitle: 'Frontend-utvecklare praktik',
    messages: [
      { role: 'company', text: 'Hej! Vi har tittat på din ansökan och tycker att din profil ser mycket lovande ut. Skulle du ha möjlighet att komma på en intervju nästa vecka?' },
      { role: 'student', text: 'Tack så mycket! Ja absolut, jag är tillgänglig hela nästa vecka. Vilken dag och tid passar er bäst?' },
      { role: 'company', text: 'Vad sägs om tisdag kl 10:00? Vi kan göra det digitalt via Teams om det passar dig.' },
      { role: 'student', text: 'Perfekt! Tisdag kl 10 funkar jättebra. Ser fram emot det! 😊' },
      { role: 'company', text: 'Toppen! Jag skickar en Teams-länk imorgon. Förbered gärna en kort presentation av dina projekt.' },
    ],
  },
  {
    internshipTitle: 'UX/UI Design praktik',
    messages: [
      { role: 'company', text: 'Hej! Vi söker en UX-praktikant för vårt nya projekt. Jag såg att du har erfarenhet med Figma — stämmer det?' },
      { role: 'student', text: 'Hej! Ja, jag har jobbat med Figma i ungefär 2 år och har även erfarenhet med prototyping i Framer.' },
      { role: 'company', text: 'Fantastiskt! Kan du skicka länk till ditt portfolio?' },
      { role: 'student', text: 'Självklart! Här är min portfolio: https://example.com/portfolio. Jag har lagt till några nya case-studier nyligen.' },
    ],
  },
  {
    internshipTitle: 'Backend Java-utvecklare',
    messages: [
      { role: 'company', text: 'Tack för din ansökan till vår backend-praktik! Vi skulle vilja veta mer om din erfarenhet med Spring Boot.' },
      { role: 'student', text: 'Tack! Jag har byggt två REST API:er med Spring Boot under min utbildning, inklusive JWT-autentisering och PostgreSQL-databas.' },
      { role: 'company', text: 'Det låter bra! Vi använder Spring Boot + Kubernetes i produktion. Har du erfarenhet med Docker?' },
      { role: 'student', text: 'Ja, jag har dockeriserat mina projekt och kört dem lokalt med docker-compose. Kubernetes har jag bara läst om dock.' },
      { role: 'company', text: 'Ingen fara — vi lär upp dig! Vill du starta den 15 mars?' },
      { role: 'student', text: 'Ja gärna! Det passar perfekt med min praktikperiod. Tack så mycket!' },
      { role: 'company', text: 'Välkommen till teamet! Jag skickar över alla detaljer via mail.' },
    ],
  },
];

// ─── Main ──────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Seeding inbox test data...\n');

  // Find an existing company
  const companyDocs = await databases.listDocuments(DATABASE_ID, 'companies', [
    Query.limit(1),
  ]);
  if (companyDocs.total === 0) {
    console.error('❌  No company found in database. Create a company account first.');
    process.exit(1);
  }
  const company = companyDocs.documents[0];
  console.log(`  Företag: ${company.name || 'Företaget'} (userId: ${company.userId})`);

  // Find existing student users (role=student)
  const studentUserDocs = await databases.listDocuments(DATABASE_ID, 'users', [
    Query.equal('role', 'student'),
    Query.limit(5),
  ]);

  // If no real students, create fake user entries for seeding
  let studentUsers = [];
  if (studentUserDocs.total > 0) {
    for (const u of studentUserDocs.documents) {
      studentUsers.push({
        userId: u.userId,
        displayName: u.displayName,
        email: u.email || `${u.userId}@test.se`,
      });
    }
  } else {
    console.log('  ⚠ Inga studenter hittades — skapar test-studentprofiler...');
    const fakeStudents = [
      { name: 'Emma Lindberg', email: 'emma@test.se' },
      { name: 'Ali Hassan', email: 'ali@test.se' },
      { name: 'Sofia Karlsson', email: 'sofia@test.se' },
    ];
    for (const s of fakeStudents) {
      const doc = await databases.createDocument(DATABASE_ID, 'users', ID.unique(), {
        userId: ID.unique(),
        displayName: s.name,
        email: s.email,
        role: 'student',
        createdAt: new Date().toISOString(),
      });
      studentUsers.push({
        userId: doc.userId,
        displayName: doc.displayName,
        email: doc.email,
      });
    }
  }

  console.log(`  Studenter hittade: ${studentUsers.length}\n`);

  // Get company's internships (if any)
  const internshipDocs = await databases.listDocuments(DATABASE_ID, 'internships', [
    Query.equal('companyId', company.$id),
    Query.limit(10),
  ]);
  const internships = internshipDocs.documents;

  // Create conversations
  for (let i = 0; i < SAMPLE_THREADS.length; i++) {
    const thread = SAMPLE_THREADS[i];
    const studentUser = studentUsers[i % studentUsers.length];
    const internship = internships[i % Math.max(internships.length, 1)] || null;

    const now = new Date();
    // Stagger conversations so they appear at different times
    const baseTime = new Date(now.getTime() - (SAMPLE_THREADS.length - i) * 3600000);

    const convTitle = internship
      ? internship.title
      : thread.internshipTitle;

    console.log(`  📩 Skapar konversation: "${convTitle}" med ${studentUser.displayName}`);

    const lastMsg = thread.messages[thread.messages.length - 1];
    const lastMsgTime = new Date(
      baseTime.getTime() + thread.messages.length * 300000
    );

    // Create conversation
    const conv = await databases.createDocument(
      DATABASE_ID,
      'conversations',
      ID.unique(),
      {
        companyId: company.$id,
        studentId: studentUser.userId,
        internshipId: internship?.$id || '',
        applicationId: '',
        studentName: studentUser.displayName,
        studentEmail: studentUser.email,
        internshipTitle: convTitle,
        lastMessage: lastMsg.text.slice(0, 500),
        lastSenderId:
          lastMsg.role === 'company' ? company.userId : studentUser.userId,
        status: i === 2 ? 'done' : 'open',
        isStarred: i === 0,
        isReadByCompany: i !== 1, // conversation 1 unread
        isReadByStudent: true,
        unreadCount: i === 1 ? 1 : 0,
        lastMessageAt: lastMsgTime.toISOString(),
        createdAt: baseTime.toISOString(),
      }
    );

    // Create messages
    for (let j = 0; j < thread.messages.length; j++) {
      const m = thread.messages[j];
      const msgTime = new Date(baseTime.getTime() + j * 300000); // 5 min apart

      const senderId =
        m.role === 'company' ? company.userId : studentUser.userId;
      const senderName =
        m.role === 'company' ? (company.name || 'Företaget') : studentUser.displayName;

      await databases.createDocument(
        DATABASE_ID,
        'messages',
        ID.unique(),
        {
          conversationId: conv.$id,
          senderId,
          senderName,
          senderRole: m.role,
          text: m.text,
          isRead: true,
          createdAt: msgTime.toISOString(),
        }
      );

      process.stdout.write(`    💬 ${m.role === 'company' ? '→' : '←'} Meddelande ${j + 1}/${thread.messages.length}\n`);
    }

    console.log('');
  }

  console.log('✅ Klart! 3 testkonversationer skapade.');
  console.log('   Gå till /dashboard/inbox för att se dem.\n');
}

main().catch((err) => {
  console.error('❌ Fel:', err.message);
  process.exit(1);
});
