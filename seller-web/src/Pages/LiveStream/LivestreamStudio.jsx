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
        }
    }, []);

    useEffect(() => {
        getLiveStreamFullDetails(id);
    }, [])

    const {
        channelName,
        agoraToken,
        status,
        title,
        products,
        viewers = [],
        _id
    } = liveStreamDetails !== null ? liveStreamDetails : {};

    console.log('fetched agora token', agoraToken)

    const sellerData = localStorage.getItem('seller');
    const seller = JSON.parse(sellerData);
    const firstName = seller?.firstName;
    const lastName = seller?.lastName;

    const checkDevicePermissions = async () => {
        try {
            // Add timeout to handle device selection
            const devices = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });
            // Don't stop tracks immediately - keep stream active for Agora
            return true;
        } catch (error) {
            console.error('Permission check failed:', error);
            setDeviceError(`Device error: ${error.message}. Please check your camera/microphone connections and refresh the page.`);
            return false;
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

    useEffect(() => {
        const abortController = new AbortController();

        const handleReconnection = async () => {
            if (abortController.signal.aborted) return;
            // Check if we have an active stream
            console.log('reconnected status', status)
            if (liveStreamDetails && status === 'live') {
                console.log('reconnecting')
                try {
                    setIsLiveStreamStarting(true);

                    // First, check if client is connected and leave if necessary
                    const connectionState = client.connectionState;
                    if (connectionState === 'CONNECTED' || connectionState === 'CONNECTING') {
                        await client.leave();
                    }

                    await setClientRole();

                    try {
                        await client.join(
                            "6170309cbdb94a6dbdda39aa8a4143d1",
                            channelName,
                            agoraToken,
                            seller.agoraUid,
                        );
                    } catch (error) {
                        console.log('reconnection error', error);
                        if (
                            error.code === 'INVALID_TOKEN' ||
                            error.code === 'TOKEN_EXPIRED' ||
                            error.code === 'ERR_INVALID_TOKEN' ||
                            error.code === 'TOKEN_EXPIRED_GENERATED_TOKEN_INVALID' ||
                            error.code === 'CAN_NOT_GET_GATEWAY_SERVER' ||
                            (error.message && error.message.includes('dynamic key expired'))
                        ) {
                            toast.error("Your scheduled livestream has expired", {
                                description: "Please create and schedule a new livestream.",
                                style: {
                                    background: '#161A1E',
                                    color: '#fff',
                                }
                            });

                        }

                        if (error.code === 'NETWORK_ERROR') {
                            toast.error("Network connection error", {
                                description: "Please check your internet connection.",
                                style: {
                                    background: '#161A1E',
                                    color: '#fff',
                                }
                            });
                            return;
                        }

                        if (error.name === 'AbortError') {
                            console.log('Join operation aborted during cleanup');
                            return;
                        }

                        throw error;
                    }

                    // Recreate and publish tracks
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
                        },
                        {
                            signal: abortController.signal,
                            timeout: 10000 // 10 seconds timeout
                        }
                    ).catch(error => {
                        if (error.name === 'AbortError') {
                            throw new Error('Device activation timeout. Check camera/microphone connections.');
                        }
                        throw error;
                    });

                    setIsStreaming(true);

                    // Wait for video container to be ready
                    await new Promise((resolve) => {
                        const checkContainer = () => {
                            if (videoContainerRef.current) {
                                resolve();
                            } else {
                                setTimeout(checkContainer, 100);
                            }
                        };
                        checkContainer();
                    });

                    // Now play local video after ensuring container exists
                    videoTrack.play(videoContainerRef.current, {
                        fit: 'cover',
                        mirror: true
                    });

                    await client.publish([audioTrack, videoTrack]);
                    setLocalTracks([audioTrack, videoTrack]);
                    setDeviceError(null);
                    startTimer();

                } catch (error) {
                    console.error("Reconnection failed:", error);
                    if (error.code === 'INVALID_OPERATION') {
                        toast.error("Connection error", {
                            description: "Please refresh the page to reconnect.",
                            style: {
                                background: '#161A1E',
                                color: '#fff',
                            }
                        });
                    } else {
                        toast.error("Failed to reconnect to stream. Please refresh the page.");
                    }
                } finally {
                    setIsLiveStreamStarting(false);
                }
            }
        };

        handleReconnection();

        return () => {
            abortController.abort();

            // Cleanup Agora client
            if (client && client.connectionState === 'CONNECTED') {
                client.leave();
            }
        };
    }, [liveStreamDetails]);


    const initializeStream = async () => {
        let timeoutId; // Declare outside try block
        try {
            setIsLiveStreamStarting(true);
            if (!channelName || !agoraToken) {
                throw new Error('Missing channel name or token');
            }

            const hasPermissions = await checkDevicePermissions();
            if (!hasPermissions) {
                throw new Error('Camera/microphone access required. Please refresh and allow permissions.');
            }

            await setClientRole();

            const controller = new AbortController();
            timeoutId = setTimeout(() => controller.abort(), 10000); // Assign here

            try {
                await client.join(
                    "6170309cbdb94a6dbdda39aa8a4143d1",
                    channelName,
                    agoraToken,
                    seller.agoraUid,
                );
            } catch (error) {
                // Check specifically for token expiration
                // Check for specific Agora error codes
                if (
                    error.code === 'INVALID_TOKEN' ||
                    error.code === 'TOKEN_EXPIRED' ||
                    error.code === 'ERR_INVALID_TOKEN' ||
                    error.code === 'TOKEN_EXPIRED_GENERATED_TOKEN_INVALID' ||
                    error.code === 'CAN_NOT_GET_GATEWAY_SERVER' ||
                    (error.message && error.message.includes('dynamic key expired'))
                ) {
                    toast.error("Your scheduled livestream has expired", {
                        description: "Please create and schedule a new livestream.",
                        style: {
                            background: '#161A1E',
                            color: '#fff',
                        }
                    });

                }

                // Handle other connection errors
                if (error.code === 'NETWORK_ERROR') {
                    toast.error("Network connection error", {
                        description: "Please check your internet connection.",
                        style: {
                            background: '#161A1E',
                            color: '#fff',
                        }
                    });
                    return;
                }

                // For any other errors, throw them to be caught by the outer catch block
                throw error;
            }

            // Add timeout handling for device access
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
                },
                {
                    signal: controller.signal,
                    timeout: 10000 // 10 seconds timeout
                }
            ).catch(error => {
                if (error.name === 'AbortError') {
                    throw new Error('Device activation timeout. Check camera/microphone connections.');
                }
                throw error;
            });

            setIsStreaming(true);

            await new Promise(resolve => setTimeout(resolve, 100));

            if (!videoContainerRef.current) {
                throw new Error('Video container not found');
            }

            videoTrack.play(videoContainerRef.current, {
                fit: 'cover',
                mirror: true
            });

            await client.publish([audioTrack, videoTrack]);
            setLocalTracks([audioTrack, videoTrack]);
            setDeviceError(null);
            startTimer();

        } catch (error) {
            console.error("Error starting stream:", error);
            setDeviceError(error.message);
            toast.error(`Stream failed: ${error.message}`, {
                style: {
                    background: '#161A1E',
                    color: '#fff',
                }
            });

            if (client) {
                await client.leave();
            }
            // Stop any tracks that might have been created
            localTracks.forEach(track => track.stop());
            setIsStreaming(false);
        } finally {
            clearTimeout(timeoutId); // Now accessible
            setIsLiveStreamStarting(false);
        }
    };

    useEffect(() => {
        if (hasLiveStreamStarted) {
            initializeStream();
        }
    }, [hasLiveStreamStarted]);

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
            await endLiveStream(_id);

            localTracks.forEach(track => {
                track.stop();
                track.close();
            });
            await client.leave();

            setIsStreaming(false);
            setLocalTracks([]);

            toast.success('Livestream ended successfully', {
                style: {
                    background: '#161A1E',
                    color: '#fff',
                }
            });

            navigate('/dashboard/live-streams/past-shows');

            stopTimer();
            const finalDuration = streamDuration;

        } catch (error) {
            console.error('Error ending stream:', error);
            toast.error('Failed to end stream: ' + error.message, {
                style: {
                    background: '#161A1E',
                    color: '#fff',
                }
            });
        } finally {
            setIsLiveStreamEnding(false);
        }
    };

    const handleStartStream = async () => {
        try {
            await startLiveStream(_id);
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
        return () => {
            stopTimer();
        };
    }, []);

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
        client.on("connection-state-change", (curState, prevState) => {
            console.log("Connection state changed from", prevState, "to", curState);

            if (curState === "DISCONNECTED") {
                toast.error("Disconnected from stream. Attempting to reconnect...");
            }

            if (prevState === "DISCONNECTED" && curState === "CONNECTED") {
                toast.success("Reconnected successfully!");
            }
        });

        return () => {
            client.off("connection-state-change");
        };
    }, []);

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
                            <div className="mt-8 grid grid-cols-12 gap-6 min-h-[calc(100vh-100px)]">
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
                                                <button
                                                    onClick={handleStartStream}
                                                    className="bg-[#14AE5C] hover:bg-[#14AE5C]/90 text-white px-8 py-2 rounded-lg font-inter text-sm xl:text-base font-medium transition-all duration-300"
                                                >
                                                    Start Stream
                                                </button>
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
                                                <button
                                                    onClick={handleStartStream}
                                                    className="bg-[#14AE5C] hover:bg-[#14AE5C]/90 text-white px-8 py-2 rounded-lg font-inter text-sm xl:text-base font-medium transition-all duration-300"
                                                >
                                                    Start Stream
                                                </button>
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


                        </>
                    )
                }
            </div>
        );
    }

    // Streaming DESKTOP UI
    return (
        <div className="min-h-screen p-4 lg:p-6 bg-[#000000] text-white">
            {
                isLoading ? (
                    <div className="flex justify-center items-center h-screen">
                        <CircularProgress size={25} color='#14AE5C' />
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
                            {/* desktop Main Content - Stream Preview */}
                            <div className="hidden xl:block col-span-12 md:col-span-6 xl:col-span-7 bg-[#0D0F12] rounded-xl relative overflow-hidden">
                                <div className="stream-container relative w-full h-full" style={{ aspectRatio: '16/9' }}>
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

                            {/* mobile Main Content - Stream Preview */}
                            <div className="block xl:hidden col-span-12 bg-[#0D0F12] rounded-xl relative overflow-hidden">
                                <div className="stream-container relative w-full h-[calc(100vh-20px)]" style={{ aspectRatio: '16/9' }}>
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
                )
            }
        </div>
    );
};

export default LivestreamStudio;
