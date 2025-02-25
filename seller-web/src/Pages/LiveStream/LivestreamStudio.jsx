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


const client = AgoraRTC.createClient({
    mode: 'live',
    codec: 'vp8',
    role: 'host'
});

const LivestreamStudio = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { setHideSidebar, setFullScreenMode, setHeaderName, setNavName, setShowBackButton } = useOutletContext();
    const { activeStreams, startLiveStream, endLiveStream, fetchedLiveStreams, getLiveStreamFullDetails, isLoading, liveStreamDetails, hasLiveStreamStarted, hasLiveStreamEnded } = useLivestreamContext();
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

    const socket = useSocket();
    const existingLivestream = JSON.parse(localStorage.getItem(`stream_connected_${id}`));

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
            // Request persistent permission first
            const videoPermission = await navigator.permissions.query({ name: 'camera' });
            const audioPermission = await navigator.permissions.query({ name: 'microphone' });
            
            if (videoPermission.state === 'denied' || audioPermission.state === 'denied') {
                setDeviceError('Camera/microphone access is blocked. Please update browser permissions.');
                return false;
            }

            // Keep stream alive for preview before formal track creation
            const previewStream = await navigator.mediaDevices.getUserMedia({
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

            // Return stream instead of closing immediately
            return previewStream;

        } catch (error) {
            setDeviceError(`Device error: ${error.message}. Please check connections and refresh.`);
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
            await client.leave();
            localTracks.forEach(track => {
                track.stop();
                track.close();
            });
            setLocalTracks([]);
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
                    },
                    AEC: true,
                    ANS: true,
                },
                {
                    encoderConfig: {
                        width: 1920,
                        height: 1080,
                        frameRate: 30,
                        bitrateMin: 1000,
                        bitrateMax: 4000,
                        optimizationMode: 'detail'
                    },
                    facingMode: "user",
                    mediaStreamTrack: previewStream.getVideoTracks()[0] // Reuse existing track
                },
                { 
                    timeout: 60000, // Increase timeout to 30s
                    retry: 3 // Add retry attempts
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
                    reject(new Error('Video container not found after 5 seconds'));
                }, 5000);
            });

            // 9. Play and publish
            videoTrack.play(videoContainerRef.current, { fit: 'cover', mirror: true });
            await client.publish([audioTrack, videoTrack]);

            // Set localStorage AFTER successful stream initialization
            localStorage.setItem(`stream_connected_${id}`, JSON.stringify(true));

            // Update tracks and start timer
            setLocalTracks([audioTrack, videoTrack]);
            startTimer();

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

    useEffect(() => {
        if (hasLiveStreamEnded) {
            endStream();
        }
    }, [hasLiveStreamEnded]);

    const endStream = async (button1, button2) => {
        try {
            if (button1 === true) {
                setIsLiveStreamEndingButton1(true);
            } else if (button2 === true) {
                setIsLiveStreamEndingButton2(true);
            }
            
            // 1. Stop all local tracks first
            if (localTracks.length > 0) {
                localTracks.forEach(track => {
                    try {
                        track.stop();  // This releases the hardware resource
                        track.close(); // This removes the track from any associated senders
                    } catch (trackError) {
                        console.error('Error stopping track:', trackError);
                    }
                });
                setLocalTracks([]);
            }

            // 2. Leave the channel and cleanup client
            if (client) {
                try {
                    // Unpublish tracks before leaving
                    await client.unpublish(localTracks);
                } catch (unpublishError) {
                    console.error('Error unpublishing tracks:', unpublishError);
                }
                
                if (client.connectionState === 'CONNECTED') {
                    await client.leave();
                }
                
                // Reset client state
                client.removeAllListeners();
            }

            // 3. Release camera/mic access - Modified section
            const streams = [];
            if (localTracks.some(t => t.getMediaStreamTrack().kind === 'video')) {
                streams.push(...localTracks.map(t => t.getMediaStream()));
            }
            
            // Also stop any permission preview streams
            const previewStream = await checkDevicePermissions();
            if (previewStream) {
                streams.push(previewStream);
            }

            // Stop all media streams
            streams.forEach(stream => {
                stream.getTracks().forEach(track => {
                    track.stop();
                    track.dispatchEvent(new Event('ended')); // Force end event
                });
            });

            // 4. Close any open WebSocket connections
            // Replace with your actual socket cleanup logic
            if (window.streamSocket && window.streamSocket.readyState === WebSocket.OPEN) {
                window.streamSocket.close();
            }

            // 5. Final cleanup before navigation
            setIsStreaming(false);
            stopTimer();
            localStorage.removeItem(`stream_connected_${id}`);

            // 6. End stream with backend
            await endLiveStream(_id);

            // 7. Navigate only after all cleanup
            navigate('/dashboard/live-streams/past-shows');

            toast.success('Livestream ended successfully', {
                style: { background: '#161A1E', color: '#fff' }
            });

        } catch (error) {
            console.error('Error ending stream:', error);
            toast.error('Failed to end stream: ' + error.message, {
                style: { background: '#161A1E', color: '#fff' }
            });
        } finally {
            // Force release media devices through navigator
            navigator.mediaDevices.getUserMedia({ video: true, audio: true })
                .then(stream => {
                    stream.getTracks().forEach(track => track.stop());
                })
                .catch(() => {}); // Intentional empty catch

            // Reset all states
            setIsLiveStreamEndingButton1(false);
            setIsLiveStreamEndingButton2(false);
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
        let interval;
        if (isStreaming) {
            interval = setInterval(() => {
                setStreamDuration(prev => prev + 1);
            }, 1000);
            setTimerInterval(interval);
        }
        
        return () => {
            if (interval) {
                clearInterval(interval);
                setTimerInterval(null);
            }
        };
    }, [isStreaming]);

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


    useEffect(() => {
        const handleConnectionStateChange = async (curState, prevState) => {
            console.log("Connection state:", prevState, "→", curState);

            // Handle disconnection or initial page load
            const isConnected = JSON.parse(localStorage.getItem(`stream_connected_${id}`));
            console.log('curState', curState);
            console.log('prevState', prevState);
            console.log('isConnected', isConnected);
            if ((curState === 'DISCONNECTED' && isConnected) ||
                (prevState === null && isConnected)) {
                try {
                    setIsLiveStreamStarting(true);
                    // Get fresh details including LATEST token
                    const { 
                        status: livestreamStatus,
                        agoraToken, // Backend ensures this is always fresh
                        channelName: currentChannel 
                    } = await getLiveStreamFullDetails(id);

                    console.log('livestreamStatus', livestreamStatus)

                    // Check if stream is no longer active
                    if (livestreamStatus !== 'live' && livestreamStatus !== 'scheduled') {
                        localStorage.removeItem(`stream_connected_${id}`);
                        setIsStreaming(false);
                        toast.error("This stream has ended");
                        return; // Stop execution here
                    }

                    // Rest of reconnection logic only runs if stream is still active
                    await cleanupAgoraResources();
                    await client.setClientRole("host");
                    setIsStreaming(true);

                    await client.join(
                        "6170309cbdb94a6dbdda39aa8a4143d1",
                        currentChannel,
                        agoraToken, // Now using backend-managed fresh token
                        seller.agoraUid
                    );

                    toast.success("Reconnecting to existing stream");

                    const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();

                    await new Promise(resolve => {
                        const check = () => videoContainerRef.current ? resolve() : requestAnimationFrame(check);
                        requestAnimationFrame(check);
                    });

                    videoTrack.play(videoContainerRef.current);
                    await client.publish([audioTrack, videoTrack]);
                    setLocalTracks([audioTrack, videoTrack]);
                    startTimer();

                    toast.success("Reconnected to stream");

                } catch (error) {
                    console.error("Reconnection failed:", error);
                    if (error.code === 'INVALID_OPERATION') {
                        toast.error("Connection error - please refresh the page");
                    }
                    setIsStreaming(false);
                } finally {
                    setIsLiveStreamStarting(false);
                }
            }
        };


        // Check for existing stream on mount
        const isConnected = JSON.parse(localStorage.getItem(`stream_connected_${id}`));
        if (isConnected) {
            handleConnectionStateChange('DISCONNECTED', null);
        }

        client.on('connection-state-change', handleConnectionStateChange);
        return () => client.off('connection-state-change', handleConnectionStateChange);
    }, [channelName, agoraToken, id]);

    // Add this new useEffect for connection state monitoring
    useEffect(() => {
        if (!isStreaming || !channelName || !socket) return;

        // Handle socket connection errors
        socket.on('connect_error', (error) => {
            console.error('Stream monitoring socket error:', error);
            toast.error('Failed to connect to stream monitoring');
        });

        // Join stream monitoring room
        socket.emit('join_stream_monitor', {
            streamId: id,
            channelName,
            hostId: seller.agoraUid
        });

        // Listen for connection state updates from other clients
        socket.on('connection_state', (data) => {
            console.log('Received connection state update:', data);
            // Handle connection state updates from other clients if needed
        });

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

        client.on('connection-state-change', handleConnectionStateChange);

        return () => {
            client.off('connection-state-change', handleConnectionStateChange);
            if (socket.connected) {
                socket.emit('leave_stream_monitor', {
                    streamId: id,
                    hostId: seller.agoraUid
                });
            }
        };
    }, [isStreaming, channelName, id, seller.agoraUid, socket]);

    // Listen for token expiring event
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
    }, [client, id]);

    // Pre-stream DESKTOP UI
    if (!isStreaming) {
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
                                    {/** HEADER */}
                                    <div className="grid grid-cols-1 md:grid-cols-6 xl:grid-cols-12 items-start xl:items-center gap-4 xl:gap-0">
                                        <div className="flex justify-between md:justify-start md:col-span-3 items-center gap-2">
                                            <img src={AuqliLogo} alt="Auqli Logo" className="w-[162px] h-[44.03px]" />
                                            <h1 className="text-white whitespace-nowrap text-xl md:text-2xl font-lexend font-bold">LIVE STUDIO</h1>
                                        </div>
                                        <div className="hidden xl:flex md:col-span-6 items-center justify-center gap-4 xl:gap-8">
                                            <div className="flex items-center h-6 xl:h-12 cursor-pointer px-4 py-3 bg-[#EDF2F7] rounded-md gap-2 hover:bg-[#D6E0F0] transition-all duration-300">
                                                <p className="text-sm font-inter font-medium text-[#7A828A]">https://streamlink.com</p>
                                                <Icon icon="solar:copy-linear" className="w-5 h-5" color='#16783A' />
                                            </div>
                                            <div className="flex items-center h-6 xl:h-12 cursor-pointer px-4 py-3 border w-fit border-[#272A31] rounded-md gap-2 hover:bg-gray-200/10 transition-all duration-300">
                                                <Icon icon="octicon:people-24" className="w-5 h-5" color='#EFF0FA' />
                                                <p className="text-sm font-inter font-medium text-[#EFF0FA]">{viewers.length}</p>
                                            </div>
                                            <div className="flex items-center h-6 xl:h-12 cursor-pointer px-4 py-3 border w-fit border-[#14AE5C] rounded-md gap-2 hover:bg-gray-200/10 transition-all duration-300">
                                                <Icon icon="fluent:share-16-regular" className="w-7 h-7" color='#14AE5C' />
                                                <p className="text-sm font-inter font-medium text-[#EFF0FA]">Shares ({totalShares})</p>
                                            </div>
                                        </div>
                                        <div className="flex md:col-span-3 md:justify-end items-center gap-2">
                                            <button onClick={handleStartStream} className="flex items-center gap-2 border h-9 xl:h-12 text-white p-2 border-[#272A31] rounded-md hover:bg-gray-200/10 transition-all duration-300">
                                                <Icon icon="proicons:record" className="w-5 xl:w-7 h-6 xl:h-7" color="#C74E5B" />
                                            </button>
                                            <div className="flex border border-[#272A31] h-9 xl:h-12 rounded-md items-center">
                                                <button className="flex items-center justify-center gap-2 h-full text-white p-2 hover:bg-gray-200/10 transition-all duration-300">
                                                    <Icon icon="bi:record-fill" className={`w-5 h-5 ${liveStreamDetails ? 'animate-pulse' : ''}`} color="#C74E5B" />
                                                    <p className="text-sm xl:text-base font-inter font-semibold text-[#EFF0FA]">LIVE <span className="text-base font-inter font-medium text-[#EFF0FA] inline-block min-w-[2rem] text-right">0:00</span></p>
                                                </button>
                                                <button onClick={handleStartStream} className="flex items-center justify-center gap-2 border-l border-[#272A31] h-full text-white p-2 hover:bg-gray-200/10 transition-all duration-300">
                                                    <Icon icon="fluent:record-32-regular" className="w-5 h-5" color="#EFF0FA" />
                                                    <p className="text-sm xl:text-base font-inter font-semibold text-[#EFF0FA]">Start</p>
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/** BODY */}
                                    <div className="mt-8 grid grid-cols-12 gap-6 min-h-[calc(100vh-250px)]">
                                        {/* desktop Left Sidebar - Tools */}
                                        <div className="hidden xl:block col-span-12 md:col-span-3 xl:col-span-2 bg-[#0D0F12] rounded-xl p-4">
                                            <div className="space-y-4">
                                                <h2 className="text-[#EFF0FA] font-inter font-medium text-base">Tools</h2>
                                                <div className="space-y-2">
                                                    <button className="w-full flex items-center gap-2 px-4 py-3 bg-transparent hover:bg-gray-200/5 rounded-lg transition-all duration-300">
                                                        <Icon icon="ic:outline-announcement" className="w-5 h-5" color="#14AE5C" />
                                                        <span className="text-[#EFF0FA] font-inter text-sm">Announcement</span>
                                                    </button>
                                                    <button className="w-full flex items-center gap-2 px-4 py-3 bg-transparent hover:bg-gray-200/5 rounded-lg transition-all duration-300">
                                                        <Icon icon="solar:user-block-linear" className="w-5 h-5" color="#C74E5B" />
                                                        <span className="text-[#EFF0FA] font-inter text-sm">Block/Kick User</span>
                                                    </button>
                                                    <button className="w-full flex items-center gap-2 px-4 py-3 bg-transparent hover:bg-gray-200/5 rounded-lg transition-all duration-300">
                                                        <Icon icon="solar:user-plus-linear" className="w-5 h-5" color="#14AE5C" />
                                                        <span className="text-[#EFF0FA] font-inter text-sm">Add Moderator</span>
                                                    </button>
                                                    <button className="w-full flex items-center gap-2 px-4 py-3 bg-transparent hover:bg-gray-200/5 rounded-lg transition-all duration-300">
                                                        <Icon icon="solar:settings-linear" className="w-5 h-5" color="#EFF0FA" />
                                                        <span className="text-[#EFF0FA] font-inter text-sm">Settings</span>
                                                    </button>
                                                </div>

                                                <div className="mt-8">
                                                    <h2 className="text-[#EFF0FA] font-inter font-medium text-base mb-4">Products</h2>
                                                    <div className="space-y-4 max-h-[calc(100vh-450px)] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] ">
                                                        {
                                                            products?.length > 0 ? (
                                                                products?.map((item) => (
                                                                    <div key={item?.product._id} className="bg-[#161A1E] flex  gap-4 rounded-xl p-3">
                                                                        <div className="">
                                                                            <img
                                                                                src={item.product.images[0].url}
                                                                                alt={item.product.name}
                                                                                className="w-[62px] h-[62px] object-contain rounded-lg"
                                                                            />
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-sm text-[#EFF0FA] font-inter mb-1 line-clamp-2">{item.product.name}</p>
                                                                            <p className="text-sm text-[#718096] font-inter font-medium">
                                                                                {formatCurrency(item.product.price)}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <div className="flex flex-col mt-10 items-center justify-center h-full">
                                                                    <p className="text-sm text-[#7A828A] font-inter">No products added yet</p>
                                                                </div>
                                                            )
                                                        }
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {
                                            isToolsSidebarOpen && (
                                                <div className="block xl:hidden fixed left-5 md:left-10 top-20 z-50 max-w-80  col-span-12 md:col-span-3 xl:col-span-2 bg-[#0D0F12] rounded-xl p-4">
                                                    <div className="space-y-4">
                                                        <h2 className="text-[#EFF0FA] font-inter font-medium text-base">Tools</h2>
                                                        <MdClose size={24} className="absolute top-0 right-4 cursor-pointer text-white" onClick={() => setIsToolsSidebarOpen(false)} />
                                                        <div className="space-y-2">
                                                            <button className="w-full flex items-center gap-2 px-4 py-3 bg-transparent hover:bg-gray-200/5 rounded-lg transition-all duration-300">
                                                                <Icon icon="ic:outline-announcement" className="w-5 h-5" color="#14AE5C" />
                                                                <span className="text-[#EFF0FA] font-inter text-sm">Announcement</span>
                                                            </button>
                                                            <button className="w-full flex items-center gap-2 px-4 py-3 bg-transparent hover:bg-gray-200/5 rounded-lg transition-all duration-300">
                                                                <Icon icon="solar:user-block-linear" className="w-5 h-5" color="#C74E5B" />
                                                                <span className="text-[#EFF0FA] font-inter text-sm">Block/Kick User</span>
                                                            </button>
                                                            <button className="w-full flex items-center gap-2 px-4 py-3 bg-transparent hover:bg-gray-200/5 rounded-lg transition-all duration-300">
                                                                <Icon icon="solar:user-plus-linear" className="w-5 h-5" color="#14AE5C" />
                                                                <span className="text-[#EFF0FA] font-inter text-sm">Add Moderator</span>
                                                            </button>
                                                            <button className="w-full flex items-center gap-2 px-4 py-3 bg-transparent hover:bg-gray-200/5 rounded-lg transition-all duration-300">
                                                                <Icon icon="solar:settings-linear" className="w-5 h-5" color="#EFF0FA" />
                                                                <span className="text-[#EFF0FA] font-inter text-sm">Settings</span>
                                                            </button>
                                                        </div>

                                                        <div className="mt-8">
                                                            <h2 className="text-[#EFF0FA] font-inter font-medium text-base mb-4">Products</h2>
                                                            <div className="space-y-4 max-h-[calc(100vh-500px)] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] ">
                                                                {
                                                                    products?.length > 0 ? (
                                                                        products?.map((item) => (
                                                                            <div key={item?.product._id} className="bg-[#161A1E] flex  gap-4 rounded-xl p-3">
                                                                                <div className="">
                                                                                    <img
                                                                                        src={item.product.images[0].url}
                                                                                        alt={item.product.name}
                                                                                        className="w-[62px] h-[62px] object-contain rounded-lg"
                                                                                    />
                                                                                </div>
                                                                                <div>
                                                                                    <p className="text-sm text-[#EFF0FA] font-inter mb-1 line-clamp-2">{item.product.name}</p>
                                                                                    <p className="text-sm text-[#718096] font-inter font-medium">
                                                                                        {formatCurrency(item.product.price)}
                                                                                    </p>
                                                                                </div>
                                                                            </div>
                                                                        ))
                                                                    ) : (
                                                                        <div className="flex flex-col mt-10 items-center justify-center h-full">
                                                                            <p className="text-sm text-[#7A828A] font-inter">No products added yet</p>
                                                                        </div>
                                                                    )
                                                                }
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        }

                                        {/* desktop Main Content - Stream Preview */}
                                        <div className="hidden xl:block col-span-12 md:col-span-6 xl:col-span-7 bg-[#0D0F12] animate-pulse rounded-xl relative overflow-hidden">
                                            <div className="stream-container relative w-full h-full" style={{ aspectRatio: '16/9' }}>
                                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                    <div className="w-24 h-24 bg-[#272A31] rounded-full flex items-center justify-center mb-6">
                                                        <p className="text-white text-2xl font-lexend font-bold">
                                                            {getInitials(firstName, lastName)}
                                                        </p>
                                                    </div>
                                                    {deviceError ? (
                                                        <div className="text-red-500 mb-4 text-center">
                                                            <p>{deviceError}</p>
                                                            <button
                                                                onClick={() => window.location.reload()}
                                                                className="mt-2 text-white bg-red-600 px-4 py-2 rounded-lg"
                                                            >
                                                                Retry
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        existingLivestream ? (
                                                            <button
                                                                onClick={handleStartStream}
                                                                className="bg-[#14AE5C] hover:bg-[#14AE5C]/90 text-white px-8 py-2 rounded-lg font-inter text-sm xl:text-base font-medium transition-all duration-300"
                                                            >
                                                                Reconnect Stream
                                                            </button>

                                                        ) : (
                                                            <button
                                                                onClick={handleStartStream}
                                                                className="bg-[#14AE5C] hover:bg-[#14AE5C]/90 text-white px-8 py-2 rounded-lg font-inter text-sm xl:text-base font-medium transition-all duration-300"
                                                            >
                                                                Start Stream
                                                            </button>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* mobile Main Content - Stream Preview */}
                                        <div className="block xl:hidden col-span-12 bg-[#0D0F12] rounded-xl relative overflow-hidden">
                                            <div className="stream-container relative w-full h-full" style={{ aspectRatio: '16/9' }}>
                                                <div onClick={() => setIsToolsSidebarOpen(!isToolsSidebarOpen)} className="absolute xl:hidden top-4 left-4 cursor-pointer z-10 text-white bg-white/10 backdrop-blur-lg rounded-lg p-2">
                                                    <Icon icon="ri:tools-line" className="w-8 h-8" />
                                                </div>
                                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                    <div className="w-24 h-24 bg-[#272A31] rounded-full flex items-center justify-center mb-6">
                                                        <p className="text-white text-2xl font-lexend font-bold">
                                                            {getInitials(firstName, lastName)}
                                                        </p>
                                                    </div>
                                                    {deviceError ? (
                                                        <div className="text-red-500 mb-4 text-center">
                                                            <p>{deviceError}</p>
                                                            <button
                                                                onClick={() => window.location.reload()}
                                                                className="mt-2 text-white bg-red-600 px-4 py-2 rounded-lg"
                                                            >
                                                                Retry
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        existingLivestream ? (
                                                            <button
                                                                onClick={handleStartStream}
                                                                className="bg-[#14AE5C] hover:bg-[#14AE5C]/90 text-white px-8 py-2 rounded-lg font-inter text-sm xl:text-base font-medium transition-all duration-300"
                                                            >
                                                                Reconnect Stream
                                                            </button>

                                                        ) : (
                                                            <button
                                                                onClick={handleStartStream}
                                                                className="bg-[#14AE5C] hover:bg-[#14AE5C]/90 text-white px-8 py-2 rounded-lg font-inter text-sm xl:text-base font-medium transition-all duration-300"
                                                            >
                                                                Start Stream
                                                            </button>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* desktop Right Sidebar - Activities */}
                                        <div className="hidden xl:block col-span-12 md:col-span-3 xl:col-span-3 bg-[#0D0F12]  rounded-xl p-4">
                                            <div className="h-full flex flex-col">
                                                <h2 className="text-[#EFF0FA] font-inter font-medium text-base mb-4">Activities</h2>
                                                <div className="flex-1 flex flex-col items-center justify-center">
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
                                                <div className="mt-auto pt-4">
                                                    <div className="flex items-center gap-2 bg-[#161A1E] rounded-lg p-3">
                                                        {
                                                            seller?.storeAvatar.url ? (
                                                                <img src={seller?.storeAvatar.url} alt="User" className="w-8 h-8 rounded-full" />
                                                            ) : (
                                                                <Icon icon="hugeicons:user-circle" className="w-8 h-8" color="#EFF0FA" />
                                                            )
                                                        }
                                                        <input
                                                            type="text"
                                                            placeholder="Write a comment..."
                                                            className="flex-1 bg-transparent text-[#EFF0FA] placeholder-[#7A828A] text-sm font-inter focus:outline-none"
                                                        />
                                                        <button className="text-[#14AE5C]">
                                                            <Icon icon="solar:send-linear" className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* mobile Right Sidebar - Activities */}
                                        <div className="block xl:hidden col-span-12 bg-[#0D0F12]  rounded-xl p-4">
                                            <div className="h-full flex flex-col">
                                                <h2 className="text-[#EFF0FA] font-inter font-medium text-base mb-4">Activities</h2>
                                                <div className="flex-1 flex flex-col items-center justify-center">
                                                    <div className="text-center space-y-4">
                                                        <div className="w-16 xl:w-24 h-16 xl:h-24 mx-auto">
                                                            <img src={ChatEmpty} alt="Chat" className="w-full h-full" />
                                                        </div>
                                                        <h3 className="text-[#EFF0FA] font-inter font-medium">Start a livestream</h3>
                                                        <p className="text-[#7A828A] text-sm font-inter">
                                                            There are no messages here yet. Start a livestream to send a message.
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="mt-auto pt-4">
                                                    <div className="flex items-center gap-2 bg-[#161A1E] rounded-lg p-3">
                                                        {
                                                            seller?.storeAvatar.url ? (
                                                                <img src={seller?.storeAvatar.url} alt="User" className="w-8 h-8 rounded-full" />
                                                            ) : (
                                                                <Icon icon="hugeicons:user-circle" className="w-8 h-8" color="#EFF0FA" />
                                                            )
                                                        }
                                                        <input
                                                            type="text"
                                                            placeholder="Write a comment..."
                                                            className="flex-1 bg-transparent text-[#EFF0FA] placeholder-[#7A828A] text-sm font-inter focus:outline-none"
                                                        />
                                                        <button className="text-[#14AE5C]">
                                                            <Icon icon="solar:send-linear" className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Bottom Stats */}
                                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 z-10">
                                        <div className="bg-[#0D0F12] rounded-xl p-4 flex items-center justify-center">
                                            <div className="text-center">
                                                <p className="text-[#14AE5C] font-inter font-medium text-lg">
                                                    {formatCurrency(0)}
                                                </p>
                                                <p className="text-[#7A828A] text-sm font-inter">In sales so far</p>
                                            </div>
                                        </div>
                                        <div className="bg-[#0D0F12] rounded-xl p-4 flex items-center justify-center">
                                            <div className="text-center">
                                                <p className="text-[#EFF0FA] font-inter font-medium text-lg">0</p>
                                                <p className="text-[#7A828A] text-sm font-inter">Items sold</p>
                                            </div>
                                        </div>
                                        <div className="bg-[#0D0F12] rounded-xl p-4 flex items-center justify-center">
                                            <div className="text-center">
                                                <p className="text-[#EFF0FA] font-inter font-medium text-lg">0</p>
                                                <p className="text-[#7A828A] text-sm font-inter">Shared your stream</p>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </>
                    )
                }
            </div>
        );
    } else {
        // Streaming DESKTOP UI
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
                                    {/** HEADER */}
                                    <div className="grid grid-cols-1 md:grid-cols-6 xl:grid-cols-12 items-start xl:items-center gap-4 xl:gap-0">
                                        <div className="flex justify-between md:justify-start md:col-span-3 items-center gap-2">
                                            <img src={AuqliLogo} alt="Auqli Logo" className="w-[162px] h-[44.03px]" />
                                            <h1 className="text-white whitespace-nowrap text-xl md:text-2xl font-lexend font-bold">LIVE STUDIO</h1>
                                        </div>
                                        <div className="hidden xl:flex md:col-span-6 items-center justify-center gap-4 xl:gap-8">
                                            <div className="flex items-center h-6 xl:h-12 cursor-pointer px-4 py-3 bg-[#EDF2F7] rounded-md gap-2 hover:bg-[#D6E0F0] transition-all duration-300">
                                                <p className="text-sm font-inter font-medium text-[#7A828A]">https://streamlink.com</p>
                                                <Icon icon="solar:copy-linear" className="w-5 h-5" color='#16783A' />
                                            </div>
                                            <div className="flex items-center h-6 xl:h-12 cursor-pointer px-4 py-3 border w-fit border-[#272A31] rounded-md gap-2 hover:bg-gray-200/10 transition-all duration-300">
                                                <Icon icon="octicon:people-24" className="w-5 h-5" color='#EFF0FA' />
                                                <p className="text-sm font-inter font-medium text-[#EFF0FA]">{viewers.length}</p>
                                            </div>
                                            <div className="flex items-center h-6 xl:h-12 cursor-pointer px-4 py-3 border w-fit border-[#14AE5C] rounded-md gap-2 hover:bg-gray-200/10 transition-all duration-300">
                                                <Icon icon="fluent:share-16-regular" className="w-7 h-7" color='#14AE5C' />
                                                <p className="text-sm font-inter font-medium text-[#EFF0FA]">Shares ({totalShares})</p>
                                            </div>
                                        </div>
                                        <div className="flex md:col-span-3 md:justify-end items-center gap-2">
                                            <button onClick={() => endStream(true, false)} className="flex items-center gap-2 border h-9 xl:h-12 text-white p-2 border-[#272A31] rounded-md hover:bg-gray-200/10 transition-all duration-300">
                                                {
                                                    isLiveStreamEndingButton1 ? (
                                                        <CircularProgress size={18} color='white' />
                                                    ) : (
                                                        <Icon icon={`${liveStreamDetails ? 'fluent:record-stop-16-regular' : 'proicons:record'}`} className="w-5 xl:w-7 h-6 xl:h-7" color="#C74E5B" />
                                                    )
                                                }
                                            </button>
                                            <div className="flex border border-[#272A31] h-9 xl:h-12 rounded-md items-center">
                                                <button className="flex items-center justify-center gap-2 h-full text-white p-2 hover:bg-gray-200/10 transition-all duration-300">
                                                    <Icon icon="bi:record-fill" className={`w-5 h-5 ${liveStreamDetails ? 'animate-ping ' : ''}`} color="#C74E5B" />
                                                    <p className="text-sm xl:text-base font-inter font-semibold text-[#EFF0FA]">LIVE <span className="text-sm xl:text-base font-inter font-medium text-[#EFF0FA] inline-block min-w-[2rem] text-right ">{formatTime(streamDuration)}</span></p>
                                                </button>
                                                <button onClick={() => endStream(false, true)} className="flex items-center justify-center gap-2 border-l border-[#272A31] h-full text-white p-2 hover:bg-gray-200/10 transition-all duration-300">
                                                    {
                                                        isLiveStreamEndingButton2 ? (
                                                            <CircularProgress size={18} color='white' />
                                                        ) : (
                                                            <>
                                                                <Icon icon="fluent:record-stop-32-regular" className="w-5 h-5" color="#EFF0FA" />
                                                                <p className="text-sm xl:text-base font-inter font-semibold text-[#EFF0FA]">End</p>
                                                            </>
                                                        )
                                                    }
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/** BODY */}
                                    <div className="relative mt-8 grid grid-cols-12 gap-6 h-[calc(100vh-180px)]">
                                        {/* desktop Left Sidebar - Tools */}
                                        <div className="hidden xl:block col-span-12 md:col-span-3 xl:col-span-2 bg-[#0D0F12] rounded-xl p-4">
                                            <div className="space-y-4">
                                                <h2 className="text-[#EFF0FA] font-inter font-medium text-base">Tools</h2>
                                                <div className="space-y-2">
                                                    <button className="w-full flex items-center gap-2 px-4 py-3 bg-transparent hover:bg-gray-200/5 rounded-lg transition-all duration-300">
                                                        <Icon icon="ic:outline-announcement" className="w-5 h-5" color="#14AE5C" />
                                                        <span className="text-[#EFF0FA] font-inter text-sm">Announcement</span>
                                                    </button>
                                                    <button className="w-full flex items-center gap-2 px-4 py-3 bg-transparent hover:bg-gray-200/5 rounded-lg transition-all duration-300">
                                                        <Icon icon="solar:user-block-linear" className="w-5 h-5" color="#C74E5B" />
                                                        <span className="text-[#EFF0FA] font-inter text-sm">Block/Kick User</span>
                                                    </button>
                                                    <button className="w-full flex items-center gap-2 px-4 py-3 bg-transparent hover:bg-gray-200/5 rounded-lg transition-all duration-300">
                                                        <Icon icon="solar:user-plus-linear" className="w-5 h-5" color="#14AE5C" />
                                                        <span className="text-[#EFF0FA] font-inter text-sm">Add Moderator</span>
                                                    </button>
                                                    <button className="w-full flex items-center gap-2 px-4 py-3 bg-transparent hover:bg-gray-200/5 rounded-lg transition-all duration-300">
                                                        <Icon icon="solar:settings-linear" className="w-5 h-5" color="#EFF0FA" />
                                                        <span className="text-[#EFF0FA] font-inter text-sm">Settings</span>
                                                    </button>
                                                </div>

                                                <div className="mt-8">
                                                    <h2 className="text-[#EFF0FA] font-inter font-medium text-base mb-4">Products</h2>
                                                    <div className="space-y-4 max-h-[calc(100vh-500px)] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                                                        {
                                                            products?.length > 0 ? (
                                                                products?.map((item) => (
                                                                    <div key={item?.product._id} className="bg-[#161A1E] flex  gap-4 rounded-xl p-3">
                                                                        <div className="">
                                                                            <img
                                                                                src={item.product.images[0].url}
                                                                                alt={item.product.name}
                                                                                className="w-[62px] h-[62px] object-contain rounded-lg"
                                                                            />
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-sm text-[#EFF0FA] font-inter mb-1 line-clamp-2">{item.product.name}</p>
                                                                            <p className="text-sm text-[#718096] font-inter font-medium">
                                                                                {formatCurrency(item.product.price)}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <div className="flex flex-col mt-10 items-center justify-center h-full">
                                                                    <p className="text-sm text-[#7A828A] font-inter">No products added yet</p>
                                                                </div>
                                                            )
                                                        }
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* mobile Left Sidebar - Tools */}
                                        {
                                            isToolsSidebarOpen && (
                                                <div className="block xl:hidden fixed left-5 md:left-10 top-20 z-50 max-w-80  col-span-12 md:col-span-3 xl:col-span-2 bg-[#0D0F12] rounded-xl p-4">
                                                    <div className="space-y-4">
                                                        <h2 className="text-[#EFF0FA] font-inter font-medium text-base">Tools</h2>
                                                        <MdClose size={24} className="absolute top-0 right-4 cursor-pointer text-white" onClick={() => setIsToolsSidebarOpen(false)} />
                                                        <div className="space-y-2">
                                                            <button className="w-full flex items-center gap-2 px-4 py-3 bg-transparent hover:bg-gray-200/5 rounded-lg transition-all duration-300">
                                                                <Icon icon="ic:outline-announcement" className="w-5 h-5" color="#14AE5C" />
                                                                <span className="text-[#EFF0FA] font-inter text-sm">Announcement</span>
                                                            </button>
                                                            <button className="w-full flex items-center gap-2 px-4 py-3 bg-transparent hover:bg-gray-200/5 rounded-lg transition-all duration-300">
                                                                <Icon icon="solar:user-block-linear" className="w-5 h-5" color="#C74E5B" />
                                                                <span className="text-[#EFF0FA] font-inter text-sm">Block/Kick User</span>
                                                            </button>
                                                            <button className="w-full flex items-center gap-2 px-4 py-3 bg-transparent hover:bg-gray-200/5 rounded-lg transition-all duration-300">
                                                                <Icon icon="solar:user-plus-linear" className="w-5 h-5" color="#14AE5C" />
                                                                <span className="text-[#EFF0FA] font-inter text-sm">Add Moderator</span>
                                                            </button>
                                                            <button className="w-full flex items-center gap-2 px-4 py-3 bg-transparent hover:bg-gray-200/5 rounded-lg transition-all duration-300">
                                                                <Icon icon="solar:settings-linear" className="w-5 h-5" color="#EFF0FA" />
                                                                <span className="text-[#EFF0FA] font-inter text-sm">Settings</span>
                                                            </button>
                                                        </div>

                                                        <div className="mt-8">
                                                            <h2 className="text-[#EFF0FA] font-inter font-medium text-base mb-4">Products</h2>
                                                            <div className="space-y-4 max-h-[calc(100vh-500px)] overflow-x-hidden overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                                                                {
                                                                    products?.length > 0 ? (
                                                                        products?.map((item) => (
                                                                            <div key={item?.product._id} className="bg-[#161A1E] flex  gap-4 rounded-xl p-3">
                                                                                <div className="">
                                                                                    <img
                                                                                        src={item.product.images[0].url}
                                                                                        alt={item.product.name}
                                                                                        className="w-[62px] h-[62px] object-contain rounded-lg"
                                                                                    />
                                                                                </div>
                                                                                <div>
                                                                                    <p className="text-sm text-[#EFF0FA] font-inter mb-1 line-clamp-2">{item.product.name}</p>
                                                                                    <p className="text-sm text-[#718096] font-inter font-medium">
                                                                                        {formatCurrency(item.product.price)}
                                                                                    </p>
                                                                                </div>
                                                                            </div>
                                                                        ))
                                                                    ) : (
                                                                        <div className="flex flex-col mt-10 items-center justify-center h-full">
                                                                            <p className="text-sm text-[#7A828A] font-inter">No products added yet</p>
                                                                        </div>
                                                                    )
                                                                }
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                            )
                                        }
                                        {/* Main Content - Stream Preview */}
                                        <div className="block col-span-12 xl:col-span-7 bg-[#0D0F12] w-full rounded-xl relative overflow-hidden">
                                            <div className="stream-container relative w-full h-full" style={{ aspectRatio: '16/9' }}>

                                                <div onClick={() => setIsToolsSidebarOpen(!isToolsSidebarOpen)} className="absolute xl:hidden top-4 left-4 cursor-pointer z-10 text-white bg-white/10 backdrop-blur-lg rounded-lg p-2">
                                                    <Icon icon="ri:tools-line" className="w-8 h-8" />
                                                </div>
                                                <div
                                                    ref={videoContainerRef}
                                                    className="w-full h-full bg-black"
                                                    style={{
                                                        minHeight: '400px',
                                                        transform: 'scaleX(-1)'
                                                    }}
                                                ></div>
                                            </div>
                                        </div>

                                        {/*desktop Right Sidebar - Activities */}
                                        <div className="hidden xl:block col-span-12 md:col-span-3 xl:col-span-3 bg-[#0D0F12]  rounded-xl p-4">
                                            <div className="h-full flex flex-col">
                                                <h2 className="text-[#EFF0FA] font-inter font-medium text-base mb-4">Activities</h2>
                                                <div className="flex-1 flex flex-col items-center justify-center">
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
                                                <div className="mt-auto pt-4">
                                                    <div className="flex items-center gap-2 bg-[#161A1E] rounded-lg p-3">
                                                        {
                                                            seller?.storeAvatar.url ? (
                                                                <img src={seller?.storeAvatar.url} alt="User" className="w-8 h-8 rounded-full" />
                                                            ) : (
                                                                <Icon icon="hugeicons:user-circle" className="w-8 h-8" color="#EFF0FA" />
                                                            )
                                                        }
                                                        <input
                                                            type="text"
                                                            placeholder="Write a comment..."
                                                            className="flex-1 bg-transparent text-[#EFF0FA] placeholder-[#7A828A] text-sm font-inter focus:outline-none"
                                                        />
                                                        <button className="text-[#14AE5C]">
                                                            <Icon icon="solar:send-linear" className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        {/*mobile Right Sidebar - Activities */}
                                        <div className="block xl:hidden col-span-12 bg-[#0D0F12]  rounded-xl p-4">
                                            <div className="h-full flex flex-col">
                                                <h2 className="text-[#EFF0FA] font-inter font-medium text-base mb-4">Activities</h2>
                                                <div className="flex-1 flex flex-col items-center justify-center">
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
                                                <div className="mt-auto pt-4">
                                                    <div className="flex items-center gap-2 bg-[#161A1E] rounded-lg p-3">
                                                        {
                                                            seller?.storeAvatar.url ? (
                                                                <img src={seller?.storeAvatar.url} alt="User" className="w-8 h-8 rounded-full" />
                                                            ) : (
                                                                <Icon icon="hugeicons:user-circle" className="w-8 h-8" color="#EFF0FA" />
                                                            )
                                                        }
                                                        <input
                                                            type="text"
                                                            placeholder="Write a comment..."
                                                            className="flex-1 bg-transparent text-[#EFF0FA] placeholder-[#7A828A] text-sm font-inter focus:outline-none"
                                                        />
                                                        <button className="text-[#14AE5C]">
                                                            <Icon icon="solar:send-linear" className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bottom Stats */}
                                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 z-10">
                                        <div className="bg-[#0D0F12] rounded-xl p-4 flex items-center justify-center">
                                            <div className="text-center">
                                                <p className="text-[#14AE5C] font-inter font-medium text-lg">
                                                    {formatCurrency(1000000000)}
                                                </p>
                                                <p className="text-[#7A828A] text-sm font-inter">In sales so far</p>
                                            </div>
                                        </div>
                                        <div className="bg-[#0D0F12] rounded-xl p-4 flex items-center justify-center">
                                            <div className="text-center">
                                                <p className="text-[#EFF0FA] font-inter font-medium text-lg">20000</p>
                                                <p className="text-[#7A828A] text-sm font-inter">Items sold</p>
                                            </div>
                                        </div>
                                        <div className="bg-[#0D0F12] rounded-xl p-4 flex items-center justify-center">
                                            <div className="text-center">
                                                <p className="text-[#EFF0FA] font-inter font-medium text-lg">40</p>
                                                <p className="text-[#7A828A] text-sm font-inter">Shared your stream</p>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </>
                    )
                }
            </div>
        );

    }

};

export default LivestreamStudio;
