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
    
    // Ensure this card is displayed when bidStatus is ongoing
    useEffect(() => {
        if (!productId || !updateProductStatus) return;
        
        // Force log whenever this component renders to help debug visibility issues
        console.log(`OngoingBidProductCard mounted/updated for product ${productId}, bidStatus=${product.bidStatus}, socketStatus=${productStatuses[productId]}`);
        
        // If socket status shows 'ended', FORCEFULLY respect that and update the local product object
        if (productStatuses[productId] === 'ended') {
            console.log(`Socket status is 'ended' for ${productId}, FORCING local product bidStatus to match`);
            // Force update local bidStatus to match
            product.bidStatus = 'ended';
            return; // Don't proceed further - this is critical
        }
        
        // If the socket status is different from 'ongoing', don't try to change it back
        // This prevents us from overriding statuses like 'active' or 'ended'
        if (productStatuses[productId] && productStatuses[productId] !== 'ongoing') {
            console.log(`Respecting socket status ${productStatuses[productId]} for ${productId}, not changing to ongoing`);
            product.bidStatus = productStatuses[productId]; // Sync local status with socket
            return;
        }
        
        // If socket status shows 'ongoing', this is the authoritative status
        if (productStatuses[productId] === 'ongoing') {
            // Check if there's another product that's also 'ongoing' in productStatuses
            const otherOngoingProduct = Object.entries(productStatuses).find(
                ([pid, status]) => pid !== productId && status === 'ongoing'
            );
            
            if (otherOngoingProduct) {
                console.log(`Found another ongoing product ${otherOngoingProduct[0]}, ending this one to avoid conflicts`);
                updateProductStatus(productId, 'ended');
                product.bidStatus = 'ended';
                return;
            }
            
            // Update local product bidStatus to match if needed
            if (product.bidStatus !== 'ongoing') {
                console.log(`Updating local product bidStatus to match socket 'ongoing' status`);
                product.bidStatus = 'ongoing'; // Local sync (doesn't trigger re-render)
            }
        } 
        // Otherwise, if local status is 'ongoing', update socket status to match
        else if (product.bidStatus === 'ongoing' && !productStatuses[productId]) {
            console.log('Ensuring product is marked as ongoing in socket context:', productId);
            updateProductStatus(productId, 'ongoing');
        }
    }, [productId, product, productStatuses, updateProductStatus]); // Full dependencies
    
    // Use the latest bid amount if available, otherwise fall back to the product's current bid
    const currentBid = latestBidData?.currentBid || product?.currentBid || product?.minBid;
    const currentBidder = latestBidData?.currentBidder || product?.currentBidder;

    useEffect(() => {
        // If we have timer data from the socket, use that
        if (timerData?.secondsLeft !== undefined) {
            console.log(`Ongoing card setting timeLeft to ${timerData.secondsLeft} for ${productId}`);
            // Ensure we don't set negative values
            setTimeLeft(Math.max(0, timerData.secondsLeft));
            
            // If timer has reached 0, we want to keep the card visible with a "bidding concluded" message
            // The transition to "ended" status will be handled after a delay by LivestreamSocketContext
            if (timerData.secondsLeft <= 0) {
                console.log(`Timer is at 0 for ${productId}, showing concluded state`);
            }
            return;
        }
    }, [timerData, productId]);

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
                        {timeLeft > 0 ? 
                            `Time left: ${formatTime(timeLeft)}` : 
                            "Bidding concluded"
                        }
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