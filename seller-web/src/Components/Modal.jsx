import PropTypes from 'prop-types';

const Modal = ({ children, variant = 'default' }) => {
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-md z-20">
            <div className={`flex flex-col items-center justify-center rounded-2xl py-10 ${variant === 'otp' ? 'bg-[#1F2937]' : ''} to-[100%] max-w-[90%] lg:max-w-[800px] px-10 lg:px-20`}>
                {children}
            </div>
        </div>
    );
};

Modal.propTypes = {
    children: PropTypes.node.isRequired,
    variant: PropTypes.oneOf(['default', 'otp']),
};

export default Modal;
