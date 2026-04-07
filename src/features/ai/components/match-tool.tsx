'use client';

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Icons } from '@/components/icons';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import type { MatchResult } from '../api/types';
import { matchAnalysisMutation } from '../api/mutations';
import { useAIContext, toStudentContext, toInternshipContext } from './ai-provider';
import { InternshipSelector } from './internship-selector';

export function MatchTool() {
  const { profile, internships } = useAIContext();
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
      <p className='text-muted-foreground text-sm'>
        Se hur väl du matchar en specifik praktikplats med en AI-driven analys.
      </p>

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
