'use client';

import { useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const qc = useQueryClient();
  const { accessToken, activeTeamId } = useAuthStore();

  useEffect(() => {
    if (!accessToken) return;

    const socket = io('http://localhost:4000', {
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      if (activeTeamId) {
        socket.emit('join-team', activeTeamId);
      }
    });

    // On any task event, invalidate task queries
    const taskEvents = ['task:created', 'task:updated', 'task:deleted', 'task:reordered'];
    for (const event of taskEvents) {
      socket.on(event, () => {
        qc.invalidateQueries({ queryKey: ['tasks'] });
        qc.invalidateQueries({ queryKey: ['groups'] });
      });
    }

    // Notification events
    socket.on('notification', () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [accessToken]); // eslint-disable-line react-hooks/exhaustive-deps

  // Join/leave team room when active team changes
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket?.connected || !activeTeamId) return;

    socket.emit('join-team', activeTeamId);

    return () => {
      socket.emit('leave-team', activeTeamId);
    };
  }, [activeTeamId]);

  return socketRef;
}
