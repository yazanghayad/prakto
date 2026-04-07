'use client';

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Icons } from '@/components/icons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { InterviewPrepResult } from '../api/types';
import { interviewPrepMutation } from '../api/mutations';
import { useAIContext, toStudentContext, toInternshipContext } from './ai-provider';
import { InternshipSelector } from './internship-selector';

export function InterviewPrepTool() {
  const { profile, internships } = useAIContext();
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
      <p className='text-muted-foreground text-sm'>
        Generera skräddarsydda intervjufrågor med tips och exempelsvar baserat på praktikplatsen du
        söker.
      </p>

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
