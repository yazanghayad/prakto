import { queryOptions } from '@tanstack/react-query';
import { getMeetings } from './service';

export const meetingKeys = {
  all: ['lia-meetings'] as const,
  list: (userId: string) => [...meetingKeys.all, 'list', userId] as const
};

export const meetingListOptions = (userId: string) =>
  queryOptions({
    queryKey: meetingKeys.list(userId),
    queryFn: () => getMeetings(userId),
    enabled: !!userId
  });
