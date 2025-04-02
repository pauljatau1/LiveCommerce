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
    if (message.avatar) {
      return <img src={message.avatar} alt={message.user} className="w-8 h-8 rounded-full object-cover" />;
    } else {
      return <Icon icon="hugeicons:user-circle" className="w-8 h-8" color="#EFF0FA" />;
    }
  };

  // Render different message types
  switch (message.type) {
    case 'comment':
      return (
        <div className="flex items-start gap-2 mb-2 hover:bg-[#161A1E] py-2 px-1 rounded transition-colors duration-200">
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
    type: PropTypes.oneOf(['comment', 'join', 'purchase', 'leave']),
    user: PropTypes.string,
    avatar: PropTypes.object,
    content: PropTypes.string,
    data: PropTypes.object,
    timestamp: PropTypes.string
  }).isRequired
};

export default ChatMessage; 