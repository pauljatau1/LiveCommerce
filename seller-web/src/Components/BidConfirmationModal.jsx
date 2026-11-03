import { Icon } from '@iconify/react';
import PropTypes from 'prop-types';
import CircularProgress from '@mui/material/CircularProgress';

const BidConfirmationModal = ({ product, onClose, onConfirm, isLoading }) => {
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50">
            {/* Overlay */}
            <div 
                className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
                onClick={onClose}
            ></div>
            
            {/* Modal Content */}
            <div className="relative bg-[#0D0F12] rounded-xl p-6 w-full max-w-md mx-4 border border-[#272A31] z-10">
                <div className="absolute top-4 right-4">
                    <button 
                        onClick={onClose}
                        className="text-[#EFF0FA] hover:text-white p-1 rounded-full hover:bg-[#272A31]/50"
                    >
                        <Icon icon="solar:close-circle-bold" className="w-6 h-6" />
                    </button>
                </div>
                
                <h2 className="text-xl font-semibold text-[#EFF0FA] mb-6">Start Product Bid</h2>
                
                <div className="flex gap-4 mb-6">
                    <div className="flex-shrink-0">
                        <img 
                            src={product?.product?.images[0]?.url} 
                            alt={product?.product?.name} 
                            className="w-[100px] h-[100px] object-contain rounded-lg bg-[#161A1E]"
                        />
                    </div>
                    <div>
                        <h3 className="text-[#EFF0FA] font-medium mb-1 line-clamp-2">{product?.product?.name}</h3>
                        <p className="text-sm text-[#718096] mb-2">Price: {formatCurrency(product?.product?.price)}</p>
                        <p className="text-sm text-[#718096]">Quantity: {product?.product?.quantity}</p>
                    </div>
                </div>
                
                <div className="space-y-4 bg-[#161A1E] p-4 rounded-lg mb-6">
                    <div className="flex justify-between">
                        <p className="text-sm text-[#718096]">Min Bid Amount:</p>
                        <p className="text-sm text-[#EFF0FA] font-medium">{formatCurrency(product?.minBid)}</p>
                    </div>
                    <div className="flex justify-between">
                        <p className="text-sm text-[#718096]">Max Bid Amount:</p>
                        <p className="text-sm text-[#EFF0FA] font-medium">{formatCurrency(product?.maxBid)}</p>
                    </div>
                    <div className="flex justify-between">
                        <p className="text-sm text-[#718096]">Current Bid Status:</p>
                        <p className="text-sm text-[#14AE5C] font-medium capitalize">{product?.bidStatus}</p>
                    </div>
                </div>
                
                <div className="flex gap-4">
                    <button 
                        onClick={onClose}
                        className="flex-1 py-3 text-sm px-4 border border-[#272A31] text-[#EFF0FA] rounded-lg hover:bg-[#272A31]/50 transition duration-200"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="flex-1 py-3 px-4 text-sm  bg-[#14AE5C] text-white rounded-lg hover:bg-[#14AE5C]/90 transition duration-200 flex items-center justify-center"
                    >
                        {isLoading ? (
                            <CircularProgress size={20} color="inherit" />
                        ) : (
                            <>
                                <span>Start Bid</span>
                                <Icon icon="solar:arrow-right-linear" className="w-5 h-5 ml-2" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

BidConfirmationModal.propTypes = {
    product: PropTypes.object.isRequired,
    onClose: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired,
    isLoading: PropTypes.bool.isRequired
};

export default BidConfirmationModal; 