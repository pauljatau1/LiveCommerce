import { Icon } from '@iconify/react';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useLivestreamContext } from '../../Hooks/useLivestreamContext';
import { useLivestreamSocket } from '../../Contexts/LivestreamSocketContext';
import { Tooltip, TooltipTrigger, TooltipContent } from '../ui/tooltip';
import AuqliLogo from '../../assets/auqli-official-logo.png';
import CircularProgress from '@mui/material/CircularProgress';
import PropTypes from 'prop-types';
import ChatSection from './ChatSection';
import BidConfirmationModal from '../BidConfirmationModal';
import ActiveBidProductCard from '../ActiveBidProductCard';
import OngoingBidProductCard from '../OngoingBidProductCard';
import EndedBidProductCard from '../EndedBidProductCard';
import StreamQualityIndicator from '../ui/StreamQualityIndicator';

const AuctionStreamDesktopUi = ({
    viewers = [],
    totalShares = 0,
    endStream,
    liveStreamDetails,
    isLiveStreamEndingButton1,
    isLiveStreamEndingButton2,
    streamDuration,
    formatTime,
    products,
    formatCurrency,
    seller,
    orders = [],
    toggleMicrophone,
    isMicrophoneEnabled = true,
    onOpenVideoSettings,
    streamQualityInfo,
    onHideQualityInfo
}) => {
    const [viewerCount, setViewerCount] = useState(viewers?.length || 0);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showBidModal, setShowBidModal] = useState(false);
    const [isVideoReady, setIsVideoReady] = useState(false);

    // Calculate initial sales from orders prop
    const initialSales = orders?.reduce((total, order) => total + (order.amount || 0), 0);

    // Set initial states using orders prop as fallback
    const [totalSales, setTotalSales] = useState(initialSales || 0);
    const [itemsSold, setItemsSold] = useState(orders?.length || 0);
    const [salesModalOpen, setSalesModalOpen] = useState(false);
    const [itemsModalOpen, setItemsModalOpen] = useState(false);
    const [ordersData, setOrdersData] = useState(orders || []);
    const [copySuccess, setCopySuccess] = useState(false);
    const { activateProductBidding, isActivatingBid } = useLivestreamContext();
    const { productStatuses = {}, socket = null, updateProductStatus, notifications } = useLivestreamSocket();
    // Ref to track which products we've processed to prevent infinite loops
    const processedProductsRef = useRef({});

    // Subscribe to stream-specific notifications when component mounts
    useEffect(() => {
        if (liveStreamDetails?._id && socket?.subscribeToStreamNotifications) {
            console.log(`Desktop UI: Subscribing to notifications for stream ${liveStreamDetails._id}`);
            socket.subscribeToStreamNotifications(liveStreamDetails._id);
        }

        // Cleanup function to unsubscribe when component unmounts
        return () => {
            if (liveStreamDetails?._id && socket?.unsubscribeFromStreamNotifications) {
                console.log(`Desktop UI: Unsubscribing from notifications for stream ${liveStreamDetails._id}`);
                socket.unsubscribeFromStreamNotifications(liveStreamDetails._id);
            }
        };
    }, [liveStreamDetails, socket]);

    // Update total sales and items sold when auction_end notifications come in
    useEffect(() => {
        if (notifications.length > 0) {
            // Find auction_end notifications
            const auctionEndNotifications = notifications.filter(
                notification => notification.type === 'auction_end'
            );

            if (auctionEndNotifications.length > 0) {
                // Get the latest auction_end notification
                const latestNotification = auctionEndNotifications[auctionEndNotifications.length - 1];

                if (latestNotification.data?.orders && latestNotification.data.orders.length > 0) {
                    // Store the orders data
                    setOrdersData(latestNotification.data.orders);

                    // Calculate total sales
                    const sales = latestNotification.data.orders.reduce((total, order) => {
                        return total + (order.amount || 0);
                    }, 0);

                    // Count total items sold
                    const items = latestNotification.data.orders.length;

                    // Update state
                    setTotalSales(sales);
                    setItemsSold(items);
                }
            }
        }
    }, [notifications]);

    // Add useEffect to synchronize productStatuses with the products from liveStreamDetails
    useEffect(() => {
        if (!products || products.length === 0 || !updateProductStatus) return;

        const updatedProducts = {};

        // Create a new processed tracking object when products change
        processedProductsRef.current = {};

        // Set initial status in socket context for each product
        products.forEach(product => {
            const productId = product.product.productId;

            // Only update if:
            // 1. The product has a bidStatus AND
            // 2. The socket status is not 'ongoing' (to prevent overriding timer-based status changes) AND
            // 3. We haven't processed this product with this status yet (to prevent infinite loops)
            const productKey = `${productId}-${product.bidStatus}`;

            if (product.bidStatus &&
                productStatuses[productId] !== 'ongoing' &&
                !processedProductsRef.current[productKey]) {

                // Mark this product-status as processed
                processedProductsRef.current[productKey] = true;
                updatedProducts[productId] = product.bidStatus;
            }
        });

        // Only proceed if we have actual updates to make
        if (Object.keys(updatedProducts).length === 0) return;

        console.log('Batch updating product statuses:', updatedProducts);

        // Make a single batch update for all products that need updating
        Object.entries(updatedProducts).forEach(([productId, status]) => {
            updateProductStatus(productId, status);
        });
    }, [products, updateProductStatus]);

    // When a bid is successfully started, notify all clients via socket
    useEffect(() => {
        if (socket && liveStreamDetails && selectedProduct && !showBidModal && !isActivatingBid) {
            // This means a bid was just successfully activated (modal was closed)
            socket.emit('stream_notification', {
                type: 'bid_activated',
                data: {
                    streamId: liveStreamDetails._id,
                    productId: selectedProduct.product.productId,
                    productName: selectedProduct.product.name
                }
            });

            // Reset selected product
            setSelectedProduct(null);
        }
    }, [socket, showBidModal, isActivatingBid, liveStreamDetails, selectedProduct]);

    // Update viewer count when new user join/leave come in
    useEffect(() => {
        if (notifications.length > 0) {
            const latestNotification = notifications[notifications.length - 1];

            // Update viewer count for join/leave notifications
            if ((latestNotification.type === 'join' || latestNotification.type === 'leave') &&
                latestNotification.data?.viewerCount !== undefined) {
                setViewerCount(latestNotification.data.viewerCount);
            }
        }
    }, [notifications, liveStreamDetails]);

    // Monitor the video container to detect when it's ready
    useEffect(() => {
        const checkVideoReady = () => {
            const videoContainer = document.getElementById('desktop-video-container');
            if (videoContainer && videoContainer.childElementCount > 0) {
                setIsVideoReady(true);
            } else {
                setIsVideoReady(false);
            }
        };

        // Check initially
        checkVideoReady();

        // Set up an interval to periodically check if the video container is ready
        const intervalId = setInterval(checkVideoReady, 1000);

        // Clean up interval on unmount
        return () => clearInterval(intervalId);
    }, []);

    const handleStartBid = (product) => {
        setSelectedProduct(product);
        setShowBidModal(true);
    };

    const handleConfirmBid = async () => {
        if (!selectedProduct || !liveStreamDetails) return;

        try {
            await activateProductBidding(liveStreamDetails._id, selectedProduct.product.productId);

            // Immediately update the socket context with the new product status
            if (updateProductStatus) {
                console.log(`Immediately updating product ${selectedProduct.product.name} status to 'active' in socket context`);

                // FIRST: Directly check and end all ongoing products in productStatuses
                Object.entries(productStatuses).forEach(([pid, status]) => {
                    if (pid !== selectedProduct.product.productId && (status === 'active' || status === 'ongoing')) {
                        console.log(`Pre-emptively changing product ${pid} with socket status ${status} to 'ended'`);
                        updateProductStatus(pid, 'ended');
                    }
                });

                // Set the newly activated product to active
                updateProductStatus(selectedProduct.product.productId, 'active');

                // THEN: Handle any products whose state might not be reflected in productStatuses yet
                if (products) {
                    products.forEach(product => {
                        const pid = product.product.productId;
                        // Skip the newly activated product
                        if (pid === selectedProduct.product.productId) return;

                        // Force update the local bidStatus to 'ended' for all other products
                        if (product.bidStatus === 'active' || product.bidStatus === 'ongoing') {
                            console.log(`Forcing local product ${pid} bidStatus from ${product.bidStatus} to 'ended'`);
                            product.bidStatus = 'ended';

                            // Also ensure the socket context is updated
                            updateProductStatus(pid, 'ended');
                        }
                    });
                }
            }

            setShowBidModal(false);
            // The useEffect will handle socket notification
        } catch (error) {
            console.error("Error activating bid:", error);
        }
    };

    // Function to determine the effective status of a product - using memoized function for performance
    const getEffectiveStatus = useMemo(() => {
        return (product) => {
            if (!product?.product?.productId) return product?.bidStatus || 'pending';

            const productId = product.product.productId;
            // Socket status takes precedence over local status if available
            const socketStatus = productStatuses[productId];
            const localStatus = product.bidStatus;

            console.log(`GetEffectiveStatus for ${product.product.name} (${productId}): socket status = ${socketStatus}, product status = ${localStatus}`);

            // If a new bid was just started, ensure 'active' status is shown for this product
            if (selectedProduct && selectedProduct.product.productId === productId && !showBidModal && !isActivatingBid) {
                console.log(`Selected product just had bid confirmed, ensuring 'active' status`);
                return 'active';
            }

            if (socketStatus) {
                return socketStatus;
            }
            return localStatus;
        };
    }, [productStatuses, selectedProduct, showBidModal, isActivatingBid]); // Added dependencies for selected product tracking

    // Check if any product has active bidding by using getEffectiveStatus
    const hasActiveBidding = useMemo(() => {
        return products?.some(product => {
            return getEffectiveStatus(product) === 'active';
        });
    }, [products, getEffectiveStatus]); // depends on getEffectiveStatus which depends on productStatuses

    console.log('Product statuses:', productStatuses, 'Has active bidding:', hasActiveBidding);

    // Function to copy stream link to clipboard
    const copyToClipboard = async () => {
        if (liveStreamDetails?.streamLink) {
            try {
                await navigator.clipboard.writeText(liveStreamDetails.streamLink);
                setCopySuccess(true);
                setTimeout(() => setCopySuccess(false), 2000);
            } catch (err) {
                console.error('Failed to copy: ', err);
            }
        }
    };

    return (
        <div className="hidden xl:block">
            {/* Add StreamQualityIndicator */}
            {streamQualityInfo && (
                <StreamQualityIndicator
                    qualityInfo={streamQualityInfo}
                    onClose={onHideQualityInfo}
                />
            )}
            {/** HEADER */}
            <div className="grid grid-cols-1 md:grid-cols-6 xl:grid-cols-12 items-start xl:items-center gap-4 xl:gap-0">
                <div className="flex justify-between md:justify-start md:col-span-3 items-center gap-2">
                    <img src={AuqliLogo} alt="Auqli Logo" className="w-[162px] h-[44.03px]" />
                    <h1 className="text-white whitespace-nowrap text-xl md:text-2xl font-lexend font-bold">LIVE STUDIO</h1>
                </div>
                <div className="hidden xl:flex md:col-span-6 items-center justify-center gap-4 xl:gap-8">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div
                                onClick={copyToClipboard}
                                className="flex items-center h-6 xl:h-12 cursor-pointer px-4 py-3 bg-[#EDF2F7] rounded-md gap-2 hover:bg-[#D6E0F0] transition-all duration-300"
                            >
                                <p className="text-sm font-inter font-medium text-[#7A828A] truncate max-w-[200px]">{liveStreamDetails?.streamLink}</p>
                                <Icon
                                    icon={copySuccess ? "mdi:check" : "solar:copy-linear"}
                                    className="w-5 h-5"
                                    color={copySuccess ? '#14AE5C' : '#16783A'}
                                />
                            </div>
                        </TooltipTrigger>
                        <TooltipContent className="bg-white/80 backdrop-blur-sm dark:bg-neutral-900/90">
                            <p>{copySuccess ? "Copied!" : "Copy stream link"}</p>
                        </TooltipContent>
                    </Tooltip>
                    <div className="flex items-center h-6 xl:h-12 cursor-pointer px-4 py-3 border w-fit border-[#272A31] rounded-md gap-2 hover:bg-gray-200/10 transition-all duration-300">
                        <Icon icon="octicon:people-24" className="w-5 h-5" color='#EFF0FA' />
                        <p className="text-sm font-inter font-medium text-[#EFF0FA]">{viewerCount}</p>
                    </div>
                    <div className="flex items-center h-6 xl:h-12 cursor-pointer px-4 py-3 border w-fit border-[#14AE5C] rounded-md gap-2 hover:bg-gray-200/10 transition-all duration-300">
                        <Icon icon="fluent:share-16-regular" className="w-7 h-7" color='#14AE5C' />
                        <p className="text-sm font-inter font-medium text-[#EFF0FA]">Shares ({totalShares})</p>
                    </div>
                    <button
                        onClick={toggleMicrophone}
                        className="flex items-center h-6 xl:h-12 cursor-pointer px-4 py-3 border w-fit border-[#272A31] rounded-md gap-2 hover:bg-gray-200/10 transition-all duration-300"
                    >
                        <Icon
                            icon={isMicrophoneEnabled ? "heroicons:microphone-solid" : "bi:mic-mute-fill"}
                            className="w-5 h-5"
                            color={isMicrophoneEnabled ? '#14AE5C' : '#C74E5B'}
                        />
                        <p className="text-sm font-inter font-medium text-[#EFF0FA]">
                            {isMicrophoneEnabled ? 'Mic On' : 'Mic Off'}
                        </p>
                    </button>
                </div>
                <div className="flex md:col-span-3 md:justify-end items-center gap-2">
                    <button onClick={() => endStream(true, false)} className="flex items-center gap-2 border h-9 xl:h-12 text-white p-2 border-[#272A31] rounded-md hover:bg-gray-200/10 transition-all duration-300">
                        {isLiveStreamEndingButton1 ? (
                            <CircularProgress size={18} color='white' />
                        ) : (
                            <Icon icon={liveStreamDetails ? 'fluent:record-stop-16-regular' : 'proicons:record'} className="w-5 xl:w-7 h-6 xl:h-7" color="#C74E5B" />
                        )}
                    </button>
                    <div className="flex border border-[#272A31] h-9 xl:h-12 rounded-md items-center">
                        <button className="flex items-center justify-center gap-2 h-full text-white p-2 hover:bg-gray-200/10 transition-all duration-300">
                            <Icon icon="bi:record-fill" className={`w-5 h-5 ${liveStreamDetails ? 'animate-ping ' : ''}`} color="#C74E5B" />
                            <p className="text-sm xl:text-base font-inter font-semibold text-[#EFF0FA]">LIVE <span className="text-sm xl:text-base font-inter font-medium text-[#EFF0FA] inline-block min-w-[2rem] text-right ">{formatTime(streamDuration)}</span></p>
                        </button>
                        <button onClick={() => endStream(false, true)} className="flex items-center justify-center gap-2 border-l border-[#272A31] h-full text-white p-2 hover:bg-gray-200/10 transition-all duration-300">
                            {isLiveStreamEndingButton2 ? (
                                <CircularProgress size={18} color='white' />
                            ) : (
                                <>
                                    <Icon icon="fluent:record-stop-32-regular" className="w-5 h-5" color="#EFF0FA" />
                                    <p className="text-sm xl:text-base font-inter font-semibold text-[#EFF0FA]">End</p>
                                </>
                            )}
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
                            {/*<button className="w-full flex items-center gap-2 px-4 py-3 bg-transparent hover:bg-gray-200/5 rounded-lg transition-all duration-300">
                                <Icon icon="ic:outline-announcement" className="w-5 h-5" color="#14AE5C" />
                                <span className="text-[#EFF0FA] font-inter text-sm">Announcement</span>
                            </button>}
                            {/*<button className="w-full flex items-center gap-2 px-4 py-3 bg-transparent hover:bg-gray-200/5 rounded-lg transition-all duration-300">
                                <Icon icon="solar:user-block-linear" className="w-5 h-5" color="#C74E5B" />
                                <span className="text-[#EFF0FA] font-inter text-sm">Block/Kick User</span>
                            </button>
                            <button className="w-full flex items-center gap-2 px-4 py-3 bg-transparent hover:bg-gray-200/5 rounded-lg transition-all duration-300">
                                <Icon icon="solar:user-plus-linear" className="w-5 h-5" color="#14AE5C" />
                                <span className="text-[#EFF0FA] font-inter text-sm">Add Moderator</span>
                            </button>*/}
                            <button
                                onClick={onOpenVideoSettings}
                                className="w-full flex items-center gap-2 px-4 py-3 bg-transparent hover:bg-gray-200/5 rounded-lg transition-all duration-300"
                            >
                                <Icon icon="solar:settings-linear" className="w-5 h-5" color="#EFF0FA" />
                                <span className="text-[#EFF0FA] font-inter text-sm">Settings</span>
                            </button>
                        </div>

                        <div className="mt-8">
                            <h2 className="text-[#EFF0FA] font-inter font-medium text-base mb-4">Products</h2>
                            <div className="space-y-4 max-h-[calc(100vh-350px)] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                                {
                                    products?.length > 0 ? (
                                        products?.map((item) => {
                                            // Get the effective status (socket status takes precedence)
                                            const effectiveStatus = getEffectiveStatus(item);

                                            // If product is actively bidding, show the active bid card
                                            if (effectiveStatus === 'active') {
                                                return (
                                                    <ActiveBidProductCard
                                                        key={item?.product.productId}
                                                        product={item}
                                                        formatCurrency={formatCurrency}
                                                    />
                                                );
                                            }

                                            // If product has ongoing bidding, show the ongoing bid card
                                            if (effectiveStatus === 'ongoing') {
                                                return (
                                                    <OngoingBidProductCard
                                                        key={item?.product.productId}
                                                        product={item}
                                                        formatCurrency={formatCurrency}
                                                    />
                                                );
                                            }

                                            // If product bidding has ended, show the ended bid card
                                            if (effectiveStatus === 'ended') {
                                                return (
                                                    <EndedBidProductCard
                                                        key={item?.product.productId}
                                                        product={item}
                                                        formatCurrency={formatCurrency}
                                                    />
                                                );
                                            }

                                            // Otherwise (no bidding status or pending) show the regular product card
                                            return (
                                                <div key={item?.product.productId} className="bg-[#161A1E] flex flex-wrap gap-4 rounded-xl p-3">
                                                    <div className="">
                                                        <img
                                                            src={item?.product?.images[0]?.url}
                                                            alt={item?.product?.name}
                                                            className="w-[62px] h-[62px] object-contain rounded-lg"
                                                        />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-[#EFF0FA] font-inter mb-1 line-clamp-2">{item?.product?.name}</p>
                                                        <p className="text-sm text-[#718096] font-inter font-medium">
                                                            {formatCurrency(item?.product?.price)}
                                                        </p>
                                                    </div>
                                                    <button
                                                        className={`text-[#14AE5C] flex justify-center items-center gap-2 w-full mt-2 border border-[#14AE5C] rounded-lg p-2 hover:bg-[#14AE5C]/10 transition-all duration-300 ${hasActiveBidding ? 'opacity-50 cursor-not-allowed' : ''
                                                            }`}
                                                        onClick={() => !hasActiveBidding && handleStartBid(item)}
                                                        disabled={hasActiveBidding}
                                                    >
                                                        <p className="text-xs 2xl:text-sm font-inter font-medium">Start Bid</p>
                                                        <Icon icon="solar:arrow-right-linear" className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            );
                                        })
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
                <div className="block col-span-12 xl:col-span-7 bg-[#0D0F12] w-full rounded-xl relative overflow-hidden">
                    <div className="stream-container relative w-full h-full" style={{ aspectRatio: '16/9' }}>
                        {/* Video Fallback with green glass-like background when video is not ready */}
                        {!isVideoReady && (
                            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center overflow-hidden">
                                {/* Accurate Google Meet style background */}
                                <div className="absolute inset-0 bg-[#1e3a25]/95"></div>

                                {/* Subtle radial gradient for depth */}
                                <div className="absolute inset-0" style={{
                                    background: 'radial-gradient(circle at center, rgba(40, 78, 48, 0.95) 0%, rgba(30, 58, 37, 0.90) 90%)'
                                }}></div>

                                {/* Light vignette around edges */}
                                <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.5)]"></div>

                                {/* Extremely subtle grain texture */}
                                <div className="absolute inset-0 opacity-[0.02]" style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
                                }}></div>

                                {/* Content */}
                                <div className="relative z-20 flex flex-col items-center justify-center">
                                    <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm mb-6">
                                        <Icon icon="carbon:video" className="w-10 h-10 text-white/90" />
                                    </div>
                                    <p className="text-white text-xl font-medium mb-2">Preparing your stream...</p>
                                    <p className="text-white/70 text-sm">Setting up your camera and microphone</p>
                                    <div className="mt-8">
                                        <div className="h-0.5 w-12 bg-white/20 rounded-full overflow-hidden">
                                            <div className="h-full w-1/2 bg-white/60 rounded-full animate-pulse"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div
                            id="desktop-video-container"
                            className="w-full h-full bg-black"
                            style={{
                                minHeight: '400px',
                            }}
                        ></div>
                    </div>
                </div>

                {/*desktop Right Sidebar - Activities */}
                <div className="hidden xl:block col-span-12 md:col-span-3 xl:col-span-3 bg-[#0D0F12] rounded-xl p-4">
                    {liveStreamDetails && (
                        <ChatSection
                            streamId={liveStreamDetails._id}
                            seller={seller}
                            liveStreamDetails={liveStreamDetails}
                        />
                    )}
                </div>
            </div>

            {/* Bottom Stats */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 z-10">
                <div
                    className="bg-[#0D0F12] rounded-xl p-4 flex items-center justify-center cursor-pointer hover:bg-[#161A1E] transition-all duration-300"
                    onClick={() => setSalesModalOpen(true)}
                >
                    <div className="text-center">
                        <p className="text-[#14AE5C] font-inter font-medium text-lg">
                            {formatCurrency(totalSales || 0)}
                        </p>
                        <p className="text-[#7A828A] text-sm font-inter flex items-center gap-1 justify-center">
                            In sales so far
                            <Icon icon="heroicons:chart-bar" className="w-4 h-4 text-[#14AE5C]" />
                        </p>
                    </div>
                </div>
                <div
                    className="bg-[#0D0F12] rounded-xl p-4 flex items-center justify-center cursor-pointer hover:bg-[#161A1E] transition-all duration-300"
                    onClick={() => setItemsModalOpen(true)}
                >
                    <div className="text-center">
                        <p className="text-[#EFF0FA] font-inter font-medium text-lg">{itemsSold || 0}</p>
                        <p className="text-[#7A828A] text-sm font-inter flex items-center gap-1 justify-center">
                            Items sold
                            <Icon icon="heroicons:cube" className="w-4 h-4 text-[#EFF0FA]" />
                        </p>
                    </div>
                </div>
                <div className="bg-[#0D0F12] rounded-xl p-4 flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-[#EFF0FA] font-inter font-medium text-lg">{totalShares}</p>
                        <p className="text-[#7A828A] text-sm font-inter">Shared your stream</p>
                    </div>
                </div>
            </div>

            {/* Bid Confirmation Modal */}
            {showBidModal && (
                <BidConfirmationModal
                    product={selectedProduct}
                    onClose={() => setShowBidModal(false)}
                    onConfirm={handleConfirmBid}
                    isLoading={isActivatingBid}
                />
            )}

            {/* Sales Analysis Modal */}
            {salesModalOpen && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-[#0D0F12] border border-[#272A31] h-[80dvh] rounded-xl w-full max-w-3xl overflow-y-auto scroll-smooth 
        [&::-webkit-scrollbar]:w-1
        [&::-webkit-scrollbar]:inset-0
        [&::-webkit-scrollbar-track]:rounded-full
        [&::-webkit-scrollbar-track]:bg-[#272A31]
        [&::-webkit-scrollbar-track]:mx-1
        [&::-webkit-scrollbar-track]:my-1
        [&::-webkit-scrollbar-track]:z-10
        [&::-webkit-scrollbar-track]:opacity-0
        [&::-webkit-scrollbar-track]:hover:opacity-100
        [&::-webkit-scrollbar-track]:hover:bg-gray-200/10
        [&::-webkit-scrollbar-track]:hover:border-gray-200/10
        [&::-webkit-scrollbar-track]:hover:border-gray-200/10
        [&::-webkit-scrollbar-track]:hover:border-gray-200/10
        [&::-webkit-scrollbar-track]:hover:border-gray-200/10
        [&::-webkit-scrollbar-track]:hover:border-gray-200/10
        [&::-webkit-scrollbar-track]:hover:border-gray-200/10
        [&::-webkit-scrollbar-track]:hover:border-gray-200/10
        [&::-webkit-scrollbar-track]:hover:border-gray-200/10
        [&::-webkit-scrollbar-track]:hover:border-gray-200/10
        [&::-webkit-scrollbar-track]:hover:border-gray-200/10
        [&::-webkit-scrollbar-thumb]:rounded-full
        [&::-webkit-scrollbar-thumb]:bg-[#7A828A]
        [&::-webkit-scrollbar-thumb]:mx-0.5
        hover:[&::-webkit-scrollbar-thumb]:bg-[#9CA3AF] shadow-2xl transition-all duration-300 transform">
                        <div className="p-4 md:p-6 flex items-center justify-between border-b border-[#272A31]">
                            <div className="flex items-center gap-3">
                                <div className="bg-[#14AE5C]/10 p-2 rounded-full">
                                    <Icon icon="heroicons:chart-bar" className="w-6 h-6 text-[#14AE5C]" />
                                </div>
                                <h2 className="text-[#EFF0FA] font-lexend font-bold text-xl">Sales Analysis</h2>
                            </div>
                            <button
                                onClick={() => setSalesModalOpen(false)}
                                className="text-[#7A828A] hover:text-white transition-colors"
                            >
                                <Icon icon="heroicons:x-mark" className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-4 md:p-6">
                            {/* Key Metrics */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div className="bg-[#161A1E] p-4 rounded-lg">
                                    <p className="text-[#7A828A] text-sm mb-1">Total Revenue</p>
                                    <p className="text-[#14AE5C] text-xl font-semibold">{formatCurrency(totalSales || 0)}</p>
                                </div>
                                <div className="bg-[#161A1E] p-4 rounded-lg">
                                    <p className="text-[#7A828A] text-sm mb-1">Orders</p>
                                    <p className="text-[#EFF0FA] text-xl font-semibold">{ordersData.length}</p>
                                </div>
                                <div className="bg-[#161A1E] p-4 rounded-lg">
                                    <p className="text-[#7A828A] text-sm mb-1">Avg. Order Value</p>
                                    <p className="text-[#EFF0FA] text-xl font-semibold">
                                        {formatCurrency(ordersData.length ? totalSales / ordersData.length : 0)}
                                    </p>
                                </div>
                            </div>

                            {/* Order List */}
                            <div className="mb-6">
                                <h3 className="text-[#EFF0FA] font-medium text-lg mb-3">Recent Orders</h3>
                                <div className="bg-[#161A1E] rounded-lg overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-[#272A31]">
                                                    <th className="text-left p-3 text-[#7A828A] font-medium">Order ID</th>
                                                    <th className="text-left p-3 text-[#7A828A] font-medium">Product</th>
                                                    <th className="text-left p-3 text-[#7A828A] font-medium">Amount</th>
                                                    <th className="text-left p-3 text-[#7A828A] font-medium">Date</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {ordersData.length > 0 ? (
                                                    ordersData.map((order, index) => (
                                                        <tr key={order._id?.$oid || index} className="border-b border-[#272A31] last:border-0 hover:bg-[#272A31]/20">
                                                            <td className="p-3 text-[#EFF0FA]">{order.orderId}</td>
                                                            <td className="p-3 text-[#EFF0FA]">
                                                                {order.orderDetails?.items?.[0]?.productName || "Product"}
                                                            </td>
                                                            <td className="p-3 text-[#14AE5C]">{formatCurrency(order.amount || 0)}</td>
                                                            <td className="p-3 text-[#EFF0FA]">
                                                                {order?.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', {
                                                                    day: 'numeric',
                                                                    month: 'short',
                                                                    year: 'numeric'
                                                                }).replace(/(\d+)(?=\s)/, function (match) {
                                                                    const num = parseInt(match);
                                                                    const suffix = ['th', 'st', 'nd', 'rd'][num % 10 > 3 ? 0 : (num % 100 - num % 10 != 10 ? num % 10 : 0)];
                                                                    return num + suffix;
                                                                }) : "-"}
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="4" className="p-4 text-center text-[#7A828A]">
                                                            No orders found
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* Chart View - Simplified Version */}
                            <div>
                                <h3 className="text-[#EFF0FA] font-medium text-lg mb-3">Revenue Breakdown</h3>
                                <div className="bg-[#161A1E] p-4 rounded-lg min-h-[200px] flex items-center justify-center">
                                    {ordersData.length > 0 ? (
                                        <div className="w-full flex gap-2 items-end h-[180px]">
                                            {ordersData.slice(0, 5).map((order, index) => {
                                                // Calculate height based on amount relative to max amount
                                                const maxAmount = Math.max(...ordersData.slice(0, 5).map(o => o.amount || 0));
                                                const height = maxAmount ? ((order.amount || 0) / maxAmount) * 150 : 0;

                                                return (
                                                    <div key={index} className="flex flex-col items-center">
                                                        <div
                                                            className="w-10 bg-gradient-to-t from-[#14AE5C]/70 to-[#14AE5C] rounded-t-sm"
                                                            style={{ height: `${height}px` }}
                                                        ></div>
                                                        <p className="text-[#7A828A] text-xs mt-2 truncate w-16 text-center">
                                                            {order.orderId.slice(-4)}
                                                        </p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-[#7A828A]">No data available</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t border-[#272A31] flex justify-end">
                            <button
                                onClick={() => setSalesModalOpen(false)}
                                className="px-4 py-2 bg-[#272A31] text-[#EFF0FA] rounded-md hover:bg-[#3A3E47] transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Items Sold Modal */}
            {itemsModalOpen && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-[#0D0F12] border border-[#272A31] h-[65dvh] rounded-xl w-full max-w-3xl overflow-y-auto scroll-smooth  [&::-webkit-scrollbar]:w-1
        [&::-webkit-scrollbar]:inset-0
        [&::-webkit-scrollbar-track]:rounded-full
        [&::-webkit-scrollbar-track]:bg-[#272A31]
        [&::-webkit-scrollbar-track]:mx-1
        [&::-webkit-scrollbar-track]:my-1
        [&::-webkit-scrollbar-track]:z-10
        [&::-webkit-scrollbar-track]:opacity-0
        [&::-webkit-scrollbar-track]:hover:opacity-100
        [&::-webkit-scrollbar-track]:hover:bg-gray-200/10
        [&::-webkit-scrollbar-track]:hover:border-gray-200/10
        [&::-webkit-scrollbar-track]:hover:border-gray-200/10
        [&::-webkit-scrollbar-track]:hover:border-gray-200/10
        [&::-webkit-scrollbar-track]:hover:border-gray-200/10
        [&::-webkit-scrollbar-track]:hover:border-gray-200/10
        [&::-webkit-scrollbar-track]:hover:border-gray-200/10
        [&::-webkit-scrollbar-track]:hover:border-gray-200/10
        [&::-webkit-scrollbar-track]:hover:border-gray-200/10
        [&::-webkit-scrollbar-track]:hover:border-gray-200/10
        [&::-webkit-scrollbar-track]:hover:border-gray-200/10
        [&::-webkit-scrollbar-thumb]:rounded-full
        [&::-webkit-scrollbar-thumb]:bg-[#7A828A]
        [&::-webkit-scrollbar-thumb]:mx-0.5
        hover:[&::-webkit-scrollbar-thumb]:bg-[#9CA3AF] shadow-2xl transition-all duration-300 transform">
                        <div className="p-4 md:p-6 flex items-center justify-between border-b border-[#272A31]">
                            <div className="flex items-center gap-3">
                                <div className="bg-[#EFF0FA]/10 p-2 rounded-full">
                                    <Icon icon="heroicons:cube" className="w-6 h-6 text-[#EFF0FA]" />
                                </div>
                                <h2 className="text-[#EFF0FA] font-lexend font-bold text-xl">Items Sold</h2>
                            </div>
                            <button
                                onClick={() => setItemsModalOpen(false)}
                                className="text-[#7A828A] hover:text-white transition-colors"
                            >
                                <Icon icon="heroicons:x-mark" className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-4 md:p-6">
                            {/* Summary Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div className="bg-[#161A1E] p-4 rounded-lg">
                                    <p className="text-[#7A828A] text-sm mb-1">Total Items</p>
                                    <p className="text-[#EFF0FA] text-xl font-semibold">{itemsSold}</p>
                                </div>
                                <div className="bg-[#161A1E] p-4 rounded-lg">
                                    <p className="text-[#7A828A] text-sm mb-1">Unique Products</p>
                                    <p className="text-[#EFF0FA] text-xl font-semibold">
                                        {new Set(ordersData.map(order =>
                                            order.orderDetails?.items?.[0]?.productName || ''
                                        )).size}
                                    </p>
                                </div>
                                <div className="bg-[#161A1E] p-4 rounded-lg">
                                    <p className="text-[#7A828A] text-sm mb-1">Avg. Price</p>
                                    <p className="text-[#EFF0FA] text-xl font-semibold">
                                        {formatCurrency(
                                            ordersData.length
                                                ? ordersData.reduce((sum, order) => sum + (order.amount || 0), 0) / ordersData.length
                                                : 0
                                        )}
                                    </p>
                                </div>
                            </div>

                            {/* Product Cards */}
                            <div>
                                <h3 className="text-[#EFF0FA] font-medium text-lg mb-3">Products Sold</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {ordersData.length > 0 ? (
                                        ordersData.map((order, index) => {
                                            const product = order.orderDetails?.items?.[0];
                                            if (!product) return null;

                                            return (
                                                <div key={index} className="bg-[#161A1E] h-24 rounded-lg overflow-hidden flex">
                                                    <div className="w-20 p-[5px] rounded-tl-xl h-full rounded-bl-xl bg-gray-800 flex-shrink-0">
                                                        {product.productImages && product.productImages[0]?.url ? (
                                                            <img
                                                                src={product.productImages[0].url}
                                                                alt={product.productName}
                                                                className="w-full rounded-tl-xl rounded-bl-xl h-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center bg-[#272A31]">
                                                                <Icon icon="heroicons:cube" className="w-8 h-8 text-[#7A828A]" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="p-3 flex-1">
                                                        <div className="flex justify-between items-start">
                                                            <h4 className="text-[#EFF0FA] font-medium line-clamp-1">{product.productName}</h4>
                                                            <span className="text-[#14AE5C] font-medium text-sm">
                                                                {formatCurrency(product.price || 0)}
                                                            </span>
                                                        </div>
                                                        <div className="flex mt-2 text-sm text-[#7A828A] gap-4">
                                                            <div className="flex items-center gap-1">
                                                                <Icon icon="heroicons:shopping-bag-mini" className="w-4 h-4" />
                                                                <span>Qty: {product.quantity || 1}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <Icon icon="heroicons:document-text-mini" className="w-4 h-4" />
                                                                <span>Order: {order.orderId.slice(-6)}</span>
                                                            </div>
                                                        </div>
                                                        <div className="mt-1 text-xs">
                                                            <span className="inline-block px-2 py-1 bg-[#272A31] rounded-full text-[#EFF0FA]">
                                                                {order?.createdAt
                                                                    ? new Date(order.createdAt).toLocaleTimeString([], {
                                                                        hour: '2-digit',
                                                                        minute: '2-digit'
                                                                    })
                                                                    : ""}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="col-span-2 bg-[#161A1E] p-6 rounded-lg flex flex-col items-center justify-center">
                                            <Icon icon="heroicons:shopping-bag" className="w-12 h-12 text-[#272A31] mb-2" />
                                            <p className="text-[#7A828A] text-center">No products have been sold yet</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t border-[#272A31] flex justify-end">
                            <button
                                onClick={() => setItemsModalOpen(false)}
                                className="px-4 py-2 bg-[#272A31] text-[#EFF0FA] rounded-md hover:bg-[#3A3E47] transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

AuctionStreamDesktopUi.propTypes = {
    viewers: PropTypes.array,
    totalShares: PropTypes.number,
    endStream: PropTypes.func,
    liveStreamDetails: PropTypes.object,
    isLiveStreamEndingButton1: PropTypes.bool,
    isLiveStreamEndingButton2: PropTypes.bool,
    streamDuration: PropTypes.number,
    formatTime: PropTypes.func,
    products: PropTypes.array,
    formatCurrency: PropTypes.func,
    seller: PropTypes.object,
    orders: PropTypes.array,
    toggleMicrophone: PropTypes.func,
    isMicrophoneEnabled: PropTypes.bool,
    onOpenVideoSettings: PropTypes.func,
    streamQualityInfo: PropTypes.object,
    onHideQualityInfo: PropTypes.func
};

export default AuctionStreamDesktopUi;
