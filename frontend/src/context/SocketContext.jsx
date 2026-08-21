import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

const BACKEND_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : 'http://localhost:5000';

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!user) {
      // Disconnect if user logs out
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    // Don't reconnect if already connected
    if (socketRef.current?.connected) return;

    const socket = io(BACKEND_URL, {
      withCredentials: true, // Send HTTP-only cookie for JWT auth
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      setIsConnected(true);
      if (import.meta.env.DEV) {
        console.log('[Socket.IO] Connected:', socket.id);
      }
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      if (import.meta.env.DEV) {
        console.log('[Socket.IO] Disconnected');
      }
    });

    socket.on('connect_error', (err) => {
      if (import.meta.env.DEV) {
        console.warn('[Socket.IO] Connection error:', err.message);
      }
      setIsConnected(false);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
