import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(undefined);

export const SocketProvider = ({ children }) => {
  const { token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    const rawServerUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
    const serverUrl = rawServerUrl.replace(/\/+$/, '');
    const socketInstance = io(serverUrl, {
      auth: {
        token,
      },
      transports: ['websocket'],
    });

    socketInstance.on('connect', () => {
      setConnected(true);
      console.log('Socket.io connected');
    });

    socketInstance.on('disconnect', () => {
      setConnected(false);
      console.log('Socket.io disconnected');
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [token]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
