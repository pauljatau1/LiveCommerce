# Offline Auction Client Implementation Guide

This guide explains how to implement the client-side functionality for offline auctions in your React Native Expo application.

## Table of Contents
- [API Routes](#api-routes)
- [WebSocket Events](#websocket-events)
- [Implementation Examples](#implementation-examples)
- [Real-time Updates](#real-time-updates)

## API Routes

### Fetch Auction Products
```javascript
// Get all offline auction products
GET /api/products/offline-auctions

// Get specific offline auction product
GET /api/products/offline-auctions/:productId

// Get bids for a specific auction
GET /api/products/offline-auctions/:productId/bids

// Place a bid
POST /api/products/offline-auctions/:productId/bid
```

## WebSocket Events

### Emitted Events (Client to Server)
```javascript
// Join auction lists room to receive updates about all auctions
socket.emit('join_auction_lists');

// Join specific auction room
socket.emit('join_auction', productId);

// Place a bid
socket.emit('place_bid', { productId, amount });

// Request timer update
socket.emit('request_auction_timer', productId);

// Leave auction room
socket.emit('leave_auction', productId);
```

### Received Events (Server to Client)
```javascript
// Initial auction lists data
socket.on('auction_lists_data', (data) => {
  // Handle initial auction lists data
});

// Updates for auction list
socket.on('auction_list_update', (data) => {
  // Handle auction list updates
});

// Initial auction data when joining a specific auction
socket.on('auction_data', (data) => {
  // Handle initial auction data
});

// Bid updates
socket.on('bid_update', (data) => {
  // Handle new bid updates
});

// Timer updates
socket.on('auction_timer_update', (data) => {
  // Handle timer updates
});

// Auction ended
socket.on('auction_ended', (data) => {
  // Handle auction end
});
```

## Implementation Examples

### Setting Up Socket Connection
```javascript
import io from 'socket.io-client';

const setupSocket = (token) => {
  const socket = io('YOUR_SERVER_URL', {
    auth: { token },
    transports: ['websocket']
  });

  return socket;
};
```

### Fetching Auction Products
```javascript
import axios from 'axios';

const fetchAuctionProducts = async () => {
  try {
    const response = await axios.get('/api/products/offline-auctions');
    return response.data;
  } catch (error) {
    console.error('Error fetching auction products:', error);
    throw error;
  }
};

const fetchAuctionDetails = async (productId) => {
  try {
    const response = await axios.get(`/api/products/offline-auctions/${productId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching auction details:', error);
    throw error;
  }
};
```

### Implementing Real-time Updates in a Component
```javascript
import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';

const AuctionProduct = ({ productId, socket }) => {
  const [auctionData, setAuctionData] = useState(null);
  const [currentBid, setCurrentBid] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);

  useEffect(() => {
    // Join auction room
    socket.emit('join_auction', productId);

    // Listen for updates
    socket.on('auction_data', (data) => {
      setAuctionData(data);
      setCurrentBid(data.currentHighestBid);
    });

    socket.on('bid_update', (data) => {
      setCurrentBid(data.currentHighestBid);
    });

    socket.on('auction_timer_update', (data) => {
      setTimeRemaining(data.timeRemaining);
    });

    socket.on('auction_ended', (data) => {
      // Handle auction end
    });

    // Cleanup
    return () => {
      socket.emit('leave_auction', productId);
      socket.off('auction_data');
      socket.off('bid_update');
      socket.off('auction_timer_update');
      socket.off('auction_ended');
    };
  }, [productId]);

  // ... rest of the component
};
```

### Placing a Bid
```javascript
const placeBid = async (productId, amount) => {
  try {
    // Emit bid through socket for real-time update
    socket.emit('place_bid', { productId, amount });
    
    // You can also make an API call if needed
    const response = await axios.post(`/api/products/offline-auctions/${productId}/bid`, {
      amount
    });
    return response.data;
  } catch (error) {
    console.error('Error placing bid:', error);
    throw error;
  }
};
```

## Real-time Updates

The system provides real-time updates for:
- Current highest bid
- Number of bids
- Time remaining
- Auction status changes
- Winner announcements

### Data Structures

#### Auction List Update
```javascript
{
  productId: string,
  name: string,
  currentHighestBid: {
    amount: number,
    buyer: {
      _id: string,
      firstName: string,
      lastName: string
    }
  },
  bidsCount: number,
  status: 'scheduled' | 'ongoing' | 'ended',
  timeRemaining: number
}
```

#### Auction Data
```javascript
{
  productId: string,
  name: string,
  status: 'scheduled' | 'ongoing' | 'ended',
  minBid: number,
  maxBid: number,
  startDate: Date,
  endDate: Date,
  timeRemaining: number,
  bids: Array<Bid>,
  bidsCount: number,
  currentHighestBid: {
    amount: number,
    buyer: {
      _id: string,
      firstName: string,
      lastName: string,
      profileImage: string
    }
  },
  winner: {
    buyer: {
      _id: string,
      firstName: string,
      lastName: string,
      profileImage: string
    },
    bidAmount: number,
    winningDate: Date
  }
}
```

## Best Practices

1. Always clean up socket listeners in component unmount
2. Handle socket connection errors and reconnection
3. Implement loading states for initial data fetch
4. Handle error cases for failed bids
5. Implement proper validation before placing bids
6. Use proper error boundaries for socket event handling
7. Implement retry logic for failed API calls
8. Cache auction data when appropriate
9. Implement proper UI feedback for user actions
10. Handle offline scenarios gracefully