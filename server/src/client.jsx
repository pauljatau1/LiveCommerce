import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star, Send } from "lucide-react"
import { format } from "date-fns"
import { BASE_URL } from "@/Constants/Server"
import LinearProgress from "@mui/material/LinearProgress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"

export default function ReviewsTab({ sellerId }) {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [replyContent, setReplyContent] = useState({})
  const [submittingReply, setSubmittingReply] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (sellerId) {
      fetchStoreReviews()
    }
  }, [sellerId])

  const fetchStoreReviews = async () => {
    try {
      const response = await fetch(`${BASE_URL}/seller/reviews`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        }
      })
      const data = await response.json()
      setReviews(data.reviews || [])
    } catch (error) {
      console.error('Error fetching store reviews:', error)
      toast({
        title: "Error",
        description: "Failed to fetch store reviews",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleReplyChange = (reviewId, value) => {
    setReplyContent(prev => ({
      ...prev,
      [reviewId]: value
    }))
  }

  const handleSubmitReply = async (reviewId) => {
    if (!replyContent[reviewId]?.trim()) {
      toast({
        title: "Error",
        description: "Reply content cannot be empty",
        variant: "destructive",
      })
      return
    }

    setSubmittingReply(true)
    try {
      const response = await fetch(`${BASE_URL}/seller/reviews/${reviewId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          content: replyContent[reviewId]
        })
      })

      if (!response.ok) {
        throw new Error('Failed to submit reply')
      }

      const data = await response.json()
      
      // Update the reviews state with the new reply
      setReviews(prevReviews => 
        prevReviews.map(review => 
          review._id === reviewId 
            ? { ...review, reply: data.review.reply }
            : review
        )
      )

      // Clear the reply input
      setReplyContent(prev => ({
        ...prev,
        [reviewId]: ''
      }))

      toast({
        title: "Success",
        description: "Reply added successfully",
      })
    } catch (error) {
      console.error('Error submitting reply:', error)
      toast({
        title: "Error",
        description: "Failed to submit reply",
        variant: "destructive",
      })
    } finally {
      setSubmittingReply(false)
    }
  }

  if (loading) return <LinearProgress />

  return (
    <div className="w-full">
      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <Card key={review._id}>
            <CardHeader className="flex flex-col sm:flex-row items-start gap-4 p-4 sm:p-6">
              {/* Image/Avatar Section */}
              <div className="flex-shrink-0">
                <Avatar className="w-12 h-12 sm:w-16 sm:h-16">
                  <AvatarImage src={review.buyer?.profileImage?.url} />
                  <AvatarFallback>
                    {review.buyer?.firstName?.[0] || 'U'}
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
                      <Badge variant="success" className="text-xs">Verified Purchase</Badge>
                    )}
                  </div>
                  {review.rating && (
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 sm:h-4 sm:w-4 ${
                            i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                  <p>{format(new Date(review.createdAt), 'MMM dd, yyyy')}</p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-6 space-y-4">
              <p className="text-sm">{review.comment}</p>

              {/* Reply Section */}
              {review.reply && (
                <div className="mt-4 pl-4 border-l-2 border-gray-200">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm font-medium mb-1">Seller's Reply</p>
                    <p className="text-sm text-gray-600">{review.reply.content}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {format(new Date(review.reply.createdAt), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
              )}

              {/* Reply Input */}
              {!review.reply && (
                <div className="mt-4 space-y-2">
                  <Textarea
                    placeholder="Write your reply..."
                    value={replyContent[review._id] || ''}
                    onChange={(e) => handleReplyChange(review._id, e.target.value)}
                    className="min-h-[80px]"
                  />
                  <Button
                    onClick={() => handleSubmitReply(review._id)}
                    disabled={submittingReply || !replyContent[review._id]?.trim()}
                    className="flex items-center gap-2"
                  >
                    <Send className="h-4 w-4" />
                    {submittingReply ? 'Sending...' : 'Reply'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
} 