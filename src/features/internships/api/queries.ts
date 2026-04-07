import { queryOptions } from '@tanstack/react-query';
import { getInternships, getInternshipById, getApplications } from './service';
import type { Internship, InternshipFilters, Application, ApplicationFilters } from './types';

export type { Internship, Application };

// ─── Key Factories ─────────────────────────────────────────────

export const internshipKeys = {
  all: ['internships'] as const,
  list: (filters: InternshipFilters) => [...internshipKeys.all, 'list', filters] as const,
  detail: (id: string) => [...internshipKeys.all, 'detail', id] as const
};

export const applicationKeys = {
  all: ['applications'] as const,
  list: (filters: ApplicationFilters) => [...applicationKeys.all, 'list', filters] as const
};

// ─── Query Options ─────────────────────────────────────────────

export const internshipsQueryOptions = (filters: InternshipFilters) =>
  queryOptions({
    queryKey: internshipKeys.list(filters),
    queryFn: () => getInternships(filters)
  });

export const internshipByIdOptions = (id: string) =>
  queryOptions({
    queryKey: internshipKeys.detail(id),
    queryFn: () => getInternshipById(id)
  });

export const applicationsQueryOptions = (filters: ApplicationFilters) =>
  queryOptions({
    queryKey: applicationKeys.list(filters),
    queryFn: () => getApplications(filters)
  });
