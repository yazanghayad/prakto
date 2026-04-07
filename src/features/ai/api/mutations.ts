import { mutationOptions } from '@tanstack/react-query';
import {
  getMatchAnalysis,
  generateCoverLetter,
  getProfileTips,
  getInterviewPrep,
  getSkillGapAnalysis
} from './service';
import type { StudentContext, InternshipContext, CoverLetterTone } from './types';

export const matchAnalysisMutation = mutationOptions({
  mutationFn: ({
    student,
    internship
  }: {
    student: StudentContext;
    internship: InternshipContext;
  }) => getMatchAnalysis(student, internship)
});

export const coverLetterMutation = mutationOptions({
  mutationFn: ({
    student,
    internship,
    tone,
    extras
  }: {
    student: StudentContext;
    internship: InternshipContext;
    tone: CoverLetterTone;
    extras?: string;
  }) => generateCoverLetter(student, internship, tone, extras)
});

export const profileTipsMutation = mutationOptions({
  mutationFn: ({ student }: { student: StudentContext }) => getProfileTips(student)
});

export const interviewPrepMutation = mutationOptions({
  mutationFn: ({
    student,
    internship
  }: {
    student: StudentContext;
    internship: InternshipContext;
  }) => getInterviewPrep(student, internship)
});

export const skillGapMutation = mutationOptions({
  mutationFn: ({
    student,
    internship
  }: {
    student: StudentContext;
    internship: InternshipContext;
  }) => getSkillGapAnalysis(student, internship)
});
