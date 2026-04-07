'use client';

import { useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { liaNotesDetailOptions, liaNotesKeys } from '../api/queries';
import { updateLiaNote, deleteLiaNote } from '../api/service';
import RichTextEditor from './rich-text-editor';

export default function NoteEditorPage({ noteId }: { noteId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const titleRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<string>('');
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: note, isLoading } = useQuery(liaNotesDetailOptions(noteId));

  const saveMutation = useMutation({
    mutationFn: (data: { title?: string; content?: string }) => updateLiaNote(noteId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: liaNotesKeys.all });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteLiaNote(noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: liaNotesKeys.all });
      router.push('/dashboard/journal/notes');
    }
  });

  // Auto-save with debounce
  const scheduleAutoSave = useCallback(
    (data: { title?: string; content?: string }) => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        saveMutation.mutate(data);
      }, 1000);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [noteId]
  );

  const handleContentUpdate = useCallback(
    (html: string) => {
      contentRef.current = html;
      scheduleAutoSave({
        title: titleRef.current?.value ?? '',
        content: html
      });
    },
    [scheduleAutoSave]
  );

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      scheduleAutoSave({
        title: e.target.value,
        content: contentRef.current
      });
    },
    [scheduleAutoSave]
  );

  if (isLoading) {
    return (
      <div className='flex h-full items-center justify-center'>
        <Icons.spinner className='text-muted-foreground h-8 w-8 animate-spin' />
      </div>
    );
  }

  if (!note) {
    return (
      <div className='flex h-full flex-col items-center justify-center gap-4'>
        <Icons.post className='text-muted-foreground h-12 w-12' />
        <p className='text-muted-foreground text-sm'>Anteckningen hittades inte.</p>
        <Button variant='outline' onClick={() => router.push('/dashboard/journal/notes')}>
          Tillbaka
        </Button>
      </div>
    );
  }

  // Initialize content ref
  if (!contentRef.current && note.content) {
    contentRef.current = note.content;
  }

  return (
    <div className='flex h-full flex-col'>
      {/* ─── Top bar ───────────────────────────────────── */}
      <div className='flex items-center justify-between border-b px-4 py-2'>
        <div className='flex items-center gap-2'>
          <Button
            variant='ghost'
            size='icon'
            className='h-8 w-8'
            onClick={() => router.push('/dashboard/journal/notes')}
            title='Tillbaka'
          >
            <Icons.arrowLeft className='h-4 w-4' />
          </Button>
          <Input
            ref={titleRef}
            defaultValue={note.title}
            onChange={handleTitleChange}
            placeholder='Namnlös anteckning'
            className='h-8 border-none bg-transparent text-base font-semibold shadow-none focus-visible:ring-0'
          />
        </div>
        <div className='flex items-center gap-2'>
          <span className='text-muted-foreground flex items-center gap-1 text-xs'>
            {saveMutation.isPending ? (
              <>
                <Icons.spinner className='h-3 w-3 animate-spin' />
                Sparar...
              </>
            ) : saveMutation.isSuccess ? (
              <>
                <Icons.check className='h-3 w-3' />
                Sparat
              </>
            ) : null}
          </span>
          <Button
            variant='ghost'
            size='icon'
            className='text-destructive h-8 w-8'
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
            title='Ta bort anteckning'
          >
            <Icons.trash className='h-4 w-4' />
          </Button>
        </div>
      </div>

      {/* ─── Editor (Word-like) ────────────────────────── */}
      <div className='bg-muted/30 flex flex-1 justify-center overflow-y-auto p-4 md:p-8'>
        <div className='w-full max-w-[816px]'>
          <RichTextEditor
            content={note.content}
            onUpdate={handleContentUpdate}
            className='shadow-sm'
          />
        </div>
      </div>
    </div>
  );
}
