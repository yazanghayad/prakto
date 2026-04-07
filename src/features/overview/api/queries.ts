import { queryOptions } from '@tanstack/react-query';
import { apiUrl } from '@/lib/api-client';
import type {
  StudentStatCards,
  ApplicationStatusData,
  WeeklyHoursEntry,
  GoalsData,
  RecentActivityData
} from './types';

// ─── Key Factory ─────────────────────────────────────────────

export const overviewKeys = {
  all: ['overview'] as const,
  statCards: () => [...overviewKeys.all, 'statCards'] as const,
  applicationStatus: () => [...overviewKeys.all, 'applicationStatus'] as const,
  weeklyHours: () => [...overviewKeys.all, 'weeklyHours'] as const,
  goals: () => [...overviewKeys.all, 'goals'] as const,
  recentActivity: () => [...overviewKeys.all, 'recentActivity'] as const
};

// ─── Client-side fetchers (for potential SPA usage) ──────────

async function fetchJson<T>(path: string): Promise<T | null> {
  const res = await fetch(apiUrl(path));
  if (!res.ok) return null;
  return res.json();
}

// ─── Query Options ───────────────────────────────────────────

export const statCardsQueryOptions = () =>
  queryOptions({
    queryKey: overviewKeys.statCards(),
    queryFn: () => fetchJson<StudentStatCards>('/api/overview/stat-cards')
  });

export const applicationStatusQueryOptions = () =>
  queryOptions({
    queryKey: overviewKeys.applicationStatus(),
    queryFn: () => fetchJson<ApplicationStatusData>('/api/overview/application-status')
  });

export const weeklyHoursQueryOptions = () =>
  queryOptions({
    queryKey: overviewKeys.weeklyHours(),
    queryFn: () => fetchJson<WeeklyHoursEntry[]>('/api/overview/weekly-hours')
  });

export const goalsQueryOptions = () =>
  queryOptions({
    queryKey: overviewKeys.goals(),
    queryFn: () => fetchJson<GoalsData>('/api/overview/goals')
  });

export const recentActivityQueryOptions = () =>
  queryOptions({
    queryKey: overviewKeys.recentActivity(),
    queryFn: () => fetchJson<RecentActivityData>('/api/overview/recent-activity')
  });
