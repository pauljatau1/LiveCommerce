import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { BASE_URL } from '@/Constants/Server';

const SocketContext = createContext();

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const token = JSON.parse(localStorage.getItem('sellerToken'))?.data;
    if (!token) return;

    const socketInstance = io(BASE_URL.split("/api")[0], {
      transports: ["websocket"],
      auth: {
        token
      }
    });

    socketInstance.on('connect', () => {
      console.log('Socket connected -----');
      // Join personal room using seller ID
      const sellerId = JSON.parse(localStorage.getItem('seller'))._id;
      socketInstance.emit('join', sellerId);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
