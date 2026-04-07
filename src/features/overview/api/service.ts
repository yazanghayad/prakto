import { createAdminClient, getServerUser } from '@/lib/appwrite-server';
import { Query } from 'node-appwrite';
import type {
  StudentStatCards,
  ApplicationStatusData,
  WeeklyHoursEntry,
  GoalsData,
  RecentActivityData
} from './types';

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'prakto';

// ─── Stat Cards ──────────────────────────────────────────────

export async function getStudentStatCards(): Promise<StudentStatCards | null> {
  const user = await getServerUser();
  if (!user || user.role !== 'student') return null;

  const { databases } = createAdminClient();
  const userId = user.userId;

  const [allApps, interviewApps, acceptedApps, bookmarks, goals, timeEntries] = await Promise.all([
    databases.listDocuments(DATABASE_ID, 'applications', [
      Query.equal('studentId', userId),
      Query.limit(1)
    ]),
    databases.listDocuments(DATABASE_ID, 'applications', [
      Query.equal('studentId', userId),
      Query.equal('status', 'interview'),
      Query.limit(1)
    ]),
    databases.listDocuments(DATABASE_ID, 'applications', [
      Query.equal('studentId', userId),
      Query.equal('status', 'accepted'),
      Query.limit(1)
    ]),
    databases.listDocuments(DATABASE_ID, 'bookmarks', [
      Query.equal('studentId', userId),
      Query.limit(1)
    ]),
    databases.listDocuments(DATABASE_ID, 'lia_goals', [
      Query.equal('userId', userId),
      Query.limit(100)
    ]),
    databases.listDocuments(DATABASE_ID, 'lia_time', [
      Query.equal('userId', userId),
      Query.orderDesc('date'),
      Query.limit(200)
    ])
  ]);

  // Hours this week
  const now = new Date();
  const dayOfWeek = now.getDay() || 7;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - dayOfWeek + 1);
  weekStart.setHours(0, 0, 0, 0);
  const weekStartStr = weekStart.toISOString().slice(0, 10);

  let hoursThisWeek = 0;
  for (const doc of timeEntries.documents) {
    if ((doc.date as string) >= weekStartStr) {
      hoursThisWeek += (doc.hours as number) || 0;
    }
  }

  const completedGoals = goals.documents.filter((d) => d.completed === true).length;

  return {
    activeApplications: allApps.total,
    interviews: interviewApps.total,
    accepted: acceptedApps.total > 0,
    hoursThisWeek: Math.round(hoursThisWeek * 10) / 10,
    totalGoals: goals.total,
    completedGoals,
    savedPositions: bookmarks.total
  };
}

// ─── Application Status (Pie Chart) ───────────────────────────

export async function getApplicationStatusData(): Promise<ApplicationStatusData | null> {
  const user = await getServerUser();
  if (!user || user.role !== 'student') return null;

  const { databases } = createAdminClient();

  const allApps = await databases.listDocuments(DATABASE_ID, 'applications', [
    Query.equal('studentId', user.userId),
    Query.limit(100)
  ]);

  const byStatus: Record<string, number> = {};
  for (const doc of allApps.documents) {
    const s = (doc.status as string) || 'submitted';
    byStatus[s] = (byStatus[s] || 0) + 1;
  }

  return byStatus;
}

// ─── Weekly Hours (Bar Chart) ──────────────────────────────────

export async function getWeeklyHoursData(): Promise<WeeklyHoursEntry[] | null> {
  const user = await getServerUser();
  if (!user || user.role !== 'student') return null;

  const { databases } = createAdminClient();

  const timeEntries = await databases.listDocuments(DATABASE_ID, 'lia_time', [
    Query.equal('userId', user.userId),
    Query.orderDesc('date'),
    Query.limit(200)
  ]);

  const weeklyHours: Record<string, Record<string, number>> = {};

  for (const doc of timeEntries.documents) {
    const date = doc.date as string;
    const hours = (doc.hours as number) || 0;
    const category = (doc.category as string) || 'other';

    const d = new Date(date);
    const jan1 = new Date(d.getFullYear(), 0, 1);
    const weekNum = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
    const weekKey = `V${weekNum}`;

    if (!weeklyHours[weekKey]) {
      weeklyHours[weekKey] = { development: 0, meeting: 0, learning: 0, other: 0 };
    }
    weeklyHours[weekKey][category] = (weeklyHours[weekKey][category] || 0) + hours;
  }

  return Object.entries(weeklyHours)
    .sort(([a], [b]) => parseInt(a.slice(1)) - parseInt(b.slice(1)))
    .map(([week, cats]) => ({
      week,
      development: cats.development,
      meeting: cats.meeting,
      learning: cats.learning,
      other: cats.other
    }));
}

// ─── Goals Progress ─────────────────────────────────────────────

export async function getGoalsData(): Promise<GoalsData | null> {
  const user = await getServerUser();
  if (!user || user.role !== 'student') return null;

  const { databases } = createAdminClient();

  const goals = await databases.listDocuments(DATABASE_ID, 'lia_goals', [
    Query.equal('userId', user.userId),
    Query.limit(100)
  ]);

  return {
    totalGoals: goals.total,
    completedGoals: goals.documents.filter((d) => d.completed === true).length
  };
}

// ─── Recent Activity ──────────────────────────────────────────

export async function getRecentActivityData(): Promise<RecentActivityData | null> {
  const user = await getServerUser();
  if (!user || user.role !== 'student') return null;

  const { databases } = createAdminClient();
  const userId = user.userId;

  const [recentApps, recentJournal, recentMeeting, recentFeedback] = await Promise.all([
    databases.listDocuments(DATABASE_ID, 'applications', [
      Query.equal('studentId', userId),
      Query.orderDesc('$createdAt'),
      Query.limit(5)
    ]),
    databases.listDocuments(DATABASE_ID, 'lia_journal', [
      Query.equal('userId', userId),
      Query.orderDesc('$createdAt'),
      Query.limit(1)
    ]),
    databases.listDocuments(DATABASE_ID, 'lia_meetings', [
      Query.equal('userId', userId),
      Query.orderDesc('date'),
      Query.limit(1)
    ]),
    databases.listDocuments(DATABASE_ID, 'lia_feedback', [
      Query.equal('userId', userId),
      Query.orderDesc('date'),
      Query.limit(1)
    ])
  ]);

  return {
    applications: recentApps.documents.map((d) => ({
      id: d.$id as string,
      status: (d.status as string) || 'submitted',
      companyName: (d.companyName as string) || '',
      internshipTitle: (d.internshipTitle as string) || '',
      appliedAt: (d.appliedAt as string) || d.$createdAt
    })),
    journal: recentJournal.documents[0]
      ? {
          weekNumber: recentJournal.documents[0].weekNumber as number,
          mood: recentJournal.documents[0].mood as string,
          date: recentJournal.documents[0].$createdAt
        }
      : null,
    meeting: recentMeeting.documents[0]
      ? {
          summary: recentMeeting.documents[0].summary as string,
          date: recentMeeting.documents[0].date as string
        }
      : null,
    feedback: recentFeedback.documents[0]
      ? {
          type: recentFeedback.documents[0].type as string,
          category: recentFeedback.documents[0].category as string,
          date: recentFeedback.documents[0].date as string
        }
      : null
  };
}
