import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { BASE_URL } from '../Constants/Server';
import PropTypes from 'prop-types';

const LivestreamSocketContext = createContext();

export function LivestreamSocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  
  useEffect(() => {
    const token = JSON.parse(localStorage.getItem('sellerToken'))?.data;
    if (!token) return;

    // Create a socket connection specifically for livestream
    const socketInstance = io(BASE_URL.split("/api")[0], {
      transports: ["websocket"],
      auth: {
        token
      }
    });

    socketInstance.on('connect', () => {
      console.log('Livestream socket connected');
      // Join stream_notifications room
      socketInstance.emit('stream_notification_subscribe');
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Livestream socket connection error:', error);
    });

    // Listen for stream notifications
    socketInstance.on('stream_notification', (notification) => {
      console.log('Received stream notification:', notification);
      setNotifications(prev => [...prev, notification]);
    });

    setSocket(socketInstance);

    return () => {
      console.log('Disconnecting livestream socket');
      socketInstance.off('stream_notification');
      socketInstance.disconnect();
    };
  }, []);

  // Function to send a comment to the stream
  const sendStreamComment = (streamId, content) => {
    if (!socket || !streamId || !content.trim()) {
      console.error('Cannot send comment: socket not connected or invalid data');
      return false;
    }

    try {
      socket.emit('stream_comment', {
        streamId,
        content: content.trim()
      });
      return true;
    } catch (error) {
      console.error('Error sending stream comment:', error);
      return false;
    }
  };

  return (
    <LivestreamSocketContext.Provider value={{ 
      socket, 
      notifications,
      sendStreamComment 
    }}>
      {children}
    </LivestreamSocketContext.Provider>
  );
}

LivestreamSocketProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export const useLivestreamSocket = () => useContext(LivestreamSocketContext); 