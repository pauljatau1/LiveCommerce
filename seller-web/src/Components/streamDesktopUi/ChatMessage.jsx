import PropTypes from 'prop-types';
import { Icon } from '@iconify/react';
import { useMemo } from 'react';

// Generate a consistent color based on username
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

const ChatMessage = ({ message }) => {

  console.log('chat message', message);
  // Get a consistent color for this username
  const usernameColor = useMemo(() =>
    getUsernameColor((message && message.user) || 'user'),
    [message && message.user]
  );

  // Format timestamp if available
  const formattedTime = useMemo(() => {
    if (!message || !message.timestamp) return '';

    try {
      const date = new Date(message.timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  }, [message && message.timestamp]);

  if (!message) return null;

  const renderAvatar = () => {
    // Handle both string and object avatar structures
    const avatarUrl = typeof message.avatar === 'string'
      ? message.avatar
      : message.avatar?.url;

    if (avatarUrl) {
      return <img src={avatarUrl} alt={message.user} className="w-8 h-8 rounded-full object-cover" />;
    } else {
      return <Icon icon="hugeicons:user-circle" className="w-8 h-8" color="#EFF0FA" />;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Render different message types
  switch (message.type) {
    case 'comment':
      return (
        <div className="flex items-start gap-2 mb-2 hover:bg-[#161A1E] py-2 px-4 rounded transition-colors duration-200">
          {renderAvatar()}
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              {message.data?.isHost && (
                <span className="text-xs px-1.5 py-0.5 bg-[#9146FF] text-white rounded-sm mr-1 font-medium">HOST</span>
              )}
              <p className="text-sm font-inter font-semibold" style={{ color: usernameColor }}>
                {message.user}
              </p>
              {formattedTime && (
                <span className="text-xs text-gray-500">{formattedTime}</span>
              )}
            </div>
            <p className="text-sm text-[#FFFFFF] mt-0.5">{message.content}</p>
          </div>
        </div>
      );

    case 'join':
      console.log('Rendering join message:', message);
      return (
        <div className="flex items-center justify-center py-2">
          <div className="px-3 py-1 bg-[#14AE5C15] rounded-full">
            <p className="text-xs text-[#14AE5C]">
              <span className="font-medium">{message.user}</span> joined the stream
            </p>
          </div>
        </div>
      );

    case 'leave':
      console.log('Rendering leave message:', message);
      return (
        <div className="flex items-center justify-center py-2">
          <div className="px-3 py-1 bg-[#C74E5B15] rounded-full">
            <p className="text-xs text-[#C74E5B]">
              <span className="font-medium">{message.user}</span> left the stream
            </p>
          </div>
        </div>
      );

    case 'purchase':
      return (
        <div className="flex items-center justify-center py-2">
          <div className="px-3 py-1 bg-[#14AE5C15] rounded-full">
            <p className="text-xs text-[#14AE5C]">
              <span className="font-medium">{message.user}</span> purchased {message.data?.productName || 'a product'}
            </p>
          </div>
        </div>
      );

    case 'liveshow_order':
      return (
        <div className="flex items-center justify-center py-3 my-1">
          <div className="w-full px-4 py-3 bg-[#25133A] border-l-4 border-[#9B59B6] rounded-md shadow-lg transform transition-all duration-300 hover:scale-[1.02]">
            <div className="flex items-center gap-3">
              {renderAvatar()}
              <div className="flex-1">
                <div className="flex items-center gap-1">
                  <Icon icon="mdi:shopping-outline" className="w-4 h-4 text-[#9B59B6]" />
                  <span className="text-[#9B59B6] font-semibold text-xs">NEW ORDER</span>
                  {formattedTime && (
                    <span className="text-xs text-gray-400 ml-auto">{formattedTime}</span>
                  )}
                </div>
                <p className="text-white text-sm mt-1">
                  <span className="font-bold" style={{ color: usernameColor }}>{message.user}</span>
                  {" "}
                  <span className="text-gray-300">{message.content || "received a new order"}</span>
                </p>
                
                {message.data?.orders && (
                  <div className="mt-2 space-y-2">
                    {message.data.orders.map((order, index) => (
                      <div key={index} className="bg-[#9B59B620] rounded-md px-2 py-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-300 font-medium truncate max-w-[120px]">
                            {order?.items[0]?.productName || "Product"}
                          </span>
                          <span className="text-[#9B59B6] text-xs font-bold">
                            {formatCurrency(order?.items[0]?.price || 0)} × {order?.items[0]?.quantity || 1}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      );

    case 'new_bid':
      return (
        <div className="flex items-center justify-center py-3 my-1">
          <div className="w-full px-4 py-3 bg-[#1D1A05] border-l-4 border-[#FFD700] rounded-md shadow-lg transform transition-all duration-300 hover:scale-[1.02]">
            <div className="flex items-center gap-3">
              {renderAvatar()}
              <div className="flex-1">
                <div className="flex items-center gap-1">
                  <Icon icon="mingcute:currency-nigeria-line" className="w-4 h-4 text-[#FFD700]" />
                  <span className="text-[#FFD700] font-semibold text-xs">NEW BID</span>
                  {formattedTime && (
                    <span className="text-xs text-gray-500 ml-auto">{formattedTime}</span>
                  )}
                </div>
                <p className="text-white text-sm mt-1">
                  <span className="font-bold" style={{ color: usernameColor }}>{message.user}</span>
                  {" "}
                  <span className="text-gray-300">{message.content || "placed a bid"}</span>
                </p>
                {message.data?.bidAmount && (
                  <div className="flex items-center mt-1">
                    <div className="flex items-center gap-0 bg-[#FFD70020] px-2 py-1 rounded-md">
                      <Icon icon="mingcute:currency-nigeria-line" className="w-[22px] h-[22px] text-[#FFD700]" />
                      <span className="text-[#FFD700] font-bold">{formatCurrency(message.data.bidAmount)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      );

    case 'auction_winner':
      return (
        <div className="flex items-center justify-center py-4 my-2">
          <div className="w-full relative overflow-hidden bg-gradient-to-r from-[#1A1500] via-[#332C04] to-[#1A1500] px-5 py-4 rounded-lg shadow-[0_0_15px_rgba(255,215,0,0.3)] border border-[#FFD700]">
            <div className="absolute -top-6 -left-6 w-12 h-12 opacity-20">
              <Icon icon="noto:party-popper" className="w-full h-full" />
            </div>
            <div className="absolute -bottom-6 -right-6 w-12 h-12 opacity-20">
              <Icon icon="noto:party-popper" className="w-full h-full transform rotate-180" />
            </div>

            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Icon icon="game-icons:trophy-cup" className="w-5 h-5 text-[#FFD700]" />
                <span className="text-[#FFD700] font-bold text-sm uppercase tracking-wider">Auction Winner!</span>
              </div>
              {formattedTime && (
                <span className="text-xs text-gray-400">{formattedTime}</span>
              )}
            </div>

            <div className="flex flex-wrap items-center mt-2">
              {renderAvatar()}
              <div className="">
                <p className="text-white font-bold text-sm tracking-wide" style={{ color: usernameColor }}>
                  {message.user}
                </p>
                <p className="text-gray-300 text-xs">
                  {message.content || "won the auction with the highest bid!"}
                </p>
              </div>
            </div>

            {message.data?.bidAmount && (
              <div className="mt-3 bg-[#FFD70020] rounded-md px-3 py-2 flex items-center justify-between">
                <span className="text-sm text-gray-300">Winning bid:</span>
                <span className="text-[#FFD700] font-bold text-base">{formatCurrency(message.data.bidAmount)}</span>
              </div>
            )}
          </div>
        </div>
      );

    default:
      return (
        <div className="flex items-start gap-2 mb-3">
          {renderAvatar()}
          <div className="flex-1">
            <p className="text-sm font-inter font-medium" style={{ color: usernameColor }}>{message.user}</p>
            <p className="text-sm text-[#FFFFFF]">{message.content}</p>
          </div>
        </div>
      );
  }
};

ChatMessage.propTypes = {
  message: PropTypes.shape({
    id: PropTypes.string,
    _id: PropTypes.string,
    type: PropTypes.oneOf(['comment', 'join', 'purchase', 'leave', 'new_bid', 'auction_winner', 'liveshow_order', 'start', 'auction_end', 'auction_start']),
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

export default ChatMessage; 