// Guests (no account) can watch a show: they receive the show's live events
// (bids, timer, chat) but can't send anything. A guest socket only gets the
// subscribe/unsubscribe handlers below, never the main handlers.
const jwt = require('jsonwebtoken');

// Who is on this socket: a signed-in user from the token, a guest when the
// client asks for guest access without a token, or null (refuse).
const socketUserFromHandshake = async (handshake = {}) => {
  const token = handshake.auth?.token;
  if (token) return require('../services/auth/sessions').assertSession(jwt.verify(token, process.env.JWT_SECRET));
  if (handshake.auth?.guest === true) return { id: null, role: 'Guest', guest: true };
  return null;
};

const registerGuestSocket = (socket) => {
  socket.on('stream_notification_subscribe', (data) => {
    if (!data?.streamId || typeof data.streamId !== 'string' || data.streamId.length > 64) {
      socket.emit('stream_notification_error', { message: 'StreamId is required to subscribe to stream notifications' });
      return;
    }
    socket.join(`stream_notifications_${data.streamId}`);
  });
  socket.on('stream_notification_unsubscribe', (data) => {
    if (data?.streamId) socket.leave(`stream_notifications_${data.streamId}`);
  });
  // Anything a guest tries to send gets a plain answer
  ['stream_comment', 'stream_place_bid', 'stream_like'].forEach((event) => {
    socket.on(event, () => socket.emit(event === 'stream_place_bid' ? 'bid_error' : 'guest_error', { message: 'Create an account to join in. It takes a minute.', reason: 'account_required' }));
  });
};

module.exports = { socketUserFromHandshake, registerGuestSocket };
