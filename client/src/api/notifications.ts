import api from './client';

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  entityType: string | null;
  entityId: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationListResponse {
  items: NotificationItem[];
  total: number;
  unreadCount: number;
  page: number;
  pageSize: number;
}

export async function fetchNotifications(params?: {
  unread?: boolean;
  page?: number;
  pageSize?: number;
}): Promise<NotificationListResponse> {
  const { data } = await api.get<NotificationListResponse>('/notifications', {
    params: {
      ...(params?.unread ? { unread: 'true' } : {}),
      ...(params?.page ? { page: params.page } : {}),
      ...(params?.pageSize ? { pageSize: params.pageSize } : {}),
    },
  });
  return data;
}

export async function markNotificationRead(id: string): Promise<void> {
  await api.patch(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<{ updated: number }> {
  const { data } = await api.post<{ updated: number }>(
    '/notifications/read-all',
  );
  return data;
}
