import { Icon } from '@iconify/react';
import PropTypes from 'prop-types';
import CircularProgress from '@mui/material/CircularProgress';

/**
 * Reusable confirmation modal for product visibility actions (show/hide)
 * Used to prevent accidental triggers when showing or hiding products in live streams
 * 
 * @param {Object} props - Component props
 * @param {Object} props.product - The product object to show/hide
 * @param {Function} props.onClose - Function to close the modal
 * @param {Function} props.onConfirm - Function to confirm the action
 * @param {boolean} props.isLoading - Loading state for the action
 * @param {string} props.action - The action type ('show' or 'hide')
 * @param {Function} props.formatCurrency - Function to format currency values
 */
const ProductVisibilityConfirmationModal = ({ 
    product, 
    onClose, 
    onConfirm, 
    isLoading, 
    action = 'show',
    formatCurrency 
}) => {
    // Default currency formatter if not provided
    const defaultFormatCurrency = (amount) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const formatPrice = formatCurrency || defaultFormatCurrency;
    const isShowAction = action === 'show';
    const actionText = isShowAction ? 'Show' : 'Hide';
    const actionDescription = isShowAction 
        ? 'This will display this product to viewers and hide all other products.' 
        : 'This will hide this product from viewers.';

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            {/* Overlay with backdrop blur */}
            <div 
                className="fixed inset-0 bg-black/80 backdrop-blur-sm" 
                onClick={onClose}
            ></div>
            
            {/* Modal Content - Responsive design */}
            <div className="relative bg-[#0D0F12] rounded-xl p-4 md:p-6 w-full max-w-md mx-auto border border-[#272A31] z-10 shadow-2xl">
                {/* Close Button */}
                <div className="absolute top-4 right-4">
                    <button 
                        onClick={onClose}
                        disabled={isLoading}
                        className="text-[#7A828A] hover:text-[#EFF0FA] p-1 rounded-full hover:bg-[#272A31]/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Icon icon="solar:close-circle-bold" className="w-6 h-6" />
                    </button>
                </div>
                
                {/* Modal Header */}
                <div className="mb-6 pr-8">
                    <h2 className="text-xl md:text-2xl font-semibold text-[#EFF0FA] mb-2">
                        {actionText} Product
                    </h2>
                    <p className="text-sm text-[#7A828A]">
                        {actionDescription}
                    </p>
                </div>
                
                {/* Product Information */}
                {product && (
                    <div className="flex gap-4 mb-6 bg-[#161A1E] p-4 rounded-lg">
                        <div className="flex-shrink-0">
                            <img 
                                src={product?.product?.images?.[0]?.url || product?.images?.[0]?.url} 
                                alt={product?.product?.name || product?.name} 
                                className="w-[80px] h-[80px] md:w-[100px] md:h-[100px] object-contain rounded-lg bg-[#0D0F12]"
                                onError={(e) => {
                                    // Fallback if image fails to load
                                    e.target.style.display = 'none';
                                }}
                            />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-[#EFF0FA] font-medium mb-1 line-clamp-2 text-sm md:text-base">
                                {product?.product?.name || product?.name}
                            </h3>
                            <p className="text-sm text-[#718096] mb-2">
                                Price: {formatPrice(product?.product?.price || product?.price || 0)}
                            </p>
                            {product?.product?.quantity !== undefined && (
                                <p className="text-sm text-[#718096]">
                                    Quantity: {product?.product?.quantity}
                                </p>
                            )}
                        </div>
                    </div>
                )}
                
                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <button 
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 py-3 text-sm md:text-base px-4 border border-[#272A31] text-[#EFF0FA] rounded-lg hover:bg-[#272A31]/50 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`flex-1 py-3 px-4 text-sm md:text-base rounded-lg transition duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed ${
                            isShowAction 
                                ? 'bg-[#14AE5C] text-white hover:bg-[#14AE5C]/90' 
                                : 'bg-[#C74E5B] text-white hover:bg-[#C74E5B]/90'
                        }`}
                    >
                        {isLoading ? (
                            <CircularProgress size={20} color="inherit" />
                        ) : (
                            <>
                                <span>{actionText} Product</span>
                                <Icon 
                                    icon={isShowAction ? "solar:eye-bold" : "solar:eye-closed-bold"} 
                                    className="w-5 h-5 ml-2" 
                                />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

ProductVisibilityConfirmationModal.propTypes = {
    product: PropTypes.object.isRequired,
    onClose: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired,
    isLoading: PropTypes.bool.isRequired,
    action: PropTypes.oneOf(['show', 'hide']).isRequired,
    formatCurrency: PropTypes.func
};

export default ProductVisibilityConfirmationModal;

