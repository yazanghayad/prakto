'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

// ─── Data ─────────────────────────────────────────────────────

interface QuizQuestion {
  question: string;
  options: { label: string; areas: string[] }[];
}

const areaLabels: Record<string, string> = {
  tech: 'Teknik & IT',
  design: 'Design & UX',
  marketing: 'Marknadsföring & Kommunikation',
  business: 'Affärsutveckling & Ledarskap',
  data: 'Data & Analys',
  creative: 'Kreativt & Innehåll'
};

const areaDescriptions: Record<string, string> = {
  tech: 'Du gillar att lösa problem med kod, bygga system och förstå hur saker fungerar tekniskt. Roller: Webbutvecklare, Systemutvecklare, DevOps.',
  design:
    'Du har öga för detaljer och bryr dig om hur användare upplever produkter. Roller: UX/UI-designer, Grafisk formgivare, Interaktionsdesigner.',
  marketing:
    'Du är kommunikativ och gillar att nå ut med budskap, analysera målgrupper och skapa kampanjer. Roller: Marknadsassistent, Content-skapare, SoMe-ansvarig.',
  business:
    'Du tänker strategiskt, gillar att driva projekt och ser helheten. Roller: Projektledare, Affärsutvecklare, Produktägare.',
  data: 'Du gillar siffror, mönster och att dra slutsatser från data. Roller: Data-analytiker, BI-konsult, Dataingenjör.',
  creative:
    'Du är kreativ, gillar att berätta historier och producera innehåll. Roller: Copywriter, Videoproducent, Redaktör.'
};

const areaIcons: Record<string, keyof typeof Icons> = {
  tech: 'code',
  design: 'palette',
  marketing: 'send',
  business: 'briefcase',
  data: 'statistics',
  creative: 'edit'
};

const quizQuestions: QuizQuestion[] = [
  {
    question: 'Vad gör dig mest engagerad i ett projekt?',
    options: [
      { label: 'Bygga och koda — få saker att fungera', areas: ['tech'] },
      { label: 'Designa och formge — göra det snyggt och användarvänligt', areas: ['design'] },
      { label: 'Kommunicera och nå ut — skapa kampanjer', areas: ['marketing'] },
      { label: 'Planera och leda — se helhetsbilden', areas: ['business'] }
    ]
  },
  {
    question: 'Hur löser du helst ett problem?',
    options: [
      { label: 'Analyserar data och letar mönster', areas: ['data', 'tech'] },
      { label: 'Brainstormar kreativa idéer', areas: ['creative', 'design'] },
      { label: 'Diskuterar med andra och samarbetar', areas: ['business', 'marketing'] },
      { label: 'Testar och experimenterar tills det funkar', areas: ['tech', 'design'] }
    ]
  },
  {
    question: 'Vilket verktyg lockar dig mest?',
    options: [
      { label: 'VS Code / Terminal', areas: ['tech'] },
      { label: 'Figma / Canva', areas: ['design', 'creative'] },
      { label: 'Excel / Power BI', areas: ['data', 'business'] },
      { label: 'Instagram / TikTok / LinkedIn', areas: ['marketing', 'creative'] }
    ]
  },
  {
    question: 'Vilken typ av uppgift ger dig energi?',
    options: [
      { label: 'Bygga en webbsida eller app', areas: ['tech'] },
      { label: 'Skapa grafik eller animationer', areas: ['design', 'creative'] },
      { label: 'Skriva texter eller blogginlägg', areas: ['creative', 'marketing'] },
      { label: 'Analysera resultat och presentera insikter', areas: ['data', 'business'] }
    ]
  },
  {
    question: 'Hur vill du helst presentera ditt arbete?',
    options: [
      { label: 'Demo av en fungerande produkt', areas: ['tech'] },
      { label: 'Visuell presentation med mockups', areas: ['design'] },
      { label: 'Rapport med siffror och grafer', areas: ['data', 'business'] },
      { label: 'Video eller kreativt innehåll', areas: ['creative', 'marketing'] }
    ]
  },
  {
    question: 'Vad beskriver dig bäst under press?',
    options: [
      { label: 'Jag fokuserar och löser problemet metodiskt', areas: ['tech', 'data'] },
      { label: 'Jag hittar kreativa vägar runt hindret', areas: ['creative', 'design'] },
      { label: 'Jag kommunicerar och delegerar', areas: ['business', 'marketing'] },
      { label: 'Jag prioriterar och skär bort det onödiga', areas: ['business', 'data'] }
    ]
  },
  {
    question: 'Vilket av dessa projekt lockar dig mest?',
    options: [
      { label: 'Bygga en API eller automatisera ett arbetsflöde', areas: ['tech', 'data'] },
      { label: 'Designa om en apps användarupplevelse', areas: ['design'] },
      { label: 'Skapa en viral marknadsföringskampanj', areas: ['marketing', 'creative'] },
      { label: 'Leda ett team i ett produktsprint', areas: ['business'] }
    ]
  },
  {
    question: 'Vad värderar du mest på en arbetsplats?',
    options: [
      { label: 'Tekniska utmaningar och lärande', areas: ['tech', 'data'] },
      { label: 'Kreativ frihet och design-fokus', areas: ['design', 'creative'] },
      { label: 'Kommunikation och teamwork', areas: ['marketing', 'business'] },
      { label: 'Struktur och mätbara resultat', areas: ['data', 'business'] }
    ]
  }
];

// ─── Results Component ────────────────────────────────────────

function QuizResults({
  scores,
  onReset
}: Readonly<{
  scores: Record<string, number>;
  onReset: () => void;
}>) {
  const sorted = Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .filter(([, score]) => score > 0);

  const maxScore = sorted[0]?.[1] ?? 1;

  return (
    <div className='space-y-6'>
      <Card className='border-primary/20 bg-primary/5'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-lg'>
            <Icons.sparkles className='text-primary h-5 w-5' />
            Ditt resultat
          </CardTitle>
          <CardDescription>
            Baserat på dina svar matchar du bäst med följande områden:
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          {sorted.map(([area, score], idx) => {
            const iconKey = areaIcons[area] as keyof typeof Icons;
            const AreaIcon = Icons[iconKey];
            const percentage = Math.round((score / maxScore) * 100);
            return (
              <div key={area} className='space-y-1.5'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    {idx === 0 && <Badge className='text-xs'>Starkast match</Badge>}
                    <div className='flex items-center gap-1.5'>
                      <AreaIcon className='h-4 w-4' />
                      <span className='text-sm font-medium'>{areaLabels[area]}</span>
                    </div>
                  </div>
                  <span className='text-muted-foreground text-xs'>{score} poäng</span>
                </div>
                <Progress value={percentage} className='h-2' />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Top area description */}
      {sorted[0] && (
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>{areaLabels[sorted[0][0]]}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-muted-foreground text-sm leading-relaxed'>
              {areaDescriptions[sorted[0][0]]}
            </p>
          </CardContent>
        </Card>
      )}

      <Button onClick={onReset} variant='outline' className='w-full'>
        Gör om testet
      </Button>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────

export default function SkillsQuiz() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);

  const progress = Math.round((answers.length / quizQuestions.length) * 100);

  const scores = useMemo(() => {
    const s: Record<string, number> = {};
    answers.forEach((answerIdx, qIdx) => {
      const areas = quizQuestions[qIdx].options[answerIdx]?.areas ?? [];
      areas.forEach((area) => {
        s[area] = (s[area] || 0) + 1;
      });
    });
    return s;
  }, [answers]);

  function handleAnswer(optionIdx: number) {
    const newAnswers = [...answers, optionIdx];
    setAnswers(newAnswers);

    if (newAnswers.length >= quizQuestions.length) {
      setShowResults(true);
    } else {
      setCurrentQuestion(currentQuestion + 1);
    }
  }

  function handleReset() {
    setCurrentQuestion(0);
    setAnswers([]);
    setShowResults(false);
  }

  if (showResults) {
    return <QuizResults scores={scores} onReset={handleReset} />;
  }

  const q = quizQuestions[currentQuestion];

  return (
    <div className='mx-auto max-w-2xl space-y-6'>
      {/* Progress */}
      <div className='space-y-2'>
        <div className='flex items-center justify-between text-sm'>
          <span className='text-muted-foreground'>
            Fråga {currentQuestion + 1} av {quizQuestions.length}
          </span>
          <span className='text-muted-foreground'>{progress}%</span>
        </div>
        <Progress value={progress} className='h-2' />
      </div>

      {/* Question */}
      <Card>
        <CardHeader>
          <CardTitle className='text-lg'>{q.question}</CardTitle>
          <CardDescription>Välj det alternativ som stämmer bäst.</CardDescription>
        </CardHeader>
        <CardContent className='space-y-3'>
          {q.options.map((option, idx) => (
            <button
              key={option.label}
              onClick={() => handleAnswer(idx)}
              className={cn(
                'hover:bg-muted hover:border-primary/30 w-full rounded-lg border p-4 text-left text-sm transition-colors'
              )}
            >
              <div className='flex items-center gap-3'>
                <div className='bg-muted flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold'>
                  {String.fromCharCode(65 + idx)}
                </div>
                <span>{option.label}</span>
              </div>
            </button>
          ))}
        </CardContent>
      </Card>

      {answers.length > 0 && (
        <Button variant='ghost' size='sm' onClick={handleReset}>
          <Icons.arrowLeft className='mr-1.5 h-3.5 w-3.5' />
          Börja om
        </Button>
      )}
    </div>
  );
}
