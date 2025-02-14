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
    <div>
      {/* Filter Tabs */}
      <Tabs defaultValue="product" className="mb-6" onValueChange={setActiveFilter}>
        <TabsList>
          <TabsTrigger value="product">Product Reviews</TabsTrigger>
          <TabsTrigger value="post">Post Comments</TabsTrigger>
          <TabsTrigger value="blip">Blip Comments</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Stats Section */}
     
      {/* Reviews List */}
      <div className="space-y-6">
        {filteredReviews.map((review) => (
          <Card key={review._id} className={`
            ${review.type === 'product' ? 'bg-blue-50/50' : ''}
            ${review.type === 'post' ? 'bg-green-50/50' : ''}
            ${review.type === 'blip' ? 'bg-purple-50/50' : ''}
          `}>
            <CardHeader className="flex flex-row items-start gap-4">
              {review.type === 'product' ? (
                <div className="w-16 h-16 rounded-lg overflow-hidden">
                  <img 
                    src={review.source?.image} 
                    alt={review.source?.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : review.type === 'blip' ? (
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-purple-100 flex items-center justify-center">
                  <Video className="h-8 w-8 text-purple-500" />
                </div>
              ) : (
                <Avatar>
                  <AvatarImage src={review.author?.avatar || review.source?.image} />
                  <AvatarFallback>
                    {review.author?.firstName?.[0] || review.firstName?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
              )}

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">
                      {review.type === 'blip' ? 'Blip Comment' : 
                       review.type === 'product' ? `${review.firstName} ${review.lastName}` :
                       `${review.author?.firstName} ${review.author?.lastName}`}
                    </h4>
                    <Badge variant="outline" className="flex items-center gap-1">
                      {getReviewTypeIcon(review.type)}
                      <span className="capitalize">{review.type}</span>
                    </Badge>
                  </div>
                  {review.type === 'product' && review.rating && (
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
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

            <CardContent>
              <p className="text-sm">
                {review.type === 'product' ? review.comment : 
                 review.type === 'blip' ? review.comment :
                 review.content}
              </p>
              {review.images && review.images.length > 0 && (
                <div className="mt-3 flex gap-2">
                  {review.images.map((image, index) => (
                    <img 
                      key={image._id}
                      src={image.url}
                      alt={`Review image ${index + 1}`}
                      className="rounded-lg h-24 w-24 object-cover"
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