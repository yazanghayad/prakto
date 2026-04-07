'use client';

import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useUser } from '@/hooks/use-auth';
import { Icons } from '@/components/icons';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { studentProfileOptions } from '@/features/profile/api/queries';
import { internshipsQueryOptions } from '@/features/internships/api/queries';
import type { StudentProfileDoc } from '@/features/profile/api/types';
import type { Internship } from '@/features/internships/api/types';
import type {
  StudentContext,
  InternshipContext,
  CoverLetterTone,
  MatchResult,
  CoverLetterResult,
  ProfileTipsResult,
  InterviewPrepResult,
  SkillGapResult
} from '../api/types';
import {
  matchAnalysisMutation,
  coverLetterMutation,
  profileTipsMutation,
  interviewPrepMutation,
  skillGapMutation
} from '../api/mutations';

// ─── Helpers ──────────────────────────────────────────────────

function toStudentContext(p: StudentProfileDoc): StudentContext {
  return {
    school: p.school,
    program: p.program,
    educationLevel: p.educationLevel,
    city: p.city,
    skills: p.skills,
    bio: p.bio,
    internshipType: p.internshipType
  };
}

function toInternshipContext(i: Internship): InternshipContext {
  return {
    title: i.title,
    description: i.description,
    requirements: i.requirements,
    field: i.field,
    city: i.city,
    internshipType: i.internshipType,
    workplaceType: i.workplaceType,
    duration: i.duration,
    preferredQualifications: i.preferredQualifications
  };
}

// ─── Internship Selector ──────────────────────────────────────

function InternshipSelector({
  internships,
  value,
  onChange
}: {
  internships: Internship[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className='space-y-2'>
      <Label>Välj praktikplats</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className='w-full'>
          <SelectValue placeholder='Välj en praktikplats...' />
        </SelectTrigger>
        <SelectContent>
          {internships.map((i) => (
            <SelectItem key={i.$id} value={i.$id}>
              {i.title} — {i.city}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// ─── 1. Match Tool ────────────────────────────────────────────

function MatchTool({
  profile,
  internships
}: {
  profile: StudentProfileDoc;
  internships: Internship[];
}) {
  const [selectedId, setSelectedId] = useState('');
  const mutation = useMutation(matchAnalysisMutation);
  const result = mutation.data as MatchResult | undefined;

  const handleAnalyze = () => {
    const internship = internships.find((i) => i.$id === selectedId);
    if (!internship) return;
    mutation.mutate({
      student: toStudentContext(profile),
      internship: toInternshipContext(internship)
    });
  };

  return (
    <div className='space-y-6'>
      <InternshipSelector internships={internships} value={selectedId} onChange={setSelectedId} />

      <Button
        onClick={handleAnalyze}
        disabled={!selectedId || mutation.isPending}
        isLoading={mutation.isPending}
      >
        <Icons.sparkles className='mr-2 h-4 w-4' />
        Analysera matchning
      </Button>

      {mutation.isError && (
        <p className='text-destructive text-sm'>{mutation.error?.message ?? 'Något gick fel.'}</p>
      )}

      {result && (
        <Card>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <CardTitle>Matchningsresultat</CardTitle>
              <Badge
                variant={
                  result.score >= 70 ? 'default' : result.score >= 40 ? 'secondary' : 'destructive'
                }
                className='text-lg'
              >
                {result.score}%
              </Badge>
            </div>
            <CardDescription>{result.summary}</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <Progress value={result.score} className='h-3' />

            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <div>
                <h4 className='mb-2 font-semibold text-green-600'>Styrkor</h4>
                <ul className='space-y-1'>
                  {result.strengths.map((s, i) => (
                    <li key={i} className='flex items-start gap-2 text-sm'>
                      <Icons.check className='text-green-600 mt-0.5 h-4 w-4 shrink-0' />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className='mb-2 font-semibold text-amber-600'>Luckor</h4>
                <ul className='space-y-1'>
                  {result.gaps.map((g, i) => (
                    <li key={i} className='flex items-start gap-2 text-sm'>
                      <Icons.info className='mt-0.5 h-4 w-4 shrink-0 text-amber-600' />
                      {g}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <Separator />

            <div className='flex items-start gap-2'>
              <Icons.bulb className='mt-0.5 h-5 w-5 shrink-0 text-blue-500' />
              <p className='text-sm'>{result.tip}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── 2. Cover Letter Tool ─────────────────────────────────────

function CoverLetterTool({
  profile,
  internships
}: {
  profile: StudentProfileDoc;
  internships: Internship[];
}) {
  const [selectedId, setSelectedId] = useState('');
  const [tone, setTone] = useState<CoverLetterTone>('formal');
  const [extras, setExtras] = useState('');
  const mutation = useMutation(coverLetterMutation);
  const result = mutation.data as CoverLetterResult | undefined;

  const handleGenerate = () => {
    const internship = internships.find((i) => i.$id === selectedId);
    if (!internship) return;
    mutation.mutate({
      student: toStudentContext(profile),
      internship: toInternshipContext(internship),
      tone,
      extras: extras || undefined
    });
  };

  return (
    <div className='space-y-6'>
      <InternshipSelector internships={internships} value={selectedId} onChange={setSelectedId} />

      <div className='space-y-2'>
        <Label>Ton</Label>
        <Select value={tone} onValueChange={(v) => setTone(v as CoverLetterTone)}>
          <SelectTrigger className='w-full max-w-xs'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='formal'>Formell & professionell</SelectItem>
            <SelectItem value='casual'>Avslappnad & personlig</SelectItem>
            <SelectItem value='energetic'>Energisk & entusiastisk</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className='space-y-2'>
        <Label>Extra info (valfritt)</Label>
        <Textarea
          value={extras}
          onChange={(e) => setExtras(e.target.value)}
          placeholder='T.ex. "Jag har gjort ett liknande projekt i skolan..." eller "Jag är speciellt intresserad av..."'
          className='max-h-32'
        />
      </div>

      <Button
        onClick={handleGenerate}
        disabled={!selectedId || mutation.isPending}
        isLoading={mutation.isPending}
      >
        <Icons.sparkles className='mr-2 h-4 w-4' />
        Generera personligt brev
      </Button>

      {mutation.isError && (
        <p className='text-destructive text-sm'>{mutation.error?.message ?? 'Något gick fel.'}</p>
      )}

      {result && (
        <Card>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <CardTitle>Ditt personliga brev</CardTitle>
              <Button
                variant='outline'
                size='sm'
                onClick={() => navigator.clipboard.writeText(result.letter)}
              >
                <Icons.clipboardCopy className='mr-2 h-4 w-4' />
                Kopiera
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className='bg-muted whitespace-pre-wrap rounded-lg p-4 text-sm leading-relaxed'>
              {result.letter}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── 3. Profile Tips Tool ─────────────────────────────────────

function ProfileTipsTool({ profile }: { profile: StudentProfileDoc }) {
  const mutation = useMutation(profileTipsMutation);
  const result = mutation.data as ProfileTipsResult | undefined;

  const handleAnalyze = () => {
    mutation.mutate({ student: toStudentContext(profile) });
  };

  const priorityColor = {
    high: 'text-red-600',
    medium: 'text-amber-600',
    low: 'text-blue-600'
  };

  const priorityLabel = {
    high: 'Hög',
    medium: 'Medium',
    low: 'Låg'
  };

  return (
    <div className='space-y-6'>
      <p className='text-muted-foreground text-sm'>
        AI:n analyserar din profil och ger konkreta tips för att öka dina chanser att bli matchad
        med rätt praktikplats.
      </p>

      <Button onClick={handleAnalyze} disabled={mutation.isPending} isLoading={mutation.isPending}>
        <Icons.sparkles className='mr-2 h-4 w-4' />
        Analysera min profil
      </Button>

      {mutation.isError && (
        <p className='text-destructive text-sm'>{mutation.error?.message ?? 'Något gick fel.'}</p>
      )}

      {result && (
        <div className='space-y-4'>
          <Card>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <CardTitle>Profilbetyg</CardTitle>
                <Badge
                  variant={
                    result.overallScore >= 70
                      ? 'default'
                      : result.overallScore >= 40
                        ? 'secondary'
                        : 'destructive'
                  }
                  className='text-lg'
                >
                  {result.overallScore}/100
                </Badge>
              </div>
              <CardDescription>{result.summary}</CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={result.overallScore} className='h-3' />
            </CardContent>
          </Card>

          <div className='space-y-3'>
            {result.tips.map((tip, i) => (
              <Card key={i}>
                <CardContent className='pt-4'>
                  <div className='flex items-start justify-between gap-2'>
                    <div className='space-y-1'>
                      <h4 className='font-semibold'>{tip.area}</h4>
                      <p className='text-muted-foreground text-sm'>
                        <span className='font-medium'>Nu:</span> {tip.current}
                      </p>
                      <p className='text-sm'>
                        <span className='font-medium'>Förslag:</span> {tip.suggestion}
                      </p>
                    </div>
                    <Badge variant='outline' className={priorityColor[tip.priority]}>
                      {priorityLabel[tip.priority]}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 4. Interview Prep Tool ───────────────────────────────────

function InterviewPrepTool({
  profile,
  internships
}: {
  profile: StudentProfileDoc;
  internships: Internship[];
}) {
  const [selectedId, setSelectedId] = useState('');
  const mutation = useMutation(interviewPrepMutation);
  const result = mutation.data as InterviewPrepResult | undefined;

  const handleGenerate = () => {
    const internship = internships.find((i) => i.$id === selectedId);
    if (!internship) return;
    mutation.mutate({
      student: toStudentContext(profile),
      internship: toInternshipContext(internship)
    });
  };

  return (
    <div className='space-y-6'>
      <InternshipSelector internships={internships} value={selectedId} onChange={setSelectedId} />

      <Button
        onClick={handleGenerate}
        disabled={!selectedId || mutation.isPending}
        isLoading={mutation.isPending}
      >
        <Icons.sparkles className='mr-2 h-4 w-4' />
        Generera intervjufrågor
      </Button>

      {mutation.isError && (
        <p className='text-destructive text-sm'>{mutation.error?.message ?? 'Något gick fel.'}</p>
      )}

      {result && (
        <div className='space-y-6'>
          <div className='space-y-3'>
            {result.questions.map((q, i) => (
              <Card key={i}>
                <CardContent className='pt-4'>
                  <div className='space-y-2'>
                    <div className='flex items-start justify-between gap-2'>
                      <h4 className='font-semibold'>
                        {i + 1}. {q.question}
                      </h4>
                      <Badge variant='outline'>{q.category}</Badge>
                    </div>
                    <div className='bg-muted rounded-md p-3'>
                      <p className='text-sm'>
                        <span className='font-medium'>Tips:</span> {q.tip}
                      </p>
                    </div>
                    <details className='text-sm'>
                      <summary className='text-muted-foreground cursor-pointer font-medium hover:underline'>
                        Visa exempelsvar
                      </summary>
                      <p className='mt-2 pl-2'>{q.exampleAnswer}</p>
                    </details>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className='text-base'>Allmänna tips</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className='space-y-2'>
                {result.generalTips.map((tip, i) => (
                  <li key={i} className='flex items-start gap-2 text-sm'>
                    <Icons.check className='mt-0.5 h-4 w-4 shrink-0 text-green-600' />
                    {tip}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// ─── 5. Skill Gap Analyzer Tool ──────────────────────────────

function SkillGapTool({
  profile,
  internships
}: {
  profile: StudentProfileDoc;
  internships: Internship[];
}) {
  const [selectedId, setSelectedId] = useState('');
  const mutation = useMutation(skillGapMutation);
  const result = mutation.data as SkillGapResult | undefined;

  const handleAnalyze = () => {
    const internship = internships.find((i) => i.$id === selectedId);
    if (!internship) return;
    mutation.mutate({
      student: toStudentContext(profile),
      internship: toInternshipContext(internship)
    });
  };

  const priorityColor = {
    high: 'text-red-600',
    medium: 'text-amber-600',
    low: 'text-blue-600'
  };

  const priorityLabel = {
    high: 'Hög',
    medium: 'Medium',
    low: 'Låg'
  };

  const levelLabel: Record<string, string> = {
    saknas: 'Saknas',
    nybörjare: 'Nybörjare',
    grundläggande: 'Grundläggande',
    god: 'God',
    avancerad: 'Avancerad'
  };

  return (
    <div className='space-y-6'>
      <p className='text-muted-foreground text-sm'>
        AI:n jämför dina kompetenser med praktikplatsens krav och ger dig en personlig handlingsplan
        med lärresurser för att stänga eventuella kunskapsluckor.
      </p>

      <InternshipSelector internships={internships} value={selectedId} onChange={setSelectedId} />

      <Button
        onClick={handleAnalyze}
        disabled={!selectedId || mutation.isPending}
        isLoading={mutation.isPending}
      >
        <Icons.sparkles className='mr-2 h-4 w-4' />
        Analysera kompetensgap
      </Button>

      {mutation.isError && (
        <p className='text-destructive text-sm'>{mutation.error?.message ?? 'Något gick fel.'}</p>
      )}

      {result && (
        <div className='space-y-4'>
          {/* Readiness Score */}
          <Card>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <CardTitle>Beredskapsgrad</CardTitle>
                <Badge
                  variant={
                    result.readinessScore >= 70
                      ? 'default'
                      : result.readinessScore >= 40
                        ? 'secondary'
                        : 'destructive'
                  }
                  className='text-lg'
                >
                  {result.readinessScore}%
                </Badge>
              </div>
              <CardDescription>{result.summary}</CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={result.readinessScore} className='h-3' />
            </CardContent>
          </Card>

          {/* Matched Skills */}
          {result.matchedSkills.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2 text-base text-green-600'>
                  <Icons.check className='h-5 w-5' />
                  Kompetenser som matchar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='flex flex-wrap gap-2'>
                  {result.matchedSkills.map((skill, i) => (
                    <Badge key={i} variant='secondary' className='text-green-700'>
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Skill Gaps */}
          {result.gaps.length > 0 && (
            <div className='space-y-3'>
              <h3 className='flex items-center gap-2 font-semibold text-amber-600'>
                <Icons.info className='h-5 w-5' />
                Kompetensgap &amp; lärrekommendationer
              </h3>
              {result.gaps.map((gap, i) => (
                <Card key={i}>
                  <CardContent className='pt-4'>
                    <div className='space-y-3'>
                      <div className='flex items-start justify-between gap-2'>
                        <div>
                          <h4 className='font-semibold'>{gap.skill}</h4>
                          <div className='text-muted-foreground mt-1 flex items-center gap-3 text-xs'>
                            <span>
                              Din nivå:{' '}
                              <span className='font-medium'>
                                {levelLabel[gap.studentLevel] ?? gap.studentLevel}
                              </span>
                            </span>
                            <span>→</span>
                            <span>
                              Krävs:{' '}
                              <span className='font-medium'>
                                {levelLabel[gap.requiredLevel] ?? gap.requiredLevel}
                              </span>
                            </span>
                          </div>
                        </div>
                        <div className='flex items-center gap-2'>
                          <Badge variant='outline' className='text-xs'>
                            ⏱ {gap.estimatedTime}
                          </Badge>
                          <Badge variant='outline' className={priorityColor[gap.priority]}>
                            {priorityLabel[gap.priority]}
                          </Badge>
                        </div>
                      </div>

                      <p className='text-sm'>{gap.recommendation}</p>

                      {gap.resourceUrl && (
                        <a
                          href={gap.resourceUrl}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='text-primary inline-flex items-center gap-1.5 text-sm font-medium hover:underline'
                        >
                          <Icons.externalLink className='h-3.5 w-3.5' />
                          Öppna lärresurs
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Action Plan */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-base'>
                <Icons.bulb className='h-5 w-5 text-blue-500' />
                Handlingsplan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-sm leading-relaxed'>{result.actionPlan}</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// ─── Main AI Page Component ───────────────────────────────────

export default function AIToolsPage() {
  const { user } = useUser();
  const userId = user?.$id ?? '';

  const profileQuery = useQuery(studentProfileOptions(userId));
  const internshipsQuery = useQuery(internshipsQueryOptions({ status: 'published', limit: 100 }));

  const profile = profileQuery.data;
  const internships = internshipsQuery.data?.internships ?? [];

  if (profileQuery.isLoading || internshipsQuery.isLoading) {
    return (
      <div className='flex items-center justify-center py-20'>
        <Icons.spinner className='text-muted-foreground h-8 w-8 animate-spin' />
      </div>
    );
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className='py-10 text-center'>
          <Icons.user className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
          <h3 className='text-lg font-semibold'>Profil saknas</h3>
          <p className='text-muted-foreground mt-1 text-sm'>
            Du behöver skapa en studentprofil innan du kan använda AI-verktygen.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Tabs defaultValue='match' className='space-y-6'>
      <TabsList className='grid w-full grid-cols-2 lg:grid-cols-5'>
        <TabsTrigger value='match' className='gap-2'>
          <Icons.sparkles className='h-4 w-4' />
          <span className='hidden sm:inline'>Matchning</span>
        </TabsTrigger>
        <TabsTrigger value='cover-letter' className='gap-2'>
          <Icons.page className='h-4 w-4' />
          <span className='hidden sm:inline'>Personligt brev</span>
        </TabsTrigger>
        <TabsTrigger value='profile-tips' className='gap-2'>
          <Icons.bulb className='h-4 w-4' />
          <span className='hidden sm:inline'>Profiltips</span>
        </TabsTrigger>
        <TabsTrigger value='interview-prep' className='gap-2'>
          <Icons.chat className='h-4 w-4' />
          <span className='hidden sm:inline'>Intervju</span>
        </TabsTrigger>
        <TabsTrigger value='skill-gap' className='gap-2'>
          <Icons.quiz className='h-4 w-4' />
          <span className='hidden sm:inline'>Kompetensgap</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value='match'>
        <Card>
          <CardHeader>
            <CardTitle>AI-matchning</CardTitle>
            <CardDescription>
              Se hur väl du matchar en specifik praktikplats med en AI-driven analys.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MatchTool profile={profile} internships={internships} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value='cover-letter'>
        <Card>
          <CardHeader>
            <CardTitle>Personligt brev</CardTitle>
            <CardDescription>
              Generera ett skräddarsytt personligt brev baserat på din profil och praktikplatsen du
              söker.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CoverLetterTool profile={profile} internships={internships} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value='profile-tips'>
        <Card>
          <CardHeader>
            <CardTitle>Profilförbättringar</CardTitle>
            <CardDescription>
              Få AI-drivna tips på hur du kan förbättra din profil för att öka dina chanser att bli
              matchad.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileTipsTool profile={profile} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value='interview-prep'>
        <Card>
          <CardHeader>
            <CardTitle>Intervjuförberedelse</CardTitle>
            <CardDescription>
              Generera skräddarsydda intervjufrågor med tips och exempelsvar baserat på
              praktikplatsen du söker.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InterviewPrepTool profile={profile} internships={internships} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value='skill-gap'>
        <Card>
          <CardHeader>
            <CardTitle>Kompetensgap-analys</CardTitle>
            <CardDescription>
              AI:n analyserar skillnaden mellan dina kompetenser och praktikplatsens krav, och ger
              dig konkreta lärrekommendationer med tidsuppskattningar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SkillGapTool profile={profile} internships={internships} />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
