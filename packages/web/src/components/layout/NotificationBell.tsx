'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  const { data: countData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => api<{ count: number }>('/notifications/unread-count'),
    refetchInterval: 30_000,
  });

  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api<{ notifications: Notification[] }>('/notifications'),
    enabled: open,
  });

  const markRead = useMutation({
    mutationFn: (id: string) => api(`/notifications/${id}/read`, { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllRead = useMutation({
    mutationFn: () => api('/notifications/read-all', { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unread = countData?.count || 0;
  const notifications = notifData?.notifications || [];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative font-mono text-[14px] text-text-tertiary hover:text-text-secondary px-2 py-1 rounded hover:bg-bg-hover transition-all"
      >
        &#128276;
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red text-white text-[9px] font-mono font-bold rounded-full w-4 h-4 flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+4px)] bg-bg-raised border border-border rounded-lg w-[320px] max-h-[400px] overflow-y-auto z-50 shadow-xl">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border">
            <span className="font-mono text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
              Notifications
            </span>
            {unread > 0 && (
              <button
                onClick={() => markAllRead.mutate()}
                className="font-mono text-[10px] text-text-tertiary hover:text-accent transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="px-3 py-6 text-center text-text-tertiary text-[12px]">
              No notifications
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n._id}
                onClick={() => {
                  if (!n.read) markRead.mutate(n._id);
                }}
                className={`px-3 py-2.5 border-b border-border-subtle cursor-pointer hover:bg-bg-hover transition-colors ${
                  n.read ? 'opacity-50' : ''
                }`}
              >
                <div className="flex items-start gap-2">
                  {!n.read && (
                    <span className="w-1.5 h-1.5 bg-accent rounded-full mt-1.5 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] text-text leading-snug truncate">{n.title}</p>
                    {n.message && (
                      <p className="text-[11px] text-text-tertiary mt-0.5">{n.message}</p>
                    )}
                    <p className="text-[10px] text-text-tertiary mt-1 font-mono">
                      {new Date(n.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
