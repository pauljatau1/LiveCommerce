import PropTypes from 'prop-types';

const Modal = ({ children }) => {
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-md z-20 ">
            <div className="flex flex-col items-center justify-center rounded-2xl py-10 bg-gradient-to-br from-[#05031F] from-[30%] to-[#34A853] to-[100%] max-w-[90%] lg:max-w-[800px] px-10 lg:px-20 ">
                {children}
            </div>
        </div>
    );
};

Modal.propTypes = {
    children: PropTypes.node.isRequired,
};

export default Modal;
