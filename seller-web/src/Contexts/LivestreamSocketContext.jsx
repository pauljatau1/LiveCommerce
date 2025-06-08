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

    try {
      // Parse the BASE_URL to extract just the origin (protocol + hostname + port)
      let socketUrl;
      try {
        // Create a URL object to properly parse the URL components
        const baseUrlObj = new URL(BASE_URL);
        // Use only the origin part (protocol + hostname + port)
        socketUrl = baseUrlObj.origin;
        console.log('Connecting to socket server at:', socketUrl);
      } catch (parseError) {
        console.error('Invalid BASE_URL format:', BASE_URL, parseError);
        // Fallback to a default if URL parsing fails
        socketUrl = window.location.origin;
        console.log('Falling back to origin:', socketUrl);
      }
      
      // Create a socket connection specifically for livestream
      const socketInstance = io(socketUrl, {
        transports: ["websocket"],
        auth: {
          token
        }
      });

      socketInstance.on('connect', () => {
        console.log('Livestream socket connected successfully');
        // Basic events setup (will add stream-specific events on subscription)
      });

      socketInstance.on('connect_error', (error) => {
        console.error('Livestream socket connection error:', error);
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
        console.log('Disconnecting livestream socket');
        if (socketInstance) {
          socketInstance.off('stream_notification');
          socketInstance.off('viewer_joined_stream');
          socketInstance.off('viewer_left_stream');
          socketInstance.off('bid_timer_update');
          socketInstance.disconnect();
        }
      };
    } catch (error) {
      console.error('Error creating socket connection:', error);
    }
  }, []);

  // Function to subscribe to a specific stream's notifications
  const subscribeToStreamNotifications = (streamId) => {
    if (!socket || !streamId) {
      console.error('Cannot subscribe to stream notifications: socket not connected or invalid stream ID');
      return false;
    }

    try {
      console.log(`Subscribing to notifications for stream: ${streamId}`);
      socket.emit('stream_notification_subscribe', { streamId });
      
      // Set up event listeners for this stream
      // Listen for stream notifications
      socket.on('stream_notification', (notification) => {
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
            
            // Update the product status to 'ongoing'
            setProductStatuses(prev => ({
              ...prev,
              [productId]: 'ongoing'
            }));
            
            // Enhance notification with bid amount for display in chat
            if (notification.data.bidWinner.bidAmount && !notification.data.bidAmount) {
              notification.data.bidAmount = notification.data.bidWinner.bidAmount;
            }
          }
        } else if (notification.type === 'liveshow_order') {
          console.log('Processing liveshow order notification:', notification);
          // No specific state updates needed, just handle the notification display
          // We could track orders in state if needed in the future
        }
        
        // Add all notifications to the notifications array
        setNotifications(prev => [...prev, notification]);
      });

      // Listen for viewer join event
      socket.on('viewer_joined_stream', (notification) => {
        console.log('Viewer joined stream:', notification);
        setNotifications(prev => [...prev, notification]);
      });

      // Listen for viewer leave event
      socket.on('viewer_left_stream', (notification) => {
        console.log('Viewer left stream:', notification);
        setNotifications(prev => [...prev, notification]);
      });
      
      // Listen for bid timer updates
      socket.on('bid_timer_update', (timerData) => {
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
          
          // If timer reaches zero, update the product status to 'ongoing'
          if (timerData.secondsLeft <= 0) {
            console.log('Timer expired for product:', timerData.productId);
            
            // Get the current status before updating
            const currentStatus = productStatuses[timerData.productId];
            console.log(`Current status before timer update for ${timerData.productId}: ${currentStatus}`);
            
            // Only update if the current status is 'active' - prevent conflicts with other updates
            if (currentStatus === 'active') {
              console.log(`Timer expired: Updating product ${timerData.productId} status from active to ongoing`);
              
              // Set this in its own state update to ensure it happens
              setTimeout(() => {
                setProductStatuses(prev => {
                  // Double-check it's still active before updating
                  if (prev[timerData.productId] !== 'active') {
                    console.log(`Status already changed from active, now: ${prev[timerData.productId]}, skipping update`);
                    return prev;
                  }
                  
                  console.log(`Timer update: Changing product status from active to ongoing for ${timerData.productId}`);
                  return {
                    ...prev,
                    [timerData.productId]: 'ongoing'
                  };
                });
              }, 100); // Slightly longer delay to ensure processing order
            } else {
              console.log(`Not updating status because current status is ${currentStatus || 'undefined'}, not 'active'`);
            }
          }
        }
      });
      
      return true;
    } catch (error) {
      console.error('Error subscribing to stream notifications:', error);
      return false;
    }
  };

  // Function to unsubscribe from a stream's notifications
  const unsubscribeFromStreamNotifications = (streamId) => {
    if (!socket || !streamId) {
      console.error('Cannot unsubscribe from stream notifications: socket not connected or invalid stream ID');
      return false;
    }

    try {
      console.log(`Unsubscribing from notifications for stream: ${streamId}`);
      socket.emit('stream_notification_unsubscribe', { streamId });
      
      // Remove all event listeners to prevent memory leaks
      socket.off('stream_notification');
      socket.off('viewer_joined_stream');
      socket.off('viewer_left_stream');
      socket.off('bid_timer_update');
      
      return true;
    } catch (error) {
      console.error('Error unsubscribing from stream notifications:', error);
      return false;
    }
  };

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

  // Function to send an announcement to the stream
  const sendStreamAnnouncement = (streamId, content) => {
    if (!socket || !streamId || !content.trim()) {
      console.error('Cannot send announcement: socket not connected or invalid data');
      return false;
    }

    try {
      socket.emit('stream_announcement', {
        streamId,
        content: content.trim()
      });
      return true;
    } catch (error) {
      console.error('Error sending stream announcement:', error);
      return false;
    }
  };
  
  // Function to manually update a product status
  const updateProductStatus = (productId, status) => {
    if (!productId || !status) return;
    
    // Special case: When setting a status to 'active', automatically end other active/ongoing items
    if (status === 'active') {
      console.log(`Setting ${productId} to active, will check for other active/ongoing products to end`);
      
      // First update this product to active
      setProductStatuses(prev => {
        // If status is the same, return the previous state unchanged
        if (prev[productId] === status) {
          return prev;
        }
        
        // Set this product to active
        console.log(`Updating product ${productId} status from ${prev[productId] || 'none'} to ${status}`);
        const updated = { ...prev, [productId]: status };
        
        // Now check for other active/ongoing products that need to be ended
        Object.entries(updated).forEach(([pid, currentStatus]) => {
          if (pid !== productId && (currentStatus === 'active' || currentStatus === 'ongoing')) {
            console.log(`Auto-ending product ${pid} with status ${currentStatus} when setting ${productId} to active`);
            updated[pid] = 'ended';
          }
        });
        
        return updated;
      });
      
      return; // Exit early - we've handled everything in one update
    }
    
    // Special case for 'ongoing' to 'ended' transitions - add a delay to keep the OngoingBidProductCard visible
    if (status === 'ended') {
      const currentStatus = productStatuses[productId];
      if (currentStatus === 'ongoing') {
        // Check if this is a very recent transition to 'ongoing' (within the last 30 seconds)
        // to ensure we show the OngoingBidProductCard for a minimum amount of time
        console.log(`Request to set ${productId} from 'ongoing' to 'ended', adding a delay for better UX`);
        
        // Delay the transition to 'ended' by 30 seconds
        setTimeout(() => {
          console.log(`Now setting ${productId} from 'ongoing' to 'ended' after delay`);
          setProductStatuses(prev => {
            // Only proceed if it's still 'ongoing'
            if (prev[productId] !== 'ongoing') {
              console.log(`Status already changed from ongoing, now: ${prev[productId]}, skipping update`);
              return prev;
            }
            
            return {
              ...prev,
              [productId]: 'ended'
            };
          });
        }, 30000); // 30-second delay
        
        return; // Exit early
      }
    }
    
    // For other status transitions, use the standard update
    setProductStatuses(prev => {
      // If status is the same, return the previous state unchanged
      if (prev[productId] === status) {
        return prev;
      }
      
      // If trying to set status to 'ongoing' but another product is already 'active', prevent it
      if (status === 'ongoing') {
        // Check if another product is active
        const isAnotherProductActive = Object.entries(prev).some(
          ([pid, pStatus]) => pid !== productId && pStatus === 'active'
        );
        
        if (isAnotherProductActive) {
          console.log(`Not setting ${productId} to 'ongoing' because another product is still 'active'`);
          return prev;
        }
      }
      
      // Only if status is different, update it
      console.log(`Updating product ${productId} status from ${prev[productId] || 'none'} to ${status}`);
      return {
        ...prev,
        [productId]: status
      };
    });
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
      return false;
    }
    
    try {
      // Unsubscribe from stream-specific notifications
      unsubscribeFromStreamNotifications(streamId);
      
      // Reset states
      setNotifications([]);
      setBidUpdates({});
      setBidTimers({});
      setProductStatuses({});
      
      console.log(`Cleaned up socket listeners for stream: ${streamId}`);
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
      sendStreamAnnouncement,
      updateProductStatus,
      resetBiddingStates,
      cleanupListeners,
      subscribeToStreamNotifications,
      unsubscribeFromStreamNotifications
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
      sendStreamAnnouncement: () => {
        console.warn('Cannot send announcement: socket not available');
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
      },
      subscribeToStreamNotifications: () => {
        console.warn('Cannot subscribe to stream notifications: socket not available');
        return false;
      },
      unsubscribeFromStreamNotifications: () => {
        console.warn('Cannot unsubscribe from stream notifications: socket not available');
        return false;
      }
    };
  }
  
  return context;
}; 