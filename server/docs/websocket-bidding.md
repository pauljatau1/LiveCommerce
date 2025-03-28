# Real-time Auction Bidding with WebSockets

This document explains how to use the WebSocket-based real-time bidding system for auction streams.

## Overview

The WebSocket bidding system provides real-time updates for auction bidding, ensuring all viewers see bids as they happen without needing to refresh the page. This system is more efficient than REST API calls for high-frequency bid operations.

## Connection and Authentication

1. Connect to the main socket.io instance with authentication:

```javascript
// Client-side code
const socket = io("https://api.auqli.live", {
  auth: {
    token: "your-jwt-token" // User authentication token
  }
});
```

2. Join the auction bidding room for real-time updates:

```javascript
// Subscribe to real-time auction bid updates
socket.emit('join_auction_bidding', streamId);

// Listen for bid updates
socket.on('auction_bid_update', (bidData) => {
  // Handle the bid update
  console.log('New bid:', bidData);
  // Update UI to show the new bid
});
```

## Placing Bids

To place a bid using WebSockets:

```javascript
// Emit a bid event
socket.emit('stream_place_bid', {
  streamId: 'stream-id-here',
  productId: 'product-id-here',
  bidAmount: 5000 // Amount in cents or smallest currency unit
});

// Listen for success response
socket.on('bid_placed', (response) => {
  if (response.success) {
    console.log('Bid placed successfully:', response);
    // Handle successful bid (update UI, show confirmation, etc.)
    
    // Check if the bid won the auction
    if (response.isWinner) {
      // Show winning notification
    }
  }
});

// Listen for error response
socket.on('bid_error', (error) => {
  console.error('Bid error:', error);
  // Show error message to user
});
```

## Bid Notifications

The system sends notifications through two channels:

1. `stream_notifications` - General stream notifications including bids
2. `stream_auction_bidding` - Dedicated channel for bid updates only

Both channels receive the same bid data, but you can choose which one to subscribe to based on your needs.

## Notification Format

Bid notifications have this structure:

```javascript
{
  id: "timestamp-based-id",
  type: "new_bid", // or "auction_winner" for winning bids
  user: "Username",
  avatar: "avatar-url",
  content: "Username placed a bid of 5000 on Product Name",
  data: {
    message: "Username placed a bid of 5000 on Product Name",
    streamId: "stream-id",
    buyerId: "buyer-id",
    buyerName: "Full Name",
    product: {
      // Product details including current bid
    },
    bidAmount: 5000,
    currentBidder: {
      _id: "buyer-id",
      firstName: "First",
      lastName: "Last",
      username: "Username",
      profileImage: {...}
    },
    timestamp: "2023-05-01T12:34:56.789Z"
  },
  timestamp: "2023-05-01T12:34:56.789Z"
}
```

## Disconnecting

When leaving the auction:

```javascript
// Leave the auction bidding channel
socket.emit('leave_auction_bidding');

// Disconnect from the socket when completely done
socket.disconnect();
```

## Fallback REST API

If WebSockets are not available, you can use the REST API endpoint as a fallback:

```
POST /api/streams/{streamId}/place-bid
```

Body:
```json
{
  "productId": "product-id",
  "bidAmount": 5000
}
```

However, the WebSocket approach is strongly recommended for real-time bidding experiences. 