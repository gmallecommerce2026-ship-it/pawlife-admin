// src/hooks/useWebsocket.ts
'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { getAuthToken } from '@/lib/auth/tokenStorage';

const BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000').replace(/\/+$/, '');

export function useWebsocket(customToken?: string, shelterId?: string) {
  const socketRef = useRef<Socket | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null); // 🆕
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = customToken || getAuthToken();

    const socketInstance = io(`${BASE_URL}/notifications`, {
      transports: ['websocket', 'polling'],
      auth: { token: token ? `Bearer ${token}` : undefined },
      extraHeaders: { Authorization: token ? `Bearer ${token}` : '' },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      withCredentials: true,
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      if (shelterId) socketInstance.emit('join_shelter', { shelterId });
    });
    socketInstance.on('disconnect', () => setIsConnected(false));
    socketInstance.on('connect_error', (error) => console.warn('[WebSocket]', error.message));

    socketRef.current = socketInstance;
    setSocket(socketInstance); // 🆕 trigger re-render với giá trị đúng

    return () => {
      socketInstance.disconnect();
      socketRef.current = null;
      setSocket(null);
    };
  }, [customToken, shelterId]);

  return socket; // 🆕 trả state, không trả ref.current
}