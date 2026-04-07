import { queryOptions } from '@tanstack/react-query';
import { getJournalEntries } from './service';

export const journalKeys = {
  all: ['lia-journal'] as const,
  list: (userId: string) => [...journalKeys.all, 'list', userId] as const
};

export const journalListOptions = (userId: string) =>
  queryOptions({
    queryKey: journalKeys.list(userId),
    queryFn: () => getJournalEntries(userId),
    enabled: !!userId
  });
