import { io, Socket } from 'socket.io-client';
import { API_URL, SOCKET_EVENTS } from '@/constants/api';

export interface StreamNotification {
  id: string;
  type: 'comment' | 'join' | 'purchase' | 'hostLeft' | 'hostRejoin';
  user: string;
  avatar?: string;
  content: string;
  data?: {
    message?: string;
    sellerId?: string;
    sellerName?: string;
    buyerId?: string;
    buyerName?: string;
    buyerUsername?: string;
    productId?: string;
    productName?: string;
    price?: number;
    streamId: string;
    isHost: boolean;
    viewerCount?: number;
  };
  timestamp: Date;
}

let socket: Socket | null = null;

export const initializeSocket = (token: string, onNotification: (notification: StreamNotification) => void) => {
  if (socket && socket.connected) {
    console.log('Socket already connected');
    return socket;
  }

  // Close any existing socket
  if (socket) {
    socket.disconnect();
  }

  console.log('Initializing socket connection');
  socket = io(API_URL, {
    auth: {
      token
    },
    transports: ['websocket'],
    autoConnect: true
  });

  // At this point, socket is guaranteed to be non-null
  const currentSocket = socket as Socket;

  currentSocket.on('connect', () => {
    console.log('Socket connected');
    // Subscribe to stream notifications
    currentSocket.emit('stream_notification_subscribe');
  });

  // Handle general stream notifications (including comments from other users)
  currentSocket.on('stream_notification', (data: StreamNotification) => {
    console.log('Received stream notification:', data);
    
    // Convert string timestamp to Date object if needed
    if (typeof data.timestamp === 'string') {
      data.timestamp = new Date(data.timestamp);
    }
    
    onNotification(data);
  });

  currentSocket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });

  currentSocket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });

  // Handle viewer joined stream events
  currentSocket.on(SOCKET_EVENTS.VIEWER_JOINED, (data: StreamNotification) => {
    console.log('Viewer joined stream:', data);
    
    // Convert string timestamp to Date object if needed
    if (typeof data.timestamp === 'string') {
      data.timestamp = new Date(data.timestamp);
    }
    
    onNotification(data);
  });

  // Handle new comment events
  currentSocket.on(SOCKET_EVENTS.NEW_COMMENT, (data: StreamNotification) => {
    console.log('New comment:', data);
    
    // Convert string timestamp to Date object if needed
    if (typeof data.timestamp === 'string') {
      data.timestamp = new Date(data.timestamp);
    }
    
    onNotification(data);
  });

  // Handle new purchase events
  currentSocket.on(SOCKET_EVENTS.NEW_PURCHASE, (data: StreamNotification) => {
    console.log('New purchase:', data);
    
    // Convert string timestamp to Date object if needed
    if (typeof data.timestamp === 'string') {
      data.timestamp = new Date(data.timestamp);
    }
    
    onNotification(data);
  });

  // Handle seller rejoining stream events
  currentSocket.on(SOCKET_EVENTS.SELLER_REJOINED, (data: StreamNotification) => {
    console.log('Seller rejoined stream:', data);
    
    // Convert string timestamp to Date object if needed
    if (typeof data.timestamp === 'string') {
      data.timestamp = new Date(data.timestamp);
    }
    
    // Modify the notification type to be consistent with our type system
    const notificationWithCorrectType = {
      ...data,
      type: 'hostRejoin' as const
    };
    
    onNotification(notificationWithCorrectType);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('Socket disconnected');
  }
};

export const getSocket = () => socket; 