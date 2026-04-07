'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Icons } from '@/components/icons';
import type { Application } from '../../api/types';

const STATUS_LABELS: Record<string, string> = {
  submitted: 'Inskickad',
  reviewed: 'Granskad',
  interview: 'Intervju',
  accepted: 'Accepterad',
  rejected: 'Avvisad',
  withdrawn: 'Indragen'
};

const CV_ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
const CV_PROJECT = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '';
const CV_BUCKET = 'cvs';

function getCvDownloadUrl(fileId: string) {
  return `${CV_ENDPOINT}/storage/buckets/${CV_BUCKET}/files/${fileId}/download?project=${CV_PROJECT}`;
}

interface ApplicationDetailSheetProps {
  application: Application | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ApplicationDetailSheet({
  application,
  open,
  onOpenChange
}: Readonly<ApplicationDetailSheetProps>) {
  if (!application) return null;

  const statusMap: Record<string, 'default' | 'destructive' | 'secondary' | 'outline'> = {
    accepted: 'default',
    rejected: 'destructive',
    interview: 'secondary'
  };
  const statusVariant = statusMap[application.status] ?? 'outline';

  const UserIcon = Icons.user;
  const CalendarIcon = Icons.calendar;
  const MailIcon = Icons.mail;
  const FileIcon = Icons.fileTypePdf;
  const DownloadIcon = Icons.download;
  const BriefcaseIcon = Icons.briefcase;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='sm:max-w-lg overflow-y-auto'>
        <SheetHeader>
          <SheetTitle>Ansökningsdetaljer</SheetTitle>
          <SheetDescription>Granska ansökan och hantera status.</SheetDescription>
        </SheetHeader>

        <div className='mt-6 space-y-6'>
          {/* Applicant info */}
          <div className='flex items-center gap-4'>
            <div className='bg-primary/10 flex h-12 w-12 items-center justify-center rounded-full'>
              <UserIcon className='text-primary h-6 w-6' />
            </div>
            <div>
              <p className='text-lg font-semibold'>{application.studentName || 'Okänd sökande'}</p>
              <p className='text-muted-foreground text-sm'>Sökande</p>
            </div>
          </div>

          <Separator />

          {/* Internship info */}
          <div className='space-y-2'>
            <div className='flex items-center gap-2'>
              <BriefcaseIcon className='text-muted-foreground h-4 w-4' />
              <span className='text-sm font-medium'>Praktikplats</span>
            </div>
            <p className='text-sm'>{application.internshipTitle || application.internshipId}</p>
          </div>

          {/* Status */}
          <div className='space-y-2'>
            <span className='text-sm font-medium'>Status</span>
            <div>
              <Badge variant={statusVariant}>
                {STATUS_LABELS[application.status] || application.status}
              </Badge>
            </div>
          </div>

          {/* Applied date */}
          <div className='space-y-2'>
            <div className='flex items-center gap-2'>
              <CalendarIcon className='text-muted-foreground h-4 w-4' />
              <span className='text-sm font-medium'>Ansökningsdatum</span>
            </div>
            <p className='text-muted-foreground text-sm'>
              {new Date(application.appliedAt).toLocaleDateString('sv-SE', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>

          <Separator />

          {/* Message */}
          <div className='space-y-2'>
            <div className='flex items-center gap-2'>
              <MailIcon className='text-muted-foreground h-4 w-4' />
              <span className='text-sm font-medium'>Personligt brev</span>
            </div>
            {application.message ? (
              <p className='bg-muted rounded-lg p-4 text-sm whitespace-pre-wrap'>
                {application.message}
              </p>
            ) : (
              <p className='text-muted-foreground text-sm italic'>Inget meddelande bifogades.</p>
            )}
          </div>

          {/* CV */}
          <div className='space-y-2'>
            <div className='flex items-center gap-2'>
              <FileIcon className='text-muted-foreground h-4 w-4' />
              <span className='text-sm font-medium'>CV</span>
            </div>
            {application.cvFileId ? (
              <a
                href={getCvDownloadUrl(application.cvFileId)}
                target='_blank'
                rel='noopener noreferrer'
              >
                <Button variant='outline' size='sm' className='gap-2'>
                  <DownloadIcon className='h-4 w-4' />
                  Ladda ner CV
                </Button>
              </a>
            ) : (
              <p className='text-muted-foreground text-sm italic'>Inget CV bifogades.</p>
            )}
          </div>

          {/* Status note */}
          {application.statusNote && (
            <>
              <Separator />
              <div className='space-y-2'>
                <span className='text-sm font-medium'>Statusanteckning</span>
                <p className='bg-muted rounded-lg p-4 text-sm whitespace-pre-wrap'>
                  {application.statusNote}
                </p>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
