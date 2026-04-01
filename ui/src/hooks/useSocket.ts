import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppDispatch } from './store';
import { api } from '@/store/api';

export function useSocket() {
  const dispatch = useAppDispatch();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const socket = io(window.location.origin, {
      path: '/ws',
      auth: { token },
      transports: ['websocket'],
    });

    socket.on('notification', () => {
      // Invalidate notification cache to refetch
      dispatch(api.util.invalidateTags(['Notifications']));
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [dispatch]);

  return socketRef;
}
