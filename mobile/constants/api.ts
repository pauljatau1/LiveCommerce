// API URL
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.yourdomain.com';

// Socket Events
export const SOCKET_EVENTS = {
  VIEWER_JOINED: 'viewer_joined_stream',
  VIEWER_LEFT: 'viewer_left_stream',
  NEW_COMMENT: 'new_comment',
  NEW_PURCHASE: 'new_purchase',
  SELLER_REJOINED: 'seller_rejoined_stream',
  AUCTION_START: 'auction_start',
}; 