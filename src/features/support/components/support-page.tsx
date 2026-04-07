'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PageContainer from '@/components/layout/page-container';
import { createSupportTicket } from '../api/service';
import { supportKeys } from '../api/queries';
import { SUPPORT_CATEGORIES } from '../api/types';

// ─── Category data ──────────────────────────────────────────────

interface Article {
  title: string;
  content: string;
}

interface Category {
  id: string;
  icon: keyof typeof Icons;
  title: string;
  description: string;
  articles: Article[];
}

const CATEGORIES: Category[] = [
  {
    id: 'getting-started',
    icon: 'dashboard',
    title: 'Kom igång',
    description: 'Skapa konto, profil och hitta din första praktik.',
    articles: [
      {
        title: 'Skapa ditt konto',
        content:
          'Gå till prakto.se och klicka på "Registrera". Välj om du är student, företag eller utbildningsansvarig. Fyll i din e-post och skapa ett lösenord. Du kan även logga in med Google eller LinkedIn. Efter registrering kommer du till din dashboard.'
      },
      {
        title: 'Fyll i din profil',
        content:
          'Gå till Konto → Profil för att fylla i dina uppgifter. Lägg till din utbildning, kompetenser, erfarenheter och kontaktuppgifter. En komplett profil ökar dina chanser att hittas av företag. Ladda även upp ett profilfoto.'
      },
      {
        title: 'Ladda upp ditt CV',
        content:
          'Gå till Portfolio och klicka på "Ladda upp dokument". Stödda format är PDF, DOC och DOCX (max 10 MB). Ditt CV visas för företag som söker praktikanter. Du kan ladda upp flera versioner och välja vilken som ska vara aktiv.'
      },
      {
        title: 'Hitta praktikplatser',
        content:
          'Gå till Praktikplatser i menyn. Använd sökfältet för att filtrera på ort, bransch eller kompetenser. Klicka på en annons för att se detaljer. Tryck "Sök praktik" för att skicka din ansökan direkt. Du kan även spara intressanta platser med bokmärkes-ikonen.'
      },
      {
        title: 'Navigera i dashboarden',
        content:
          'Sidomenyn ger dig snabb åtkomst till alla funktioner. Överst hittar du Dashboard (översikt), Kanban (uppgiftshantering). Under Student-sektionen finns Praktikplatser, Ansökningar, Sparade, Resurser, Portfolio, Kalender, AI-verktyg, Journal och Inkorg. Längst ned finns Konto med Profil och Notifikationer.'
      }
    ]
  },
  {
    id: 'applications',
    icon: 'applications',
    title: 'Ansökningar & Sök praktik',
    description: 'Hur du söker, följer upp och hanterar dina ansökningar.',
    articles: [
      {
        title: 'Söka en praktikplats',
        content:
          'Öppna en praktikannons och klicka "Sök praktik". Du kan bifoga ditt CV och skriva ett personligt brev. AI-assistenten kan hjälpa dig formulera brevet — gå till AI-verktyg → Personligt brev. När ansökan är skickad hamnar den under "Mina ansökningar".'
      },
      {
        title: 'Följa dina ansökningar',
        content:
          'Under Mina ansökningar ser du alla dina aktiva ansökningar. Varje ansökan har en status: Skickad, Granskad, Intervju, Accepterad eller Nekad. Klicka på en ansökan för att se detaljer och eventuella meddelanden från företaget.'
      },
      {
        title: 'Spara praktikplatser',
        content:
          'Klicka på bokmärkes-ikonen på en praktikannons för att spara den. Alla sparade praktikplatser hittar du under Sparade i menyn. Därifrån kan du snabbt söka platser du är intresserad av.'
      },
      {
        title: 'Ansökningsstatus förklarat',
        content:
          '• Skickad — Din ansökan har mottagits\n• Granskad — Företaget har tittat på din ansökan\n• Intervju — Du är kallad till intervju\n• Accepterad — Grattis, du har fått platsen!\n• Nekad — Tyvärr gick det inte denna gång\n\nDu får notifikationer vid statusändringar.'
      }
    ]
  },
  {
    id: 'ai-tools',
    icon: 'sparkles',
    title: 'AI-verktyg',
    description: 'Matchning, personligt brev, intervjuprep och kompetensanalys.',
    articles: [
      {
        title: 'AI-assistenten (Bubble Chat)',
        content:
          'Klicka på chattbubblan nere till höger för att öppna AI-assistenten. Den har tillgång till hela din profil — ansökningar, praktikplatser, journal, mål och mer. Ställ frågor som "Vilka platser har jag sökt?", "Hjälp mig med mitt CV" eller "Vilka kompetenser bör jag utveckla?".'
      },
      {
        title: 'Matchningsanalys',
        content:
          'Under AI-verktyg hittar du matchningsanalysen. AI:n jämför dina kompetenser, erfarenheter och önskemål med tillgängliga praktikplatser och ger dig en procent-matchning. Ju högre match, desto bättre passar platsen dig.'
      },
      {
        title: 'Personligt brev-generatorn',
        content:
          'AI:n kan skapa ett skräddarsytt personligt brev baserat på din profil och den specifika praktikplatsen. Gå till AI-verktyg → Personligt brev, välj en praktikplats och klicka "Generera". Du kan sedan redigera och anpassa brevet.'
      },
      {
        title: 'Intervjuförberedelse',
        content:
          'Öva inför intervjuer med AI:ns intervjuprep. Den ställer relevanta frågor baserat på branschen och rollen du söker. Du får feedback på dina svar och tips på hur du kan förbättra dem. Perfekt för att känna dig trygg inför den riktiga intervjun.'
      },
      {
        title: 'Kompetensanalys',
        content:
          'AI:n analyserar dina kompetenser jämfört med vad arbetsmarknaden efterfrågar. Du får förslag på kompetenser att utveckla, kurser att ta och hur du kan stärka din profil. Analysen uppdateras löpande baserat på marknadstrender.'
      },
      {
        title: 'Skill Gap-analys',
        content:
          'Jämför dina kompetenser med en specifik praktikplats krav. AI:n visar vilka kompetenser du har som matchar, vilka du saknar och föreslår hur du kan fylla gapen. Hjälper dig prioritera din kompetensutveckling.'
      }
    ]
  },
  {
    id: 'journal',
    icon: 'notebook',
    title: 'LIA-dagbok & Journal',
    description: 'Journal, mål, tidsrapportering, anteckningar och möten.',
    articles: [
      {
        title: 'Skriva dagbok',
        content:
          'Gå till Journal i menyn. Klicka "Nytt inlägg" för att skapa en dagbokspost. Beskriv vad du gjort under dagen, vad du lärt dig och eventuella reflektioner. Journalen hjälper dig dokumentera din LIA-period systematiskt.'
      },
      {
        title: 'Sätta och följa mål',
        content:
          'Under Journal → Mål kan du skapa personliga mål för din praktik. Varje mål har en titel, beskrivning, deadline och status. Du kan markera mål som pågående eller avklarade. Diskutera dina mål med din handledare för bättre utveckling.'
      },
      {
        title: 'Tidsrapportering',
        content:
          'I Journal → Tid loggar du dina arbetstimmar. Ange datum, start/sluttid och vad du arbetade med. Tidsrapporten ger dig och din utbildningsansvarig en översikt över din närvaro och arbetsinsats.'
      },
      {
        title: 'Anteckningar',
        content:
          'Under Journal → Anteckningar kan du skapa fria anteckningar kopplade till din praktik. Använd den rika texteditorn för att formatera dina anteckningar med rubriker, listor och markerad text. Perfekt för mötesanteckningar, uppgiftslistor eller idéer.'
      },
      {
        title: 'Möten & handledare',
        content:
          'I Journal → Möten bokar och dokumenterar du handledarmöten. Ange datum, tid, deltagare och dagordning. Efter mötet kan du lägga till anteckningar och action points. Kontakter hanteras under Journal → Kontakter.'
      },
      {
        title: 'LIA-rapport',
        content:
          'Under Journal → Rapport kan du sammanställa din LIA-rapport. AI:n kan hjälpa dig strukturera och skriva rapporten baserat på dina journalanteckningar, mål och tidsrapporter.'
      }
    ]
  },
  {
    id: 'portfolio',
    icon: 'portfolio',
    title: 'Portfolio & CV',
    description: 'Bygg din portfolio, ladda upp dokument och visa kompetenser.',
    articles: [
      {
        title: 'Skapa din portfolio',
        content:
          'Gå till Portfolio i menyn. Här samlar du allt som visar din kompetens: projekt, certifikat, arbetsexempel och dokument. Klicka "Lägg till" för att skapa ett nytt portfolio-objekt med titel, beskrivning, bild och taggar.'
      },
      {
        title: 'Ladda upp dokument',
        content:
          'I Portfolio kan du ladda upp CV, personliga brev, certifikat och andra dokument. Stödda format: PDF, DOC, DOCX, JPG, PNG (max 10 MB). Filerna lagras säkert och kan delas med företag via dina ansökningar.'
      },
      {
        title: 'Kompetensöversikt',
        content:
          'Din profil visar en kompetensöversikt med alla dina registrerade kunskaper. Kompetenserna grupperas i kategorier och kan betygsättas. Företag kan söka efter studenter baserat på kompetenser.'
      }
    ]
  },
  {
    id: 'calendar',
    icon: 'calendar',
    title: 'Kalender & Schemaläggning',
    description: 'Hantera möten, intervjuer och deadlines.',
    articles: [
      {
        title: 'Använda kalendern',
        content:
          'Kalendern visar alla dina inbokade aktiviteter: intervjuer, handledarmöten, deadlines för ansökningar och egna händelser. Använd månads-, vecko- eller dagvyn för att få översikt. Klicka på en dag för att skapa en ny händelse.'
      },
      {
        title: 'Boka intervjuer',
        content:
          'När ett företag kallar dig till intervju får du en notifikation. Intervjun läggs automatiskt till i din kalender med företagsnamn, tid och plats (eller videolänk). Du kan bekräfta eller föreslå ny tid.'
      }
    ]
  },
  {
    id: 'inbox',
    icon: 'inbox',
    title: 'Inkorg & Meddelanden',
    description: 'Kommunicera med företag, handledare och plattformen.',
    articles: [
      {
        title: 'Läsa och svara på meddelanden',
        content:
          'Inkorgen samlar alla meddelanden från företag, handledare och systemet. Olästa meddelanden visas med en markering. Klicka på ett meddelande för att läsa det och svara direkt i tråden.'
      },
      {
        title: 'Notifikationer',
        content:
          'Du får notifikationer för: nya meddelanden, statusändringar på ansökningar, intervjuinbjudningar, påminnelser om deadlines och systemuppdateringar. Hantera dina notifikationer under Konto → Notifikationer.'
      }
    ]
  },
  {
    id: 'resources',
    icon: 'bulb',
    title: 'Resurser & Blogg',
    description: 'Artiklar, guider och tips för att lyckas med din praktik.',
    articles: [
      {
        title: 'Bläddra bland resurser',
        content:
          'Under Resurser hittar du artiklar, guider och blogginlägg om praktik, karriär och kompetensutveckling. Artiklarna skrivs av branschexperter och uppdateras regelbundet. Använd sökfunktionen för att hitta specifika ämnen.'
      },
      {
        title: 'Tips för en lyckad praktik',
        content:
          '• Var proaktiv och ta egna initiativ\n• Ställ frågor — det visar engagemang\n• Dokumentera vad du lär dig i journalen\n• Nätverka med kollegor och handledare\n• Sätt tydliga mål och följ upp dem\n• Be om feedback regelbundet\n• Uppdatera din portfolio löpande'
      }
    ]
  },
  {
    id: 'kanban',
    icon: 'kanban',
    title: 'Kanban & Uppgifter',
    description: 'Organisera uppgifter med drag-and-drop.',
    articles: [
      {
        title: 'Använda Kanban-tavlan',
        content:
          'Kanban-tavlan hjälper dig organisera uppgifter i kolumner: Att göra, Pågående och Klart. Dra kort mellan kolumner för att uppdatera status. Klicka "+" för att skapa ett nytt kort. Varje kort kan ha en titel, beskrivning, etikett och deadline.'
      },
      {
        title: 'Skapa och redigera kort',
        content:
          'Klicka på ett kort för att redigera det. Du kan ändra titel, beskrivning, tilldela etiketter (färgkodade) och sätta deadline. Kort kan sorteras inom kolumner genom att dra dem uppåt eller nedåt.'
      }
    ]
  },
  {
    id: 'company',
    icon: 'building',
    title: 'För företag',
    description: 'Skapa annonser, hantera ansökningar och hitta praktikanter.',
    articles: [
      {
        title: 'Skapa en praktikannons',
        content:
          'Gå till Mina annonser och klicka "Skapa ny annons". Fyll i titel, beskrivning, krav, kompetenser, plats och praktikperiod. Välj om annonsen ska vara publik direkt eller sparas som utkast. Publicerade annonser visas för alla studenter.'
      },
      {
        title: 'Granska ansökningar',
        content:
          'Under Ansökningar ser du alla inkomna ansökningar. Varje ansökan visar studentens profil, CV och personligt brev. Du kan ändra status (Granskad, Intervju, Accepterad, Nekad) och skicka meddelanden direkt till studenten.'
      },
      {
        title: 'Kommunicera med studenter',
        content:
          'Via Inkorgen kan du kommunicera direkt med sökande studenter. Du kan ställa frågor, boka intervjuer eller skicka kompletterande information. Alla meddelanden sparas i tråden kopplad till ansökan.'
      }
    ]
  },
  {
    id: 'account',
    icon: 'settings',
    title: 'Konto & Inställningar',
    description: 'Profil, säkerhet, notifikationer och teman.',
    articles: [
      {
        title: 'Uppdatera din profil',
        content:
          'Gå till Konto → Profil för att ändra dina uppgifter. Du kan uppdatera namn, e-post, telefon, adress, utbildning och kompetenser. Ändringar sparas automatiskt.'
      },
      {
        title: 'Byta tema',
        content:
          'Prakto har flera inbyggda teman. Klicka på palette-ikonen uppe till höger i headern för att välja tema. Du kan välja mellan ljusa och mörka teman. Ditt val sparas och tillämpas automatiskt nästa gång du loggar in.'
      },
      {
        title: 'Säkerhet & sekretess',
        content:
          'Autentisering hanteras av Clerk med säker inloggning. Du kan aktivera tvåfaktorsautentisering (2FA) för extra säkerhet. Din data lagras krypterat och delas aldrig med tredje part utan ditt samtycke. Se vår integritetspolicy för mer information.'
      },
      {
        title: 'Hantera notifikationer',
        content:
          'Under Konto → Notifikationer kan du se och hantera alla dina aviseringar. Filtrera på typ (ansökningar, meddelanden, system) och markera som läst/oläst. Klicka på en notifikation för att gå direkt till det relaterade innehållet.'
      }
    ]
  },
  {
    id: 'contact',
    icon: 'send',
    title: 'Kontakta oss',
    description: 'Skicka ett supportärende eller ställ en fråga.',
    articles: []
  }
];

// ─── FAQ data ───────────────────────────────────────────────────

const FAQ_ITEMS = [
  {
    question: 'Hur registrerar jag mig?',
    answer:
      'Klicka "Registrera" på startsidan, välj din roll (student/företag/utbildningsansvarig), fyll i dina uppgifter och verifiera din e-post. Du kan även logga in med Google eller LinkedIn.'
  },
  {
    question: 'Kostar det något att använda Prakto?',
    answer:
      'Prakto är gratis att använda för studenter. Företag och utbildningsansvariga har tillgång till alla grundfunktioner utan kostnad.'
  },
  {
    question: 'Hur fungerar AI-assistenten?',
    answer:
      'AI-assistenten har tillgång till din profil, ansökningar, journal och praktikplatser. Den kan svara på frågor, hjälpa dig skriva personliga brev, förbereda intervjuer och analysera dina kompetenser. Öppna den via chattbubblan nere till höger.'
  },
  {
    question: 'Kan företag se mitt CV automatiskt?',
    answer:
      'Nej, företag ser ditt CV först när du aktivt söker en praktikplats och bifogar det. Du kontrollerar alltid vilka dokument som skickas med din ansökan.'
  },
  {
    question: 'Hur ändrar jag status på min ansökan?',
    answer:
      'Som student kan du inte ändra status på din ansökan — det gör företaget. Du kan dock dra tillbaka en ansökan som är skickad. Du får notifikationer när statusen ändras.'
  },
  {
    question: 'Vad är LIA-dagboken?',
    answer:
      'LIA-dagboken är din digitala journal under praktikperioden. Här dokumenterar du dagliga aktiviteter, sätter mål, rapporterar tid och skriver anteckningar. Den hjälper dig följa din utveckling och kan ligga till grund för din LIA-rapport.'
  },
  {
    question: 'Kan min handledare se min journal?',
    answer:
      'Nej, din journal är privat. Du väljer själv om och vad du vill dela. Vid handledarmöten kan du visa specifika delar av din journal för diskussion.'
  },
  {
    question: 'Hur kontaktar jag support?',
    answer:
      'Använd AI-assistenten via chattbubblan för snabb hjälp, eller ställ din fråga direkt på denna sida. Du kan även nå oss via e-post på kontakt@prakto.se.'
  }
];

// ─── Expandable article ─────────────────────────────────────────

function ArticleItem({ article }: { article: Article }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <button type='button' onClick={() => setIsOpen(!isOpen)} className='w-full text-left'>
      <div className='flex items-center justify-between py-2.5'>
        <span className='text-[13px] text-foreground'>{article.title}</span>
        <Icons.chevronDown
          className={cn(
            'h-3.5 w-3.5 shrink-0 text-muted-foreground/60 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </div>
      {isOpen && (
        <div className='pb-3 pr-6'>
          <p className='whitespace-pre-line text-[13px] leading-relaxed text-muted-foreground'>
            {article.content}
          </p>
        </div>
      )}
    </button>
  );
}

// ─── Category sidebar item ──────────────────────────────────────

function CategoryItem({
  category,
  isActive,
  onClick
}: {
  category: Category;
  isActive: boolean;
  onClick: () => void;
}) {
  const IconComp = Icons[category.icon];
  return (
    <button
      type='button'
      onClick={onClick}
      className={cn(
        'flex items-center gap-2.5 rounded-md px-3 py-2 text-left text-[13px] transition-colors',
        isActive
          ? 'bg-accent font-medium text-foreground'
          : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
      )}
    >
      <IconComp className='h-4 w-4 shrink-0' />
      <span className='truncate'>{category.title}</span>
      <span className='ml-auto text-[11px] text-muted-foreground/60'>
        {category.articles.length}
      </span>
    </button>
  );
}

// ─── FAQ item ───────────────────────────────────────────────────

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <button type='button' onClick={() => setIsOpen(!isOpen)} className='w-full text-left'>
      <div className='flex items-center justify-between py-3'>
        <span className='text-[13px] font-medium text-foreground'>{question}</span>
        <Icons.chevronDown
          className={cn(
            'h-3.5 w-3.5 shrink-0 text-muted-foreground/60 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </div>
      {isOpen && (
        <div className='pb-3 pr-6'>
          <p className='whitespace-pre-line text-[13px] leading-relaxed text-muted-foreground'>
            {answer}
          </p>
        </div>
      )}
    </button>
  );
}

// ─── Contact Form ───────────────────────────────────────────────

function ContactForm() {
  const queryClient = useQueryClient();
  const [submitted, setSubmitted] = useState(false);
  const [category, setCategory] = useState('other');

  const mutation = useMutation({
    mutationFn: createSupportTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supportKeys.all });
      setSubmitted(true);
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const subject = (fd.get('subject') as string)?.trim();
    const message = (fd.get('message') as string)?.trim();
    if (!subject || !message) return;

    mutation.mutate({
      name: (fd.get('name') as string) ?? '',
      email: (fd.get('email') as string) ?? '',
      category,
      subject,
      message
    });
  };

  if (submitted) {
    return (
      <Card>
        <CardContent className='flex flex-col items-center gap-3 py-10'>
          <div className='flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10'>
            <Icons.check className='h-6 w-6 text-emerald-500' />
          </div>
          <h3 className='text-base font-semibold'>Tack för ditt meddelande!</h3>
          <p className='text-muted-foreground max-w-sm text-center text-sm'>
            Vi har tagit emot ditt ärende och återkommer så snart som möjligt.
          </p>
          <Button variant='outline' size='sm' className='mt-2' onClick={() => setSubmitted(false)}>
            Skicka ett till
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-base'>Kontakta oss</CardTitle>
        <CardDescription>
          Hittar du inte svaret ovan? Skicka ett ärende så återkommer vi.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className='grid gap-4' onSubmit={handleSubmit}>
          <div className='grid grid-cols-2 gap-4'>
            <div className='grid gap-2'>
              <Label htmlFor='s-name'>Namn</Label>
              <Input id='s-name' name='name' placeholder='Ditt namn' />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='s-email'>E-post</Label>
              <Input id='s-email' name='email' type='email' placeholder='din@email.se' />
            </div>
          </div>
          <div className='grid gap-2'>
            <Label>Kategori</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUPPORT_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='s-subject'>Ämne</Label>
            <Input
              id='s-subject'
              name='subject'
              placeholder='Kort beskrivning av ditt ärende'
              required
            />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='s-message'>Meddelande</Label>
            <Textarea
              id='s-message'
              name='message'
              placeholder='Beskriv ditt problem eller din fråga i detalj...'
              className='min-h-[120px]'
              required
            />
          </div>
          {mutation.isError && (
            <p className='text-destructive text-sm'>
              {mutation.error?.message || 'Något gick fel. Försök igen.'}
            </p>
          )}
          <div className='flex justify-end'>
            <Button type='submit' isLoading={mutation.isPending}>
              <Icons.send className='mr-2 h-4 w-4' />
              Skicka ärende
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── Main page ──────────────────────────────────────────────────

export default function SupportPage() {
  const [activeCategory, setActiveCategory] = useState<string>(CATEGORIES[0].id);
  const [searchQuery, setSearchQuery] = useState('');

  const activeCat = CATEGORIES.find((c) => c.id === activeCategory);

  // Filter categories and articles by search
  const filteredCategories = searchQuery.trim()
    ? CATEGORIES.filter(
        (c) =>
          c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.articles.some(
            (a) =>
              a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              a.content.toLowerCase().includes(searchQuery.toLowerCase())
          )
      )
    : CATEGORIES;

  const filteredArticles = activeCat
    ? searchQuery.trim()
      ? activeCat.articles.filter(
          (a) =>
            a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.content.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : activeCat.articles
    : [];

  return (
    <PageContainer
      pageTitle='Support & Dokumentation'
      pageDescription='Guider, FAQ och hjälp för Prakto.'
    >
      {/* Search */}
      <div className='relative mb-6'>
        <Icons.search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60' />
        <input
          type='text'
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder='Sök ...'
          className='h-9 w-full max-w-sm rounded-md border border-border bg-transparent pl-9 pr-3 text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring'
        />
      </div>

      {/* Two-column layout */}
      <div className='flex gap-6 pb-8'>
        {/* Sidebar */}
        <nav className='hidden w-[220px] shrink-0 flex-col gap-0.5 md:flex'>
          <p className='mb-1 px-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60'>
            Kategorier
          </p>
          {filteredCategories.map((cat) => (
            <CategoryItem
              key={cat.id}
              category={cat}
              isActive={activeCategory === cat.id}
              onClick={() => setActiveCategory(cat.id)}
            />
          ))}
        </nav>

        {/* Mobile category select */}
        <div className='mb-4 md:hidden'>
          <select
            value={activeCategory}
            onChange={(e) => setActiveCategory(e.target.value)}
            className='h-9 w-full rounded-md border border-border bg-transparent px-3 text-[13px] text-foreground'
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.title}
              </option>
            ))}
          </select>
        </div>

        {/* Content */}
        <div className='min-w-0 flex-1'>
          {activeCat && activeCategory === 'contact' ? (
            <ContactForm />
          ) : activeCat ? (
            <div>
              <h2 className='text-base font-semibold text-foreground'>{activeCat.title}</h2>
              <p className='mt-0.5 text-[13px] text-muted-foreground'>{activeCat.description}</p>

              <div className='mt-4 divide-y divide-border/40'>
                {filteredArticles.length > 0 ? (
                  filteredArticles.map((article) => (
                    <ArticleItem key={article.title} article={article} />
                  ))
                ) : (
                  <p className='py-6 text-[13px] text-muted-foreground'>
                    Inga artiklar matchar din sökning.
                  </p>
                )}
              </div>
            </div>
          ) : null}

          {/* FAQ */}
          <div className='mt-10 border-t border-border/40 pt-6'>
            <h2 className='text-base font-semibold text-foreground'>Vanliga frågor</h2>
            <div className='mt-2 divide-y divide-border/40'>
              {FAQ_ITEMS.map((faq) => (
                <FaqItem key={faq.question} question={faq.question} answer={faq.answer} />
              ))}
            </div>
          </div>

          {/* Footer */}
          <p className='mt-8 text-[12px] text-muted-foreground/60'>
            Du kan även nå oss via AI-assistenten (chattbubblan) eller e-post: kontakt@prakto.se
          </p>
        </div>
      </div>
    </PageContainer>
  );
}
