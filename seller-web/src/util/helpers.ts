// Extend Window interface to include Intercom
declare global {
  interface Window {
    Intercom?: (command: string, ...args: any[]) => void;
  }
}

// helper function to get a users ip address

export const getClientIP = async () => {
  try {
    const response = await fetch("https://ipapi.co/json/");
    const data = await response.json();
    return data.ip || "unknown";
  } catch (error) {
    console.error("IP fetch error:", error);
    return "unknown";
  }
};

// helper function to get a users device type

export const getDeviceType = () => {
  const userAgent = navigator.userAgent;
  if (/android/i.test(userAgent)) return "Android";
  if (/iPad|iPhone|iPod/.test(userAgent)) return "iOS";
  return "Desktop";
};

/**
 * Checks if there is an active internet connection
 * Uses navigator.onLine and attempts a lightweight fetch to verify connectivity
 * @returns {Promise<boolean>} True if internet connection is available, false otherwise
 */
export const checkInternetConnection = async (): Promise<boolean> => {
  if (!navigator.onLine) return false;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const response = await fetch("https://www.msftconnecttest.com/connecttest.txt", {
      method: "GET",
      cache: "no-cache",
      signal: controller.signal,
    });

    clearTimeout(timeout);

    return response.ok;
  } catch (err) {
    return false;
  }
};


/**
 * Measures actual internet download speed by downloading test data
 * Similar to fast.com - downloads actual files and calculates real speed in Mbps
 * @returns {Promise<string>} Network speed as a formatted string (e.g., "2.5 mbps", "15.3 mbps")
 */
export const getNetworkSpeed = async (): Promise<string> => {
  try {
    // Use a reliable CDN endpoint that provides test files of known size
    // Using a small test file (100KB) to measure download speed accurately
    // This is similar to how fast.com measures speed
    const testFileSizeBytes = 100 * 1024; // 100KB in bytes
    const testUrl = `https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png?cache=${Date.now()}`;

    // Alternative test URLs if the primary one fails
    const fallbackUrls = [
      `https://via.placeholder.com/1000x1000.png?cache=${Date.now()}`,
      `https://httpbin.org/bytes/${testFileSizeBytes}?cache=${Date.now()}`,
    ];

    let downloadSpeedMbps = 0;
    let successfulMeasurement = false;

    // Try primary URL first
    try {
      const startTime = performance.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await fetch(testUrl, {
        method: "GET",
        signal: controller.signal,
        cache: "no-cache",
        // Add headers to prevent caching
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Download the actual data to measure real speed
      // We'll use the blob size which is the actual downloaded bytes
      const blob = await response.blob();
      const endTime = performance.now();

      // Calculate actual downloaded size (blob size is more accurate than header)
      const downloadedBytes = blob.size;
      const durationSeconds = (endTime - startTime) / 1000; // Convert to seconds

      if (durationSeconds > 0 && downloadedBytes > 0) {
        // Calculate speed: (bytes * 8 bits/byte) / (seconds * 1,000,000 bits/Mbps)
        // Formula: (bytes * 8) / (seconds * 1,000,000) = Mbps
        downloadSpeedMbps = (downloadedBytes * 8) / (durationSeconds * 1000000);
        successfulMeasurement = true;
      }
    } catch (primaryError) {
      console.warn(
        "Primary speed test failed, trying fallback URLs:",
        primaryError
      );

      // Try fallback URLs if primary fails
      for (const fallbackUrl of fallbackUrls) {
        try {
          const startTime = performance.now();
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000);

          const response = await fetch(fallbackUrl, {
            method: "GET",
            signal: controller.signal,
            cache: "no-cache",
            headers: {
              "Cache-Control": "no-cache, no-store, must-revalidate",
              Pragma: "no-cache",
            },
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            continue; // Try next fallback URL
          }

          const blob = await response.blob();
          const endTime = performance.now();
          const downloadedBytes = blob.size;
          const durationSeconds = (endTime - startTime) / 1000;

          if (durationSeconds > 0 && downloadedBytes > 0) {
            downloadSpeedMbps =
              (downloadedBytes * 8) / (durationSeconds * 1000000);
            successfulMeasurement = true;
            break; // Success, exit loop
          }
        } catch (fallbackError) {
          console.warn("Fallback speed test failed:", fallbackError);
          continue; // Try next fallback URL
        }
      }
    }

    // If we successfully measured speed, format and return it
    if (successfulMeasurement && downloadSpeedMbps > 0) {
      // Round to 1 decimal place for display
      const roundedSpeed = Math.round(downloadSpeedMbps * 10) / 10;
      return `${roundedSpeed} mbps`;
    }

    // If measurement failed, try using Network Information API as fallback
    const connection =
      (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection;

    if (
      connection &&
      connection.downlink !== undefined &&
      connection.downlink !== null
    ) {
      // Use downlink from Network Information API as fallback
      const speed = Math.round(connection.downlink * 10) / 10;
      return `${speed} mbps`;
    }

    // If all methods fail, return unknown
    console.warn("All network speed measurement methods failed");
    return "unknown";
  } catch (error) {
    console.error("Network speed measurement error:", error);
    return "unknown";
  }
};

export const getInitials = (firstName: string | undefined, lastName: string | undefined) => {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
};

export const formatTimestamp = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = Math.abs(now.getTime() - date.getTime());
  const diffInMinutes = Math.floor(diffInMs / 60000);

  if (diffInMinutes < 1) {
      return "Just now";
  } else if (diffInMinutes < 60) {
      return `${diffInMinutes} mins ago`;
  } else {
      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) {
          return `${diffInHours} hours ago`;
      } else {
          const diffInDays = Math.floor(diffInHours / 24);
          if (diffInDays === 1) {
              return "Yesterday";
          } else if (diffInDays < 7) {
              return `${diffInDays} days ago`;
          } else {
              return date.toLocaleDateString();
          }
      }
  }
};

/**
 * Calculate total unread messages from conversations array
 * 
 * @param conversations - Array of conversation objects with unreadCount property
 * @returns Total number of unread messages
 */
export const calculateUnreadMessages = (conversations: Array<{ unreadCount?: number }> | undefined): number => {
  try {
    if (!conversations || conversations.length === 0) {
      return 0;
    }
    const totalUnread = conversations.reduce((total, conv) =>
      total + (conv.unreadCount || 0), 0);
    return totalUnread;
  } catch (error) {
    console.error('Error calculating unread messages:', error);
    return 0;
  }
};

/**
 * Calculate new notifications count (today's unread notifications)
 * 
 * @param notifications - Array of notification objects with isRead and createdAt properties
 * @returns Count of unread notifications from today
 */
export const calculateNewNotifications = (notifications: Array<{ isRead?: boolean; createdAt: string }> | undefined): number => {
  try {
    if (!notifications || notifications.length === 0) {
      return 0;
    }

    const today = new Date().setHours(0, 0, 0, 0);
    const newNotificationsCount = notifications.filter(notification =>
      !notification.isRead &&
      new Date(notification.createdAt).setHours(0, 0, 0, 0) === today
    ).length;

    return newNotificationsCount;
  } catch (error) {
    console.error('Error calculating new notifications:', error);
    return 0;
  }
};

/**
 * Extract YouTube video ID from URL
 * 
 * @param url - YouTube video URL
 * @returns Video ID or null if invalid
 */
export const getYoutubeVideoId = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

/**
 * Create thumbnail URL from YouTube video ID
 * 
 * @param videoId - YouTube video ID
 * @returns Thumbnail URL
 */
export const getYoutubeThumbnail = (videoId: string): string => {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
};

/**
 * Format metric value with K, M, B suffixes
 * 
 * @param value - Numeric value to format
 * @returns Formatted string (e.g., "1.5K", "2.3M", "1.0B")
 */
export const formatMetricValue = (value: number | undefined | null): string => {
  if (!value && value !== 0) return "0";
  if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}B`;
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toString();
};

/**
 * Format change value from last week based on type
 * 
 * @param value - Change value (number)
 * @param type - Type of change ("number" or "percentage")
 * @returns Formatted change string (e.g., "+₦1.5K" or "+5.2%")
 */
export const formatChangeFromLastWeek = (value: number | undefined | null, type: string | undefined): string => {
  if (value === undefined || value === null || !type) return "";
  
  if (type === "number") {
    return `+₦${formatMetricValue(value)}`;
  } else if (type === "percentage") {
    return `${value >= 0 ? "+" : "-"}${Math.abs(value).toFixed(2)}%`;
  } else {
    return "";
  }
};

/**
 * Get notification icon based on type
 * 
 * @param type - Notification type
 * @returns Iconify icon name or null for profile picture
 */
export const getNotificationIcon = (type: string): string | null => {
  switch (type) {
    case 'buyer_message':
      // For buyer messages, return null to show profile picture instead
      return null;
    case 'blip_comment':
    case 'buyer_reply_to_comment':
    case 'seller_reply_to_comment':
      return 'mdi:comment-text-outline';
    case 'blip_like':
      return 'mdi:heart-outline';
    case 'order_delivered':
    case 'order_status_update':
    case 'pickup_arranged':
      return 'mdi:package-variant';
    case 'order_cancelled_admin':
      return 'mdi:cancel';
    case 'new_follower':
      return 'mdi:account-plus-outline';
    case 'product_restocked':
    case 'stock_update':
      return 'mdi:package-up';
    case 'platform_maintenance':
    case 'system_notification':
      return 'mdi:cog-outline';
    default:
      return 'mdi:bell-outline';
  }
};

/**
 * Get notification display data based on notification type
 * 
 * @param notification - Notification object
 * @returns Display data object with formatted text and metadata
 */
export const getNotificationDisplayData = (notification: { 
  type: string; 
  data: any; 
  title: string; 
  message: string; 
  createdAt: string;
}) => {
  const { type, data, title, message } = notification;
  
  let mainText = title;
  let subText = '';
  let rightText = '';
  let rightSubText = '';
  let showProfilePicture = false;
  let profilePictureUrl: string | null = null;

  switch (type) {
    case 'buyer_message':
      mainText = 'Buyer messaged you';
      subText = data?.messagePreview || message || '';
      rightText = data?.buyerName || 'Buyer';
      rightSubText = formatTimestamp(notification.createdAt);
      showProfilePicture = true;
      // Profile picture would come from buyer data if available
      break;

    case 'blip_comment':
    case 'buyer_reply_to_comment':
    case 'seller_reply_to_comment':
      mainText = type === 'buyer_reply_to_comment' || type === 'seller_reply_to_comment' 
        ? `${data?.replierName || 'Someone'} replied to your comment`
        : `${data?.buyerName || 'Someone'} commented on your product blip`;
      subText = data?.comment || data?.reply || message || '';
      rightText = data?.buyerName || data?.replierName || 'User';
      rightSubText = formatTimestamp(notification.createdAt);
      break;

    case 'blip_like':
      mainText = `${data?.buyerName || 'Someone'} liked your product blip`;
      subText = data?.productName || '';
      rightText = data?.buyerName || 'User';
      rightSubText = formatTimestamp(notification.createdAt);
      break;

    case 'order_delivered':
      mainText = 'Order Delivered';
      subText = `Order #${data?.order_id || data?.orderId || ''}`;
      rightText = data?.order_id || '';
      rightSubText = formatTimestamp(notification.createdAt);
      break;

    case 'order_status_update':
      mainText = 'Order Status Updated';
      subText = `Order #${data?.order_id || data?.orderId || ''} - ${data?.status || ''}`;
      rightText = data?.order_id || '';
      rightSubText = formatTimestamp(notification.createdAt);
      break;

    case 'pickup_arranged':
      mainText = 'Pickup Arranged';
      subText = `Order #${data?.order_id || ''}`;
      rightText = data?.carrier || '';
      rightSubText = formatTimestamp(notification.createdAt);
      break;

    case 'order_cancelled_admin':
      mainText = 'Order Cancelled';
      subText = `Order #${data?.order_id || data?.orderId || ''}`;
      rightText = data?.order_id || '';
      rightSubText = formatTimestamp(notification.createdAt);
      break;

    case 'new_follower':
      mainText = 'New Follower';
      subText = `${data?.buyerName || 'Someone'} started following you`;
      rightText = data?.buyerName || 'User';
      rightSubText = formatTimestamp(notification.createdAt);
      break;

    case 'product_restocked':
    case 'stock_update':
      mainText = `You restocked "${data?.productName || 'Product'}"`;
      subText = data?.category ? `Category: ${data.category}` : '';
      rightText = data?.quantity ? `+${data.quantity}` : '';
      rightSubText = formatTimestamp(notification.createdAt);
      break;

    case 'platform_maintenance':
    case 'system_notification':
      mainText = title || 'Platform Notification';
      subText = message || '';
      rightText = 'AUQLI';
      rightSubText = formatTimestamp(notification.createdAt);
      break;

    default:
      mainText = title || 'Notification';
      subText = message || '';
      rightText = '';
      rightSubText = formatTimestamp(notification.createdAt);
  }

  return {
    mainText,
    subText,
    rightText,
    rightSubText,
    showProfilePicture,
    profilePictureUrl,
  };
};

/**
 * Extract error message from AxiosError
 * 
 * Handles various error structures and extracts the most relevant error message.
 * Checks response.data.errors array first (returns first error's message), then
 * falls back to response.data.message, then other error properties.
 * 
 * @param error - The error object (can be AxiosError, Error, or unknown)
 * @returns The extracted error message or a default message
 */
export function extractAxiosErrorMessage(error: unknown): string {
  // Handle AxiosError with response data
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    error.response &&
    typeof error.response === "object" &&
    "data" in error.response &&
    error.response.data &&
    typeof error.response.data === "object"
  ) {
    // First, check for errors array and return first error's message if it exists
    if (
      "errors" in error.response.data &&
      Array.isArray(error.response.data.errors) &&
      error.response.data.errors.length > 0 &&
      typeof error.response.data.errors[0] === "object" &&
      error.response.data.errors[0] !== null &&
      "message" in error.response.data.errors[0] &&
      typeof error.response.data.errors[0].message === "string"
    ) {
      return error.response.data.errors[0].message;
    }

    // Fall back to response.data.message if errors array doesn't have a message
    if (
      "message" in error.response.data &&
      typeof error.response.data.message === "string"
    ) {
      return error.response.data.message;
    }
  }

  // Handle AxiosError with direct message
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  // Fallback to default message
  return "An unexpected error occurred";
}

/**
 * Check if Intercom has fully booted and is ready to accept commands
 * @returns {boolean} True if Intercom is ready
 */
export const isIntercomReady = (): boolean => {
  // Check if window.Intercom exists and is a function
  return typeof window !== 'undefined' && 
         typeof window.Intercom === 'function' &&
         window.Intercom !== undefined;
};

/**
 * Wait for Intercom to be ready with retry logic
 * @param {number} maxRetries - Maximum number of retry attempts
 * @param {number} delay - Delay between retries in milliseconds
 * @returns {Promise<boolean>} Promise that resolves when Intercom is ready
 */
export const waitForIntercomReady = async (maxRetries: number = 10, delay: number = 200): Promise<boolean> => {
  for (let i = 0; i < maxRetries; i++) {
    if (isIntercomReady()) {
      return true;
    }
    // Wait before next retry
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  return false;
};