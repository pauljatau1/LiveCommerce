import React, { useEffect, useState, lazy, Suspense } from 'react';
import { useNotification } from '@/Hooks/useNotification';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBlipDetails, fetchBlipComments, clearBlipDetails, addReplyToBlipComment } from '@/Redux/Slices/ProductSlice';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Icon } from '@iconify/react';
import { Skeleton } from '@/Components/shared/Skeleton';
import { formatDistanceToNow } from 'date-fns';
import { format } from 'date-fns';
import GlassImage from '@/Components/ui/GlassImageV2';
import trashBinTrashBoldIcon from '@iconify-icons/solar/trash-bin-trash-bold';
import DeleteBlipConfirmationModal from './DeleteBlipConfirmationModal';

// Lazy load VideoPlayer
const VideoPlayer = lazy(() => import('@/Shared/VideoPlayer'));

interface ProductBlipsDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    productId: string;
    blipId: string;
    onAddBlips?: () => void;
}

const ProductBlipsDetailsModal: React.FC<ProductBlipsDetailsModalProps> = ({
    isOpen,
    onClose,
    productId,
    blipId,
    onAddBlips
}) => {
    const dispatch = useDispatch();
    // @ts-ignore
    const { blipDetails, blipComments, isLoadingBlipDetails, isLoadingBlipComments, isSendingBlipReplies } = useSelector((state: any) => state.product);

    const [replyText, setReplyText] = useState('');
    const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
    const [viewReplies, setViewReplies] = useState<Record<string, boolean>>({});
    const { showNotification } = useNotification();
    const [isCopied, setIsCopied] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [blipToDelete, setBlipToDelete] = useState<string | null>(null);

    const copyToClipboard = async (text: string): Promise<boolean> => {
        // Try modern Clipboard API first
        if (navigator.clipboard && navigator.clipboard.writeText) {
            try {
                await navigator.clipboard.writeText(text);
                return true;
            } catch (err) {
                console.warn('Clipboard API failed, trying fallback:', err);
            }
        }

        // Fallback for mobile browsers that don't support Clipboard API
        try {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();

            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);

            return successful;
        } catch (err) {
            console.error('Fallback copy method failed:', err);
            return false;
        }
    };

    const handleShare = async () => {
        const linkToCopy = currentBlip?.blipLink || currentBlip?.blipUrl || '';

        if (!linkToCopy) {
            showNotification('No link available to share', 'error');
            return;
        }

        const success = await copyToClipboard(linkToCopy);
        if (success) {
            setIsCopied(true);
            showNotification('Blip link copied to clipboard!', 'information');
            setTimeout(() => setIsCopied(false), 2000);
        } else {
            showNotification('Failed to copy blip link', 'error');
        }
    };

    const handleDeleteClick = (id: string) => {
        setBlipToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteSuccess = () => {
        // @ts-ignore
        //dispatch(fetchBlipDetails({ productId, blipId: currentBlipId === blipToDelete ? '' : currentBlipId }));
        // If we deleted the current blip, we might want to switch to another one or handle empty state.
        // The fetchBlipDetails action likely handles fetching the list.
        // If the current blip is deleted, the component will re-render.
        // If blipDetails updates, currentBlip memo will pick the first one or null.

        // Also ensure we clear the delete state
        setBlipToDelete(null);
    };

    useEffect(() => {
        if (isOpen && productId && blipId) {
            // @ts-ignore
            dispatch(fetchBlipDetails({ productId, blipId }));
            // @ts-ignore
            dispatch(fetchBlipComments({ productId, blipId }));
        }

        return () => {
            if (!isOpen) {
                // @ts-ignore
                dispatch(clearBlipDetails());
            }
        };
    }, [dispatch, isOpen, productId, blipId]);

    const [currentBlipId, setCurrentBlipId] = useState(blipId);

    useEffect(() => {
        setCurrentBlipId(blipId);
    }, [blipId]);

    const currentBlip = React.useMemo(() => {
        if (!blipDetails) return null;
        if (Array.isArray(blipDetails.blips)) {
            return blipDetails.blips.find((b: any) => b.blipId === currentBlipId) || blipDetails.blips[0];
        }
        return blipDetails; // Fallback if structure is different
    }, [blipDetails, currentBlipId]);

    const allBlips = React.useMemo(() => {
        if (!blipDetails) return [];
        if (Array.isArray(blipDetails.blips)) {
            return blipDetails.blips;
        }
        return [blipDetails]; // Fallback
    }, [blipDetails]);

    const handleReplySubmit = (commentId: string) => {
        if (!replyText.trim()) return;

        // @ts-ignore
        dispatch(addReplyToBlipComment({
            productId,
            blipId: currentBlipId,
            commentId,
            comment: replyText
        }))
            .unwrap()
            .then(() => {
                setReplyText('');
                setActiveReplyId(null);
                // Refresh comments
                // @ts-ignore
                dispatch(fetchBlipComments({ productId, blipId: currentBlipId }));
            })
            .catch((error: any) => {
                console.error('Error submitting reply:', error);
            });
    };

    const toggleReplies = (commentId: string) => {
        setViewReplies(prev => ({
            ...prev,
            [commentId]: !prev[commentId]
        }));
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent showCloseButton={true} className="w-full h-full max-h-[90vh] sm:max-w-[95vw] lg:max-w-5xl p-0 gap-0 overflow-hidden bg-white sm:rounded-xl flex flex-col">
                {/* Header */}
                <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-[#17171B]">Product Blips Details</DialogTitle>
                        <p className="text-sm text-gray-500 mt-1 hidden sm:block">Comprehensive Information about your product blips</p>
                    </DialogHeader>
                </div>

                {/* Main Content - Flex Col on Mobile, Row Reverse on Desktop */}
                <div className="flex flex-col lg:flex-row-reverse flex-1 overflow-hidden">

                    {/* Blips List / Video Section (Top on Mobile, Right on Desktop) */}
                    <div className="w-full lg:w-[320px] bg-gray-50 flex flex-col border-b lg:border-b-0 lg:border-l border-gray-100 h-[45vh] lg:h-full shrink-0 relative">
                        <div className="p-4 flex-1 flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-hidden lg:overflow-y-hidden gap-4 lg:gap-0 lg:space-y-4 items-center lg:items-stretch">
                            {isLoadingBlipDetails ? (
                                [...Array(2)].map((_, i) => (
                                    <Skeleton key={i} className="h-full w-auto aspect-[9/16] lg:w-full lg:h-auto rounded-xl shrink-0" />
                                ))
                            ) : (
                                <>
                                    {allBlips.map((blip: any) => (
                                        <div
                                            key={blip.blipId || blip._id}
                                            className={`relative group rounded-xl overflow-hidden bg-white border cursor-pointer transition-all shrink-0 h-full w-auto lg:w-full lg:h-auto aspect-[9/16] ${currentBlipId === (blip.blipId || blip._id) ? 'border-[#0BB248] ring-1 ring-[#0BB248]' : 'border-gray-200 hover:border-gray-300'}`}
                                            onClick={() => setCurrentBlipId(blip.blipId || blip._id)}
                                        >
                                            <div className="w-full h-full bg-black relative">                                                    {blip.blipUrl || blip.thumbnail ? (
                                                <VideoPlayer
                                                    src={blip.blipUrl}
                                                    poster={blip.thumbnail}
                                                    autoPlay={false}
                                                    className="w-full h-full object-cover"
                                                    controls={true}
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-white">
                                                    <Icon icon="solar:video-frame-broken" className="w-8 h-8" />
                                                </div>
                                            )}



                                            </div>
                                            <div className="p-3 bg-white flex items-center justify-between">
                                                <span className="text-xs text-gray-500">
                                                    Added on {format(new Date(blip.createdAt || Date.now()), 'do MMM, yyyy')}
                                                </span>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteClick(blip.blipId || blip._id);
                                                    }}
                                                    className="text-red-500 hover:bg-red-50 p-1.5 rounded-full transition-colors"
                                                >
                                                    <Icon icon="solar:trash-bin-trash-bold" className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Mobile Add Button Card */}
                                    <div className="lg:hidden shrink-0 w-[120px] h-[80%]">
                                        <button
                                            onClick={onAddBlips}
                                            className="w-full h-full border-2 border-dashed border-[#0BB248] text-[#0BB248] rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-[#E8FAF0] transition-colors"
                                        >
                                            <Icon icon="solar:add-circle-bold" className="w-8 h-8" />
                                            <span className="text-xs font-bold text-center">Add Blip</span>
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Add More Blips Button */}
                        <div className="p-4 bg-white border-t border-gray-100 lg:sticky lg:bottom-0 z-10 hidden lg:block">
                            <button
                                onClick={onAddBlips}
                                className="w-full py-2.5 border border-[#0BB248] text-[#0BB248] rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#E8FAF0] transition-colors"
                            >
                                <Icon icon="solar:add-circle-bold" className="w-5 h-5" />
                                Add more Blips
                            </button>
                        </div>
                    </div>

                    {/* Product Info & Comments (Bottom on Mobile, Left on Desktop) */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
                        {isLoadingBlipDetails ? (
                            <div className="space-y-6">
                                <Skeleton className="h-8 w-3/4" />
                                <Skeleton className="h-6 w-1/2" />
                                <Skeleton className="h-32 w-full rounded-xl" />
                                <Skeleton className="h-12 w-full rounded-lg" />
                            </div>
                        ) : currentBlip ? (
                            <div className="space-y-6">
                                {/* Product Info Header */}
                                <div>
                                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase mb-2 ${currentBlip.status === 'active' ? 'bg-[#E8FAF0] text-[#0BB248]' : 'bg-gray-100 text-gray-500'}`}>
                                        {currentBlip.status || 'ACTIVE'}
                                    </span>
                                    <h2 className="text-xl sm:text-2xl max-w-[90%] line-clamp-2  font-bold text-[#17171B] mb-1">{currentBlip.productName}</h2>
                                    <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-3">
                                        <span>#Fashion</span>
                                        <span>#Streetwear</span>
                                        {/* Using placeholders as tags aren't in sample */}
                                    </div>
                                    <div className="flex flex-col md:flex-row md:justify-between gap-2">
                                        <span className="px-3 py-1 w-fit bg-[#E8FAF0] text-[#0BB248] rounded-lg font-bold">
                                            ₦ {new Intl.NumberFormat('en-NG').format(currentBlip.price || 0)}
                                        </span>
                                        <div className="">
                                            <p className="text-xs text-gray-500">Posted {currentBlip.createdAt ? formatDistanceToNow(new Date(currentBlip.createdAt), { addSuffix: true }) : ''}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-sm font-medium text-[#425466]">{currentBlip.stock} Stock Available</span>
                                                {currentBlip.stock <= 10 && (
                                                    <span className="px-2 py-0.5 bg-[#FEF2F2] text-[#EF4444] text-[10px] font-bold rounded">
                                                        LOW STOCK
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Engagement Card */}
                                <div className="border border-gray-100 rounded-2xl p-4 shadow-sm">
                                    <h3 className="font-bold text-[#17171B] mb-4">Engagement</h3>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-gray-50">
                                            <div className="w-8 h-8 rounded-full bg-[#FEF2F2] flex items-center justify-center mb-2">
                                                <Icon icon="solar:heart-bold" className="text-[#EF4444] w-4 h-4" />
                                            </div>
                                            <span className="text-xs font-bold text-[#17171B]">{currentBlip.blipEngagement?.likesCount || 0} Likes</span>
                                        </div>
                                        <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-gray-50">
                                            <div className="w-8 h-8 rounded-full bg-[#FFF7ED] flex items-center justify-center mb-2">
                                                <Icon icon="solar:chat-round-dots-bold" className="text-[#F59E0B] w-4 h-4" />
                                            </div>
                                            <span className="text-xs font-bold text-[#17171B]">{currentBlip.blipEngagement?.commentsCount || 0} Comment</span>
                                        </div>
                                        <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-gray-50">
                                            <div className="w-8 h-8 rounded-full bg-[#F1F5F9] flex items-center justify-center mb-2">
                                                <Icon icon="solar:eye-bold" className="text-[#64748B] w-4 h-4" />
                                            </div>
                                            <span className="text-xs font-bold text-[#17171B]">{currentBlip.blipEngagement?.viewCount || 0} Views</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Share Button */}
                                <div className='flex gap-2 justify-between ' >
                                    <button
                                        onClick={handleShare}
                                        className="w-full py-3 border border-[#0BB248] text-[#0BB248] text-sm rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-[#E8FAF0] transition-colors"
                                    >
                                        <Icon icon={isCopied ? "solar:check-circle-bold" : "solar:share-bold"} className="w-5 h-5" />
                                        {isCopied ? "Copied!" : "Share Blip"}
                                    </button>
                                    <button
                                        onClick={() => handleDeleteClick(currentBlipId)}
                                        className="w-full py-3 border border-[#FF3B30] text-[#FF3B30] text-sm rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-[#FF3B300A] transition-colors"
                                    >
                                        <Icon icon={trashBinTrashBoldIcon} className="w-4 h-4" />
                                        Delete
                                    </button>
                                </div>

                                {/* Comments Section */}
                                <div className="mt-8 pb-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-base font-bold text-[#17171B]">
                                            Comments <span className="text-gray-400 font-normal">{blipComments?.length || 0}</span>
                                        </h3>
                                    </div>

                                    {isLoadingBlipComments ? (
                                        <div className="space-y-4">
                                            {[...Array(3)].map((_, i) => (
                                                <div key={i} className="flex gap-3">
                                                    <Skeleton className="w-8 h-8 rounded-full" />
                                                    <div className="flex-1 space-y-2">
                                                        <Skeleton className="h-4 w-1/3" />
                                                        <Skeleton className="h-12 w-full" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : blipComments.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-12 text-center">
                                            <div className="w-16 h-16 mb-4 relative">
                                                <Icon icon="solar:chat-round-dots-bold" className="w-full h-full text-[#F59E0B]" />
                                            </div>
                                            <p className="font-medium text-[#17171B]">No Comments Yet</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            {blipComments.map((comment: any) => (
                                                <div key={comment._id} className="group">
                                                    <div className="flex gap-3">
                                                        <GlassImage
                                                            src={comment.buyer?.profileImage?.url}
                                                            alt={comment.buyer?.firstName}
                                                            containerClassName="w-10 h-10 rounded-full flex-shrink-0 bg-gray-100"
                                                            imageClassName="w-full h-full object-cover rounded-full"
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between">
                                                                <h4 className="font-semibold text-sm text-[#17171B]">
                                                                    {comment.buyer?.firstName} {comment.buyer?.lastName}
                                                                </h4>
                                                                <button className="text-gray-400 hover:text-red-500">
                                                                    <Icon icon={comment.isLiked ? "solar:heart-bold" : "solar:heart-linear"} className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                            <p className="text-sm text-gray-600 mt-1">{comment.comment}</p>
                                                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                                                <span>{format(new Date(comment.createdAt), 'MM/dd/yyyy')}</span>
                                                                {
                                                                    activeReplyId === comment._id ? (
                                                                        <button
                                                                            onClick={() => setActiveReplyId(activeReplyId === comment._id ? null : comment._id)}
                                                                            className="font-medium hover:text-[#0BB248]"
                                                                        >
                                                                            Cancel Reply
                                                                        </button>
                                                                    ) : (
                                                                        <button
                                                                            onClick={() => setActiveReplyId(activeReplyId === comment._id ? null : comment._id)}
                                                                            className="font-medium hover:text-[#0BB248]"
                                                                        >
                                                                            Reply
                                                                        </button>
                                                                    )
                                                                }
                                                            </div>

                                                            {/* Replies Toggle */}
                                                            {comment.replies && comment.replies.length > 0 && (
                                                                <div className="mt-2">
                                                                    <button
                                                                        onClick={() => toggleReplies(comment._id)}
                                                                        className="flex items-center gap-2 text-xs font-medium text-[#0BB248]"
                                                                    >
                                                                        <div className="w-6 h-[1px] bg-[#0BB248]"></div>
                                                                        {viewReplies[comment._id] ? 'Hide Replies' : `View Replies (${comment.replies.length})`}
                                                                    </button>

                                                                    {viewReplies[comment._id] && (
                                                                        <div className="mt-3 space-y-4 pl-8">
                                                                            {comment.replies.map((reply: any) => (
                                                                                <div key={reply._id} className="flex gap-3">
                                                                                    <GlassImage
                                                                                        src={reply.user?.profileImage?.url}
                                                                                        alt={reply.user?.firstName}
                                                                                        containerClassName="w-8 h-8 rounded-full flex-shrink-0 bg-gray-100"
                                                                                        imageClassName="w-full h-full object-cover rounded-full"
                                                                                    />
                                                                                    <div className="flex-1">
                                                                                        <div className="flex items-center justify-between">
                                                                                            <h4 className="font-semibold text-sm text-[#17171B]">
                                                                                                {reply.user?.firstName} {reply.user?.lastName}
                                                                                            </h4>
                                                                                            <button className="text-gray-400 hover:text-red-500">
                                                                                                <Icon icon="solar:heart-linear" className="w-4 h-4" />
                                                                                            </button>
                                                                                        </div>
                                                                                        <p className="text-sm text-gray-600 mt-1">{reply.comment}</p>
                                                                                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                                                                            <span>{format(new Date(reply.createdAt), 'MM/dd/yyyy')}</span>
                                                                                            <span>{reply.likesCount || 0} Like</span>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {/* Reply Input */}
                                                            {activeReplyId === comment._id && (
                                                                <div className="mt-3 flex gap-2">
                                                                    <input
                                                                        type="text"
                                                                        value={replyText}
                                                                        onChange={(e) => setReplyText(e.target.value)}
                                                                        placeholder="Write a reply..."
                                                                        className="flex-1 text-sm px-3 py-2 bg-gray-50 border placeholder:text-xs border-gray-200 rounded-lg focus:outline-none focus:border-[#0BB248]"
                                                                        onKeyDown={(e) => {
                                                                            if (e.key === 'Enter') handleReplySubmit(comment._id);
                                                                        }}
                                                                    />
                                                                    <button
                                                                        onClick={() => handleReplySubmit(comment._id)}
                                                                        disabled={!replyText.trim()}
                                                                        className="px-3 py-1 bg-[#0BB248] text-white rounded-lg text-xs font-bold disabled:opacity-50"
                                                                    >
                                                                        {isSendingBlipReplies ? 'Sending...' : 'Reply'}
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <p className="text-gray-500">Blip details not found</p>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>

            {blipToDelete && (
                <DeleteBlipConfirmationModal
                    isOpen={isDeleteModalOpen}
                    onClose={() => {
                        setIsDeleteModalOpen(false);
                        onClose()
                    }}
                    productId={productId}
                    blipId={blipToDelete}
                    onSuccess={handleDeleteSuccess}
                />
            )}
        </Dialog>
    );
};

export default ProductBlipsDetailsModal;
