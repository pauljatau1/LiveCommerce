import { Icon } from '@iconify/react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

const ZeroQuantityProductsModal = ({ products, onClose }) => {
    const navigate = useNavigate();

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50">
            {/* Overlay */}
            <div 
                className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
                onClick={onClose}
            ></div>
            
            {/* Modal Content */}
            <div className="relative bg-white rounded-xl p-6 w-full max-w-md mx-4 border border-gray-200 z-10 shadow-xl">
                <div className="absolute top-4 right-4">
                    <button 
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
                    >
                        <Icon icon="solar:close-circle-bold" className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Icon icon="solar:danger-triangle-bold" className="w-8 h-8" color="#C74E5B" />
                        <h2 className="text-xl font-semibold text-gray-900">Out of Stock Products</h2>
                    </div>
                    <p className="text-sm text-gray-600">
                        The following products have zero or negative stock quantity. Please update their stock before proceeding:
                    </p>
                </div>
                
                <div className="space-y-3 mb-6 max-h-[300px] overflow-y-auto">
                    {products.map((product) => (
                        <div key={product.productId} className="bg-gray-50 p-3 rounded-lg flex items-center gap-3">
                            <img 
                                src={product.images[0].url} 
                                alt={product.name} 
                                className="w-12 h-12 rounded-lg object-cover"
                            />
                            <div className="flex-1">
                                <p className="text-sm text-gray-800 font-medium line-clamp-1">{product.name}</p>
                                <p className="text-xs text-red-500">Current stock: {product.quantity}</p>
                            </div>
                        </div>
                    ))}
                </div>
                
                <div className="flex gap-4">
                    <button 
                        onClick={onClose}
                        className="flex-1 py-3 text-sm px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition duration-200"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={() => navigate('/dashboard/products')}
                        className="flex-1 py-3 px-4 text-sm bg-[#14AE5C] text-white rounded-lg hover:bg-[#14AE5C]/90 transition duration-200 flex items-center justify-center"
                    >
                        <span>Go to Products</span>
                        <Icon icon="solar:arrow-right-linear" className="w-5 h-5 ml-2" />
                    </button>
                </div>
            </div>
        </div>
    );
};

ZeroQuantityProductsModal.propTypes = {
    products: PropTypes.arrayOf(PropTypes.shape({
        productId: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        quantity: PropTypes.number,
        images: PropTypes.arrayOf(PropTypes.shape({
            url: PropTypes.string.isRequired
        })).isRequired
    })).isRequired,
    onClose: PropTypes.func.isRequired
};

export default ZeroQuantityProductsModal; 