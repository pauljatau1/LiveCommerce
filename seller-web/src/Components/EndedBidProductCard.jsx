import { Icon } from '@iconify/react';
import PropTypes from 'prop-types';
import { useMemo, useEffect } from 'react';
import { useLivestreamSocket } from '../Contexts/LivestreamSocketContext';

const EndedBidProductCard = ({ product, formatCurrency }) => {
    const { bidUpdates, productStatuses, updateProductStatus } = useLivestreamSocket();
    
    // Get the latest bid data for this product if available
    const productId = product?.product?.productId;
    const latestBidData = useMemo(() => {
        if (!productId || !bidUpdates[productId]) return null;
        return bidUpdates[productId];
    }, [productId, bidUpdates]);
    
    // When component mounts, ensure this product is marked as ended in the socket context
    useEffect(() => {
        if (!productId || !updateProductStatus) return;
        
        console.log(`EndedBidProductCard mounted for product ${productId}, bidStatus=${product.bidStatus}, socketStatus=${productStatuses[productId]}`);
        
        // Only update if current bidStatus is 'ended' and socket status isn't already 'ended'
        if (product.bidStatus === 'ended' && productStatuses[productId] !== 'ended') {
            console.log('Ensuring product is marked as ended:', productId);
            updateProductStatus(productId, 'ended');
        }
    }, [productId, product.bidStatus, updateProductStatus, productStatuses]); // Added productStatuses back for consistency
    
    // Use the latest bid amount and bidder if available
    const finalBid = latestBidData?.currentBid || product?.currentBid || product?.minBid;
    const winner = product?.bidWinner?.buyer || (latestBidData?.isWinner ? latestBidData.currentBidder : null);
    
    // Format date to a readable string
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };
    
    // Get the winning time from the product or from the latest bid data
    const winningTime = product?.bidWinner?.winningTime || (latestBidData?.timestamp ? new Date(latestBidData.timestamp) : null);
    
    return (
        <div className="bg-[#161A1E] border border-[#718096]/40 flex flex-wrap gap-4 rounded-xl p-3">
            <div className="">
                <img
                    src={product?.product?.images[0]?.url}
                    alt={product?.product?.name}
                    className="w-[62px] h-[62px] object-contain rounded-lg"
                />
            </div>
            <div>
                <p className="text-sm text-[#EFF0FA] font-inter mb-1 line-clamp-2">{product?.product?.name}</p>
                
                {/* Final Bid Amount */}
                <div className="flex items-center gap-2 mb-1">
                    <Icon icon="solar:dollar-minimalistic-linear" className="w-4 h-4" color="#14AE5C" />
                    <p className="text-sm text-[#14AE5C] font-inter font-medium">
                        Final Bid: {formatCurrency(finalBid)}
                    </p>
                </div>
                
                {/* Winner Details (if available) */}
                {winner && (
                    <div className="flex items-center gap-2 mb-1">
                        {winner.profileImage ? (
                            <img 
                                src={winner.profileImage.url} 
                                alt={winner.username || 'Winner'} 
                                className="w-6 h-6 rounded-full object-cover"
                            />
                        ) : (
                            <Icon icon="solar:user-circle-bold-duotone" className="w-6 h-6" color="#EFF0FA" />
                        )}
                        <p className="text-xs text-[#EFF0FA] font-inter">
                            Winner: {winner.username || `${winner.firstName || ''} ${winner.lastName || ''}`}
                        </p>
                    </div>
                )}
                
                {/* Winning Time */}
                {winningTime && (
                    <div className="flex items-center gap-2 mb-1">
                        <Icon icon="solar:calendar-mark-bold-duotone" className="w-4 h-4" color="#718096" />
                        <p className="text-xs text-[#718096] font-inter">
                            Ended: {formatDate(winningTime)}
                        </p>
                    </div>
                )}
                
                {/* Order Status */}
                <div className="flex items-center gap-2">
                    <Icon 
                        icon={product?.orderCreated ? "solar:check-circle-bold-duotone" : "solar:clock-circle-bold-duotone"} 
                        className="w-4 h-4" 
                        color={product?.orderCreated ? "#14AE5C" : "#718096"} 
                    />
                    <p className="text-xs text-[#718096] font-inter">
                        {product?.orderCreated ? (
                            <span className="text-[#14AE5C]">Order created</span>
                        ) : (
                            <span>Pending order</span>
                        )}
                        {product?.orderId && <span className="ml-1">#{product.orderId.substring(0, 8)}</span>}
                    </p>
                </div>
            </div>
            <div className="w-full flex items-center justify-center mt-2 bg-[#0D0F12]/70 rounded-lg p-2">
                <div className="flex items-center gap-2">
                    <Icon icon="solar:flag-bold-duotone" className="w-4 h-4" color="#718096" />
                    <p className="text-xs text-[#EFF0FA] font-inter">Auction ended</p>
                </div>
            </div>
        </div>
    );
};

EndedBidProductCard.propTypes = {
    product: PropTypes.object.isRequired,
    formatCurrency: PropTypes.func.isRequired
};

export default EndedBidProductCard; 