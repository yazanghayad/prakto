'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@/hooks/use-auth';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { timeListOptions, timeKeys } from '../api/queries';
import { createTimeEntry, deleteTimeEntry } from '../api/service';
import type { TimeEntryDoc } from '../api/types';

const CATEGORIES: Record<string, { label: string; color: string }> = {
  development: {
    label: 'Utveckling',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
  },
  meeting: {
    label: 'Möte',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
  },
  learning: {
    label: 'Lärande',
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
  },
  other: { label: 'Övrigt', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' }
};

function getWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

// ─── New Entry Dialog ─────────────────────────────────────────

function NewTimeDialog() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState('development');

  const mutation = useMutation({
    mutationFn: createTimeEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timeKeys.all });
      setOpen(false);
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    mutation.mutate({
      date: fd.get('date') as string,
      hours: Number(fd.get('hours')),
      description: (fd.get('description') as string) ?? '',
      category
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Icons.add className='mr-2 h-4 w-4' />
          Logga tid
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[440px]'>
        <DialogHeader>
          <DialogTitle>Logga arbetstid</DialogTitle>
        </DialogHeader>
        <form id='time-form' className='grid gap-4 py-4' onSubmit={handleSubmit}>
          <div className='grid grid-cols-2 gap-4'>
            <div className='grid gap-2'>
              <Label htmlFor='t-date'>Datum</Label>
              <Input
                id='t-date'
                name='date'
                type='date'
                defaultValue={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='t-hours'>Timmar</Label>
              <Input
                id='t-hours'
                name='hours'
                type='number'
                step='0.5'
                min='0.5'
                max='24'
                defaultValue='8'
                required
              />
            </div>
          </div>
          <div className='grid gap-2'>
            <Label>Kategori</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CATEGORIES).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='t-desc'>Beskrivning</Label>
            <Input id='t-desc' name='description' placeholder='Vad arbetade du med?' />
          </div>
        </form>
        <DialogFooter>
          <Button type='submit' form='time-form' isLoading={mutation.isPending}>
            Spara
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────

export default function LiaTimePage() {
  const { user } = useUser();
  const userId = user?.$id ?? '';
  const queryClient = useQueryClient();
  const { data: entries, isLoading } = useQuery(timeListOptions(userId));

  const deleteMutation = useMutation({
    mutationFn: deleteTimeEntry,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: timeKeys.all })
  });

  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-20'>
        <Icons.spinner className='text-muted-foreground h-8 w-8 animate-spin' />
      </div>
    );
  }

  const sorted = [...(entries ?? [])].sort((a, b) => b.date.localeCompare(a.date));

  // ─ Weekly summary ─
  const now = new Date();
  const currentWeek = getWeekNumber(now);
  const currentYear = now.getFullYear();
  const thisWeek = sorted.filter((e) => {
    const d = new Date(e.date);
    return getWeekNumber(d) === currentWeek && d.getFullYear() === currentYear;
  });
  const weekTotal = thisWeek.reduce((sum, e) => sum + e.hours, 0);
  const totalAll = sorted.reduce((sum, e) => sum + e.hours, 0);

  // Category breakdown this week
  const catBreakdown = thisWeek.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.hours;
    return acc;
  }, {});

  return (
    <div className='space-y-6'>
      <div className='flex justify-end'>
        <NewTimeDialog />
      </div>

      {/* ─ Stats Cards ─ */}
      <div className='grid gap-4 sm:grid-cols-3'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-muted-foreground text-sm font-medium'>Denna vecka</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-2xl font-bold'>{weekTotal}h</p>
            <p className='text-muted-foreground text-xs'>Vecka {currentWeek}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-muted-foreground text-sm font-medium'>
              Totalt loggat
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-2xl font-bold'>{totalAll}h</p>
            <p className='text-muted-foreground text-xs'>{sorted.length} poster</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-muted-foreground text-sm font-medium'>
              Veckans fördelning
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex flex-wrap gap-1.5'>
              {Object.entries(catBreakdown).map(([cat, hrs]) => (
                <Badge key={cat} variant='outline' className={CATEGORIES[cat]?.color}>
                  {CATEGORIES[cat]?.label}: {hrs}h
                </Badge>
              ))}
              {Object.keys(catBreakdown).length === 0 && (
                <span className='text-muted-foreground text-xs'>Ingen tid loggad</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─ Table ─ */}
      {sorted.length === 0 ? (
        <Card>
          <CardContent className='py-10 text-center'>
            <Icons.clockHour className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
            <h3 className='text-lg font-semibold'>Ingen tid loggad ännu</h3>
            <p className='text-muted-foreground mt-1 text-sm'>
              Klicka "Logga tid" för att börja rapportera arbetstimmar.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className='p-0'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datum</TableHead>
                  <TableHead>Timmar</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Beskrivning</TableHead>
                  <TableHead className='w-10' />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((entry) => (
                  <TableRow key={entry.$id}>
                    <TableCell className='font-medium'>
                      {new Date(entry.date).toLocaleDateString('sv-SE', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short'
                      })}
                    </TableCell>
                    <TableCell>{entry.hours}h</TableCell>
                    <TableCell>
                      <Badge variant='outline' className={CATEGORIES[entry.category]?.color ?? ''}>
                        {CATEGORIES[entry.category]?.label ?? entry.category}
                      </Badge>
                    </TableCell>
                    <TableCell className='text-muted-foreground max-w-[200px] truncate text-sm'>
                      {entry.description || '—'}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='text-destructive h-7 w-7'
                        onClick={() => deleteMutation.mutate(entry.$id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Icons.trash className='h-4 w-4' />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
