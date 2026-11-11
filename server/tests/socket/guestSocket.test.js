const jwt = require('jsonwebtoken');
const { socketUserFromHandshake, registerGuestSocket } = require('@/socket/guestSocket');

const fakeSocket = () => {
  const handlers = {};
  return {
    handlers,
    rooms: new Set(),
    emitted: [],
    on(event, fn) { handlers[event] = fn; },
    join(room) { this.rooms.add(room); },
    leave(room) { this.rooms.delete(room); },
    emit(event, payload) { this.emitted.push([event, payload]); },
  };
};

describe('guest sockets', () => {
  it('a token makes a signed-in user; guest: true without one makes a guest; otherwise refused', async () => {
    const token = jwt.sign({ id: 'b1', role: 'Buyer' }, process.env.JWT_SECRET);
    expect(await socketUserFromHandshake({ auth: { token } })).toMatchObject({ id: 'b1', role: 'Buyer' });
    expect(await socketUserFromHandshake({ auth: { guest: true } })).toEqual({ id: null, role: 'Guest', guest: true });
    expect(await socketUserFromHandshake({ auth: {} })).toBeNull();
    await expect(socketUserFromHandshake({ auth: { token: 'forged' } })).rejects.toThrow();
  });

  it('a guest can follow a show but not chat or bid', () => {
    const socket = fakeSocket();
    registerGuestSocket(socket);
    socket.handlers.stream_notification_subscribe({ streamId: 's1' });
    expect(socket.rooms.has('stream_notifications_s1')).toBe(true);

    socket.handlers.stream_place_bid({ streamId: 's1', productId: 'p1', bidAmount: 5000 });
    socket.handlers.stream_comment({ streamId: 's1', content: 'hi' });
    expect(socket.emitted).toEqual([
      ['bid_error', expect.objectContaining({ reason: 'account_required' })],
      ['guest_error', expect.objectContaining({ reason: 'account_required' })],
    ]);
    // Only the guest handlers exist: no messaging, no auctions
    expect(Object.keys(socket.handlers).sort()).toEqual(['stream_comment', 'stream_like', 'stream_notification_subscribe', 'stream_notification_unsubscribe', 'stream_place_bid']);
  });
});
