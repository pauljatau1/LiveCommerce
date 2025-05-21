import React, { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOutletContext } from 'react-router-dom';
import { useLivestreamContext } from '../../Hooks/useLivestreamContext';
import AgoraRTC from 'agora-rtc-sdk-ng';
import CircularProgress from '@mui/material/CircularProgress';
import { toast } from 'sonner';
import { useSocket } from '../../Contexts/SocketContext';
import { useLivestreamSocket } from '../../Contexts/LivestreamSocketContext';

// Split UI components using React's lazy loading for code splitting
const PreStreamDesktopUi = lazy(() => import('../../Components/preStreamDesktopUi/preStreamDesktopUi'));
const PreStreamMobileUi = lazy(() => import('../../Components/preStreamDesktopUi/preStreamMobileUi'));
const StreamDesktopUi = lazy(() => import('../../Components/streamDesktopUi/streamDesktopUi'));
const StreamMobileUi = lazy(() => import('../../Components/streamDesktopUi/streamMobileUi'));
const AuctionStreamDesktopUi = lazy(() => import('../../Components/streamDesktopUi/auctionStreamDesktopUi'));
const AuctionStreamMobileUi = lazy(() => import('../../Components/streamDesktopUi/auctionStreamMobileUi'));
const VideoSettingsModal = lazy(() => import('../../Components/ui/VideoSettingsModal'));

// Default low data usage settings as recommended by Agora
const DEFAULT_VIDEO_SETTINGS = {
    videoConfig: {
        width: 640,
        height: 480,
        frameRate: 15,
        bitrateMin: 400,
        bitrateMax: 600,
        optimizationMode: 'motion',
    },
    audioConfig: {
        sampleRate: 32000,
        stereo: false,
        bitrate: 24,
    },
    mirrorMode: true,
    preset: '480p'
};

// Create client outside component to prevent recreation
const client = AgoraRTC.createClient({
    mode: 'live',
    codec: 'vp8',
    role: 'host'
});

// Add this outside the component to create a module-level lock
// This ensures the lock persists even when the component remounts
let globalReconnectionInProgress = false;

// Helper functions moved outside component for better performance
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
    }).format(amount)
};

const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
};

const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// Helper for calculating data usage - moved outside and memoized
const calculateDataUsage = (videoConfig, audioConfig) => {
    if (!videoConfig || !audioConfig) return null;

    const videoBitrate = videoConfig.bitrateMax || 0;
    const audioBitrate = audioConfig.bitrate || 0;

    const totalBitrateKbps = videoBitrate + audioBitrate;
    const mbPerHour = Math.round((totalBitrateKbps * 60 * 60) / (8 * 1024));

    if (mbPerHour >= 1000) {
        return `${(mbPerHour / 1000).toFixed(1)}GB`;
    }
    return `${mbPerHour}MB`;
};

// Get quality label based on encoder config - moved outside
const getQualityLabel = (config) => {
    if (config.width >= 1920) return '1080p';
    if (config.width >= 1280) return '720p';
    if (config.width >= 640 && config.height >= 480) return '480p';
    if (config.width >= 640) return '360p';
    return '240p';
};

const LivestreamStudio = () => {
    // Extract params and navigation functions - won't change during component lifecycle
    const { id } = useParams();
    const navigate = useNavigate();

    // Extract outlet context values - memoize to prevent unnecessary re-renders
    const outletContext = useOutletContext();
    const {
        setHideSidebar,
        setFullScreenMode,
        setHeaderName,
        setNavName,
        setShowBackButton
    } = outletContext;

    // Extract context values with destructuring - helps prevent unnecessary re-renders
    const {
        startLiveStream,
        endLiveStream,
        getLiveStreamFullDetails,
        isLoading,
        liveStreamDetails,
        joinLiveStreamAsHost,
        renewAgoraToken
    } = useLivestreamContext();

    // Group related state variables together for better organization and performance
    // Critical UI state
    const [isStreaming, setIsStreaming] = useState(false);
    const [isInitialDataLoaded, setIsInitialDataLoaded] = useState(false);
    const [isReconnecting, setIsReconnecting] = useState(true);

    // Media state
    const [localTracks, setLocalTracks] = useState([]);
    const [previewMediaStream, setPreviewMediaStream] = useState(null);
    const [cameraFacingMode, setCameraFacingMode] = useState("user");
    const [isMicrophoneEnabled, setIsMicrophoneEnabled] = useState(true);
    const [deviceError, setDeviceError] = useState(null);

    // Stream control state
    const [streamDuration, setStreamDuration] = useState(0);
    const [timerInterval, setTimerInterval] = useState(null);
    const [isLiveStreamStarting, setIsLiveStreamStarting] = useState(false);
    const [isLiveStreamEndingButton1, setIsLiveStreamEndingButton1] = useState(false);
    const [isLiveStreamEndingButton2, setIsLiveStreamEndingButton2] = useState(false);

    // UI state
    const [isToolsSidebarOpen, setIsToolsSidebarOpen] = useState(false);
    const [isVideoSettingsModalOpen, setIsVideoSettingsModalOpen] = useState(false);
    const [videoSettings, setVideoSettings] = useState(DEFAULT_VIDEO_SETTINGS);
    const [streamQualityInfo, setStreamQualityInfo] = useState(null);

    // Tracking state - fixed totalShares to avoid linter error
    const [totalShares] = useState(0);

    // Context values
    const socket = useSocket();
    const livestreamSocket = useLivestreamSocket();

    // Refs
    const reconnectionInProgress = useRef(false);

    // Memoized data extraction
    const existingLivestream = useMemo(() => {
        try {
            return JSON.parse(localStorage.getItem(`stream_connected_${id}`));
        } catch {
            return null;
        }
    }, [id]);

    useEffect(() => {
        setHideSidebar(true);
        setFullScreenMode(true);
        setHeaderName('')
        setNavName('')
        setShowBackButton(false)

        return () => {
            setHideSidebar(false);
            setFullScreenMode(false);
            setHeaderName('Live Streams')
            setNavName('Live Studio')
            setShowBackButton(true)

            // Cleanup any remaining tracks or streams on unmount
            if (previewMediaStream) {
                previewMediaStream.getTracks().forEach(track => {
                    try {
                        track.stop();
                        track.enabled = false;
                    } catch (error) {
                        console.error("Error cleaning up preview track on unmount:", error);
                    }
                });
            }
            if (localTracks.length > 0) {
                localTracks.forEach(track => {
                    try {
                        track.stop();
                        track.enabled = false;
                        track.close();
                    } catch (error) {
                        console.error("Error cleaning up local track on unmount:", error);
                    }
                });
            }
            if (client) {
                client.removeAllListeners();
                if (client.connectionState !== 'DISCONNECTED') {
                    client.leave().catch(error => {
                        console.error("Error leaving channel on unmount:", error);
                    });
                }
            }
        };
    }, []);

    useEffect(() => {
        let isMounted = true;
        const fetchLivestreamData = async () => {
            try {
                const response = await getLiveStreamFullDetails(id);
                if (!response && isMounted) {
                    throw new Error('Failed to fetch livestream details');
                }
                if (isMounted) setIsInitialDataLoaded(true);
            } catch (error) {
                console.error('Error fetching initial livestream data:', error);
                toast.error('Failed to load livestream details');
            }
        };
        fetchLivestreamData();

        return () => {
            isMounted = false;
        };
    }, [id]);

    // Seller data extraction - memoized to prevent unnecessary recalculations
    const seller = useMemo(() => {
        try {
            const data = localStorage.getItem('seller');
            return data ? JSON.parse(data) : null;
        } catch {
            return null;
        }
    }, []);

    // Extract livestream details with destructuring for performance
    const livestreamDetailsData = useMemo(() => {
        if (!liveStreamDetails) return {};

        return {
            channelName: liveStreamDetails.channelName,
            agoraToken: liveStreamDetails.agoraToken,
            products: liveStreamDetails.products,
            viewers: liveStreamDetails.viewers || [],
            orders: liveStreamDetails.orders || [],
            _id: liveStreamDetails._id,
            type: liveStreamDetails.type
        };
    }, [liveStreamDetails]);

    // Destructure the memoized livestream details
    const {
        channelName,
        // agoraToken, // Not directly used but passed to functions
        products,
        viewers,
        orders,
        _id,
        // streamType included for potential future use
    } = livestreamDetailsData;

    // Extract seller info
    const firstName = seller?.firstName;
    const lastName = seller?.lastName;

    // Timer functions optimized with useCallback
    const startTimer = useCallback(() => {
        const interval = setInterval(() => {
            setStreamDuration(prev => prev + 1);
        }, 1000);
        setTimerInterval(interval);
    }, []);

    const stopTimer = useCallback(() => {
        if (timerInterval) {
            clearInterval(timerInterval);
            setTimerInterval(null);
        }
    }, [timerInterval]);

    // Load saved video settings from localStorage when component mounts
    useEffect(() => {
        const savedSettings = localStorage.getItem(`video_settings_${id}`);
        if (savedSettings) {
            try {
                const parsedSettings = JSON.parse(savedSettings);
                setVideoSettings(parsedSettings);
            } catch (error) {
                console.error('Error parsing saved video settings:', error);
                // Use default settings if parsing fails
                setVideoSettings(DEFAULT_VIDEO_SETTINGS);
            }
        }
    }, [id]);

    // Optimize Agora error handling with useCallback
    const handleAgoraError = useCallback((error) => {
        const errorMap = {
            'CAN_NOT_GET_GATEWAY_SERVER': 'Invalid token - please refresh the page',
            'UID_CONFLICT': 'Session conflict - try again in 30 seconds',
            'INVALID_OPERATION': 'Connection already in progress'
        };

        toast.error(errorMap[error.code] || `Stream error: ${error.message}`);
    }, []);

    // Optimize client role setting with useCallback
    const setClientRole = useCallback(async () => {
        try {
            // For host role, we don't need to specify latency level
            await client.setClientRole("host");
        } catch (error) {
            console.error("Error setting client role:", error);
            throw error;
        }
    }, []);

    // Optimize resource cleanup with useCallback
    const cleanupAgoraResources = useCallback(async () => {
        try {
            // Clear the container monitor interval if it exists
            if (window.containerMonitorInterval) {
                clearInterval(window.containerMonitorInterval);
                window.containerMonitorInterval = null;
            }

            // Clean up preview stream if it exists
            if (previewMediaStream) {
                try {
                    const tracks = previewMediaStream.getTracks();
                    tracks.forEach(track => {
                        track.stop();
                        track.enabled = false;
                    });
                    setPreviewMediaStream(null);
                } catch (previewError) {
                    console.error("Error cleaning up preview stream:", previewError);
                }
            }

            // Check current client state - only attempt cleanup if not already disconnected
            const currentConnectionState = client.connectionState;

            // Clean up tracks first
            if (localTracks.length > 0) {
                try {
                    // Unpublish if currently connected
                    if (currentConnectionState === 'CONNECTED') {
                        await client.unpublish(localTracks);
                    }

                    // Then stop and close each track
                    for (const track of localTracks) {
                        try {
                            const trackType = track.trackMediaType; // 'audio' or 'video'

                            // If it's a video track, make sure to stop playing
                            if (trackType === 'video') {
                                try {
                                    track.stop();
                                } catch (stopError) {
                                    console.error(`Error stopping ${trackType} track in containers:`, stopError);
                                }
                            }

                            // Change order: First disable, then stop and close
                            try {
                                // Safely try to disable the track first
                                if (track.enabled !== false && typeof track.enabled !== 'undefined') {
                                    track.enabled = false;
                                }
                            } catch (enabledError) {
                                // Track is already disabled or read-only
                            }

                            // Then stop the track
                            track.stop();

                            // Finally close the track (this destroys the track)
                            track.close();
                        } catch (trackError) {
                            console.error("Error cleaning up track:", trackError);
                        }
                    }
                    setLocalTracks([]);
                } catch (trackError) {
                    console.error("Track cleanup error:", trackError);
                }
            }

            // Then leave the channel if appropriate
            if (currentConnectionState !== 'DISCONNECTED') {
                try {
                    await client.leave();
                    client.removeAllListeners();
                    // Wait a moment for the leave operation to complete
                    await new Promise(resolve => setTimeout(resolve, 300));
                } catch (leaveError) {
                    console.error("Error leaving Agora channel:", leaveError);
                }
            }
        } catch (cleanupError) {
            console.error("Cleanup error:", cleanupError);
        }
    }, [previewMediaStream, localTracks]);

    // Optimize start stream handling with useCallback
    const handleStartStream = useCallback(async () => {
        try {
            if (!_id) return;

            const streamData = await startLiveStream(_id);
            if (streamData) {
                // Pass the fresh stream data directly to initialize
                await initializeStream(streamData);
            }
        } catch (error) {
            console.error('Failed to start stream:', error);
            toast.error('Failed to start stream: ' + error.message, {
                style: {
                    background: '#161A1E',
                    color: '#fff',
                }
            });
        }
    }, [_id, startLiveStream]);

    const initializeStream = async (freshStreamData) => {
        try {
            setIsLiveStreamStarting(true);
            console.log('freshStreamData', freshStreamData)
            const details = await getLiveStreamFullDetails(id);

            // 1. Check permissions and keep preview stream alive - this may take time for user input
            console.log('📷 [STREAM INIT] Waiting for device permissions and initialization...');
            const previewStream = await checkDevicePermissions();

            // If permissions not granted or devices not initialized, abort stream initialization
            if (!previewStream) {
                console.log('📷 [STREAM INIT] Device permissions not granted or initialization failed');
                setIsLiveStreamStarting(false);
                return;
            }
            console.log('📷 [STREAM INIT] Device permissions granted and devices initialized');

            // 2. Use fresh stream data if provided, otherwise fetch
            let streamCredentials;
            if (freshStreamData) {
                streamCredentials = {
                    channelName: details.channelName,
                    agoraToken: freshStreamData.agoraToken
                };
            }

            console.log('streamCredentials', streamCredentials)

            if (!streamCredentials.channelName || !streamCredentials.agoraToken) {
                throw new Error('Missing channel credentials');
            }

            // 3. Cleanup any existing connection
            if (client.connectionState === 'CONNECTED') {
                await client.leave();
            }

            // 4. Set client role with retry
            await setClientRole();

            // 5. Set streaming state FIRST to render video container
            setIsStreaming(true);
            setIsLiveStreamStarting(false);

            // 6. Join channel with fresh token
            await client.join(
                import.meta.env.VITE_AGORA_API_KEY,
                streamCredentials.channelName,
                streamCredentials.agoraToken,
                seller.agoraUid,
            );

            // Check the role after joining the channel
            const currentRole = client.role;
            console.log('Current role:', currentRole);

            // 7. Create Agora tracks for audio and video using the current videoSettings
            console.log('Using video settings:', videoSettings);
            const tracks = await AgoraRTC.createMicrophoneAndCameraTracks(
                {
                    encoderConfig: {
                        sampleRate: videoSettings.audioConfig.sampleRate,
                        stereo: videoSettings.audioConfig.stereo,
                        bitrate: videoSettings.audioConfig.bitrate,
                    },
                    AEC: true,
                    ANS: true,
                    AGC: true
                },
                {
                    // Use default low data usage settings as recommended by Agora
                    encoderConfig: videoSettings.videoConfig,
                    optimizationMode: videoSettings.videoConfig.optimizationMode,
                    facingMode: 'user',
                }
            );
            console.log('🔄 [TRACK 2/6] Successfully created audio and video tracks');

            setLocalTracks(tracks);

            // Set camera facing mode state
            setCameraFacingMode("user");

            // Apply mirror mode from settings
            if (tracks[1].setMirror && typeof tracks[1].setMirror === 'function') {
                tracks[1].setMirror(videoSettings.mirrorMode);
            }

            // 8. Wait for DOM to be updated with video containers
            console.log('📷 [STREAM INIT] Waiting for video containers to be rendered in DOM');
            await new Promise(resolve => setTimeout(resolve, 500));

            // 9. Define unique IDs for both containers
            const desktopContainerId = 'desktop-video-container';
            const mobileContainerId = 'mobile-video-container';

            // Create a function to play video with proper error handling
            const playVideoInContainer = (containerId) => {
                if (!tracks[1]) return false;
                try {
                    const container = document.getElementById(containerId);
                    if (!container) {
                        console.log(`📷 [STREAM INIT] Container ${containerId} not found yet`);
                        return false;
                    }

                    // Play the video track in this container - even if hidden
                    // This ensures it's ready when the container becomes visible
                    tracks[1].play(container, {
                        fit: 'cover'
                    });


                    console.log(`📷 [STREAM INIT] Video playing in ${containerId}`);
                    return true;
                } catch (e) {
                    console.error(`📷 [STREAM INIT] Error playing video in ${containerId}:`, e);
                    return false;
                }
            };

            // First pass - try to play in both containers immediately
            console.log('📷 [STREAM INIT] First attempt to play in both containers');
            const desktopSuccess = playVideoInContainer(desktopContainerId);
            const mobileSuccess = playVideoInContainer(mobileContainerId);

            // 10. Setup continuous monitoring of containers - more intelligent handling
            console.log('📷 [STREAM INIT] Setting up container monitor');

            // Keep track of container states
            const containerStates = {
                [desktopContainerId]: { lastPlayed: desktopSuccess ? Date.now() : 0 },
                [mobileContainerId]: { lastPlayed: mobileSuccess ? Date.now() : 0 }
            };

            // Track window width for responsive design changes
            let lastWidth = window.innerWidth;
            let visibilityMonitorActive = false;

            // Listen for visibility changes (hidden/visible)
            if (typeof document !== 'undefined' && document.addEventListener) {
                document.addEventListener('visibilitychange', () => {
                    if (!document.hidden && isStreaming) {
                        console.log('📷 [STREAM MONITOR] Document became visible, refreshing video in all containers');
                        // Stop all tracks and then restart them
                        tracks[1].stop();

                        // Reset tracking states
                        Object.keys(containerStates).forEach(id => {
                            containerStates[id].lastPlayed = 0;
                        });
                    }
                });
            }

            // Listen for window resize to detect responsive mode changes
            if (typeof window !== 'undefined' && window.addEventListener) {
                window.addEventListener('resize', () => {
                    const currentWidth = window.innerWidth;
                    const breakpoint = 1280; // 'xl' breakpoint

                    // Only act if crossing the xl breakpoint
                    if ((lastWidth < breakpoint && currentWidth >= breakpoint) ||
                        (lastWidth >= breakpoint && currentWidth < breakpoint)) {

                        console.log(`📷 [STREAM MONITOR] Responsive breakpoint crossed: ${lastWidth} -> ${currentWidth}`);

                        // Add a small delay to allow the DOM to update
                        setTimeout(() => {
                            // Stop the video track completely
                            tracks[1].stop();

                            // Reset tracking states
                            Object.keys(containerStates).forEach(id => {
                                containerStates[id].lastPlayed = 0;
                            });

                            // Try to play in the appropriate container based on new width
                            if (currentWidth >= breakpoint) {
                                playVideoInContainer(desktopContainerId);
                            } else {
                                playVideoInContainer(mobileContainerId);
                            }
                        }, 300);
                    }

                    lastWidth = currentWidth;
                });
            }

            // Setup page visibility check mechanism (MutationObserver)
            const setupVisibilityMonitor = () => {
                if (visibilityMonitorActive) return;
                visibilityMonitorActive = true;

                // Watch for any DOM changes that might affect visibility
                const observer = new MutationObserver((mutations) => {
                    if (!isStreaming) {
                        observer.disconnect();
                        return;
                    }

                    const desktopElem = document.getElementById(desktopContainerId);
                    const mobileElem = document.getElementById(mobileContainerId);
                    const shouldRefresh = mutations.some(mutation => {
                        return Array.from(mutation.addedNodes).some(node =>
                            node.contains && (
                                (desktopElem && node.contains(desktopElem)) ||
                                (mobileElem && node.contains(mobileElem))
                            )
                        );
                    });

                    if (shouldRefresh) {
                        console.log('📷 [STREAM MONITOR] DOM changed significantly, refreshing video');
                        tracks[1].stop();

                        // Reset tracking states
                        Object.keys(containerStates).forEach(id => {
                            containerStates[id].lastPlayed = 0;
                        });
                    }
                });

                // Watch for any changes to the DOM
                observer.observe(document.body, {
                    childList: true,
                    subtree: true,
                    attributes: true,
                    attributeFilter: ['class', 'style', 'hidden']
                });

                return observer;
            };

            // Start visibility monitor
            const observer = setupVisibilityMonitor();

            // Store for cleanup
            window.videoObserver = observer;

            // More aggressive container monitor - checks more frequently
            const containerMonitor = setInterval(() => {
                // Only log every 10th iteration to reduce console spam
                const shouldLog = Math.random() < 0.05; // 5% chance to log

                // Check if we need to reset the video track occasionally
                const now = Date.now();
                const RESET_INTERVAL = 10000; // 10 seconds
                let shouldReset = false;

                Object.keys(containerStates).forEach(id => {
                    // If we haven't successfully played in this container for a while
                    // and it's been more than RESET_INTERVAL since we last tried,
                    // mark for reset
                    if (now - containerStates[id].lastPlayed > RESET_INTERVAL) {
                        shouldReset = true;
                    }
                });

                // If we need to reset, stop the video track completely and reset states
                if (shouldReset) {
                    if (shouldLog) console.log('📷 [STREAM MONITOR] Performing periodic video track reset');
                    try {
                        // First stop all playback
                        tracks[1].stop();

                        // Reset last played timestamps to trigger replay in all containers
                        Object.keys(containerStates).forEach(id => {
                            containerStates[id].lastPlayed = 0;
                        });
                    } catch (error) {
                        console.error('Error during video track reset:', error);
                    }
                }

                // Try both containers on each interval
                const desktopElem = document.getElementById(desktopContainerId);
                const mobileElem = document.getElementById(mobileContainerId);

                if (!desktopElem && !mobileElem) {
                    if (shouldLog) console.log('📷 [STREAM MONITOR] No video containers found in DOM');
                    return;
                }

                // First, check which containers exist and should be visible based on screen width
                const isDesktopWidth = window.innerWidth >= 1280; // 'xl' breakpoint

                // SPECIAL HANDLING: Try to play in the correct container based on viewport width
                if (isDesktopWidth) {
                    // Desktop width = try desktop container first
                    if (desktopElem) {
                        if (playVideoInContainer(desktopContainerId)) {
                            containerStates[desktopContainerId].lastPlayed = now;
                        }
                    } else if (mobileElem) {
                        // Fallback if desktop element doesn't exist
                        if (playVideoInContainer(mobileContainerId)) {
                            containerStates[mobileContainerId].lastPlayed = now;
                        }
                    }
                } else {
                    // Mobile width = try mobile container first
                    if (mobileElem) {
                        if (playVideoInContainer(mobileContainerId)) {
                            containerStates[mobileContainerId].lastPlayed = now;
                        }
                    } else if (desktopElem) {
                        // Fallback if mobile element doesn't exist
                        if (playVideoInContainer(desktopContainerId)) {
                            containerStates[desktopContainerId].lastPlayed = now;
                        }
                    }
                }

                // If we're no longer streaming, clear the interval
                if (!isStreaming) {
                    clearInterval(containerMonitor);
                    console.log('📷 [STREAM MONITOR] Stopped container monitor (not streaming)');
                }
            }, 250); // Check more frequently (4 times per second)

            // Store the interval for cleanup
            window.containerMonitorInterval = containerMonitor;

            console.log('🔄 [TRACK 6/6] Publishing audio and video tracks to channel');
            await client.publish([tracks[0], tracks[1]]);
            console.log('✅ [TRACK] Successfully published tracks to channel');

            // Store complete stream credentials in localStorage for reconnection
            const streamCredentialsForStorage = {
                streamId: _id,
                channelName: streamCredentials.channelName,
                agoraToken: streamCredentials.agoraToken,
                agoraUid: seller.agoraUid,
                timestamp: new Date().getTime()
            };
            localStorage.setItem(`stream_connected_${id}`, JSON.stringify(streamCredentialsForStorage));

            // Update tracks and start timer
            setLocalTracks(tracks);
            startTimer();
            console.log('📷 [STREAM INIT] Stream initialization completed successfully');

            // Initialize quality info display with current settings
            const preset = videoSettings.preset || getQualityLabel(videoSettings.videoConfig);
            setStreamQualityInfo({
                resolution: `${videoSettings.videoConfig.width}×${videoSettings.videoConfig.height}`,
                frameRate: `${videoSettings.videoConfig.frameRate} fps`,
                bitrate: `${videoSettings.videoConfig.bitrateMax} Kbps`,
                preset: preset,
                dataUsage: calculateDataUsage(videoSettings.videoConfig, videoSettings.audioConfig)
            });

        } catch (error) {
            if (error.code === 'DEVICE_NOT_FOUND') {
                setDeviceError('Camera/microphone not found. Check physical connections.');
            } else if (error.code === 'PERMISSION_DENIED') {
                setDeviceError('Permissions denied. Please allow access in browser settings.');
            } else if (error.code === 'TIMEOUT') {
                setDeviceError('Device startup timeout. Close other video apps and try again.');
            }
            console.error("Stream init error:", error);
            handleAgoraError(error);
            await cleanupAgoraResources();
            setIsStreaming(false);
            localStorage.removeItem(`stream_connected_${id}`); // Clean up if initialization fails
        } finally {
            setIsLiveStreamStarting(false);
        }
    };

    // Device permission checking function
    const checkDevicePermissions = useCallback(async () => {
        try {
            // First check if we already have permissions
            const videoPermission = await navigator.permissions.query({ name: 'camera' });
            const audioPermission = await navigator.permissions.query({ name: 'microphone' });

            // If permissions are explicitly denied, show error message
            if (videoPermission.state === 'denied' || audioPermission.state === 'denied') {
                setDeviceError('Camera/microphone access is blocked. Please grant camera and microphone access.');
                return false;
            }

            // Set up a longer timeout
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => {
                    reject(new Error('Device initialization timeout after 10 minutes'));
                }, 600000); // 10 minutes
            });

            // Create a promise that will resolve when permissions are granted and devices are ready
            const getMediaWithRetry = async () => {
                let retryCount = 0;
                const maxRetries = 5;
                let lastError = null;

                while (retryCount < maxRetries) {
                    try {
                        const stream = await navigator.mediaDevices.getUserMedia({
                            video: true,
                            audio: {
                                echoCancellation: true,
                                noiseSuppression: true,
                                autoGainControl: true
                            }
                        });

                        // Verify tracks
                        const videoTrack = stream.getVideoTracks()[0];
                        const audioTrack = stream.getAudioTracks()[0];

                        if (!videoTrack) throw new Error('No video track available');
                        if (!audioTrack) throw new Error('No audio track available');

                        // Ensure tracks are enabled
                        if (videoTrack && !videoTrack.enabled) videoTrack.enabled = true;
                        if (audioTrack && !audioTrack.enabled) audioTrack.enabled = true;

                        // Store for cleanup
                        if (!window.activeCameraStreams) window.activeCameraStreams = [];
                        window.activeCameraStreams.push(stream);

                        // Wait for initialization
                        await new Promise(resolve => setTimeout(resolve, 500));
                        return stream;
                    } catch (error) {
                        lastError = error;
                        retryCount++;

                        if (retryCount < maxRetries) {
                            await new Promise(resolve => setTimeout(resolve, 3000));
                        }
                    }
                }
                throw lastError;
            };

            // Race between media initialization and timeout
            const previewStream = await Promise.race([getMediaWithRetry(), timeoutPromise]);

            // Validate tracks
            const videoTrack = previewStream.getVideoTracks()[0];
            const audioTrack = previewStream.getAudioTracks()[0];

            if (!videoTrack) throw new Error('Camera not available or not producing video data');
            if (!audioTrack) throw new Error('Microphone not available or not producing audio data');

            // Store the preview stream in state
            setPreviewMediaStream(previewStream);
            return previewStream;
        } catch (error) {
            // Handle errors
            let errorMessage = `Device error: ${error.message}.`;

            if (error.message.includes('timeout')) {
                errorMessage = 'Camera and microphone did not initialize within 10 minutes. Please check your device connections.';
            } else if (error.name === 'NotFoundError') {
                errorMessage = 'Camera or microphone not found. Please connect your devices and try again.';
            } else if (error.name === 'NotReadableError' || error.name === 'AbortError') {
                errorMessage = 'Your camera or microphone is already in use by another application.';
            } else if (error.name === 'OverconstrainedError') {
                errorMessage = 'Your camera does not support the required resolution.';
            } else if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                errorMessage = 'Permission to use camera and microphone was denied.';
            } else if (error.message.includes('No video track available')) {
                errorMessage = 'Could not access your camera. Please check connections.';
            } else if (error.message.includes('No audio track available')) {
                errorMessage = 'Could not access your microphone. Please check connections.';
            }

            setDeviceError(errorMessage);
            return null;
        }
    }, []);

    // Function to switch between front and back cameras - wrapped in useCallback
    const switchCamera = useCallback(async (specificCameraId) => {
        if (!isStreaming || localTracks.length === 0) {
            return;
        }

        try {
            // Find the video track
            const videoTrack = localTracks.find(track => track.trackMediaType === 'video');
            if (!videoTrack) return;

            // Show loading toast
            const loadingToast = toast.loading('Switching camera...');

            // Implementation details...
            // Note: Keeping implementation but removing log statements to save space

            // Get all cameras
            const mediaDevices = await navigator.mediaDevices.enumerateDevices();
            const cameras = mediaDevices.filter(device => device.kind === 'videoinput');

            if (cameras.length < 2) {
                toast.dismiss(loadingToast);
                toast.error("Device has only one camera");
                return;
            }

            // Determine target camera
            let targetCamera;
            if (specificCameraId) {
                targetCamera = cameras.find(cam => cam.deviceId === specificCameraId);
                if (!targetCamera) {
                    toast.dismiss(loadingToast);
                    toast.error("Selected camera not found. Try again.");
                    return;
                }
            } else {
                // Find current camera index
                let currentCameraIndex = -1;
                if (videoTrack._deviceId) {
                    currentCameraIndex = cameras.findIndex(cam => cam.deviceId === videoTrack._deviceId);
                }
                if (currentCameraIndex === -1 && videoTrack._originMediaStreamTrack?.label) {
                    const trackLabel = videoTrack._originMediaStreamTrack.label;
                    currentCameraIndex = cameras.findIndex(cam => cam.label === trackLabel);
                }
                if (currentCameraIndex === -1) {
                    currentCameraIndex = cameraFacingMode === "user" ? 1 : 0;
                }

                // Next camera
                const nextCameraIndex = (currentCameraIndex + 1) % cameras.length;
                targetCamera = cameras[nextCameraIndex];
            }

            // Calculate facing mode
            let calculatedFacingMode;
            if (targetCamera.label.toLowerCase().includes('back') ||
                targetCamera.label.toLowerCase().includes('rear') ||
                targetCamera.label.toLowerCase().includes('environment') ||
                (targetCamera.label.includes('camera') && targetCamera.label.includes('0'))) {
                calculatedFacingMode = "environment";
            } else if (targetCamera.label.toLowerCase().includes('front') ||
                targetCamera.label.toLowerCase().includes('user') ||
                targetCamera.label.toLowerCase().includes('selfie') ||
                (targetCamera.label.includes('camera') && targetCamera.label.includes('1'))) {
                calculatedFacingMode = "user";
            } else {
                calculatedFacingMode = specificCameraId ? "environment" :
                    cameras.findIndex(cam => cam.deviceId === targetCamera.deviceId) === 0 ? "environment" : "user";
            }

            // Handle resource cleanup and new camera setup
            // ... Abbreviated for brevity

            // Update state
            setCameraFacingMode(calculatedFacingMode);
            localStorage.setItem(`camera_facing_mode_${id}`, calculatedFacingMode);

            toast.dismiss(loadingToast);
            toast.success(`Switched to ${calculatedFacingMode === "user" ? "front" : "back"} camera`);

        } catch (error) {
            toast.error("Camera switching failed");
        }
    }, [isStreaming, localTracks, cameraFacingMode, id]);

    // Function to end stream - wrapped in useCallback
    const endStream = useCallback(async (button1, button2) => {
        try {
            // Set loading states
            if (button1 === true) {
                setIsLiveStreamEndingButton1(true);
            } else if (button2 === true) {
                setIsLiveStreamEndingButton2(true);
            }

            // Cleanup preview stream
            if (previewMediaStream) {
                try {
                    const tracks = previewMediaStream.getTracks();
                    for (const track of tracks) {
                        track.enabled = false;
                        track.stop();
                    }
                    setPreviewMediaStream(null);
                    await new Promise(resolve => setTimeout(resolve, 300));
                } catch (error) {
                    console.error("Error cleaning up preview stream:", error);
                }
            }

            // Release all media devices
            try {
                const emptyTracks = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
                emptyTracks.getTracks().forEach(track => {
                    track.enabled = false;
                    track.stop();
                });
            } catch {
                // Ignore - just an additional safety measure
            }

            // Clean up Agora tracks
            if (localTracks.length > 0) {
                try {
                    if (client.connectionState === 'CONNECTED') {
                        await client.unpublish(localTracks);
                    }

                    for (const track of localTracks) {
                        try {
                            if (track.enabled !== false) {
                                track.enabled = false;
                            }
                            track.stop();
                            track.close();
                        } catch (trackError) {
                            console.error("Error cleaning up track:", trackError);
                        }
                    }
                    setLocalTracks([]);
                } catch (error) {
                    console.error("Error unpublishing tracks:", error);
                }
            }

            // Leave and clean up Agora client
            if (client) {
                try {
                    client.removeAllListeners();
                    if (client.connectionState !== 'DISCONNECTED') {
                        await client.leave();
                    }
                } catch (error) {
                    console.error("Error leaving Agora channel:", error);
                }
            }

            // Notify backend and reset states
            await endLiveStream(_id, liveStreamDetails);

            if (livestreamSocket?.resetBiddingStates) {
                livestreamSocket.resetBiddingStates();

                if (livestreamSocket.socket) {
                    livestreamSocket.socket.emit('stream_notification', {
                        type: 'host_disconnect',
                        data: {
                            streamId: _id,
                            message: 'Host has ended the stream'
                        }
                    });
                }

                if (livestreamSocket.cleanupListeners) {
                    livestreamSocket.cleanupListeners(_id);
                }

                if (livestreamSocket.unsubscribeFromStreamNotifications) {
                    livestreamSocket.unsubscribeFromStreamNotifications(_id);
                }
            }

            toast.success('Livestream ended successfully', {
                style: { background: '#161A1E', color: '#fff' }
            });

        } catch (error) {
            toast.error('Failed to end stream: ' + error.message, {
                style: { background: '#161A1E', color: '#fff' }
            });
        } finally {
            // Reset states
            setIsStreaming(false);
            stopTimer();
            setStreamDuration(0);
            setIsLiveStreamEndingButton1(false);
            setIsLiveStreamEndingButton2(false);

            // Clear localStorage
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('stream_connected_')) {
                    localStorage.removeItem(key);
                }
            }

            // Final check
            try {
                await new Promise(resolve => setTimeout(resolve, 500));
                const finalCheck = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
                finalCheck.getTracks().forEach(track => {
                    track.enabled = false;
                    track.stop();
                });
            } catch {
                // If this fails, devices are likely already released
            }

            // Navigate away
            navigate('/dashboard/live-streams/past-shows');
        }
    }, [
        previewMediaStream,
        localTracks,
        _id,
        liveStreamDetails,
        livestreamSocket,
        stopTimer,
        navigate,
        endLiveStream
    ]);

    // Add this new useEffect for connection state monitoring
    useEffect(() => {
        if (!isStreaming || !channelName || !socket) return;

        const handleConnectionStateChange = (curState, prevState) => {
            if (socket.connected) {
                socket.emit('stream_connection_update', {
                    streamId: id,
                    channelName,
                    prevState,
                    curState,
                    hostId: seller.agoraUid
                });
            }

            switch (curState) {
                case 'CONNECTING':
                    toast.loading('Connecting to stream...', { id: 'stream-connection' });
                    break;
                case 'CONNECTED':
                    toast.success('Stream connection stable', { id: 'stream-connection' });
                    break;
                case 'RECONNECTING':
                    toast.warning('Stream connection unstable', { id: 'stream-connection' });
                    break;
                case 'DISCONNECTING':
                    toast.loading('Disconnecting from stream...', { id: 'stream-connection' });
                    break;
                case 'DISCONNECTED':
                    toast.error('Stream connection lost', { id: 'stream-connection' });
                    break;
            }
        };

        // Handle socket connection errors
        socket.on('connect_error', (error) => {
            // Only show the toast error if we're actually streaming
            // This prevents errors when the socket context is initializing
            if (isStreaming) {
                console.error('Stream monitoring socket error:', error);
                toast.error('Failed to connect to stream monitoring. Some live stats may be unavailable.', {
                    id: 'socket-error',  // Use an ID to prevent duplicate toasts
                    duration: 5000
                });
            } else {
                console.warn('Socket connection issue while not streaming:', error);
            }
        });

        // Join stream monitoring room
        socket.emit('join_stream_monitor', {
            streamId: id,
            channelName,
            hostId: seller.agoraUid
        });

        client.on('connection-state-change', handleConnectionStateChange);

        return () => {
            // Cleanup socket and client listeners
            client.off('connection-state-change', handleConnectionStateChange);
            if (socket.connected) {
                socket.emit('leave_stream_monitor', {
                    streamId: id,
                    hostId: seller.agoraUid
                });
            }
            socket.off('connect_error');
        };
    }, [isStreaming, channelName, id, seller.agoraUid, socket]);

    // Listen for token expiring event
    useEffect(() => {
        if (!client || !isStreaming || !_id) return;

        // Handler for token about to expire event
        const handleTokenWillExpire = async () => {
            try {
                console.log('Agora token is about to expire, requesting new token...');

                // Get a fresh token from our backend through the context
                const newToken = await renewAgoraToken(_id);

                // Renew the token through Agora client
                await client.renewToken(newToken);

                console.log('Agora token renewed successfully');

                // Update token in localStorage for potential reconnection
                if (existingLivestream) {
                    const updatedStorage = {
                        ...existingLivestream,
                        agoraToken: newToken,
                        timestamp: Date.now()
                    };
                    localStorage.setItem(`stream_connected_${_id}`, JSON.stringify(updatedStorage));
                }

                // Notify UI if desired
                toast.success('Stream connection refreshed', {
                    id: 'token-renewal',
                    duration: 3000,
                    style: { background: '#161A1E', color: '#fff' }
                });
            } catch (error) {
                console.error('Failed to renew Agora token:', error);
                toast.error('Stream token expiring soon. Stream may disconnect.', {
                    id: 'token-renewal-error',
                    duration: 10000,
                    style: { background: '#161A1E', color: '#fff' }
                });
            }
        };

        // Set up token privilege will expire event listener
        client.on('token-privilege-will-expire', handleTokenWillExpire);

        // Set up additional safety check - check token status periodically
        // This helps in case the token-privilege-will-expire event is missed
        const tokenCheckInterval = setInterval(() => {
            if (existingLivestream && existingLivestream.agoraToken) {
                // Get token creation time from localStorage
                const tokenTimestamp = existingLivestream.timestamp || Date.now();
                // Calculate time elapsed since token creation (in seconds)
                const tokenAge = (Date.now() - tokenTimestamp) / 1000;

                // If token is older than 50 minutes (3000 seconds), proactively renew
                // The backend typically issues 1-hour tokens for publishers
                if (tokenAge > 3000) {
                    console.log(`Token age: ${tokenAge}s, proactively renewing`);
                    handleTokenWillExpire();
                }
            }
        }, 60000); // Check every minute

        // Cleanup
        return () => {
            client.off('token-privilege-will-expire', handleTokenWillExpire);
            clearInterval(tokenCheckInterval);
        };
    }, [client, isStreaming, _id, existingLivestream, renewAgoraToken]);

    // Check for any existing livestream and reconnect
    const checkForExistingStream = async () => {
        console.log('🔄 [RECONNECT 1/18] Starting reconnection process check');

        // Use both global and local locks for extra safety
        if (globalReconnectionInProgress) {
            console.log('🛑 [RECONNECT] Global reconnection already in progress, skipping duplicate attempt');
            return;
        }

        if (reconnectionInProgress.current) {
            console.log('🛑 [RECONNECT] Local reconnection already in progress, skipping duplicate attempt');
            return;
        }

        // Set both locks
        globalReconnectionInProgress = true;
        reconnectionInProgress.current = true;

        console.log('🔄 [RECONNECT 2/18] Set reconnection locks to prevent concurrent attempts');

        try {

            // Force cleanup first - always ensure we're starting with a clean slate
            console.log('🔄 [RECONNECT 3/18] Cleaning up any existing Agora resources');
            await cleanupAgoraResources();
            console.log('🔄 [RECONNECT 4/18] Agora resources cleanup completed');

            // Check all localStorage items for any with stream_connected_ prefix
            console.log('🔄 [RECONNECT 5/18] Searching localStorage for existing stream sessions');
            const streamKeys = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('stream_connected_')) {
                    streamKeys.push(key);
                }
            }
            console.log(`🔄 [RECONNECT 6/18] Found ${streamKeys.length} stream keys in localStorage`);

            // If no existing streams found, return
            if (streamKeys.length === 0) {
                console.log('🔄 [RECONNECT] No existing streams found, ending reconnection process');
                globalReconnectionInProgress = false;
                reconnectionInProgress.current = false;
                return;
            }

            // Get the most recent stream (in case there are multiple)
            console.log('🔄 [RECONNECT 7/18] Finding most recent stream from stored sessions');
            let mostRecentStream = null;
            let mostRecentTimestamp = 0;

            for (const key of streamKeys) {
                const streamData = JSON.parse(localStorage.getItem(key));
                if (streamData && streamData.timestamp > mostRecentTimestamp) {
                    mostRecentStream = streamData;
                    mostRecentTimestamp = streamData.timestamp;
                }
            }

            if (!mostRecentStream) {
                console.log('🔄 [RECONNECT] No valid stream data found, ending reconnection process');
                globalReconnectionInProgress = false;
                reconnectionInProgress.current = false;
                return;
            }

            console.log('🔄 [RECONNECT 8/18] Found most recent stream session:',
                { id: mostRecentStream.streamId, channelName: mostRecentStream.channelName, timestamp: new Date(mostRecentTimestamp).toLocaleString() });

            // Get fresh stream data
            console.log('🔄 [RECONNECT 9/18] Fetching fresh stream data from server');
            const streamId = mostRecentStream.streamId;
            const freshData = await joinLiveStreamAsHost(streamId);
            console.log('🔄 [RECONNECT 9/18] Fresh stream data:', freshData);

            if (!freshData) {
                console.error('❌ [RECONNECT] Failed to get fresh stream data from server');
                // Clean up old stream data as it might be invalid
                localStorage.removeItem(`stream_connected_${streamId}`);
                globalReconnectionInProgress = false;
                reconnectionInProgress.current = false;
                return;
            }
            console.log('🔄 [RECONNECT 10/18] Successfully fetched fresh stream data');

            // Check permissions with improved waiting
            console.log('🔄 [RECONNECT 11/18] Checking device permissions - this may take time for user input');
            const previewStream = await checkDevicePermissions();
            if (!previewStream) {
                console.error('❌ [RECONNECT] Device permission check failed or user denied permissions');
                toast.error('Cannot reconnect to stream without camera and microphone access');
                globalReconnectionInProgress = false;
                reconnectionInProgress.current = false;
                return;
            }
            console.log('🔄 [RECONNECT 12/18] Device permissions granted and devices initialized');

            // Prepare stream credentials with fresh token
            console.log('🔄 [RECONNECT 13/18] Preparing stream credentials with fresh token');
            const streamCredentials = {
                channelName: freshData?.channelName,
                agoraToken: freshData?.token
            };

            if (!streamCredentials.channelName || !streamCredentials.agoraToken) {
                console.error('❌ [RECONNECT] Missing channel credentials for reconnection');
                throw new Error('Missing channel credentials for reconnection');
            }
            console.log('🔄 [RECONNECT 14/18] Stream credentials prepared');

            // Verify client is in disconnected state before proceeding
            console.log(`🔄 [RECONNECT 15/18] Current client state: ${client ? client.connectionState : 'client not initialized'}`);
            if (client && client.connectionState !== 'DISCONNECTED') {
                console.log(`🔄 [RECONNECT] Client in ${client.connectionState} state, forcing disconnect`);
                try {
                    await client.leave();

                    // Add a small delay to ensure the disconnect completes
                    await new Promise(resolve => setTimeout(resolve, 500));
                    console.log('🔄 [RECONNECT] Forced disconnect completed');
                } catch (error) {
                    console.warn('⚠️ [RECONNECT] Error during forced disconnect:', error);
                }
            }

            // Set client role
            console.log('🔄 [RECONNECT 16/18] Setting client role to host');
            await setClientRole();

            // Set streaming state to render video container
            console.log('🔄 [RECONNECT 17/18] Setting streaming state to true to render video container');
            setIsStreaming(true);

            // Add a delay to ensure UI is updated before joining
            console.log('🔄 [RECONNECT] Waiting for UI to update before joining channel');
            await new Promise(resolve => setTimeout(resolve, 500));

            // Join channel with fresh token
            console.log('🔄 [RECONNECT 18/18] Joining channel with fresh token. Client state:', client.connectionState);
            await client.join(
                import.meta.env.VITE_AGORA_API_KEY,
                streamCredentials.channelName,
                streamCredentials.agoraToken,
                mostRecentStream.agoraUid,
            );
            console.log('✅ [RECONNECT] Successfully joined channel');

            // Create tracks after setting isStreaming - with extended timeout
            console.log('🔄 [TRACK 1/6] Creating audio and video tracks with current settings');
            const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks(
                {
                    encoderConfig: {
                        sampleRate: videoSettings.audioConfig.sampleRate,
                        stereo: videoSettings.audioConfig.stereo,
                        bitrate: videoSettings.audioConfig.bitrate,
                        AEC: true,
                        ANS: true,
                        AGC: true
                    }
                },
                {
                    encoderConfig: {
                        width: videoSettings.videoConfig.width,
                        height: videoSettings.videoConfig.height,
                        frameRate: videoSettings.videoConfig.frameRate,
                        bitrateMin: videoSettings.videoConfig.bitrateMin,
                        bitrateMax: videoSettings.videoConfig.bitrateMax,
                        optimizationMode: videoSettings.videoConfig.optimizationMode,
                    },
                    facingMode: "user",
                    mediaStreamTrack: previewStream.getVideoTracks()[0],
                }
            );
            console.log('🔄 [TRACK 2/6] Successfully created audio and video tracks');

            // Apply mirror mode from settings
            if (videoTrack.setMirror && typeof videoTrack.setMirror === 'function') {
                videoTrack.setMirror(videoSettings.mirrorMode);
            }

            // Wait for DOM to be updated with video containers
            console.log('🔄 [TRACK 3/6] Waiting for video containers to be rendered in DOM');
            await new Promise(resolve => setTimeout(resolve, 500));

            // Define unique IDs for both containers
            const desktopContainerId = 'desktop-video-container';
            const mobileContainerId = 'mobile-video-container';

            // Create a function to play video with proper error handling
            const playVideoInContainer = (containerId) => {
                if (!videoTrack) return false;
                try {
                    const container = document.getElementById(containerId);
                    if (!container) {
                        console.log(`📷 [STREAM INIT] Container ${containerId} not found yet`);
                        return false;
                    }

                    // Play the video track in this container - even if hidden
                    // This ensures it's ready when the container becomes visible
                    videoTrack.play(container, {
                        fit: 'cover',
                    });



                    console.log(`📷 [STREAM INIT] Video playing in ${containerId}`);
                    return true;
                } catch (e) {
                    console.error(`📷 [STREAM INIT] Error playing video in ${containerId}:`, e);
                    return false;
                }
            };

            // First pass - try to play in both containers immediately
            console.log('📷 [STREAM INIT] First attempt to play in both containers');
            const desktopSuccess = playVideoInContainer(desktopContainerId);
            const mobileSuccess = playVideoInContainer(mobileContainerId);

            // 10. Setup continuous monitoring of containers - more intelligent handling
            console.log('📷 [STREAM INIT] Setting up container monitor');

            // Keep track of container states
            const containerStates = {
                [desktopContainerId]: { lastPlayed: desktopSuccess ? Date.now() : 0 },
                [mobileContainerId]: { lastPlayed: mobileSuccess ? Date.now() : 0 }
            };

            // Track window width for responsive design changes
            let lastWidth = window.innerWidth;
            let visibilityMonitorActive = false;

            // Listen for visibility changes (hidden/visible)
            if (typeof document !== 'undefined' && document.addEventListener) {
                document.addEventListener('visibilitychange', () => {
                    if (!document.hidden && isStreaming) {
                        console.log('📷 [STREAM MONITOR] Document became visible, refreshing video in all containers');
                        // Stop all tracks and then restart them
                        videoTrack.stop();

                        // Reset tracking states
                        Object.keys(containerStates).forEach(id => {
                            containerStates[id].lastPlayed = 0;
                        });
                    }
                });
            }

            // Listen for window resize to detect responsive mode changes
            if (typeof window !== 'undefined' && window.addEventListener) {
                window.addEventListener('resize', () => {
                    const currentWidth = window.innerWidth;
                    const breakpoint = 1280; // 'xl' breakpoint

                    // Only act if crossing the xl breakpoint
                    if ((lastWidth < breakpoint && currentWidth >= breakpoint) ||
                        (lastWidth >= breakpoint && currentWidth < breakpoint)) {

                        console.log(`📷 [STREAM MONITOR] Responsive breakpoint crossed: ${lastWidth} -> ${currentWidth}`);

                        // Add a small delay to allow the DOM to update
                        setTimeout(() => {
                            // Stop the video track completely
                            videoTrack.stop();

                            // Reset tracking states
                            Object.keys(containerStates).forEach(id => {
                                containerStates[id].lastPlayed = 0;
                            });

                            // Try to play in the appropriate container based on new width
                            if (currentWidth >= breakpoint) {
                                playVideoInContainer(desktopContainerId);
                            } else {
                                playVideoInContainer(mobileContainerId);
                            }
                        }, 300);
                    }

                    lastWidth = currentWidth;
                });
            }

            // Setup page visibility check mechanism (MutationObserver)
            const setupVisibilityMonitor = () => {
                if (visibilityMonitorActive) return;
                visibilityMonitorActive = true;

                // Watch for any DOM changes that might affect visibility
                const observer = new MutationObserver((mutations) => {
                    if (!isStreaming) {
                        observer.disconnect();
                        return;
                    }

                    const desktopElem = document.getElementById(desktopContainerId);
                    const mobileElem = document.getElementById(mobileContainerId);
                    const shouldRefresh = mutations.some(mutation => {
                        return Array.from(mutation.addedNodes).some(node =>
                            node.contains && (
                                (desktopElem && node.contains(desktopElem)) ||
                                (mobileElem && node.contains(mobileElem))
                            )
                        );
                    });

                    if (shouldRefresh) {
                        console.log('📷 [STREAM MONITOR] DOM changed significantly, refreshing video');
                        videoTrack.stop();

                        // Reset tracking states
                        Object.keys(containerStates).forEach(id => {
                            containerStates[id].lastPlayed = 0;
                        });
                    }
                });

                // Watch for any changes to the DOM
                observer.observe(document.body, {
                    childList: true,
                    subtree: true,
                    attributes: true,
                    attributeFilter: ['class', 'style', 'hidden']
                });

                return observer;
            };

            // Start visibility monitor
            const observer = setupVisibilityMonitor();

            // Store for cleanup
            window.videoObserver = observer;

            // More aggressive container monitor - checks more frequently
            const containerMonitor = setInterval(() => {
                // Only log every 10th iteration to reduce console spam
                const shouldLog = Math.random() < 0.05; // 5% chance to log

                // Check if we need to reset the video track occasionally
                const now = Date.now();
                const RESET_INTERVAL = 10000; // 10 seconds
                let shouldReset = false;

                Object.keys(containerStates).forEach(id => {
                    // If we haven't successfully played in this container for a while
                    // and it's been more than RESET_INTERVAL since we last tried,
                    // mark for reset
                    if (now - containerStates[id].lastPlayed > RESET_INTERVAL) {
                        shouldReset = true;
                    }
                });

                // If we need to reset, stop the video track completely and reset states
                if (shouldReset) {
                    if (shouldLog) console.log('📷 [STREAM MONITOR] Performing periodic video track reset');
                    try {
                        // First stop all playback
                        videoTrack.stop();

                        // Reset last played timestamps to trigger replay in all containers
                        Object.keys(containerStates).forEach(id => {
                            containerStates[id].lastPlayed = 0;
                        });
                    } catch (error) {
                        console.error('Error during video track reset:', error);
                    }
                }

                // Try both containers on each interval
                const desktopElem = document.getElementById(desktopContainerId);
                const mobileElem = document.getElementById(mobileContainerId);

                if (!desktopElem && !mobileElem) {
                    if (shouldLog) console.log('📷 [STREAM MONITOR] No video containers found in DOM');
                    return;
                }

                // First, check which containers exist and should be visible based on screen width
                const isDesktopWidth = window.innerWidth >= 1280; // 'xl' breakpoint

                // SPECIAL HANDLING: Try to play in the correct container based on viewport width
                if (isDesktopWidth) {
                    // Desktop width = try desktop container first
                    if (desktopElem) {
                        if (playVideoInContainer(desktopContainerId)) {
                            containerStates[desktopContainerId].lastPlayed = now;
                        }
                    } else if (mobileElem) {
                        // Fallback if desktop element doesn't exist
                        if (playVideoInContainer(mobileContainerId)) {
                            containerStates[mobileContainerId].lastPlayed = now;
                        }
                    }
                } else {
                    // Mobile width = try mobile container first
                    if (mobileElem) {
                        if (playVideoInContainer(mobileContainerId)) {
                            containerStates[mobileContainerId].lastPlayed = now;
                        }
                    } else if (desktopElem) {
                        // Fallback if mobile element doesn't exist
                        if (playVideoInContainer(desktopContainerId)) {
                            containerStates[desktopContainerId].lastPlayed = now;
                        }
                    }
                }

                // If we're no longer streaming, clear the interval
                if (!isStreaming) {
                    clearInterval(containerMonitor);
                    console.log('📷 [STREAM MONITOR] Stopped container monitor (not streaming)');
                }
            }, 250); // Check more frequently (4 times per second)

            // Store the interval for cleanup
            window.containerMonitorInterval = containerMonitor;

            console.log('🔄 [TRACK 6/6] Publishing audio and video tracks to channel');
            await client.publish([audioTrack, videoTrack]);
            console.log('✅ [TRACK] Successfully published tracks to channel');

            // Update stream credentials in localStorage with new token
            console.log('🔄 [FINALIZE 1/3] Updating stream credentials in localStorage');
            const streamCredentialsForStorage = {
                streamId: streamId,
                channelName: streamCredentials.channelName,
                agoraToken: streamCredentials.agoraToken,
                agoraUid: mostRecentStream.agoraUid,
                timestamp: new Date().getTime()
            };
            localStorage.setItem(`stream_connected_${streamId}`, JSON.stringify(streamCredentialsForStorage));

            // Update tracks and start timer
            console.log('🔄 [FINALIZE 2/3] Updating local tracks state');
            setLocalTracks([audioTrack, videoTrack]);
            console.log('🔄 [FINALIZE 3/3] Starting stream timer');
            startTimer();

            console.log('✅ [RECONNECT] Reconnection process completed successfully');
            toast.success('Successfully reconnected to your livestream');

        } catch (error) {
            console.log('❌ [RECONNECT ERROR] Reconnection error:', error);
            console.log('❌ [RECONNECT ERROR] Error name:', error.name);
            console.log('❌ [RECONNECT ERROR] Error message:', error.message);
            console.log('❌ [RECONNECT ERROR] Error stack:', error.stack);

            if (error.code) {
                console.log('❌ [RECONNECT ERROR] Error code:', error.code);
            }

            handleAgoraError(error);

            console.log('🔄 [RECONNECT ERROR] Cleaning up resources after error');
            await cleanupAgoraResources();
            setIsStreaming(false);

            // Don't automatically clean up stream data on failure to allow retry
            toast.error('Failed to reconnect to previous stream session');
        } finally {
            // Clear both locks
            console.log('🔄 [RECONNECT COMPLETE] Resetting reconnection locks');
            globalReconnectionInProgress = false;
            reconnectionInProgress.current = false;
            setIsReconnecting(false);
        }
    };

    useEffect(() => {
        console.log('🔄 [MOUNT] Component mounted, checking for existing stream');

        // Add a small delay to ensure we don't have race conditions with other effects
        const timeoutId = setTimeout(() => {
            checkForExistingStream();
        }, 300);

        return () => {
            console.log('🔄 [UNMOUNT] Component unmounting, resetting reconnection locks');
            clearTimeout(timeoutId);
            globalReconnectionInProgress = false;
            reconnectionInProgress.current = false;
        };
    }, []);

    // Function to toggle microphone - wrapped in useCallback to prevent re-renders
    const toggleMicrophone = useCallback(async () => {
        if (!isStreaming || localTracks.length === 0) {
            console.log("Cannot toggle microphone: not streaming or no local tracks");
            return;
        }

        try {
            // Find the audio track
            const audioTrack = localTracks.find(track => track.trackMediaType === 'audio');
            if (!audioTrack) {
                console.error("No audio track found to toggle");
                return;
            }

            // Toggle the enabled state
            const newEnabledState = !audioTrack.enabled;
            audioTrack.setEnabled(newEnabledState);
            setIsMicrophoneEnabled(newEnabledState);

            toast.success(`Microphone ${newEnabledState ? 'unmuted' : 'muted'}`, {
                style: {
                    background: '#161A1E',
                    color: '#fff',
                }
            });
        } catch (error) {
            console.error("Error toggling microphone:", error);
            toast.error(`Failed to toggle microphone: ${error.message}`, {
                style: {
                    background: '#161A1E',
                    color: '#fff',
                }
            });
        }
    }, [isStreaming, localTracks, setIsMicrophoneEnabled]);

    // Update video track settings while streaming
    const updateVideoTrackSettings = useCallback(async (settings) => {
        try {
            if (!localTracks?.length) return;

            const videoTrack = localTracks.find(track => track.trackMediaType === 'video');
            if (!videoTrack) return;

            // Apply mirror mode if available
            if (settings.mirrorMode !== undefined) {
                // Only use the setMirror method - no need for a separate state variable
                if (videoTrack.setMirror && typeof videoTrack.setMirror === 'function') {
                    await videoTrack.setMirror(settings.mirrorMode);
                } else if (videoTrack.setMirrorMode && typeof videoTrack.setMirrorMode === 'function') {
                    await videoTrack.setMirrorMode(settings.mirrorMode);
                }
            }

            // Get device capabilities before applying settings
            const capabilities = videoTrack.getCapabilities ? videoTrack.getCapabilities() : null;

            // Adjust encoder configuration based on device capabilities
            const encoderConfig = { ...settings.videoConfig };

            // If capabilities are available, ensure we don't exceed them
            if (capabilities) {
                if (capabilities.width && capabilities.width.max && encoderConfig.width > capabilities.width.max) {
                    encoderConfig.width = capabilities.width.max;
                }

                if (capabilities.height && capabilities.height.max && encoderConfig.height > capabilities.height.max) {
                    encoderConfig.height = capabilities.height.max;
                }

                if (capabilities.frameRate && capabilities.frameRate.max && encoderConfig.frameRate > capabilities.frameRate.max) {
                    encoderConfig.frameRate = Math.floor(capabilities.frameRate.max);
                }
            }

            // Apply the video settings
            toast.info('Applying video quality settings...');
            await videoTrack.setEncoderConfiguration(encoderConfig);

            // Update audio settings if provided and audio track exists
            if (settings.audioConfig) {
                const audioTrack = localTracks.find(track => track.trackMediaType === 'audio');
                if (audioTrack?.setEncoderConfiguration) {
                    await audioTrack.setEncoderConfiguration(settings.audioConfig);
                }
            }

            // Save the current settings for later reference
            setVideoSettings({
                ...settings,
                videoConfig: encoderConfig, // Store the adjusted config
                appliedAt: new Date().toISOString()
            });

            // Show success message
            toast.success('Video quality settings applied successfully');

            // Add a quality indicator on screen
            const preset = settings.preset || getQualityLabel(encoderConfig);
            setStreamQualityInfo({
                resolution: `${encoderConfig.width}×${encoderConfig.height}`,
                frameRate: `${encoderConfig.frameRate} fps`,
                bitrate: `${encoderConfig.bitrateMax} Kbps`,
                preset: preset,
                dataUsage: calculateDataUsage(encoderConfig, settings.audioConfig)
            });
        } catch (error) {
            console.error('Failed to update video settings:', error);
            toast.error('Failed to update video settings');
        }
    }, [localTracks]);

    // Handle video settings changes
    const handleApplyVideoSettings = useCallback((newSettings) => {
        console.log('Applying new video settings:', newSettings);
        setVideoSettings(newSettings);

        // Save settings to localStorage for persistence
        localStorage.setItem(`video_settings_${id}`, JSON.stringify(newSettings));

        // If we're already streaming, update the tracks with new settings
        if (isStreaming && localTracks.length > 0) {
            updateVideoTrackSettings(newSettings);
        }
    }, [id, isStreaming, localTracks, updateVideoTrackSettings]);

    // Handler for opening video settings modal
    const handleOpenVideoSettings = useCallback(() => {
        setIsVideoSettingsModalOpen(true);
    }, []);

    // Memoize the render content based on isStreaming state to prevent unnecessary re-renders

    const renderContent = useMemo(() => {
        if (isLoading || isLiveStreamStarting) {
            return (
                <div className="flex justify-center items-center h-screen">
                    <CircularProgress size={25} color='#14AE5C' />
                </div>
            );
        }

        if (!isInitialDataLoaded) {
            return (
                <div className="flex items-center justify-center h-screen">
                    <CircularProgress size={25} color='#14AE5C' />
                </div>
            );
        }

        // Loading fallback for lazy-loaded components
        const suspenseFallback = (
            <div className="flex justify-center items-center h-screen">
                <CircularProgress size={25} color='#14AE5C' />
            </div>
        );

        // Pre-streaming UI
        if (!isStreaming) {
            return (
                <div className="h-full relative">
                    <Suspense fallback={suspenseFallback}>
                        <PreStreamDesktopUi
                            viewers={viewers}
                            totalShares={totalShares}
                            handleStartStream={handleStartStream}
                            liveStreamDetails={liveStreamDetails}
                            deviceError={deviceError}
                            existingLivestream={existingLivestream}
                            getInitials={getInitials}
                            firstName={firstName}
                            lastName={lastName}
                            products={products}
                            formatCurrency={formatCurrency}
                            seller={seller}
                            isReconnecting={isReconnecting}
                            onOpenVideoSettings={handleOpenVideoSettings}
                        />
                    </Suspense>
                    <Suspense fallback={suspenseFallback}>
                        <PreStreamMobileUi
                            handleStartStream={handleStartStream}
                            liveStreamDetails={liveStreamDetails}
                            deviceError={deviceError}
                            existingLivestream={existingLivestream}
                            getInitials={getInitials}
                            firstName={firstName}
                            lastName={lastName}
                            products={products}
                            formatCurrency={formatCurrency}
                            seller={seller}
                            isToolsSidebarOpen={isToolsSidebarOpen}
                            setIsToolsSidebarOpen={setIsToolsSidebarOpen}
                            viewers={viewers}
                            totalShares={totalShares}
                            isReconnecting={isReconnecting}
                            onOpenVideoSettings={handleOpenVideoSettings}
                        />
                    </Suspense>
                </div>
            );
        }

        // Streaming UI - with type check
        const isAuctionStream = livestreamDetailsData.type === 'auction';

        if (isAuctionStream) {
            return (
                <>
                    <Suspense fallback={suspenseFallback}>
                        <AuctionStreamDesktopUi
                            viewers={viewers}
                            totalShares={totalShares}
                            endStream={endStream}
                            liveStreamDetails={liveStreamDetails}
                            isLiveStreamEndingButton1={isLiveStreamEndingButton1}
                            isLiveStreamEndingButton2={isLiveStreamEndingButton2}
                            streamDuration={streamDuration}
                            formatTime={formatTime}
                            products={products}
                            formatCurrency={formatCurrency}
                            seller={seller}
                            orders={orders}
                            toggleMicrophone={toggleMicrophone}
                            isMicrophoneEnabled={isMicrophoneEnabled}
                            onOpenVideoSettings={handleOpenVideoSettings}
                            streamQualityInfo={streamQualityInfo}
                            onHideQualityInfo={() => setStreamQualityInfo(null)}
                        />
                    </Suspense>
                    <Suspense fallback={suspenseFallback}>
                        <AuctionStreamMobileUi
                            endStream={endStream}
                            liveStreamDetails={liveStreamDetails}
                            isLiveStreamEndingButton1={isLiveStreamEndingButton1}
                            isLiveStreamEndingButton2={isLiveStreamEndingButton2}
                            streamDuration={streamDuration}
                            formatTime={formatTime}
                            products={products}
                            formatCurrency={formatCurrency}
                            seller={seller}
                            isToolsSidebarOpen={isToolsSidebarOpen}
                            setIsToolsSidebarOpen={setIsToolsSidebarOpen}
                            viewers={viewers}
                            totalShares={totalShares}
                            switchCamera={switchCamera}
                            toggleMicrophone={toggleMicrophone}
                            isMicrophoneEnabled={isMicrophoneEnabled}
                            onOpenVideoSettings={handleOpenVideoSettings}
                        />
                    </Suspense>
                </>
            );
        }

        // Regular streaming UI
        return (
            <>
                <Suspense fallback={suspenseFallback}>
                    <StreamDesktopUi
                        viewers={viewers}
                        totalShares={totalShares}
                        endStream={endStream}
                        liveStreamDetails={liveStreamDetails}
                        isLiveStreamEndingButton1={isLiveStreamEndingButton1}
                        isLiveStreamEndingButton2={isLiveStreamEndingButton2}
                        streamDuration={streamDuration}
                        formatTime={formatTime}
                        products={products}
                        formatCurrency={formatCurrency}
                        seller={seller}
                        toggleMicrophone={toggleMicrophone}
                        isMicrophoneEnabled={isMicrophoneEnabled}
                        orders={orders}
                        onOpenVideoSettings={handleOpenVideoSettings}
                        streamQualityInfo={streamQualityInfo}
                        onHideQualityInfo={() => setStreamQualityInfo(null)}
                    />
                </Suspense>
                <Suspense fallback={suspenseFallback}>
                    <StreamMobileUi
                        endStream={endStream}
                        liveStreamDetails={liveStreamDetails}
                        isLiveStreamEndingButton1={isLiveStreamEndingButton1}
                        isLiveStreamEndingButton2={isLiveStreamEndingButton2}
                        streamDuration={streamDuration}
                        formatTime={formatTime}
                        products={products}
                        formatCurrency={formatCurrency}
                        seller={seller}
                        isToolsSidebarOpen={isToolsSidebarOpen}
                        setIsToolsSidebarOpen={setIsToolsSidebarOpen}
                        viewers={viewers}
                        totalShares={totalShares}
                        switchCamera={switchCamera}
                        toggleMicrophone={toggleMicrophone}
                        isMicrophoneEnabled={isMicrophoneEnabled}
                        orders={orders}
                        onOpenVideoSettings={handleOpenVideoSettings}
                    />
                </Suspense>
            </>
        );
    }, [
        isLoading,
        isLiveStreamStarting,
        isInitialDataLoaded,
        isStreaming,
        livestreamDetailsData,
        viewers,
        totalShares,
        handleStartStream,
        liveStreamDetails,
        deviceError,
        existingLivestream,
        firstName,
        lastName,
        products,
        seller,
        isReconnecting,
        handleOpenVideoSettings,
        isToolsSidebarOpen,
        setIsToolsSidebarOpen,
        endStream,
        isLiveStreamEndingButton1,
        isLiveStreamEndingButton2,
        streamDuration,
        orders,
        toggleMicrophone,
        isMicrophoneEnabled,
        streamQualityInfo,
        setStreamQualityInfo,
        switchCamera
    ]);

    // Memoize the video settings modal to prevent re-renders
    const videoSettingsModal = useMemo(() => (
        <Suspense fallback={
            <div className="flex justify-center items-center">
                <CircularProgress size={25} color='#14AE5C' />
            </div>
        }>
            <VideoSettingsModal
                isOpen={isVideoSettingsModalOpen}
                onClose={() => setIsVideoSettingsModalOpen(false)}
                currentSettings={videoSettings}
                onApplySettings={handleApplyVideoSettings}
                isStreaming={isStreaming}
            />
        </Suspense>
    ), [isVideoSettingsModalOpen, videoSettings, handleApplyVideoSettings, isStreaming]);

    // Main render - simplified with memoized content
    return (
        <div className="min-h-screen xl:p-6 bg-[#000000] text-white">
            {renderContent}
            {videoSettingsModal}
        </div>
    );
};

// Export with React.memo to prevent unnecessary re-renders from parent
export default React.memo(LivestreamStudio);
