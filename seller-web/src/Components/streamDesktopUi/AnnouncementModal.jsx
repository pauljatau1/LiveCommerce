import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Icon } from '@iconify/react';
import { useLivestreamSocket } from '../../Contexts/LivestreamSocketContext';

// Debounce utility function outside component to avoid recreation
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

// Static timestamp formatter - memoized outside component
const createTimestampFormatter = () => {
  const cache = new Map();
  return (timestamp) => {
    if (!timestamp) return '';
    
    // Use cache for repeated timestamps
    if (cache.has(timestamp)) {
      return cache.get(timestamp);
    }
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    let result;
    if (diffInMinutes < 1) result = 'Just now';
    else if (diffInMinutes < 60) result = `${diffInMinutes}m ago`;
    else {
      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) result = `${diffInHours}h ago`;
      else {
        result = date.toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'short'
        });
      }
    }
    
    // Cache result
    cache.set(timestamp, result);
    
    // Clear cache periodically to prevent memory leaks
    if (cache.size > 100) {
      const entries = Array.from(cache.entries());
      entries.slice(0, 50).forEach(([key]) => cache.delete(key));
    }
    
    return result;
  };
};

// Memoized announcement item component
const AnnouncementItem = ({ announcement, seller, formatTimestamp }) => (
  <div 
    className={`bg-[#161A1E] rounded-lg p-4 border-l-4 ${
      announcement.current ? 'border-[#14AE5C]' : 'border-[#272A31]'
    }`}
  >
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0">
        {seller?.storeAvatar?.url ? (
          <img 
            src={seller.storeAvatar.url} 
            alt="Host" 
            className="w-10 h-10 rounded-full"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-[#14AE5C]/20 flex items-center justify-center">
            <Icon icon="heroicons:user" className="w-6 h-6 text-[#14AE5C]" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[#14AE5C] font-medium text-sm">
            {announcement.sellerName || seller?.storeName || 'Host'}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#14AE5C]/10 rounded-full text-xs text-[#14AE5C]">
            <Icon icon="heroicons:megaphone" className="w-3 h-3" />
            Host
          </span>
          {announcement.current && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#C74E5B]/10 rounded-full text-xs text-[#C74E5B]">
              <Icon icon="heroicons:exclamation-circle" className="w-3 h-3" />
              Live
            </span>
          )}
        </div>
        <p className="text-[#EFF0FA] text-sm leading-relaxed break-words">
          {announcement.content}
        </p>
        <p className="text-[#7A828A] text-xs mt-2">
          {formatTimestamp(announcement.timestamp)}
        </p>
      </div>
    </div>
  </div>
);

// PropTypes for AnnouncementItem
AnnouncementItem.propTypes = {
  announcement: PropTypes.shape({
    id: PropTypes.string,
    content: PropTypes.string,
    current: PropTypes.bool,
    sellerName: PropTypes.string,
    timestamp: PropTypes.string
  }).isRequired,
  seller: PropTypes.shape({
    storeName: PropTypes.string,
    storeAvatar: PropTypes.shape({
      url: PropTypes.string
    })
  }),
  formatTimestamp: PropTypes.func.isRequired
};

// Memoize the announcement item to prevent unnecessary re-renders
const MemoizedAnnouncementItem = React.memo(AnnouncementItem);

// Empty state component - static, no need to recreate
const EmptyState = () => (
  <div className="flex-1 flex flex-col items-center justify-center py-8">
    <div className="text-center space-y-4">
      <div className="w-16 h-16 mx-auto bg-[#161A1E] rounded-full flex items-center justify-center">
        <Icon icon="ic:outline-announcement" className="w-8 h-8 text-[#7A828A]" />
      </div>
      <h3 className="text-[#EFF0FA] font-inter font-medium">No announcements yet</h3>
      <p className="text-[#7A828A] text-sm font-inter max-w-xs">
        Start engaging with your audience by making your first announcement.
      </p>
    </div>
  </div>
);

const AnnouncementModal = ({ 
  isOpen, 
  onClose, 
  streamId, 
  seller, 
  liveStreamDetails 
}) => {
  const [announcements, setAnnouncements] = useState([]);
  const [announcementInput, setAnnouncementInput] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  
  const messagesEndRef = useRef(null);
  const announcementsContainerRef = useRef(null);
  const processedNotificationsRef = useRef(new Set());
  
  const { notifications, sendStreamAnnouncement } = useLivestreamSocket();

  // Create memoized timestamp formatter
  const formatTimestamp = useMemo(() => createTimestampFormatter(), []);

  // Initialize announcements from liveStreamDetails - optimized with functional update
  useEffect(() => {
    if (liveStreamDetails?.liveAnnouncements?.length > 0) {
      setAnnouncements(prevAnnouncements => {
        // Avoid unnecessary state updates if announcements are the same
        if (prevAnnouncements.length === liveStreamDetails.liveAnnouncements.length) {
          return prevAnnouncements;
        }
        return liveStreamDetails.liveAnnouncements;
      });
    }
  }, [liveStreamDetails?.liveAnnouncements]);

  // Optimized notification processing with ref-based duplicate detection
  useEffect(() => {
    if (notifications.length === 0) return;
    
    const latestNotification = notifications[notifications.length - 1];
    
    // Early return if already processed
    if (processedNotificationsRef.current.has(latestNotification.id)) return;
    
    // Only process announcement notifications for current stream
    if (latestNotification.type !== 'announcement' || 
        latestNotification.data?.streamId !== streamId) return;
    
    // Mark as processed immediately
    processedNotificationsRef.current.add(latestNotification.id);
    
    // Transform and add announcement using functional update
    const newAnnouncement = {
      id: latestNotification.id,
      content: latestNotification.content,
      current: latestNotification.data.current || false,
      sellerId: latestNotification.data.sellerId,
      sellerName: latestNotification.data.sellerName,
      timestamp: latestNotification.timestamp
    };

    setAnnouncements(prevAnnouncements => [...prevAnnouncements, newAnnouncement]);
    
    // Cleanup processed notifications periodically
    if (processedNotificationsRef.current.size > 200) {
      processedNotificationsRef.current.clear();
    }
  }, [notifications, streamId]);

  // Auto-scroll effect - optimized with dependency check
  useEffect(() => {
    if (autoScroll && messagesEndRef.current && announcements.length > 0) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [announcements.length, autoScroll]); // Only depend on length, not entire array

  // Debounced scroll handler - memoized
  const debouncedHandleScroll = useMemo(
    () => debounce(() => {
      if (!announcementsContainerRef.current) return;
      
      const { scrollTop, scrollHeight, clientHeight } = announcementsContainerRef.current;
      const isScrolledToBottom = scrollHeight - scrollTop - clientHeight < 50;
      
      // Only update if different to prevent unnecessary re-renders
      setAutoScroll(current => current === isScrolledToBottom ? current : isScrolledToBottom);
    }, 100),
    []
  );

  // Memoized event handlers
  const handleSendAnnouncement = useCallback(() => {
    if (!announcementInput.trim()) return;
    
    const success = sendStreamAnnouncement(streamId, announcementInput);
    
    if (success) {
      setAnnouncementInput('');
      setAutoScroll(true);
    }
  }, [announcementInput, sendStreamAnnouncement, streamId]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      handleSendAnnouncement();
    }
  }, [handleSendAnnouncement]);

  const handleInputChange = useCallback((e) => {
    setAnnouncementInput(e.target.value);
  }, []);

  const handleInputFocus = useCallback(() => setIsInputFocused(true), []);
  const handleInputBlur = useCallback(() => setIsInputFocused(false), []);

  const handleScrollToBottom = useCallback(() => {
    setAutoScroll(true);
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Memoized computed values
  const hasAnnouncements = announcements.length > 0;
  const shouldShowScrollButton = !autoScroll && hasAnnouncements;
  const isInputDisabled = !announcementInput.trim();

  // Memoized seller avatar JSX
  const sellerAvatar = useMemo(() => (
    seller?.storeAvatar?.url ? (
      <img 
        src={seller.storeAvatar.url} 
        alt="Host" 
        className="w-8 h-8 rounded-full flex-shrink-0"
      />
    ) : (
      <div className="w-8 h-8 rounded-full bg-[#14AE5C]/20 flex items-center justify-center flex-shrink-0">
        <Icon icon="heroicons:user" className="w-5 h-5 text-[#14AE5C]" />
      </div>
    )
  ), [seller?.storeAvatar?.url]);

  // Early return if not open
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-[#0D0F12] border border-[#272A31] rounded-xl w-full max-w-2xl h-[70vh] flex flex-col">
        {/* Header - static, no need to memoize */}
        <div className="p-4 md:p-6 flex items-center justify-between border-b border-[#272A31]">
          <div className="flex items-center gap-3">
            <div className="bg-[#14AE5C]/10 p-2 rounded-full">
              <Icon icon="ic:outline-announcement" className="w-6 h-6 text-[#14AE5C]" />
            </div>
            <h2 className="text-[#EFF0FA] font-lexend font-bold text-xl">Live Announcements</h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#7A828A] hover:text-white transition-colors"
          >
            <Icon icon="heroicons:x-mark" className="w-6 h-6" />
          </button>
        </div>

        {/* Announcements List */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div 
            ref={announcementsContainerRef}
            className="flex-1 overflow-y-auto px-4 md:px-6 custom-scrollbar"
            onScroll={debouncedHandleScroll}
          >
            {hasAnnouncements ? (
              <div className="space-y-4 py-4">
                {announcements.map((announcement) => (
                  <MemoizedAnnouncementItem
                    key={announcement.id}
                    announcement={announcement}
                    seller={seller}
                    formatTimestamp={formatTimestamp}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>
            ) : (
              <EmptyState />
            )}
          </div>

          {/* Auto-scroll indicator - conditional rendering optimized */}
          {shouldShowScrollButton && (
            <div className="px-4 md:px-6 py-2">
              <button 
                onClick={handleScrollToBottom}
                className="text-xs bg-[#14AE5C] hover:bg-[#14AE5C90] text-white px-3 py-2 rounded-md transition-colors duration-200 flex items-center gap-1 mx-auto"
              >
                <Icon icon="mdi:arrow-down" className="w-3 h-3" />
                <span>Latest announcements</span>
              </button>
            </div>
          )}
        </div>

        {/* Input Section */}
        <div className="border-t border-[#272A31] p-4 md:p-6">
          <div className={`flex items-center gap-3 bg-[#161A1E] rounded-lg p-3 transition-all duration-300 ${
            isInputFocused ? 'ring-1 ring-[#14AE5C]' : ''
          }`}>
            {sellerAvatar}
            <input
              type="text"
              placeholder="Write an announcement..."
              className="flex-1 bg-transparent text-[#EFF0FA] placeholder-[#7A828A] text-sm font-inter focus:outline-none"
              value={announcementInput}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
            />
            <button 
              className={`text-[#14AE5C] p-1 ${
                isInputDisabled
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:text-[#0F8C48] hover:bg-[#14AE5C]/10 rounded'
              } transition-colors duration-200`}
              onClick={handleSendAnnouncement}
              disabled={isInputDisabled}
            >
              <Icon icon="heroicons:paper-airplane" className="w-5 h-5" />
            </button>
          </div>
          <p className="text-[#7A828A] text-xs mt-2 flex items-center gap-1">
            <Icon icon="heroicons:information-circle" className="w-3 h-3" />
            Your announcement will be visible to all viewers in the stream
          </p>
        </div>
      </div>
    </div>
  );
};

AnnouncementModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  streamId: PropTypes.string.isRequired,
  seller: PropTypes.object,
  liveStreamDetails: PropTypes.object
};

// Memoize the entire component to prevent unnecessary re-renders
export default React.memo(AnnouncementModal); 