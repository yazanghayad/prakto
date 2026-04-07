import type { Models } from 'appwrite';

// ─── Company Profile Types ────────────────────────────────────

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface CompanyProfile extends Models.Document {
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
  approvalStatus: ApprovalStatus;
  approvalNote: string;
  approvedBy: string;
  approvedAt: string;
}

export type CompanyProfilePayload = {
  companyName: string;
  orgNumber: string;
  industry: string;
  description: string;
  website?: string;
  city: string;
  contactEmail: string;
  contactPhone?: string;
};
