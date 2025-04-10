import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOutletContext } from 'react-router-dom';
import { useLivestreamContext } from '../../Hooks/useLivestreamContext';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { FiUsers, FiShare2, FiMessageCircle } from 'react-icons/fi';
import { BsCameraVideo, BsMic, BsGear } from 'react-icons/bs';
import { Icon } from '@iconify/react';
import AuqliLogo from '../../assets/auqli-official-logo.png';
import ChatEmpty from '../../assets/Chat Empty.png';
import NotFoundIcon from '../../assets/livestudio-not-found.png';
import CircularProgress from '@mui/material/CircularProgress';
import { toast } from 'sonner';
import { MdClose } from 'react-icons/md';
import { BASE_URL } from '../../Constants/Server';
import { io } from 'socket.io-client';
import { useSocket } from '../../Contexts/SocketContext';
import { useLivestreamSocket } from '../../Contexts/LivestreamSocketContext';
import PreStreamDesktopUi from '../../Components/preStreamDesktopUi/preStreamDesktopUi';
import PreStreamMobileUi from '../../Components/preStreamDesktopUi/preStreamMobileUi';
import StreamDesktopUi from '../../Components/streamDesktopUi/streamDesktopUi';
import StreamMobileUi from '../../Components/streamDesktopUi/streamMobileUi';
import AuctionStreamDesktopUi from '../../Components/streamDesktopUi/auctionStreamDesktopUi';
import AuctionStreamMobileUi from '../../Components/streamDesktopUi/auctionStreamMobileUi';


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
    const { activeStreams, startLiveStream, endLiveStream, fetchedLiveStreams, getLiveStreamFullDetails, isLoading, liveStreamDetails, hasLiveStreamStarted, hasLiveStreamEnded, joinLiveStreamAsHost } = useLivestreamContext();
    const [localTracks, setLocalTracks] = useState([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const [showChat, setShowChat] = useState(true);
    const [messages, setMessages] = useState([]);
    const [totalSales, setTotalSales] = useState(0);
    const [itemsSold, setItemsSold] = useState(0);
    const [totalShares, setTotalShares] = useState(0);
    const [deviceError, setDeviceError] = useState(null);
    const videoContainerRef = useRef(null);
    const [streamDuration, setStreamDuration] = useState(0);
    const [timerInterval, setTimerInterval] = useState(null);
    const [role, setRole] = useState('host');
    const [isLiveStreamStarting, setIsLiveStreamStarting] = useState(false);
    const [isLiveStreamEndingButton1, setIsLiveStreamEndingButton1] = useState(false);
    const [isLiveStreamEndingButton2, setIsLiveStreamEndingButton2] = useState(false);
    const [isToolsSidebarOpen, setIsToolsSidebarOpen] = useState(false);
    const [isInitialDataLoaded, setIsInitialDataLoaded] = useState(false);
    const [previewMediaStream, setPreviewMediaStream] = useState(null);

    const socket = useSocket();
    const existingLivestream = JSON.parse(localStorage.getItem(`stream_connected_${id}`));

    // Keep the ref for component-level tracking
    const reconnectionInProgress = useRef(false);

    // Add the livstreamSocket context
    const livestreamSocket = useLivestreamSocket();

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
        _id
    } = liveStreamDetails !== null ? liveStreamDetails : {};

    console.log('continuing without livestream data', liveStreamDetails)

    console.log('fetched agora token', agoraToken)

    const sellerData = localStorage.getItem('seller');
    const seller = JSON.parse(sellerData);
    const firstName = seller?.firstName;
    const lastName = seller?.lastName;

    const checkDevicePermissions = async () => {
        try {
            const videoPermission = await navigator.permissions.query({ name: 'camera' });
            const audioPermission = await navigator.permissions.query({ name: 'microphone' });

            if (videoPermission.state === 'denied' || audioPermission.state === 'denied') {
                setDeviceError('Camera/microphone access is blocked. Please grant camera and microphone access.');
                return false;
            }

            // Set up a timeout promise that rejects after 120 seconds
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => {
                    reject(new Error('Device initialization timeout after 120 seconds'));
                }, 120000);
            });

            // Try to get media with a timeout
            const mediaPromise = navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                    frameRate: { ideal: 30 }
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

            // Race between the media initialization and the timeout
            const previewStream = await Promise.race([mediaPromise, timeoutPromise]);

            // Check if camera track is actually receiving data
            const videoTrack = previewStream.getVideoTracks()[0];
            if (videoTrack && !videoTrack.enabled) {
                throw new Error('Camera is not producing video data');
            }

            // Check if audio track is actually receiving data
            const audioTrack = previewStream.getAudioTracks()[0];
            if (audioTrack && !audioTrack.enabled) {
                throw new Error('Microphone is not producing audio data');
            }

            // Store the preview stream in state
            setPreviewMediaStream(previewStream);
            return previewStream;

        } catch (error) {
            // More detailed error handling
            let errorMessage = `Device error: ${error.message}.`;

            if (error.message.includes('timeout')) {
                errorMessage = 'Camera and microphone did not initialize within 120 seconds. Please check your device connections.';
            } else if (error.name === 'NotFoundError') {
                errorMessage = 'Camera or microphone not found. Please connect your devices and try again.';
            } else if (error.name === 'NotReadableError' || error.name === 'AbortError') {
                errorMessage = 'Your camera or microphone is already in use by another application. Please close other apps that might be using your devices.';
            } else if (error.name === 'OverconstrainedError') {
                errorMessage = 'Your camera does not support the required resolution. Please try using a different camera.';
            } else if (error.message.includes('Camera is not producing')) {
                errorMessage = 'Your camera is connected but not producing video. Please check your camera settings or try another device.';
            } else if (error.message.includes('Microphone is not producing')) {
                errorMessage = 'Your microphone is connected but not producing audio. Please check your microphone settings or try another device.';
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

            // 1. Check permissions and keep preview stream alive
            const previewStream = await checkDevicePermissions();
            if (!previewStream) return;

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
                "6170309cbdb94a6dbdda39aa8a4143d1",
                streamCredentials.channelName,
                streamCredentials.agoraToken,
                seller.agoraUid,
            );

            // Check the role after joining the channel
            const currentRole = client.role;
            console.log('Current role:', currentRole);

            // 7. Create tracks AFTER setting isStreaming
            const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks(
                {
                    encoderConfig: {
                        sampleRate: 48000,
                        stereo: true,
                        bitrate: 128,
                        AEC: true,
                        ANS: true,
                        AGC: true
                    }
                },
                {
                    encoderConfig: {
                        width: { ideal: 1920, min: 1280 },
                        height: { ideal: 1080, min: 720 },
                        frameRate: 30,
                        bitrateMin: 1500,
                        bitrateMax: 4000,
                        optimizationMode: 'motion',
                        mirror: true
                    },
                    facingMode: "user",
                    mediaStreamTrack: previewStream.getVideoTracks()[0],
                },
                {
                    timeout: 120000,
                    retry: 3
                }
            );

            // 8. Wait for video container to be ready
            await new Promise((resolve, reject) => {
                const checkInterval = setInterval(() => {
                    if (videoContainerRef.current) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 100);

                setTimeout(() => {
                    clearInterval(checkInterval);
                    reject(new Error('Video container not found after 30 seconds'));
                }, 30000);
            });

            // 9. Play and publish
            videoTrack.play(videoContainerRef.current, {
                fit: 'cover',
                mirror: true
            });
            await client.publish([audioTrack, videoTrack]);

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
            setLocalTracks([audioTrack, videoTrack]);
            //startTimer();

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
            await endLiveStream(_id);
            
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

    {/*// Listen for token expiring event
    useEffect(() => {
        client.on('token-privilege-will-expire', async () => {
            try {
                console.log('Agora token is about to expire, requesting new token...');
                // Call your backend to get a fresh token
                const response = await getLiveStreamFullDetails(id);
                if (response?.agoraToken) {
                    // Renew the token
                    await client.renewToken(response.agoraToken);
                    console.log('Agora token renewed successfully');
                }
            } catch (error) {
                console.error('Failed to renew Agora token:', error);
                toast.error('Stream token expired. Please refresh the page.');
            }
        });

        // Cleanup
        return () => {
            client.off('token-privilege-will-expire');
        };
    }, [client, id]);*/}

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

            // Check permissions
            console.log('🔄 [RECONNECT 11/18] Checking device permissions');
            const previewStream = await checkDevicePermissions();
            if (!previewStream) {
                console.error('❌ [RECONNECT] Device permission check failed');
                globalReconnectionInProgress = false;
                reconnectionInProgress.current = false;
                return;
            }
            console.log('🔄 [RECONNECT 12/18] Device permissions granted');

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
                "6170309cbdb94a6dbdda39aa8a4143d1",
                streamCredentials.channelName,
                streamCredentials.agoraToken,
                mostRecentStream.agoraUid,
            );
            console.log('✅ [RECONNECT] Successfully joined channel');

            // Create tracks after setting isStreaming
            console.log('🔄 [TRACK 1/6] Creating audio and video tracks');
            const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks(
                {
                    encoderConfig: {
                        sampleRate: 48000,
                        stereo: true,
                        bitrate: 128,
                        AEC: true,
                        ANS: true,
                        AGC: true
                    }
                },
                {
                    encoderConfig: {
                        width: { ideal: 1920, min: 1280 },
                        height: { ideal: 1080, min: 720 },
                        frameRate: 60,
                        bitrateMin: 1500,
                        bitrateMax: 4000,
                        optimizationMode: 'motion',
                        mirror: true
                    },
                    facingMode: "user",
                    mediaStreamTrack: previewStream.getVideoTracks()[0],
                },
                {
                    timeout: 120000,
                    retry: 3
                }
            );
            console.log('🔄 [TRACK 2/6] Successfully created audio and video tracks');

            // Wait for video container to be ready
            console.log('🔄 [TRACK 3/6] Waiting for video container to be ready');
            await new Promise((resolve, reject) => {
                const checkInterval = setInterval(() => {
                    if (videoContainerRef.current) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 100);

                setTimeout(() => {
                    clearInterval(checkInterval);
                    reject(new Error('Video container not found after 30 seconds'));
                }, 30000);
            });
            console.log('🔄 [TRACK 4/6] Video container is ready');

            // Play and publish
            console.log('🔄 [TRACK 5/6] Playing video track in container');
            videoTrack.play(videoContainerRef.current, {
                fit: 'cover',
                mirror: true
            });
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
            //startTimer();

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

    // Example of how to send a comment
    const sendComment = (content) => {
        if (liveStreamDetails && liveStreamDetails._id) {
            livestreamSocket.sendStreamComment(liveStreamDetails._id, content);
        } else {
            console.error('Cannot send comment: livestream ID not available');
        }
    };

    return (
        <div className="min-h-screen p-4 lg:p-6 bg-[#000000] text-white">
            {
                isLoading || isLiveStreamStarting ? (
                    <div className="flex justify-center items-center h-screen">
                        <CircularProgress size={25} color='#14AE5C' />
                    </div>
                ) : (
                    <>
                        {!isInitialDataLoaded ? (
                            <div className="flex items-center justify-center h-screen">
                                <CircularProgress />
                            </div>
                        ) : (
                            <>
                                {!isStreaming ? (
                                    <>
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
                                        />
                                    </>
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
                                                    videoContainerRef={videoContainerRef}
                                                    products={products}
                                                    formatCurrency={formatCurrency}
                                                    seller={seller}
                                                    isToolsSidebarOpen={isToolsSidebarOpen}
                                                    setIsToolsSidebarOpen={setIsToolsSidebarOpen}
                                                />
                                                <AuctionStreamMobileUi
                                                    endStream={endStream}
                                                    liveStreamDetails={liveStreamDetails}
                                                    isLiveStreamEndingButton1={isLiveStreamEndingButton1}
                                                    isLiveStreamEndingButton2={isLiveStreamEndingButton2}
                                                    streamDuration={streamDuration}
                                                    formatTime={formatTime}
                                                    videoContainerRef={videoContainerRef}
                                                    products={products}
                                                    formatCurrency={formatCurrency}
                                                    seller={seller}
                                                    isToolsSidebarOpen={isToolsSidebarOpen}
                                                    setIsToolsSidebarOpen={setIsToolsSidebarOpen}
                                                    viewers={viewers}
                                                    totalShares={totalShares}
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
                                                    videoContainerRef={videoContainerRef}
                                                    products={products}
                                                    formatCurrency={formatCurrency}
                                                    seller={seller}
                                                    isToolsSidebarOpen={isToolsSidebarOpen}
                                                    setIsToolsSidebarOpen={setIsToolsSidebarOpen}
                                                />
                                                <StreamMobileUi
                                                    endStream={endStream}
                                                    liveStreamDetails={liveStreamDetails}
                                                    isLiveStreamEndingButton1={isLiveStreamEndingButton1}
                                                    isLiveStreamEndingButton2={isLiveStreamEndingButton2}
                                                    streamDuration={streamDuration}
                                                    formatTime={formatTime}
                                                    videoContainerRef={videoContainerRef}
                                                    products={products}
                                                    formatCurrency={formatCurrency}
                                                    seller={seller}
                                                    isToolsSidebarOpen={isToolsSidebarOpen}
                                                    setIsToolsSidebarOpen={setIsToolsSidebarOpen}
                                                    viewers={viewers}
                                                    totalShares={totalShares}
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
        </div>
    );

};

export default LivestreamStudio;
