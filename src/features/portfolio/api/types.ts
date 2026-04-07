import type { Models } from 'appwrite';

// ─── Portfolio Item Types ─────────────────────────────────────

export const PORTFOLIO_TYPES = ['project', 'design', 'document', 'other'] as const;
export type PortfolioType = (typeof PORTFOLIO_TYPES)[number];

export interface PortfolioItemDoc extends Models.Document {
  userId: string;
  studentId: string;
  title: string;
  description: string;
  type: PortfolioType;
  projectUrl: string;
  githubUrl: string;
  fileIds: string[];
  tags: string[];
}

export type PortfolioItemPayload = {
  title: string;
  description: string;
  type: PortfolioType;
  projectUrl?: string;
  githubUrl?: string;
  fileIds?: string[];
  tags?: string[];
};

export type PortfolioFilters = {
  userId?: string;
  studentId?: string;
  type?: PortfolioType;
};
