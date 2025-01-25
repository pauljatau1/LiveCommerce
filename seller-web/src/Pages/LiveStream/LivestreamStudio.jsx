import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
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

const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

const LivestreamStudio = () => {
    const { id } = useParams();
    const { setHideSidebar, setFullScreenMode } = useOutletContext();
    const { activeStreams, startLiveStream, fetchedLiveStreams, getLiveStreamFullDetails, isLoading, liveStreamDetails, livestreaming, hasLiveStreamStarted } = useLivestreamContext();
    const [localTracks, setLocalTracks] = useState([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const [showChat, setShowChat] = useState(true);
    const [messages, setMessages] = useState([]);
    const [totalSales, setTotalSales] = useState(0);
    const [itemsSold, setItemsSold] = useState(0);
    const [totalShares, setTotalShares] = useState(0);
    const [deviceError, setDeviceError] = useState(null);
    const videoContainerRef = useRef(null);

    const {
        channelName,
        agoraToken,
        title,
        products,
        viewers = [],
        _id
    } = liveStreamDetails !== null ? liveStreamDetails : {};


    useEffect(() => {
        if (setHideSidebar) {
            setHideSidebar(true);
            setFullScreenMode(true);
            return () => {
                setHideSidebar(false);
                setFullScreenMode(false);
            }
        }
    }, [setHideSidebar]);

    useEffect(() => {
        getLiveStreamFullDetails(id);
    }, [])

    const sellerData = localStorage.getItem('seller');
    const seller = JSON.parse(sellerData);
    const firstName = seller?.firstName;
    const lastName = seller?.lastName;

    // Add a function to check device permissions
    const checkDevicePermissions = async () => {
        try {
            const devices = await navigator.mediaDevices.getUserMedia({ 
                video: true, 
                audio: true 
            });
            // Release the streams immediately after checking
            devices.getTracks().forEach(track => track.stop());
            return true;
        } catch (error) {
            console.error('Permission check failed:', error);
            setDeviceError(error.message);
            return false;
        }
    };

    const initializeStream = async () => {
        try {
            if (!channelName || !livestreaming?.agoraToken) {
                throw new Error('Missing channel name or token');
            }

            // Check permissions first
            const hasPermissions = await checkDevicePermissions();
            if (!hasPermissions) {
                throw new Error('Please grant camera and microphone permissions');
            }

            // Join channel first
            await client.join(
                "6170309cbdb94a6dbdda39aa8a4143d1",
                channelName,
                livestreaming.agoraToken,
                seller._id
            );

            // Create tracks with fallback options
            const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks(
                {
                    encoderConfig: "high_quality",
                    AEC: true,
                    ANS: true,
                },
                {
                    encoderConfig: {
                        width: 1280,
                        height: 720,
                        frameRate: 30,
                        bitrateMin: 600,
                        bitrateMax: 2000,
                    },
                    facingMode: "user",
                }
            );

            // Set streaming state before playing video
            setIsStreaming(true);

            // Wait for a moment to ensure the container is rendered
            await new Promise(resolve => setTimeout(resolve, 100));

            // Make sure video container exists
            if (!videoContainerRef.current) {
                throw new Error('Video container not found');
            }

            // Play video track
            videoTrack.play(videoContainerRef.current, { 
                fit: 'cover',
                mirror: true
            });

            await client.publish([audioTrack, videoTrack]);
            setLocalTracks([audioTrack, videoTrack]);
            setDeviceError(null);

        } catch (error) {
            console.error("Error starting stream:", error);
            setDeviceError(error.message);
            toast.error('Failed to initialize stream: ' + error.message);
            
            // Cleanup on error
            if (client) {
                await client.leave();
            }
            setIsStreaming(false);
        }
    };

    useEffect(() => {
        if (hasLiveStreamStarted) {
            initializeStream();
        }
    }, [hasLiveStreamStarted]);

    const stopStream = async () => {
        try {
            localTracks.forEach(track => track.stop());
            await client.leave();
            setIsStreaming(false);
        } catch (error) {
            console.error("Error stopping stream:", error);
        }
    };

    const handleStartStream = async () => {
        try {
            // First start the stream on backend
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

    // Pre-stream UI
    if (!isStreaming) {
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
                            <div className="flex flex-col md:flex-row justify-start md:justify-between items-start xl:items-center gap-4 xl:gap-0">
                                <div className="flex justify-between md:justify-start w-full md:w-fit items-center gap-2">
                                    <img src={AuqliLogo} alt="Auqli Logo" className="w-[162px] h-[44.03px]" />
                                    <h1 className="text-white whitespace-nowrap text-xl md:text-2xl font-lexend font-bold">LIVE STUDIO</h1>
                                </div>
                                <div className="hidden xl:flex items-center gap-4 xl:gap-8">
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
                                <div className="flex items-center gap-2">
                                    <button onClick={handleStartStream} className="flex items-center gap-2 border h-9 xl:h-12 text-white p-2 border-[#272A31] rounded-md hover:bg-gray-200/10 transition-all duration-300">
                                        <Icon icon="proicons:record" className="w-5 xl:w-7 h-6 xl:h-7" color="#C74E5B" />
                                    </button>
                                    <div className="flex border border-[#272A31] h-9 xl:h-12 rounded-md items-center">
                                        <button className="flex items-center justify-center gap-2 h-full text-white p-2 hover:bg-gray-200/10 transition-all duration-300">
                                            <Icon icon="bi:record-fill" className="w-5 h-5" color="#C74E5B" />
                                            <p className="text-sm xl:text-base font-inter font-semibold text-[#EFF0FA]">LIVE <span className="text-sm font-inter font-medium text-[#EFF0FA]">0:00</span></p>
                                        </button>
                                        <button className="flex items-center justify-center gap-2 border-l border-[#272A31] h-full text-white p-2 hover:bg-gray-200/10 transition-all duration-300">
                                            <Icon icon="fluent:record-stop-32-regular" className="w-5 h-5" color="#EFF0FA" />
                                            <p className="text-sm xl:text-base font-inter font-semibold text-[#EFF0FA]">End</p>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/** BODY */}
                            <div className="mt-8 grid grid-cols-12 gap-6 h-[calc(100vh-180px)]">
                                {/* Left Sidebar - Tools */}
                                <div className="col-span-12 md:col-span-3 xl:col-span-2 bg-[#0D0F12] rounded-xl p-4">
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
                                            <div className="space-y-4 max-h-[calc(100vh-500px)] overflow-y-auto custom-scrollbar ">
                                                {
                                                    products?.length > 0 ? (
                                                        products?.map((item) => (
                                                            <div key={item?.product._id} className="bg-[#161A1E] flex gap-2 rounded-xl p-3">
                                                                <div className="relative aspect-video w-full mb-3">
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

                                {/* Main Content - Stream Preview */}
                                <div className="col-span-12 md:col-span-6 xl:col-span-7 bg-[#0D0F12] rounded-xl relative overflow-hidden">
                                    <div className="stream-container relative w-full h-full" style={{ aspectRatio: '16/9' }}>
                                        {!isStreaming ? (
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
                                        ) : (
                                            <div 
                                                ref={videoContainerRef}
                                                className="w-full h-full bg-black"
                                                style={{ 
                                                    minHeight: '400px',
                                                    transform: 'scaleX(-1)'
                                                }}
                                            ></div>
                                        )}
                                    </div>
                                </div>

                                {/* Right Sidebar - Activities */}
                                <div className="col-span-12 md:col-span-3 xl:col-span-3 bg-[#0D0F12]  rounded-xl p-4">
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
                            <div className="mt-6 grid grid-cols-3 gap-4 z-10">
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
                    )
                }
            </div>
        );
    }

    // Streaming UI
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
                        <div className="flex flex-col md:flex-row justify-start md:justify-between items-start xl:items-center gap-4 xl:gap-0">
                            <div className="flex justify-between md:justify-start w-full md:w-fit items-center gap-2">
                                <img src={AuqliLogo} alt="Auqli Logo" className="w-[162px] h-[44.03px]" />
                                <h1 className="text-white whitespace-nowrap text-xl md:text-2xl font-lexend font-bold">LIVE STUDIO</h1>
                            </div>
                            <div className="hidden xl:flex items-center gap-4 xl:gap-8">
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
                            <div className="flex items-center gap-2">
                                <button onClick={handleStartStream} className="flex items-center gap-2 border h-9 xl:h-12 text-white p-2 border-[#272A31] rounded-md hover:bg-gray-200/10 transition-all duration-300">
                                    <Icon icon="proicons:record" className="w-5 xl:w-7 h-6 xl:h-7" color="#C74E5B" />
                                </button>
                                <div className="flex border border-[#272A31] h-9 xl:h-12 rounded-md items-center">
                                    <button className="flex items-center justify-center gap-2 h-full text-white p-2 hover:bg-gray-200/10 transition-all duration-300">
                                        <Icon icon="bi:record-fill" className="w-5 h-5" color="#C74E5B" />
                                        <p className="text-sm xl:text-base font-inter font-semibold text-[#EFF0FA]">LIVE <span className="text-sm font-inter font-medium text-[#EFF0FA]">0:00</span></p>
                                    </button>
                                    <button className="flex items-center justify-center gap-2 border-l border-[#272A31] h-full text-white p-2 hover:bg-gray-200/10 transition-all duration-300">
                                        <Icon icon="fluent:record-stop-32-regular" className="w-5 h-5" color="#EFF0FA" />
                                        <p className="text-sm xl:text-base font-inter font-semibold text-[#EFF0FA]">End</p>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/** BODY */}
                        <div className="mt-8 grid grid-cols-12 gap-6 h-[calc(100vh-180px)]">
                            {/* Left Sidebar - Tools */}
                            <div className="col-span-12 md:col-span-3 xl:col-span-2 bg-[#0D0F12] rounded-xl p-4">
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
                                        <div className="space-y-4 max-h-[calc(100vh-500px)] overflow-y-auto custom-scrollbar">
                                            {
                                                products?.length > 0 ? (
                                                    products?.map((item) => (
                                                        <div key={item?.product._id} className="bg-[#161A1E] flex gap-2 rounded-xl p-3">
                                                            <div className="relative aspect-video w-full mb-3">
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

                            {/* Main Content - Stream Preview */}
                            <div className="col-span-12 md:col-span-6 xl:col-span-7 bg-[#0D0F12] rounded-xl relative overflow-hidden">
                                <div className="stream-container relative w-full h-full" style={{ aspectRatio: '16/9' }}>
                                    {!isStreaming ? (
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
                                    ) : (
                                        <div 
                                            ref={videoContainerRef}
                                            className="w-full h-full bg-black"
                                            style={{ 
                                                minHeight: '400px',
                                                transform: 'scaleX(-1)'
                                            }}
                                        ></div>
                                    )}
                                </div>
                            </div>

                            {/* Right Sidebar - Activities */}
                            <div className="col-span-12 md:col-span-3 xl:col-span-3 bg-[#0D0F12]  rounded-xl p-4">
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
                        <div className="mt-6 grid grid-cols-3 gap-4 z-10">
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
                )
            }
        </div>
    );
};

export default LivestreamStudio;
