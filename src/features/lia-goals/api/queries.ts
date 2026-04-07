import { queryOptions } from '@tanstack/react-query';
import { getLiaGoals } from './service';

export const liaGoalKeys = {
  all: ['lia-goals'] as const,
  list: (userId: string) => [...liaGoalKeys.all, 'list', userId] as const
};

export const liaGoalsListOptions = (userId: string) =>
  queryOptions({
    queryKey: liaGoalKeys.list(userId),
    queryFn: () => getLiaGoals(userId),
    enabled: !!userId
  });
