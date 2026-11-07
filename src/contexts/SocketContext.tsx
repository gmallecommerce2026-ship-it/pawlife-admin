// src/contexts/SocketContext.tsx
'use client';
import React, { createContext, useContext, useMemo } from 'react';
import { Socket } from 'socket.io-client';
import { jwtDecode } from 'jwt-decode';
import { useWebsocket } from '@/hooks/useWebsocket';
import { getAuthToken } from '@/lib/auth/tokenStorage';

const SocketContext = createContext<Socket | null>(null);

interface DecodedToken {
  id?: string;
  sub?: string;
  role?: string;
  shelterId?: string;
}

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const shelterId = useMemo(() => {
    const token = getAuthToken();
    if (!token) return undefined;
    try {
      const decoded = jwtDecode<DecodedToken>(token);
      return decoded.shelterId;
    } catch {
      return undefined;
    }
  }, []);

  const socket = useWebsocket(undefined, shelterId);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
};

export const useSocket = () => useContext(SocketContext);