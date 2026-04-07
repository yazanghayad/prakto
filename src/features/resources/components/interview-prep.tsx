'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';

// ─── Data ─────────────────────────────────────────────────────

type Category = 'alla' | 'vanliga' | 'beteende' | 'tekniska' | 'avslutning';

interface InterviewQuestion {
  question: string;
  tip: string;
  exampleAnswer: string;
  category: Exclude<Category, 'alla'>;
}

const categories: { value: Category; label: string }[] = [
  { value: 'alla', label: 'Alla frågor' },
  { value: 'vanliga', label: 'Vanliga frågor' },
  { value: 'beteende', label: 'Beteendefrågor' },
  { value: 'tekniska', label: 'Situationsfrågor' },
  { value: 'avslutning', label: 'Avslutande frågor' }
];

const questions: InterviewQuestion[] = [
  {
    question: 'Berätta om dig själv.',
    tip: 'Håll det kort (1-2 min). Fokusera på utbildning, relevanta erfarenheter och vad du söker. Undvik privata detaljer.',
    exampleAnswer:
      'Jag heter Anna och studerar systemvetenskap på Stockholms universitet. Under utbildningen har jag byggt flera webbprojekt med React och Next.js, och jag brinner för att skapa användarvänliga lösningar. Jag söker nu en praktikplats där jag kan utvecklas inom frontend-utveckling och bidra till riktiga projekt.',
    category: 'vanliga'
  },
  {
    question: 'Varför vill du göra praktik hos oss?',
    tip: 'Visa att du har researcat företaget. Nämn specifika projekt, värderingar eller produkter som lockar dig.',
    exampleAnswer:
      'Jag har följt er sedan ni lanserade er nya plattform förra året. Jag gillar hur ni kombinerar teknik och hållbarhet, och jag tror att min bakgrund inom UX-design och webbutveckling skulle passa bra i ert team. Jag vill lära mig hur ett modernt produktteam jobbar i praktiken.',
    category: 'vanliga'
  },
  {
    question: 'Vad är dina styrkor?',
    tip: 'Välj 2-3 styrkor som är relevanta för rollen. Ge konkreta exempel.',
    exampleAnswer:
      'Jag är noggrann och strukturerad — jag planerar alltid mitt arbete i delmål. Jag är också bra på att samarbeta. I ett grupprojekt tog jag initiativet att sätta upp dagliga standups, vilket förbättrade kommunikationen och hjälpte oss leverera i tid.',
    category: 'vanliga'
  },
  {
    question: 'Vad är dina svagheter?',
    tip: 'Var ärlig men visa självinsikt. Berätta hur du jobbar med svagheten.',
    exampleAnswer:
      'Jag har en tendens att vilja göra allt perfekt, vilket ibland gör att jag lägger för mycket tid på detaljer. Jag har lärt mig att sätta tydliga deadlines och fråga efter feedback tidigt istället för att vänta tills allt är "klart".',
    category: 'vanliga'
  },
  {
    question: 'Berätta om en utmaning du har löst.',
    tip: 'Använd STAR-metoden: Situation → Task → Action → Result.',
    exampleAnswer:
      'I ett skolprojekt (Situation) skulle vi bygga en e-handelsprototyp på tre veckor (Task). Halvvägs in insåg vi att vår databasdesign inte skalade. Jag föreslog att vi refaktorerade tidigt istället för att lappa (Action). Det tog två extra dagar men resulterade i en stabil produkt som fick högsta betyg (Result).',
    category: 'beteende'
  },
  {
    question: 'Hur hanterar du stress eller tight deadline?',
    tip: 'Visa att du har strategier. Ge ett konkret exempel.',
    exampleAnswer:
      'Jag bryter ner uppgiften i mindre delar och prioriterar det viktigaste först. Under en tentaperiod med tre tentor samma vecka skapade jag ett schema och fokuserade på ett ämne per dag. Jag klarade alla tre, varav ett med högsta betyg.',
    category: 'beteende'
  },
  {
    question: 'Berätta om ett grupparbete som inte gick bra.',
    tip: 'Var ärlig om vad som gick fel, men fokusera på vad du lärde dig.',
    exampleAnswer:
      'I ett projekt hade vi meningsskiljaktigheter om tekniska val som ledde till förseningar. Jag lärde mig att det är bättre att ta beslutsprocessen tidigt — vi lägger nu alltid 30 minuter i början av varje projekt på att diskutera och dokumentera tekniska beslut.',
    category: 'beteende'
  },
  {
    question: 'Hur skulle du hantera en uppgift du aldrig gjort förut?',
    tip: 'Visa att du är proaktiv och inte rädd för att lära nytt.',
    exampleAnswer:
      'Jag skulle börja med att googla och läsa dokumentation. Sedan skulle jag testa med ett litet experiment. Om jag fastnar frågar jag en kollega eller handledare — jag tror på att lära snabbt genom att göra, inte vänta tills jag kan allt i teorin.',
    category: 'tekniska'
  },
  {
    question: 'Du får kritik på ditt arbete — hur reagerar du?',
    tip: 'Visa mognad och lärvilja. Konstruktiv kritik = utveckling.',
    exampleAnswer:
      'Jag ser kritik som en möjlighet att utvecklas. Om en handledare pekar på förbättringar vill jag förstå varför, inte bara vad. Jag brukar fråga "Hur hade du gjort?" för att lära mig av deras erfarenhet. Jag tar aldrig kritik personligt.',
    category: 'tekniska'
  },
  {
    question: 'Har du några frågor till oss?',
    tip: 'Ha alltid 2-3 frågor förberedda. Det visar intresse och engagemang.',
    exampleAnswer:
      '"Ja! Jag undrar: Hur ser en typisk dag ut för en praktikant hos er? Och vilka verktyg och tekniker jobbar teamet med just nu? Jag är också nyfiken på om det finns möjlighet att delta i kodgranskning eller designdiskussioner."',
    category: 'avslutning'
  },
  {
    question: 'Var ser du dig själv om 5 år?',
    tip: 'Var ärlig men visa ambition. Koppla till rollen och branschen.',
    exampleAnswer:
      'Jag hoppas att jag har fått erfarenhet från olika projekt och roller, och att jag jobbar som utvecklare eller designer i ett team som bygger produkter som gör skillnad. Praktiken är ett viktigt steg mot det — jag vill lära mig hur branschen fungerar på riktigt.',
    category: 'avslutning'
  },
  {
    question: 'Vad förväntar du dig av praktiken?',
    tip: 'Visa att du har realistiska förväntningar och vill bidra, inte bara observera.',
    exampleAnswer:
      'Jag förväntar mig att få vara delaktig i riktiga projekt, inte bara titta på. Jag vill lära mig av erfarna kollegor, få feedback på mitt arbete och förstå hur ett professionellt team samarbetar. Jag vill bidra med det jag kan och vara öppen för att lära nytt.',
    category: 'avslutning'
  }
];

// ─── STAR method explanation ──────────────────────────────────

function StarMethod() {
  return (
    <Card className='border-primary/20 bg-primary/5'>
      <CardHeader className='pb-3'>
        <CardTitle className='flex items-center gap-2 text-base'>
          <Icons.sparkles className='text-primary h-5 w-5' />
          STAR-metoden
        </CardTitle>
        <CardDescription>Strukturera dina svar på beteendefrågor med STAR:</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='grid gap-3 sm:grid-cols-2'>
          {[
            {
              letter: 'S',
              word: 'Situation',
              desc: 'Beskriv sammanhanget — var, när, vad?'
            },
            {
              letter: 'T',
              word: 'Task',
              desc: 'Vad var din uppgift eller utmaning?'
            },
            {
              letter: 'A',
              word: 'Action',
              desc: 'Vad gjorde du konkret?'
            },
            {
              letter: 'R',
              word: 'Result',
              desc: 'Vad blev resultatet? Vad lärde du dig?'
            }
          ].map((item) => (
            <div key={item.letter} className='flex items-start gap-3 rounded-md border p-3'>
              <div className='bg-primary text-primary-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold'>
                {item.letter}
              </div>
              <div>
                <p className='text-sm font-medium'>{item.word}</p>
                <p className='text-muted-foreground text-xs'>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Question Card ────────────────────────────────────────────

function QuestionCard({
  question,
  index
}: Readonly<{ question: InterviewQuestion; index: number }>) {
  const [showAnswer, setShowAnswer] = useState(false);

  const categoryLabels: Record<string, string> = {
    vanliga: 'Vanlig fråga',
    beteende: 'Beteendefråga',
    tekniska: 'Situationsfråga',
    avslutning: 'Avslutande'
  };

  return (
    <Card>
      <CardHeader className='pb-3'>
        <div className='flex items-start justify-between gap-3'>
          <div className='flex items-start gap-3'>
            <div className='bg-muted flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold'>
              {index + 1}
            </div>
            <div>
              <CardTitle className='text-base leading-snug'>{question.question}</CardTitle>
              <Badge variant='outline' className='mt-1.5 text-xs'>
                {categoryLabels[question.category]}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className='space-y-3'>
        <div className='rounded-md border p-3'>
          <p className='text-xs font-medium uppercase tracking-wider text-amber-600 dark:text-amber-400'>
            Tips
          </p>
          <p className='text-muted-foreground mt-1 text-sm'>{question.tip}</p>
        </div>

        <Button
          variant='outline'
          size='sm'
          onClick={() => setShowAnswer(!showAnswer)}
          className='w-full'
        >
          {showAnswer ? (
            <>
              <Icons.eyeOff className='mr-1.5 h-3.5 w-3.5' />
              Dölj exempelsvar
            </>
          ) : (
            <>
              <Icons.eye className='mr-1.5 h-3.5 w-3.5' />
              Visa exempelsvar
            </>
          )}
        </Button>

        {showAnswer && (
          <div className='bg-muted/50 rounded-md border p-3'>
            <p className='text-xs font-medium uppercase tracking-wider text-green-600 dark:text-green-400'>
              Exempelsvar
            </p>
            <p className='mt-1 text-sm leading-relaxed'>{question.exampleAnswer}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Component ──────────────────────────────────────────

export default function InterviewPrep() {
  const [activeCategory, setActiveCategory] = useState<Category>('alla');

  const filtered =
    activeCategory === 'alla' ? questions : questions.filter((q) => q.category === activeCategory);

  return (
    <div className='space-y-6'>
      <StarMethod />

      {/* Category filter */}
      <div className='flex flex-wrap gap-2'>
        {categories.map((cat) => (
          <Button
            key={cat.value}
            variant={activeCategory === cat.value ? 'default' : 'outline'}
            size='sm'
            onClick={() => setActiveCategory(cat.value)}
          >
            {cat.label}
            {cat.value !== 'alla' && (
              <Badge variant='secondary' className='ml-1.5 h-5 px-1.5 text-xs'>
                {questions.filter((q) => q.category === cat.value).length}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {/* Questions */}
      <div className='grid gap-4'>
        {filtered.map((q, idx) => (
          <QuestionCard key={q.question} question={q} index={questions.indexOf(q)} />
        ))}
      </div>
    </div>
  );
}
