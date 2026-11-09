// Turns live-show socket notifications into chat lines for the Live studio,
// the same way the buyer Watch does. Pure, so it can be tested with node --test.

export const nairaText = (n) => `₦${Math.round(Number(n || 0)).toLocaleString('en-NG')}`;

// The winner of an auction: from bidWinner.buyer, never the notification's
// `user` (the server sets that to the host's store name on win lines).
export const winnerName = (data) => {
  const b = data?.bidWinner?.buyer;
  return (b && (b.username || b.firstName)) || 'A buyer';
};

/** → { kind, user, avatar, text } for chat, or null for events that aren't chat lines */
export const feedEntryFor = (n) => {
  const d = n?.data || {};
  switch (n?.type) {
    case 'comment': return { kind: 'comment', user: n.user, avatar: n.avatar, text: n.content };
    case 'new_bid': return { kind: 'bid', user: n.user, avatar: n.avatar, text: `bid ${nairaText(d.bidAmount)}` };
    case 'auction_winner': return { kind: 'win', user: winnerName(d), avatar: d.bidWinner?.buyer?.profileImage?.url, text: `won it for ${nairaText(d.bidWinner?.bidAmount)}` };
    case 'buy_now': return { kind: 'buy', user: n.user, avatar: n.avatar, text: n.content || 'bought one' };
    case 'auction_start': return { kind: 'sys', text: 'Bidding is open' };
    case 'notes_updated': return { kind: 'sys', text: n.content };
    default: return null;
  }
};
