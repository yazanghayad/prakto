'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { studentProfileOptions } from '@/features/profile/api/queries';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/icons';
import { toast } from 'sonner';

// ─── Tone options ─────────────────────────────────────────────

const toneOptions = [
  { value: 'formal', label: 'Formellt' },
  { value: 'semi-formal', label: 'Halvformellt' },
  { value: 'casual', label: 'Personligt' }
] as const;

type Tone = (typeof toneOptions)[number]['value'];

// ─── Section Header ──────────────────────────────────────────

function SectionHeader({
  icon: IconComponent,
  title,
  description
}: Readonly<{
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
}>) {
  return (
    <div className='flex items-start gap-3'>
      <div className='bg-muted flex h-9 w-9 shrink-0 items-center justify-center rounded-lg'>
        <IconComponent className='h-4 w-4' />
      </div>
      <div className='space-y-0.5'>
        <h3 className='text-base font-semibold leading-none'>{title}</h3>
        {description && <p className='text-muted-foreground text-sm'>{description}</p>}
      </div>
    </div>
  );
}

// ─── Letter Generator ─────────────────────────────────────────

function generateLetterText(data: {
  yourName: string;
  school: string;
  program: string;
  city: string;
  companyName: string;
  positionTitle: string;
  contactPerson: string;
  whyCompany: string;
  whatYouBring: string;
  personalQualities: string;
  tone: Tone;
}): string {
  const today = new Date().toLocaleDateString('sv-SE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const greeting = data.contactPerson ? `Hej ${data.contactPerson},` : 'Hej,';

  const closingMap: Record<Tone, string> = {
    formal: 'Med vänliga hälsningar,',
    'semi-formal': 'Vänliga hälsningar,',
    casual: 'Hälsningar,'
  };

  const lines: string[] = [];

  // Header
  lines.push(data.yourName || 'Ditt namn');
  if (data.city) lines.push(data.city);
  lines.push(today);
  lines.push('');

  // Company
  if (data.companyName) lines.push(data.companyName);
  lines.push('');

  // Subject
  if (data.positionTitle) {
    lines.push(`Ansökan: ${data.positionTitle}`);
    lines.push('');
  }

  // Greeting
  lines.push(greeting);
  lines.push('');

  // Intro paragraph
  const intro = data.positionTitle
    ? `Jag skriver för att ansöka om praktikplatsen som ${data.positionTitle}${data.companyName ? ` hos ${data.companyName}` : ''}.`
    : `Jag skriver för att ansöka om en praktikplats${data.companyName ? ` hos ${data.companyName}` : ''}.`;

  const eduInfo =
    data.school || data.program
      ? ` Jag studerar${data.program ? ` ${data.program}` : ''}${data.school ? ` på ${data.school}` : ''} och söker nu en praktikplats för att utveckla mina kunskaper i praktiken.`
      : '';

  lines.push(intro + eduInfo);
  lines.push('');

  // Why this company
  if (data.whyCompany.trim()) {
    lines.push(data.whyCompany.trim());
    lines.push('');
  }

  // What you bring
  if (data.whatYouBring.trim()) {
    lines.push(data.whatYouBring.trim());
    lines.push('');
  }

  // Personal qualities
  if (data.personalQualities.trim()) {
    lines.push(data.personalQualities.trim());
    lines.push('');
  }

  // Closing
  lines.push(
    'Jag ser fram emot möjligheten att diskutera hur jag kan bidra till ert team. Tveka inte att kontakta mig om ni har frågor.'
  );
  lines.push('');
  lines.push(closingMap[data.tone]);
  lines.push(data.yourName || 'Ditt namn');

  return lines.join('\n');
}

// ─── Letter Preview ──────────────────────────────────────────

function LetterPreview({
  letterText,
  hasContent
}: Readonly<{
  letterText: string;
  hasContent: boolean;
}>) {
  if (!hasContent) {
    return (
      <div className='text-muted-foreground flex flex-col items-center justify-center py-12 text-center text-sm'>
        <Icons.writing className='mb-3 h-10 w-10 opacity-30' />
        <p>Fyll i formuläret för att se en förhandsvisning av brevet.</p>
      </div>
    );
  }

  return <div className='whitespace-pre-line text-sm leading-relaxed'>{letterText}</div>;
}

// ─── Main Component ──────────────────────────────────────────

export default function LetterGenerator() {
  const { profile } = useUser();
  const userId = profile?.userId ?? '';

  const { data: studentProfile } = useQuery({
    ...studentProfileOptions(userId),
    enabled: !!userId
  });

  const [yourName, setYourName] = useState('');
  const [school, setSchool] = useState('');
  const [program, setProgram] = useState('');
  const [city, setCity] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [positionTitle, setPositionTitle] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [whyCompany, setWhyCompany] = useState('');
  const [whatYouBring, setWhatYouBring] = useState('');
  const [personalQualities, setPersonalQualities] = useState('');
  const [tone, setTone] = useState<Tone>('semi-formal');
  const [generated, setGenerated] = useState(false);

  // Pre-fill from profiles
  useEffect(() => {
    if (profile?.displayName) setYourName(profile.displayName);
  }, [profile]);

  useEffect(() => {
    if (studentProfile) {
      if (studentProfile.school) setSchool(studentProfile.school);
      if (studentProfile.program) setProgram(studentProfile.program);
      if (studentProfile.city) setCity(studentProfile.city);
    }
  }, [studentProfile]);

  const letterText = generateLetterText({
    yourName,
    school,
    program,
    city,
    companyName,
    positionTitle,
    contactPerson,
    whyCompany,
    whatYouBring,
    personalQualities,
    tone
  });

  const hasContent = !!(yourName || companyName || whyCompany);

  function handleGenerate() {
    if (!yourName.trim()) {
      toast.error('Ange ditt namn');
      return;
    }
    if (!companyName.trim()) {
      toast.error('Ange företagsnamn');
      return;
    }
    setGenerated(true);
    toast.success('Personligt brev genererat!');
  }

  function handleCopy() {
    navigator.clipboard.writeText(letterText);
    toast.success('Brev kopierat till urklipp');
  }

  function handleDownload() {
    const blob = new Blob([letterText], {
      type: 'text/plain;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeName = yourName.trim().replace(/\s+/g, '_') || 'Brev';
    a.download = `${safeName}_Personligt_Brev.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className='grid gap-6 lg:grid-cols-[1fr_350px]'>
      {/* ─── Form ──────────────────────────────────────────── */}
      <div className='space-y-6'>
        {/* About you */}
        <Card>
          <CardHeader>
            <SectionHeader
              icon={Icons.user}
              title='Om dig'
              description='Dina personuppgifter och utbildning.'
            />
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='space-y-2'>
                <Label htmlFor='yourName'>Ditt namn *</Label>
                <Input
                  id='yourName'
                  value={yourName}
                  onChange={(e) => setYourName(e.target.value)}
                  placeholder='Anna Andersson'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='letterCity'>Stad</Label>
                <Input
                  id='letterCity'
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder='Stockholm'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='letterSchool'>Skola</Label>
                <Input
                  id='letterSchool'
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                  placeholder='Stockholms universitet'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='letterProgram'>Program</Label>
                <Input
                  id='letterProgram'
                  value={program}
                  onChange={(e) => setProgram(e.target.value)}
                  placeholder='Systemvetenskap'
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recipient */}
        <Card>
          <CardHeader>
            <SectionHeader
              icon={Icons.building}
              title='Mottagare'
              description='Information om företaget och praktikplatsen du söker.'
            />
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='space-y-2'>
                <Label htmlFor='companyName'>Företagsnamn *</Label>
                <Input
                  id='companyName'
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder='Företag AB'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='contactPerson'>Kontaktperson (valfritt)</Label>
                <Input
                  id='contactPerson'
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder='Erik Eriksson'
                />
              </div>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='positionTitle'>Praktikplatsens titel</Label>
              <Input
                id='positionTitle'
                value={positionTitle}
                onChange={(e) => setPositionTitle(e.target.value)}
                placeholder='Webbutvecklare, UX-designer, Marknadsassistent...'
              />
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        <Card>
          <CardHeader>
            <SectionHeader
              icon={Icons.writing}
              title='Brevinnehåll'
              description='Skriv innehållet i ditt personliga brev.'
            />
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='whyCompany'>Varför just detta företag?</Label>
              <Textarea
                id='whyCompany'
                value={whyCompany}
                onChange={(e) => setWhyCompany(e.target.value)}
                placeholder='Beskriv varför du är intresserad av just detta företag och vad som lockar dig med deras verksamhet...'
                rows={3}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='whatYouBring'>Vad kan du bidra med?</Label>
              <Textarea
                id='whatYouBring'
                value={whatYouBring}
                onChange={(e) => setWhatYouBring(e.target.value)}
                placeholder='Beskriv dina relevanta kunskaper, erfarenheter och vad du kan tillföra i praktiken...'
                rows={3}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='personalQualities'>Personliga egenskaper</Label>
              <Textarea
                id='personalQualities'
                value={personalQualities}
                onChange={(e) => setPersonalQualities(e.target.value)}
                placeholder='Beskriv dig själv och dina egenskaper som gör dig till en bra kandidat...'
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Tone */}
        <Card>
          <CardHeader>
            <SectionHeader
              icon={Icons.adjustments}
              title='Ton'
              description='Välj tonen för ditt personliga brev.'
            />
          </CardHeader>
          <CardContent>
            <div className='flex gap-3'>
              {toneOptions.map((option) => (
                <Button
                  key={option.value}
                  type='button'
                  variant={tone === option.value ? 'default' : 'outline'}
                  size='sm'
                  onClick={() => setTone(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Generate button */}
        <div className='flex gap-3'>
          <Button onClick={handleGenerate} size='lg' className='flex-1'>
            <Icons.sparkles className='mr-2 h-4 w-4' />
            Generera personligt brev
          </Button>
        </div>
      </div>

      {/* ─── Sidebar / Preview ─────────────────────────────── */}
      <div className='lg:sticky lg:top-4 lg:self-start'>
        <Card>
          <CardHeader className='flex-row items-center justify-between space-y-0 pb-3'>
            <h3 className='text-sm font-semibold'>Förhandsvisning</h3>
            {generated && (
              <div className='flex gap-1'>
                <Button variant='ghost' size='sm' onClick={handleCopy}>
                  <Icons.post className='mr-1 h-3.5 w-3.5' />
                  Kopiera
                </Button>
                <Button variant='ghost' size='sm' onClick={handleDownload}>
                  <Icons.download className='mr-1 h-3.5 w-3.5' />
                  Ladda ner
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <LetterPreview letterText={letterText} hasContent={hasContent} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
