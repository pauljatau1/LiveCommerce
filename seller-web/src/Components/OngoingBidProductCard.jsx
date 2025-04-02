import { Icon } from '@iconify/react';
import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';

const OngoingBidProductCard = ({ product, formatCurrency }) => {
    const [timeLeft, setTimeLeft] = useState(30); // Default 30 seconds countdown

    useEffect(() => {
        // Start countdown timer
        const timer = setInterval(() => {
            setTimeLeft((prevTime) => {
                if (prevTime <= 0) {
                    clearInterval(timer);
                    return 0;
                }
                return prevTime - 1;
            });
        }, 1000);

        // Cleanup timer on component unmount
        return () => clearInterval(timer);
    }, []);

    // Format time as MM:SS
    const formatTime = (seconds) => {
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
                        Ending in: {formatTime(timeLeft)}
                    </p>
                </div>
                
                {/* Current Bid Amount */}
                <div className="flex items-center gap-2 mb-1">
                    <Icon icon="solar:dollar-minimalistic-linear" className="w-4 h-4" color="#14AE5C" />
                    <p className="text-sm text-[#14AE5C] font-inter font-medium">
                        Current Bid: {formatCurrency(product?.currentBid > 0 ? product?.currentBid : product?.minBid)}
                    </p>
                </div>
                
                {/* Current Bidder Details (if available) */}
                {product?.currentBidder && (
                    <div className="flex items-center gap-2">
                        {product.currentBidder.profileImage ? (
                            <img 
                                src={product.currentBidder.profileImage.url} 
                                alt={product.currentBidder.username || 'Bidder'} 
                                className="w-6 h-6 rounded-full object-cover"
                            />
                        ) : (
                            <Icon icon="solar:user-circle-bold-duotone" className="w-6 h-6" color="#EFF0FA" />
                        )}
                        <p className="text-xs text-[#EFF0FA] font-inter">
                            {product.currentBidder.username || `${product.currentBidder.firstName || ''} ${product.currentBidder.lastName || ''}`}
                        </p>
                    </div>
                )}
            </div>
            <div className="w-full flex items-center justify-center mt-2 bg-[#0D0F12]/70 rounded-lg p-2">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-[#C74E5B] rounded-full animate-pulse"></div>
                    <p className="text-xs text-[#EFF0FA] font-inter">Bidding ended</p>
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