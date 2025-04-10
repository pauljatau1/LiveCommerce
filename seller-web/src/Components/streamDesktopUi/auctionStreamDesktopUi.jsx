import { Icon } from '@iconify/react';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useLivestreamContext } from '../../Hooks/useLivestreamContext';
import { useLivestreamSocket } from '../../Contexts/LivestreamSocketContext';
import AuqliLogo from '../../assets/auqli-official-logo.png';
import CircularProgress from '@mui/material/CircularProgress';
import PropTypes from 'prop-types';
import ChatSection from './ChatSection';
import BidConfirmationModal from '../BidConfirmationModal';
import ActiveBidProductCard from '../ActiveBidProductCard';
import OngoingBidProductCard from '../OngoingBidProductCard';
import EndedBidProductCard from '../EndedBidProductCard';

const AuctionStreamDesktopUi = ({
    viewers = [],
    totalShares = 0,
    endStream,
    liveStreamDetails,
    isLiveStreamEndingButton1,
    isLiveStreamEndingButton2,
    streamDuration,
    formatTime,
    videoContainerRef,
    products,
    formatCurrency,
    seller,
    isToolsSidebarOpen,
    setIsToolsSidebarOpen
}) => {
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showBidModal, setShowBidModal] = useState(false);
    const { activateProductBidding, isActivatingBid } = useLivestreamContext();
    const { productStatuses = {}, socket = null, updateProductStatus } = useLivestreamSocket();
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
                
                // Set the newly activated product to active
                updateProductStatus(selectedProduct.product.productId, 'active');
                
                // Set all other active and ongoing products to ended
                // This ensures only one product is active at a time
                if (products) {
                    products.forEach(product => {
                        const pid = product.product.productId;
                        // Skip the newly activated product
                        if (pid === selectedProduct.product.productId) return;
                        
                        const currentStatus = productStatuses[pid];
                        
                        // Change both 'active' and 'ongoing' products to 'ended'
                        if (product.bidStatus === 'active' || product.bidStatus === 'ongoing' || 
                            currentStatus === 'active' || currentStatus === 'ongoing') {
                            console.log(`Changing product ${pid} with status ${currentStatus || product.bidStatus} to 'ended' due to new activation`);
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

    return (
        <div className="hidden xl:block">
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

            {/* Bid Confirmation Modal */}
            {showBidModal && (
                <BidConfirmationModal
                    product={selectedProduct}
                    onClose={() => setShowBidModal(false)}
                    onConfirm={handleConfirmBid}
                    isLoading={isActivatingBid}
                />
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
    videoContainerRef: PropTypes.object,
    products: PropTypes.array,
    formatCurrency: PropTypes.func,
    seller: PropTypes.object,
    isToolsSidebarOpen: PropTypes.bool,
    setIsToolsSidebarOpen: PropTypes.func
};

export default AuctionStreamDesktopUi;
