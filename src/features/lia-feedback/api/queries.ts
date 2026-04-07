import { queryOptions } from '@tanstack/react-query';
import { getFeedback } from './service';

export const feedbackKeys = {
  all: ['lia-feedback'] as const,
  list: (userId: string) => [...feedbackKeys.all, 'list', userId] as const
};

export const feedbackListOptions = (userId: string) =>
  queryOptions({
    queryKey: feedbackKeys.list(userId),
    queryFn: () => getFeedback(userId),
    enabled: !!userId
  });
