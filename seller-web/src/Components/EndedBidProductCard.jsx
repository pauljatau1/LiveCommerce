import { Icon } from '@iconify/react';
import PropTypes from 'prop-types';

const EndedBidProductCard = ({ product, formatCurrency }) => {
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
                        Final Bid: {formatCurrency(product?.currentBid > 0 ? product?.currentBid : product?.minBid)}
                    </p>
                </div>
                
                {/* Winner Details (if available) */}
                {product?.bidWinner?.buyer && (
                    <div className="flex items-center gap-2 mb-1">
                        {product.bidWinner.buyer.profileImage ? (
                            <img 
                                src={product.bidWinner.buyer.profileImage.url} 
                                alt={product.bidWinner.buyer.username || 'Winner'} 
                                className="w-6 h-6 rounded-full object-cover"
                            />
                        ) : (
                            <Icon icon="solar:user-circle-bold-duotone" className="w-6 h-6" color="#EFF0FA" />
                        )}
                        <p className="text-xs text-[#EFF0FA] font-inter">
                            Winner: {product.bidWinner.buyer.username || `${product.bidWinner.buyer.firstName || ''} ${product.bidWinner.buyer.lastName || ''}`}
                        </p>
                    </div>
                )}
                
                {/* Winning Time */}
                {product?.bidWinner?.winningTime && (
                    <div className="flex items-center gap-2 mb-1">
                        <Icon icon="solar:calendar-mark-bold-duotone" className="w-4 h-4" color="#718096" />
                        <p className="text-xs text-[#718096] font-inter">
                            Ended: {formatDate(product.bidWinner.winningTime)}
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