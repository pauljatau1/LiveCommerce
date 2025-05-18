import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOutletContext } from 'react-router-dom';
import { useLivestreamContext } from '../../Hooks/useLivestreamContext';
import AgoraRTC from 'agora-rtc-sdk-ng';
import CircularProgress from '@mui/material/CircularProgress';
import { toast } from 'sonner';
import { useSocket } from '../../Contexts/SocketContext';
import { useLivestreamSocket } from '../../Contexts/LivestreamSocketContext';
import PreStreamDesktopUi from '../../Components/preStreamDesktopUi/preStreamDesktopUi';
import PreStreamMobileUi from '../../Components/preStreamDesktopUi/preStreamMobileUi';
import StreamDesktopUi from '../../Components/streamDesktopUi/streamDesktopUi';
import StreamMobileUi from '../../Components/streamDesktopUi/streamMobileUi';
import AuctionStreamDesktopUi from '../../Components/streamDesktopUi/auctionStreamDesktopUi';
import AuctionStreamMobileUi from '../../Components/streamDesktopUi/auctionStreamMobileUi';
import VideoSettingsModal from '../../Components/ui/VideoSettingsModal';

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

const client = AgoraRTC.createClient({
    mode: 'live',
    codec: 'vp8',
    role: 'host'
});

// Add this outside the component to create a module-level lock
// This ensures the lock persists even when the component remounts
let globalReconnectionInProgress = false;

const LivestreamStudio = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { setHideSidebar, setFullScreenMode, setHeaderName, setNavName, setShowBackButton } = useOutletContext();
    const { startLiveStream, endLiveStream, getLiveStreamFullDetails, isLoading, liveStreamDetails, joinLiveStreamAsHost, renewAgoraToken } = useLivestreamContext();
    const [localTracks, setLocalTracks] = useState([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const [deviceError, setDeviceError] = useState(null);
    const [streamDuration, setStreamDuration] = useState(0);
    const [timerInterval, setTimerInterval] = useState(null);
    const [totalShares, setTotalShares] = useState(0);
    const [isLiveStreamStarting, setIsLiveStreamStarting] = useState(false);
    const [isLiveStreamEndingButton1, setIsLiveStreamEndingButton1] = useState(false);
    const [isLiveStreamEndingButton2, setIsLiveStreamEndingButton2] = useState(false);
    const [isToolsSidebarOpen, setIsToolsSidebarOpen] = useState(false);
    const [isInitialDataLoaded, setIsInitialDataLoaded] = useState(false);
    const [previewMediaStream, setPreviewMediaStream] = useState(null);
    const [cameraFacingMode, setCameraFacingMode] = useState("user"); // "user" for front camera, "environment" for back camera
    const [isMicrophoneEnabled, setIsMicrophoneEnabled] = useState(true);
    const [isReconnecting, setIsReconnecting] = useState(true);
    
    // Add video settings state
    const [videoSettings, setVideoSettings] = useState(DEFAULT_VIDEO_SETTINGS);
    const [isVideoSettingsModalOpen, setIsVideoSettingsModalOpen] = useState(false);

    // Add these state variables with the other useState declarations
    const [mirrorMode, setMirrorMode] = useState(true);
    const [streamQualityInfo, setStreamQualityInfo] = useState(null);

    const socket = useSocket();
    const existingLivestream = JSON.parse(localStorage.getItem(`stream_connected_${id}`));

    // Keep the ref for component-level tracking
    const reconnectionInProgress = useRef(false);

    // Add the livstreamSocket context
    const livestreamSocket = useLivestreamSocket();

    // Load saved video settings from localStorage if available
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


    const {
        channelName,
        agoraToken,
        status,
        title,
        products,
        type,
        viewers = [],
        orders = [],
        _id
    } = liveStreamDetails !== null ? liveStreamDetails : {};

    console.log('continuing without livestream data', liveStreamDetails)

    console.log('fetched agora token', agoraToken)

    const sellerData = localStorage.getItem('seller');
    const seller = JSON.parse(sellerData);
    console.log('stream seller', seller)
    const firstName = seller?.firstName;
    const lastName = seller?.lastName;

    const checkDevicePermissions = async () => {
        try {
            // First check if we already have permissions
            const videoPermission = await navigator.permissions.query({ name: 'camera' });
            const audioPermission = await navigator.permissions.query({ name: 'microphone' });

            // If permissions are explicitly denied, show error message
            if (videoPermission.state === 'denied' || audioPermission.state === 'denied') {
                setDeviceError('Camera/microphone access is blocked. Please grant camera and microphone access.');
                return false;
            }

            // Set up a much longer timeout (10 minutes) as requested
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => {
                    reject(new Error('Device initialization timeout after 10 minutes'));
                }, 600000); // 10 minutes in milliseconds
            });

            // Create a promise that will resolve when permissions are granted and devices are ready
            const getMediaWithRetry = async () => {
                let retryCount = 0;
                const maxRetries = 5;
                let lastError = null;

                while (retryCount < maxRetries) {
                    try {
                        console.log(`📷 [DEVICE] Attempting to access camera/mic (attempt ${retryCount + 1})`);

                        // Use less restrictive constraints to accommodate external webcams
                        const stream = await navigator.mediaDevices.getUserMedia({
                            video: true, // Simplified to allow any video source
                            audio: {
                                echoCancellation: true,
                                noiseSuppression: true,
                                autoGainControl: true
                            }
                        });

                        // Verify that the tracks are actually available and enabled
                        const videoTrack = stream.getVideoTracks()[0];
                        const audioTrack = stream.getAudioTracks()[0];

                        if (!videoTrack) {
                            throw new Error('No video track available');
                        }

                        if (!audioTrack) {
                            throw new Error('No audio track available');
                        }

                        // Additional verification that tracks are ready and producing data
                        if (videoTrack && !videoTrack.enabled) {
                            videoTrack.enabled = true;
                        }

                        if (audioTrack && !audioTrack.enabled) {
                            audioTrack.enabled = true;
                        }

                        // Store the stream for later cleanup
                        if (!window.activeCameraStreams) {
                            window.activeCameraStreams = [];
                        }
                        window.activeCameraStreams.push(stream);
                        console.log('📷 [DEVICE] Added stream to activeCameraStreams array for tracking');

                        // Add delay to ensure tracks are fully initialized
                        await new Promise(resolve => setTimeout(resolve, 500));

                        console.log('📷 [DEVICE] Successfully accessed camera and microphone');
                        return stream;
                    } catch (error) {
                        lastError = error;
                        retryCount++;

                        // Don't retry immediately - give the browser some time
                        if (retryCount < maxRetries) {
                            console.log(`📷 [DEVICE] Error accessing media devices, retrying in 3 seconds... (${retryCount}/${maxRetries})`);
                            await new Promise(resolve => setTimeout(resolve, 3000));
                        }
                    }
                }

                // If we've exhausted all retries, throw the last error
                throw lastError;
            };

            // Race between the media initialization with retry and the timeout
            const previewStream = await Promise.race([getMediaWithRetry(), timeoutPromise]);

            // Double-check that we have valid tracks before proceeding
            const videoTrack = previewStream.getVideoTracks()[0];
            const audioTrack = previewStream.getAudioTracks()[0];

            if (!videoTrack) {
                throw new Error('Camera not available or not producing video data');
            }

            if (!audioTrack) {
                throw new Error('Microphone not available or not producing audio data');
            }

            console.log('📷 [DEVICE] Device initialization successful');

            // Store the preview stream in state
            setPreviewMediaStream(previewStream);
            return previewStream;

        } catch (error) {
            // More detailed error handling
            let errorMessage = `Device error: ${error.message}.`;

            if (error.message.includes('timeout')) {
                errorMessage = 'Camera and microphone did not initialize within 10 minutes. Please check your device connections.';
            } else if (error.name === 'NotFoundError') {
                errorMessage = 'Camera or microphone not found. Please connect your devices and try again.';
            } else if (error.name === 'NotReadableError' || error.name === 'AbortError') {
                errorMessage = 'Your camera or microphone is already in use by another application. Please close other apps that might be using your devices.';
            } else if (error.name === 'OverconstrainedError') {
                errorMessage = 'Your camera does not support the required resolution. Please try using a different camera.';
            } else if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                errorMessage = 'Permission to use camera and microphone was denied. Please allow access and try again.';
            } else if (error.message.includes('No video track available')) {
                errorMessage = 'Could not access your camera. Please check that your camera is connected and working properly.';
            } else if (error.message.includes('No audio track available')) {
                errorMessage = 'Could not access your microphone. Please check that your microphone is connected and working properly.';
            }

            setDeviceError(errorMessage);
            console.error('Device initialization error:', error);
            return null;
        }
    };

    const setClientRole = async () => {
        try {
            // For host role, we don't need to specify latency level
            await client.setClientRole("host");
        } catch (error) {
            console.error("Error setting client role:", error);
            throw error;
        }
    };

    // Add these helper functions
    const handleAgoraError = (error) => {
        const errorMap = {
            'CAN_NOT_GET_GATEWAY_SERVER': 'Invalid token - please refresh the page',
            'UID_CONFLICT': 'Session conflict - try again in 30 seconds',
            'INVALID_OPERATION': 'Connection already in progress'
        };

        console.log('stream initialization error:', error)

        toast.error(errorMap[error.code] || `Stream error: ${error.message}`);
    };

    const cleanupAgoraResources = async () => {
        try {
            // Clear the container monitor interval if it exists
            if (window.containerMonitorInterval) {
                clearInterval(window.containerMonitorInterval);
                window.containerMonitorInterval = null;
                console.log("📤 [STREAM END] Cleared container monitor interval");
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
            console.log(`Current connection state before cleanup: ${currentConnectionState}`);

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
                            console.log(`📤 [STREAM END] Stopping Agora ${trackType} track`);

                            // If it's a video track, make sure to stop playing
                            if (trackType === 'video') {
                                try {
                                    track.stop();
                                    console.log(`📤 [STREAM END] Stopped playing ${trackType} track in any containers`);
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
                                console.log(`📤 [STREAM END] Could not disable track (already disabled or read-only)`, enabledError);
                            }

                            // Then stop the track
                            track.stop();

                            // Finally close the track (this destroys the track)
                            track.close();

                            console.log(`📤 [STREAM END] Successfully cleaned up ${trackType} track`);
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
    };

    const handleStartStream = async () => {
        try {
            const streamData = await startLiveStream(_id);
            console.log('starting streamData', streamData);
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
    };

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

    const endStream = async (button1, button2) => {
        try {
            // Set loading states at the start
            if (button1 === true) {
                setIsLiveStreamEndingButton1(true);
            } else if (button2 === true) {
                setIsLiveStreamEndingButton2(true);
            }

            console.log("📤 [STREAM END] Beginning stream shutdown process");

            // 1. Stop and cleanup preview stream with enhanced error handling
            if (previewMediaStream) {
                try {
                    console.log("📤 [STREAM END] Cleaning up preview media stream");
                    const tracks = previewMediaStream.getTracks();
                    console.log(`📤 [STREAM END] Found ${tracks.length} preview tracks to clean up`);

                    for (const track of tracks) {
                        try {
                            // Get track type and ID for better logging
                            const trackType = track.kind; // 'audio' or 'video'
                            const trackId = track.id;
                            console.log(`📤 [STREAM END] Stopping ${trackType} track ${trackId}`);

                            // Fully disable and stop the track
                            track.enabled = false;
                            track.stop();

                            // Additional check to ensure the track is really stopped
                            if (track.readyState !== 'ended') {
                                console.warn(`📤 [STREAM END] Track ${trackId} not fully stopped, forcing again`);
                                track.stop();
                            }
                        } catch (trackError) {
                            console.error("Error cleaning up preview track:", trackError);
                        }
                    }

                    // Explicitly remove all references to the stream
                    previewMediaStream.getTracks().forEach(track => track.stop());
                    setPreviewMediaStream(null);

                    // Force a small delay to allow browser to release camera/mic resources
                    await new Promise(resolve => setTimeout(resolve, 300));
                    console.log("📤 [STREAM END] Preview media stream cleanup completed");
                } catch (error) {
                    console.error("Error cleaning up preview stream:", error);
                }
            }

            // 2. Access navigator.mediaDevices to ensure all user media is stopped
            try {
                // This is an additional safety measure to release all media devices
                console.log("📤 [STREAM END] Performing additional media device release");
                const emptyTracks = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
                emptyTracks.getTracks().forEach(track => {
                    track.enabled = false;
                    track.stop();
                });
            } catch (mediaError) {
                console.log("📤 [STREAM END] Additional media release not needed or failed:", mediaError);
            }

            // 3. Unpublish and cleanup Agora tracks
            if (localTracks.length > 0) {
                try {
                    console.log(`📤 [STREAM END] Cleaning up ${localTracks.length} Agora tracks`);
                    // First unpublish from Agora client
                    if (client.connectionState === 'CONNECTED') {
                        await client.unpublish(localTracks);
                        console.log("📤 [STREAM END] Unpublished tracks from Agora");
                    }

                    // Then stop and close each track
                    for (const track of localTracks) {
                        try {
                            const trackType = track.trackMediaType; // 'audio' or 'video'
                            console.log(`📤 [STREAM END] Stopping Agora ${trackType} track`);

                            // Change order: First disable, then stop and close
                            try {
                                // Safely try to disable the track first
                                if (track.enabled !== false && typeof track.enabled !== 'undefined') {
                                    track.enabled = false;
                                }
                            } catch (enabledError) {
                                console.log(`📤 [STREAM END] Could not disable track (already disabled or read-only)`, enabledError);
                            }

                            // Then stop the track
                            track.stop();

                            // Finally close the track (this destroys the track)
                            track.close();

                            console.log(`📤 [STREAM END] Successfully cleaned up ${trackType} track`);
                        } catch (trackError) {
                            console.error("Error cleaning up track:", trackError);
                        }
                    }
                    setLocalTracks([]);
                    console.log("📤 [STREAM END] Agora tracks cleanup completed");
                } catch (error) {
                    console.error("Error unpublishing tracks:", error);
                }
            }

            // 4. Leave and cleanup Agora client
            if (client) {
                try {
                    console.log("📤 [STREAM END] Cleaning up Agora client");
                    // Remove all event listeners first
                    client.removeAllListeners();

                    // Then leave the channel if connected
                    if (client.connectionState !== 'DISCONNECTED') {
                        await client.leave();
                        console.log("📤 [STREAM END] Left Agora channel");
                    }
                } catch (error) {
                    console.error("Error leaving Agora channel:", error);
                }
            }

            // 5. Notify backend about stream end
            console.log("📤 [STREAM END] Notifying backend about stream end");
            await endLiveStream(_id, liveStreamDetails);

            // Reset all bidding states from the socket context
            if (livestreamSocket && typeof livestreamSocket.resetBiddingStates === 'function') {
                console.log("📤 [STREAM END] Resetting all bidding states");
                livestreamSocket.resetBiddingStates();

                // Emit a host_disconnect event to notify viewers that the host has ended the stream
                if (livestreamSocket.socket) {
                    console.log("📤 [STREAM END] Notifying viewers about host disconnect");
                    livestreamSocket.socket.emit('stream_notification', {
                        type: 'host_disconnect',
                        data: {
                            streamId: _id,
                            message: 'Host has ended the stream'
                        }
                    });
                }

                // Clean up socket listeners to prevent memory leaks
                if (typeof livestreamSocket.cleanupListeners === 'function') {
                    console.log("📤 [STREAM END] Cleaning up socket listeners");
                    livestreamSocket.cleanupListeners(_id);
                }

                // Unsubscribe from stream notifications
                if (typeof livestreamSocket.unsubscribeFromStreamNotifications === 'function') {
                    console.log("📤 [STREAM END] Unsubscribing from stream notifications");
                    livestreamSocket.unsubscribeFromStreamNotifications(_id);
                }
            }

            // 6. Show success message
            toast.success('Livestream ended successfully', {
                style: { background: '#161A1E', color: '#fff' }
            });

            console.log("📤 [STREAM END] Stream shutdown completed successfully");

        } catch (error) {
            console.error('Error ending stream:', error);
            toast.error('Failed to end stream: ' + error.message, {
                style: { background: '#161A1E', color: '#fff' }
            });
        } finally {
            // Reset all states and clear storage regardless of success/failure
            console.log("📤 [STREAM END] Resetting all states and clearing storage");
            setIsStreaming(false);
            stopTimer();
            setStreamDuration(0);
            setIsLiveStreamEndingButton1(false);
            setIsLiveStreamEndingButton2(false);

            // Clear all stream-related localStorage items
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('stream_connected_')) {
                    localStorage.removeItem(key);
                }
            }

            // Final check: Force garbage collection of any remaining media resources
            try {
                // Force a delay before navigation to give time for cleanup
                await new Promise(resolve => setTimeout(resolve, 500));

                // Create one final check to ensure camera/mic are released
                const finalCheck = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
                finalCheck.getTracks().forEach(track => {
                    track.enabled = false;
                    track.stop();
                });
            } catch (e) {
                // If this fails, it likely means devices are already released
                console.log("📤 [STREAM END] Final device check completed");
            }

            console.log("📤 [STREAM END] Navigating away from stream page");
            // Navigate to past shows after cleanup
            navigate('/dashboard/live-streams/past-shows');
        }
    };

    // Remove the hasLiveStreamStarted useEffect
    // useEffect(() => {
    //     if (hasLiveStreamStarted) {
    //         initializeStream();
    //     }
    // }, [hasLiveStreamStarted]);

    function formatCurrency(amount) {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
        }).format(amount)
    };

    const getInitials = (firstName, lastName) => {
        return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
    }

    const formatTime = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const startTimer = () => {
        const interval = setInterval(() => {
            setStreamDuration(prev => prev + 1);
        }, 1000);
        setTimerInterval(interval);
    };

    const stopTimer = () => {
        if (timerInterval) {
            clearInterval(timerInterval);
            setTimerInterval(null);
        }
    };



    useEffect(() => {
        // Handle user joining
        client.on('user-joined', (user) => {
            console.log('User joined:', user.uid);
        });

        // Handle connection state changes
        client.on('connection-state-change', (curState, prevState) => {
            console.log('Connection state changed from', prevState, 'to', curState);
        });

        // Handle stream quality
        client.on('network-quality', (stats) => {
            console.log('Downlink network quality:', stats.downlinkNetworkQuality);
            console.log('Uplink network quality:', stats.uplinkNetworkQuality);
        });

        return () => {
            client.removeAllListeners();
        };
    }, []);



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


    // Function to switch between front and back cameras

    const switchCamera = async (specificCameraId) => {
        if (!isStreaming || localTracks.length === 0) {
            console.log("Cannot switch camera: not streaming or no local tracks");
            return;
        }

        try {
            console.log('switching camera')
            // Find the video track
            const videoTrack = localTracks.find(track => track.trackMediaType === 'video');
            if (!videoTrack) {
                console.error("No video track found to switch");
                return;
            }

            // Show loading toast
            const loadingToast = toast.loading('Switching camera...', {
                style: {
                    background: '#161A1E',
                    color: '#fff',
                }
            });

            try {
                console.log("STEP 1: Identifying all available cameras");
                // Get available camera devices using the browser API
                const mediaDevices = await navigator.mediaDevices.enumerateDevices();
                const cameras = mediaDevices.filter(device => device.kind === 'videoinput');

                console.log(`Available cameras (${cameras.length}):`,
                    cameras.map(d => `${d.label || 'Unnamed camera'} (${d.deviceId.substring(0, 8)}...)`));

                if (cameras.length < 2) {
                    console.error("Not enough cameras to switch between");
                    toast.dismiss(loadingToast);
                    toast.error("Device has only one camera", {
                        style: {
                            background: '#161A1E',
                            color: '#fff',
                        }
                    });
                    return;
                }

                console.log("STEP 2: Determining current and target cameras");

                // If a specific camera ID was provided, use that camera
                let targetCamera;
                if (specificCameraId) {
                    console.log(`Looking for specific camera with ID: ${specificCameraId.substring(0, 8)}...`);
                    targetCamera = cameras.find(cam => cam.deviceId === specificCameraId);

                    if (!targetCamera) {
                        console.error(`Camera with ID ${specificCameraId.substring(0, 8)}... not found`);
                        toast.dismiss(loadingToast);
                        toast.error("Selected camera not found. Try again.", {
                            style: {
                                background: '#161A1E',
                                color: '#fff',
                            }
                        });
                        return;
                    }

                    console.log(`Found specified camera: ${targetCamera.label || 'Unnamed camera'}`);
                } else {
                    // No specific camera ID, use the default cycling behavior
                    // Determine current camera index
                    let currentCameraIndex = -1;

                    // Try to find current camera in the list by deviceId
                    if (videoTrack._deviceId) {
                        currentCameraIndex = cameras.findIndex(cam => cam.deviceId === videoTrack._deviceId);
                        console.log(`Found current camera at index ${currentCameraIndex} by deviceId`);
                    }

                    // If we couldn't find by deviceId, try using label
                    if (currentCameraIndex === -1 && videoTrack._originMediaStreamTrack && videoTrack._originMediaStreamTrack.label) {
                        const trackLabel = videoTrack._originMediaStreamTrack.label;
                        currentCameraIndex = cameras.findIndex(cam => cam.label === trackLabel);
                        console.log(`Found current camera at index ${currentCameraIndex} by label`);
                    }

                    // Last resort: use facing mode as hint
                    if (currentCameraIndex === -1) {
                        console.log(`Could not find current camera by ID or label, using facing mode ${cameraFacingMode} as hint`);
                        // Determine likely index based on facing mode
                        if (cameras.length >= 2) {
                            // In most devices, camera index 0 is back, index 1 is front
                            currentCameraIndex = cameraFacingMode === "user" ? 1 : 0;
                        } else {
                            currentCameraIndex = 0; // Only one camera
                        }
                    }

                    // Get the next camera in sequence
                    const nextCameraIndex = (currentCameraIndex + 1) % cameras.length;
                    console.log(`Switching from camera ${currentCameraIndex} to camera ${nextCameraIndex}`);

                    targetCamera = cameras[nextCameraIndex];
                }

                console.log(`Target camera: ${targetCamera.label || 'Unnamed camera'} (${targetCamera.deviceId.substring(0, 8)}...)`);

                // Calculate the facing mode based on camera label
                let calculatedFacingMode;
                if (targetCamera.label.toLowerCase().includes('back') ||
                    targetCamera.label.toLowerCase().includes('rear') ||
                    targetCamera.label.toLowerCase().includes('environment') ||
                    (targetCamera.label.includes('camera') && targetCamera.label.includes('0'))) {
                    calculatedFacingMode = "environment";
                    console.log("Target camera identified as REAR camera based on label:", targetCamera.label);
                } else if (targetCamera.label.toLowerCase().includes('front') ||
                    targetCamera.label.toLowerCase().includes('user') ||
                    targetCamera.label.toLowerCase().includes('selfie') ||
                    (targetCamera.label.includes('camera') && targetCamera.label.includes('1'))) {
                    calculatedFacingMode = "user";
                    console.log("Target camera identified as FRONT camera based on label:", targetCamera.label);
                } else {
                    // If we can't determine from label, use index as fallback
                    // For specific camera selection, default to environment if label doesn't give clues
                    if (specificCameraId) {
                        calculatedFacingMode = "environment";
                        console.log(`Unable to determine camera type from label for specific camera, defaulting to: ${calculatedFacingMode}`);
                    } else {
                        const nextCameraIndex = cameras.findIndex(cam => cam.deviceId === targetCamera.deviceId);
                        calculatedFacingMode = nextCameraIndex === 0 ? "environment" : "user";
                        console.log(`Unable to determine camera type from label, using index ${nextCameraIndex} to guess: ${calculatedFacingMode}`);
                    }
                }

                console.log(`Final calculated facing mode: ${calculatedFacingMode}`);

                console.log("STEP 3: AGGRESSIVE cleanup of all media resources");
                // CRITICAL: Force release ALL media resources first

                // ADDED: Check and clean up previewMediaStream
                console.log("3.0: Checking for preview media stream");
                if (previewMediaStream) {
                    console.log("Cleaning up preview media stream");
                    try {
                        const previewTracks = previewMediaStream.getTracks();
                        console.log(`Found ${previewTracks.length} preview tracks to stop`);
                        previewTracks.forEach(track => {
                            try {
                                console.log(`Stopping preview track: ${track.kind} (${track.label || 'unnamed'})`);
                                track.stop();
                                track.enabled = false;
                            } catch (err) {
                                console.warn(`Failed to stop preview track: ${err.message}`);
                            }
                        });
                        setPreviewMediaStream(null);
                    } catch (err) {
                        console.warn("Error cleaning up preview stream:", err);
                    }
                }

                console.log("3.1: Stopping all active MediaStream tracks from previous camera operations");
                // Stop all tracks of any previously stored media streams
                if (window.activeCameraStreams && window.activeCameraStreams.length > 0) {
                    console.log(`Cleaning up ${window.activeCameraStreams.length} previously stored media streams`);
                    window.activeCameraStreams.forEach((stream, index) => {
                        console.log(`Stopping tracks from stored stream #${index}`);
                        if (stream && stream.getTracks) {
                            const tracks = stream.getTracks();
                            console.log(`Found ${tracks.length} tracks to stop`);
                            tracks.forEach(track => {
                                try {
                                    console.log(`Stopping track: ${track.kind} (${track.label || 'unnamed'})`);
                                    track.stop();
                                } catch (err) {
                                    console.warn(`Failed to stop track: ${err.message}`);
                                }
                            });
                        }
                    });
                    window.activeCameraStreams = [];
                }

                // Stop any video currently playing in containers
                try {
                    console.log("3.1.5: Cleaning up any video elements in containers");
                    const desktopContainer = document.getElementById('desktop-video-container');
                    const mobileContainer = document.getElementById('mobile-video-container');

                    if (desktopContainer) {
                        console.log("Cleaning desktop video container");
                        while (desktopContainer.firstChild) {
                            desktopContainer.removeChild(desktopContainer.firstChild);
                        }
                    }

                    if (mobileContainer) {
                        console.log("Cleaning mobile video container");
                        while (mobileContainer.firstChild) {
                            mobileContainer.removeChild(mobileContainer.firstChild);
                        }
                    }
                } catch (containerError) {
                    console.warn("Error cleaning video containers:", containerError);
                }

                console.log("3.2: Accessing all media devices to force hardware reset");
                try {
                    // This is a trick to fully reset camera hardware on some devices
                    const resetStream = await navigator.mediaDevices.getUserMedia({ audio: false, video: false });
                    resetStream.getTracks().forEach(track => track.stop());
                } catch (e) {
                    // Ignore errors, this is just an attempt to reset
                    console.log("Media hardware reset skipped:", e.message);
                }

                console.log("3.3: Unpublishing and closing Agora video track");
                // Unpublish and close current Agora video track
                try {
                    console.log(`Stopping Agora track: ${videoTrack.getTrackId()}`);
                    await client.unpublish(videoTrack);
                    videoTrack.stop();
                    videoTrack.close();
                } catch (trackError) {
                    console.warn("Error during track cleanup:", trackError.message);
                    // Continue anyway - this is cleanup
                }

                console.log("STEP 4: Wait for camera resources to be fully released");
                // CRITICAL: Need to wait long enough for camera to be fully released
                // Some devices need a longer time
                const releaseDelay = 5000; // 5 seconds - increased from 3 to allow more time for mobile devices
                console.log(`Waiting ${releaseDelay}ms for camera resources to be fully released...`);
                await new Promise(resolve => setTimeout(resolve, releaseDelay));

                console.log(`STEP 5: Attempting to access new camera with ID: ${targetCamera.deviceId.substring(0, 8)}...`);

                // Function to attempt camera access with retries
                const accessCamera = async (attempts = 3, delay = 1000) => {
                    const isRearCamera = calculatedFacingMode === "environment";
                    console.log(`Attempting to access ${isRearCamera ? "REAR" : "FRONT"} camera`);

                    // If we're trying to access the rear camera, try with facingMode first
                    // This is often more reliable than deviceId on mobile devices
                    if (isRearCamera) {
                        console.log("First attempting rear camera with facingMode constraint only");
                        try {
                            const facingModeConstraints = {
                                video: { facingMode: { exact: "environment" } },
                                audio: false
                            };
                            console.log("Using facingMode constraints:", JSON.stringify(facingModeConstraints, null, 2));
                            return await navigator.mediaDevices.getUserMedia(facingModeConstraints);
                        } catch (facingModeError) {
                            console.warn("Rear camera facingMode access failed:", facingModeError.name, facingModeError.message);
                        }
                    }

                    // Continue with multiple attempts with different constraint combinations
                    for (let attempt = 1; attempt <= attempts; attempt++) {
                        console.log(`Camera access attempt ${attempt}/${attempts}`);

                        try {
                            // First try with specific constraints for the target camera
                            // Use both deviceId and facingMode for best chance of success
                            const constraints = {
                                video: {
                                    deviceId: { exact: targetCamera.deviceId }
                                },
                                audio: false
                            };

                            // Only add facingMode if we're trying to get the front camera
                            // For rear camera, we'll try deviceId only first to avoid conflicts
                            if (!isRearCamera) {
                                console.log("Using user facingMode constraint for front camera");
                                constraints.video.facingMode = { exact: "user" };
                            } else {
                                console.log("Using only deviceId constraint for rear camera");
                            }

                            console.log("Using constraints:", JSON.stringify(constraints, null, 2));
                            return await navigator.mediaDevices.getUserMedia(constraints);
                        } catch (exactConstraintError) {
                            console.warn(`Exact constraints failed:`, exactConstraintError.name, exactConstraintError.message);

                            // If exact constraints fail, try with ideal constraints
                            try {
                                console.log("Trying with ideal constraints instead of exact");
                                const idealConstraints = {
                                    video: {
                                        deviceId: { ideal: targetCamera.deviceId },
                                        width: { ideal: 1280, min: 640 },
                                        height: { ideal: 720, min: 480 }
                                    },
                                    audio: false
                                };

                                // Add ideal facingMode for better selection
                                if (isRearCamera) {
                                    idealConstraints.video.facingMode = { ideal: "environment" };
                                } else {
                                    idealConstraints.video.facingMode = { ideal: "user" };
                                }

                                console.log("Using ideal constraints:", JSON.stringify(idealConstraints, null, 2));
                                return await navigator.mediaDevices.getUserMedia(idealConstraints);
                            } catch (idealConstraintError) {
                                console.warn(`Ideal constraints failed:`, idealConstraintError.name, idealConstraintError.message);

                                // If we're on the final attempt, try just the facingMode as a last resort
                                if (attempt === attempts) {
                                    console.log("Final attempt with facingMode-only constraint");
                                    try {
                                        // Try using just facingMode which is more reliable on mobile
                                        const facingModeConstraints = {
                                            video: {
                                                facingMode: isRearCamera ? "environment" : "user"
                                            },
                                            audio: false
                                        };
                                        console.log("Using facingMode-only constraints:", JSON.stringify(facingModeConstraints, null, 2));
                                        return await navigator.mediaDevices.getUserMedia(facingModeConstraints);
                                    } catch (facingModeError) {
                                        console.error("FacingMode approach failed:", facingModeError);

                                        // As a last desperation attempt, try generic video
                                        console.log("Last resort: trying with generic video constraint");
                                        try {
                                            return await navigator.mediaDevices.getUserMedia({
                                                video: true,
                                                audio: false
                                            });
                                        } catch (lastError) {
                                            console.error("All camera access attempts failed:", lastError);
                                            throw lastError;
                                        }
                                    }
                                }
                            }

                            // Wait before next attempt with increasing delay
                            console.log(`Waiting ${delay}ms before next attempt...`);
                            await new Promise(resolve => setTimeout(resolve, delay));
                            delay *= 1.5; // Increase delay for next attempt
                        }
                    }

                    // If we get here, all attempts failed
                    throw new Error("All camera access attempts failed after multiple retries");
                };

                // Try to access the camera with retries
                let testStream = null;
                try {
                    testStream = await accessCamera();
                    console.log("Camera access successful!");

                    // Validate that we got the right camera
                    const videoTrack = testStream.getVideoTracks()[0];
                    const settings = videoTrack?.getSettings();
                    console.log("Obtained camera:", {
                        label: videoTrack?.label || 'unknown',
                        id: videoTrack?.id.substring(0, 8) || 'unknown',
                        deviceId: settings?.deviceId?.substring(0, 8) || 'unknown',
                        facingMode: settings?.facingMode || 'unknown',
                        width: settings?.width,
                        height: settings?.height
                    });

                    // Verify if we got the intended camera type
                    const expectedFacingMode = calculatedFacingMode;
                    const actualFacingMode = settings?.facingMode ||
                        (videoTrack?.label?.toLowerCase().includes('front') ? 'user' :
                            videoTrack?.label?.toLowerCase().includes('back') ? 'environment' : 'unknown');

                    console.log(`Camera check: Expected ${expectedFacingMode}, got ${actualFacingMode}`);

                    // If we didn't get the expected camera, warn but continue
                    if (actualFacingMode !== 'unknown' && actualFacingMode !== expectedFacingMode) {
                        console.warn(`WARNING: Got ${actualFacingMode} camera instead of ${expectedFacingMode}`);
                        // Update our expectation to match reality
                        calculatedFacingMode = actualFacingMode;
                    }

                    // Store stream for cleanup in future switches
                    if (!window.activeCameraStreams) {
                        window.activeCameraStreams = [];
                    }
                    window.activeCameraStreams.push(testStream);
                } catch (mediaError) {
                    console.error("All camera access attempts failed:", mediaError);
                    toast.dismiss(loadingToast);
                    toast.error("Failed to access camera. Please try again.", {
                        style: {
                            background: '#161A1E',
                            color: '#fff',
                        }
                    });
                    return;
                }

                console.log("STEP 6: Creating new video track from accessed camera");

                // Log the tracks we obtained
                if (testStream) {
                    const videoTracks = testStream.getVideoTracks();
                    console.log(`Got ${videoTracks.length} video tracks:`,
                        videoTracks.map(t => `${t.label || 'unnamed'} (${t.id.substring(0, 8)}...)`));

                    if (videoTracks.length === 0) {
                        throw new Error("No video tracks in the obtained media stream");
                    }
                }

                let newVideoTrack;
                try {
                    // Get the video track from the stream
                    const mediaStreamTrack = testStream.getVideoTracks()[0];

                    // Log camera capabilities to help debug
                    if (mediaStreamTrack.getSettings) {
                        const settings = mediaStreamTrack.getSettings();
                        console.log("Camera settings:", {
                            deviceId: settings.deviceId?.substring(0, 8),
                            facingMode: settings.facingMode,
                            width: settings.width,
                            height: settings.height
                        });
                    }

                    console.log("Creating custom video track from camera stream");
                    newVideoTrack = AgoraRTC.createCustomVideoTrack({
                        mediaStreamTrack,
                        optimizationMode: videoSettings.videoConfig.optimizationMode || 'motion',
                        facingMode: calculatedFacingMode
                    });

                    console.log(`New track created with ID: ${newVideoTrack.getTrackId()}`);
                } catch (trackError) {
                    console.error("Failed to create custom track:", trackError);

                    // Try fallback approach with direct Agora API
                    try {
                        console.log("Trying fallback with createCameraVideoTrack");
                        newVideoTrack = await AgoraRTC.createCameraVideoTrack({
                            cameraId: targetCamera.deviceId,
                            encoderConfig: {
                                width: videoSettings.videoConfig.width,
                                height: videoSettings.videoConfig.height,
                                frameRate: videoSettings.videoConfig.frameRate,
                                bitrateMin: videoSettings.videoConfig.bitrateMin,
                                bitrateMax: videoSettings.videoConfig.bitrateMax,
                                optimizationMode: videoSettings.videoConfig.optimizationMode
                            },
                            facingMode: calculatedFacingMode
                        });
                        console.log(`Fallback track created with ID: ${newVideoTrack.getTrackId()}`);
                    } catch (fallbackError) {
                        console.error("Fallback approach failed:", fallbackError);
                        toast.dismiss(loadingToast);
                        toast.error("Failed to create video track", {
                            style: {
                                background: '#161A1E',
                                color: '#fff',
                            }
                        });
                        return;
                    }
                }

                console.log("STEP 7: Configuring mirror mode and playing video");
                // Configure mirror mode based on camera type and settings
                if (newVideoTrack.setMirror) {
                    // For front camera (user), use the mirrorMode from settings
                    // For back camera (environment), always set to false (no mirror)
                    const shouldMirror = calculatedFacingMode === "user" ? videoSettings.mirrorMode : false;
                    console.log(`Setting mirror mode: ${shouldMirror} (facingMode: ${calculatedFacingMode}, settings mirror: ${videoSettings.mirrorMode})`);
                    newVideoTrack.setMirror(shouldMirror);
                }

                // Update containers with the new track
                const desktopContainer = document.getElementById('desktop-video-container');
                const mobileContainer = document.getElementById('mobile-video-container');

                // Play video in containers
                console.log("Playing video in containers");

                // Wait a moment before playing to avoid race conditions
                await new Promise(resolve => setTimeout(resolve, 500));

                // Set mirror transform and play in containers
                if (desktopContainer) {
                    console.log("Playing in desktop container");
                    desktopContainer.style.transform = calculatedFacingMode === "user" ? "scaleX(-1)" : "none";
                    try {
                        newVideoTrack.play(desktopContainer.id, {
                            fit: 'cover'
                        });
                    } catch (playError) {
                        console.error("Failed to play in desktop container:", playError);
                    }
                }

                if (mobileContainer) {
                    console.log("Playing in mobile container");
                    mobileContainer.style.transform = calculatedFacingMode === "user" ? "scaleX(-1)" : "none";
                    try {
                        newVideoTrack.play(mobileContainer.id, {
                            fit: 'cover'
                        });
                    } catch (playError) {
                        console.error("Failed to play in mobile container:", playError);
                    }
                }

                console.log("STEP 8: Updating tracks and publishing");
                // Update local tracks array
                const updatedTracks = localTracks.map(track =>
                    track.trackMediaType === 'video' ? newVideoTrack : track
                );
                setLocalTracks(updatedTracks);

                // Publish the new track
                console.log("Publishing new track to Agora channel");
                await client.publish(newVideoTrack);
                console.log(`Track published successfully`);

                // Update state and local storage
                setCameraFacingMode(calculatedFacingMode);

                // Save camera state to localStorage for persistence
                localStorage.setItem(`camera_facing_mode_${id}`, calculatedFacingMode);

                console.log("STEP 9: Camera switch completed");
                toast.dismiss(loadingToast);
                toast.success(`Switched to ${calculatedFacingMode === "user" ? "front" : "back"} camera`, {
                    style: {
                        background: '#161A1E',
                        color: '#fff',
                    }
                });
            } catch (error) {
                console.error("Camera switching failed:", error);
                toast.dismiss(loadingToast);
                toast.error("Camera switching failed", {
                    style: {
                        background: '#161A1E',
                        color: '#fff',
                    }
                });
            }
        } catch (error) {
            console.error("Fatal error in camera switching:", error);
            toast.error("Camera switching failed. Please refresh the app and try again.", {
                style: {
                    background: '#161A1E',
                    color: '#fff',
                }
            });
        }
    };

    // Add code to load camera state from localStorage in initializeStream
    useEffect(() => {
        // Load camera facing mode from localStorage when livestream ID is available
        if (id) {
            const savedCameraMode = localStorage.getItem(`camera_facing_mode_${id}`);
            if (savedCameraMode) {
                setCameraFacingMode(savedCameraMode);
                console.log(`Loaded camera facing mode from storage: ${savedCameraMode}`);
            }
        }
    }, [id]);

    // Function to toggle microphone
    const toggleMicrophone = async () => {
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
    };

    // Handle video settings changes
    const handleApplyVideoSettings = (newSettings) => {
        console.log('Applying new video settings:', newSettings);
        setVideoSettings(newSettings);
        
        // Save settings to localStorage for persistence
        localStorage.setItem(`video_settings_${id}`, JSON.stringify(newSettings));
        
        // If we're already streaming, update the tracks with new settings
        if (isStreaming && localTracks.length > 0) {
            updateVideoTrackSettings(newSettings);
        }
    };
    
    // Update video track settings while streaming
    const updateVideoTrackSettings = async (settings) => {
        try {
            if (!localTracks) return;
            
            const videoTrack = localTracks.find(track => track.trackMediaType === 'video');
            if (!videoTrack) return;
            
            // Apply mirror mode if available
            if (settings.mirrorMode !== undefined) {
              setMirrorMode(settings.mirrorMode);
              // Check if setMirrorMode method exists before calling it
              if (videoTrack.setMirror && typeof videoTrack.setMirror === 'function') {
                await videoTrack.setMirror(settings.mirrorMode);
              } else if (videoTrack.setMirrorMode && typeof videoTrack.setMirrorMode === 'function') {
                await videoTrack.setMirrorMode(settings.mirrorMode);
              } else {
                console.log('Mirror mode method not available on this video track');
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
            
            // Before applying the settings, let's show a toast to the user
            toast.info('Applying video quality settings...');
            
            // Apply the video settings
            await videoTrack.setEncoderConfiguration(encoderConfig);
            
            // Update audio settings if provided and audio track exists
            if (settings.audioConfig) {
              const audioTrack = localTracks.find(track => track.trackMediaType === 'audio');
              if (audioTrack) {
                // Apply audio settings here - this depends on what Agora supports
                if (audioTrack.setEncoderConfiguration) {
                  await audioTrack.setEncoderConfiguration(settings.audioConfig);
                }
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
    };

    // Helper function to get quality label based on encoder config
    const getQualityLabel = (config) => {
      if (config.width >= 1920) return '1080p';
      if (config.width >= 1280) return '720p';
      if (config.width >= 640 && config.height >= 480) return '480p';
      if (config.width >= 640) return '360p';
      return '240p';
    };

    // Handler for opening video settings modal
    const handleOpenVideoSettings = () => {
        setIsVideoSettingsModalOpen(true);
    };

    // Add this function where appropriate
    const calculateDataUsage = (videoConfig, audioConfig) => {
      if (!videoConfig || !audioConfig) return null;
      
      // Calculate video data usage in MB per hour
      // Formula: bitrate (kbps) * 60 * 60 / 8 / 1024 = MB per hour
      const videoBitrate = videoConfig.bitrateMax || 0;
      const audioBitrate = audioConfig.bitrate || 0;
      
      const totalBitrateKbps = videoBitrate + audioBitrate;
      const mbPerHour = Math.round((totalBitrateKbps * 60 * 60) / (8 * 1024));
      
      // Format based on size
      if (mbPerHour >= 1000) {
        return `${(mbPerHour / 1000).toFixed(1)}GB`;
      }
      return `${mbPerHour}MB`;
    };

    return (
        <div className="min-h-screen xl:p-6 bg-[#000000] text-white">
            {
                isLoading || isLiveStreamStarting ? (
                    <div className="flex justify-center items-center h-screen">
                        <CircularProgress size={25} color='#14AE5C' />
                    </div>
                ) : (
                    <>
                        {!isInitialDataLoaded ? (
                            <div className="flex items-center justify-center h-screen">
                                <CircularProgress size={25} color='#14AE5C' />
                            </div>
                        ) : (
                            <>
                                {!isStreaming ? (
                                    <div className="h-full relative ">
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
                                    </div>
                                ) : (
                                    <>
                                        {liveStreamDetails?.type === 'auction' ? (
                                            <>
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
                                            </>
                                        ) : (
                                            <>
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
                                            </>
                                        )}
                                    </>
                                )}
                            </>
                        )}
                    </>
                )
            }

            {/* Video Settings Modal */}
            <VideoSettingsModal
                isOpen={isVideoSettingsModalOpen}
                onClose={() => setIsVideoSettingsModalOpen(false)}
                currentSettings={videoSettings}
                onApplySettings={handleApplyVideoSettings}
                isStreaming={isStreaming}
            />
        </div>
    );

};

export default LivestreamStudio;
