import PageContainer from '@/components/layout/page-container';
import { Card, CardContent } from '@/components/ui/card';
import { getServerUser, createAdminClient } from '@/lib/appwrite-server';
import { getStudentStatCards } from '@/features/overview/api/service';
import { ROLE_LABELS, type UserRole } from '@/types/platform';
import React from 'react';
import { OtherDashboards } from './other-dashboards';

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'prakto';

export default async function OverViewLayout({
  sales,
  pie_stats,
  bar_stats,
  area_stats
}: {
  sales: React.ReactNode;
  pie_stats: React.ReactNode;
  bar_stats: React.ReactNode;
  area_stats: React.ReactNode;
}) {
  const user = await getServerUser();

  let displayName = '';
  if (user) {
    try {
      const { databases } = createAdminClient();
      const userDoc = await databases.getDocument(DATABASE_ID, 'users', user.userId);
      displayName = (userDoc.displayName as string) || '';
    } catch {
      /* user doc may not exist yet */
    }
  }

  const role = user?.role as UserRole | undefined;
  const isStudent = role === 'student';

  // Fetch stat cards server-side for students
  const statCards = isStudent ? await getStudentStatCards() : null;

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-6'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>
            Välkommen{displayName ? `, ${displayName}` : ''}! 👋
          </h2>
          <p className='text-muted-foreground'>{role ? ROLE_LABELS[role] : ''}</p>
        </div>

        {isStudent && (
          <div className='space-y-6'>
            {/* Stat row */}
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
              <Card>
                <CardContent className='pt-4'>
                  <p className='text-muted-foreground text-xs font-medium'>Ansökningar</p>
                  <p className='mt-1 text-2xl font-semibold tabular-nums'>
                    {statCards?.activeApplications ?? 0}
                  </p>
                  <p className='text-muted-foreground mt-0.5 text-xs'>
                    {statCards?.interviews
                      ? `${statCards.interviews} till intervju`
                      : 'Väntar på svar'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className='pt-4'>
                  <p className='text-muted-foreground text-xs font-medium'>Intervjuer</p>
                  <p className='mt-1 text-2xl font-semibold tabular-nums'>
                    {statCards?.interviews ?? 0}
                  </p>
                  <p className='text-muted-foreground mt-0.5 text-xs'>Inbokade samtal</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className='pt-4'>
                  <p className='text-muted-foreground text-xs font-medium'>Tid denna vecka</p>
                  <p className='mt-1 text-2xl font-semibold tabular-nums'>
                    {statCards?.hoursThisWeek ?? 0}
                    <span className='text-muted-foreground ml-0.5 text-sm font-normal'>h</span>
                  </p>
                  <p className='text-muted-foreground mt-0.5 text-xs'>Loggade timmar</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className='pt-4'>
                  <p className='text-muted-foreground text-xs font-medium'>Mål</p>
                  <p className='mt-1 text-2xl font-semibold tabular-nums'>
                    {statCards?.completedGoals ?? 0}
                    <span className='text-muted-foreground text-sm font-normal'>
                      /{statCards?.totalGoals ?? 0}
                    </span>
                  </p>
                  <p className='text-muted-foreground mt-0.5 text-xs'>
                    {statCards?.accepted ? 'Placerad' : 'Söker praktik'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row 1: Bar (weekly hours) + Pie (application status) */}
            <div className='grid gap-4 lg:grid-cols-7'>
              <div className='lg:col-span-4'>{bar_stats}</div>
              <div className='lg:col-span-3'>{pie_stats}</div>
            </div>

            {/* Charts Row 2: Recent activity + Goals progress */}
            <div className='grid gap-4 lg:grid-cols-7'>
              <div className='lg:col-span-4'>{sales}</div>
              <div className='lg:col-span-3'>{area_stats}</div>
            </div>
          </div>
        )}

        {role && !isStudent && <OtherDashboards role={role} />}

        {!role && (
          <Card>
            <CardContent className='py-8 text-center'>
              <p className='text-muted-foreground'>
                Välkommen! Slutför din profil för att komma igång.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}
