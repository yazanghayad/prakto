import { queryOptions } from '@tanstack/react-query';
import { getCompanyProfile, getCompanyById } from './service';
import type { CompanyProfile } from './types';

export type { CompanyProfile };

// ─── Key Factories ─────────────────────────────────────────────

export const companyKeys = {
  all: ['company'] as const,
  profile: (userId: string) => [...companyKeys.all, 'profile', userId] as const,
  detail: (id: string) => [...companyKeys.all, 'detail', id] as const
};

// ─── Query Options ─────────────────────────────────────────────

export const companyProfileOptions = (userId: string) =>
  queryOptions({
    queryKey: companyKeys.profile(userId),
    queryFn: () => getCompanyProfile(userId),
    enabled: !!userId
  });

export const companyByIdOptions = (id: string) =>
  queryOptions({
    queryKey: companyKeys.detail(id),
    queryFn: () => getCompanyById(id)
  });
