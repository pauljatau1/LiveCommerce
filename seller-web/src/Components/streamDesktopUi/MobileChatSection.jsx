import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Icon } from '@iconify/react';
import { useLivestreamSocket } from '../../Contexts/LivestreamSocketContext';
import MobileChatMessage from './MobileChatMessage';

const MobileChatSection = ({ streamId, seller, liveStreamDetails, onClose }) => {
  // Initialize messages with chatInteractions from liveStreamDetails if available
  const [messages, setMessages] = useState(() => {
    // Check if liveStreamDetails has chatInteractions
    if (liveStreamDetails?.chatInteractions?.length > 0) {
      return liveStreamDetails.chatInteractions.filter(msg => msg.type !== 'announcement');
    }
    return [];
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
      console.log(`MobileChatSection: Subscribing to notifications for stream ${streamId}`);
      subscribeToStreamNotifications(streamId);
    }
  }, [streamId, subscribeToStreamNotifications]);
  
  // Update messages when liveStreamDetails or chatInteractions change
  useEffect(() => {
    if (liveStreamDetails?.chatInteractions?.length > 0) {
      const filteredMessages = liveStreamDetails.chatInteractions.filter(msg => msg.type !== 'announcement');
      console.log('Initializing mobile chat messages from history:', filteredMessages.length);
      setMessages(filteredMessages);
    }
  }, [liveStreamDetails]);
  
  // Update messages when new notifications come in
  useEffect(() => {
    if (notifications.length > 0) {
      const latestNotification = notifications[notifications.length - 1];
      
      // Only add notifications for the current stream and exclude announcements
      if (latestNotification.data?.streamId === streamId && latestNotification.type !== 'announcement') {
        // Avoid duplicates by checking if the notification ID already exists in messages
        setMessages(prevMessages => {
          const messageExists = prevMessages.some(msg => msg.id === latestNotification.id || msg._id === latestNotification.id);
          if (messageExists) {
            return prevMessages;
          }
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
    <div className="h-full flex flex-col overflow-hidden">
      {/* Chat Header */}
      <div className="py-3 px-4 flex items-center justify-between bg-black/80">
        <div className="flex items-center space-x-2">
          <h2 className="text-white font-medium text-lg">Live Chat</h2>
          <div className="bg-[#14AE5C]/20 text-[#14AE5C] text-xs px-2 py-0.5 rounded-full">
            {messages.length} messages
          </div>
        </div>
        
        {!autoScroll && messages.length > 0 && (
          <button 
            onClick={() => {
              setAutoScroll(true);
              messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="text-xs bg-[#14AE5C] hover:bg-[#14AE5C90] text-white px-2 py-1 rounded-full flex items-center gap-1"
          >
            <Icon icon="mdi:arrow-down" className="w-3 h-3" />
            <span>Latest</span>
          </button>
        )}
        
        <button 
          onClick={onClose}
          className="text-white/70 hover:text-white"
        >
          <Icon icon="mdi:close" className="text-xl" />
        </button>
      </div>
      
      {/* Chat Messages */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-2 py-1 [&::-webkit-scrollbar]:hidden bg-black/60" 
        onScroll={handleScroll}
      >
        {messages.length > 0 ? (
          <div className="space-y-1 [&::-webkit-scrollbar]:hidden py-2">
            {messages.map((message) => (
              <MobileChatMessage key={message._id || message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center h-full">
            <div className="text-center space-y-2 px-4">
              <Icon icon="mdi:chat-outline" className="w-12 h-12 mx-auto text-white/30" />
              <h3 className="text-white font-medium">No messages yet</h3>
              <p className="text-white/50 text-sm">
                Be the first to send a message
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

MobileChatSection.propTypes = {
  streamId: PropTypes.string.isRequired,
  seller: PropTypes.object,
  liveStreamDetails: PropTypes.object,
  onClose: PropTypes.func.isRequired
};

export default MobileChatSection; 