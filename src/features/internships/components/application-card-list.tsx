'use client';

import { useState } from 'react';
import { useSuspenseQuery, useMutation } from '@tanstack/react-query';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { toast } from 'sonner';
import { applicationsQueryOptions } from '../api/queries';
import { updateApplicationStatusMutation } from '../api/mutations';
import type { Application } from '../api/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';

// ─── Icon aliases (PascalCase for JSX) ─────────────────────────

const MoreIcon = Icons.ellipsis;
const ChevronLeftIcon = Icons.chevronLeft;
const ChevronRightIcon = Icons.chevronRight;
const DownloadIcon = Icons.download;

// ─── Labels ────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  submitted: 'Ny',
  reviewed: 'Granskad',
  interview: 'Intervju',
  accepted: 'Accepterad',
  rejected: 'Avvisad',
  withdrawn: 'Indragen'
};

const STATUS_CLASS: Record<string, string> = {
  submitted: 'bg-muted',
  reviewed: 'bg-muted',
  interview: 'bg-muted',
  accepted: 'bg-muted',
  rejected: 'bg-muted',
  withdrawn: 'bg-muted'
};

// ─── Helpers ───────────────────────────────────────────────────

const AW = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
const AW_PROJECT = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '';

function cvUrl(fileId: string) {
  return `${AW}/storage/buckets/cvs/files/${fileId}/download?project=${AW_PROJECT}`;
}

function initials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + (parts.at(-1)?.[0] ?? '')).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function relativeTime(dateStr: string): string {
  const ms = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return 'nyss';
  if (min < 60) return `${min}m`;
  const h = Math.floor(ms / 3600000);
  if (h < 24) return `${h}h`;
  const d = Math.floor(ms / 86400000);
  if (d < 30) return `${d}d`;
  return `${Math.floor(d / 30)}mån`;
}

// ─── Status filter tabs ────────────────────────────────────────

const TABS = [
  { value: '', label: 'Alla' },
  { value: 'submitted', label: 'Nya' },
  { value: 'reviewed', label: 'Granskade' },
  { value: 'interview', label: 'Intervju' },
  { value: 'accepted', label: 'Accepterade' },
  { value: 'rejected', label: 'Avvisade' }
] as const;

function Tabs({ active, onSelect }: Readonly<{ active: string; onSelect: (v: string) => void }>) {
  return (
    <div className='border-b'>
      <nav className='-mb-px flex gap-0 overflow-x-auto'>
        {TABS.map((t) => (
          <button
            key={t.value}
            type='button'
            onClick={() => onSelect(t.value)}
            className={cn(
              'relative px-4 py-2.5 text-[13px] font-medium whitespace-nowrap transition-colors',
              active === t.value ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {t.label}
            {active === t.value && (
              <span className='bg-foreground absolute inset-x-0 bottom-0 h-[2px]' />
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}

// ─── Applicant Card ────────────────────────────────────────────

function ApplicantCard({ application }: Readonly<{ application: Application }>) {
  const [open, setOpen] = useState(false);

  const mutation = useMutation({
    ...updateApplicationStatusMutation,
    onSuccess: () => toast.success('Status uppdaterad.'),
    onError: () => toast.error('Kunde inte uppdatera status.')
  });

  const name = application.studentName || 'Okänd';
  const canAct = application.status === 'submitted' || application.status === 'reviewed';

  return (
    <Card className='flex h-full flex-col overflow-hidden'>
      {/* Card body */}
      <div className='flex flex-1 flex-col p-4'>
        {/* Row 1: avatar · name · status */}
        <div className='flex items-center gap-3'>
          <div className='bg-muted text-muted-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold select-none'>
            {initials(name)}
          </div>
          <div className='min-w-0 flex-1'>
            <p className='truncate text-sm font-semibold leading-tight'>{name}</p>
            <p className='text-muted-foreground truncate text-xs'>
              {application.internshipTitle || '–'}
            </p>
          </div>
          <span
            className={cn(
              'shrink-0 rounded-md px-2 py-0.5 text-[11px] font-medium',
              STATUS_CLASS[application.status] ?? 'bg-muted text-muted-foreground'
            )}
          >
            {STATUS_LABEL[application.status] || application.status}
          </span>
        </div>

        {/* Row 2: meta */}
        <div className='text-muted-foreground mt-3 flex items-center gap-3 text-[12px]'>
          <span>{relativeTime(application.appliedAt)} sedan</span>
          <span className='bg-border h-3 w-px' />
          <span>
            {new Date(application.appliedAt).toLocaleDateString('sv-SE', {
              day: 'numeric',
              month: 'short'
            })}
          </span>
          {application.cvFileId && (
            <>
              <span className='bg-border h-3 w-px' />
              <a
                href={cvUrl(application.cvFileId)}
                target='_blank'
                rel='noopener noreferrer'
                className='hover:text-foreground inline-flex items-center gap-1 transition-colors'
              >
                <DownloadIcon className='h-3 w-3' />
                CV
              </a>
            </>
          )}
        </div>

        {/* Row 3: message preview */}
        {application.message && !open && (
          <p className='text-muted-foreground mt-3 line-clamp-2 text-[13px] leading-relaxed'>
            {application.message}
          </p>
        )}

        {/* Expanded section */}
        {open && (
          <div className='mt-3 space-y-3'>
            <Separator />

            {/* Full message */}
            <div>
              <p className='mb-1 text-[12px] font-medium tracking-wide uppercase'>Meddelande</p>
              {application.message ? (
                <p className='text-[13px] leading-relaxed whitespace-pre-wrap'>
                  {application.message}
                </p>
              ) : (
                <p className='text-muted-foreground text-[13px]'>Inget meddelande.</p>
              )}
            </div>

            {/* CV */}
            {application.cvFileId && (
              <div>
                <p className='mb-1 text-[12px] font-medium tracking-wide uppercase'>Dokument</p>
                <a
                  href={cvUrl(application.cvFileId)}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-foreground hover:bg-muted inline-flex items-center gap-2 rounded-md border px-3 py-2 text-[13px] transition-colors'
                >
                  <DownloadIcon className='h-3.5 w-3.5' />
                  Ladda ner CV
                </a>
              </div>
            )}

            {/* Status note */}
            {application.statusNote && (
              <div>
                <p className='mb-1 text-[12px] font-medium tracking-wide uppercase'>Anteckning</p>
                <p className='text-muted-foreground text-[13px] whitespace-pre-wrap'>
                  {application.statusNote}
                </p>
              </div>
            )}

            {/* Actions */}
            {canAct && (
              <div className='flex flex-wrap gap-2 pt-1'>
                <Button
                  size='sm'
                  variant='outline'
                  className='h-7 text-xs'
                  disabled={mutation.isPending}
                  onClick={() => mutation.mutate({ id: application.$id, status: 'reviewed' })}
                >
                  Granskad
                </Button>
                <Button
                  size='sm'
                  variant='outline'
                  className='h-7 text-xs'
                  disabled={mutation.isPending}
                  onClick={() =>
                    mutation.mutate({
                      id: application.$id,
                      status: 'interview'
                    })
                  }
                >
                  Intervju
                </Button>
                <Button
                  size='sm'
                  className='h-7 text-xs'
                  disabled={mutation.isPending}
                  onClick={() =>
                    mutation.mutate({
                      id: application.$id,
                      status: 'accepted'
                    })
                  }
                >
                  Acceptera
                </Button>
                <Button
                  size='sm'
                  variant='ghost'
                  className='text-destructive h-7 text-xs'
                  disabled={mutation.isPending}
                  onClick={() =>
                    mutation.mutate({
                      id: application.$id,
                      status: 'rejected'
                    })
                  }
                >
                  Avslå
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Spacer pushes footer to bottom */}
        <div className='flex-1' />

        {/* Footer: toggle + quick actions */}
        <div className='mt-3 flex items-center justify-between border-t pt-3'>
          <button
            type='button'
            onClick={() => setOpen(!open)}
            className='text-muted-foreground hover:text-foreground text-xs transition-colors'
          >
            {open ? 'Dölj' : 'Visa mer'}
          </button>

          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <button
                type='button'
                className='text-muted-foreground hover:text-foreground transition-colors'
              >
                <MoreIcon className='h-4 w-4' />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-40'>
              {canAct && (
                <>
                  <DropdownMenuItem
                    onClick={() =>
                      mutation.mutate({
                        id: application.$id,
                        status: 'reviewed'
                      })
                    }
                  >
                    Markera granskad
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      mutation.mutate({
                        id: application.$id,
                        status: 'interview'
                      })
                    }
                  >
                    Bjud in till intervju
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() =>
                      mutation.mutate({
                        id: application.$id,
                        status: 'accepted'
                      })
                    }
                  >
                    Acceptera
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className='text-destructive'
                    onClick={() =>
                      mutation.mutate({
                        id: application.$id,
                        status: 'rejected'
                      })
                    }
                  >
                    Avslå
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Card>
  );
}

// ─── Main list ─────────────────────────────────────────────────

interface ApplicationCardListProps {
  companyId?: string;
}

export function ApplicationCardList({ companyId }: Readonly<ApplicationCardListProps>) {
  const [params, setParams] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(12),
    status: parseAsString
  });

  const activeStatus = params.status ?? '';

  const filters = {
    page: params.page,
    limit: params.perPage,
    ...(activeStatus && { status: activeStatus }),
    ...(companyId && { companyId })
  };

  const { data } = useSuspenseQuery(applicationsQueryOptions(filters));
  const totalPages = Math.ceil(data.total / params.perPage);

  return (
    <div>
      <Tabs
        active={activeStatus}
        onSelect={(s) => void setParams({ status: s || null, page: 1 })}
      />

      {data.total > 0 && (
        <p className='text-muted-foreground px-0.5 pt-4 pb-2 text-[13px]'>
          {data.total} {data.total === 1 ? 'ansökan' : 'ansökningar'}
        </p>
      )}

      {data.applications.length === 0 ? (
        <div className='py-20 text-center'>
          <p className='text-muted-foreground text-sm'>Inga ansökningar att visa.</p>
        </div>
      ) : (
        <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3'>
          {data.applications.map((a) => (
            <ApplicantCard key={a.$id} application={a} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className='flex items-center justify-between pt-4'>
          <span className='text-muted-foreground text-[13px]'>
            {params.page} / {totalPages}
          </span>
          <div className='flex gap-1'>
            <Button
              variant='ghost'
              size='icon'
              className='h-8 w-8'
              disabled={params.page <= 1}
              onClick={() => void setParams({ page: params.page - 1 })}
            >
              <ChevronLeftIcon className='h-4 w-4' />
            </Button>
            <Button
              variant='ghost'
              size='icon'
              className='h-8 w-8'
              disabled={params.page >= totalPages}
              onClick={() => void setParams({ page: params.page + 1 })}
            >
              <ChevronRightIcon className='h-4 w-4' />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function ApplicationCardListSkeleton() {
  return (
    <div>
      <div className='flex gap-0 border-b'>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className='mx-3 my-2.5 h-4 w-14' />
        ))}
      </div>
      <div className='grid grid-cols-1 gap-3 pt-4 sm:grid-cols-2 xl:grid-cols-3'>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className='p-4'>
            <div className='flex items-center gap-3'>
              <Skeleton className='h-10 w-10 rounded-full' />
              <div className='flex-1 space-y-1.5'>
                <Skeleton className='h-4 w-24' />
                <Skeleton className='h-3 w-36' />
              </div>
              <Skeleton className='h-5 w-14 rounded-md' />
            </div>
            <div className='mt-3 flex gap-3'>
              <Skeleton className='h-3 w-10' />
              <Skeleton className='h-3 w-16' />
            </div>
            <Skeleton className='mt-3 h-10 w-full rounded' />
            <div className='mt-3 flex items-center justify-between border-t pt-3'>
              <Skeleton className='h-3 w-14' />
              <Skeleton className='h-4 w-4 rounded' />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
