import type { Models } from 'appwrite';

// ─── Document types (from Appwrite) ──────────────────────────

export interface NotificationDoc extends Models.Document {
  recipientId: string;
  type: string;
  title: string;
  message: string;
  linkUrl: string;
  isRead: boolean;
  createdAt: string;
}

// ─── API response ────────────────────────────────────────────

export interface NotificationsResponse {
  total: number;
  unreadCount: number;
  notifications: NotificationDoc[];
}

// ─── Query params ────────────────────────────────────────────

export interface NotificationFilters {
  page?: number;
  limit?: number;
  isRead?: boolean;
}

// ─── Create payload (server-internal) ────────────────────────

export interface CreateNotificationPayload {
  recipientId: string;
  type: string;
  title: string;
  message: string;
  linkUrl?: string;
}
