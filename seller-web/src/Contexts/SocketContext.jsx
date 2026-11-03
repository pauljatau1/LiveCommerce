import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { BASE_URL } from '@/Constants/Server';
import { tokenUtils, sellerUtils } from '@/util/auth';
import PropTypes from 'prop-types';

const SocketContext = createContext();

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const token = tokenUtils.getBearerToken();

  const connectSocket = useCallback(() => {
    try {
      // Parse the BASE_URL to extract just the origin (protocol + hostname + port)
      let socketUrl;
      try {
        // Create a URL object to properly parse the URL components
        const baseUrlObj = new URL(BASE_URL);
        // Use only the origin part (protocol + hostname + port)
        socketUrl = baseUrlObj.origin;
        console.log('Connecting to general socket server at:', socketUrl);
      } catch (parseError) {
        console.error('Invalid BASE_URL format:', BASE_URL, parseError);
        // Fallback to a default if URL parsing fails
        socketUrl = window.location.origin;
        console.log('Falling back to origin:', socketUrl);
      }

      const socketInstance = io(socketUrl, {
        transports: ["websocket"],
        auth: {
          token
        }
      });

      socketInstance.on('connect', () => {
        console.log('Socket connected -----');
        // Join personal room using seller ID
        const seller = sellerUtils.getSeller();
        if (seller) {
          const sellerId = seller._id;
          console.log('socket sellerId', sellerId);
          socketInstance.emit('join', sellerId);
        }
      });

      socketInstance.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        // Add more detailed error logging
        if (error.description) {
          console.error('Error description:', error.description);
        }
        if (error.data) {
          console.error('Error data:', error.data);
        }
      });

      setSocket(socketInstance);

      return () => {
        socketInstance.disconnect();
      };
    } catch (error) {
      console.error('Error creating socket connection:', error);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;

    connectSocket();
  }, [connectSocket, token]);

  const disconnectSocket = useCallback(() => {
    if (socket) {
      console.log('🔌 [SOCKET] User not authenticated, disconnecting general socket...');
      socket.disconnect();
      setSocket(null);
    }
  }, [socket]);


  return (
    <SocketContext.Provider value={{ socket, disconnectSocket, connectSocket }}>
      {children}
    </SocketContext.Provider>
  );
}

SocketProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export const useSocket = () => useContext(SocketContext);
