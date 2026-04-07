import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/appwrite-server';
import { Query } from 'node-appwrite';

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'prakto';

// GET /api/dashboard/stats — dashboard stats for the authenticated user
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

    // Get user role
    const userDoc = await databases.getDocument(DATABASE_ID, 'users', userId);
    const role = userDoc.role as string;

    if (role === 'company') {
      // Get company profile
      const companyRes = await databases.listDocuments(DATABASE_ID, 'companies', [
        Query.equal('userId', userId),
        Query.limit(1)
      ]);

      if (companyRes.total === 0) {
        return NextResponse.json({
          role,
          activeListings: 0,
          newApplications: 0,
          filledPositions: 0,
          approvalStatus: 'no_profile'
        });
      }

      const company = companyRes.documents[0];
      const companyId = company.$id;

      // Count published internships
      const publishedRes = await databases.listDocuments(DATABASE_ID, 'internships', [
        Query.equal('companyId', companyId),
        Query.equal('status', 'published'),
        Query.limit(1)
      ]);

      // Count all internships for this company (any status)
      const allInternshipsRes = await databases.listDocuments(DATABASE_ID, 'internships', [
        Query.equal('companyId', companyId),
        Query.limit(1)
      ]);

      // Count applications with status 'submitted' (new/unreviewed)
      const newAppsRes = await databases.listDocuments(DATABASE_ID, 'applications', [
        Query.equal('companyId', companyId),
        Query.equal('status', 'submitted'),
        Query.limit(1)
      ]);

      // Count accepted applications
      const acceptedRes = await databases.listDocuments(DATABASE_ID, 'applications', [
        Query.equal('companyId', companyId),
        Query.equal('status', 'accepted'),
        Query.limit(1)
      ]);

      return NextResponse.json({
        role,
        activeListings: publishedRes.total,
        totalListings: allInternshipsRes.total,
        newApplications: newAppsRes.total,
        filledPositions: acceptedRes.total,
        approvalStatus: company.approvalStatus as string
      });
    }

    if (role === 'student') {
      // --- Applications by status ---
      const allApps = await databases.listDocuments(DATABASE_ID, 'applications', [
        Query.equal('studentId', userId),
        Query.limit(100)
      ]);

      const applicationsByStatus: Record<string, number> = {};
      for (const doc of allApps.documents) {
        const s = (doc.status as string) || 'submitted';
        applicationsByStatus[s] = (applicationsByStatus[s] || 0) + 1;
      }

      const interviews = applicationsByStatus['interview'] || 0;
      const accepted = (applicationsByStatus['accepted'] || 0) > 0;

      // --- Recent applications (last 5) ---
      const recentApps = await databases.listDocuments(DATABASE_ID, 'applications', [
        Query.equal('studentId', userId),
        Query.orderDesc('$createdAt'),
        Query.limit(5)
      ]);
      const recentApplications = recentApps.documents.map((d) => ({
        id: d.$id,
        status: d.status as string,
        companyName: (d.companyName as string) || '',
        internshipTitle: (d.internshipTitle as string) || '',
        appliedAt: (d.appliedAt as string) || d.$createdAt
      }));

      // --- Time entries (current week + all for chart) ---
      const timeEntries = await databases.listDocuments(DATABASE_ID, 'lia_time', [
        Query.equal('userId', userId),
        Query.orderDesc('date'),
        Query.limit(200)
      ]);

      // Calculate hours this week
      const now = new Date();
      const dayOfWeek = now.getDay() || 7; // Mon=1
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - dayOfWeek + 1);
      weekStart.setHours(0, 0, 0, 0);
      const weekStartStr = weekStart.toISOString().slice(0, 10);

      let hoursThisWeek = 0;
      const weeklyHours: Record<string, Record<string, number>> = {};

      for (const doc of timeEntries.documents) {
        const date = doc.date as string;
        const hours = (doc.hours as number) || 0;
        const category = (doc.category as string) || 'other';

        if (date >= weekStartStr) {
          hoursThisWeek += hours;
        }

        // Group by ISO week for chart
        const d = new Date(date);
        const jan1 = new Date(d.getFullYear(), 0, 1);
        const weekNum = Math.ceil(
          ((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7
        );
        const weekKey = `V${weekNum}`;

        if (!weeklyHours[weekKey]) {
          weeklyHours[weekKey] = { development: 0, meeting: 0, learning: 0, other: 0 };
        }
        weeklyHours[weekKey][category] = (weeklyHours[weekKey][category] || 0) + hours;
      }

      // Convert to array sorted by week
      const weeklyHoursChart = Object.entries(weeklyHours)
        .sort(([a], [b]) => {
          const na = parseInt(a.slice(1));
          const nb = parseInt(b.slice(1));
          return na - nb;
        })
        .map(([week, cats]) => ({ week, ...cats }));

      // --- Goals ---
      const goals = await databases.listDocuments(DATABASE_ID, 'lia_goals', [
        Query.equal('userId', userId),
        Query.limit(100)
      ]);
      const totalGoals = goals.total;
      const completedGoals = goals.documents.filter((d) => d.completed === true).length;

      // --- Bookmarks count ---
      const bookmarks = await databases.listDocuments(DATABASE_ID, 'bookmarks', [
        Query.equal('studentId', userId),
        Query.limit(1)
      ]);

      // --- Recent journal entry ---
      const recentJournal = await databases.listDocuments(DATABASE_ID, 'lia_journal', [
        Query.equal('userId', userId),
        Query.orderDesc('$createdAt'),
        Query.limit(1)
      ]);

      // --- Recent meeting ---
      const recentMeeting = await databases.listDocuments(DATABASE_ID, 'lia_meetings', [
        Query.equal('userId', userId),
        Query.orderDesc('date'),
        Query.limit(1)
      ]);

      // --- Recent feedback ---
      const recentFeedback = await databases.listDocuments(DATABASE_ID, 'lia_feedback', [
        Query.equal('userId', userId),
        Query.orderDesc('date'),
        Query.limit(1)
      ]);

      return NextResponse.json({
        role,
        // Stat cards
        activeApplications: allApps.total,
        interviews,
        accepted,
        hoursThisWeek: Math.round(hoursThisWeek * 10) / 10,
        totalGoals,
        completedGoals,
        savedPositions: bookmarks.total,

        // Pie chart: application status breakdown
        applicationsByStatus,

        // Bar chart: weekly hours by category
        weeklyHoursChart,

        // Recent activity feed
        recentActivity: {
          applications: recentApplications,
          journal: recentJournal.documents[0]
            ? {
                weekNumber: recentJournal.documents[0].weekNumber,
                mood: recentJournal.documents[0].mood,
                date: recentJournal.documents[0].$createdAt
              }
            : null,
          meeting: recentMeeting.documents[0]
            ? {
                summary: recentMeeting.documents[0].summary,
                date: recentMeeting.documents[0].date
              }
            : null,
          feedback: recentFeedback.documents[0]
            ? {
                type: recentFeedback.documents[0].type,
                category: recentFeedback.documents[0].category,
                date: recentFeedback.documents[0].date
              }
            : null
        }
      });
    }

    if (role === 'admin') {
      const usersRes = await databases.listDocuments(DATABASE_ID, 'users', [Query.limit(1)]);

      const pendingCompanies = await databases.listDocuments(DATABASE_ID, 'companies', [
        Query.equal('approvalStatus', 'pending'),
        Query.limit(1)
      ]);

      const publishedRes = await databases.listDocuments(DATABASE_ID, 'internships', [
        Query.equal('status', 'published'),
        Query.limit(1)
      ]);

      const allAppsRes = await databases.listDocuments(DATABASE_ID, 'applications', [
        Query.limit(1)
      ]);

      return NextResponse.json({
        role,
        totalUsers: usersRes.total,
        pendingApproval: pendingCompanies.total,
        activeListings: publishedRes.total,
        totalApplications: allAppsRes.total
      });
    }

    return NextResponse.json({ role });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Serverfel';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
