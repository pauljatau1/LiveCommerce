import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { BASE_URL } from '../Constants/Server';
import PropTypes from 'prop-types';

const LivestreamSocketContext = createContext();

export function LivestreamSocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [bidUpdates, setBidUpdates] = useState({});
  const [bidTimers, setBidTimers] = useState({});
  const [productStatuses, setProductStatuses] = useState({});
  
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
      
      // Handle bid-specific notifications
      if (notification.type === 'new_bid') {
        console.log('Processing new bid notification:', notification);
        // Update bid state for the specific product
        if (notification.data?.product?.product?.productId) {
          const productId = notification.data.product.product.productId;
          setBidUpdates(prev => ({
            ...prev,
            [productId]: {
              currentBid: notification.data.bidAmount,
              currentBidder: notification.data.currentBidder,
              timestamp: notification.timestamp
            }
          }));
          
          // Make sure the bid amount is available for display in the chat
          if (!notification.content && notification.data.bidAmount) {
            notification.content = `placed a bid of ${new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'NGN'
            }).format(notification.data.bidAmount)}`;
          }
        }
      } else if (notification.type === 'auction_winner') {
        console.log('Processing auction winner notification:', notification);
        // Update bid state for the specific product
        if (notification.data?.product?.product?.productId) {
          const productId = notification.data.product.product.productId;
          setBidUpdates(prev => ({
            ...prev,
            [productId]: {
              currentBid: notification.data.bidWinner.bidAmount,
              currentBidder: notification.data.bidWinner.buyer,
              isWinner: true,
              timestamp: notification.timestamp
            }
          }));
          
          // Update the product status to 'ended'
          setProductStatuses(prev => ({
            ...prev,
            [productId]: 'ongoing'
          }));
          
          // Enhance notification with bid amount for display in chat
          if (notification.data.bidWinner.bidAmount && !notification.data.bidAmount) {
            notification.data.bidAmount = notification.data.bidWinner.bidAmount;
          }
        }
      }
      
      // Add all notifications to the notifications array
      setNotifications(prev => [...prev, notification]);
    });

    // Listen for viewer join event
    socketInstance.on('viewer_joined_stream', (notification) => {
      console.log('Viewer joined stream:', notification);
      setNotifications(prev => [...prev, notification]);
    });

    // Listen for viewer leave event
    socketInstance.on('viewer_left_stream', (notification) => {
      console.log('Viewer left stream:', notification);
      setNotifications(prev => [...prev, notification]);
    });
    
    // Listen for bid timer updates
    socketInstance.on('bid_timer_update', (timerData) => {
      console.log('Received bid timer update:', timerData);
      if (timerData.productId) {
        setBidTimers(prev => ({
          ...prev,
          [timerData.productId]: {
            secondsLeft: timerData.secondsLeft,
            formattedTime: timerData.formattedTime,
            timestamp: timerData.timestamp
          }
        }));
        
        // If timer reaches zero, update the product status to 'ended'
        if (timerData.secondsLeft <= 0) {
          console.log('Timer expired for product:', timerData.productId);
          setProductStatuses(prev => ({
            ...prev,
            [timerData.productId]: 'ongoing'
          }));
        }
      }
    });

    setSocket(socketInstance);

    return () => {
      console.log('Disconnecting livestream socket');
      socketInstance.off('stream_notification');
      socketInstance.off('viewer_joined_stream');
      socketInstance.off('viewer_left_stream');
      socketInstance.off('bid_timer_update');
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
  
  // Function to manually update a product status
  const updateProductStatus = (productId, status) => {
    if (!productId || !status) return;
    
    setProductStatuses(prev => ({
      ...prev,
      [productId]: status
    }));
  };
  
  // Function to reset all bidding-related states
  const resetBiddingStates = () => {
    setNotifications([]);
    setBidUpdates({});
    setBidTimers({});
    setProductStatuses({});
    console.log('All bidding states have been reset');
  };
  
  // Function to clean up socket listeners for a specific stream
  const cleanupListeners = (streamId) => {
    if (!socket || !streamId) {
      console.warn('Cannot clean up listeners: socket not connected or invalid stream ID');
      return;
    }
    
    try {
      // Remove any stream-specific event listeners
      socket.off('stream_notification');
      socket.off('viewer_joined_stream');
      socket.off('viewer_left_stream');
      socket.off('bid_timer_update');
      
      console.log(`Cleaned up socket listeners for stream: ${streamId}`);
      
      // Re-subscribe to global notifications for future streams
      socket.on('stream_notification', (notification) => {
        console.log('Received stream notification:', notification);
        setNotifications(prev => [...prev, notification]);
      });
      
      socket.on('viewer_joined_stream', (notification) => {
        console.log('Viewer joined stream:', notification);
        setNotifications(prev => [...prev, notification]);
      });
      
      socket.on('viewer_left_stream', (notification) => {
        console.log('Viewer left stream:', notification);
        setNotifications(prev => [...prev, notification]);
      });
      
      return true;
    } catch (error) {
      console.error('Error cleaning up socket listeners:', error);
      return false;
    }
  };

  return (
    <LivestreamSocketContext.Provider value={{ 
      socket, 
      notifications,
      bidUpdates,
      bidTimers,
      productStatuses,
      sendStreamComment,
      updateProductStatus,
      resetBiddingStates,
      cleanupListeners
    }}>
      {children}
    </LivestreamSocketContext.Provider>
  );
}

LivestreamSocketProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export const useLivestreamSocket = () => {
  const context = useContext(LivestreamSocketContext);
  
  // Return a default object if context is not available (used outside provider)
  if (!context) {
    console.warn('useLivestreamSocket hook used outside of LivestreamSocketProvider');
    return {
      socket: null,
      notifications: [],
      bidUpdates: {},
      bidTimers: {},
      productStatuses: {},
      sendStreamComment: () => {
        console.warn('Cannot send comment: socket not available');
        return false;
      },
      updateProductStatus: () => {
        console.warn('Cannot update product status: socket not available');
      },
      resetBiddingStates: () => {
        console.warn('Cannot reset bidding states: socket not available');
      },
      cleanupListeners: () => {
        console.warn('Cannot clean up listeners: socket not available');
        return false;
      }
    };
  }
  
  return context;
}; 