import { queryOptions } from '@tanstack/react-query';
import { getStudents, getCompanies } from './service';
import type { StudentListItem, StudentFilters, CompanyListItem, CompanyFilters } from './types';

export type { StudentListItem, CompanyListItem };

// ─── Key Factories ─────────────────────────────────────────────

export const studentKeys = {
  all: ['students'] as const,
  list: (filters: StudentFilters) => [...studentKeys.all, 'list', filters] as const
};

export const companyKeys = {
  all: ['companies'] as const,
  list: (filters: CompanyFilters) => [...companyKeys.all, 'list', filters] as const
};

// ─── Query Options ─────────────────────────────────────────────

export const studentsQueryOptions = (filters: StudentFilters) =>
  queryOptions({
    queryKey: studentKeys.list(filters),
    queryFn: () => getStudents(filters)
  });

export const companiesQueryOptions = (filters: CompanyFilters) =>
  queryOptions({
    queryKey: companyKeys.list(filters),
    queryFn: () => getCompanies(filters)
  });
