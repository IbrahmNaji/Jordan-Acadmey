import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, BellRing, CheckCheck } from 'lucide-react';
import clsx from 'clsx';
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
} from '../api/notifications';
import { formatDateTime } from '../lib/format';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['notifications', 'recent'],
    queryFn: () => fetchNotifications({ pageSize: 10 }),
    refetchInterval: 60_000,
    staleTime: 15_000,
  });

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ['notifications'] });

  const markAll = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: invalidate,
  });
  const markOne = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: invalidate,
  });

  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const unread = query.data?.unreadCount ?? 0;
  const items = query.data?.items ?? [];

  const openItem = (item: NotificationItem) => {
    if (!item.readAt) markOne.mutate(item.id);
    setOpen(false);
    if (item.link) navigate(item.link);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative rounded-md p-2 text-steel-600 transition hover:bg-ink-900/5 hover:text-ink-900"
        aria-label={
          unread > 0 ? `الإشعارات، ${unread} غير مقروء` : 'الإشعارات'
        }
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        {unread > 0 ? <BellRing size={18} /> : <Bell size={18} />}
        {unread > 0 && (
          <span className="absolute -top-0.5 -left-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-flame-600 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="الإشعارات"
          className="absolute left-0 top-12 z-50 w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl bg-white shadow-lift ring-1 ring-steel-200"
        >
          <div className="flex items-center justify-between border-b border-steel-200/60 px-3 py-2.5">
            <p className="text-sm font-bold text-ink-900">الإشعارات</p>
            <button
              type="button"
              onClick={() => markAll.mutate()}
              disabled={unread === 0 || markAll.isPending}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-flame-700 transition hover:text-flame-800 disabled:text-steel-400"
            >
              <CheckCheck size={13} />
              تعليم الكل كمقروء
            </button>
          </div>

          {query.isLoading ? (
            <div className="space-y-2 p-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-14 animate-pulse rounded-lg bg-steel-200/60"
                />
              ))}
            </div>
          ) : query.isError ? (
            <p className="px-3 py-8 text-center text-sm text-red-700">
              تعذّر تحميل الإشعارات.
            </p>
          ) : items.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-steel-600">
              لا توجد إشعارات حالياً.
            </p>
          ) : (
            <ul className="max-h-96 divide-y divide-steel-200/60 overflow-y-auto">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => openItem(item)}
                    className={clsx(
                      'w-full px-3 py-2.5 text-right transition hover:bg-paper',
                      !item.readAt && 'bg-flame-50/60',
                    )}
                  >
                    <span className="flex items-start gap-2">
                      {!item.readAt && (
                        <span
                          className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-flame-600"
                          aria-label="غير مقروء"
                        />
                      )}
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-semibold text-ink-900">
                          {item.title}
                        </span>
                        {item.body && (
                          <span className="mt-0.5 block truncate text-[11px] text-steel-600">
                            {item.body}
                          </span>
                        )}
                        <span className="mt-1 block text-[10px] text-steel-500">
                          {formatDateTime(item.createdAt)}
                        </span>
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
