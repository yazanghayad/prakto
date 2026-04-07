'use client';

import React from 'react';
import { useMutation } from '@tanstack/react-query';
import { Icons } from '@/components/icons';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { ProfileTipsResult } from '../api/types';
import { profileTipsMutation } from '../api/mutations';
import { useAIContext, toStudentContext } from './ai-provider';

export function ProfileTipsTool() {
  const { profile } = useAIContext();
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
