'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@/hooks/use-auth';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { meetingListOptions, meetingKeys } from '../api/queries';
import { createMeeting, deleteMeeting, updateMeeting } from '../api/service';
import type { MentorMeetingDoc } from '../api/types';

// ─── New Meeting Dialog ───────────────────────────────────────

function NewMeetingDialog() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const mutation = useMutation({
    mutationFn: createMeeting,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meetingKeys.all });
      setOpen(false);
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    mutation.mutate({
      date: fd.get('date') as string,
      summary: (fd.get('summary') as string) ?? '',
      feedback: (fd.get('feedback') as string) ?? '',
      actions: (fd.get('actions') as string) ?? '',
      nextSteps: (fd.get('nextSteps') as string) ?? ''
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Icons.add className='mr-2 h-4 w-4' />
          Nytt möte
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[540px]'>
        <DialogHeader>
          <DialogTitle>Dokumentera handledarmöte</DialogTitle>
        </DialogHeader>
        <form id='meeting-form' className='grid gap-4 py-4' onSubmit={handleSubmit}>
          <div className='grid gap-2'>
            <Label htmlFor='m-date'>Datum</Label>
            <Input
              id='m-date'
              name='date'
              type='date'
              defaultValue={new Date().toISOString().split('T')[0]}
              required
            />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='m-summary'>Sammanfattning</Label>
            <Textarea
              id='m-summary'
              name='summary'
              placeholder='Vad diskuterades?'
              className='min-h-[80px]'
            />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='m-feedback'>Feedback från handledare</Label>
            <Textarea
              id='m-feedback'
              name='feedback'
              placeholder='Positiv och konstruktiv feedback'
              className='min-h-[60px]'
            />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='m-actions'>Överenskomna åtgärder</Label>
            <Textarea
              id='m-actions'
              name='actions'
              placeholder='Vad ska göras före nästa möte?'
              className='min-h-[60px]'
            />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='m-next'>Nästa steg</Label>
            <Input id='m-next' name='nextSteps' placeholder='T.ex. "Möte igen 18 april"' />
          </div>
        </form>
        <DialogFooter>
          <Button type='submit' form='meeting-form' isLoading={mutation.isPending}>
            Spara
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Meeting Card ─────────────────────────────────────────────

function MeetingCard({ meeting }: { meeting: MentorMeetingDoc }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);

  const updateMut = useMutation({
    mutationFn: (d: Partial<MentorMeetingDoc>) => updateMeeting(meeting.$id, d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meetingKeys.all });
      setEditing(false);
    }
  });

  const deleteMut = useMutation({
    mutationFn: () => deleteMeeting(meeting.$id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: meetingKeys.all })
  });

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    updateMut.mutate({
      summary: fd.get('summary') as string,
      feedback: fd.get('feedback') as string,
      actions: fd.get('actions') as string,
      nextSteps: fd.get('nextSteps') as string
    });
  };

  if (editing) {
    return (
      <Card>
        <CardContent className='pt-4'>
          <form className='grid gap-3' onSubmit={handleUpdate}>
            <Textarea name='summary' defaultValue={meeting.summary} placeholder='Sammanfattning' />
            <Textarea name='feedback' defaultValue={meeting.feedback} placeholder='Feedback' />
            <Textarea name='actions' defaultValue={meeting.actions} placeholder='Åtgärder' />
            <Input name='nextSteps' defaultValue={meeting.nextSteps} placeholder='Nästa steg' />
            <div className='flex gap-2'>
              <Button type='submit' size='sm' isLoading={updateMut.isPending}>
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
      <CardContent className='pt-4'>
        <div className='flex items-start justify-between'>
          <div>
            <p className='text-sm font-semibold'>
              {new Date(meeting.date).toLocaleDateString('sv-SE', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </p>
          </div>
          <div className='flex gap-0.5'>
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
              onClick={() => deleteMut.mutate()}
              disabled={deleteMut.isPending}
            >
              <Icons.trash className='h-4 w-4' />
            </Button>
          </div>
        </div>

        {meeting.summary && (
          <div className='mt-3'>
            <p className='text-muted-foreground mb-1 text-xs font-medium uppercase'>
              Sammanfattning
            </p>
            <p className='text-sm whitespace-pre-wrap'>{meeting.summary}</p>
          </div>
        )}
        {meeting.feedback && (
          <div className='mt-3'>
            <p className='text-muted-foreground mb-1 text-xs font-medium uppercase'>Feedback</p>
            <p className='text-sm whitespace-pre-wrap'>{meeting.feedback}</p>
          </div>
        )}
        {meeting.actions && (
          <div className='mt-3'>
            <p className='text-muted-foreground mb-1 text-xs font-medium uppercase'>Åtgärder</p>
            <p className='text-sm whitespace-pre-wrap'>{meeting.actions}</p>
          </div>
        )}
        {meeting.nextSteps && (
          <div className='mt-3'>
            <p className='text-muted-foreground mb-1 text-xs font-medium uppercase'>Nästa steg</p>
            <p className='text-sm'>{meeting.nextSteps}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────

export default function LiaMeetingsPage() {
  const { user } = useUser();
  const userId = user?.$id ?? '';
  const { data: meetings, isLoading } = useQuery(meetingListOptions(userId));

  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-20'>
        <Icons.spinner className='text-muted-foreground h-8 w-8 animate-spin' />
      </div>
    );
  }

  const sorted = [...(meetings ?? [])].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className='space-y-6'>
      <div className='flex justify-end'>
        <NewMeetingDialog />
      </div>

      {sorted.length === 0 ? (
        <Card>
          <CardContent className='py-10 text-center'>
            <Icons.mentorChat className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
            <h3 className='text-lg font-semibold'>Inga möten dokumenterade</h3>
            <p className='text-muted-foreground mt-1 text-sm'>
              Dokumentera möten med din handledare för att spåra feedback och åtgärder.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className='grid gap-4'>
          {sorted.map((m) => (
            <MeetingCard key={m.$id} meeting={m} />
          ))}
        </div>
      )}
    </div>
  );
}
