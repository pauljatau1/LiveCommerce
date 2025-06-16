import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBlipDetails, fetchBlipComments, clearBlipDetails, addReplyToBlipComment } from '../../Redux/Slices/ProductSlice';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../Components/ui/dialog';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '../../Components/ui/pagination';
import Loader from '../../Components/Loader';
import { formatDistanceToNow } from 'date-fns';
import VideoPlayer from '@/Shared/VideoPlayer';
import { Icon } from '@iconify/react';

const BlipDetails = ({ isOpen, onClose, productId, blipId }) => {
  const dispatch = useDispatch();
  const { 
    blipDetails, 
    blipComments, 
    isLoadingBlipDetails, 
    isLoadingBlipComments,
    blipCommentsPagination,
    error 
  } = useSelector((state) => state.product);
  const [commentsPage, setCommentsPage] = useState(1);
  const [commentsLimit] = useState(10);
  const [replyText, setReplyText] = useState('');
  const [activeReplyId, setActiveReplyId] = useState(null);

  useEffect(() => {
    if (isOpen && productId && blipId) {
      console.log(`Fetching blip details for productId: ${productId}, blipId: ${blipId}`);
      
      // First fetch blip details
      dispatch(fetchBlipDetails({ productId, blipId }))
        .unwrap()
        .then(responseData => {
          console.log('Unwrapped blip details response:', responseData);
          
          // Then fetch comments
          dispatch(fetchBlipComments({ 
            productId, 
            blipId, 
            page: commentsPage, 
            limit: commentsLimit 
          }));
        })
        .catch(error => {
          console.error('Error in fetchBlipDetails:', error);
        });
    }
    
    return () => {
      if (!isOpen) {
        dispatch(clearBlipDetails());
      }
    };
  }, [dispatch, isOpen, productId, blipId]);

  // Fetch comments when page changes
  useEffect(() => {
    if (isOpen && productId && blipId && blipDetails) {
      console.log(`Fetching blip comments for page: ${commentsPage}`);
      dispatch(fetchBlipComments({ 
        productId, 
        blipId, 
        page: commentsPage, 
        limit: commentsLimit 
      }));
    }
  }, [commentsPage, commentsLimit, blipDetails]);

  const handlePageChange = (page) => {
    setCommentsPage(page);
  };

  // Format date for human readable display
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      console.error('Error formatting date:', error, dateString);
      return 'Invalid date';
    }
  };

  // Safely access nested properties
  const safeGet = (obj, path, fallback = '') => {
    try {
      return path.split('.').reduce((acc, part) => acc && acc[part], obj) || fallback;
    } catch (e) {
      return fallback;
    }
  };

  // Render pagination controls
  const renderPaginationLinks = () => {
    const { pages: totalPages } = blipCommentsPagination;
    const links = [];

    // Start with Previous button
    links.push(
      <PaginationItem key="prev">
        <PaginationPrevious 
          onClick={() => commentsPage > 1 && handlePageChange(commentsPage - 1)}
          className={commentsPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
        />
      </PaginationItem>
    );

    // First page
    links.push(
      <PaginationItem key={1}>
        <PaginationLink
          isActive={commentsPage === 1}
          onClick={() => handlePageChange(1)}
          className="cursor-pointer"
        >
          1
        </PaginationLink>
      </PaginationItem>
    );

    // Ellipsis if needed
    if (commentsPage > 3) {
      links.push(
        <PaginationItem key="ellipsis-1">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    // Pages around current page
    for (let i = Math.max(2, commentsPage - 1); i <= Math.min(totalPages - 1, commentsPage + 1); i++) {
      if (i === 1 || i === totalPages) continue; // Skip first and last page as they're always shown
      links.push(
        <PaginationItem key={i}>
          <PaginationLink
            isActive={commentsPage === i}
            onClick={() => handlePageChange(i)}
            className="cursor-pointer"
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    // Ellipsis if needed
    if (commentsPage < totalPages - 2) {
      links.push(
        <PaginationItem key="ellipsis-2">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    // Last page if there are multiple pages
    if (totalPages > 1) {
      links.push(
        <PaginationItem key={totalPages}>
          <PaginationLink
            isActive={commentsPage === totalPages}
            onClick={() => handlePageChange(totalPages)}
            className="cursor-pointer"
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    // End with Next button
    links.push(
      <PaginationItem key="next">
        <PaginationNext
          onClick={() => commentsPage < totalPages && handlePageChange(commentsPage + 1)}
          className={commentsPage === totalPages || totalPages === 0 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
        />
      </PaginationItem>
    );

    return links;
  };

  // Handle reply submission
  const handleReplySubmit = (commentId) => {
    if (!replyText.trim()) return;
    
    dispatch(addReplyToBlipComment({
      productId,
      blipId,
      commentId,
      comment: replyText
    }))
    .unwrap()
    .then(() => {
      // Reset form after successful submission
      setReplyText('');
      setActiveReplyId(null);
      
      // Refresh comments to show the new reply
      dispatch(fetchBlipComments({ 
        productId, 
        blipId, 
        page: commentsPage, 
        limit: commentsLimit 
      }));
    })
    .catch(error => {
      console.error('Error submitting reply:', error);
    });
  };

  // Show reply form for a specific comment
  const toggleReplyForm = (commentId) => {
    if (activeReplyId === commentId) {
      setActiveReplyId(null); // Close the form if it's already open
    } else {
      setActiveReplyId(commentId); // Open the form for this comment
      setReplyText(''); // Clear any previous reply text
    }
  };

  if (!isOpen) return null;

  console.log('Current state in BlipDetails:', {
    blipDetails,
    isLoadingBlipDetails,
    blipComments,
    isLoadingBlipComments,
    error
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-center sm:text-left">Product Blip Details</DialogTitle>
        </DialogHeader>

        {isLoadingBlipDetails ? (
          <div className="flex justify-center items-center py-12">
            <Loader />
          </div>
        ) : blipDetails ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Blip Video and Details */}
            <div className="space-y-4">
              <div className="aspect-[9/16] w-full max-w-[300px] mx-auto rounded-md overflow-hidden bg-gray-100">
                {blipDetails.blipUrl || blipDetails.thumbnail ? (
                  <VideoPlayer 
                    src={blipDetails.blipUrl} 
                    poster={blipDetails.thumbnail} 
                    autoPlay={false}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gray-200">
                    <Icon icon="solar:video-frame-broken" className="w-12 h-12 text-gray-500" />
                    <span className="text-sm text-gray-500 mt-2">Processing Video</span>
                    <div className="mt-3 flex items-center gap-2">
                      <div className="h-2 w-2 bg-gray-400 rounded-full animate-pulse"></div>
                      <div className="h-2 w-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      <div className="h-2 w-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">
                  {safeGet(blipDetails, 'productName', 'Product')}
                </h3>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Created:</span> {formatDate(safeGet(blipDetails, 'createdAt'))}
                  {!blipDetails.processed && (
                      <span className="flex items-center gap-2 text-red-500 my-3">
                      {/* loader */}
                      <svg
                          className="h-4 w-4 animate-spin"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                      >
                          <circle
                          className="opacity-25"
                          cx="12" cy="12" r="10"
                          stroke="currentColor" strokeWidth="4" fill="none"
                          />
                          <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8z"
                          />
                      </svg>
                      <span>Blip is being processed...</span>
                      </span>
                  )}
                </p>
                <div className="flex flex-wrap gap-2 sm:gap-4 text-sm">
                  <span>❤️ {safeGet(blipDetails, 'blipEngagement.likesCount', 0)} likes</span>
                  <span>💬 {safeGet(blipDetails, 'blipEngagement.commentsCount', 0)} comments</span>
                  <span>👁️ {safeGet(blipDetails, 'blipEngagement.viewCount', 0)} views</span>
                </div>
                
                {/* Additional Product Details */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="font-medium text-gray-600">Price:</p>
                      <p>₦{safeGet(blipDetails, 'price', 0).toLocaleString('en-NG')}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-600">Stock:</p>
                      <p>{safeGet(blipDetails, 'stock', 0)} units</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-600">Status:</p>
                      <p className={`${safeGet(blipDetails, 'status') === 'active' ? 'text-green-600' : 'text-gray-600'}`}>
                        {safeGet(blipDetails, 'status', 'Unknown').charAt(0).toUpperCase() + safeGet(blipDetails, 'status', 'Unknown').slice(1)}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-600">Store:</p>
                      <p>{safeGet(blipDetails, 'seller.storeName', 'Unknown Store')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Comments Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Comments</h3>
              
              {isLoadingBlipComments ? (
                <div className="flex justify-center items-center py-8">
                  <Loader />
                </div>
              ) : blipComments.length === 0 ? (
                <p className="text-center py-8 text-gray-500">No comments yet</p>
              ) : (
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {blipComments.map((comment) => (
                    <div key={comment._id} className="border rounded-lg p-3 bg-gray-50">
                      <div className="flex items-start gap-2">
                        {/* User Avatar */}
                        <div className="h-8 w-8 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                          {safeGet(comment, 'buyer.profileImage.url') ? (
                            <img 
                              src={safeGet(comment, 'buyer.profileImage.url')} 
                              alt={`${safeGet(comment, 'buyer.firstName')} ${safeGet(comment, 'buyer.lastName')}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-600">
                              {safeGet(comment, 'buyer.firstName', 'U')[0]}
                            </div>
                          )}
                        </div>
                        
                        {/* Comment Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start flex-wrap gap-1">
                            <p className="font-medium text-sm truncate max-w-[140px] sm:max-w-none">
                              {comment.buyer 
                                ? `${safeGet(comment, 'buyer.firstName')} ${safeGet(comment, 'buyer.lastName')}` 
                                : 'Unknown User'}
                            </p>
                            <span className="text-xs text-gray-500">
                              {formatDate(comment.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm mt-1 break-words">{comment.comment}</p>
                          
                          {/* Comment Stats */}
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-600">
                            <span className="flex items-center gap-1">
                              <span>{safeGet(comment, 'isLiked', false) ? '❤️' : '🤍'}</span> {safeGet(comment, 'likesCount', 0)}
                            </span>
                            {safeGet(comment, 'repliesCount', 0) > 0 && (
                              <span className="flex items-center gap-1">
                                <span>💬</span> {comment.repliesCount}
                              </span>
                            )}
                            
                            {/* Reply button */}
                            <button 
                              onClick={() => toggleReplyForm(comment._id)}
                              className="text-blue-600 hover:text-blue-800 text-xs font-medium ml-auto"
                            >
                              {activeReplyId === comment._id ? 'Cancel' : 'Reply'}
                            </button>
                          </div>
                          
                          {/* Reply form */}
                          {activeReplyId === comment._id && (
                            <div className="mt-2 pt-2 border-t border-gray-200">
                              <textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                className="w-full px-3 py-2 text-xs border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Write your reply..."
                                rows={2}
                              />
                              <div className="flex justify-end mt-1">
                                <button
                                  onClick={() => handleReplySubmit(comment._id)}
                                  disabled={!replyText.trim()}
                                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Post Reply
                                </button>
                              </div>
                            </div>
                          )}
                          
                          {/* Replies if any */}
                          {comment.replies && comment.replies.length > 0 && (
                            <div className="ml-2 sm:ml-4 mt-3 space-y-2 border-l-2 border-gray-200 pl-2 sm:pl-3">
                              {comment.replies.map((reply) => (
                                <div key={reply._id} className="border-t pt-2">
                                  <div className="flex items-start gap-2">
                                    {/* Reply User Avatar */}
                                    <div className="h-6 w-6 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                                      {safeGet(reply, 'user.profileImage.url') ? (
                                        <img 
                                          src={safeGet(reply, 'user.profileImage.url')} 
                                          alt={`${safeGet(reply, 'user.firstName')} ${safeGet(reply, 'user.lastName')}`}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-600 text-xs">
                                          {safeGet(reply, 'user.firstName', 'U')[0]}
                                        </div>
                                      )}
                                    </div>
                                    
                                    {/* Reply Content */}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex justify-between items-start flex-wrap gap-1">
                                        <p className="font-medium text-xs truncate max-w-[120px] sm:max-w-none">
                                          {reply.user 
                                            ? `${safeGet(reply, 'user.firstName')} ${safeGet(reply, 'user.lastName')}` 
                                            : 'Unknown User'}
                                          {safeGet(reply, 'userType') === 'Seller' && (
                                            <span className="ml-1 text-blue-600">
                                              (Seller{safeGet(reply, 'user.storeName') ? ` - ${safeGet(reply, 'user.storeName')}` : ''})
                                            </span>
                                          )}
                                        </p>
                                        <span className="text-xs text-gray-500">
                                          {formatDate(reply.createdAt)}
                                        </span>
                                      </div>
                                      <p className="text-xs mt-1 break-words">{reply.comment || reply.text}</p>
                                      
                                      {/* Reply Stats */}
                                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
                                        <span className="flex items-center gap-1">
                                          <span>{safeGet(reply, 'isLiked', false) ? '❤️' : '🤍'}</span> {safeGet(reply, 'likesCount', 0)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Pagination for comments */}
              {blipCommentsPagination.pages > 1 && (
                <div className="pt-4 border-t overflow-x-auto">
                  <Pagination>
                    <PaginationContent className="flex-wrap justify-center">
                      {renderPaginationLinks()}
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">Failed to load blip details. Please try again.</p>
            <p className="text-sm text-gray-400 mt-2">Product ID: {productId}, Blip ID: {blipId}</p>
            {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BlipDetails; 