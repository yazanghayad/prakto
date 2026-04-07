// ─── Company Discover Types ───────────────────────────────────

export interface DiscoverCompany {
  $id: string;
  companyName: string;
  industry: string;
  description: string;
  city: string;
  website: string;
  logoUrl: string | null;
  coverUrl: string | null;
  activeInternships: number;
}

export type DiscoverFilters = {
  page?: number;
  limit?: number;
  search?: string;
  industry?: string;
  city?: string;
};

export type DiscoverCompaniesResponse = {
  total: number;
  companies: DiscoverCompany[];
};
