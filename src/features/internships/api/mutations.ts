import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import {
  createInternship,
  updateInternship,
  deleteInternship,
  createApplication,
  updateApplicationStatus
} from './service';
import { internshipKeys, applicationKeys } from './queries';
import type { InternshipMutationPayload, ApplicationMutationPayload } from './types';

export const createInternshipMutation = mutationOptions({
  mutationFn: ({ companyId, data }: { companyId: string; data: InternshipMutationPayload }) =>
    createInternship(companyId, data),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: internshipKeys.all });
  }
});

export const updateInternshipMutation = mutationOptions({
  mutationFn: ({
    id,
    data
  }: {
    id: string;
    data: Partial<InternshipMutationPayload & { status: string }>;
  }) => updateInternship(id, data),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: internshipKeys.all });
  }
});

export const deleteInternshipMutation = mutationOptions({
  mutationFn: (id: string) => deleteInternship(id),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: internshipKeys.all });
  }
});

export const createApplicationMutation = mutationOptions({
  mutationFn: ({ studentId, data }: { studentId: string; data: ApplicationMutationPayload }) =>
    createApplication(studentId, data),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: applicationKeys.all });
  }
});

export const updateApplicationStatusMutation = mutationOptions({
  mutationFn: ({ id, status, statusNote }: { id: string; status: string; statusNote?: string }) =>
    updateApplicationStatus(id, status, statusNote),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: applicationKeys.all });
  }
});
