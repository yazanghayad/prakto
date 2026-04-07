'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { useUser } from '@/hooks/use-auth';
import { bookmarksQueryOptions } from '../api/queries';
import { toggleBookmarkMutation } from '../api/mutations';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { Skeleton } from '@/components/ui/skeleton';
import { INTERNSHIP_TYPE_LABELS } from '@/types/platform';
import { toast } from 'sonner';
import Link from 'next/link';
import type { Bookmark } from '../api/types';

// ─── Labels ────────────────────────────────────────────────────

const WORKPLACE_LABELS: Record<string, string> = {
  on_site: 'På plats',
  remote: 'Distans',
  hybrid: 'Hybrid'
};

// ─── Deadline helper ──────────────────────────────────────────

function getDeadlineInfo(
  deadline: string | undefined
): { label: string; isUrgent: boolean } | null {
  if (!deadline) return null;
  const now = new Date();
  const date = new Date(deadline);
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { label: 'Deadline passerad', isUrgent: true };
  if (diffDays === 0) return { label: 'Sista dagen idag!', isUrgent: true };
  if (diffDays === 1) return { label: 'Deadline imorgon', isUrgent: true };
  if (diffDays <= 7) return { label: `${diffDays} dagar kvar`, isUrgent: true };
  if (diffDays <= 14) return { label: `${diffDays} dagar kvar`, isUrgent: false };
  return {
    label: date.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' }),
    isUrgent: false
  };
}

// ─── Bookmark Card ────────────────────────────────────────────

function BookmarkCard({ bookmark }: Readonly<{ bookmark: Bookmark }>) {
  const internship = bookmark.internship;

  const mutation = useMutation({
    ...toggleBookmarkMutation,
    onSuccess: () => {
      toast.success('Praktikplats borttagen från sparade.');
    },
    onError: (error) => {
      toast.error(error.message || 'Kunde inte ta bort.');
    }
  });

  if (!internship) {
    return (
      <Card className='border opacity-60'>
        <CardContent className='flex items-center gap-3 p-4'>
          <div className='min-w-0 flex-1'>
            <p className='text-muted-foreground text-sm'>
              Denna praktikplats är inte längre tillgänglig.
            </p>
          </div>
          <Button
            variant='ghost'
            size='icon'
            className='h-8 w-8 shrink-0'
            onClick={() => mutation.mutate(bookmark.internshipId)}
            disabled={mutation.isPending}
          >
            <Icons.trash className='h-4 w-4' />
          </Button>
        </CardContent>
      </Card>
    );
  }

  const deadlineInfo = getDeadlineInfo(internship.applicationDeadline);
  const isClosed = internship.status === 'closed' || deadlineInfo?.label === 'Deadline passerad';

  return (
    <Card className='group border transition-shadow hover:shadow-md'>
      <CardContent className='p-0'>
        <div className='flex items-start gap-3 p-4'>
          {/* Content */}
          <div className='min-w-0 flex-1'>
            <div className='flex items-start justify-between gap-2'>
              <div className='min-w-0'>
                <Link
                  href={`/dashboard/internships/${internship.$id}`}
                  className='hover:text-primary text-sm font-semibold transition-colors'
                >
                  {internship.title}
                </Link>
                <div className='text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs'>
                  <span>{internship.companyName || 'Företag'}</span>
                  <span>·</span>
                  <span className='inline-flex items-center gap-0.5'>
                    <Icons.mapPin className='h-3 w-3' />
                    {internship.city}
                  </span>
                  {internship.workplaceType && (
                    <>
                      <span>·</span>
                      <span>{WORKPLACE_LABELS[internship.workplaceType] ?? ''}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Remove button */}
              <Button
                variant='ghost'
                size='icon'
                className='h-8 w-8 shrink-0 opacity-0 transition-opacity group-hover:opacity-100'
                onClick={() => mutation.mutate(bookmark.internshipId)}
                disabled={mutation.isPending}
              >
                {mutation.isPending ? (
                  <Icons.spinner className='h-4 w-4 animate-spin' />
                ) : (
                  <Icons.close className='h-4 w-4' />
                )}
                <span className='sr-only'>Ta bort</span>
              </Button>
            </div>

            {/* Tags */}
            <div className='mt-2 flex flex-wrap items-center gap-1.5'>
              <Badge variant='outline' className='text-xs'>
                {INTERNSHIP_TYPE_LABELS[internship.internshipType] ?? internship.internshipType}
              </Badge>
              {internship.spots > 0 && (
                <Badge variant='outline' className='gap-1 text-xs'>
                  <Icons.teams className='h-3 w-3' />
                  {internship.spots} {internship.spots === 1 ? 'plats' : 'platser'}
                </Badge>
              )}
              {isClosed && (
                <Badge variant='destructive' className='text-xs'>
                  Stängd
                </Badge>
              )}
              {deadlineInfo && !isClosed && (
                <Badge
                  variant={deadlineInfo.isUrgent ? 'destructive' : 'secondary'}
                  className='gap-1 text-xs'
                >
                  <Icons.clock className='h-3 w-3' />
                  {deadlineInfo.label}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Footer: Saved date + action */}
        <div className='border-t px-4 py-2.5'>
          <div className='flex items-center justify-between'>
            <p className='text-muted-foreground text-xs'>
              Sparad {new Date(bookmark.createdAt).toLocaleDateString('sv-SE')}
            </p>
            {!isClosed && (
              <Button asChild size='sm' variant='outline' className='h-7 text-xs'>
                <Link href={`/dashboard/internships/${internship.$id}`}>Visa annons</Link>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Empty State ──────────────────────────────────────────────

function EmptyState() {
  return (
    <div className='py-16 text-center'>
      <p className='text-muted-foreground text-sm'>Inga sparade praktikplatser.</p>
      <p className='text-muted-foreground mt-1 text-sm'>
        Tryck på bokmärkesikonen på en praktikannons för att spara den.
      </p>
      <Button asChild variant='outline' className='mt-4'>
        <Link href='/dashboard/internships'>Utforska praktikplatser</Link>
      </Button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────

export default function SavedInternshipsListing() {
  const { profile, isLoading: authLoading } = useUser();
  const userId = profile?.userId ?? '';

  const { data, isLoading } = useQuery({
    ...bookmarksQueryOptions(userId),
    enabled: !!userId
  });

  if (authLoading || isLoading) {
    return (
      <div className='space-y-3'>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={`skeleton-${i}`} className='h-32 w-full rounded-lg' />
        ))}
      </div>
    );
  }

  const bookmarks = data?.bookmarks ?? [];

  if (bookmarks.length === 0) {
    return <EmptyState />;
  }

  // Separate active vs expired
  const now = new Date();
  const active = bookmarks.filter((b) => {
    if (!b.internship) return false;
    if (b.internship.status === 'closed') return false;
    if (b.internship.applicationDeadline) {
      return new Date(b.internship.applicationDeadline) >= now;
    }
    return true;
  });
  const expired = bookmarks.filter((b) => !active.includes(b));

  // Count urgent (deadline within 7 days)
  const urgentCount = active.filter((b) => {
    if (!b.internship?.applicationDeadline) return false;
    const diff = new Date(b.internship.applicationDeadline).getTime() - now.getTime();
    return diff > 0 && diff <= 7 * 24 * 60 * 60 * 1000;
  }).length;

  return (
    <div className='space-y-6'>
      {/* Summary */}
      <p className='text-muted-foreground text-sm'>
        {bookmarks.length} sparade
        {urgentCount > 0 ? ` · ${urgentCount} med deadline inom 7 dagar` : ''}
      </p>

      {/* Active bookmarks */}
      {active.length > 0 && (
        <div className='space-y-3'>
          {active.map((bookmark) => (
            <BookmarkCard key={bookmark.$id} bookmark={bookmark} />
          ))}
        </div>
      )}

      {/* Expired section */}
      {expired.length > 0 && (
        <div className='space-y-3'>
          <h3 className='text-muted-foreground text-sm font-medium'>
            Stängda / utgångna ({expired.length})
          </h3>
          <div className='space-y-3 opacity-60'>
            {expired.map((bookmark) => (
              <BookmarkCard key={bookmark.$id} bookmark={bookmark} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
