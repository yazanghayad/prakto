'use client';

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Icons } from '@/components/icons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { CoverLetterTone, CoverLetterResult } from '../api/types';
import { coverLetterMutation } from '../api/mutations';
import { useAIContext, toStudentContext, toInternshipContext } from './ai-provider';
import { InternshipSelector } from './internship-selector';

export function CoverLetterTool() {
  const { profile, internships } = useAIContext();
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
      <p className='text-muted-foreground text-sm'>
        Generera ett skräddarsytt personligt brev baserat på din profil och praktikplatsen du söker.
      </p>

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
