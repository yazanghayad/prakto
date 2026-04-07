import { queryOptions } from '@tanstack/react-query';
import { getNotifications } from './service';

export const notificationKeys = {
  all: ['notifications'] as const,
  list: (params?: { isRead?: boolean }) => [...notificationKeys.all, 'list', params] as const,
  unreadCount: () => [...notificationKeys.all, 'unreadCount'] as const
};

export function notificationsQueryOptions(params?: {
  page?: number;
  limit?: number;
  isRead?: boolean;
}) {
  return queryOptions({
    queryKey: notificationKeys.list(
      params?.isRead !== undefined ? { isRead: params.isRead } : undefined
    ),
    queryFn: () => getNotifications(params),
    refetchInterval: 30_000 // Poll every 30 seconds for new notifications
  });
}

export function unreadCountQueryOptions() {
  return queryOptions({
    queryKey: notificationKeys.unreadCount(),
    queryFn: async () => {
      const data = await getNotifications({ limit: 1 });
      return data.unreadCount;
    },
    refetchInterval: 30_000
  });
}
