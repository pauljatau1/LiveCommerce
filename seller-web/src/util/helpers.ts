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