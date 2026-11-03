import { io, Socket } from 'socket.io-client';
import { API_URL, SOCKET_EVENTS } from '@/constants/api';

export interface StreamNotification {
  id: string;
  type: 'comment' | 'join' | 'purchase' | 'hostLeft' | 'hostRejoin' | 'leave' | 'auction_start' | 'new_bid' | 'auction_winner' | 'auction_end' | 'liveshow_order' | 'announcement';
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
    buyerAvatar?: string;
    productId?: string;
    productName?: string;
    price?: number;
    streamId: string;
    isHost?: boolean;
    viewerCount?: number;
    product?: any; // For auction_start notification
    bidAmount?: number;
    isError?: boolean;
    storeName?: string; // For liveshow_order notification
    orders?: any; // For liveshow_order notification
    currentBidder?: {
      _id: string;
      firstName: string;
      lastName: string;
      username: string;
      profileImage?: {
        url?: string;
      };
    };
    bidWinner?: {
      buyer: {
        _id: string;
        firstName: string;
        lastName: string;
        username: string;
        profileImage?: {
          url?: string;
        };
      };
      bidAmount: number;
      timestamp: Date;
    };
  };
  timestamp: Date;
}

export interface BidTimerUpdate {
  streamId: string;
  productId: string;
  secondsLeft: number;
  formattedTime: string;
  jobId: string;
  productIndex: number;
  productName: string;
}

export interface BidTimerComplete {
  streamId: string;
  productId: string;
  jobId: string;
  productIndex: number;
  productName: string;
}

export interface AuctionOrderCreated {
  success: boolean;
  message: string;
  orderId: string;
  streamId: string;
  productName: string;
  amount: number;
  shippingFee: number;
  total: number;
}

let socket: Socket | null = null;

export const initializeSocket = (
  token: string, 
  onNotification: (notification: StreamNotification) => void,
  streamId?: string,
  setIsBidSending?: React.Dispatch<React.SetStateAction<boolean>>,
  onBidTimerUpdate?: (data: BidTimerUpdate) => void,
  onBidTimerComplete?: (data: BidTimerComplete) => void,
  onAuctionOrderCreated?: (data: AuctionOrderCreated) => void
) => {
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
    // Subscribe to stream notifications with streamId
    if (streamId) {
      console.log('Subscribing to stream notifications for stream:', streamId);
      currentSocket.emit('stream_notification_subscribe', {
        streamId: streamId
      });
    } else {
      // Fallback for backward compatibility
      console.log('Subscribing to general stream notifications (no streamId provided)');
      currentSocket.emit('stream_notification_subscribe');
    }
  });

  // Handle stream notifications (regular bids and auction winners)
  currentSocket.on('stream_notification', (data: StreamNotification) => {
    console.log('Received stream notification:', data);
    
    // Convert string timestamp to Date object if needed
    if (typeof data.timestamp === 'string') {
      data.timestamp = new Date(data.timestamp);
    }
    
    onNotification(data);
  });

  // Handle bid error events
  currentSocket.on('bid_error', (data: { message: string }) => {
    console.error('Bid error:', data.message);
    
    // Update bidding state if the setter is provided
    if (setIsBidSending) {
      setIsBidSending(false);
    }
    
    // Pass this to the notification handler as an error notification
    const errorNotification: StreamNotification = {
      id: Date.now().toString(),
      type: 'comment', // Using comment type but will handle differently in UI
      user: 'System',
      content: `Bid error: ${data.message}`,
      data: {
        streamId: 'error',
        isError: true,
        message: data.message // Add the raw message separately for easy access
      },
      timestamp: new Date()
    };
    onNotification(errorNotification);
  });

  // Handle bid success events
  currentSocket.on('bid_placed', (data: any) => {
    console.log('Bid placed successfully:', data);
    
    // Update bidding state if the setter is provided
    if (setIsBidSending) {
      setIsBidSending(false);
    }
  });

  // Handle bid timer update event
  currentSocket.on('bid_timer_update', (data: BidTimerUpdate) => {
    console.log('Bid timer update:', data);
    
    // If callback is provided, pass timer update data
    if (onBidTimerUpdate) {
      onBidTimerUpdate(data);
      console.log('Bid timer update received:', data);
    }
  });

  // Handle bid timer complete event
  currentSocket.on('bid_timer_complete', (data: BidTimerComplete) => {
    console.log('Bid timer complete:', data);
    
    // If callback is provided, pass timer complete data
    if (onBidTimerComplete) {
      onBidTimerComplete(data);
    }
  });

  // Handle auction order created event
  currentSocket.on('auction_order_created', (data: AuctionOrderCreated) => {
    console.log('Auction order created:', data);
    
    // If callback is provided, pass order created data
    if (onAuctionOrderCreated) {
      onAuctionOrderCreated(data);
    }
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

  // Handle viewer left stream events
  currentSocket.on(SOCKET_EVENTS.VIEWER_LEFT, (data: StreamNotification) => {
    console.log('Viewer left stream:', data);
    
    // Convert string timestamp to Date object if needed
    if (typeof data.timestamp === 'string') {
      data.timestamp = new Date(data.timestamp);
    }
    
    onNotification(data);
  });

  // Handle auction start events
  currentSocket.on(SOCKET_EVENTS.AUCTION_START, (data: StreamNotification) => {
    console.log('Auction started for product:', data);
    
    // Convert string timestamp to Date object if needed
    if (typeof data.timestamp === 'string') {
      data.timestamp = new Date(data.timestamp);
    }
    
    onNotification(data);
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