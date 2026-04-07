'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { internshipByIdOptions } from '../api/queries';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { INTERNSHIP_TYPE_LABELS } from '@/types/platform';
import { BookmarkButton } from '@/features/bookmarks/components/bookmark-button';

// ─── PascalCase icon aliases ───────────────────────────────────

const ArrowLeftIcon = Icons.arrowLeft;
const BuildingIcon = Icons.building;
const MapPinIcon = Icons.mapPin;
const ClockIcon = Icons.clock;
const CalendarIcon = Icons.calendar;
const UsersIcon = Icons.teams;
const BriefcaseIcon = Icons.briefcase;
const GlobeIcon = Icons.globe;
const MailIcon = Icons.mail;
const EditIcon = Icons.edit;
const ShareIcon = Icons.share;
const BookmarkIcon = Icons.bookmark;
const EyeIcon = Icons.eye;
const SendIcon = Icons.send;
const SchoolIcon = Icons.school;
const CheckIcon = Icons.check;

// ─── Labels ────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  draft: 'Utkast',
  pending_review: 'Väntar granskning',
  published: 'Publicerad',
  rejected: 'Avvisad',
  closed: 'Stängd'
};

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  draft: 'secondary',
  pending_review: 'outline',
  published: 'default',
  rejected: 'destructive',
  closed: 'secondary'
};

const WORKPLACE_LABELS: Record<string, string> = {
  on_site: 'På plats',
  remote: 'Distans',
  hybrid: 'Hybrid'
};

// ─── Content Tabs ─────────────────────────────────────────────

const CONTENT_TABS = [
  { value: 'about', label: 'Om rollen' },
  { value: 'requirements', label: 'Krav' },
  { value: 'details', label: 'Detaljer' }
] as const;

type ContentTab = (typeof CONTENT_TABS)[number]['value'];

// ─── Helper: Time ago ─────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Idag';
  if (diffDays === 1) return 'Igår';
  if (diffDays < 7) return `${diffDays} dagar sedan`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} ${weeks === 1 ? 'vecka' : 'veckor'} sedan`;
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} ${months === 1 ? 'månad' : 'månader'} sedan`;
  }
  return new Date(dateStr).toLocaleDateString('sv-SE');
}

// ─── Section renderer ─────────────────────────────────────────

function ContentSection({
  title,
  content,
  icon: SectionIcon
}: Readonly<{
  title: string;
  content: string;
  icon: React.ComponentType<{ className?: string }>;
}>) {
  if (!content) return null;

  // Split content by newlines and render as list items if lines start with -/•/*
  const lines = content.split('\n').filter((l) => l.trim());
  const isList = lines.some((l) => /^[-•*]\s/.test(l.trim()));

  return (
    <div className='space-y-3'>
      <div className='flex items-center gap-2'>
        <SectionIcon className='text-muted-foreground h-4.5 w-4.5' />
        <h3 className='text-base font-semibold'>{title}</h3>
      </div>
      {isList ? (
        <ul className='space-y-2 pl-1'>
          {lines.map((line) => {
            const text = line.replace(/^[-•*]\s*/, '').trim();
            return (
              <li key={text} className='flex items-start gap-2.5 text-sm leading-relaxed'>
                <CheckIcon className='text-primary mt-0.5 h-4 w-4 shrink-0' />
                <span>{text}</span>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className='text-sm leading-relaxed whitespace-pre-wrap'>{content}</div>
      )}
    </div>
  );
}

// ─── Detail row ───────────────────────────────────────────────

function DetailRow({
  icon: RowIcon,
  label,
  value
}: Readonly<{
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number | undefined | null;
}>) {
  if (!value) return null;
  return (
    <div className='flex items-center gap-3 py-2.5'>
      <div className='bg-muted flex h-9 w-9 shrink-0 items-center justify-center rounded-lg'>
        <RowIcon className='text-muted-foreground h-4 w-4' />
      </div>
      <div className='min-w-0 flex-1'>
        <p className='text-muted-foreground text-xs'>{label}</p>
        <p className='truncate text-sm font-medium'>{String(value)}</p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────

interface InternshipPostViewProps {
  id: string;
  isOwner?: boolean;
  onApply?: () => void;
}

export function InternshipPostView({
  id,
  isOwner = false,
  onApply
}: Readonly<InternshipPostViewProps>) {
  const router = useRouter();
  const { data: internship } = useSuspenseQuery(internshipByIdOptions(id));
  const [activeTab, setActiveTab] = useState<ContentTab>('about');

  const postedAgo = timeAgo(internship.createdAt);

  const deadlineDate = internship.applicationDeadline
    ? new Date(internship.applicationDeadline).toLocaleDateString('sv-SE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : null;

  const startDateFormatted = internship.startDate
    ? new Date(internship.startDate).toLocaleDateString('sv-SE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : null;

  return (
    <div className='space-y-4'>
      {/* ── Back button ─────────────────────────────────── */}
      <button
        type='button'
        onClick={() => router.back()}
        className='text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors'
      >
        <ArrowLeftIcon className='h-4 w-4' />
        Tillbaka
      </button>

      {/* ── Main post card ──────────────────────────────── */}
      <Card className='overflow-hidden border'>
        {/* Header banner */}
        <div className='from-primary/8 to-primary/3 relative h-20 bg-gradient-to-r'>
          <div className='absolute -bottom-6 left-6'>
            <div className='bg-background flex h-14 w-14 items-center justify-center rounded-xl border-2 shadow-sm'>
              <BuildingIcon className='text-muted-foreground h-7 w-7' />
            </div>
          </div>
        </div>

        <CardContent className='pt-10 pb-0'>
          {/* ── Title area ──────────────────────────── */}
          <div className='flex items-start justify-between gap-4'>
            <div className='min-w-0 flex-1'>
              <h1 className='text-xl font-bold leading-tight'>{internship.title}</h1>
              <div className='mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm'>
                <span className='font-medium'>{internship.companyName || 'Företag'}</span>
                <span className='text-muted-foreground'>·</span>
                <span className='text-muted-foreground inline-flex items-center gap-1'>
                  <MapPinIcon className='h-3.5 w-3.5' />
                  {internship.city}
                </span>
                {internship.workplaceType && (
                  <>
                    <span className='text-muted-foreground'>·</span>
                    <span className='text-muted-foreground'>
                      {WORKPLACE_LABELS[internship.workplaceType] ?? internship.workplaceType}
                    </span>
                  </>
                )}
              </div>

              {/* Tags row */}
              <div className='mt-3 flex flex-wrap items-center gap-2'>
                <Badge variant={STATUS_VARIANTS[internship.status] ?? 'secondary'}>
                  {STATUS_LABELS[internship.status] ?? internship.status}
                </Badge>
                <Badge variant='outline'>
                  {INTERNSHIP_TYPE_LABELS[internship.internshipType] ?? internship.internshipType}
                </Badge>
                {internship.spots > 0 && (
                  <Badge variant='outline' className='gap-1'>
                    <UsersIcon className='h-3 w-3' />
                    {internship.spots} {internship.spots === 1 ? 'plats' : 'platser'}
                  </Badge>
                )}
              </div>

              {/* Posted / deadline row */}
              <p className='text-muted-foreground mt-3 text-xs'>
                Publicerad {postedAgo}
                {deadlineDate && <> · Sista ansökningsdag: {deadlineDate}</>}
              </p>
            </div>

            {/* Action buttons */}
            <div className='flex shrink-0 items-center gap-2'>
              <BookmarkButton internshipId={id} />
              <Button variant='ghost' size='icon' className='h-9 w-9'>
                <ShareIcon className='h-4.5 w-4.5' />
                <span className='sr-only'>Dela</span>
              </Button>
              {isOwner && (
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => router.push(`/dashboard/listings/${id}?edit=true`)}
                >
                  <EditIcon className='mr-1.5 h-4 w-4' />
                  Redigera
                </Button>
              )}
            </div>
          </div>

          {/* ── Content tabs ────────────────────────── */}
          <div className='mt-6 border-b'>
            <nav className='-mb-px flex gap-0'>
              {CONTENT_TABS.map((tab) => {
                const isActive = activeTab === tab.value;
                return (
                  <button
                    key={tab.value}
                    type='button'
                    onClick={() => setActiveTab(tab.value)}
                    className={cn(
                      'relative px-4 py-2.5 text-sm font-medium transition-colors',
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
        </CardContent>

        {/* ── Tab content ───────────────────────────── */}
        <CardContent className='pt-6 pb-8'>
          {activeTab === 'about' && (
            <div className='space-y-6'>
              <ContentSection
                title='Beskrivning'
                content={internship.description}
                icon={BriefcaseIcon}
              />
              {internship.responsibilities && (
                <>
                  <Separator />
                  <ContentSection
                    title='Ansvarsområden'
                    content={internship.responsibilities}
                    icon={ClockIcon}
                  />
                </>
              )}
            </div>
          )}

          {activeTab === 'requirements' && (
            <div className='space-y-6'>
              {internship.requirements ? (
                <ContentSection title='Krav' content={internship.requirements} icon={SchoolIcon} />
              ) : (
                <p className='text-muted-foreground py-8 text-center text-sm'>
                  Inga specifika krav har angetts.
                </p>
              )}
              {internship.preferredQualifications && (
                <>
                  <Separator />
                  <ContentSection
                    title='Meriterande'
                    content={internship.preferredQualifications}
                    icon={CheckIcon}
                  />
                </>
              )}
              {internship.educationLevel && (
                <>
                  <Separator />
                  <div className='flex items-center gap-3'>
                    <div className='bg-muted flex h-9 w-9 items-center justify-center rounded-lg'>
                      <SchoolIcon className='text-muted-foreground h-4 w-4' />
                    </div>
                    <div>
                      <p className='text-muted-foreground text-xs'>Utbildningsnivå</p>
                      <p className='text-sm font-medium'>{internship.educationLevel}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'details' && (
            <div className='space-y-1'>
              <DetailRow
                icon={BriefcaseIcon}
                label='Typ'
                value={
                  INTERNSHIP_TYPE_LABELS[internship.internshipType] ?? internship.internshipType
                }
              />
              <DetailRow icon={MapPinIcon} label='Ort' value={internship.city} />
              <DetailRow
                icon={GlobeIcon}
                label='Arbetsplats'
                value={WORKPLACE_LABELS[internship.workplaceType] ?? internship.workplaceType}
              />
              <DetailRow icon={UsersIcon} label='Antal platser' value={internship.spots} />
              <DetailRow icon={ClockIcon} label='Varaktighet' value={internship.duration} />
              <DetailRow icon={CalendarIcon} label='Startdatum' value={startDateFormatted} />
              <DetailRow icon={CalendarIcon} label='Sista ansökningsdag' value={deadlineDate} />
              <DetailRow icon={MailIcon} label='Kontakt' value={internship.contactEmail} />
              <DetailRow
                icon={EyeIcon}
                label='Ansökningsmetod'
                value={internship.applicationMethod}
              />

              {/* Requirements tags */}
              {(internship.cvRequired || internship.coverLetterRequired) && (
                <>
                  <Separator className='my-2' />
                  <div className='space-y-2 pt-1'>
                    <p className='text-muted-foreground text-xs font-medium uppercase tracking-wider'>
                      Ansökningskrav
                    </p>
                    <div className='flex flex-wrap gap-2'>
                      {internship.cvRequired && (
                        <Badge variant='secondary' className='gap-1'>
                          <CheckIcon className='h-3 w-3' />
                          CV krävs
                        </Badge>
                      )}
                      {internship.coverLetterRequired && (
                        <Badge variant='secondary' className='gap-1'>
                          <CheckIcon className='h-3 w-3' />
                          Personligt brev krävs
                        </Badge>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Screening questions */}
              {internship.screeningQuestions && internship.screeningQuestions.length > 0 && (
                <>
                  <Separator className='my-2' />
                  <div className='space-y-2 pt-1'>
                    <p className='text-muted-foreground text-xs font-medium uppercase tracking-wider'>
                      Urvalsfrågor
                    </p>
                    <ul className='space-y-1.5'>
                      {internship.screeningQuestions.map((q: string) => (
                        <li key={q} className='text-sm flex items-start gap-2'>
                          <span className='text-primary mt-1'>•</span>
                          {q}
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Bottom action bar (for students) ───────── */}
      {!isOwner && internship.status === 'published' && (
        <Card className='border'>
          <CardContent className='flex items-center justify-between p-4'>
            <div>
              <p className='text-sm font-medium'>Intresserad av denna praktikplats?</p>
              <p className='text-muted-foreground text-xs'>Skicka in din ansökan redan idag.</p>
            </div>
            <Button size='lg' className='px-8' onClick={onApply}>
              <SendIcon className='mr-2 h-4 w-4' />
              Ansök nu
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
