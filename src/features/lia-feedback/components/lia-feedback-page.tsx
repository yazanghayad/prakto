'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@/hooks/use-auth';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { feedbackListOptions, feedbackKeys } from '../api/queries';
import { createFeedback, deleteFeedback } from '../api/service';
import type { FeedbackDoc } from '../api/types';

const TYPE_CONFIG = {
  positive: {
    label: 'Positiv',
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    icon: '👍'
  },
  improvement: {
    label: 'Förbättring',
    color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
    icon: '📈'
  }
};

const CAT_CONFIG: Record<string, string> = {
  technical: 'Teknisk',
  communication: 'Kommunikation',
  teamwork: 'Samarbete',
  other: 'Övrigt'
};

// ─── New Feedback Dialog ──────────────────────────────────────

function NewFeedbackDialog() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<'positive' | 'improvement'>('positive');
  const [category, setCategory] = useState('other');

  const mutation = useMutation({
    mutationFn: createFeedback,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feedbackKeys.all });
      setOpen(false);
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    mutation.mutate({
      date: fd.get('date') as string,
      from: fd.get('from') as string,
      type,
      content: fd.get('content') as string,
      category
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Icons.add className='mr-2 h-4 w-4' />
          Ny feedback
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle>Dokumentera feedback</DialogTitle>
        </DialogHeader>
        <form id='fb-form' className='grid gap-4 py-4' onSubmit={handleSubmit}>
          <div className='grid grid-cols-2 gap-4'>
            <div className='grid gap-2'>
              <Label htmlFor='fb-date'>Datum</Label>
              <Input
                id='fb-date'
                name='date'
                type='date'
                defaultValue={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='fb-from'>Från</Label>
              <Input id='fb-from' name='from' placeholder='T.ex. "Anna (handledare)"' required />
            </div>
          </div>
          <div className='grid grid-cols-2 gap-4'>
            <div className='grid gap-2'>
              <Label>Typ</Label>
              <Select value={type} onValueChange={(v) => setType(v as 'positive' | 'improvement')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='positive'>👍 Positiv</SelectItem>
                  <SelectItem value='improvement'>📈 Förbättring</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='grid gap-2'>
              <Label>Kategori</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CAT_CONFIG).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='fb-content'>Feedback</Label>
            <Textarea
              id='fb-content'
              name='content'
              placeholder='Vad sades?'
              className='min-h-[100px]'
              required
            />
          </div>
        </form>
        <DialogFooter>
          <Button type='submit' form='fb-form' isLoading={mutation.isPending}>
            Spara
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────

export default function LiaFeedbackPage() {
  const { user } = useUser();
  const userId = user?.$id ?? '';
  const queryClient = useQueryClient();
  const { data: items, isLoading } = useQuery(feedbackListOptions(userId));

  const deleteMut = useMutation({
    mutationFn: deleteFeedback,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: feedbackKeys.all })
  });

  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-20'>
        <Icons.spinner className='text-muted-foreground h-8 w-8 animate-spin' />
      </div>
    );
  }

  const sorted = [...(items ?? [])].sort((a, b) => b.date.localeCompare(a.date));
  const positiveCount = sorted.filter((f) => f.type === 'positive').length;
  const improvementCount = sorted.filter((f) => f.type === 'improvement').length;

  return (
    <div className='space-y-6'>
      <div className='flex justify-end'>
        <NewFeedbackDialog />
      </div>

      {/* ─ Stats ─ */}
      <div className='grid gap-4 sm:grid-cols-3'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-muted-foreground text-sm font-medium'>
              Total feedback
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-2xl font-bold'>{sorted.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-muted-foreground text-sm font-medium'>👍 Positiv</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-2xl font-bold text-green-600'>{positiveCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-muted-foreground text-sm font-medium'>
              📈 Förbättring
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-2xl font-bold text-amber-600'>{improvementCount}</p>
          </CardContent>
        </Card>
      </div>

      {sorted.length === 0 ? (
        <Card>
          <CardContent className='py-10 text-center'>
            <Icons.thumbUp className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
            <h3 className='text-lg font-semibold'>Ingen feedback loggad</h3>
            <p className='text-muted-foreground mt-1 text-sm'>
              Samla feedback från kollegor och handledare för att se din utveckling.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className='grid gap-4'>
          {sorted.map((fb) => (
            <Card key={fb.$id}>
              <CardContent className='pt-4'>
                <div className='flex items-start justify-between gap-2'>
                  <div className='flex items-center gap-2'>
                    <span className='text-lg'>{TYPE_CONFIG[fb.type]?.icon}</span>
                    <div>
                      <p className='text-sm font-semibold'>{fb.from}</p>
                      <p className='text-muted-foreground text-xs'>
                        {new Date(fb.date).toLocaleDateString('sv-SE', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Badge variant='outline' className={TYPE_CONFIG[fb.type]?.color}>
                      {TYPE_CONFIG[fb.type]?.label}
                    </Badge>
                    <Badge variant='secondary'>{CAT_CONFIG[fb.category] ?? fb.category}</Badge>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='text-destructive h-7 w-7'
                      onClick={() => deleteMut.mutate(fb.$id)}
                      disabled={deleteMut.isPending}
                    >
                      <Icons.trash className='h-4 w-4' />
                    </Button>
                  </div>
                </div>
                <p className='mt-3 text-sm leading-relaxed whitespace-pre-wrap'>{fb.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
