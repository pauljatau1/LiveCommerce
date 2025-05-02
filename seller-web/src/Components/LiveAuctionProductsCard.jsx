import PropTypes from 'prop-types';

const LiveAuctionProductsCard = ({ product }) => {
    return (
        <div className="flex items-center pt-3 md:pt-4 border-t px-6 border-gray-200 gap-3">
            <img 
                src={product?.images[0]?.url} 
                alt={product?.name} 
                className="xl:w-[71px] xl:h-[71px] w-[45.5px] h-[45.5px] object-cover rounded-lg" 
            />
            <div>
                <h2 className="text-sm max-w-[200px] truncate font-semibold text-[#16192C] capitalize font-inter">
                    {product?.name}
                </h2>
                <p className="text-xs md:text-sm text-[#718096]">{product?.category}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>Min Bid: ₦{product?.minBid?.toLocaleString() || 0}</span>
                    <span>•</span>
                    <span>Quantity: {product?.quantity || 0}</span>
                </div>
            </div>
        </div>
    );
};

LiveAuctionProductsCard.propTypes = {
    product: PropTypes.object.isRequired,
};

export default LiveAuctionProductsCard;