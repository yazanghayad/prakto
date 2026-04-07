import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import {
  createPortfolioItem,
  updatePortfolioItem,
  deletePortfolioItem,
  uploadPortfolioFile
} from './service';
import { portfolioKeys } from './queries';
import type { PortfolioItemPayload } from './types';

export const createPortfolioMutation = mutationOptions({
  mutationFn: (data: PortfolioItemPayload) => createPortfolioItem(data),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: portfolioKeys.all });
  }
});

export const updatePortfolioMutation = mutationOptions({
  mutationFn: ({ id, data }: { id: string; data: Partial<PortfolioItemPayload> }) =>
    updatePortfolioItem(id, data),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: portfolioKeys.all });
  }
});

export const deletePortfolioMutation = mutationOptions({
  mutationFn: (id: string) => deletePortfolioItem(id),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: portfolioKeys.all });
  }
});

export const uploadPortfolioFileMutation = mutationOptions({
  mutationFn: (file: File) => uploadPortfolioFile(file)
});
