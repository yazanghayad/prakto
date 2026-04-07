import { queryOptions } from '@tanstack/react-query';
import { getStudentProfile, getStudentById } from './service';
import type { StudentProfileDoc } from './types';

export type { StudentProfileDoc };

// ─── Key Factories ─────────────────────────────────────────────

export const studentKeys = {
  all: ['student'] as const,
  profile: (userId: string) => [...studentKeys.all, 'profile', userId] as const,
  detail: (id: string) => [...studentKeys.all, 'detail', id] as const
};

// ─── Query Options ─────────────────────────────────────────────

export const studentProfileOptions = (userId: string) =>
  queryOptions({
    queryKey: studentKeys.profile(userId),
    queryFn: () => getStudentProfile(userId),
    enabled: !!userId
  });

export const studentByIdOptions = (id: string) =>
  queryOptions({
    queryKey: studentKeys.detail(id),
    queryFn: () => getStudentById(id)
  });
