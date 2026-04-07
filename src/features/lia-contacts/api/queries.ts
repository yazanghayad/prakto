import { queryOptions } from '@tanstack/react-query';
import { getContacts } from './service';

export const contactKeys = {
  all: ['lia-contacts'] as const,
  list: (userId: string) => [...contactKeys.all, 'list', userId] as const
};

export const contactListOptions = (userId: string) =>
  queryOptions({
    queryKey: contactKeys.list(userId),
    queryFn: () => getContacts(userId),
    enabled: !!userId
  });
