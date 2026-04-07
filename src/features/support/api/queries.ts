import { queryOptions } from '@tanstack/react-query';
import { getSupportTickets } from './service';

export const supportKeys = {
  all: ['support'] as const,
  list: (userId: string) => [...supportKeys.all, 'list', userId] as const
};

export const supportTicketsOptions = (userId: string) =>
  queryOptions({
    queryKey: supportKeys.list(userId),
    queryFn: () => getSupportTickets(userId),
    enabled: !!userId
  });
