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
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { popularSkills } from '@/features/profile/constants/student-options';

// ─── Types ────────────────────────────────────────────────────

interface Education {
  id: string;
  school: string;
  program: string;
  startYear: string;
  endYear: string;
}

interface Experience {
  id: string;
  company: string;
  role: string;
  startYear: string;
  endYear: string;
  description: string;
}

interface Language {
  id: string;
  language: string;
  level: string;
}

// ─── Helpers ──────────────────────────────────────────────────

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

const languageLevels = ['Modersmål', 'Flytande', 'Goda kunskaper', 'Grundläggande'];

// ─── Section Header ──────────────────────────────────────────

function SectionHeader({
  title,
  description
}: Readonly<{
  title: string;
  description?: string;
}>) {
  return (
    <div>
      <h3 className='text-sm font-semibold'>{title}</h3>
      {description && <p className='text-muted-foreground text-xs'>{description}</p>}
    </div>
  );
}

// ─── CV Text Generator ──────────────────────────────────────

function generateCVText(data: {
  fullName: string;
  email: string;
  phone: string;
  city: string;
  linkedinUrl: string;
  summary: string;
  educations: Education[];
  experiences: Experience[];
  skills: string[];
  languages: Language[];
}): string {
  const lines: string[] = [];

  lines.push('═'.repeat(50));
  lines.push(`       ${data.fullName.toUpperCase() || 'DITT NAMN'}`);
  lines.push('═'.repeat(50));
  lines.push('');

  const contact: string[] = [];
  if (data.email) contact.push(data.email);
  if (data.phone) contact.push(data.phone);
  if (data.city) contact.push(data.city);
  if (contact.length) lines.push(contact.join('  •  '));
  if (data.linkedinUrl) lines.push(data.linkedinUrl);
  lines.push('');

  if (data.summary.trim()) {
    lines.push('─── PROFIL ' + '─'.repeat(38));
    lines.push(data.summary.trim());
    lines.push('');
  }

  const validEdu = data.educations.filter((e) => e.school || e.program);
  if (validEdu.length > 0) {
    lines.push('─── UTBILDNING ' + '─'.repeat(34));
    validEdu.forEach((edu) => {
      const period = [edu.startYear, edu.endYear].filter(Boolean).join(' – ');
      lines.push(
        `${edu.program || 'Program'}  |  ${edu.school || 'Skola'}${period ? `  (${period})` : ''}`
      );
    });
    lines.push('');
  }

  const validExp = data.experiences.filter((e) => e.role || e.company);
  if (validExp.length > 0) {
    lines.push('─── ERFARENHET ' + '─'.repeat(34));
    validExp.forEach((exp) => {
      const period = [exp.startYear, exp.endYear].filter(Boolean).join(' – ');
      lines.push(
        `${exp.role || 'Roll'}  |  ${exp.company || 'Företag'}${period ? `  (${period})` : ''}`
      );
      if (exp.description.trim()) lines.push(exp.description.trim());
      lines.push('');
    });
  }

  if (data.skills.length > 0) {
    lines.push('─── KOMPETENSER ' + '─'.repeat(33));
    lines.push(data.skills.join(', '));
    lines.push('');
  }

  const validLang = data.languages.filter((l) => l.language);
  if (validLang.length > 0) {
    lines.push('─── SPRÅK ' + '─'.repeat(39));
    lines.push(
      validLang.map((l) => (l.level ? `${l.language} (${l.level})` : l.language)).join(', ')
    );
    lines.push('');
  }

  return lines.join('\n');
}

function downloadAsText(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── CV Preview ──────────────────────────────────────────────

function CVPreview({
  fullName,
  email,
  phone,
  city,
  linkedinUrl,
  summary,
  educations,
  experiences,
  skills,
  languages
}: Readonly<{
  fullName: string;
  email: string;
  phone: string;
  city: string;
  linkedinUrl: string;
  summary: string;
  educations: Education[];
  experiences: Experience[];
  skills: string[];
  languages: Language[];
}>) {
  const hasContent = fullName || email || summary || educations.some((e) => e.school);

  if (!hasContent) {
    return (
      <div className='text-muted-foreground flex flex-col items-center justify-center py-12 text-center text-sm'>
        <Icons.cvDocument className='mb-3 h-10 w-10 opacity-30' />
        <p>Fyll i formuläret för att se en förhandsvisning av ditt CV.</p>
      </div>
    );
  }

  return (
    <div className='space-y-4 text-sm'>
      {/* Header */}
      <div className='border-b pb-3 text-center'>
        <h2 className='text-lg font-bold tracking-wide'>{fullName || 'Ditt namn'}</h2>
        <div className='text-muted-foreground mt-1 flex flex-wrap justify-center gap-x-3 text-xs'>
          {email && <span>{email}</span>}
          {phone && <span>{phone}</span>}
          {city && <span>{city}</span>}
        </div>
        {linkedinUrl && <p className='text-muted-foreground mt-0.5 text-xs'>{linkedinUrl}</p>}
      </div>

      {/* Summary */}
      {summary.trim() && (
        <div>
          <h4 className='mb-1 text-xs font-semibold uppercase tracking-wider'>Profil</h4>
          <p className='text-muted-foreground text-xs leading-relaxed'>{summary}</p>
        </div>
      )}

      {/* Education */}
      {educations.some((e) => e.school || e.program) && (
        <div>
          <h4 className='mb-1 text-xs font-semibold uppercase tracking-wider'>Utbildning</h4>
          {educations
            .filter((e) => e.school || e.program)
            .map((edu) => (
              <div key={edu.id} className='mb-1'>
                <p className='text-xs font-medium'>{edu.program || 'Program'}</p>
                <p className='text-muted-foreground text-xs'>
                  {edu.school}
                  {(edu.startYear || edu.endYear) &&
                    ` (${[edu.startYear, edu.endYear].filter(Boolean).join(' – ')})`}
                </p>
              </div>
            ))}
        </div>
      )}

      {/* Experience */}
      {experiences.some((e) => e.role || e.company) && (
        <div>
          <h4 className='mb-1 text-xs font-semibold uppercase tracking-wider'>Erfarenhet</h4>
          {experiences
            .filter((e) => e.role || e.company)
            .map((exp) => (
              <div key={exp.id} className='mb-1'>
                <p className='text-xs font-medium'>{exp.role || 'Roll'}</p>
                <p className='text-muted-foreground text-xs'>
                  {exp.company}
                  {(exp.startYear || exp.endYear) &&
                    ` (${[exp.startYear, exp.endYear].filter(Boolean).join(' – ')})`}
                </p>
                {exp.description.trim() && (
                  <p className='text-muted-foreground mt-0.5 text-xs'>{exp.description}</p>
                )}
              </div>
            ))}
        </div>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <div>
          <h4 className='mb-1 text-xs font-semibold uppercase tracking-wider'>Kompetenser</h4>
          <div className='flex flex-wrap gap-1'>
            {skills.map((skill) => (
              <Badge key={skill} variant='secondary' className='text-xs'>
                {skill}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Languages */}
      {languages.some((l) => l.language) && (
        <div>
          <h4 className='mb-1 text-xs font-semibold uppercase tracking-wider'>Språk</h4>
          <p className='text-muted-foreground text-xs'>
            {languages
              .filter((l) => l.language)
              .map((l) => (l.level ? `${l.language} (${l.level})` : l.language))
              .join(', ')}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────

export default function CVGenerator() {
  const { profile } = useUser();
  const userId = profile?.userId ?? '';

  const { data: studentProfile } = useQuery({
    ...studentProfileOptions(userId),
    enabled: !!userId
  });

  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [summary, setSummary] = useState('');
  const [educations, setEducations] = useState<Education[]>([
    { id: generateId(), school: '', program: '', startYear: '', endYear: '' }
  ]);
  const [experiences, setExperiences] = useState<Experience[]>([
    {
      id: generateId(),
      company: '',
      role: '',
      startYear: '',
      endYear: '',
      description: ''
    }
  ]);
  const [skills, setSkills] = useState<string[]>([]);
  const [languages, setLanguages] = useState<Language[]>([
    { id: generateId(), language: '', level: '' }
  ]);
  const [generated, setGenerated] = useState(false);

  // Pre-fill from user profile
  useEffect(() => {
    if (profile?.displayName) setFullName(profile.displayName);
    if (profile?.email) setEmail(profile.email);
  }, [profile]);

  // Pre-fill from student profile
  useEffect(() => {
    if (studentProfile) {
      if (studentProfile.city) setCity(studentProfile.city);
      if (studentProfile.linkedinUrl) setLinkedinUrl(studentProfile.linkedinUrl);
      if (studentProfile.school || studentProfile.program) {
        setEducations([
          {
            id: generateId(),
            school: studentProfile.school ?? '',
            program: studentProfile.program ?? '',
            startYear: '',
            endYear: ''
          }
        ]);
      }
      if (studentProfile.skills?.length) setSkills(studentProfile.skills);
      if (studentProfile.bio) setSummary(studentProfile.bio);
    }
  }, [studentProfile]);

  // Array helpers
  function addEducation() {
    setEducations((prev) => [
      ...prev,
      { id: generateId(), school: '', program: '', startYear: '', endYear: '' }
    ]);
  }
  function removeEducation(id: string) {
    setEducations((prev) => prev.filter((e) => e.id !== id));
  }
  function updateEducation(id: string, field: keyof Omit<Education, 'id'>, value: string) {
    setEducations((prev) => prev.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
  }

  function addExperience() {
    setExperiences((prev) => [
      ...prev,
      {
        id: generateId(),
        company: '',
        role: '',
        startYear: '',
        endYear: '',
        description: ''
      }
    ]);
  }
  function removeExperience(id: string) {
    setExperiences((prev) => prev.filter((e) => e.id !== id));
  }
  function updateExperience(id: string, field: keyof Omit<Experience, 'id'>, value: string) {
    setExperiences((prev) => prev.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
  }

  function addLanguage() {
    setLanguages((prev) => [...prev, { id: generateId(), language: '', level: '' }]);
  }
  function removeLanguage(id: string) {
    setLanguages((prev) => prev.filter((l) => l.id !== id));
  }
  function updateLanguage(id: string, field: keyof Omit<Language, 'id'>, value: string) {
    setLanguages((prev) => prev.map((l) => (l.id === id ? { ...l, [field]: value } : l)));
  }

  function toggleSkill(skill: string) {
    setSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  }

  function handleGenerate() {
    if (!fullName.trim()) {
      toast.error('Ange ditt namn');
      return;
    }
    setGenerated(true);
    toast.success('CV genererat!');
  }

  function handleCopy() {
    const text = generateCVText({
      fullName,
      email,
      phone,
      city,
      linkedinUrl,
      summary,
      educations,
      experiences,
      skills,
      languages
    });
    navigator.clipboard.writeText(text);
    toast.success('CV kopierat till urklipp');
  }

  function handleDownload() {
    const text = generateCVText({
      fullName,
      email,
      phone,
      city,
      linkedinUrl,
      summary,
      educations,
      experiences,
      skills,
      languages
    });
    const safeName = fullName.trim().replace(/\s+/g, '_') || 'CV';
    downloadAsText(text, `${safeName}_CV.txt`);
    toast.success('CV nedladdat');
  }

  return (
    <div className='grid gap-6 lg:grid-cols-[1fr_350px]'>
      {/* ─── Form ──────────────────────────────────────────── */}
      <div className='space-y-6'>
        {/* Personal info */}
        <Card>
          <CardHeader>
            <SectionHeader
              title='Personlig information'
              description='Kontaktuppgifter som visas högst upp i ditt CV.'
            />
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='space-y-2'>
                <Label htmlFor='fullName'>Fullständigt namn *</Label>
                <Input
                  id='fullName'
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder='Anna Andersson'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='email'>E-post</Label>
                <Input
                  id='email'
                  type='email'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder='anna@example.com'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='phone'>Telefon</Label>
                <Input
                  id='phone'
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder='070-123 45 67'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='city'>Stad</Label>
                <Input
                  id='city'
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder='Stockholm'
                />
              </div>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='linkedin'>LinkedIn (valfritt)</Label>
              <Input
                id='linkedin'
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder='https://linkedin.com/in/ditt-namn'
              />
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card>
          <CardHeader>
            <SectionHeader
              title='Profil / Sammanfattning'
              description='En kort presentation av vem du är och vad du söker.'
            />
          </CardHeader>
          <CardContent>
            <Textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder='Jag är en engagerad student som studerar... och söker praktik inom...'
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Education */}
        <Card>
          <CardHeader>
            <SectionHeader
              title='Utbildning'
              description='Din nuvarande och tidigare utbildning.'
            />
          </CardHeader>
          <CardContent className='space-y-4'>
            {educations.map((edu, idx) => (
              <div key={edu.id} className='space-y-3'>
                {idx > 0 && <Separator />}
                <div className='flex items-center justify-between'>
                  <span className='text-muted-foreground text-xs font-medium'>
                    Utbildning {idx + 1}
                  </span>
                  {educations.length > 1 && (
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      onClick={() => removeEducation(edu.id)}
                    >
                      <Icons.trash className='h-3.5 w-3.5' />
                    </Button>
                  )}
                </div>
                <div className='grid gap-3 sm:grid-cols-2'>
                  <div className='space-y-2'>
                    <Label>Skola</Label>
                    <Input
                      value={edu.school}
                      onChange={(e) => updateEducation(edu.id, 'school', e.target.value)}
                      placeholder='Stockholms universitet'
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Program</Label>
                    <Input
                      value={edu.program}
                      onChange={(e) => updateEducation(edu.id, 'program', e.target.value)}
                      placeholder='Systemvetenskap'
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Startår</Label>
                    <Input
                      value={edu.startYear}
                      onChange={(e) => updateEducation(edu.id, 'startYear', e.target.value)}
                      placeholder='2022'
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Slutår</Label>
                    <Input
                      value={edu.endYear}
                      onChange={(e) => updateEducation(edu.id, 'endYear', e.target.value)}
                      placeholder='2025'
                    />
                  </div>
                </div>
              </div>
            ))}
            <Button type='button' variant='outline' size='sm' onClick={addEducation}>
              <Icons.add className='mr-1.5 h-3.5 w-3.5' />
              Lägg till utbildning
            </Button>
          </CardContent>
        </Card>

        {/* Experience */}
        <Card>
          <CardHeader>
            <SectionHeader
              title='Erfarenhet'
              description='Arbetslivserfarenhet, ideellt arbete eller extrajobb. Valfritt.'
            />
          </CardHeader>
          <CardContent className='space-y-4'>
            {experiences.map((exp, idx) => (
              <div key={exp.id} className='space-y-3'>
                {idx > 0 && <Separator />}
                <div className='flex items-center justify-between'>
                  <span className='text-muted-foreground text-xs font-medium'>
                    Erfarenhet {idx + 1}
                  </span>
                  {experiences.length > 1 && (
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      onClick={() => removeExperience(exp.id)}
                    >
                      <Icons.trash className='h-3.5 w-3.5' />
                    </Button>
                  )}
                </div>
                <div className='grid gap-3 sm:grid-cols-2'>
                  <div className='space-y-2'>
                    <Label>Roll</Label>
                    <Input
                      value={exp.role}
                      onChange={(e) => updateExperience(exp.id, 'role', e.target.value)}
                      placeholder='Projektassistent'
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Företag / Organisation</Label>
                    <Input
                      value={exp.company}
                      onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                      placeholder='Företag AB'
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Startår</Label>
                    <Input
                      value={exp.startYear}
                      onChange={(e) => updateExperience(exp.id, 'startYear', e.target.value)}
                      placeholder='2023'
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Slutår</Label>
                    <Input
                      value={exp.endYear}
                      onChange={(e) => updateExperience(exp.id, 'endYear', e.target.value)}
                      placeholder='2024'
                    />
                  </div>
                </div>
                <div className='space-y-2'>
                  <Label>Beskrivning</Label>
                  <Textarea
                    value={exp.description}
                    onChange={(e) => updateExperience(exp.id, 'description', e.target.value)}
                    placeholder='Beskriv dina arbetsuppgifter och vad du lärde dig...'
                    rows={2}
                  />
                </div>
              </div>
            ))}
            <Button type='button' variant='outline' size='sm' onClick={addExperience}>
              <Icons.add className='mr-1.5 h-3.5 w-3.5' />
              Lägg till erfarenhet
            </Button>
          </CardContent>
        </Card>

        {/* Skills */}
        <Card>
          <CardHeader>
            <SectionHeader
              title='Kompetenser'
              description='Välj de kompetenser du vill lyfta fram.'
            />
          </CardHeader>
          <CardContent>
            <div className='flex flex-wrap gap-2'>
              {popularSkills.map((skill) => (
                <Badge
                  key={skill}
                  variant={skills.includes(skill) ? 'default' : 'outline'}
                  className={cn(
                    'cursor-pointer transition-colors',
                    skills.includes(skill) && 'bg-primary text-primary-foreground'
                  )}
                  onClick={() => toggleSkill(skill)}
                >
                  {skill}
                </Badge>
              ))}
            </div>
            {skills.length > 0 && (
              <p className='text-muted-foreground mt-3 text-xs'>
                {skills.length} kompetens{skills.length !== 1 ? 'er' : ''} valda
              </p>
            )}
          </CardContent>
        </Card>

        {/* Languages */}
        <Card>
          <CardHeader>
            <SectionHeader
              title='Språk'
              description='Vilka språk du behärskar och på vilken nivå.'
            />
          </CardHeader>
          <CardContent className='space-y-4'>
            {languages.map((lang, idx) => (
              <div key={lang.id} className='space-y-3'>
                {idx > 0 && <Separator />}
                <div className='flex items-center justify-between'>
                  <span className='text-muted-foreground text-xs font-medium'>Språk {idx + 1}</span>
                  {languages.length > 1 && (
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      onClick={() => removeLanguage(lang.id)}
                    >
                      <Icons.trash className='h-3.5 w-3.5' />
                    </Button>
                  )}
                </div>
                <div className='grid gap-3 sm:grid-cols-2'>
                  <div className='space-y-2'>
                    <Label>Språk</Label>
                    <Input
                      value={lang.language}
                      onChange={(e) => updateLanguage(lang.id, 'language', e.target.value)}
                      placeholder='Svenska'
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Nivå</Label>
                    <select
                      value={lang.level}
                      onChange={(e) => updateLanguage(lang.id, 'level', e.target.value)}
                      className='border-input bg-background ring-offset-background flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm'
                    >
                      <option value=''>Välj nivå</option>
                      {languageLevels.map((level) => (
                        <option key={level} value={level}>
                          {level}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
            <Button type='button' variant='outline' size='sm' onClick={addLanguage}>
              <Icons.add className='mr-1.5 h-3.5 w-3.5' />
              Lägg till språk
            </Button>
          </CardContent>
        </Card>

        {/* Generate button */}
        <div className='flex gap-3'>
          <Button onClick={handleGenerate} size='lg' className='flex-1'>
            <Icons.sparkles className='mr-2 h-4 w-4' />
            Generera CV
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
            <CVPreview
              fullName={fullName}
              email={email}
              phone={phone}
              city={city}
              linkedinUrl={linkedinUrl}
              summary={summary}
              educations={educations}
              experiences={experiences}
              skills={skills}
              languages={languages}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
