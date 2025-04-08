import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Icon } from '@iconify/react';
import ChatEmpty from '../../assets/Chat Empty.png';
import ChatMessage from './ChatMessage';
import { useLivestreamSocket } from '../../Contexts/LivestreamSocketContext';

const ChatSection = ({ streamId, seller, initialMessages = [], liveStreamDetails }) => {
  // Initialize messages with chatInteractions from liveStreamDetails if available
  const [messages, setMessages] = useState(() => {
    // Check if liveStreamDetails has chatInteractions
    if (liveStreamDetails?.chatInteractions?.length > 0) {
      return liveStreamDetails.chatInteractions;
    }
    return initialMessages;
  });
  const [commentInput, setCommentInput] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const { notifications, sendStreamComment, subscribeToStreamNotifications } = useLivestreamSocket();
  
  // Subscribe to stream-specific notifications
  useEffect(() => {
    if (streamId && subscribeToStreamNotifications) {
      console.log(`ChatSection: Subscribing to notifications for stream ${streamId}`);
      subscribeToStreamNotifications(streamId);
    }
  }, [streamId, subscribeToStreamNotifications]);
  
  // Update messages when liveStreamDetails or chatInteractions change
  useEffect(() => {
    if (liveStreamDetails?.chatInteractions?.length > 0) {
      console.log('Initializing chat messages from history:', liveStreamDetails.chatInteractions.length);
      setMessages(liveStreamDetails.chatInteractions);
    }
  }, [liveStreamDetails]);
  
  // Update messages when new notifications come in
  useEffect(() => {
    if (notifications.length > 0) {
      const latestNotification = notifications[notifications.length - 1];
      
      console.log('Processing notification:', latestNotification.type, 'for stream:', latestNotification.data?.streamId);
      
      // Only add notifications for the current stream
      if (latestNotification.data?.streamId === streamId) {
        // Avoid duplicates by checking if the notification ID already exists in messages
        setMessages(prevMessages => {
          const messageExists = prevMessages.some(msg => msg.id === latestNotification.id || msg._id === latestNotification.id);
          if (messageExists) {
            console.log('Duplicate message detected, skipping');
            return prevMessages;
          }
          console.log('Adding new message of type:', latestNotification.type);
          return [...prevMessages, latestNotification];
        });
      }
    }
  }, [notifications, streamId]);
  
  // Scroll to bottom when messages change if autoScroll is enabled
  useEffect(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, autoScroll]);
  
  // Handle scroll events to detect if user manually scrolled up
  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const isScrolledToBottom = scrollHeight - scrollTop - clientHeight < 50;
    
    // Only change autoScroll if it's different from current state
    if (autoScroll !== isScrolledToBottom) {
      setAutoScroll(isScrolledToBottom);
    }
  };
  
  const handleSendComment = () => {
    if (!commentInput.trim()) return;
    
    // Send the comment via socket
    const success = sendStreamComment(streamId, commentInput);
    
    if (success) {
      // Clear input after sending
      setCommentInput('');
      // Re-enable auto-scroll when sending a message
      setAutoScroll(true);
    }
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendComment();
    }
  };
  
  return (
    <div className="h-full flex flex-col bg-[#0D0F12] rounded-md overflow-hidden">
      <div className="py-3 border-b border-[#1E2329] mx-2 flex items-center justify-between">
        <h2 className="text-[#EFF0FA] font-inter font-medium text-base">Live Chat</h2>
        {!autoScroll && messages.length > 0 && (
          <button 
            onClick={() => {
              setAutoScroll(true);
              messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="text-xs bg-[#14AE5C] hover:bg-[#14AE5C90] text-white px-2 py-1 rounded-md transition-colors duration-200 flex items-center gap-1"
          >
            <Icon icon="mdi:arrow-down" className="w-3 h-3" />
            <span>Latest</span>
          </button>
        )}
      </div>
      
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto mx-2 max-h-[calc(100vh-350px)] pr-1 custom-scrollbar" 
        onScroll={handleScroll}
      >
        {messages.length > 0 ? (
          <div className="space-y-2 py-4">
            {messages.map((message) => (
              <ChatMessage key={message._id || message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center h-full">
            <div className="text-center space-y-4">
              <div className="w-16 xl:w-24 h-16 xl:h-24 mx-auto">
                <img src={ChatEmpty} alt="Chat" className="w-full h-full" />
              </div>
              <h3 className="text-[#EFF0FA] font-inter font-medium">Start a conversation</h3>
              <p className="text-[#7A828A] text-sm font-inter">
                There are no messages here yet. Start a conversation by sending a message.
              </p>
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-auto pt-4 mx-2 border-t border-[#1E2329]">
        <div className={`flex items-center gap-2 bg-[#161A1E] rounded-lg p-3 mb-1 transition-all duration-300 ${isInputFocused ? 'ring-1 ring-[#14AE5C]' : ''}`}>
          {
            seller?.storeAvatar?.url ? (
              <img src={seller?.storeAvatar.url} alt="User" className="w-8 h-8 rounded-full" />
            ) : (
              <Icon icon="hugeicons:user-circle" className="w-8 h-8" color="#EFF0FA" />
            )
          }
          <input
            type="text"
            placeholder="Write a comment..."
            className="flex-1 bg-transparent text-[#EFF0FA] placeholder-[#7A828A] text-sm font-inter focus:outline-none"
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            onKeyPress={handleKeyPress}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
          />
          <button 
            className={`text-[#14AE5C] ${!commentInput.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:text-[#0F8C48]'}`}
            onClick={handleSendComment}
            disabled={!commentInput.trim()}
          >
            <Icon icon="fa:send" className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

ChatSection.propTypes = {
  streamId: PropTypes.string.isRequired,
  seller: PropTypes.object,
  initialMessages: PropTypes.array,
  liveStreamDetails: PropTypes.object
};

export default ChatSection; 