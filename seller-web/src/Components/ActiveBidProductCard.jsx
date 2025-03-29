import { Icon } from '@iconify/react';
import PropTypes from 'prop-types';

const ActiveBidProductCard = ({ product, formatCurrency }) => {
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
                <div className="flex items-center gap-2 mb-1">
                    <Icon icon="solar:dollar-minimalistic-linear" className="w-4 h-4" color="#14AE5C" />
                    <p className="text-sm text-[#14AE5C] font-inter font-medium">
                        Current Bid: {formatCurrency(product?.currentBid > 0 ? product?.currentBid : product?.minBid)}
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
                            Status: <span className="text-[#14AE5C] capitalize">{product?.bidStatus}</span>
                        </p>
                    </div>
                    {product?.currentBidder && (
                        <div className="flex items-center gap-1">
                            <Icon icon="solar:user-circle-bold-duotone" className="w-4 h-4" color="#718096" />
                            <p className="text-xs text-[#718096] font-inter">
                                Current Bidder: <span className="text-[#EFF0FA]">
                                    {product?.currentBidder?.firstName || ''} {product?.currentBidder?.lastName || ''}
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