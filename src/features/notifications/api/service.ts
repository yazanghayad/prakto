import { apiUrl } from '@/lib/api-client';
import type { NotificationDoc, NotificationsResponse, NotificationFilters } from './types';

/** @deprecated Use NotificationDoc from types.ts instead */
export type AppNotification = NotificationDoc;

export async function getNotifications(
  params?: NotificationFilters
): Promise<NotificationsResponse> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.isRead !== undefined) searchParams.set('isRead', String(params.isRead));

  const res = await fetch(apiUrl(`/api/notifications?${searchParams.toString()}`));
  if (!res.ok) {
    throw new Error('Kunde inte hämta notiser.');
  }
  return res.json();
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  const res = await fetch(apiUrl('/api/notifications'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'markAsRead', notificationId })
  });
  if (!res.ok) {
    throw new Error('Kunde inte markera som läst.');
  }
}

export async function markAllNotificationsAsRead(): Promise<void> {
  const res = await fetch(apiUrl('/api/notifications'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'markAllAsRead' })
  });
  if (!res.ok) {
    throw new Error('Kunde inte markera alla som lästa.');
  }
}
