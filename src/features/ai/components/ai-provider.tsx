'use client';

import React, { createContext, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUser } from '@/hooks/use-auth';
import { Icons } from '@/components/icons';
import { Card, CardContent } from '@/components/ui/card';
import { studentProfileOptions } from '@/features/profile/api/queries';
import { internshipsQueryOptions } from '@/features/internships/api/queries';
import type { StudentProfileDoc } from '@/features/profile/api/types';
import type { Internship } from '@/features/internships/api/types';
import type { StudentContext, InternshipContext } from '../api/types';

// ─── Context ──────────────────────────────────────────────────

interface AIContextValue {
  profile: StudentProfileDoc;
  internships: Internship[];
}

const AIContext = createContext<AIContextValue | null>(null);

export function useAIContext() {
  const ctx = useContext(AIContext);
  if (!ctx) throw new Error('useAIContext must be used inside AIProvider');
  return ctx;
}

// ─── Helpers ──────────────────────────────────────────────────

export function toStudentContext(p: StudentProfileDoc): StudentContext {
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

export function toInternshipContext(i: Internship): InternshipContext {
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

// ─── Provider ─────────────────────────────────────────────────

export function AIProvider({ children }: { children: React.ReactNode }) {
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

  return <AIContext.Provider value={{ profile, internships }}>{children}</AIContext.Provider>;
}
