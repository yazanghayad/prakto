'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';

const STATUS_BADGE: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  submitted: { label: 'Skickad', variant: 'secondary' },
  reviewed: { label: 'Granskad', variant: 'outline' },
  interview: { label: 'Intervju', variant: 'default' },
  accepted: { label: 'Antagen', variant: 'default' },
  rejected: { label: 'Avslag', variant: 'destructive' },
  withdrawn: { label: 'Återtagen', variant: 'outline' }
};

const MOOD_EMOJI: Record<string, string> = {
  great: '😊',
  good: '🙂',
  okay: '😐',
  tough: '😓'
};

interface RecentApplication {
  id: string;
  status: string;
  companyName: string;
  internshipTitle: string;
  appliedAt: string;
}

interface RecentActivityData {
  applications: RecentApplication[];
  journal: { weekNumber: number; mood: string; date: string } | null;
  meeting: { summary: string; date: string } | null;
  feedback: { type: string; category: string; date: string } | null;
}

interface RecentActivityProps {
  data: RecentActivityData | undefined;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' });
}

function ActivityRow({
  icon,
  iconBg,
  title,
  subtitle,
  date,
  badge,
  isLast
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle?: string;
  date: string;
  badge?: React.ReactNode;
  isLast?: boolean;
}) {
  return (
    <div className='flex gap-3'>
      {/* Timeline */}
      <div className='flex flex-col items-center'>
        <div
          className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full', iconBg)}
        >
          {icon}
        </div>
        {!isLast && <div className='bg-border mt-1 w-px flex-1' />}
      </div>

      {/* Content */}
      <div className={cn('min-w-0 flex-1', !isLast && 'pb-5')}>
        <div className='flex items-start justify-between gap-2'>
          <div className='min-w-0'>
            <p className='truncate text-sm font-medium leading-tight'>{title}</p>
            {subtitle && (
              <p className='text-muted-foreground mt-0.5 truncate text-xs'>{subtitle}</p>
            )}
          </div>
          <div className='flex shrink-0 items-center gap-2'>
            {badge}
            <span className='text-muted-foreground text-[11px] tabular-nums'>{date}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function RecentActivity({ data }: RecentActivityProps) {
  const hasData =
    data && (data.applications.length > 0 || data.journal || data.meeting || data.feedback);

  return (
    <Card className='flex h-full flex-col'>
      <CardHeader className='pb-2'>
        <CardTitle className='text-base'>Senaste aktivitet</CardTitle>
        <CardDescription>Dina senaste händelser</CardDescription>
      </CardHeader>
      <CardContent className='flex flex-1 flex-col pt-0'>
        {!hasData ? (
          <div className='flex flex-1 flex-col items-center justify-center gap-3 py-6'>
            <div className='flex h-14 w-14 items-center justify-center rounded-full bg-purple-500/10'>
              <Icons.notification className='h-7 w-7 text-purple-500' />
            </div>
            <div className='text-center'>
              <p className='text-sm font-medium'>Ingen aktivitet ännu</p>
              <p className='text-muted-foreground mt-0.5 text-xs'>
                Händelser dyker upp här allteftersom
              </p>
            </div>
          </div>
        ) : (
          <div className='mt-1'>
            {(() => {
              type ActivityItem = {
                key: string;
                icon: React.ReactNode;
                iconBg: string;
                title: string;
                subtitle?: string;
                date: string;
                badge?: React.ReactNode;
              };

              const items: ActivityItem[] = [];

              // Applications
              for (const app of (data?.applications ?? []).slice(0, 3)) {
                const statusInfo = STATUS_BADGE[app.status];
                items.push({
                  key: `app-${app.id}`,
                  icon: <Icons.applications className='text-primary h-3.5 w-3.5' />,
                  iconBg: 'bg-primary/10',
                  title: app.internshipTitle || 'Ansökan',
                  subtitle: app.companyName,
                  date: formatDate(app.appliedAt),
                  badge: statusInfo ? (
                    <Badge variant={statusInfo.variant} className='px-1.5 py-0 text-[10px]'>
                      {statusInfo.label}
                    </Badge>
                  ) : undefined
                });
              }

              // Journal
              if (data?.journal) {
                items.push({
                  key: 'journal',
                  icon: (
                    <span className='text-xs leading-none'>
                      {MOOD_EMOJI[data.journal.mood] || '📝'}
                    </span>
                  ),
                  iconBg: 'bg-orange-500/10',
                  title: `Dagbok vecka ${data.journal.weekNumber}`,
                  subtitle: `Humör: ${data.journal.mood}`,
                  date: formatDate(data.journal.date)
                });
              }

              // Meeting
              if (data?.meeting) {
                items.push({
                  key: 'meeting',
                  icon: <Icons.video className='h-3.5 w-3.5 text-blue-500' />,
                  iconBg: 'bg-blue-500/10',
                  title: 'Handledarmöte',
                  subtitle: data.meeting.summary?.slice(0, 50),
                  date: formatDate(data.meeting.date)
                });
              }

              // Feedback
              if (data?.feedback) {
                const isPositive = data.feedback.type === 'positive';
                items.push({
                  key: 'feedback',
                  icon: (
                    <Icons.chat
                      className={cn(
                        'h-3.5 w-3.5',
                        isPositive ? 'text-emerald-500' : 'text-amber-500'
                      )}
                    />
                  ),
                  iconBg: isPositive ? 'bg-emerald-500/10' : 'bg-amber-500/10',
                  title: isPositive ? 'Positiv feedback' : 'Förbättringsförslag',
                  subtitle: data.feedback.category,
                  date: formatDate(data.feedback.date)
                });
              }

              return items.map((item, i) => (
                <ActivityRow
                  key={item.key}
                  icon={item.icon}
                  iconBg={item.iconBg}
                  title={item.title}
                  subtitle={item.subtitle}
                  date={item.date}
                  badge={item.badge}
                  isLast={i === items.length - 1}
                />
              ));
            })()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
