import { queryOptions } from '@tanstack/react-query';
import { getDiscoverCompanies } from './discover-service';
import type { DiscoverFilters } from './discover-types';

export const discoverKeys = {
  all: ['discover-companies'] as const,
  list: (filters: DiscoverFilters) => [...discoverKeys.all, 'list', filters] as const
};

export function discoverCompaniesOptions(filters: DiscoverFilters) {
  return queryOptions({
    queryKey: discoverKeys.list(filters),
    queryFn: () => getDiscoverCompanies(filters)
  });
}
