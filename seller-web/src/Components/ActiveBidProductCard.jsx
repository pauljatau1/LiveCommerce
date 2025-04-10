import { Icon } from '@iconify/react';
import PropTypes from 'prop-types';
import { useLivestreamSocket } from '../Contexts/LivestreamSocketContext';
import { useMemo, useEffect } from 'react';

const ActiveBidProductCard = ({ product, formatCurrency }) => {
    const { bidUpdates, bidTimers, productStatuses, updateProductStatus } = useLivestreamSocket();
    
    // Get the latest bid data for this product if available
    const productId = product?.product?.productId;
    const latestBidData = useMemo(() => {
        if (!productId || !bidUpdates[productId]) return null;
        return bidUpdates[productId];
    }, [productId, bidUpdates]);
    
    // Get timer data for this product if available
    const timerData = useMemo(() => {
        if (!productId || !bidTimers[productId]) return null;
        return bidTimers[productId];
    }, [productId, bidTimers]);
    
    // When component mounts, ensure this product is marked as active in the socket context
    useEffect(() => {
        if (!productId || !updateProductStatus) return;
        
        console.log(`ActiveBidProductCard mounted/updated for ${productId}, bidStatus=${product.bidStatus}, socketStatus=${productStatuses[productId]}`);
        
        // If socket status shows 'ended' or 'ongoing', respect that and don't try to change it
        if (productStatuses[productId] === 'ended' || productStatuses[productId] === 'ongoing') {
            console.log(`Socket status is '${productStatuses[productId]}' for ${productId}, respecting this status`);
            // Update local bidStatus to match if needed
            if (product.bidStatus !== productStatuses[productId]) {
                product.bidStatus = productStatuses[productId];
            }
            return; // Don't proceed further
        }
        
        if (product.bidStatus === 'active' && !productStatuses[productId]) {
            console.log('Ensuring product is marked as active:', productId);
            updateProductStatus(productId, 'active');
        }
    }, [productId, product.bidStatus, updateProductStatus, productStatuses]);
    
    // Use the latest bid amount if available, otherwise fall back to the product's current bid
    const currentBid = latestBidData?.currentBid || product?.currentBid || product?.minBid;
    const currentBidder = latestBidData?.currentBidder || product?.currentBidder;
    
    return (
        <div className="bg-[#161A1E] border border-[#14AE5C]/40 flex flex-wrap gap-4 rounded-xl p-3">
            <div className="">
                <img
                    src={product?.product?.images[0]?.url}
                    alt={product?.product?.name}
                    className="w-[62px] h-[62px] object-contain rounded-lg"
                />
            </div>
            <div>
                <p className="text-sm text-[#EFF0FA] font-inter mb-1 line-clamp-2">{product?.product?.name}</p>
                
                {/* Timer Display (if available) */}
                {timerData && (
                    <div className="flex items-center gap-2 mb-1">
                        <Icon icon="solar:clock-circle-bold" className="w-4 h-4" color="#FF9800" />
                        <p className="text-sm text-[#FF9800] font-inter font-medium">
                            Time left: {timerData.formattedTime || `${timerData.secondsLeft}s`}
                        </p>
                    </div>
                )}
                
                <div className="flex items-center gap-2 mb-1">
                    <Icon icon="solar:dollar-minimalistic-linear" className="w-4 h-4" color="#14AE5C" />
                    <p className="text-sm text-[#14AE5C] font-inter font-medium">
                        Current Bid: {formatCurrency(currentBid)}
                    </p>
                </div>
                <div className="space-y-1">
                    <div className="flex items-center gap-1">
                        <Icon icon="solar:tag-price-bold-duotone" className="w-4 h-4" color="#718096" />
                        <p className="text-xs text-[#718096] font-inter">
                            Starting Price: {formatCurrency(product?.minBid)}
                        </p>
                    </div>
                    <div className="flex items-center gap-1">
                        <Icon icon="solar:chart-bold-duotone" className="w-4 h-4" color="#718096" />
                        <p className="text-xs text-[#718096] font-inter">
                            Status: <span className="text-[#14AE5C] capitalize">active</span>
                        </p>
                    </div>
                    {currentBidder && (
                        <div className="flex items-center gap-1">
                            <Icon icon="solar:user-circle-bold-duotone" className="w-4 h-4" color="#718096" />
                            <p className="text-xs text-[#718096] font-inter">
                                Current Bidder: <span className="text-[#EFF0FA]">
                                    {currentBidder?.firstName || ''} {currentBidder?.lastName || ''}
                                    {currentBidder?.username ? ` (${currentBidder.username})` : ''}
                                </span>
                            </p>
                        </div>
                    )}
                </div>
            </div>
            <div className="w-full flex items-center justify-center mt-2 bg-[#0D0F12]/70 rounded-lg p-2">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-[#14AE5C] rounded-full animate-pulse"></div>
                    <p className="text-xs text-[#EFF0FA] font-inter">Bidding in progress</p>
                </div>
            </div>
        </div>
    );
};

ActiveBidProductCard.propTypes = {
    product: PropTypes.object.isRequired,
    formatCurrency: PropTypes.func.isRequired
};

export default ActiveBidProductCard; 