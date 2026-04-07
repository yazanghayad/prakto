'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@/hooks/use-auth';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
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
import { liaGoalsListOptions, liaGoalKeys } from '../api/queries';
import { createLiaGoal, updateLiaGoal, deleteLiaGoal } from '../api/service';
import type { LiaGoalDoc, LiaGoalPayload } from '../api/types';

// ─── Constants ────────────────────────────────────────────────

const CATEGORIES = [
  'Teknisk kompetens',
  'Agilt arbete',
  'Kommunikation',
  'Verktyg & processer',
  'Problemlösning',
  'Samarbete',
  'Övrigt'
];

// ─── New Goal Dialog ──────────────────────────────────────────

export function NewGoalDialog({ goalCount }: { goalCount: number }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState(CATEGORIES[0]);

  const mutation = useMutation({
    mutationFn: (data: LiaGoalPayload) => createLiaGoal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: liaGoalKeys.all });
      setOpen(false);
      setCategory(CATEGORIES[0]);
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;

    if (!title?.trim()) return;

    mutation.mutate({
      title: title.trim(),
      description: description?.trim() || '',
      category,
      sortOrder: goalCount
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Icons.add className='mr-2 h-4 w-4' />
          Nytt mål
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle>Lägg till kursmål</DialogTitle>
          <DialogDescription>
            Lägg till ett mål från kursplanen som du vill bocka av under din LIA-period.
          </DialogDescription>
        </DialogHeader>
        <form id='goal-form' className='grid gap-4 py-4' onSubmit={handleSubmit}>
          <div className='grid gap-2'>
            <Label htmlFor='goal-title'>Mål</Label>
            <Input
              id='goal-title'
              name='title'
              placeholder='T.ex. "Arbetat i agilt projekt med Scrum"'
              required
            />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='goal-description'>Beskrivning (valfritt)</Label>
            <Textarea
              id='goal-description'
              name='description'
              placeholder='Beskriv vad målet innebär mer i detalj...'
            />
          </div>
          <div className='grid gap-2'>
            <Label>Kategori</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </form>
        <DialogFooter>
          <Button
            type='submit'
            form='goal-form'
            isLoading={mutation.isPending}
            disabled={mutation.isPending}
          >
            Lägg till
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Goal Item ────────────────────────────────────────────────

function GoalItem({ goal }: { goal: LiaGoalDoc }) {
  const queryClient = useQueryClient();

  const toggleMutation = useMutation({
    mutationFn: () =>
      updateLiaGoal(goal.$id, {
        completed: !goal.completed,
        completedAt: !goal.completed ? new Date().toISOString() : null
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: liaGoalKeys.all });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteLiaGoal(goal.$id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: liaGoalKeys.all });
    }
  });

  return (
    <div className='flex items-start gap-3 rounded-lg border p-4'>
      <Checkbox
        checked={goal.completed}
        onCheckedChange={() => toggleMutation.mutate()}
        disabled={toggleMutation.isPending}
        className='mt-0.5'
      />
      <div className='flex-1 space-y-1'>
        <div className='flex items-center gap-2'>
          <span
            className={`text-sm font-medium ${goal.completed ? 'text-muted-foreground line-through' : ''}`}
          >
            {goal.completed ? '✅ ' : ''}
            {goal.title}
          </span>
          <Badge variant='outline' className='text-xs'>
            {goal.category}
          </Badge>
        </div>
        {goal.description && (
          <p className={`text-muted-foreground text-xs ${goal.completed ? 'line-through' : ''}`}>
            {goal.description}
          </p>
        )}
        {goal.completed && goal.completedAt && (
          <p className='text-muted-foreground text-xs'>
            Avklarat{' '}
            {new Date(goal.completedAt).toLocaleDateString('sv-SE', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            })}
          </p>
        )}
      </div>
      <Button
        variant='ghost'
        size='icon'
        className='text-destructive h-7 w-7 shrink-0'
        onClick={() => deleteMutation.mutate()}
        disabled={deleteMutation.isPending}
      >
        <Icons.trash className='h-4 w-4' />
      </Button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────

export default function LiaGoalsPage() {
  const { user } = useUser();
  const userId = user?.$id ?? '';

  const { data: goals, isLoading } = useQuery(liaGoalsListOptions(userId));

  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-20'>
        <Icons.spinner className='text-muted-foreground h-8 w-8 animate-spin' />
      </div>
    );
  }

  const totalGoals = goals?.length ?? 0;
  const completedGoals = goals?.filter((g) => g.completed).length ?? 0;
  const progressPercent = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

  // Group by category
  const grouped = (goals ?? []).reduce<Record<string, LiaGoalDoc[]>>((acc, goal) => {
    const cat = goal.category || 'Övrigt';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(goal);
    return acc;
  }, {});

  return (
    <div className='space-y-6'>
      {/* Action */}
      <div className='flex justify-end'>
        <NewGoalDialog goalCount={totalGoals} />
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle>Total framsteg</CardTitle>
              <CardDescription>
                {completedGoals} av {totalGoals} kursmål avklarade
              </CardDescription>
            </div>
            <span className='text-3xl font-bold'>{progressPercent}%</span>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={progressPercent} className='h-4' />
        </CardContent>
      </Card>

      {/* Goals by Category */}
      {totalGoals === 0 ? (
        <Card>
          <CardContent className='py-10 text-center'>
            <Icons.listCheck className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
            <h3 className='text-lg font-semibold'>Inga mål ännu</h3>
            <p className='text-muted-foreground mt-1 text-sm'>
              Lägg till kursmål från din utbildningsplan och bocka av dem allt eftersom du uppnår
              dem under din LIA-period.
            </p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(grouped).map(([category, categoryGoals]) => {
          const catCompleted = categoryGoals.filter((g) => g.completed).length;
          const catTotal = categoryGoals.length;
          const catPercent = Math.round((catCompleted / catTotal) * 100);

          return (
            <Card key={category}>
              <CardHeader>
                <div className='flex items-center justify-between'>
                  <CardTitle className='text-base'>{category}</CardTitle>
                  <div className='flex items-center gap-2'>
                    <span className='text-muted-foreground text-sm'>
                      {catCompleted}/{catTotal}
                    </span>
                    <Badge
                      variant={catPercent === 100 ? 'default' : 'secondary'}
                      className='text-xs'
                    >
                      {catPercent}%
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Progress value={catPercent} className='mb-4 h-2' />
                <div className='space-y-2'>
                  {categoryGoals.map((goal) => (
                    <GoalItem key={goal.$id} goal={goal} />
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
