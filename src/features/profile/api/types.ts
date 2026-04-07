import type { Models } from 'appwrite';
import type { EducationLevel, InternshipType, PlacementStatus } from '@/types/platform';

// ─── Student Profile Types ────────────────────────────────────

export interface StudentProfileDoc extends Models.Document {
  userId: string;
  school: string;
  program: string;
  educationLevel: EducationLevel;
  internshipType: InternshipType[];
  city: string;
  skills: string[];
  bio: string;
  cvFileId: string;
  linkedinUrl: string;
  programId: string;
  placementStatus: PlacementStatus;
}

export type StudentProfilePayload = {
  school: string;
  program: string;
  educationLevel: EducationLevel;
  internshipType: InternshipType[];
  city: string;
  skills: string[];
  bio: string;
  linkedinUrl?: string;
  cvFileId?: string;
};

// ─── Onboarding Payload ───────────────────────────────────────
// Sent from the onboarding wizard — includes user-level fields
// (displayName, email, phone, avatarFileId) that update the `users` doc,
// plus student-level fields that create the `students` doc.

export type StudentOnboardingPayload = {
  // user-level (updates `users` collection)
  displayName: string;
  email: string;
  phone: string;
  avatarFileId?: string;
  // student-level (creates `students` collection)
  school: string;
  program: string;
  educationLevel: EducationLevel;
  internshipType: InternshipType[];
  city: string;
  skills: string[];
  bio: string;
  linkedinUrl?: string;
  cvFileId?: string;
};
