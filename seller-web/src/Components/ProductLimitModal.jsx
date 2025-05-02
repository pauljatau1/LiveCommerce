import PropTypes from 'prop-types';

const ProductLimitModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative bg-white rounded-xl max-w-md w-full p-6 shadow-lg">
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Content */}
        <div className="flex flex-col items-center text-center space-y-4">
          {/* Warning Icon */}
          <div className="bg-yellow-100 p-3 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          {/* Title */}
          <h2 className="text-xl font-semibold text-gray-900">
            Product Limit Reached
          </h2>

          {/* Message */}
          <p className="text-gray-600 text-sm md:text-base">
            You can select a maximum of 10 products for your live show. Please deselect some products to continue.
          </p>

          {/* Button */}
          <button
            onClick={onClose}
            className="w-full mt-4 px-6 py-2.5 text-sm font-medium text-white bg-[#16783A] rounded-lg hover:bg-[#16783A]/90 transition-all duration-300"
          >
            OK, I Understand
          </button>
        </div>
      </div>
    </div>
  );
};

ProductLimitModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

export default ProductLimitModal; 