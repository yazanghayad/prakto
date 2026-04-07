'use client';

import { useQuery, useSuspenseQuery, useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { getCompanyById, getCompanyLogoUrl } from '@/features/company/api/service';
import { toggleBookmark } from '@/features/bookmarks/api/service';
import { bookmarkKeys } from '@/features/bookmarks/api/queries';
import { getQueryClient } from '@/lib/query-client';
import { internshipsQueryOptions } from '../api/queries';
import { industryOptions } from '@/features/company/constants/options';
import type { Internship } from '../api/types';

// ─── Helpers ──────────────────────────────────────────────────

const INDUSTRY_MAP: Record<string, string> = Object.fromEntries(
  industryOptions.map((o) => [o.value, o.label])
);

const TYPE_LABELS: Record<string, string> = {
  lia: 'LIA',
  vfu: 'VFU',
  apl: 'APL'
};

const WORKPLACE_LABELS: Record<string, string> = {
  on_site: 'På plats',
  remote: 'Distans',
  hybrid: 'Hybrid'
};

// ─── Internship Card ──────────────────────────────────────────

function InternshipCard({ internship }: Readonly<{ internship: Internship }>) {
  const bookmarkMutation = useMutation({
    mutationFn: () => toggleBookmark(internship.$id),
    onSuccess: (data) => {
      getQueryClient().invalidateQueries({ queryKey: bookmarkKeys.all });
      toast.success(
        data.action === 'added' ? 'Praktikplats sparad!' : 'Praktikplats borttagen från sparade.'
      );
    },
    onError: () => {
      toast.error('Kunde inte spara praktikplats.');
    }
  });

  const deadline = internship.applicationDeadline
    ? new Date(internship.applicationDeadline).toLocaleDateString('sv-SE', {
        day: 'numeric',
        month: 'short'
      })
    : null;

  return (
    <Card className='transition-shadow hover:shadow-md'>
      <CardContent className='p-5'>
        <div className='flex items-start justify-between gap-3'>
          <div className='min-w-0 flex-1'>
            <Link
              href={`/dashboard/internships/${internship.$id}`}
              className='text-base font-semibold text-foreground hover:text-primary hover:underline'
            >
              {internship.title}
            </Link>
            <p className='mt-0.5 text-sm text-muted-foreground'>{internship.field}</p>
          </div>
          <Badge variant='outline' className='shrink-0'>
            {TYPE_LABELS[internship.internshipType] ?? internship.internshipType}
          </Badge>
        </div>

        <p className='mt-2 line-clamp-2 text-sm text-muted-foreground'>{internship.description}</p>

        <div className='mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground'>
          <span className='inline-flex items-center gap-1'>
            <Icons.mapPin className='h-3 w-3' />
            {internship.city}
          </span>
          {internship.workplaceType && internship.workplaceType !== 'on_site' && (
            <span>{WORKPLACE_LABELS[internship.workplaceType]}</span>
          )}
          {internship.duration && (
            <span className='inline-flex items-center gap-1'>
              <Icons.clock className='h-3 w-3' />
              {internship.duration}
            </span>
          )}
          <span className='inline-flex items-center gap-1'>
            <Icons.teams className='h-3 w-3' />
            {internship.spots} {internship.spots === 1 ? 'plats' : 'platser'}
          </span>
          {deadline && (
            <span className='inline-flex items-center gap-1'>
              <Icons.calendar className='h-3 w-3' />
              Sista dag: {deadline}
            </span>
          )}
        </div>

        <div className='mt-4 flex items-center justify-end gap-2'>
          <Button
            size='sm'
            variant='ghost'
            className='rounded-full'
            onClick={() => bookmarkMutation.mutate()}
            disabled={bookmarkMutation.isPending}
          >
            <Icons.bookmark className='h-4 w-4' />
          </Button>
          <Button asChild size='sm' variant='outline' className='rounded-full'>
            <Link href={`/dashboard/internships/${internship.$id}`}>Visa praktikplats</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Company Detail View ──────────────────────────────────────

interface CompanyDetailViewProps {
  companyId: string;
}

export function CompanyDetailView({ companyId }: CompanyDetailViewProps) {
  const router = useRouter();

  const { data: company, isLoading: companyLoading } = useQuery({
    queryKey: ['company', companyId],
    queryFn: () => getCompanyById(companyId)
  });

  const { data: internshipsData } = useSuspenseQuery(
    internshipsQueryOptions({ companyId, status: 'published', limit: 20 })
  );

  const logoUrl = company?.logoFileId ? getCompanyLogoUrl(company.logoFileId) : null;

  const initials = (company?.companyName || '??')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className='space-y-6'>
      {/* Back button */}
      <Button variant='ghost' size='sm' onClick={() => router.back()} className='-ml-2'>
        <Icons.arrowLeft className='mr-1.5 h-4 w-4' />
        Tillbaka
      </Button>

      {/* Company header */}
      <div className='flex items-start gap-5'>
        {/* Logo */}
        <div className='flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted'>
          {companyLoading ? (
            <Skeleton className='h-full w-full' />
          ) : logoUrl ? (
            <img src={logoUrl} alt={company?.companyName} className='h-full w-full object-cover' />
          ) : (
            <span className='text-xl font-bold text-muted-foreground'>{initials}</span>
          )}
        </div>

        {/* Info */}
        <div className='min-w-0 flex-1'>
          {companyLoading ? (
            <Skeleton className='h-7 w-64' />
          ) : (
            <h1 className='text-2xl font-bold text-foreground'>{company?.companyName}</h1>
          )}
          {companyLoading ? (
            <Skeleton className='mt-1 h-4 w-40' />
          ) : (
            <p className='mt-1 text-sm text-muted-foreground'>
              {INDUSTRY_MAP[company?.industry ?? ''] || company?.industry}
            </p>
          )}
          <div className='mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground'>
            {company?.city && (
              <span className='inline-flex items-center gap-1'>
                <Icons.mapPin className='h-3.5 w-3.5' />
                {company.city}
              </span>
            )}
            {company?.website && (
              <a
                href={company.website}
                target='_blank'
                rel='noopener noreferrer'
                className='inline-flex items-center gap-1 text-primary hover:underline'
              >
                <Icons.link className='h-3.5 w-3.5' />
                Webbplats
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      {company?.description && (
        <div className='rounded-lg border border-border bg-card p-5'>
          <h2 className='mb-2 text-sm font-semibold text-foreground'>Om företaget</h2>
          <p className='whitespace-pre-line text-sm leading-relaxed text-muted-foreground'>
            {company.description}
          </p>
        </div>
      )}

      {/* Internships */}
      <div>
        <h2 className='mb-4 text-lg font-semibold text-foreground'>
          Aktiva praktikplatser ({internshipsData.internships.length})
        </h2>
        {internshipsData.internships.length === 0 ? (
          <div className='flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12'>
            <Icons.briefcase className='mb-3 h-8 w-8 text-muted-foreground/30' />
            <p className='text-sm text-muted-foreground'>Inga aktiva praktikplatser just nu.</p>
          </div>
        ) : (
          <div className='grid gap-4 sm:grid-cols-2'>
            {internshipsData.internships.map((internship) => (
              <InternshipCard key={internship.$id} internship={internship} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
