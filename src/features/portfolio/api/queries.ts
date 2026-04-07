import { queryOptions } from '@tanstack/react-query';
import { getPortfolioItems, getPortfolioItem } from './service';
import type { PortfolioItemDoc } from './types';

export type { PortfolioItemDoc };

// ─── Key Factories ─────────────────────────────────────────────

export const portfolioKeys = {
  all: ['portfolio'] as const,
  list: (userId: string) => [...portfolioKeys.all, 'list', userId] as const,
  detail: (id: string) => [...portfolioKeys.all, 'detail', id] as const
};

// ─── Query Options ─────────────────────────────────────────────

export const portfolioListOptions = (userId: string) =>
  queryOptions({
    queryKey: portfolioKeys.list(userId),
    queryFn: () => getPortfolioItems(userId),
    enabled: !!userId
  });

export const portfolioItemOptions = (id: string) =>
  queryOptions({
    queryKey: portfolioKeys.detail(id),
    queryFn: () => getPortfolioItem(id),
    enabled: !!id
  });
