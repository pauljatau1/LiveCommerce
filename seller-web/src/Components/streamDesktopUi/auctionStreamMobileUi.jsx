import { Icon } from '@iconify/react';
import { useState, useEffect, useMemo } from 'react';
import { MdClose } from 'react-icons/md';
import ChatEmpty from '../../assets/Chat Empty.png';
import AuqliLogo from '../../assets/auqli-official-logo.png';
import CircularProgress from '@mui/material/CircularProgress';
import PropTypes from 'prop-types';
import BidConfirmationModal from '../BidConfirmationModal';
import ActiveBidProductCard from '../ActiveBidProductCard';
import OngoingBidProductCard from '../OngoingBidProductCard';
import EndedBidProductCard from '../EndedBidProductCard';
import { useLivestreamContext } from '../../Hooks/useLivestreamContext';
import { useLivestreamSocket } from '../../Contexts/LivestreamSocketContext';
import ChatSection from './ChatSection';

const AuctionStreamMobileUi = ({
    endStream,
    liveStreamDetails,
    isLiveStreamEndingButton1,
    isLiveStreamEndingButton2,
    streamDuration,
    formatTime,
    products,
    formatCurrency,
    seller,
    isToolsSidebarOpen,
    setIsToolsSidebarOpen,
    viewers = [],
    totalShares = 0
}) => {
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showBidModal, setShowBidModal] = useState(false);
    const { activateProductBidding, isActivatingBid } = useLivestreamContext();
    const { productStatuses = {}, socket = null, updateProductStatus } = useLivestreamSocket();

    // Sync products with productStatuses when products change
    useEffect(() => {
        if (products && products.length > 0) {
            // Set initial status in socket context for each product
            products.forEach(product => {
                const productId = product.product.productId;
                // Only set the status if it doesn't already exist in productStatuses
                if (product.bidStatus && !productStatuses[productId]) {
                    updateProductStatus(productId, product.bidStatus);
                }
            });
        }
    }, [products, productStatuses, updateProductStatus]);

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

    // Function to determine the effective status of a product
    const getEffectiveStatus = (product) => {
        const productId = product.product.productId;
        // Socket status takes precedence over local status if available
        const socketStatus = productStatuses[productId];
        if (socketStatus) {
            return socketStatus;
        }
        return product.bidStatus;
    };

    // Check if any product has active bidding using getEffectiveStatus
    const hasActiveBidding = useMemo(() => {
        return products?.some(product => {
            return getEffectiveStatus(product) === 'active';
        });
    }, [products, productStatuses]);

    console.log('Mobile UI - hasActiveBidding', hasActiveBidding, 'productStatuses', productStatuses);

    // Add useEffect to force updates when productStatuses changes
    useEffect(() => {
        console.log('Mobile UI - productStatuses changed:', productStatuses);
        // This empty effect will cause a re-render when productStatuses changes
    }, [productStatuses]);

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
                console.log(`Mobile UI: Immediately updating product ${selectedProduct.product.name} status to 'active' in socket context`);
                
                // Set the newly activated product to active
                updateProductStatus(selectedProduct.product.productId, 'active');
                
                // Set all other active or ongoing products to ended (mirroring the backend logic)
                if (products) {
                    products.forEach(product => {
                        const pid = product.product.productId;
                        if (pid !== selectedProduct.product.productId && 
                            (product.bidStatus === 'active' || product.bidStatus === 'ongoing' || 
                             productStatuses[pid] === 'active' || productStatuses[pid] === 'ongoing')) {
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

    return (
        <div className="block xl:hidden">
            {/** HEADER */}
            <div className="grid grid-cols-1 md:grid-cols-6 items-start gap-4">
                <div className="flex justify-between md:justify-start md:col-span-3 items-center gap-2">
                    <img src={AuqliLogo} alt="Auqli Logo" className="w-[120px] h-[32px] md:w-[162px] md:h-[44.03px]" />
                    <h1 className="text-white whitespace-nowrap text-lg md:text-xl font-lexend font-bold">LIVE STUDIO</h1>
                </div>
                <div className="flex md:col-span-3 md:justify-end items-center gap-2">
                    <button onClick={() => endStream(true, false)} className="flex items-center gap-2 border h-9 text-white p-2 border-[#272A31] rounded-md hover:bg-gray-200/10 transition-all duration-300">
                        {
                            isLiveStreamEndingButton1 ? (
                                <CircularProgress size={18} color='white' />
                            ) : (
                                <Icon icon={`${liveStreamDetails ? 'fluent:record-stop-16-regular' : 'proicons:record'}`} className="w-5 h-6" color="#C74E5B" />
                            )
                        }
                    </button>
                    <div className="flex border border-[#272A31] h-9 rounded-md items-center">
                        <button className="flex items-center justify-center gap-2 h-full text-white p-2 hover:bg-gray-200/10 transition-all duration-300">
                            <Icon icon="bi:record-fill" className={`w-5 h-5 ${liveStreamDetails ? 'animate-ping' : ''}`} color="#C74E5B" />
                            <p className="text-sm font-inter font-semibold text-[#EFF0FA]">LIVE <span className="text-sm font-inter font-medium text-[#EFF0FA] inline-block min-w-[2rem] text-right">{formatTime(streamDuration)}</span></p>
                        </button>
                        <button onClick={() => endStream(false, true)} className="flex items-center justify-center gap-2 border-l border-[#272A31] h-full text-white p-2 hover:bg-gray-200/10 transition-all duration-300">
                            {
                                isLiveStreamEndingButton2 ? (
                                    <CircularProgress size={18} color='white' />
                                ) : (
                                    <>
                                        <Icon icon="fluent:record-stop-32-regular" className="w-5 h-5" color="#EFF0FA" />
                                        <p className="text-sm font-inter font-semibold text-[#EFF0FA]">End</p>
                                    </>
                                )
                            }
                        </button>
                    </div>
                </div>
            </div>

            {/* Viewer stats for mobile - added in a more compact form */}
            <div className="flex items-center justify-between mt-4 mb-2">
                <div className="flex items-center gap-2">
                    <div className="flex items-center px-3 py-2 border w-fit border-[#272A31] rounded-md">
                        <Icon icon="octicon:people-24" className="w-4 h-4 mr-1" color='#EFF0FA' />
                        <p className="text-xs font-inter font-medium text-[#EFF0FA]">{viewers.length}</p>
                    </div>
                    <div className="flex items-center px-3 py-2 border w-fit border-[#14AE5C] rounded-md">
                        <Icon icon="fluent:share-16-regular" className="w-4 h-4 mr-1" color='#14AE5C' />
                        <p className="text-xs font-inter font-medium text-[#EFF0FA]">{totalShares}</p>
                    </div>
                </div>
                <div className="flex items-center cursor-pointer px-3 py-2 bg-[#EDF2F7] rounded-md">
                    <p className="text-xs font-inter font-medium text-[#7A828A] truncate max-w-[100px]">streamlink.com</p>
                    <Icon icon="solar:copy-linear" className="w-4 h-4 ml-1" color='#16783A' />
                </div>
            </div>

            {/* mobile Left Sidebar - Tools */}
            {
                isToolsSidebarOpen && (
                    <div className="block xl:hidden fixed left-5 md:left-10 top-20 z-50 max-w-80 col-span-12 md:col-span-3 xl:col-span-2 bg-[#0D0F12] rounded-xl p-4">
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
                )
            }

            {/*mobile Right Sidebar - Activities */}
            <div className="block xl:hidden col-span-12 bg-[#0D0F12] rounded-xl p-4">
                {liveStreamDetails ? (
                    <ChatSection 
                        streamId={liveStreamDetails._id}
                        seller={seller}
                        liveStreamDetails={liveStreamDetails}
                    />
                ) : (
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
                                    seller?.storeAvatar?.url ? (
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
                )}
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

AuctionStreamMobileUi.propTypes = {
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
    totalShares: PropTypes.number
};

export default AuctionStreamMobileUi;
