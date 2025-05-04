import { Icon } from '@iconify/react';
import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useLivestreamSocket } from '../../Contexts/LivestreamSocketContext';
import MobileChatMessage from './MobileChatMessage';
import AuqliLogo from '../../assets/auqli-logo.png';

const StreamMobileUi = ({
    endStream,
    liveStreamDetails,
    streamDuration,
    formatTime,
    viewers = [],
    switchCamera,
    toggleMicrophone,
    isMicrophoneEnabled = true,
    onOpenVideoSettings
}) => {
    const { socket, notifications, sendStreamComment } = useLivestreamSocket();
    const [viewerCount, setViewerCount] = useState(viewers?.length || 0);
    const [commentInput, setCommentInput] = useState('');
    const [isInputFocused, setIsInputFocused] = useState(false);
    const [messages, setMessages] = useState([]);
    const messagesEndRef = useRef(null);
    const chatContainerRef = useRef(null);
    const [autoScroll, setAutoScroll] = useState(true);
    const [hasNewMessages, setHasNewMessages] = useState(false);
    const prevMessagesLengthRef = useRef(0);
    const [showCameraModal, setShowCameraModal] = useState(false);
    const [availableCameras, setAvailableCameras] = useState([]);
    const [isLoadingCameras, setIsLoadingCameras] = useState(false);
    
    // Subscribe to stream-specific notifications when component mounts
    useEffect(() => {
        if (liveStreamDetails?._id && socket?.subscribeToStreamNotifications) {
            console.log(`Mobile UI: Subscribing to notifications for stream ${liveStreamDetails._id}`);
            socket.subscribeToStreamNotifications(liveStreamDetails._id);
        }
        
        // Cleanup function to unsubscribe when component unmounts
        return () => {
            if (liveStreamDetails?._id && socket?.unsubscribeFromStreamNotifications) {
                console.log(`Mobile UI: Unsubscribing from notifications for stream ${liveStreamDetails._id}`);
                socket.unsubscribeFromStreamNotifications(liveStreamDetails._id);
            }
        };
    }, [liveStreamDetails, socket]);
    
    // Initialize messages from liveStreamDetails if available
    useEffect(() => {
        if (liveStreamDetails?.chatInteractions?.length > 0) {
            console.log('Initializing mobile chat messages from history:', liveStreamDetails.chatInteractions.length);
            setMessages(liveStreamDetails.chatInteractions);
            prevMessagesLengthRef.current = liveStreamDetails.chatInteractions.length;
        }
    }, [liveStreamDetails]);
    
    // Update messages when new notifications come in
    useEffect(() => {
        if (notifications.length > 0) {
            const latestNotification = notifications[notifications.length - 1];
            
            // Update viewer count for join/leave notifications
            if ((latestNotification.type === 'join' || latestNotification.type === 'leave') && 
                latestNotification.data?.viewerCount !== undefined) {
                setViewerCount(latestNotification.data.viewerCount);
            }
            
            // Only add notifications for the current stream
            if (latestNotification.data?.streamId === liveStreamDetails?._id) {
                // Avoid duplicates by checking if the notification ID already exists in messages
                setMessages(prevMessages => {
                    const messageExists = prevMessages.some(msg => 
                        msg.id === latestNotification.id || msg._id === latestNotification.id
                    );
                    if (messageExists) {
                        return prevMessages;
                    }
                    return [...prevMessages, latestNotification];
                });
            }
        }
    }, [notifications, liveStreamDetails]);
    
    // Check if new messages have arrived and the user is scrolled up
    useEffect(() => {
        if (messages.length > prevMessagesLengthRef.current && !autoScroll) {
            setHasNewMessages(true);
        }
        prevMessagesLengthRef.current = messages.length;
    }, [messages, autoScroll]);
    
    // Scroll to bottom when messages change if autoScroll is enabled
    useEffect(() => {
        if (autoScroll && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
            setHasNewMessages(false);
        }
    }, [messages, autoScroll]);
    
    // Handle scroll events to detect if user manually scrolled up
    const handleScroll = () => {
        if (!chatContainerRef.current) return;
        
        const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
        const isScrolledToBottom = scrollHeight - scrollTop - clientHeight < 50;
        
        if (autoScroll !== isScrolledToBottom) {
            setAutoScroll(isScrolledToBottom);
            
            // If we've scrolled to the bottom, clear the new messages indicator
            if (isScrolledToBottom) {
                setHasNewMessages(false);
            }
        }
    };
    
    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
            setAutoScroll(true);
            setHasNewMessages(false);
        }
    };
    
    const handleSendComment = () => {
        if (!commentInput.trim()) return;
        
        // Send the comment via socket
        const success = sendStreamComment(liveStreamDetails?._id, commentInput);
        
        if (success) {
            // Clear input after sending
            setCommentInput('');
            // Re-enable auto-scroll when sending a message
            setAutoScroll(true);
            setHasNewMessages(false);
        }
    };
    
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSendComment();
        }
    };
    
    const handleSwitchCamera = async () => {
        if (!switchCamera || typeof switchCamera !== 'function') {
            return;
        }

        setIsLoadingCameras(true);
        
        try {
            // Get list of available cameras
            const mediaDevices = await navigator.mediaDevices.enumerateDevices();
            const cameras = mediaDevices.filter(device => device.kind === 'videoinput');
            
            // Process camera information
            const processedCameras = cameras.map(camera => {
                const label = camera.label || 'Unknown Camera';
                let position = 'unknown';
                
                if (label.toLowerCase().includes('front') || 
                    label.toLowerCase().includes('user') || 
                    label.toLowerCase().includes('selfie')) {
                    position = 'front';
                } else if (label.toLowerCase().includes('back') || 
                          label.toLowerCase().includes('rear') || 
                          label.toLowerCase().includes('environment')) {
                    position = 'back';
                }
                
                return {
                    id: camera.deviceId,
                    label,
                    position
                };
            });
            
            setAvailableCameras(processedCameras);
            
            // If more than 2 cameras, show modal
            if (cameras.length > 1) {
                setShowCameraModal(true);
            } else {
                // Otherwise just switch directly
                switchCamera();
            }
        } catch (error) {
            console.error("Error enumerating camera devices:", error);
            // Fall back to direct switching
            switchCamera();
        } finally {
            setIsLoadingCameras(false);
        }
    };
    
    const handleCameraSelection = (cameraId) => {
        setShowCameraModal(false);
        if (switchCamera && typeof switchCamera === 'function') {
            switchCamera(cameraId);
        }
    };
    
    const handleToggleMicrophone = () => {
        if (toggleMicrophone && typeof toggleMicrophone === 'function') {
            toggleMicrophone();
        }
    };
    
    const handleEndStream = () => {
        if (endStream && typeof endStream === 'function') {
            endStream(false, false);
        }
    };
    
    const handleOpenVideoSettings = () => {
        if (onOpenVideoSettings && typeof onOpenVideoSettings === 'function') {
            onOpenVideoSettings();
        }
    };
    
    return (
        <div className="block xl:hidden">
            {/* Mobile Main Content - Stream Preview */}
            <div className="block xl:hidden fixed inset-0 bg-black">
                {/* Video container */}
                <div className="stream-container absolute inset-0">
                    <div
                        id="mobile-video-container"
                        className="h-full w-full bg-black object-cover"
                    ></div>
                    
                    {/* Top Bar - Absolutely positioned */}
                    <div className="absolute top-0 left-0 right-0 py-2 px-4 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent z-10">
                        <div className="flex items-center space-x-2">
                            <img src={AuqliLogo} alt="Auqli Logo" className="w-10 h-8 " />
                            <div className="bg-red-600 text-white text-xs px-2 py-0.5 rounded-md flex items-center">
                                <span className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></span>
                                <span>LIVE</span>
                            </div>
                            <span className="text-white text-sm">{formatTime?.(streamDuration) || "00:00:00"}</span>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center bg-black/40 rounded-full px-2 py-1">
                                <Icon icon="mdi:eye" className="text-white mr-1" />
                                <span className="text-white text-xs">{viewerCount}</span>
                            </div>
                            <button 
                                onClick={handleSwitchCamera}
                                className="w-8 h-8 flex items-center justify-center bg-black/40 rounded-full"
                                disabled={isLoadingCameras}
                            >
                                {isLoadingCameras ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <Icon icon="mdi:camera-flip" className="text-white text-lg" />
                                )}
                            </button>
                            <button 
                                onClick={handleToggleMicrophone}
                                className="w-8 h-8 flex items-center justify-center bg-black/40 rounded-full"
                            >
                                {isMicrophoneEnabled ? (
                                    <Icon icon="mdi:microphone" className="text-white text-lg" />
                                ) : (
                                    <Icon icon="mdi:microphone-off" className="text-white text-lg" />
                                )}
                            </button>
                            <button 
                                onClick={handleEndStream}
                                className="w-8 h-8 flex items-center justify-center bg-black/40 rounded-full"
                            >
                                <Icon icon="mdi:close" className="text-white text-lg" />
                            </button>
                        </div>
                    </div>
                    
                    {/* Live Chat Messages - Always visible */}
                    <div className="absolute bottom-16 left-0 right-0 pointer-events-auto z-10">
                        <div 
                            ref={chatContainerRef}
                            className="overflow-y-auto px-2 py-1 max-h-[40vh] [&::-webkit-scrollbar]:hidden bg-transparent"
                            onScroll={handleScroll}
                        >
                            <div className="space-y-1 py-2">
                                {messages.map((message) => (
                                    <MobileChatMessage key={message._id || message.id} message={message} />
                                ))}
                                <div ref={messagesEndRef} />
                            </div>
                        </div>
                        
                        {/* New Messages Button - Shows when new messages arrive and user is scrolled up */}
                        {hasNewMessages && (
                            <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 z-10">
                                <button 
                                    onClick={scrollToBottom}
                                    className=" backdrop-blur-md text-white px-4 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg animate-bounce-subtle border border-white/20 hover:bg-[#14AE5C]/40 transition-colors"
                                >
                                    <Icon icon="mdi:chevron-down" className="w-4 h-4" />
                                    <span className="text-xs font-medium">New Messages</span>
                                </button>
                            </div>
                        )}
                    </div>
                    
                    {/* Bottom Bar - Absolutely positioned */}
                    <div className="absolute bottom-0 left-0 right-0 py-2 px-2 bg-gradient-to-t from-black/70 to-transparent z-10">
                        <div className="flex items-center justify-between">
                            <button 
                                className="w-10 h-10 sm:w-10 sm:h-10 flex-shrink-0 flex items-center justify-center bg-black/40 rounded-full"
                            >
                                <Icon icon="mdi:shopping" className="text-white text-lg" />
                            </button>
                            
                            <div className="flex-1 mx-1 sm:mx-2 min-w-0">
                                <div
                                    className={`flex items-center bg-black/40 rounded-full overflow-hidden ${isInputFocused ? 'ring-1 ring-white/30' : ''}`}
                                    onClick={(e) => {
                                        // Prevent input losing focus when tapping container
                                        const inputElement = e.currentTarget.querySelector('input');
                                        if (inputElement) {
                                            inputElement.focus();
                                            e.stopPropagation();
                                        }
                                    }}
                                >
                                    <input
                                        type="text"
                                        placeholder="Send a message..."
                                        className="flex-1 min-w-0 bg-transparent text-white placeholder-white/50 text-sm px-4 sm:px-4 py-3 focus:outline-none"
                                        value={commentInput}
                                        onChange={(e) => setCommentInput(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        onFocus={() => setIsInputFocused(true)}
                                        onBlur={(e) => {
                                            // Only blur if the click was outside the parent container
                                            if (!e.currentTarget.parentElement.contains(e.relatedTarget)) {
                                                setIsInputFocused(false);
                                            }
                                        }}
                                    />
                                    <button 
                                        className={`px-2 sm:px-3 text-white/70 ${!commentInput.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:text-white'}`}
                                        onClick={handleSendComment}
                                        disabled={!commentInput.trim()}
                                    >
                                        <Icon icon="mdi:send" className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                            
                            <div className="flex items-center">
                                <button 
                                    className="w-10 h-10 sm:w-10 sm:h-10 flex-shrink-0 flex items-center justify-center bg-black/40 rounded-full"
                                >
                                    <Icon icon="mdi:dots-horizontal" className="text-white text-lg" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Camera Selection Modal */}
            {showCameraModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#1A1D21] rounded-xl w-full max-w-xs sm:max-w-sm overflow-hidden shadow-xl animate-zoom-in">
                        <div className="flex items-center justify-between p-4 border-b border-gray-700">
                            <h3 className="text-white text-lg font-medium">Select Camera</h3>
                            <button 
                                onClick={() => setShowCameraModal(false)}
                                className="text-gray-400 hover:text-white"
                            >
                                <Icon icon="mdi:close" className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <div className="p-2 max-h-[50vh] overflow-y-auto">
                            {availableCameras.map((camera) => (
                                <button
                                    key={camera.id}
                                    className="flex items-center w-full p-3 hover:bg-white/5 rounded-lg transition-colors text-left mb-1"
                                    onClick={() => handleCameraSelection(camera.id)}
                                >
                                    <div className="w-10 h-10 bg-[#2A2D35] rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                                        <Icon 
                                            icon={camera.position === 'front' ? 'mdi:camera-front' : camera.position === 'back' ? 'mdi:camera-rear' : 'mdi:camera'} 
                                            className="text-white text-xl"
                                        />
                                    </div>
                                    <div>
                                        <div className="text-white font-medium">{
                                            camera.position === 'front' ? 'Front Camera' : 
                                            camera.position === 'back' ? 'Back Camera' : 
                                            'Camera'
                                        }</div>
                                        <div className="text-gray-400 text-sm truncate max-w-[200px]">{camera.label}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                        
                        <div className="p-4 border-t border-gray-700">
                            <button
                                onClick={() => setShowCameraModal(false)} 
                                className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Add a CSS animation for subtle bounce effect
const style = document.createElement('style');
style.textContent = `
  @keyframes bounceSlight {
    0%, 100% { transform: translateY(0) translateX(-50%); }
    50% { transform: translateY(-4px) translateX(-50%); }
  }
  .animate-bounce-subtle {
    animation: bounceSlight 2s infinite ease-in-out;
  }
  @keyframes zoomIn {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
  .animate-zoom-in {
    animation: zoomIn 0.2s ease-out forwards;
  }
`;
document.head.appendChild(style);

StreamMobileUi.propTypes = {
    endStream: PropTypes.func,
    liveStreamDetails: PropTypes.object,
    isLiveStreamEndingButton1: PropTypes.bool,
    isLiveStreamEndingButton2: PropTypes.bool,
    streamDuration: PropTypes.number,
    formatTime: PropTypes.func,
    products: PropTypes.array,
    formatCurrency: PropTypes.func,
    seller: PropTypes.object,
    isToolsSidebarOpen: PropTypes.bool,
    setIsToolsSidebarOpen: PropTypes.func,
    viewers: PropTypes.array,
    totalShares: PropTypes.number,
    switchCamera: PropTypes.func,
    toggleMicrophone: PropTypes.func,
    isMicrophoneEnabled: PropTypes.bool,
    onOpenVideoSettings: PropTypes.func
};

export default StreamMobileUi;
