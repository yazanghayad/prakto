'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUser } from '@/hooks/use-auth';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { journalListOptions } from '@/features/lia-journal/api/queries';
import { liaGoalsListOptions } from '@/features/lia-goals/api/queries';
import { timeListOptions } from '@/features/lia-time/api/queries';
import { feedbackListOptions } from '@/features/lia-feedback/api/queries';

function getWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export default function LiaReportPage() {
  const { user } = useUser();
  const userId = user?.$id ?? '';
  const userName = user?.name ?? 'Student';

  const currentWeek = getWeekNumber(new Date());
  const currentYear = new Date().getFullYear();
  const [selectedWeek, setSelectedWeek] = useState(String(currentWeek));
  const [generating, setGenerating] = useState(false);

  const weekNum = Number(selectedWeek);

  const { data: journalEntries } = useQuery(journalListOptions(userId));
  const { data: goals } = useQuery(liaGoalsListOptions(userId));
  const { data: timeEntries } = useQuery(timeListOptions(userId));
  const { data: feedbackEntries } = useQuery(feedbackListOptions(userId));

  // Filter data for selected week
  const weekJournal = useMemo(
    () => (journalEntries ?? []).find((e) => e.weekNumber === weekNum && e.year === currentYear),
    [journalEntries, weekNum, currentYear]
  );

  const weekTime = useMemo(
    () =>
      (timeEntries ?? []).filter((e) => {
        const d = new Date(e.date);
        return getWeekNumber(d) === weekNum && d.getFullYear() === currentYear;
      }),
    [timeEntries, weekNum, currentYear]
  );

  const weekFeedback = useMemo(
    () =>
      (feedbackEntries ?? []).filter((f) => {
        const d = new Date(f.date);
        return getWeekNumber(d) === weekNum && d.getFullYear() === currentYear;
      }),
    [feedbackEntries, weekNum, currentYear]
  );

  const completedGoals = (goals ?? []).filter((g) => g.completed).length;
  const totalGoals = (goals ?? []).length;
  const totalHours = weekTime.reduce((sum, e) => sum + e.hours, 0);

  // Generate text-based report and trigger download
  const generateReport = () => {
    setGenerating(true);

    const lines: string[] = [];
    lines.push('═══════════════════════════════════════════════════');
    lines.push(`  VECKORAPPORT — Vecka ${weekNum}, ${currentYear}`);
    lines.push(`  Student: ${userName}`);
    lines.push(`  Genererad: ${new Date().toLocaleDateString('sv-SE')}`);
    lines.push('═══════════════════════════════════════════════════');
    lines.push('');

    // Time
    lines.push('── ARBETSTID ──────────────────────────────────────');
    lines.push(`Totalt: ${totalHours} timmar`);
    if (weekTime.length > 0) {
      lines.push('');
      weekTime
        .sort((a, b) => a.date.localeCompare(b.date))
        .forEach((t) => {
          const dayName = new Date(t.date).toLocaleDateString('sv-SE', {
            weekday: 'long',
            day: 'numeric',
            month: 'short'
          });
          lines.push(`  ${dayName}: ${t.hours}h — ${t.description || '(ingen beskrivning)'}`);
        });
    } else {
      lines.push('  Ingen tid loggad denna vecka.');
    }
    lines.push('');

    // Journal
    lines.push('── DAGBOK ─────────────────────────────────────────');
    if (weekJournal) {
      if (weekJournal.content) lines.push(weekJournal.content);
      if (weekJournal.highlights?.length > 0) {
        lines.push('');
        lines.push('Höjdpunkter:');
        weekJournal.highlights.forEach((h: string) => lines.push(`  • ${h}`));
      }
      if (weekJournal.challenges) {
        lines.push('');
        lines.push(`Utmaningar: ${weekJournal.challenges}`);
      }
      if (weekJournal.learnings) {
        lines.push('');
        lines.push(`Lärdomar: ${weekJournal.learnings}`);
      }
    } else {
      lines.push('  Inget dagboksinlägg för denna vecka.');
    }
    lines.push('');

    // Goals
    lines.push('── MÅL ────────────────────────────────────────────');
    lines.push(`Framsteg: ${completedGoals}/${totalGoals} mål avklarade`);
    if (totalGoals > 0) {
      (goals ?? []).forEach((g) => {
        lines.push(
          `  ${g.completed ? '✅' : '⬜'} ${g.title}${g.category ? ` [${g.category}]` : ''}`
        );
      });
    }
    lines.push('');

    // Feedback
    if (weekFeedback.length > 0) {
      lines.push('── FEEDBACK ───────────────────────────────────────');
      weekFeedback.forEach((f) => {
        lines.push(`  ${f.type === 'positive' ? '👍' : '📈'} Från ${f.from}: ${f.content}`);
      });
      lines.push('');
    }

    lines.push('═══════════════════════════════════════════════════');
    lines.push('Rapporten genererades av Prakto');

    const text = lines.join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `veckorapport-v${weekNum}-${currentYear}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setGenerating(false);
  };

  // Week options (1-52)
  const weekOptions = Array.from({ length: 52 }, (_, i) => i + 1);

  return (
    <div className='space-y-6'>
      {/* ─ Controls ─ */}
      <div className='flex items-end gap-4'>
        <div className='grid gap-2'>
          <Label>Välj vecka</Label>
          <Select value={selectedWeek} onValueChange={setSelectedWeek}>
            <SelectTrigger className='w-[140px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {weekOptions.map((w) => (
                <SelectItem key={w} value={String(w)}>
                  Vecka {w}
                  {w === currentWeek ? ' (nu)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={generateReport} disabled={generating}>
          <Icons.download className='mr-2 h-4 w-4' />
          Ladda ner rapport
        </Button>
      </div>

      {/* ─ Preview ─ */}
      <div className='grid gap-4 md:grid-cols-2'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='flex items-center gap-2 text-sm'>
              <Icons.clockHour className='h-4 w-4' /> Arbetstid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-2xl font-bold'>{totalHours}h</p>
            <p className='text-muted-foreground text-xs'>{weekTime.length} poster denna vecka</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='flex items-center gap-2 text-sm'>
              <Icons.listCheck className='h-4 w-4' /> Mål
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-2xl font-bold'>
              {completedGoals}/{totalGoals}
            </p>
            <p className='text-muted-foreground text-xs'>
              {totalGoals > 0
                ? `${Math.round((completedGoals / totalGoals) * 100)}% avklarade`
                : 'Inga mål satta'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='flex items-center gap-2 text-sm'>
              <Icons.writing className='h-4 w-4' /> Dagbok
            </CardTitle>
          </CardHeader>
          <CardContent>
            {weekJournal ? (
              <p className='text-sm line-clamp-3'>{weekJournal.content || 'Inget innehåll.'}</p>
            ) : (
              <p className='text-muted-foreground text-sm'>Inget inlägg vecka {weekNum}.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='flex items-center gap-2 text-sm'>
              <Icons.thumbUp className='h-4 w-4' /> Feedback
            </CardTitle>
          </CardHeader>
          <CardContent>
            {weekFeedback.length > 0 ? (
              <p className='text-sm'>
                {weekFeedback.length} feedback{weekFeedback.length > 1 ? 's' : ''} denna vecka
              </p>
            ) : (
              <p className='text-muted-foreground text-sm'>Ingen feedback vecka {weekNum}.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className='py-6 text-center'>
          <Icons.fileReport className='text-muted-foreground mx-auto mb-3 h-10 w-10' />
          <p className='text-muted-foreground text-sm'>
            Rapporten sammanställer dagbok, arbetstid, mål och feedback för den valda veckan.
            <br />
            Perfekt att skicka till din handledare eller skola.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
