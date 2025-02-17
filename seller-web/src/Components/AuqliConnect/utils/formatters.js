// Helper function to format message timestamps
export const formatMessageTime = (timestamp) => {
  if (!timestamp) return '';

  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = (now - date) / (1000 * 60 * 60);

  if (diffInHours < 24) {
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  if (diffInHours < 48) {
    return 'Yesterday';
  }

  if (diffInHours < 168) {
    return date.toLocaleDateString([], {
      weekday: 'long'
    });
  }

  return date.toLocaleDateString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Helper function to format reaction preview text
export const formatReactionPreview = (reactions) => {
  if (!reactions || reactions.length === 0) return '';
  
  const names = reactions.map(r => `${r.user.firstName} ${r.user.lastName}`);
  if (names.length === 1) return `${names[0]} liked this`;
  if (names.length === 2) return `${names[0]} and ${names[1]} liked this`;
  return `${names[0]} and ${names.length - 1} others liked this`;
};

// Helper function to format comment preview text
export const formatCommentPreview = (comments) => {
  if (!comments || comments.length === 0) return '';
  
  const names = comments.map(c => `${c.author.firstName} ${c.author.lastName}`);
  if (names.length === 1) return `${names[0]} commented`;
  if (names.length === 2) return `${names[0]} and ${names[1]} commented`;
  return `${names[0]} and ${names.length - 1} others commented`;
}; 