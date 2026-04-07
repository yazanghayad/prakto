'use client';

import { useSuspenseQuery, useMutation } from '@tanstack/react-query';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { internshipsQueryOptions } from '../api/queries';
import { deleteInternshipMutation, updateInternshipMutation } from '../api/mutations';
import type { Internship } from '../api/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { AlertModal } from '@/components/modal/alert-modal';
import { Icons } from '@/components/icons';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// ─── PascalCase icon aliases ───────────────────────────────────

const BriefcaseIcon = Icons.briefcase;
const MapPinIcon = Icons.mapPin;
const ClockIcon = Icons.clock;
const CalendarIcon = Icons.calendar;
const UsersIcon = Icons.teams;
const EditIcon = Icons.edit;
const TrashIcon = Icons.trash;
const SendIcon = Icons.send;
const EllipsisIcon = Icons.ellipsis;
const ChevronLeftIcon = Icons.chevronLeft;
const ChevronRightIcon = Icons.chevronRight;

// ─── Labels ────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  lia: 'LIA',
  vfu: 'VFU',
  apl: 'APL'
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Utkast',
  pending_review: 'Väntar granskning',
  published: 'Publicerad',
  rejected: 'Avvisad',
  closed: 'Stängd'
};

const WORKPLACE_LABELS: Record<string, string> = {
  on_site: 'På plats',
  remote: 'Distans',
  hybrid: 'Hybrid'
};

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  draft: 'secondary',
  pending_review: 'outline',
  published: 'default',
  rejected: 'destructive',
  closed: 'secondary'
};

// ─── Status Tabs ──────────────────────────────────────────────

const STATUS_TABS = [
  { value: '', label: 'Alla' },
  { value: 'published', label: 'Öppet' },
  { value: 'draft', label: 'Utkast' },

  { value: 'rejected', label: 'Avvisad' },
  { value: 'closed', label: 'Stängt' }
] as const;

function StatusTabs({
  activeStatus,
  onSelect
}: Readonly<{
  activeStatus: string;
  onSelect: (status: string) => void;
}>) {
  return (
    <div className='border-b'>
      <nav className='-mb-px flex gap-0' aria-label='Status filter'>
        {STATUS_TABS.map((tab) => {
          const isActive = activeStatus === tab.value;
          return (
            <button
              key={tab.value}
              type='button'
              onClick={() => onSelect(tab.value)}
              className={cn(
                'relative px-4 py-3 text-sm font-medium transition-colors',
                isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
              {isActive && (
                <span className='bg-primary absolute inset-x-0 bottom-0 h-0.5 rounded-full' />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────

function EmptyState({ statusLabel }: Readonly<{ statusLabel: string }>) {
  return (
    <div className='flex flex-col items-center justify-center py-20'>
      {/* Illustration placeholder */}
      <div className='mb-8 flex items-end gap-3'>
        <div className='bg-muted flex h-16 w-12 items-end justify-center rounded-lg pb-2'>
          <div className='bg-muted-foreground/20 h-6 w-6 rounded' />
        </div>
        <div className='bg-muted/60 flex h-24 w-20 flex-col items-center justify-center gap-1.5 rounded-xl p-3'>
          <div className='bg-muted-foreground/15 h-2 w-12 rounded' />
          <div className='bg-muted-foreground/15 h-2 w-10 rounded' />
          <div className='bg-muted-foreground/15 h-2 w-14 rounded' />
          <div className='bg-primary/20 mt-1 h-6 w-10 rounded-full' />
        </div>
        <div className='bg-muted flex h-12 w-10 items-center justify-center rounded-lg'>
          <BriefcaseIcon className='text-muted-foreground/40 h-5 w-5' />
        </div>
      </div>

      <h3 className='mb-2 text-lg font-semibold'>
        Du har inte lagt upp några {statusLabel} praktikplatser än
      </h3>
      <p className='text-muted-foreground mx-auto mb-6 max-w-md text-center text-sm'>
        Lägg upp en praktikplats på bara några minuter och nå ut till kvalificerade studenter som
        söker LIA, VFU eller APL.
      </p>
      <Button variant='outline' asChild className='rounded-full px-6'>
        <Link href='/dashboard/listings/new'>Lägg upp en praktikplats gratis</Link>
      </Button>
    </div>
  );
}

// ─── Single Listing Card ──────────────────────────────────────

function ListingCard({
  internship,
  onDelete
}: Readonly<{
  internship: Internship;
  onDelete: (id: string) => void;
}>) {
  const router = useRouter();

  const publishMutation = useMutation({
    ...updateInternshipMutation,
    onSuccess: () => {
      toast.success('Praktikplats publicerad.');
    },
    onError: () => {
      toast.error('Kunde inte publicera.');
    }
  });

  const canPublish =
    internship.status === 'draft' ||
    internship.status === 'pending_review' ||
    internship.status === 'rejected';

  const createdDate = new Date(internship.createdAt).toLocaleDateString('sv-SE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  const deadlineDate = internship.applicationDeadline
    ? new Date(internship.applicationDeadline).toLocaleDateString('sv-SE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    : null;

  return (
    <Card className='group transition-shadow hover:shadow-md'>
      <CardContent className='p-0'>
        <div className='flex items-start gap-4 p-5'>
          {/* Icon */}
          <div className='bg-muted flex h-12 w-12 shrink-0 items-center justify-center rounded-lg'>
            <BriefcaseIcon className='h-6 w-6' />
          </div>

          {/* Content */}
          <div className='min-w-0 flex-1'>
            {/* Title row */}
            <div className='flex items-start justify-between gap-3'>
              <div className='min-w-0'>
                <Link
                  href={`/dashboard/listings/${internship.$id}`}
                  className='hover:text-primary truncate text-base font-semibold leading-tight hover:underline'
                >
                  {internship.title}
                </Link>
                <p className='text-muted-foreground mt-0.5 text-sm'>{internship.field}</p>
              </div>

              {/* Actions dropdown */}
              <div className='flex shrink-0 items-center gap-2'>
                <Badge variant={STATUS_VARIANTS[internship.status] ?? 'secondary'}>
                  {STATUS_LABELS[internship.status] ?? internship.status}
                </Badge>
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button variant='ghost' size='icon' className='h-8 w-8'>
                      <EllipsisIcon className='h-4 w-4' />
                      <span className='sr-only'>Öppna meny</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    <DropdownMenuLabel>Åtgärder</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => router.push(`/dashboard/listings/${internship.$id}?edit=true`)}
                    >
                      <EditIcon className='mr-2 h-4 w-4' />
                      Redigera
                    </DropdownMenuItem>
                    {canPublish && (
                      <DropdownMenuItem
                        onClick={() =>
                          publishMutation.mutate({
                            id: internship.$id,
                            data: { status: 'published' }
                          })
                        }
                      >
                        <SendIcon className='mr-2 h-4 w-4' />
                        Publicera
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete(internship.$id)}
                      className='text-destructive focus:text-destructive'
                    >
                      <TrashIcon className='mr-2 h-4 w-4' />
                      Ta bort
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Meta row */}
            <div className='text-muted-foreground mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm'>
              <span className='inline-flex items-center gap-1'>
                <MapPinIcon className='h-3.5 w-3.5' />
                {internship.city}
              </span>

              {internship.workplaceType && (
                <span className='inline-flex items-center gap-1'>
                  {WORKPLACE_LABELS[internship.workplaceType] ?? internship.workplaceType}
                </span>
              )}

              <span className='inline-flex items-center gap-1'>
                <Badge variant='outline' className='px-1.5 py-0 text-[11px] font-normal'>
                  {TYPE_LABELS[internship.internshipType] ?? internship.internshipType}
                </Badge>
              </span>

              {internship.duration && (
                <span className='inline-flex items-center gap-1'>
                  <ClockIcon className='h-3.5 w-3.5' />
                  {internship.duration}
                </span>
              )}

              <span className='inline-flex items-center gap-1'>
                <UsersIcon className='h-3.5 w-3.5' />
                {internship.spots} {internship.spots === 1 ? 'plats' : 'platser'}
              </span>

              {deadlineDate && (
                <span className='inline-flex items-center gap-1'>
                  <CalendarIcon className='h-3.5 w-3.5' />
                  Sista dag: {deadlineDate}
                </span>
              )}
            </div>

            {/* Footer row */}
            <div className='text-muted-foreground mt-3 flex items-center justify-between border-t pt-3 text-xs'>
              <span>Skapad {createdDate}</span>
              {canPublish && (
                <Button
                  variant='outline'
                  size='sm'
                  className='h-7 text-xs'
                  disabled={publishMutation.isPending}
                  onClick={() =>
                    publishMutation.mutate({
                      id: internship.$id,
                      data: { status: 'published' }
                    })
                  }
                >
                  <SendIcon className='mr-1.5 h-3 w-3' />
                  Publicera
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Card List ───────────────────────────────────────────

interface InternshipCardListProps {
  companyId?: string;
}

export function InternshipCardList({ companyId }: Readonly<InternshipCardListProps>) {
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [params, setParams] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(10),
    name: parseAsString,
    status: parseAsString
  });

  const activeStatus = params.status ?? '';

  const filters = {
    page: params.page,
    limit: params.perPage,
    ...(params.name && { search: params.name }),
    ...(activeStatus && { status: activeStatus }),
    ...(companyId && { companyId })
  };

  const { data } = useSuspenseQuery(internshipsQueryOptions(filters));

  const deleteMutation = useMutation({
    ...deleteInternshipMutation,
    onSuccess: () => {
      toast.success('Praktikplats borttagen.');
      setDeleteId(null);
    },
    onError: () => {
      toast.error('Kunde inte ta bort praktikplats.');
    }
  });

  const totalPages = Math.ceil(data.total / params.perPage);

  const activeTabLabel =
    STATUS_TABS.find((t) => t.value === activeStatus)?.label.toLowerCase() ?? '';

  return (
    <div className='space-y-0'>
      {/* Delete modal */}
      <AlertModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        loading={deleteMutation.isPending}
      />

      {/* Status tabs */}
      <StatusTabs
        activeStatus={activeStatus}
        onSelect={(status) => void setParams({ status: status || null, page: 1 })}
      />

      {/* Listing cards or empty state */}
      {data.internships.length === 0 ? (
        <EmptyState statusLabel={activeTabLabel} />
      ) : (
        <div className='space-y-3 pt-5'>
          {data.internships.map((internship) => (
            <ListingCard key={internship.$id} internship={internship} onDelete={setDeleteId} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className='flex items-center justify-between pt-4'>
          <p className='text-muted-foreground text-sm'>
            Sida {params.page} av {totalPages}
          </p>
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              disabled={params.page <= 1}
              onClick={() => void setParams({ page: params.page - 1 })}
            >
              <ChevronLeftIcon className='mr-1 h-4 w-4' />
              Föregående
            </Button>
            <Button
              variant='outline'
              size='sm'
              disabled={params.page >= totalPages}
              onClick={() => void setParams({ page: params.page + 1 })}
            >
              Nästa
              <ChevronRightIcon className='ml-1 h-4 w-4' />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function InternshipCardListSkeleton() {
  return (
    <div className='space-y-0'>
      {/* Tab skeleton */}
      <div className='flex gap-0 border-b'>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className='mx-4 my-3 h-4 w-16' />
        ))}
      </div>
      <div className='space-y-3 pt-5'>
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className='p-5'>
              <div className='flex items-start gap-4'>
                <Skeleton className='h-12 w-12 rounded-lg' />
                <div className='flex-1 space-y-3'>
                  <div className='flex items-start justify-between'>
                    <div className='space-y-1.5'>
                      <Skeleton className='h-5 w-48' />
                      <Skeleton className='h-4 w-32' />
                    </div>
                    <Skeleton className='h-6 w-20 rounded-full' />
                  </div>
                  <div className='flex gap-4'>
                    <Skeleton className='h-4 w-24' />
                    <Skeleton className='h-4 w-16' />
                    <Skeleton className='h-4 w-20' />
                  </div>
                  <Skeleton className='h-px w-full' />
                  <Skeleton className='h-4 w-32' />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
