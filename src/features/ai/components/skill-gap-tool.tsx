'use client';

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Icons } from '@/components/icons';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { SkillGapResult } from '../api/types';
import { skillGapMutation } from '../api/mutations';
import { useAIContext, toStudentContext, toInternshipContext } from './ai-provider';
import { InternshipSelector } from './internship-selector';

export function SkillGapTool() {
  const { profile, internships } = useAIContext();
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
