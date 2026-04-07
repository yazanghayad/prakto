import type { Models } from 'appwrite';

// ─── Student Profile (extended for ed manager views) ───────────

export interface StudentListItem extends Models.Document {
  userId: string;
  school: string;
  program: string;
  educationLevel: string;
  city: string;
  skills: string[];
  bio: string;
  cvFileId: string;
  linkedinUrl: string;
  programId: string;
  placementStatus: 'searching' | 'applied' | 'placed' | 'completed';
  // Joined from users collection
  displayName?: string;
  email?: string;
}

export type StudentFilters = {
  page?: number;
  limit?: number;
  search?: string;
  placementStatus?: string;
  programId?: string;
  sort?: string;
};

export type StudentsResponse = {
  total: number;
  students: StudentListItem[];
};

// ─── Company Types ─────────────────────────────────────────────

export interface CompanyListItem extends Models.Document {
  userId: string;
  companyName: string;
  orgNumber: string;
  industry: string;
  description: string;
  website: string;
  logoFileId: string;
  city: string;
  contactEmail: string;
  contactPhone: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvalNote: string;
  approvedBy: string;
  approvedAt: string;
}

export type CompanyFilters = {
  page?: number;
  limit?: number;
  search?: string;
  approvalStatus?: string;
  sort?: string;
};

export type CompaniesResponse = {
  total: number;
  companies: CompanyListItem[];
};
