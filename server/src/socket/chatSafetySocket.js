// Chat safety on the live socket (see services/chatSafety.js for the rules).
// A hidden message is stored but never sent to buyers: they get a short notice.
// The host gets the message with Undo; Undo sends it to everyone.
const { buyerNotice, sellerNotice } = require('../services/chatSafety');

const roomOf = (streamId) => `stream_notifications_${streamId}`;
const sellerIdOf = (stream) => String(stream.seller?._id || stream.seller);

const hideComment = async ({ io, socket, Stream, stream, comment, kind }) => {
  const streamId = String(stream._id);
  const stored = { ...comment, hidden: true, hiddenReason: kind };
  await Stream.updateOne({ _id: stream._id }, { $push: { chatInteractions: stored } });
  // Everyone: just the notice, never the text
  io.to(roomOf(streamId)).emit('chat_hidden', { streamId, id: comment.id, kind, notice: buyerNotice(kind) });
  // The host: the text and Undo
  const sockets = await io.in(roomOf(streamId)).fetchSockets();
  sockets
    .filter((s) => s.user?.role === 'Seller' && String(s.user.id) === sellerIdOf(stream))
    .forEach((s) => s.emit('chat_hidden_detail', { streamId, id: comment.id, kind, user: comment.user, content: comment.content, notice: sellerNotice(kind) }));
  // The sender: why it didn't show
  if (socket.user?.role !== 'Seller') {
    socket.emit('chat_hidden_self', { streamId, id: comment.id, message: 'Your message was hidden: phone numbers, account numbers and links stay out of chat so payments stay in the app.' });
  }
};

const registerUnhide = ({ io, socket, Stream }) => {
  socket.on('stream_unhide_comment', async (data) => {
    try {
      if (socket.user?.role !== 'Seller' || !data?.streamId || !data?.id) return;
      const before = await Stream.findOneAndUpdate(
        { _id: data.streamId, seller: socket.user.id, chatInteractions: { $elemMatch: { id: String(data.id), hidden: true } } },
        { $set: { 'chatInteractions.$.hidden': false } },
        { projection: { 'chatInteractions.$': 1 } }
      ).lean();
      const c = before?.chatInteractions?.[0];
      if (!c) { socket.emit('chat_unhide_error', { id: data.id, message: 'That message is already showing.' }); return; }
      const { hidden, hiddenReason, _id, ...shown } = c;
      io.to(roomOf(data.streamId)).emit('stream_notification', { ...shown, timestamp: new Date() });
      io.to(roomOf(data.streamId)).emit('chat_unhidden', { streamId: String(data.streamId), id: String(data.id) });
    } catch (error) {
      console.error('[chat-safety] unhide', error.message);
      socket.emit('chat_unhide_error', { id: data?.id, message: "Couldn't show that message. Try again." });
    }
  });
};

module.exports = { hideComment, registerUnhide };
