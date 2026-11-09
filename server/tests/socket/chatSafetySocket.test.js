const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const Stream = require('@models/Stream');
const { hideComment, registerUnhide } = require('@/socket/chatSafetySocket');

let mongoServer; let show; let sellerId;

const fakeSocket = (user) => {
  const handlers = {}; const emitted = [];
  return { user, handlers, emitted, on(e, fn) { handlers[e] = fn; }, emit(e, p) { emitted.push([e, p]); } };
};
const fakeIo = (socketsInRoom) => {
  const broadcast = [];
  return {
    broadcast,
    to: (room) => ({ emit: (e, p) => broadcast.push([room, e, p]) }),
    in: () => ({ fetchSockets: async () => socketsInRoom }),
  };
};

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create({ binary: { version: '7.0.3' } });
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  await mongoose.connect(mongoServer.getUri());
});
afterAll(async () => { await mongoose.disconnect(); await mongoServer.stop(); });
beforeEach(async () => {
  await Stream.deleteMany({});
  sellerId = new mongoose.Types.ObjectId();
  show = await Stream.create({ seller: sellerId, title: 'Saturday drop', category: 'Women', channelName: 'c', status: 'live', type: 'auction' });
});

const comment = { id: 'm1', type: 'comment', user: 'ada', content: 'pay 0123456789 GTB', data: { message: 'pay 0123456789 GTB' } };

describe('hidden chat messages', () => {
  it('buyers get only a notice; the host gets the text; the sender is told why', async () => {
    const host = fakeSocket({ id: String(sellerId), role: 'Seller' });
    const otherSeller = fakeSocket({ id: String(new mongoose.Types.ObjectId()), role: 'Seller' });
    const buyer = fakeSocket({ id: 'b1', role: 'Buyer' });
    const io = fakeIo([host, otherSeller, buyer]);

    await hideComment({ io, socket: buyer, Stream, stream: show, comment, kind: 'account' });

    expect(io.broadcast).toEqual([[`stream_notifications_${show._id}`, 'chat_hidden', expect.objectContaining({ id: 'm1', kind: 'account', notice: '1 message with an account number was hidden' })]]);
    expect(JSON.stringify(io.broadcast)).not.toContain('0123456789');
    expect(host.emitted).toEqual([['chat_hidden_detail', expect.objectContaining({ id: 'm1', content: 'pay 0123456789 GTB', notice: 'Hid 1 message with an account number' })]]);
    expect(otherSeller.emitted).toEqual([]);
    expect(buyer.emitted[0][0]).toBe('chat_hidden_self');
    const stored = (await Stream.findById(show._id).lean()).chatInteractions[0];
    expect(stored).toMatchObject({ id: 'm1', hidden: true, hiddenReason: 'account' });
  });

  it('Undo by the host shows the message to everyone, once', async () => {
    await Stream.updateOne({ _id: show._id }, { $push: { chatInteractions: { ...comment, hidden: true, hiddenReason: 'account' } } });
    const host = fakeSocket({ id: String(sellerId), role: 'Seller' });
    const io = fakeIo([]);
    registerUnhide({ io, socket: host, Stream });

    await host.handlers.stream_unhide_comment({ streamId: String(show._id), id: 'm1' });
    expect(io.broadcast.map(([, e]) => e)).toEqual(['stream_notification', 'chat_unhidden']);
    expect(io.broadcast[0][2]).toMatchObject({ id: 'm1', content: 'pay 0123456789 GTB' });
    expect(io.broadcast[0][2].hidden).toBeUndefined();
    expect((await Stream.findById(show._id).lean()).chatInteractions[0].hidden).toBe(false);

    await host.handlers.stream_unhide_comment({ streamId: String(show._id), id: 'm1' });
    expect(io.broadcast).toHaveLength(2);
    expect(host.emitted[0]).toEqual(['chat_unhide_error', expect.objectContaining({ message: 'That message is already showing.' })]);
  });

  it('only the host of this show can undo', async () => {
    await Stream.updateOne({ _id: show._id }, { $push: { chatInteractions: { ...comment, hidden: true } } });
    const io = fakeIo([]);
    for (const user of [{ id: 'b1', role: 'Buyer' }, { id: String(new mongoose.Types.ObjectId()), role: 'Seller' }]) {
      const s = fakeSocket(user);
      registerUnhide({ io, socket: s, Stream });
      await s.handlers.stream_unhide_comment({ streamId: String(show._id), id: 'm1' });
    }
    expect(io.broadcast).toEqual([]);
    expect((await Stream.findById(show._id).lean()).chatInteractions[0].hidden).toBe(true);
  });
});
