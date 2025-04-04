import { Icon } from '@iconify/react';
import PropTypes from 'prop-types';
import { useState, useEffect, useMemo } from 'react';
import { useLivestreamSocket } from '../Contexts/LivestreamSocketContext';

const OngoingBidProductCard = ({ product, formatCurrency }) => {
    const [timeLeft, setTimeLeft] = useState(0); 
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
    
    // When component mounts, ensure this product is marked as ongoing in the socket context
    useEffect(() => {
        if (productId && product.bidStatus === 'ongoing' && productStatuses[productId] !== 'ongoing') {
            updateProductStatus(productId, 'ongoing');
        }
    }, [productId, product.bidStatus, productStatuses, updateProductStatus]);
    
    // Use the latest bid amount if available, otherwise fall back to the product's current bid
    const currentBid = latestBidData?.currentBid || product?.currentBid || product?.minBid;
    const currentBidder = latestBidData?.currentBidder || product?.currentBidder;

    useEffect(() => {
        // If we have timer data from the socket, use that
        if (timerData?.secondsLeft !== undefined) {
            setTimeLeft(timerData.secondsLeft);
            return;
        }
    }, [timerData]);

    // Format time as MM:SS
    const formatTime = (seconds) => {
        if (timerData?.formattedTime) return timerData.formattedTime;
        
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="bg-[#161A1E] border border-[#C74E5B]/40 flex flex-wrap gap-4 rounded-xl p-3">
            <div className="">
                <img
                    src={product?.product?.images[0]?.url}
                    alt={product?.product?.name}
                    className="w-[62px] h-[62px] object-contain rounded-lg"
                />
            </div>
            <div>
                <p className="text-sm text-[#EFF0FA] font-inter mb-1 line-clamp-2">{product?.product?.name}</p>
                
                {/* Countdown Timer */}
                <div className="flex items-center gap-2 mb-1">
                    <Icon icon="solar:clock-circle-bold" className="w-4 h-4" color="#C74E5B" />
                    <p className="text-sm text-[#C74E5B] font-inter font-medium">
                        Ended: {formatTime(timeLeft)}
                    </p>
                </div>
                
                {/* Current Bid Amount */}
                <div className="flex items-center gap-2 mb-1">
                    <Icon icon="solar:dollar-minimalistic-linear" className="w-4 h-4" color="#14AE5C" />
                    <p className="text-sm text-[#14AE5C] font-inter font-medium">
                        Current Bid: {formatCurrency(currentBid)}
                    </p>
                </div>
                
                {/* Current Bidder Details (if available) */}
                {currentBidder && (
                    <div className="flex items-center gap-2">
                        {currentBidder.profileImage ? (
                            <img 
                                src={currentBidder.profileImage.url} 
                                alt={currentBidder.username || 'Bidder'} 
                                className="w-6 h-6 rounded-full object-cover"
                            />
                        ) : (
                            <Icon icon="solar:user-circle-bold-duotone" className="w-6 h-6" color="#EFF0FA" />
                        )}
                        <p className="text-xs text-[#EFF0FA] font-inter">
                            {currentBidder.username || `${currentBidder.firstName || ''} ${currentBidder.lastName || ''}`}
                        </p>
                    </div>
                )}
            </div>
            <div className="w-full flex items-center justify-center mt-2 bg-[#0D0F12]/70 rounded-lg p-2">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-[#C74E5B] rounded-full animate-pulse"></div>
                    <p className="text-xs text-[#EFF0FA] font-inter">Start next item</p>
                </div>
            </div>
        </div>
    );
};

OngoingBidProductCard.propTypes = {
    product: PropTypes.object.isRequired,
    formatCurrency: PropTypes.func.isRequired
};

export default OngoingBidProductCard; 