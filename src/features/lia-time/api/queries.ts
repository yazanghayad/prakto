import { queryOptions } from '@tanstack/react-query';
import { getTimeEntries } from './service';

export const timeKeys = {
  all: ['lia-time'] as const,
  list: (userId: string) => [...timeKeys.all, 'list', userId] as const
};

export const timeListOptions = (userId: string) =>
  queryOptions({
    queryKey: timeKeys.list(userId),
    queryFn: () => getTimeEntries(userId),
    enabled: !!userId
  });
