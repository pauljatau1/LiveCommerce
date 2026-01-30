import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/Hooks/useAuthContextV2';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from './dialog';
import { Icon } from '@iconify/react';
import PropTypes from 'prop-types';

const StreamNotFoundModal = ({ open, onClose }) => {
    const navigate = useNavigate();
    const { seller, logout } = useAuthContext();

    const handleCreateStream = () => {
        onClose();
        navigate('/dashboard/live-streams/live-stream');
    };

    const handleLogout = async () => {
        onClose();
        await logout();
    };

    const sellerName = seller
        ? `${seller.firstName || ''} ${seller.lastName || ''}`.trim() || 'Unknown Seller'
        : 'Unknown Seller';

        const sellerStoreName = seller ? seller.storeName : 'Unknown Store';

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent showCloseButton={false} className="sm:max-w-[500px] bg-[#0D0F12] rounded-[10px]  ">
                <button 
                    type="button" 
                    aria-label="Close" 
                    onClick={onClose}
                    className="w-fit absolute right-4 top-4 hover:bg-[#272A31]/50 rounded-full p-1 transition-colors"
                >
                    <Icon icon="material-symbols:close-rounded" className="w-6 h-6 text-[#ffffff] hover:text-[#ffffff]/50" />
                </button>
                <DialogHeader className="text-center sm:text-left">
                    <div className="flex items-center justify-center sm:justify-start mb-4">
                        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                            <Icon
                                icon="solar:shield-warning-bold"
                                className="w-6 h-6 text-red-600"
                            />
                        </div>
                    </div>
                    <DialogTitle className="text-xl sm:text-2xl font-semibold text-[#ffffff] text-center sm:text-left">
                        Stream Not Found
                    </DialogTitle>
                    <DialogDescription className="text-sm sm:text-base text-gray-600 mt-2 text-center sm:text-left">
                        Stream could not be started. This stream belongs to another seller. You are currently logged in as{' '}
                        <span className="font-semibold text-[#fff]">{sellerName}{sellerStoreName ? ` (${sellerStoreName})` : ''}</span>. Please log in as the correct seller if this was a mistake.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex-col sm:flex-row gap-3 sm:gap-2 mt-6">
                    <button
                        onClick={handleCreateStream}
                        className="w-full sm:w-auto px-6 py-3 bg-[#16783A] hover:bg-[#16783A]/90 text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                    >
                        <Icon icon="solar:add-circle-bold" className="w-5 h-5" />
                        Create a Stream
                    </button>
                    <button
                        onClick={handleLogout}
                        className="w-full sm:w-auto px-6 py-3 border bg-gray-300 hover:bg-gray-50 text-[#17171B] font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                    >
                        <Icon icon="solar:logout-2-bold" className="w-5 h-5" />
                        Logout
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

StreamNotFoundModal.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
};

export default StreamNotFoundModal;

