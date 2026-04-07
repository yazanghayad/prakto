import { apiUrl } from '@/lib/api-client';
import type { DiscoverFilters, DiscoverCompaniesResponse } from './discover-types';

export async function getDiscoverCompanies(
  filters: DiscoverFilters
): Promise<DiscoverCompaniesResponse> {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.search) params.set('search', filters.search);
  if (filters.industry) params.set('industry', filters.industry);
  if (filters.city) params.set('city', filters.city);

  const res = await fetch(apiUrl(`/api/companies/discover?${params.toString()}`));
  if (!res.ok) {
    throw new Error('Kunde inte hämta företag.');
  }
  const json = await res.json();
  return {
    total: json.total ?? 0,
    companies: json.companies ?? []
  };
}
