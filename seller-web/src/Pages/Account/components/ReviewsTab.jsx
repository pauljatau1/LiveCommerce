import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star, MessageSquare, ShoppingBag, Image as ImageIcon, Video } from "lucide-react"
import { format } from "date-fns"
import { BASE_URL } from "@/Constants/Server"
import LinearProgress from "@mui/material/LinearProgress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ReviewsTab({ sellerId }) {
  const [reviews, setReviews] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState("product")

  useEffect(() => {
    if (sellerId) {
      fetchReviews()
    }
  }, [sellerId])

  const fetchReviews = async () => {
    try {
      const response = await fetch(`${BASE_URL}/seller/${sellerId}/all-reviews?page=1&limit=1000`)
      const data = await response.json()
      setReviews(data.reviews)
      setStats(data.stats)
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredReviews = reviews.filter(review => {
    if (activeFilter === "all") return true
    return review.type === activeFilter
  })

  const getReviewTypeIcon = (type) => {
    switch (type) {
      case 'product':
        return <ShoppingBag className="h-5 w-5 text-blue-500" />
      case 'post':
        return <MessageSquare className="h-5 w-5 text-green-500" />
      case 'blip':
        return <Video className="h-5 w-5 text-purple-500" />
      default:
        return <Star className="h-5 w-5 text-yellow-500" />
    }
  }

  if (loading) return <LinearProgress />

  return (
    <div className="w-full">
      {/* Filter Tabs - Make scrollable on mobile */}
      <div className="overflow-x-auto -mx-4 sm:mx-0 mb-6">
        <div className="px-4 sm:px-0 min-w-[500px] sm:min-w-0">
          <Tabs defaultValue="product" onValueChange={setActiveFilter}>
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="product" className="text-sm sm:text-base">Product Reviews</TabsTrigger>
              <TabsTrigger value="post" className="text-sm sm:text-base">Post Comments</TabsTrigger>
              <TabsTrigger value="blip" className="text-sm sm:text-base">Blip Comments</TabsTrigger>
              <TabsTrigger value="all" className="text-sm sm:text-base">All</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.map((review) => (
          <Card key={review._id} className={`
            ${review.type === 'product' ? 'bg-blue-50/50' : ''}
            ${review.type === 'post' ? 'bg-green-50/50' : ''}
            ${review.type === 'blip' ? 'bg-purple-50/50' : ''}
          `}>
            <CardHeader className="flex flex-col sm:flex-row items-start gap-4 p-4 sm:p-6">
              {/* Image/Avatar Section */}
              <div className="flex-shrink-0">
                {review.type === 'product' ? (
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden">
                    <img 
                      src={review.source?.image} 
                      alt={review.source?.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : review.type === 'blip' ? (
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-purple-100 flex items-center justify-center">
                    <Video className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500" />
                  </div>
                ) : (
                  <Avatar className="w-12 h-12 sm:w-16 sm:h-16">
                    <AvatarImage src={review.author?.avatar || review.source?.image} />
                    <AvatarFallback>
                      {review.author?.firstName?.[0] || review.firstName?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>

              {/* Content Section */}
              <div className="flex-1 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-semibold text-sm sm:text-base">
                      {review.type === 'blip' ? 'Blip Comment' : 
                       review.type === 'product' ? `${review.firstName} ${review.lastName}` :
                       `${review.author?.firstName} ${review.author?.lastName}`}
                    </h4>
                    <Badge variant="outline" className="flex items-center gap-1 text-xs">
                      {getReviewTypeIcon(review.type)}
                      <span className="capitalize">{review.type}</span>
                    </Badge>
                  </div>
                  {review.type === 'product' && review.rating && (
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
                  {review.source?.name && review.type !== 'blip' && (
                    <>
                      <span>•</span>
                      <p className="flex items-center gap-1">
                        {getReviewTypeIcon(review.source.type)}
                        {review.source.name}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-6">
              <p className="text-sm">
                {review.type === 'product' ? review.comment : 
                 review.type === 'blip' ? review.comment :
                 review.content}
              </p>
              {review.images && review.images.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {review.images.map((image, index) => (
                    <img 
                      key={image._id}
                      src={image.url}
                      alt={`Review image ${index + 1}`}
                      className="rounded-lg h-16 w-16 sm:h-24 sm:w-24 object-cover"
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
} 