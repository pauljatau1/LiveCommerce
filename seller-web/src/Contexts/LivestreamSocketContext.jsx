import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { BASE_URL } from '../Constants/Server';
import { tokenUtils } from '@/util/auth';
import { useAuthContext } from '@/Hooks/useAuthContextV2';
import PropTypes from 'prop-types';

const LivestreamSocketContext = createContext();

// Reconnection algorithm constants
// These values define the aggressive reconnection strategy
const RECONNECT_INITIAL_DELAY = 1000; // Start with 1 second delay
const RECONNECT_MAX_DELAY = 30000; // Cap at 30 seconds maximum delay
const RECONNECT_BACKOFF_MULTIPLIER = 2; // Double the delay on each retry

export function LivestreamSocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [bidUpdates, setBidUpdates] = useState({});
  const [bidTimers, setBidTimers] = useState({});
  const [productStatuses, setProductStatuses] = useState({});
  // Boolean state to control visibility of connection notification UI
  // Set to true when connection errors occur, false when connection is successful
  const [showConnectionNotification, setShowConnectionNotification] = useState(false);
  const { isAuthenticated, token } = useAuthContext();
  // Reconnection state management using refs to avoid stale closures
  // These refs persist across renders and allow us to track reconnection state
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptRef = useRef(0);
  const isReconnectingRef = useRef(false);
  const isManualDisconnectRef = useRef(false);
  const currentSocketRef = useRef(null);
  // Track if socket was disconnected to detect reconnection scenarios
  // This helps us emit seller_rejoined_stream event when re-subscribing after a disconnect
  const wasDisconnectedRef = useRef(false);
  // Track the last subscribed streamId to detect re-subscription after reconnection
  const lastSubscribedStreamIdRef = useRef(null);
  // Ref to store the latest subscribeToStreamNotifications function
  // This allows us to call it from connection handlers without creating circular dependencies
  const subscribeToStreamNotificationsRef = useRef(null);
  // Track if we're currently in the process of subscribing to prevent duplicate attempts
  const isSubscribingRef = useRef(false);

  /**
   * Calculates the delay for the next reconnection attempt using exponential backoff
   * This ensures we don't overwhelm the server while still being aggressive about reconnecting
   * @returns {number} The delay in milliseconds before the next reconnection attempt
   */
  const calculateReconnectDelay = useCallback(() => {
    // Calculate exponential backoff: delay = initial * (multiplier ^ attempt)
    // Cap it at the maximum delay to prevent extremely long waits
    const calculatedDelay = Math.min(
      RECONNECT_INITIAL_DELAY * Math.pow(RECONNECT_BACKOFF_MULTIPLIER, reconnectAttemptRef.current),
      RECONNECT_MAX_DELAY
    );
    return calculatedDelay;
  }, []);

  /**
   * Aggressive reconnection function that retries indefinitely until successful connection
   * Uses exponential backoff to avoid overwhelming the server while maintaining persistence
   * This function will keep retrying even during total internet unavailability
   */
  const attemptReconnection = useCallback(() => {
    // Prevent multiple simultaneous reconnection attempts
    if (isReconnectingRef.current) {
      console.log('🔄 [RECONNECTION] Reconnection already in progress, skipping duplicate attempt');
      return;
    }

    // Don't reconnect if it was a manual disconnect (user-initiated)
    if (isManualDisconnectRef.current) {
      console.log('🔄 [RECONNECTION] Manual disconnect detected, not attempting reconnection');
      return;
    }

    // Check if we still have a token before attempting reconnection
    const currentToken = tokenUtils.getBearerToken();
    if (!currentToken) {
      console.log('🔄 [RECONNECTION] No token available, skipping reconnection attempt');
      return;
    }

    // Mark that we're attempting to reconnect
    isReconnectingRef.current = true;
    reconnectAttemptRef.current += 1;

    // Calculate delay for this attempt using exponential backoff
    const delay = calculateReconnectDelay();

    console.log(
      `🔄 [RECONNECTION] Attempting reconnection #${reconnectAttemptRef.current} in ${delay}ms`
    );

    // Clear any existing timeout to prevent duplicate reconnection attempts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    // Schedule the reconnection attempt
    reconnectTimeoutRef.current = setTimeout(() => {
      console.log(`🔄 [RECONNECTION] Executing reconnection attempt #${reconnectAttemptRef.current}`);

      // Reset the reconnecting flag to allow this attempt to proceed
      isReconnectingRef.current = false;

      // Clean up any existing socket instance before creating a new one
      // This prevents duplicate socket connections and memory leaks
      const existingSocket = currentSocketRef.current;
      if (existingSocket) {
        console.log('🧹 [RECONNECTION] Cleaning up existing socket before reconnection attempt');
        existingSocket.removeAllListeners();
        existingSocket.disconnect();
        currentSocketRef.current = null;
        setSocket(null);
      }

      // Attempt to create a new socket connection
      const newToken = tokenUtils.getBearerToken();
      if (newToken) {
        // Parse the BASE_URL to extract just the origin (protocol + hostname + port)
        let socketUrl;
        try {
          const baseUrlObj = new URL(BASE_URL);
          socketUrl = baseUrlObj.origin;
        } catch (parseError) {
          console.error('Invalid BASE_URL format:', BASE_URL, parseError);
          socketUrl = window.location.origin;
        }

        // Create a new socket instance
        const socketInstance = io(socketUrl, {
          transports: ["websocket"],
          auth: { token: newToken },
          // Disable socket.io's built-in reconnection since we're handling it manually
          reconnection: false,
          // Set a longer timeout for connection attempts
          //timeout: 20000
        });

        // Set up connection success handler
        socketInstance.once('connect', () => {
          console.log('✅ [RECONNECTION] Successfully reconnected to livestream socket');
          // Reset reconnection attempt counter on successful connection
          reconnectAttemptRef.current = 0;
          isReconnectingRef.current = false;
          // Hide connection notification on successful reconnection
          setShowConnectionNotification(false);
          // Note: wasDisconnectedRef remains true until we re-subscribe
          // This allows us to detect reconnection scenario in subscribeToStreamNotifications
          // Update the socket state
          setSocket(socketInstance);
          currentSocketRef.current = socketInstance;
          
          // After successful reconnection, check if we need to re-subscribe to stream notifications
          // This ensures all socket listeners are restored after reconnection
          try {
            const storedStreamId = localStorage.getItem('livestream_subscribed_streamId');
            if (storedStreamId && subscribeToStreamNotificationsRef.current) {
              console.log('🔄 [RECONNECTION] Re-subscribing to stream notifications after reconnection:', storedStreamId);
              // Use a longer delay to ensure socket is fully authenticated and ready
              // Socket.IO authentication happens after the 'connect' event, so we need to wait
              setTimeout(() => {
                // Double-check that we have a valid socket reference before subscribing
                if (currentSocketRef.current && currentSocketRef.current.connected) {
                  console.log('🔄 [RECONNECTION] Socket is ready, proceeding with subscription:', {
                    socketId: currentSocketRef.current.id,
                    connected: currentSocketRef.current.connected
                  });
                  subscribeToStreamNotificationsRef.current(storedStreamId);
                } else {
                  console.warn('⚠️ [RECONNECTION] Socket not ready yet, retrying subscription in 500ms');
                  // Retry after another delay if socket isn't ready
                  setTimeout(() => {
                    if (currentSocketRef.current && currentSocketRef.current.connected) {
                      subscribeToStreamNotificationsRef.current(storedStreamId);
                    } else {
                      console.error('❌ [RECONNECTION] Socket still not ready after retry, subscription failed');
                    }
                  }, 500);
                }
              }, 300); // Increased delay to 300ms to allow authentication to complete
            }
          } catch (error) {
            console.warn('Failed to re-subscribe after reconnection:', error);
          }
        });

        // Set up connection error handler - will trigger another reconnection attempt
        socketInstance.once('connect_error', (error) => {
          console.error(`❌ [RECONNECTION] Reconnection attempt #${reconnectAttemptRef.current} failed:`, error);
          // Show connection notification when reconnection fails
          setShowConnectionNotification(true);
          // Clean up the failed socket instance
          socketInstance.removeAllListeners();
          socketInstance.disconnect();
          // Reset the reconnecting flag to allow another attempt
          isReconnectingRef.current = false;
          // Schedule the next reconnection attempt
          attemptReconnection();
        });

        // Set up disconnect handler for the new socket
        socketInstance.once('disconnect', (reason) => {
          console.log(`🔌 [RECONNECTION] Socket disconnected during reconnection: ${reason}`);
          // Only attempt reconnection if it wasn't a manual disconnect
          if (!isManualDisconnectRef.current) {
            isReconnectingRef.current = false;
            attemptReconnection();
          }
        });

        // Store the socket instance reference
        currentSocketRef.current = socketInstance;
      } else {
        // No token available, reset flag and don't retry
        console.log('🔄 [RECONNECTION] No token available, stopping reconnection attempts');
        isReconnectingRef.current = false;
      }
    }, delay);
  }, [calculateReconnectDelay]);

  /**
   * Creates and sets up a new socket connection with aggressive reconnection handling
   * This function initializes the socket and sets up all necessary event listeners
   * for handling disconnections and connection errors
   */
  const connectSocket = useCallback(() => {
    try {
      // Reset manual disconnect flag when initiating a new connection
      isManualDisconnectRef.current = false;

      // Clean up any existing socket instance before creating a new one
      // This prevents duplicate socket connections and ensures a clean state
      const existingSocket = currentSocketRef.current;
      if (existingSocket) {
        console.log('🧹 [SOCKET] Cleaning up existing socket before creating new connection');
        existingSocket.removeAllListeners();
        existingSocket.disconnect();
        currentSocketRef.current = null;
      }

      // Parse the BASE_URL to extract just the origin (protocol + hostname + port)
      let socketUrl;
      try {
        // Create a URL object to properly parse the URL components
        const baseUrlObj = new URL(BASE_URL);
        // Use only the origin part (protocol + hostname + port)
        socketUrl = baseUrlObj.origin;
        console.log('🔌 [SOCKET] Connecting to socket server at:', socketUrl);
      } catch (parseError) {
        console.error('Invalid BASE_URL format:', BASE_URL, parseError);
        // Fallback to a default if URL parsing fails
        socketUrl = window.location.origin;
        console.log('Falling back to origin:', socketUrl);
      }

      // Create a socket connection specifically for livestream
      // Disable socket.io's built-in reconnection since we're implementing our own aggressive algorithm
      const socketInstance = io(socketUrl, {
        transports: ["websocket"],
        auth: {
          token
        },
        // Disable built-in reconnection to use our custom aggressive reconnection logic
        reconnection: false,
        // Set a longer timeout for connection attempts to handle slow networks
        //timeout: 20000
      });

      // Store reference to current socket for cleanup
      currentSocketRef.current = socketInstance;

      // Handle successful connection
      socketInstance.on('connect', () => {
        console.log('✅ [SOCKET] Livestream socket connected successfully');
        // Reset reconnection attempt counter on successful connection
        reconnectAttemptRef.current = 0;
        isReconnectingRef.current = false;
        // Hide connection notification on successful connection
        setShowConnectionNotification(false);
        // Note: wasDisconnectedRef is only reset when we successfully re-subscribe
        // This allows us to detect reconnection scenario in subscribeToStreamNotifications
        
        // After successful connection, check if we need to re-subscribe to stream notifications
        // This handles cases where the socket was disconnected and reconnected
        try {
          const storedStreamId = localStorage.getItem('livestream_subscribed_streamId');
          if (storedStreamId && subscribeToStreamNotificationsRef.current) {
            console.log('🔄 [SOCKET] Re-subscribing to stream notifications after connection:', storedStreamId);
            // Use a longer delay to ensure socket is fully authenticated and ready
            // Socket.IO authentication happens after the 'connect' event, so we need to wait
            setTimeout(() => {
              // Double-check that we have a valid socket reference before subscribing
              if (currentSocketRef.current && currentSocketRef.current.connected) {
                console.log('🔄 [SOCKET] Socket is ready, proceeding with subscription:', {
                  socketId: currentSocketRef.current.id,
                  connected: currentSocketRef.current.connected
                });
                subscribeToStreamNotificationsRef.current(storedStreamId);
              } else {
                console.warn('⚠️ [SOCKET] Socket not ready yet, retrying subscription in 500ms');
                // Retry after another delay if socket isn't ready
                setTimeout(() => {
                  if (currentSocketRef.current && currentSocketRef.current.connected) {
                    subscribeToStreamNotificationsRef.current(storedStreamId);
                  } else {
                    console.error('❌ [SOCKET] Socket still not ready after retry, subscription failed');
                  }
                }, 500);
              }
            }, 300); // Increased delay to 300ms to allow authentication to complete
          }
        } catch (error) {
          console.warn('Failed to re-subscribe after connection:', error);
        }
        // Basic events setup (will add stream-specific events on subscription)
      });

      // Handle connection errors - trigger aggressive reconnection
      socketInstance.on('connect_error', (error) => {
        console.error('❌ [SOCKET] Livestream socket connection error:', error);
        // Show connection notification when connection error occurs
        setShowConnectionNotification(true);
        // Add more detailed error logging for debugging
        if (error.description) {
          console.error('Error description:', error.description);
        }
        if (error.data) {
          console.error('Error data:', error.data);
        }

        // Only attempt reconnection if it wasn't a manual disconnect
        if (!isManualDisconnectRef.current) {
          console.log('🔄 [SOCKET] Connection error detected, initiating aggressive reconnection...');
          attemptReconnection();
        }
      });

      // Handle disconnection events - trigger aggressive reconnection
      socketInstance.on('disconnect', (reason) => {
        console.log(`🔌 [SOCKET] Livestream socket disconnected. Reason: ${reason}`);

        // Only attempt reconnection if it wasn't a manual disconnect
        // Socket.io disconnect reasons: 'io server disconnect', 'io client disconnect', 'ping timeout', 'transport close', 'transport error'
        if (!isManualDisconnectRef.current) {
          console.log('🔄 [SOCKET] Disconnection detected, initiating aggressive reconnection...');
          // Mark that we had a disconnect to detect reconnection scenario later
          wasDisconnectedRef.current = true;
          attemptReconnection();
        } else {
          console.log('🔄 [SOCKET] Manual disconnect detected, skipping reconnection');
          // Reset disconnect flag on manual disconnect
          wasDisconnectedRef.current = false;
          lastSubscribedStreamIdRef.current = null;
        }
      });

      // Set the socket in state
      setSocket(socketInstance);

      // Return cleanup function
      return () => {
        console.log('🧹 [SOCKET] Cleaning up socket connection');
        if (socketInstance) {
          socketInstance.off('stream_notification');
          socketInstance.off('viewer_joined_stream');
          socketInstance.off('viewer_left_stream');
          socketInstance.off('bid_timer_update');
          socketInstance.disconnect();
        }
      };
    } catch (error) {
      console.error('❌ [SOCKET] Error creating socket connection:', error);
      // Even if socket creation fails, attempt reconnection
      if (!isManualDisconnectRef.current) {
        attemptReconnection();
      }
    }
  }, [token, attemptReconnection]);

  useEffect(() => {
    if (!token || !isAuthenticated) return;

    // Reset reconnection state when connecting with a new token
    reconnectAttemptRef.current = 0;
    isReconnectingRef.current = false;
    isManualDisconnectRef.current = false;

    connectSocket();

    // Cleanup function to clear any pending reconnection attempts
    return () => {
      console.log('🧹 [EFFECT] Cleaning up socket connection and reconnection timers');
      // Clear any pending reconnection timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      // Mark as manual disconnect to prevent reconnection attempts during cleanup
      isManualDisconnectRef.current = true;
      // Reset reconnection state
      isReconnectingRef.current = false;
    };
  }, [connectSocket, token, isAuthenticated]);

  /**
   * Manually disconnects the socket and prevents automatic reconnection
   * This is used when the user explicitly wants to disconnect (e.g., logout)
   * Sets the manual disconnect flag to prevent the aggressive reconnection algorithm from retrying
   */
  const disconnectSocket = useCallback(() => {
    if (socket || currentSocketRef.current) {
      console.log('🔌 [LIVESTREAM SOCKET] Manual disconnect requested, disconnecting livestream socket...');

      // Mark as manual disconnect to prevent automatic reconnection
      isManualDisconnectRef.current = true;

      // Clear any pending reconnection attempts
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      // Reset reconnection state
      isReconnectingRef.current = false;
      reconnectAttemptRef.current = 0;

      // Get the socket instance (could be from state or ref)
      const socketInstance = socket || currentSocketRef.current;

      if (socketInstance) {
        // Clean up all event listeners to prevent memory leaks
        socketInstance.off('stream_notification');
        socketInstance.off('viewer_joined_stream');
        socketInstance.off('viewer_left_stream');
        socketInstance.off('bid_timer_update');
        socketInstance.off('connect');
        socketInstance.off('connect_error');
        socketInstance.off('disconnect');

        // Disconnect the socket
        socketInstance.disconnect();
      }

      // Reset all states
      setNotifications([]);
      setBidUpdates({});
      setBidTimers({});
      setProductStatuses({});
      // Hide connection notification on manual disconnect
      setShowConnectionNotification(false);

      // Reset reconnection tracking refs on manual disconnect
      wasDisconnectedRef.current = false;
      lastSubscribedStreamIdRef.current = null;
      
      // Remove stored streamId from localStorage on manual disconnect
      // This prevents automatic re-subscription after reconnection if user has manually disconnected
      try {
        localStorage.removeItem('livestream_subscribed_streamId');
        console.log('💾 [DISCONNECT] Removed streamId from localStorage on manual disconnect');
      } catch (error) {
        console.warn('Failed to remove streamId from localStorage on disconnect:', error);
      }

      // Clear socket references
      setSocket(null);
      currentSocketRef.current = null;

      console.log('🔌 [LIVESTREAM SOCKET] Livestream socket disconnected and states cleared');
    }
  }, [socket]);


  // Function to subscribe to a specific stream's notifications
  // Wrapped in useCallback to ensure stable reference for reconnection handlers
  const subscribeToStreamNotifications = useCallback((streamId) => {
    // Always use currentSocketRef as primary source since it's always up to date
    // This ensures we always use the most recent socket instance, especially after reconnection
    // The state 'socket' might be stale during reconnection, so we prioritize the ref
    const currentSocket = currentSocketRef.current || socket;
    
    // Log socket state for debugging
    console.log('🔍 [SUBSCRIPTION] subscribeToStreamNotifications called:', {
      streamId,
      hasRefSocket: !!currentSocketRef.current,
      hasStateSocket: !!socket,
      refSocketId: currentSocketRef.current?.id,
      stateSocketId: socket?.id,
      refConnected: currentSocketRef.current?.connected,
      stateConnected: socket?.connected
    });

    if (!currentSocket || !streamId) {
      console.error('Cannot subscribe to stream notifications: socket not connected or invalid stream ID', {
        socketFromState: socket,
        socketFromRef: currentSocketRef.current,
        streamId
      });
      // Reset subscription flag on invalid input
      isSubscribingRef.current = false;
      return false;
    }

    // Check if socket is actually connected before subscribing
    // If not connected, wait for connection event before subscribing
    if (!currentSocket.connected) {
      console.warn('Socket is not connected yet, waiting for connection before subscribing to stream:', streamId);
      // Wait for connection and then subscribe
      // Note: We keep isSubscribingRef.current = true to prevent duplicate attempts while waiting
      const connectHandler = () => {
        console.log('Socket connected, now subscribing to notifications for stream:', streamId);
        // Remove this one-time listener to prevent memory leaks
        currentSocket.off('connect', connectHandler);
        // Recursively call to subscribe now that we're connected
        // The flag will be reset after the emit attempt
        subscribeToStreamNotifications(streamId);
      };
      currentSocket.once('connect', connectHandler);
      return true; // Return true to indicate subscription is in progress
    }

    try {
      // Prevent duplicate subscription attempts
      if (isSubscribingRef.current) {
        console.warn('⚠️ [SUBSCRIPTION] Subscription already in progress, skipping duplicate attempt for stream:', streamId);
        return true; // Return true to indicate subscription is in progress
      }
      
      // Mark that we're subscribing
      isSubscribingRef.current = true;
      
      console.log(`Subscribing to notifications for stream: ${streamId}`);

      // Check if this is a re-subscription after a disconnect/reconnection
      // If we were disconnected and we're re-subscribing to the same stream, emit seller_rejoined_stream
      const isReconnectionScenario = wasDisconnectedRef.current &&
        lastSubscribedStreamIdRef.current === streamId;

      if (isReconnectionScenario) {
        console.log('🔄 [REJOIN] Detected reconnection scenario, emitting seller_rejoined_stream event');

        // Get seller information from localStorage (similar to how LivestreamStudio does it)
        let seller = null;
        try {
          const sellerData = localStorage.getItem('seller');
          seller = sellerData ? JSON.parse(sellerData) : null;
        } catch (error) {
          console.warn('Failed to parse seller data from localStorage:', error);
        }

        // Construct notification object matching backend structure
        const notificationObj = {
          id: Date.now().toString(),
          type: 'join',
          user: seller?.storeName || seller?.businessName || 'Host',
          avatar: seller?.storeAvatar?.url || seller?.businessAvatar?.url || '',
          content: 'Host rejoined room',
          data: {
            message: 'Host rejoined room',
            sellerId: seller?.id?.toString() || seller?._id?.toString() || '',
            streamId: streamId.toString(),
            sellerName: seller?.storeName || seller?.businessName || 'Host'
          },
          timestamp: new Date()
        };

        // Emit seller_rejoined_stream event to notify all viewers
        currentSocket.emit('seller_rejoined_stream', notificationObj);
        console.log('✅ [REJOIN] Emitted seller_rejoined_stream event:', notificationObj);

        // Reset the disconnect flag after emitting the event
        wasDisconnectedRef.current = false;
      }

      // Update the last subscribed stream ID
      lastSubscribedStreamIdRef.current = streamId;
      
      // Store streamId in localStorage so we can re-subscribe after reconnection
      // This ensures all socket listeners are restored automatically after a disconnect/reconnect
      try {
        localStorage.setItem('livestream_subscribed_streamId', streamId);
        console.log('💾 [SUBSCRIPTION] Stored streamId in localStorage for reconnection recovery:', streamId);
      } catch (error) {
        console.warn('Failed to store streamId in localStorage:', error);
      }

      // Remove any existing event listeners before adding new ones
      // This prevents duplicate listeners on re-subscription
      currentSocket.off('stream_notification');
      currentSocket.off('viewer_joined_stream');
      currentSocket.off('viewer_left_stream');
      currentSocket.off('bid_timer_update');
      console.log('🧹 [SUBSCRIPTION] Cleaned up old event listeners before re-subscribing');

      // Set up event listeners for this stream
      // Listen for stream notifications
      currentSocket.on('stream_notification', (notification) => {
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
      currentSocket.on('viewer_joined_stream', (notification) => {
        console.log('Viewer joined stream:', notification);
        setNotifications(prev => [...prev, notification]);
      });

      // Listen for viewer leave event
      currentSocket.on('viewer_left_stream', (notification) => {
        console.log('Viewer left stream:', notification);
        setNotifications(prev => [...prev, notification]);
      });

      // Listen for bid timer updates
      currentSocket.on('bid_timer_update', (timerData) => {
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

      // Emit subscription request AFTER setting up listeners
      // Ensure socket is connected and ready before emitting
      if (currentSocket.connected && currentSocket.id) {
        console.log('📤 [SUBSCRIPTION] Emitting stream_notification_subscribe event:', { streamId, socketId: currentSocket.id });
        currentSocket.emit('stream_notification_subscribe', { streamId });
        console.log('✅ [SUBSCRIPTION] Subscription emit completed for stream:', streamId);
        // Reset subscription flag after successful emit
        isSubscribingRef.current = false;
      } else {
        console.warn('⚠️ [SUBSCRIPTION] Socket not ready for subscription emit:', {
          connected: currentSocket.connected,
          socketId: currentSocket.id,
          streamId
        });
        // If socket is not ready, wait a bit and try again
        setTimeout(() => {
          if (currentSocketRef.current && currentSocketRef.current.connected && currentSocketRef.current.id) {
            console.log('📤 [SUBSCRIPTION] Retrying subscription emit after delay:', { streamId, socketId: currentSocketRef.current.id });
            currentSocketRef.current.emit('stream_notification_subscribe', { streamId });
            console.log('✅ [SUBSCRIPTION] Retry subscription emit completed for stream:', streamId);
            // Reset subscription flag after successful retry emit
            isSubscribingRef.current = false;
          } else {
            console.error('❌ [SUBSCRIPTION] Socket still not ready after delay, subscription failed for stream:', streamId);
            // Reset subscription flag on failure
            isSubscribingRef.current = false;
          }
        }, 500);
      }

      return true;
    } catch (error) {
      console.error('Error subscribing to stream notifications:', error);
      // Reset subscription flag on error
      isSubscribingRef.current = false;
      return false;
    }
  }, [socket, productStatuses]);

  // Keep the ref updated with the latest subscribeToStreamNotifications function
  // This allows connection handlers to call it without creating circular dependencies
  useEffect(() => {
    subscribeToStreamNotificationsRef.current = subscribeToStreamNotifications;
  }, [subscribeToStreamNotifications]);

  // Function to unsubscribe from a stream's notifications
  const unsubscribeFromStreamNotifications = (streamId) => {
    // Use currentSocketRef as primary source since it's always up to date
    const currentSocket = currentSocketRef.current || socket;

    if (!currentSocket || !streamId) {
      console.error('Cannot unsubscribe from stream notifications: socket not connected or invalid stream ID', {
        socketFromState: socket,
        socketFromRef: currentSocketRef.current,
        streamId
      });
      return false;
    }

    try {
      console.log(`Unsubscribing from notifications for stream: ${streamId}`);
      currentSocket.emit('stream_notification_unsubscribe', { streamId });

      // Remove all event listeners to prevent memory leaks
      currentSocket.off('stream_notification');
      currentSocket.off('viewer_joined_stream');
      currentSocket.off('viewer_left_stream');
      currentSocket.off('bid_timer_update');

      // Reset subscription tracking when unsubscribing
      // This ensures we don't emit seller_rejoined_stream on next subscription unless it's after a disconnect
      if (lastSubscribedStreamIdRef.current === streamId) {
        lastSubscribedStreamIdRef.current = null;
      }
      
      // Remove stored streamId from localStorage when unsubscribing
      // This prevents automatic re-subscription after reconnection if user has explicitly unsubscribed
      try {
        const storedStreamId = localStorage.getItem('livestream_subscribed_streamId');
        if (storedStreamId === streamId) {
          localStorage.removeItem('livestream_subscribed_streamId');
          console.log('💾 [UNSUBSCRIPTION] Removed streamId from localStorage:', streamId);
        }
      } catch (error) {
        console.warn('Failed to remove streamId from localStorage:', error);
      }

      return true;
    } catch (error) {
      console.error('Error unsubscribing from stream notifications:', error);
      return false;
    }
  };

  // Function to send a comment to the stream
  const sendStreamComment = (streamId, content) => {
    // Use currentSocketRef as primary source since it's always up to date
    const currentSocket = currentSocketRef.current || socket;

    if (!currentSocket || !streamId || !content.trim()) {
      console.error('Cannot send comment: socket not connected or invalid data', {
        socketFromState: socket,
        socketFromRef: currentSocketRef.current,
        streamId,
        content
      });
      return false;
    }

    try {
      currentSocket.emit('stream_comment', {
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
    // Use currentSocketRef as primary source since it's always up to date
    const currentSocket = currentSocketRef.current || socket;

    if (!currentSocket || !streamId || !content.trim()) {
      console.error('Cannot send announcement: socket not connected or invalid data', {
        socketFromState: socket,
        socketFromRef: currentSocketRef.current,
        streamId,
        content
      });
      return false;
    }

    try {
      currentSocket.emit('stream_announcement', {
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
      showConnectionNotification,
      sendStreamComment,
      sendStreamAnnouncement,
      updateProductStatus,
      resetBiddingStates,
      cleanupListeners,
      subscribeToStreamNotifications,
      unsubscribeFromStreamNotifications,
      disconnectSocket,
      connectSocket
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
      showConnectionNotification: false,
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
      },
      disconnectSocket: () => {
        console.warn('Cannot disconnect socket: socket not available');
        return false;
      },
      connectSocket: () => {
        console.warn('Cannot connect socket: socket not available');
        return false;
      }
    };
  }

  return context;
}; 