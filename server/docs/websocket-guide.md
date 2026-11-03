# Auqli Stream Notifications WebSocket Guide

## Stream-Specific Notifications

To address the issue of notifications being broadcast to all streams, we've updated the system to use stream-specific notification rooms. This ensures that users in one stream won't receive notifications from other streams.

## Subscribing to Stream Notifications

### For Client Applications

When a user joins a stream, subscribe them to notifications for that specific stream:

```javascript
// Connect to the socket server
const socket = io('https://your-api-url.com', {
  auth: {
    token: 'user-jwt-token'  // The user's authentication token
  }
});

// Subscribe to notifications for a specific stream
socket.emit('stream_notification_subscribe', {
  streamId: 'stream-id-here'  // The ID of the stream the user is viewing
});

// Listen for stream notifications
socket.on('stream_notification', (notification) => {
  // Handle the notification based on its type
  switch(notification.type) {
    case 'comment':
      // Handle chat comment
      break;
    case 'auction_start':
      // Handle auction start
      break;
    case 'auction_end':
      // Handle auction end
      break;
    case 'new_bid':
      // Handle new bid
      break;
    case 'auction_winner':
      // Handle auction winner announcement
      break;
    case 'liveshow_order':
      // Handle new order during liveshow
      break;
  }
});
```

### For Stream Management

Ensure your frontend applications are updated to:

1. Subscribe to the specific stream's notifications when a user joins a stream
2. Unsubscribe when they leave the stream

## Backward Compatibility

For backward compatibility, we're still broadcasting to the general `stream_notifications` room as well. However, new client applications should use the stream-specific approach.

## Implementation Details

The server now creates room names in the format: `stream_notifications_{streamId}`

This ensures each stream has its own notification room, preventing cross-stream notification leakage.

## Benefits

- Users in Stream A won't receive chat messages or other notifications from Stream B
- Reduced network traffic for users
- Better separation of concerns
- Improved user experience without notification noise from other streams

## Migration

Update your client applications to pass the streamId when subscribing to stream notifications. This simple change will ensure your users only receive notifications for the stream they're currently viewing. 