'use client';

import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@/hooks/use-auth';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { liaNotesListOptions, liaNotesKeys } from '../api/queries';
import { createLiaNote, deleteLiaNote, updateLiaNote } from '../api/service';
import type { LiaNoteDoc } from '../api/types';

// ─── Note Card ────────────────────────────────────────────────

function NoteCard({ note }: { note: LiaNoteDoc }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => deleteLiaNote(note.$id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: liaNotesKeys.all })
  });

  const pinMutation = useMutation({
    mutationFn: () => updateLiaNote(note.$id, { pinned: !note.pinned }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: liaNotesKeys.all })
  });

  // Strip HTML tags for preview
  const plainText = note.content
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return (
    <Card
      className={`cursor-pointer transition-shadow hover:shadow-md ${note.pinned ? 'border-primary/40' : ''}`}
      onClick={() => router.push(`/dashboard/journal/notes/${note.$id}`)}
    >
      <CardContent className='pt-4'>
        <div className='flex items-start justify-between gap-2'>
          <div className='min-w-0 flex-1'>
            <div className='flex items-center gap-2'>
              {note.pinned && (
                <Icons.star className='h-3.5 w-3.5 shrink-0 fill-amber-500 text-amber-500' />
              )}
              <h3 className='truncate text-sm font-semibold'>
                {note.title || 'Namnlös anteckning'}
              </h3>
            </div>
            <p className='text-muted-foreground mt-1 text-xs'>
              {new Date(note.$updatedAt).toLocaleDateString('sv-SE', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
            {plainText && (
              <p className='text-muted-foreground mt-2 line-clamp-2 text-xs'>{plainText}</p>
            )}
          </div>
          <div className='flex items-center gap-0.5' onClick={(e) => e.stopPropagation()}>
            <Button
              variant='ghost'
              size='icon'
              className='h-7 w-7'
              onClick={() => pinMutation.mutate()}
              title={note.pinned ? 'Ta bort nål' : 'Nåla fast'}
            >
              <Icons.star
                className={`h-4 w-4 ${note.pinned ? 'fill-amber-500 text-amber-500' : ''}`}
              />
            </Button>
            <Button
              variant='ghost'
              size='icon'
              className='text-destructive h-7 w-7'
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              title='Ta bort'
            >
              <Icons.trash className='h-4 w-4' />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────

export default function LiaNotesPage() {
  const router = useRouter();
  const { user } = useUser();
  const userId = user?.$id ?? '';
  const queryClient = useQueryClient();

  const { data: notes, isLoading } = useQuery(liaNotesListOptions(userId));

  const createMutation = useMutation({
    mutationFn: () => createLiaNote({ title: '', content: '' }),
    onSuccess: (newNote) => {
      queryClient.invalidateQueries({ queryKey: liaNotesKeys.all });
      router.push(`/dashboard/journal/notes/${newNote.$id}`);
    }
  });

  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-20'>
        <Icons.spinner className='text-muted-foreground h-8 w-8 animate-spin' />
      </div>
    );
  }

  // Pinned first, then by update date
  const sorted = [...(notes ?? [])].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.$updatedAt).getTime() - new Date(a.$updatedAt).getTime();
  });

  return (
    <div className='space-y-6'>
      <div className='flex justify-end'>
        <Button onClick={() => createMutation.mutate()} isLoading={createMutation.isPending}>
          <Icons.add className='mr-2 h-4 w-4' />
          Ny anteckning
        </Button>
      </div>

      {sorted.length === 0 ? (
        <Card>
          <CardContent className='py-10 text-center'>
            <Icons.post className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
            <h3 className='text-lg font-semibold'>Inga anteckningar ännu</h3>
            <p className='text-muted-foreground mt-1 text-sm'>
              Klicka &quot;Ny anteckning&quot; för att börja skriva — precis som i Word.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {sorted.map((note) => (
            <NoteCard key={note.$id} note={note} />
          ))}
        </div>
      )}
    </div>
  );
}
