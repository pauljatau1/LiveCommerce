import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/Components/ui/dialog';
import { Icon } from '@iconify/react';
import trashBinTrashBoldIcon from '@iconify-icons/solar/trash-bin-trash-bold';
import { useMutation } from '@tanstack/react-query';
import { blipService } from '@/services/blipService';
import { useNotification } from '@/Hooks/useNotification';

interface DeleteBlipConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    productId: string;
    blipId: string;
    onSuccess?: () => void;
}

const DeleteBlipConfirmationModal: React.FC<DeleteBlipConfirmationModalProps> = ({
    isOpen,
    onClose,
    productId,
    blipId,
    onSuccess
}) => {
    const { showNotification } = useNotification();

    const deleteMutation = useMutation({
        mutationFn: () => blipService.deleteProductBlip({ productId, blipId }),
        onSuccess: () => {
            showNotification('Blip deleted successfully', 'information', 'dismissible');
            onSuccess?.();
            onClose();
        },
        onError: (error: any) => {
            console.error('Error deleting blip:', error);
            showNotification(
                error.response?.data?.message || 'Failed to delete blip. Please try again.',
                'error'
            );
        }
    });

    const handleDelete = () => {
        deleteMutation.mutate();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px] bg-white rounded-xl p-6">
                <DialogHeader>
                    <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                        <Icon icon={trashBinTrashBoldIcon} className="w-6 h-6 text-red-600" />
                    </div>
                    <DialogTitle className="text-center text-xl font-bold text-[#17171B]">Delete Blip?</DialogTitle>
                    <DialogDescription className="text-center text-gray-500 mt-2">
                        Are you sure you want to delete this blip? This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex gap-3 mt-6">
                    <button
                        onClick={onClose}
                        disabled={deleteMutation.isPending}
                        className="flex-1 py-2.5 border border-gray-300 rounded-xl font-medium text-gray-700 text-xs md:text-sm hover:bg-gray-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={deleteMutation.isPending}
                        className="flex-1 py-2.5 bg-red-600 text-white text-xs md:text-sm rounded-xl font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                    >
                        {deleteMutation.isPending ? (
                            <Icon icon="line-md:loading-loop" className="w-5 h-5" />
                        ) : (
                            'Delete'
                        )}
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default DeleteBlipConfirmationModal;