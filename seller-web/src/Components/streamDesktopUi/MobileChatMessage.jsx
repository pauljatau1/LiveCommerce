import PropTypes from 'prop-types';
import { Icon } from '@iconify/react';
import { useMemo } from 'react';

// Generate a consistent color based on username (same as desktop version)
const getUsernameColor = (username) => {
  const colors = [
    '#FF4500', '#FF0000', '#B22222', '#FF7F50',
    '#9ACD32', '#32CD32', '#00FF7F', '#00FA9A',
    '#00FFFF', '#00BFFF', '#0000FF', '#8A2BE2',
    '#FF00FF', '#FF69B4', '#FFD700', '#FFFF00'
  ];

  // Generate a simple hash of the username
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Use the hash to pick a color
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

const MobileChatMessage = ({ message }) => {
  // Get a consistent color for this username
  const usernameColor = useMemo(() =>
    getUsernameColor((message && message.user) || 'user'),
    [message && message.user]
  );

  if (!message) return null;

  const renderAvatar = () => {
    // Handle both string and object avatar structures
    const avatarUrl = typeof message.avatar === 'string'
      ? message.avatar
      : message.avatar?.url;

    if (avatarUrl) {
      return <img src={avatarUrl} alt={message.user} className="w-8 h-8 rounded-full object-cover" />;
    } else {
      return <Icon icon="hugeicons:user-circle" className="w-6 h-6" color="#EFF0FA" />;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Render different message types - mobile optimized for TikTok/Instagram style
  switch (message.type) {
    case 'comment':
      return (
        <div className="flex items-start mb-1 px-2 animate-fadeIn">
          <div className="mr-2 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center overflow-hidden bg-black/20 border-2 border-green-500/30">
            {renderAvatar()}
          </div>
          <div className="flex-1 bg-black/40 backdrop-blur-sm max-w-[70%] rounded-xl px-3 py-1.5 overflow-hidden">
            <p className="text-xs font-semibold truncate" style={{ color: usernameColor }}>
              {message.user}
            </p>
            <p className="text-xs text-white break-words">{message.content}</p>
          </div>
        </div>
      );

    case 'join':
      return (
        <div className="flex items-center mb-1 animate-fadeIn">
          <div className="flex items-center bg-black/40 backdrop-blur-sm rounded-full px-2 py-1 w-auto max-w-[80%]">
            <div className="mr-1.5 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center overflow-hidden bg-black/20 border-2 border-green-500/30">
              {renderAvatar()}
            </div>
            <div className="flex-1 mr-1 min-w-0">
              <p className="text-[11px] text-[#1bff47] truncate">
                <span className="font-medium">{message.user}</span> just joined
              </p>
            </div>
          </div>
        </div>
      );

    case 'leave':
      return (
        <div className="flex items-center mb-1 animate-fadeIn">
          <div className="flex items-center bg-black/40 backdrop-blur-sm rounded-full px-2 py-1 w-auto max-w-[80%]">
            <div className="mr-1.5 flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full overflow-hidden bg-black/20 border-2 border-red-500/30">
              {renderAvatar()}
            </div>
            <div className="flex-1 mr-1 min-w-0">
              <p className="text-[11px] text-[#ff5b5b] truncate">
                <span className="font-medium">{message.user}</span> left
              </p>
            </div>
          </div>
        </div>
      );

    case 'purchase':
      return (
        <div className="flex items-center mb-1 animate-fadeIn">
          <div className="flex items-center bg-black/40 backdrop-blur-sm rounded-full px-2 py-1 w-auto max-w-[80%]">
            <div className="mr-1.5 flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full overflow-hidden bg-black/20 border-2 border-purple-500/30">
              {renderAvatar()}
            </div>
            <div className="flex-1 mr-1 min-w-0">
              <p className="text-[11px] text-[#c490ff] truncate">
                <span className="font-medium">{message.user}</span> purchased {message.data?.productName || 'a product'}
              </p>
            </div>
          </div>
        </div>
      );

    case 'liveshow_order':
      return (
        <div className="flex items-center mb-1 animate-fadeIn">
          <div className="flex flex-col bg-black/40 backdrop-blur-sm rounded-xl px-2 py-1.5 w-auto max-w-[100%]">
            <div className="flex gap-4 items-center">
              <div className="mr-1.5 flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full overflow-hidden bg-black/20 border-2 border-purple-500/50">
                {renderAvatar()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <Icon icon="mdi:shopping-outline" className="w-3 h-3 text-[#9B59B6]" />
                  <p className="text-[11px] font-semibold" style={{ color: usernameColor }}>
                    {message.user}
                  </p>
                </div>
                <p className="text-[11px] text-white">Ordered {message.data?.orders?.length || 1} item(s)</p>
              </div>
            </div>

            {message.data?.orders && (
              <div className="mt-2 space-y-1.5 pl-9 pr-1 ml-10">
                {message.data.orders.map((order, index) => (
                  <div key={index} className="bg-[#9B59B620] rounded-lg px-2 py-1.5 border-l-2 border-[#9B59B6]">
                    <div className="flex flex-col justify-between">
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <div className="w-5 h-5 flex items-center justify-center bg-[#9B59B6]/20 rounded-full">
                          <Icon icon="mdi:package-variant" className="w-3 h-3 text-[#9B59B6]" />
                        </div>
                        <span className="text-[11px] text-white font-medium truncate max-w-[120px]">
                          {order?.items[0]?.productName || "Product"}
                        </span>
                      </div>
                      <div className="flex items-center justify-end">
                        <span className="text-[#9B59B6] text-[11px] font-bold whitespace-nowrap">
                          {formatCurrency(order?.items[0]?.price || 0)}
                        </span>
                        <span className="text-white/60 text-[10px] mx-1">×</span>
                        <span className="bg-[#9B59B6]/20 text-[#9B59B6] text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          {order?.items[0]?.quantity || 1}
                        </span>
                      </div>
                    </div>
                    {order?.items[0]?.variant && (
                      <div className="mt-1 flex items-center">
                        <span className="text-[10px] text-white/50 truncate max-w-full">
                          {order?.items[0]?.variant}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
                <div className="flex justify-end">
                  <div className="bg-[#9B59B6]/10 rounded-full px-2 py-0.5 flex items-center">
                    <Icon icon="mdi:check-circle" className="w-3 h-3 text-[#9B59B6] mr-1" />
                    <span className="text-[10px] text-[#9B59B6] font-medium">Order placed</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      );

    case 'new_bid':
      return (
        <div className="flex items-center mb-1 animate-fadeIn">
          <div className="flex items-center bg-black/40 backdrop-blur-sm rounded-xl px-2 py-1.5 w-auto max-w-[90%]">
            <div className="mr-1.5 flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full overflow-hidden bg-black/20 border-2 border-yellow-500/50">
              {renderAvatar()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <Icon icon="mingcute:currency-nigeria-line" className="w-3 h-3 text-[#FFD700]" />
                <p className="text-[11px] font-semibold" style={{ color: usernameColor }}>
                  {message.user}
                </p>
              </div>
              {message.data?.bidAmount && (
                <p className="text-[11px] text-[#FFD700]">
                  Bid {formatCurrency(message.data.bidAmount)}
                </p>
              )}
            </div>
          </div>
        </div>
      );

    case 'auction_winner':
      return (
        <div className="flex items-center mb-1 animate-fadeIn">
          <div className="flex items-center bg-gradient-to-r from-[#1A1500]/80 to-[#332C04]/80 backdrop-blur-sm rounded-xl px-2 py-1.5 w-auto max-w-[90%] border border-[#FFD700]/50">
            <div className="mr-1.5 flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full overflow-hidden bg-black/20 border-2 border-yellow-500/50">
              {renderAvatar()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <Icon icon="game-icons:trophy-cup" className="w-3 h-3 text-[#FFD700]" />
                <p className="text-[11px] font-semibold text-[#FFD700]">
                  {message?.data?.bidWinner?.buyer?.username} won!
                </p>
              </div>
              {message.data?.bidAmount && (
                <p className="text-[11px] text-white">
                  With bid of {formatCurrency(message.data.bidAmount)}
                </p>
              )}
            </div>
          </div>
        </div>
      );

    default:
      return (
        <div className="flex items-start mb-1 px-2 animate-fadeIn">
          <div className="mr-2 flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full overflow-hidden bg-black/20 border-2 border-green-500/30">
            {renderAvatar()}
          </div>
          <div className="flex-1 bg-black/40 backdrop-blur-sm max-w-[70%] rounded-xl px-3 py-1.5">
            <p className="text-xs font-semibold" style={{ color: usernameColor }}>
              {message.user}
            </p>
            <p className="text-xs text-white">{message.content}</p>
          </div>
        </div>
      );
  }
};

// Add a CSS animation for message fade-in
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fadeIn {
    animation: fadeIn 0.3s ease-out forwards;
  }
`;
document.head.appendChild(style);

MobileChatMessage.propTypes = {
  message: PropTypes.shape({
    id: PropTypes.string,
    _id: PropTypes.string,
    type: PropTypes.oneOf(['comment', 'join', 'purchase', 'leave', 'new_bid', 'auction_winner', 'liveshow_order', 'start', 'auction_end', 'auction_start', 'announcement']),
    user: PropTypes.string,
    avatar: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.object
    ]),
    content: PropTypes.string,
    data: PropTypes.object,
    timestamp: PropTypes.string
  }).isRequired
};

export default MobileChatMessage; 