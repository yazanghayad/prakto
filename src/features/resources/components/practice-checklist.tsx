'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Icons } from '@/components/icons';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

// ─── Data ─────────────────────────────────────────────────────

interface ChecklistItem {
  id: string;
  label: string;
  tip?: string;
}

interface ChecklistPhase {
  id: string;
  title: string;
  description: string;
  items: ChecklistItem[];
}

const phases: ChecklistPhase[] = [
  {
    id: 'before',
    title: 'Före praktiken',
    description: 'Förbered dig inför din första dag.',
    items: [
      {
        id: 'b1',
        label: 'Uppdatera ditt CV',
        tip: 'Använd vår CV-generator för att skapa ett professionellt CV.'
      },
      {
        id: 'b2',
        label: 'Skriv personligt brev',
        tip: 'Anpassa brevet till varje företag du söker hos.'
      },
      {
        id: 'b3',
        label: 'Sök och skicka ansökningar',
        tip: 'Sikta på minst 5–10 ansökningar för att öka dina chanser.'
      },
      {
        id: 'b4',
        label: 'Förbered dig inför intervjuer',
        tip: 'Gå igenom vanliga frågor i vår intervjuförberedelse.'
      },
      {
        id: 'b5',
        label: 'Sätt upp LinkedIn-profil',
        tip: 'Lägg till foto, sammanfattning och att du söker praktik.'
      },
      {
        id: 'b6',
        label: 'Ordna praktikavtal med skolan',
        tip: 'Kontakta din praktiksamordnare i tid.'
      },
      {
        id: 'b7',
        label: 'Kolla pendlingsväg och tider',
        tip: 'Testa resan till arbetsplatsen före första dagen.'
      }
    ]
  },
  {
    id: 'first-week',
    title: 'Första veckan',
    description: 'Gör ett bra intryck och kom igång.',
    items: [
      {
        id: 'f1',
        label: 'Presentera dig för kollegor',
        tip: 'Var öppen och engagerad. Ställ frågor.'
      },
      {
        id: 'f2',
        label: 'Förstå arbetsrutiner och verktyg',
        tip: 'Be om en introduktion till systemen ni använder.'
      },
      {
        id: 'f3',
        label: 'Gå igenom förväntningar med handledare',
        tip: 'Klarhet tidigt undviker missförstånd.'
      },
      {
        id: 'f4',
        label: 'Anteckna allt — frågor, lärdomar, mål',
        tip: 'Ha en dagbok eller digital anteckningsbok.'
      },
      { id: 'f5', label: 'Be om feedback', tip: 'Visa att du vill lära dig och utvecklas.' },
      {
        id: 'f6',
        label: 'Lär dig teamets kommunikationskanaler',
        tip: 'Slack, Teams, mejl – anpassa dig till deras stil.'
      }
    ]
  },
  {
    id: 'during',
    title: 'Under praktiken',
    description: 'Maximera din tid och lärande.',
    items: [
      {
        id: 'd1',
        label: 'Dokumentera dina arbetsuppgifter',
        tip: 'Bra underlag för framtida CV och referenssamtal.'
      },
      {
        id: 'd2',
        label: 'Be om mer ansvar när du känner dig redo',
        tip: 'Visa initiativ — det imponerar.'
      },
      {
        id: 'd3',
        label: 'Nätverka med kollegor',
        tip: 'Luncher och fikapauser är gyllene tillfällen.'
      },
      {
        id: 'd4',
        label: 'Regelbundna check-ins med handledare',
        tip: 'Veckovisa möten hjälper dig hålla kursen.'
      },
      {
        id: 'd5',
        label: 'Spara exempel på ditt arbete (portfolio)',
        tip: 'Fråga om du får använda material externt.'
      },
      {
        id: 'd6',
        label: 'Reflektera — vad lär du dig?',
        tip: 'Skriv ner vad som gått bra och vad du kan förbättra.'
      }
    ]
  },
  {
    id: 'closing',
    title: 'Avslut',
    description: 'Avsluta professionellt och öppna dörrar.',
    items: [
      {
        id: 'c1',
        label: 'Skriv praktikrapport (om skolan kräver)',
        tip: 'Börja i tid — det tar längre tid än man tror.'
      },
      {
        id: 'c2',
        label: 'Be om referens eller rekommendation',
        tip: 'Be handledaren om en LinkedIn-rekommendation.'
      },
      {
        id: 'c3',
        label: 'Skicka tackbrev till handledare',
        tip: 'Se vår mall för tackbrev i mallbiblioteket.'
      },
      {
        id: 'c4',
        label: 'Uppdatera CV med praktiken',
        tip: 'Lägg till roller, ansvar och resultat.'
      },
      {
        id: 'c5',
        label: 'Koppla ihop med kollegor på LinkedIn',
        tip: 'Bygg ditt nätverk medan kontakten är färsk.'
      },
      {
        id: 'c6',
        label: 'Reflektera — vad tar du med dig?',
        tip: 'Sammanfatta dina viktigaste lärdomar.'
      }
    ]
  }
];

const STORAGE_KEY = 'prakto-checklist';

function loadChecked(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveChecked(checked: Record<string, boolean>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(checked));
  } catch {
    // localStorage full or disabled
  }
}

// ─── Phase Card ──────────────────────────────────────────────

function PhaseCard({
  phase,
  checked,
  onToggle
}: Readonly<{
  phase: ChecklistPhase;
  checked: Record<string, boolean>;
  onToggle: (id: string) => void;
}>) {
  const done = phase.items.filter((i) => checked[i.id]).length;
  const total = phase.items.length;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;
  const allDone = done === total;

  return (
    <Card className={cn(allDone && 'border-green-500/30 bg-green-50/30 dark:bg-green-950/10')}>
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle className='flex items-center gap-2 text-base'>
              {allDone && <Icons.circleCheck className='h-4 w-4 text-green-600' />}
              {phase.title}
            </CardTitle>
            <CardDescription className='mt-1 text-xs'>{phase.description}</CardDescription>
          </div>
          <Badge variant={allDone ? 'default' : 'secondary'} className='text-xs'>
            {done}/{total}
          </Badge>
        </div>
        <Progress value={progress} className='mt-2 h-1.5' />
      </CardHeader>
      <CardContent className='space-y-1'>
        {phase.items.map((item) => (
          <label
            key={item.id}
            className={cn(
              'hover:bg-muted/50 flex cursor-pointer items-start gap-3 rounded-md p-2.5 transition-colors',
              checked[item.id] && 'opacity-60'
            )}
          >
            <Checkbox
              checked={!!checked[item.id]}
              onCheckedChange={() => onToggle(item.id)}
              className='mt-0.5'
            />
            <div className='min-w-0 flex-1'>
              <span className={cn('text-sm', checked[item.id] && 'line-through')}>
                {item.label}
              </span>
              {item.tip && (
                <p className='text-muted-foreground mt-0.5 text-[11px] leading-tight'>{item.tip}</p>
              )}
            </div>
          </label>
        ))}
      </CardContent>
    </Card>
  );
}

// ─── Main Component ──────────────────────────────────────────

export default function PracticeChecklist() {
  const [checked, setChecked] = useState<Record<string, boolean>>(loadChecked);

  const handleToggle = useCallback((id: string) => {
    setChecked((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      saveChecked(next);
      return next;
    });
  }, []);

  const totalItems = phases.reduce((acc, p) => acc + p.items.length, 0);
  const totalDone = Object.values(checked).filter(Boolean).length;
  const totalProgress = totalItems > 0 ? Math.round((totalDone / totalItems) * 100) : 0;

  function handleReset() {
    setChecked({});
    saveChecked({});
  }

  return (
    <div className='space-y-6'>
      {/* Overall progress */}
      <Card className='border-primary/20'>
        <CardContent className='flex items-center gap-4 pt-6'>
          <div className='flex-1 space-y-2'>
            <div className='flex items-center justify-between text-sm'>
              <span className='font-medium'>Total framsteg</span>
              <span className='text-muted-foreground'>
                {totalDone} av {totalItems} klara ({totalProgress}%)
              </span>
            </div>
            <Progress value={totalProgress} className='h-2' />
          </div>
          {totalDone > 0 && (
            <Button variant='ghost' size='sm' onClick={handleReset}>
              Nollställ
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Phase cards */}
      {phases.map((phase) => (
        <PhaseCard key={phase.id} phase={phase} checked={checked} onToggle={handleToggle} />
      ))}
    </div>
  );
}
