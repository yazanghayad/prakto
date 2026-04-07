// ─── AI Service Types ─────────────────────────────────────────

// Shared input: student profile summary
export interface StudentContext {
  school: string;
  program: string;
  educationLevel: string;
  city: string;
  skills: string[];
  bio: string;
  internshipType: string[];
}

// Shared input: internship summary
export interface InternshipContext {
  title: string;
  description: string;
  requirements: string;
  field: string;
  city: string;
  internshipType: string;
  workplaceType?: string;
  duration?: string;
  preferredQualifications?: string;
}

// ─── 1. AI Matching ───────────────────────────────────────────

export interface MatchRequest {
  student: StudentContext;
  internship: InternshipContext;
}

export interface MatchResult {
  score: number; // 0–100
  summary: string;
  strengths: string[];
  gaps: string[];
  tip: string;
}

// ─── 2. AI Cover Letter ──────────────────────────────────────

export type CoverLetterTone = 'formal' | 'casual' | 'energetic';

export interface CoverLetterRequest {
  student: StudentContext;
  internship: InternshipContext;
  tone: CoverLetterTone;
  extras?: string; // additional context from the student
}

export interface CoverLetterResult {
  letter: string;
}

// ─── 3. AI Profile Tips ──────────────────────────────────────

export interface ProfileTipsRequest {
  student: StudentContext;
}

export interface ProfileTip {
  area: string;
  current: string;
  suggestion: string;
  priority: 'high' | 'medium' | 'low';
}

export interface ProfileTipsResult {
  overallScore: number; // 0–100
  tips: ProfileTip[];
  summary: string;
}

// ─── 4. AI Interview Prep ────────────────────────────────────

export interface InterviewPrepRequest {
  student: StudentContext;
  internship: InternshipContext;
}

export interface InterviewQuestion {
  question: string;
  category: string;
  tip: string;
  exampleAnswer: string;
}

export interface InterviewPrepResult {
  questions: InterviewQuestion[];
  generalTips: string[];
}

// ─── 5. AI Skill Gap Analyzer ────────────────────────────────

export interface SkillGapRequest {
  student: StudentContext;
  internship: InternshipContext;
}

export interface SkillGap {
  skill: string;
  studentLevel: 'saknas' | 'nybörjare' | 'grundläggande' | 'god';
  requiredLevel: 'grundläggande' | 'god' | 'avancerad';
  priority: 'high' | 'medium' | 'low';
  recommendation: string;
  resourceUrl?: string;
  estimatedTime: string;
}

export interface SkillGapResult {
  readinessScore: number; // 0–100
  summary: string;
  matchedSkills: string[];
  gaps: SkillGap[];
  actionPlan: string;
}

// ─── Unified request/response ────────────────────────────────

export type AIAction = 'match' | 'cover-letter' | 'profile-tips' | 'interview-prep' | 'skill-gap';

export type AIRequest =
  | { action: 'match'; payload: MatchRequest }
  | { action: 'cover-letter'; payload: CoverLetterRequest }
  | { action: 'profile-tips'; payload: ProfileTipsRequest }
  | { action: 'interview-prep'; payload: InterviewPrepRequest }
  | { action: 'skill-gap'; payload: SkillGapRequest };

export type AIResponse =
  | { action: 'match'; result: MatchResult }
  | { action: 'cover-letter'; result: CoverLetterResult }
  | { action: 'profile-tips'; result: ProfileTipsResult }
  | { action: 'interview-prep'; result: InterviewPrepResult }
  | { action: 'skill-gap'; result: SkillGapResult };
