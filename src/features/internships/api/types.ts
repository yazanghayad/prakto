import type { Models } from 'appwrite';

// ─── Internship Types ──────────────────────────────────────────

export type InternshipType = 'lia' | 'vfu' | 'apl';

export type InternshipStatus = 'draft' | 'pending_review' | 'published' | 'rejected' | 'closed';

export type WorkplaceType = 'on_site' | 'remote' | 'hybrid';

export interface Internship extends Models.Document {
  companyId: string;
  title: string;
  description: string;
  responsibilities: string;
  requirements: string;
  preferredQualifications: string;
  field: string;
  internshipType: InternshipType;
  city: string;
  workplaceType: WorkplaceType;
  duration: string;
  spots: number;
  startDate: string;
  applicationDeadline: string;
  applicationMethod: string;
  contactEmail: string;
  cvRequired: boolean;
  coverLetterRequired: boolean;
  screeningQuestions: string[];
  educationLevel: string;
  rejectionMessage: string;
  status: InternshipStatus;
  moderatedBy: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  // Joined fields (populated in service)
  companyName?: string;
  companyLogo?: string;
}

export type InternshipFilters = {
  page?: number;
  limit?: number;
  search?: string;
  field?: string;
  city?: string;
  internshipType?: string;
  status?: string;
  companyId?: string;
  sort?: string;
};

export type InternshipsResponse = {
  total: number;
  internships: Internship[];
};

export type InternshipMutationPayload = {
  // Step 1: Berätta om rollen
  title: string;
  description: string;
  responsibilities?: string;
  requirements?: string;
  preferredQualifications?: string;
  field: string;
  internshipType: InternshipType;
  city: string;
  workplaceType: WorkplaceType;
  duration?: string;
  spots: number;
  startDate?: string;
  applicationDeadline?: string;
  // Step 2: Få kvalificerade sökande
  applicationMethod: string;
  contactEmail: string;
  cvRequired?: boolean;
  coverLetterRequired?: boolean;
  screeningQuestions?: string[];
  educationLevel?: string;
  rejectionMessage?: string;
};

// ─── Application Types ─────────────────────────────────────────

export type ApplicationStatus =
  | 'submitted'
  | 'reviewed'
  | 'interview'
  | 'accepted'
  | 'rejected'
  | 'withdrawn';

export interface Application extends Models.Document {
  studentId: string;
  internshipId: string;
  companyId: string;
  cvFileId: string;
  message: string;
  status: ApplicationStatus;
  statusNote: string;
  appliedAt: string;
  updatedAt: string;
  // Joined fields
  internshipTitle?: string;
  companyName?: string;
  studentName?: string;
}

export type ApplicationFilters = {
  page?: number;
  limit?: number;
  status?: string;
  studentId?: string;
  internshipId?: string;
  companyId?: string;
  sort?: string;
};

export type ApplicationsResponse = {
  total: number;
  applications: Application[];
};

export type ApplicationMutationPayload = {
  internshipId: string;
  companyId: string;
  cvFileId: string;
  message?: string;
};
