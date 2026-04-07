'use client';

import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createApplicationMutation } from '../api/mutations';
import type { Internship } from '../api/types';
import { useUser } from '@/hooks/use-auth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/icons';

const SendIcon = Icons.send;
const BriefcaseIcon = Icons.briefcase;
const MapPinIcon = Icons.mapPin;
const CheckIcon = Icons.circleCheck;
const UploadIcon = Icons.upload;
const FileIcon = Icons.post;
const TrashIcon = Icons.trash;
const SpinnerIcon = Icons.spinner;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ACCEPTED_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]);

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface ApplicationModalProps {
  internship: Internship;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ApplicationModal({
  internship,
  open,
  onOpenChange
}: Readonly<ApplicationModalProps>) {
  const { profile } = useUser();
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const mutation = useMutation({
    ...createApplicationMutation,
    onSuccess: () => {
      setSubmitted(true);
      toast.success('Din ansökan har skickats!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Kunde inte skicka ansökan.');
    }
  });

  async function handleSubmit() {
    if (!profile?.userId) {
      toast.error('Du måste vara inloggad för att ansöka.');
      return;
    }

    if (internship.cvRequired && !cvFile) {
      toast.error('Du måste ladda upp ditt CV.');
      return;
    }

    let cvFileId = '';

    // Upload CV via server-side API route
    if (cvFile) {
      try {
        setUploading(true);
        const formData = new FormData();
        formData.append('file', cvFile);

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Uppladdning misslyckades.');
        }

        const result = await res.json();
        cvFileId = result.fileId;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Kunde inte ladda upp CV.';
        toast.error(message);
        setUploading(false);
        return;
      } finally {
        setUploading(false);
      }
    }

    mutation.mutate({
      studentId: profile.userId,
      data: {
        internshipId: internship.$id,
        companyId: internship.companyId,
        cvFileId,
        message: message.trim() || undefined
      }
    });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.has(file.type)) {
      toast.error('Bara PDF- och Word-filer accepteras.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error('Filen är för stor. Max 10 MB.');
      return;
    }

    setCvFile(file);
  }

  function handleClose() {
    onOpenChange(false);
    setTimeout(() => {
      setSubmitted(false);
      setMessage('');
      setCvFile(null);
    }, 300);
  }

  const isPending = mutation.isPending || uploading;

  if (submitted) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className='sm:max-w-md'>
          <div className='flex flex-col items-center py-6 text-center'>
            <div className='bg-primary/10 mb-4 flex h-16 w-16 items-center justify-center rounded-full'>
              <CheckIcon className='text-primary h-8 w-8' />
            </div>
            <h3 className='mb-2 text-lg font-semibold'>Ansökan skickad!</h3>
            <p className='text-muted-foreground mb-6 text-sm'>
              Din ansökan till <span className='font-medium'>{internship.title}</span> har skickats.
              Du kan följa status under &quot;Mina ansökningar&quot;.
            </p>
            <Button onClick={handleClose} className='w-full'>
              Stäng
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Ansök till praktikplats</DialogTitle>
          <DialogDescription>
            Skicka din ansökan till företaget. Du kan följa status under &quot;Mina
            ansökningar&quot;.
          </DialogDescription>
        </DialogHeader>

        {/* Internship summary */}
        <div className='bg-muted/50 flex items-start gap-3 rounded-lg p-3'>
          <div className='bg-background flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border'>
            <BriefcaseIcon className='text-muted-foreground h-5 w-5' />
          </div>
          <div className='min-w-0'>
            <p className='text-sm font-medium leading-tight'>{internship.title}</p>
            <p className='text-muted-foreground mt-0.5 flex items-center gap-1 text-xs'>
              {internship.companyName || 'Företag'}
              <span>·</span>
              <MapPinIcon className='h-3 w-3' />
              {internship.city}
            </p>
          </div>
        </div>

        {/* CV Upload */}
        <div className='space-y-2'>
          <Label>
            Ladda upp CV{' '}
            {internship.cvRequired ? (
              <span className='text-destructive'>*</span>
            ) : (
              <span className='text-muted-foreground'>(valfritt)</span>
            )}
          </Label>

          <input
            ref={fileInputRef}
            type='file'
            accept='.pdf,.doc,.docx'
            onChange={handleFileChange}
            className='hidden'
          />

          {cvFile ? (
            <div className='bg-muted/50 flex items-center gap-3 rounded-lg border p-3'>
              <div className='bg-primary/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg'>
                <FileIcon className='text-primary h-5 w-5' />
              </div>
              <div className='min-w-0 flex-1'>
                <p className='truncate text-sm font-medium'>{cvFile.name}</p>
                <p className='text-muted-foreground text-xs'>{formatFileSize(cvFile.size)}</p>
              </div>
              <Button
                variant='ghost'
                size='icon'
                className='h-8 w-8 shrink-0'
                onClick={() => {
                  setCvFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
              >
                <TrashIcon className='h-4 w-4' />
                <span className='sr-only'>Ta bort fil</span>
              </Button>
            </div>
          ) : (
            <button
              type='button'
              onClick={() => fileInputRef.current?.click()}
              className='border-input hover:bg-muted/50 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-sm text-muted-foreground transition-colors'
            >
              <UploadIcon className='h-5 w-5' />
              <span>
                Klicka för att välja fil{' '}
                <span className='text-muted-foreground text-xs'>(PDF, DOC — max 10 MB)</span>
              </span>
            </button>
          )}
        </div>

        {/* Message */}
        <div className='space-y-2'>
          <Label htmlFor='application-message'>
            Meddelande till företaget <span className='text-muted-foreground'>(valfritt)</span>
          </Label>
          <Textarea
            id='application-message'
            placeholder='Berätta kort om dig själv och varför du är intresserad av denna praktikplats...'
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            maxLength={2000}
          />
          <p className='text-muted-foreground text-right text-xs'>{message.length}/2000</p>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)} disabled={isPending}>
            Avbryt
          </Button>
          <Button onClick={handleSubmit} disabled={isPending} isLoading={isPending}>
            {uploading ? (
              <>
                <SpinnerIcon className='mr-2 h-4 w-4 animate-spin' />
                Laddar upp...
              </>
            ) : (
              <>
                <SendIcon className='mr-2 h-4 w-4' />
                Skicka ansökan
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
