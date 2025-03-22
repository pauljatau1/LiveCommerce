import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Send, MessageCircle, ThumbsUp } from "lucide-react";
import { format, parseISO } from "date-fns";
import { BASE_URL } from "@/Constants/Server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function ReviewsTab({ sellerId }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false);

  useEffect(() => {
    if (sellerId) {
      fetchStoreReviews();
    }
  }, [sellerId]);

  const fetchStoreReviews = async () => {
    try {
      const tokenData = JSON.parse(localStorage.getItem("sellerToken"));
      if (!tokenData) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`${BASE_URL}/seller/reviews`, {
        headers: {
          Authorization: `Bearer ${tokenData.data}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch reviews");
      }

      const data = await response.json();
      console.log('Fetched reviews data:', data); // Debug log
      
      if (data.reviews?.length > 0) {
        console.log('First review buyer image:', data.reviews[0]?.buyer?.profileImage); // Debug log
      }
      
      setReviews(data.reviews || []);
    } catch (error) {
      console.error('Error fetching store reviews:', error);
      toast.error("Failed to fetch store reviews");
    } finally {
      setLoading(false);
    }
  };

  const handleReplyClick = (review) => {
    setSelectedReview(review);
    setReplyContent(review.reply?.content || "");
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

      const response = await fetch(`${BASE_URL}/seller/reviews/${selectedReview._id}/reply`, {
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
          review._id === selectedReview._id
            ? { ...review, reply: data.review.reply }
            : review
        )
      );

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

  const ReviewSkeleton = () => (
    <Card className="border border-zinc-200 hover:border-zinc-300 transition-colors">
      <CardHeader className="flex flex-col sm:flex-row items-start gap-4 p-4 sm:p-6">
        <Skeleton className="w-12 h-12 sm:w-16 sm:h-16 rounded-full" />
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

  if (loading) {
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
          <div className="text-center py-16 px-4 bg-zinc-50 rounded-lg border border-zinc-200">
            <ThumbsUp className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-medium mb-2">No Reviews Yet</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              When customers review your products, they will appear here. Quality products and service lead to great reviews!
            </p>
          </div>
        ) : (
          reviews.map((review) => (
            <Card 
              key={review._id} 
              className="border border-zinc-200 hover:border-zinc-300 transition-colors hover:shadow-sm"
            >
              <CardHeader className="flex flex-col sm:flex-row items-start gap-4 p-4 sm:p-6 pb-2">
                {/* Image/Avatar Section */}
                <div className="flex-shrink-0">
                  <Avatar className="w-12 h-12 sm:w-16 sm:h-16 ring-2 ring-zinc-100 border border-zinc-200">
                    {review.buyer?.profileImage?.url ? (
                      <AvatarImage 
                        src={review.buyer.profileImage.url}
                        alt={`${review.buyer?.firstName} ${review.buyer?.lastName}`}
                        onError={(e) => {
                          console.error('Failed to load image:', e);
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : null}
                    <AvatarFallback className="bg-gradient-to-br from-green-100 to-green-200 text-green-800">
                      {review.buyer?.firstName?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </div>

                {/* Content Section */}
                <div className="flex-1 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-semibold text-sm sm:text-base">
                        {`${review.buyer?.firstName} ${review.buyer?.lastName}`}
                      </h4>
                      {review.isVerifiedPurchase && (
                        <Badge variant="success" className="text-xs">
                          Verified Purchase
                        </Badge>
                      )}
                    </div>
                    {review.rating && (
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 sm:h-4 sm:w-4 ${
                              i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-zinc-200"
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                    <p>{formatDate(review.createdAt)}</p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 sm:p-6 pt-2 space-y-4">
                <p className="text-sm text-zinc-700 leading-relaxed">{review.comment}</p>

                {/* Reply Section */}
                {review.reply && (
                  <div className="mt-4 pl-4 border-l-2 border-green-200">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm font-medium mb-2 text-zinc-800">Your Reply</p>
                      <p className="text-sm text-zinc-600">{review.reply.content}</p>
                      <p className="text-xs text-zinc-400 mt-2">
                        {formatDate(review.reply.updatedAt)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Reply Button */}
                {!review.reply && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleReplyClick(review)}
                    className="mt-2 text-zinc-600 hover:text-zinc-900 hover:border-green-500"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Reply to Review
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Reply Dialog */}
      <Dialog open={isReplyDialogOpen} onOpenChange={setIsReplyDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Reply to Review</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Write your reply..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              className="min-h-[100px] resize-none focus:border-green-500"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsReplyDialogOpen(false)}
              disabled={submittingReply}
              className="border-zinc-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitReply}
              disabled={submittingReply || !replyContent?.trim()}
              className="bg-green-600 hover:bg-green-700 text-white ml-2"
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
