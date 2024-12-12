import PropTypes from 'prop-types';

const Modal = ({ children }) => {
    return (
        <div>
            {children}
        </div>
    );
};

Modal.propTypes = {
    children: PropTypes.node.isRequired,
};

export default Modal;
