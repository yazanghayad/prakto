// ============================================================
// AI Service — Client-side calls to /api/ai
// ============================================================

import { apiUrl } from '@/lib/api-client';
import type {
  MatchResult,
  CoverLetterResult,
  CoverLetterTone,
  ProfileTipsResult,
  InterviewPrepResult,
  SkillGapResult,
  StudentContext,
  InternshipContext
} from './types';

async function callAI<T>(action: string, payload: Record<string, unknown>): Promise<T> {
  const res = await fetch(apiUrl('/api/ai'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, payload })
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? 'AI-tjänsten misslyckades.');
  }

  const json = await res.json();
  return (json as { result: T }).result;
}

/**
 * Get a match score + analysis between a student and an internship.
 */
export function getMatchAnalysis(
  student: StudentContext,
  internship: InternshipContext
): Promise<MatchResult> {
  return callAI<MatchResult>('match', { student, internship });
}

/**
 * Generate a cover letter for a specific internship.
 */
export function generateCoverLetter(
  student: StudentContext,
  internship: InternshipContext,
  tone: CoverLetterTone,
  extras?: string
): Promise<CoverLetterResult> {
  return callAI<CoverLetterResult>('cover-letter', {
    student,
    internship,
    tone,
    extras
  });
}

/**
 * Get profile improvement tips for a student.
 */
export function getProfileTips(student: StudentContext): Promise<ProfileTipsResult> {
  return callAI<ProfileTipsResult>('profile-tips', { student });
}

/**
 * Generate tailored interview questions for an internship.
 */
export function getInterviewPrep(
  student: StudentContext,
  internship: InternshipContext
): Promise<InterviewPrepResult> {
  return callAI<InterviewPrepResult>('interview-prep', { student, internship });
}

/**
 * Analyze skill gaps between a student's profile and an internship's requirements.
 */
export function getSkillGapAnalysis(
  student: StudentContext,
  internship: InternshipContext
): Promise<SkillGapResult> {
  return callAI<SkillGapResult>('skill-gap', { student, internship });
}
