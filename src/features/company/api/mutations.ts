import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { createCompanyProfile, updateCompanyProfile, uploadCompanyLogo } from './service';
import { companyKeys } from './queries';
import type { CompanyProfilePayload } from './types';

export const createCompanyMutation = mutationOptions({
  mutationFn: ({ userId, data }: { userId: string; data: CompanyProfilePayload }) =>
    createCompanyProfile(userId, data),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: companyKeys.all });
  }
});

export const updateCompanyMutation = mutationOptions({
  mutationFn: ({ id, data }: { id: string; data: Partial<CompanyProfilePayload> }) =>
    updateCompanyProfile(id, data),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: companyKeys.all });
  }
});

export const uploadLogoMutation = mutationOptions({
  mutationFn: (file: File) => uploadCompanyLogo(file)
});
