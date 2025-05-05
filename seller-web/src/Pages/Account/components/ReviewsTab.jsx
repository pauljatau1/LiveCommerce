import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/Components/ui/card";
import { Avatar, AvatarFallback} from "@/Components/ui/avatar";
import { Star, Send, MessageCircle, ThumbsUp, Calendar, Award, Reply, DollarSign } from "lucide-react";
import { format, parseISO } from "date-fns";
import { BASE_URL } from "@/Constants/Server";
import { Badge } from "@/Components/ui/badge";
import { Button } from "@/Components/ui/button";
import { Textarea } from "@/Components/ui/textarea";
import { toast } from "sonner";
import { Skeleton } from "@/Components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/Components/ui/dialog";
import PropTypes from "prop-types";
export default function ReviewsTab({ sellerId }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalReviews: 0,
    hasMore: false
  });
  const [stats, setStats] = useState({
    averageRating: 0,
    ratingDistribution: {},
    totalReviews: 0,
    repliedCount: 0,
    unrepliedCount: 0
  });
  const [sortOption, setSortOption] = useState('recent');

  useEffect(() => {
    if (sellerId) {
      fetchStoreReviews();
    }
  }, [sellerId, sortOption]);

  const fetchStoreReviews = async (page = 1, limit = 10) => {
    try {
      setLoading(true);
      const tokenData = JSON.parse(localStorage.getItem("sellerToken"));
      if (!tokenData) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`${BASE_URL}/seller/${sellerId}/product-reviews?page=${page}&limit=${limit}&sort=${sortOption}`, {
        headers: {
          Authorization: `Bearer ${tokenData.data}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch reviews");
      }

      const data = await response.json();
      console.log('Fetched reviews data:', data); // Debug log
      
      setReviews(data.reviews || []);
      setPagination(data.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalReviews: 0,
        hasMore: false
      });
      setStats(data.stats || {
        averageRating: 0,
        ratingDistribution: {},
        totalReviews: 0,
        repliedCount: 0,
        unrepliedCount: 0
      });
    } catch (error) {
      console.error('Error fetching store reviews:', error);
      toast.error("Failed to fetch store reviews");
    } finally {
      setLoading(false);
    }
  };

  const handleReplyClick = (review) => {
    setSelectedReview(review);
    setReplyContent("");
    setIsReplyDialogOpen(true);
  };

  const handleSubmitReply = async () => {
    if (!replyContent?.trim()) {
      toast.error("Reply content cannot be empty");
      return;
    }

    const loadingToast = toast.loading('Submitting reply...');
    setSubmittingReply(true);

    try {
      const tokenData = JSON.parse(localStorage.getItem("sellerToken"));
      if (!tokenData) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`${BASE_URL}/seller/products/${selectedReview.product._id}/reviews/${selectedReview.reviewId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenData.data}`,
        },
        body: JSON.stringify({
          content: replyContent,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit reply');
      }

      const data = await response.json();

      // Update the reviews state with the new reply
      setReviews((prevReviews) =>
        prevReviews.map((review) =>
          review.reviewId === selectedReview.reviewId
            ? { 
                ...review, 
                reply: data.review.reply 
              }
            : review
        )
      );

      // Update stats if valid reply was added
      if (replyContent?.trim()) {
        setStats(prevStats => ({
          ...prevStats,
          repliedCount: prevStats.repliedCount + (hasValidReply(selectedReview) ? 0 : 1),
          unrepliedCount: prevStats.unrepliedCount - (hasValidReply(selectedReview) ? 0 : 1)
        }));
      }

      setIsReplyDialogOpen(false);
      setReplyContent("");
      setSelectedReview(null);

      toast.dismiss(loadingToast);
      toast.success("Reply added successfully");
    } catch (error) {
      console.error('Error submitting reply:', error);
      toast.dismiss(loadingToast);
      toast.error("Failed to submit reply");
    } finally {
      setSubmittingReply(false);
    }
  };

  const formatDate = (dateString) => {
    try {
      return format(parseISO(dateString), 'MMM dd, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Check if a review has a valid reply (with content)
  const hasValidReply = (review) => {
    return review.reply && review.reply.content && review.reply.content.trim() !== '';
  };

  const loadMoreReviews = () => {
    if (pagination.hasMore) {
      fetchStoreReviews(pagination.currentPage + 1);
    }
  };

  const ReviewSkeleton = () => (
    <Card className="overflow-hidden border border-zinc-200 hover:shadow-md transition-all duration-300">
      <CardHeader className="flex flex-col sm:flex-row items-start gap-4 p-4 sm:p-6 bg-zinc-50/80">
        <Skeleton className="w-14 h-14 rounded-full" />
        <div className="flex-1 space-y-2 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-5 w-20" />
            </div>
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-4 w-24" />
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 space-y-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-8 w-24" />
      </CardContent>
    </Card>
  );

  if (loading && reviews.length === 0) {
    return (
      <div className="w-full space-y-4">
        {[1, 2, 3].map((i) => (
          <ReviewSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="w-full">      
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="text-center py-16 px-4 bg-gradient-to-b from-zinc-50 to-white rounded-lg border border-zinc-200 shadow-sm">
            <div className="bg-blue-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
              <ThumbsUp className="h-12 w-12 text-blue-500" />
            </div>
            <h3 className="text-xl font-semibold mb-3 bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">No Reviews Yet</h3>
            <p className="text-zinc-500 max-w-md mx-auto">
              When customers review your products, they will appear here. Quality products and service lead to great reviews!
            </p>
            <div className="mt-6 inline-flex items-center justify-center">
              <Badge className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-blue-500 text-white">
                <Award className="h-4 w-4 mr-2" />
                Build Your Reputation
              </Badge>
            </div>
          </div>
        ) : (
          reviews.map((review) => (
            <Card 
              key={review.reviewId} 
              className="overflow-hidden border border-zinc-200 hover:border-blue-200 transition-all duration-300 hover:shadow-md"
            >
              <CardHeader className="p-0">
                <div className="flex items-center justify-between p-3 sm:p-4 bg-zinc-50/80 border-b">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-8 h-8 ring-1 ring-blue-100 border border-zinc-200">
                      <AvatarFallback className="bg-gradient-to-br from-blue-100 to-indigo-200 text-indigo-700 text-xs">
                        {review.buyer?.firstName?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="text-sm font-medium flex items-center">
                        {`${review.buyer?.firstName} ${review.buyer?.lastName}`}
                      </h4>
                      <span className="text-xs text-zinc-500 flex items-center">
                        <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                        {formatDate(review.createdAt)}
                      </span>
                    </div>
                  </div>
                  {review.rating && (
                    <div className="flex p-1 bg-yellow-50 rounded-md">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${
                            i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-zinc-200"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {/* Product Header with Image and Info */}
                <div className="flex items-center gap-3 p-3 sm:p-4 pb-2 bg-blue-50/50 border-b">
                  <div className="relative h-14 w-14 flex-shrink-0 rounded-md overflow-hidden border border-zinc-200 shadow-sm">
                    <img 
                      src={review.product.image} 
                      alt={review.product.name}
                      className="w-full h-full object-cover" 
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm text-zinc-800 truncate">
                      {review.product.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge className="bg-green-50 text-green-700 px-2 flex items-center gap-1">
                        <DollarSign className="h-2.5 w-2.5" />
                        {formatPrice(review.product.price)}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Review Content */}
                <div className="p-3 sm:p-4 space-y-3">
                  {review.title && (
                    <h5 className="font-medium text-zinc-800">{review.title}</h5>
                  )}
                  <p className="text-sm text-zinc-700 leading-relaxed p-3 bg-zinc-50 rounded-md border-l-2 border-indigo-300">{review.comment}</p>

                  {/* Review Images */}
                  {review.images && review.images.length > 0 && (
                    <div className="flex gap-2 flex-wrap mt-2">
                      {review.images.map((image, idx) => (
                        <div key={idx} className="h-16 w-16 rounded-md overflow-hidden border border-zinc-200 shadow-sm">
                          <img 
                            src={image.url} 
                            alt={`Review image ${idx + 1}`} 
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply Section - Only show if there's actual content */}
                  {hasValidReply(review) && (
                    <div className="mt-4 pl-4 border-l-2 border-blue-300">
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50/50 p-4 rounded-md shadow-sm">
                        <div className="flex items-center mb-2">
                          <Reply className="h-4 w-4 mr-2 text-indigo-500" />
                          <p className="text-sm font-medium text-indigo-700">Your Reply</p>
                        </div>
                        <p className="text-sm text-zinc-700 pl-6">{review.reply.content}</p>
                        <p className="text-xs text-zinc-500 mt-2 pl-6 flex items-center">
                          <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                          {formatDate(review.reply.updatedAt)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Reply Button - Show if there's no reply or if reply has no content */}
                  {!hasValidReply(review) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReplyClick(review)}
                      className="mt-2 bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 transition-all duration-300"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Reply to Review
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination/Load More */}
      {pagination && pagination.hasMore && (
        <div className="mt-6 flex justify-center">
          <Button 
            variant="outline" 
            onClick={loadMoreReviews}
            disabled={loading}
            className="px-6 border-indigo-200 text-indigo-600 hover:bg-indigo-50"
          >
            {loading ? 'Loading...' : 'Load More Reviews'}
          </Button>
        </div>
      )}

      {/* Reply Dialog */}
      <Dialog open={isReplyDialogOpen} onOpenChange={setIsReplyDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center text-indigo-700">
              <Reply className="h-5 w-5 mr-2 text-indigo-500" />
              Reply to Review
            </DialogTitle>
            <DialogDescription className="text-zinc-500">
              Your response will be visible to all customers.
            </DialogDescription>
          </DialogHeader>
          {selectedReview && (
            <div className="p-3 bg-zinc-50 rounded-md mb-3">
              <div className="flex items-center gap-2 mb-2">
                <img 
                  src={selectedReview.product.image} 
                  alt={selectedReview.product.name}
                  className="w-12 h-12 object-cover rounded-md border border-zinc-200" 
                />
                <div>
                  <h4 className="font-medium text-sm">{selectedReview.product.name}</h4>
                  <p className="text-xs text-zinc-500">{formatPrice(selectedReview.product.price)}</p>
                </div>
              </div>
              <div className="text-sm italic text-zinc-600">"{selectedReview.comment}"</div>
            </div>
          )}
          <div className="py-4">
            <Textarea
              placeholder="Write your reply..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              className="min-h-[120px] resize-none focus-visible:ring-indigo-500 border-zinc-300"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsReplyDialogOpen(false)}
              disabled={submittingReply}
              className="border-zinc-300 hover:bg-zinc-100"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitReply}
              disabled={submittingReply || !replyContent?.trim()}
              className="bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-700 hover:to-blue-600 text-white ml-2"
            >
              <Send className="h-4 w-4 mr-2" />
              {submittingReply ? 'Sending...' : 'Send Reply'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

ReviewsTab.propTypes = {
  sellerId: PropTypes.string.isRequired,
};
