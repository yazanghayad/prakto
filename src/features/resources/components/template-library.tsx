'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

// ─── Data ─────────────────────────────────────────────────────

interface Template {
  id: string;
  title: string;
  description: string;
  category: 'cv' | 'brev' | 'tackbrev' | 'ovrigt';
  /** PDF file name in /assets/templates/ — null = text-only template */
  pdfFile: string | null;
  content: string;
}

const categoryLabels: Record<string, string> = {
  alla: 'Alla mallar',
  cv: 'CV-mallar',
  brev: 'Personligt brev',
  tackbrev: 'Tackbrev',
  ovrigt: 'Övrigt'
};

const templates: Template[] = [
  {
    id: 'cv-klassisk',
    title: 'Klassiskt CV',
    description: 'Traditionellt CV-format med tydliga sektioner. Passar alla branscher.',
    category: 'cv',
    pdfFile: 'klassiskt-cv.pdf',
    content: `NAMN EFTERNAMN
Adress | Telefon | E-post | LinkedIn

─── PROFIL ───
[Kort sammanfattning om dig själv, 2–3 meningar. Vad du studerar, vad du vill och vad du kan erbjuda.]

─── UTBILDNING ───
Program/Utbildning — Skola
Period: Månad År – Månad År
• Relevant kursinfo eller inriktning

─── ERFARENHET ───
Roll/Titel — Företag/Organisation
Period: Månad År – Månad År
• Beskriv vad du gjorde, resultat och ansvar
• Använd aktiva verb: ledde, skapade, utvecklade

─── FÄRDIGHETER ───
• Tekniska: [t.ex. Office, programmering, verktyg]
• Språk: [t.ex. Svenska (modersmål), Engelska (flytande)]
• Mjuka: [t.ex. Samarbete, kommunikation, problemlösning]

─── ÖVRIGT ───
• Körkort: [Ja/Nej]
• Intressen: [Relevanta fritidsintressen]
• Referenser: Lämnas på begäran`
  },
  {
    id: 'cv-kreativ',
    title: 'Kreativt CV',
    description: 'Mer personligt format med "Om mig"-sektion. Bra för kreativa branscher.',
    category: 'cv',
    pdfFile: 'kreativt-cv.pdf',
    content: `✦ NAMN EFTERNAMN ✦
[Tagline — t.ex. "Kreativ student med passion för design"]

☎ Telefon  ✉ E-post  🔗 Portfolio/LinkedIn

───────────────────
OM MIG
───────────────────
[Berätta vem du är — personligt men professionellt. Vad driver dig? Vad gör dig unik? 3–4 meningar.]

───────────────────
VAD JAG KAN
───────────────────
★ Kompetens 1 — Kort beskrivning
★ Kompetens 2 — Kort beskrivning
★ Kompetens 3 — Kort beskrivning

───────────────────
ERFARENHET & PROJEKT
───────────────────
▸ Projekt/Roll — Kontext
  Vad du gjorde och vad resultatet blev.

▸ Projekt/Roll — Kontext
  Vad du gjorde och vad resultatet blev.

───────────────────
UTBILDNING
───────────────────
▸ Program — Skola (År–År)

───────────────────
INTRESSEN
───────────────────
[Lista relevanta intressen som visar personlighet]`
  },
  {
    id: 'brev-formellt',
    title: 'Formellt personligt brev',
    description: 'Professionellt format för praktik- och jobbansökningar.',
    category: 'brev',
    pdfFile: 'formellt-personligt-brev.pdf',
    content: `Namn Efternamn
Adress
Telefon | E-post

Mottagarens namn
Företagsnamn
Datum

Ansökan om praktik som [Roll]

Hej [Namn/Rekryterare],

[Stycke 1 – Inledning]
Jag skriver med anledning av den utannonserade praktikplatsen som [roll] hos [företag]. Jag studerar [program] vid [skola] och söker praktik under perioden [datum].

[Stycke 2 – Varför du?]
Under min utbildning har jag utvecklat kunskaper inom [område]. Jag har bland annat [konkret erfarenhet/projekt]. Det som utmärker mig är [personlig egenskap + bevis].

[Stycke 3 – Varför företaget?]
Jag söker mig till [företag] eftersom [specifik anledning — värderingar, projekt, bransch]. Jag tror att jag kan bidra med [konkret bidrag].

[Stycke 4 – Avslutning]
Jag bifogar mitt CV och ser fram emot att höra från er. Jag finns tillgänglig för intervju vid valfri tidpunkt.

Med vänlig hälsning,
Namn Efternamn`
  },
  {
    id: 'brev-personligt',
    title: 'Personligt & engagerat brev',
    description: 'Varmare ton som visar passion. Passar startups och kreativa företag.',
    category: 'brev',
    pdfFile: 'personligt-engagerat-brev.pdf',
    content: `Hej [Namn]!

Jag heter [ditt namn] och jag är [ålder] år, studerar [program] i [stad]. Jag skriver till er eftersom jag verkligen vill göra min praktik hos [företag] — och här är varför.

[Berätta en kort historia — vad väckte ditt intresse? Ett projekt du gjort? En upplevelse som fick dig att vilja jobba inom branschen?]

Det jag skulle ta med mig till er är [2–3 egenskaper med konkreta exempel]. Till exempel har jag [beskriv projekt/erfarenhet som visar det].

Jag har googlat en hel del om [företag] och det som tilltalar mig mest är [specifik sak — projekt, kultur, produkt]. Jag tror att jag kan lära mig enormt mycket hos er, och förhoppningsvis bidra med [konkret sak].

Jag bifogar mitt CV och svarar gärna på frågor. Hoppas vi hörs!

Varma hälsningar,
[Namn]

P.S. [Valfri personlig touch — t.ex. "Kolla gärna mitt portfolio: länk"]`
  },
  {
    id: 'tackbrev',
    title: 'Tackbrev efter intervju',
    description: 'Skicka ett tackmeddelande efter en intervju — visar professionalism.',
    category: 'tackbrev',
    pdfFile: 'tackbrev-efter-intervju.pdf',
    content: `Ämne: Tack för intervjun — [Roll] hos [Företag]

Hej [Intervjuarens namn],

Tack så mycket för en trevlig intervju [idag/igår/datum]. Det var inspirerande att höra mer om [specifik sak ni pratade om — projekt, teamet, företagets vision].

Jag blev ännu mer motiverad efter vårt samtal. [Referera till något specifikt från intervjun — t.ex. "Särskilt intressant var det du berättade om ert arbete med X."]

Jag ser verkligen fram emot möjligheten att bidra till [företag/teamet]. Om ni behöver kompletterande uppgifter, tveka inte att höra av er.

Med vänlig hälsning,
[Namn]
[Telefon]
[E-post]`
  },
  {
    id: 'tackbrev-praktik',
    title: 'Tack till handledare efter praktik',
    description: 'Avsluta praktiken professionellt med ett personligt tack.',
    category: 'tackbrev',
    pdfFile: 'tackbrev-till-handledare.pdf',
    content: `Hej [Handledarens namn],

Nu när min praktikperiod hos [företag] är avslutad vill jag ta tillfället att tacka dig — och hela teamet — för en fantastisk tid.

Under de här veckorna har jag fått lära mig [specifika saker — t.ex. "hur ni arbetar agilt", "grunderna i UX-design", "hur man hanterar kundrelationer"]. Det har verkligen hjälpt mig förstå vad jag vill jobba med i framtiden.

Jag uppskattar speciellt [specifik sak — t.ex. "att du alltid tog dig tid att förklara", "att jag fick vara med på riktiga projekt"].

Hoppas att vi kan hålla kontakten — jag ser gärna [LinkedIn/framtida möjligheter].

Stort tack igen!
[Namn]`
  },
  {
    id: 'uppfoljning',
    title: 'Uppföljningsmail efter ansökan',
    description: 'Följ upp din ansökan professionellt utan att verka påträngande.',
    category: 'ovrigt',
    pdfFile: null,
    content: `Ämne: Uppföljning — Ansökan om praktik som [Roll]

Hej [Namn],

Jag hoppas att allt är bra. Jag skickar detta meddelande som en uppföljning på min ansökan om praktik som [roll] som jag skickade [datum].

Jag är fortfarande mycket intresserad av möjligheten att göra praktik hos [företag]. Jag tror att mina kunskaper inom [område] och mitt engagemang för [relaterat ämne] skulle vara en bra match.

Om det finns något ytterligare material ni behöver, tveka inte att höra av er.

Tack för er tid och jag ser fram emot att höra från er.

Med vänlig hälsning,
[Namn]
[Telefon]
[E-post]`
  },
  {
    id: 'linkedin-kontakt',
    title: 'LinkedIn-kontaktförfrågan',
    description: 'Kort meddelande till potentiella handledare eller kontakter.',
    category: 'ovrigt',
    pdfFile: null,
    content: `Hej [Namn]!

Jag heter [ditt namn] och studerar [program] i [stad]. Jag är nyfiken på [företag/bransch] och såg att du jobbar med [område].

Jag söker praktik inom [område] och skulle uppskatta att kunna ställa en fråga eller två om hur det är att jobba hos er.

Tack på förhand och trevlig dag!

Med vänliga hälsningar,
[Namn]`
  }
];

// ─── Template Card ────────────────────────────────────────────

function TemplateCard({ template }: Readonly<{ template: Template }>) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(template.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card className={cn('transition-shadow', expanded && 'ring-primary/20 ring-2')}>
      <CardHeader className='pb-3'>
        <div className='flex items-start justify-between gap-2'>
          <div>
            <CardTitle className='flex items-center gap-2 text-base'>
              {template.pdfFile && <Icons.fileTypePdf className='text-red-500 h-5 w-5 shrink-0' />}
              {template.title}
            </CardTitle>
            <CardDescription className='mt-1 text-xs'>{template.description}</CardDescription>
          </div>
          <Badge variant='outline' className='shrink-0 text-[10px]'>
            {categoryLabels[template.category]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className='space-y-3'>
        {template.pdfFile && (
          <div className='bg-muted/50 flex items-center gap-3 rounded-lg border p-3'>
            <Icons.fileTypePdf className='text-red-500 h-8 w-8 shrink-0' />
            <div className='min-w-0 flex-1'>
              <p className='text-sm font-medium'>Fyllbar PDF-mall</p>
              <p className='text-muted-foreground text-xs'>
                Ladda ner och fyll i direkt i din PDF-läsare
              </p>
            </div>
            <Button asChild size='sm'>
              <a href={`/assets/templates/${template.pdfFile}`} download={template.pdfFile}>
                <Icons.download className='mr-1.5 h-3.5 w-3.5' />
                Ladda ner PDF
              </a>
            </Button>
          </div>
        )}

        {expanded && (
          <pre className='bg-muted max-h-80 overflow-auto rounded-lg p-4 text-xs leading-relaxed whitespace-pre-wrap'>
            {template.content}
          </pre>
        )}
        <div className='flex gap-2'>
          <Button variant='outline' size='sm' onClick={() => setExpanded(!expanded)}>
            {expanded ? (
              <>
                <Icons.chevronUp className='mr-1.5 h-3.5 w-3.5' />
                Dölj text
              </>
            ) : (
              <>
                <Icons.eye className='mr-1.5 h-3.5 w-3.5' />
                Visa textmall
              </>
            )}
          </Button>
          <Button variant='outline' size='sm' onClick={handleCopy}>
            {copied ? (
              <>
                <Icons.check className='mr-1.5 h-3.5 w-3.5' />
                Kopierad!
              </>
            ) : (
              <>
                <Icons.clipboardCopy className='mr-1.5 h-3.5 w-3.5' />
                Kopiera text
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Component ──────────────────────────────────────────

export default function TemplateLibrary() {
  const tabCategories = ['alla', 'cv', 'brev', 'tackbrev', 'ovrigt'] as const;

  return (
    <div className='space-y-6'>
      <Tabs defaultValue='alla'>
        <TabsList>
          {tabCategories.map((cat) => (
            <TabsTrigger key={cat} value={cat}>
              {categoryLabels[cat]}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabCategories.map((cat) => {
          const items = cat === 'alla' ? templates : templates.filter((t) => t.category === cat);
          return (
            <TabsContent key={cat} value={cat} className='space-y-4'>
              {items.map((template) => (
                <TemplateCard key={template.id} template={template} />
              ))}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
