'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@/hooks/use-auth';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { journalListOptions, journalKeys } from '../api/queries';
import { createJournalEntry, updateJournalEntry, deleteJournalEntry } from '../api/service';
import type { JournalEntryDoc, JournalEntryPayload } from '../api/types';

// ─── Helpers ──────────────────────────────────────────────────

function getCurrentWeekNumber(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - start.getTime();
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  return Math.ceil(diff / oneWeek);
}

const MOOD_OPTIONS = [
  { value: 'great', label: '🔥 Fantastiskt', color: 'text-green-600' },
  { value: 'good', label: '😊 Bra', color: 'text-blue-600' },
  { value: 'okay', label: '😐 Okej', color: 'text-amber-600' },
  { value: 'tough', label: '😓 Tufft', color: 'text-red-600' }
] as const;

// ─── New Entry Dialog ─────────────────────────────────────────

export function NewEntryDialog() {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [mood, setMood] = useState<JournalEntryPayload['mood']>('good');
  const [highlights, setHighlights] = useState('');

  const mutation = useMutation({
    mutationFn: (data: JournalEntryPayload) => createJournalEntry(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: journalKeys.all });
      setOpen(false);
      setMood('good');
      setHighlights('');
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const content = formData.get('content') as string;
    const challenges = formData.get('challenges') as string;
    const learnings = formData.get('learnings') as string;
    const weekStr = formData.get('weekNumber') as string;

    if (!content?.trim()) return;

    mutation.mutate({
      weekNumber: parseInt(weekStr) || getCurrentWeekNumber(),
      year: new Date().getFullYear(),
      content: content.trim(),
      highlights: highlights
        .split('\n')
        .map((h) => h.trim())
        .filter(Boolean),
      challenges: challenges?.trim() || '',
      learnings: learnings?.trim() || '',
      mood
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Icons.add className='mr-2 h-4 w-4' />
          Nytt inlägg
        </Button>
      </DialogTrigger>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-[600px]'>
        <DialogHeader>
          <DialogTitle>Nytt dagboksinlägg</DialogTitle>
          <DialogDescription>
            Skriv ner vad du har gjort under veckan — perfekt underlag för examensarbetet.
          </DialogDescription>
        </DialogHeader>
        <form id='journal-form' className='grid gap-4 py-4' onSubmit={handleSubmit}>
          <div className='grid grid-cols-2 gap-4'>
            <div className='grid gap-2'>
              <Label htmlFor='weekNumber'>Vecka</Label>
              <Input
                id='weekNumber'
                name='weekNumber'
                type='number'
                min={1}
                max={53}
                defaultValue={getCurrentWeekNumber()}
              />
            </div>
            <div className='grid gap-2'>
              <Label>Känsla</Label>
              <Select value={mood} onValueChange={(v) => setMood(v as JournalEntryPayload['mood'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MOOD_OPTIONS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='grid gap-2'>
            <Label htmlFor='content'>Vad har du gjort denna vecka?</Label>
            <Textarea
              id='content'
              name='content'
              placeholder='Beskriv vad du har arbetat med, vilka uppgifter du fått, vilka verktyg du använt...'
              className='min-h-[120px]'
              required
            />
          </div>

          <div className='grid gap-2'>
            <Label htmlFor='highlights'>Höjdpunkter (en per rad)</Label>
            <Textarea
              id='highlights'
              value={highlights}
              onChange={(e) => setHighlights(e.target.value)}
              placeholder={
                'Löste en svår bugg\nFick positiv feedback från handledare\nLärde mig Docker'
              }
              className='min-h-[80px]'
            />
          </div>

          <div className='grid gap-2'>
            <Label htmlFor='challenges'>Utmaningar</Label>
            <Textarea
              id='challenges'
              name='challenges'
              placeholder='Vad var svårt? Vad behöver du mer hjälp med?'
              className='min-h-[60px]'
            />
          </div>

          <div className='grid gap-2'>
            <Label htmlFor='learnings'>Lärdomar</Label>
            <Textarea
              id='learnings'
              name='learnings'
              placeholder='Vad har du lärt dig som du inte kunde innan?'
              className='min-h-[60px]'
            />
          </div>
        </form>
        <DialogFooter>
          <Button
            type='submit'
            form='journal-form'
            isLoading={mutation.isPending}
            disabled={mutation.isPending}
          >
            Spara inlägg
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Entry Card ───────────────────────────────────────────────

function EntryCard({ entry }: { entry: JournalEntryDoc }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [mood, setMood] = useState(entry.mood);
  const [highlights, setHighlights] = useState(entry.highlights.join('\n'));

  const updateMutation = useMutation({
    mutationFn: (data: Partial<JournalEntryPayload>) => updateJournalEntry(entry.$id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: journalKeys.all });
      setEditing(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteJournalEntry(entry.$id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: journalKeys.all });
    }
  });

  const moodInfo = MOOD_OPTIONS.find((m) => m.value === entry.mood) ?? MOOD_OPTIONS[1];

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateMutation.mutate({
      content: (formData.get('content') as string).trim(),
      challenges: (formData.get('challenges') as string).trim(),
      learnings: (formData.get('learnings') as string).trim(),
      highlights: highlights
        .split('\n')
        .map((h) => h.trim())
        .filter(Boolean),
      mood
    });
  };

  if (editing) {
    return (
      <Card>
        <CardContent className='pt-4'>
          <form className='grid gap-4' onSubmit={handleUpdate}>
            <div className='grid gap-2'>
              <Label>Känsla</Label>
              <Select value={mood} onValueChange={(v) => setMood(v as JournalEntryPayload['mood'])}>
                <SelectTrigger className='w-48'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MOOD_OPTIONS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='grid gap-2'>
              <Label>Veckans arbete</Label>
              <Textarea name='content' defaultValue={entry.content} className='min-h-[100px]' />
            </div>
            <div className='grid gap-2'>
              <Label>Höjdpunkter (en per rad)</Label>
              <Textarea
                value={highlights}
                onChange={(e) => setHighlights(e.target.value)}
                className='min-h-[60px]'
              />
            </div>
            <div className='grid gap-2'>
              <Label>Utmaningar</Label>
              <Textarea name='challenges' defaultValue={entry.challenges} />
            </div>
            <div className='grid gap-2'>
              <Label>Lärdomar</Label>
              <Textarea name='learnings' defaultValue={entry.learnings} />
            </div>
            <div className='flex gap-2'>
              <Button type='submit' size='sm' isLoading={updateMutation.isPending}>
                Spara
              </Button>
              <Button type='button' variant='outline' size='sm' onClick={() => setEditing(false)}>
                Avbryt
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <CardTitle className='text-base'>Vecka {entry.weekNumber}</CardTitle>
            <Badge variant='outline'>{entry.year}</Badge>
            <span className={moodInfo.color}>{moodInfo.label}</span>
          </div>
          <div className='flex items-center gap-1'>
            <Button
              variant='ghost'
              size='icon'
              className='h-7 w-7'
              onClick={() => setEditing(true)}
            >
              <Icons.edit className='h-4 w-4' />
            </Button>
            <Button
              variant='ghost'
              size='icon'
              className='text-destructive h-7 w-7'
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              <Icons.trash className='h-4 w-4' />
            </Button>
          </div>
        </div>
        <CardDescription>
          {new Date(entry.$createdAt).toLocaleDateString('sv-SE', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <p className='text-sm leading-relaxed whitespace-pre-wrap'>{entry.content}</p>

        {entry.highlights.length > 0 && (
          <>
            <Separator />
            <div>
              <h4 className='mb-2 text-sm font-medium'>Höjdpunkter</h4>
              <ul className='space-y-1'>
                {entry.highlights.map((h, i) => (
                  <li key={i} className='flex items-start gap-2 text-sm'>
                    <Icons.check className='text-muted-foreground mt-0.5 h-4 w-4 shrink-0' />
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        {entry.challenges && (
          <>
            <Separator />
            <div>
              <h4 className='mb-1 text-sm font-medium'>Utmaningar</h4>
              <p className='text-muted-foreground text-sm'>{entry.challenges}</p>
            </div>
          </>
        )}

        {entry.learnings && (
          <>
            <Separator />
            <div>
              <h4 className='mb-1 text-sm font-medium'>Lärdomar</h4>
              <p className='text-muted-foreground text-sm'>{entry.learnings}</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────

export default function LiaJournalPage() {
  const { user } = useUser();
  const userId = user?.$id ?? '';

  const { data: entries, isLoading } = useQuery(journalListOptions(userId));

  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-20'>
        <Icons.spinner className='text-muted-foreground h-8 w-8 animate-spin' />
      </div>
    );
  }

  const totalEntries = entries?.length ?? 0;
  const weeksCovered = new Set(entries?.map((e) => `${e.year}-${e.weekNumber}`)).size;

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <p className='text-muted-foreground text-sm'>
          {totalEntries} inlägg · {weeksCovered} veckor · v.{getCurrentWeekNumber()}
        </p>
        <NewEntryDialog />
      </div>

      {/* Entries */}
      {totalEntries === 0 ? (
        <div className='text-muted-foreground py-16 text-center text-sm'>
          <p>Ingen dagbok ännu.</p>
          <p className='mt-1'>Skapa ditt första inlägg för att börja dokumentera din LIA-period.</p>
        </div>
      ) : (
        <div className='space-y-4'>
          {entries?.map((entry) => (
            <EntryCard key={entry.$id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}
