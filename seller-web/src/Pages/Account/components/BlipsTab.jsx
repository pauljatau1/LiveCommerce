import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Play, Clock, Heart, MessageSquare, Star, Store, Video } from "lucide-react"
import { format } from "date-fns"
import { BASE_URL } from "@/Constants/Server"
import { Skeleton } from "@/components/ui/skeleton"
import PropTypes from "prop-types";
export default function BlipsTab({ sellerId }) {
  const [blips, setBlips] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedBlip, setSelectedBlip] = useState(null)

  useEffect(() => {
    if (sellerId) {
      fetchBlips()
    }
  }, [sellerId])

  const fetchBlips = async () => {
    try {
      const sellerToken = localStorage.getItem("sellerToken")
      if (!sellerToken) throw new Error("Not authenticated")

      const tokenData = JSON.parse(sellerToken)
      const token = tokenData.data

      const response = await fetch(`${BASE_URL}/products/seller/${sellerId}/blips?page=1&limit=10`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch blips")
      }

      const data = await response.json()
      setBlips(data.blips || [])
    } catch (error) {
      console.error("Error fetching blips:", error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString)
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "Invalid date"
      }
      return format(date, 'MMM d, yyyy')
    } catch (error) {
      console.error("Date formatting error:", error)
      return "Invalid date"
    }
  }

  const handleVideoClick = (blip) => {
    setSelectedBlip(selectedBlip?.blipId === blip.blipId ? null : blip)
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="w-full h-64" />
              <div className="p-4 space-y-4">
                <div className="flex justify-between items-start">
                  <Skeleton className="h-6 w-3/5" />
                  <Skeleton className="h-7 w-1/4" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex items-center gap-4">
                  <Skeleton className="h-4 w-10" />
                  <Skeleton className="h-4 w-10" />
                  <Skeleton className="h-4 w-10" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="text-red-500 bg-red-50 p-4 rounded-lg border border-red-200 mb-4">
        <p className="font-medium">Error: {error}</p>
      </div>
      <button 
        onClick={() => { setLoading(true); fetchBlips(); }}
        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
      >
        Try Again
      </button>
    </div>
  )

  return (
    <div className="space-y-8">
      {/* Blips Grid */}
      {blips.length === 0 ? (
        <div className="text-center py-16 px-4">
          <Video className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium mb-2">No blips found</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Blips are short product videos that help showcase your items. Create your first blip to engage with customers!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blips.map((blip) => (
            <Card key={blip.blipId} className="overflow-hidden hover:shadow-lg transition-all duration-300 border border-zinc-200 hover:border-zinc-300">
              <div className="relative">
                {selectedBlip?.blipId === blip.blipId ? (
                  <video
                    src={blip.blipUrl}
                    className="w-full h-64 object-cover"
                    controls
                    autoPlay
                  />
                ) : (
                  <>
                    <img
                      src={blip.images}
                      alt={blip.productName}
                      className="w-full h-64 object-cover"
                    />
                    <div 
                      className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                      onClick={() => handleVideoClick(blip)}
                    >
                      <div className="w-16 h-16 bg-white/25 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <Play className="h-8 w-8 text-white fill-white" />
                      </div>
                    </div>
                  </>
                )}
                <Badge className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatDate(blip.createdAt)}
                </Badge>
              </div>

              <CardHeader className="pb-0 pt-4">
                <div className="space-y-4">
                  {/* Product Info */}
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg font-bold line-clamp-1">{blip.productName}</CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Store className="h-4 w-4" />
                        <span>{blip.seller.storeName}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-green-600">
                        ₦{blip.price.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-3">
                {/* Engagement Stats */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1 hover:text-red-500 transition-colors cursor-pointer">
                    <Heart className={`h-4 w-4 ${blip.blipEngagement.likesCount > 0 ? 'text-red-500 fill-red-500' : ''}`} />
                    {blip.blipEngagement.likesCount}
                  </span>
                  <span className="flex items-center gap-1 hover:text-blue-500 transition-colors cursor-pointer">
                    <MessageSquare className="h-4 w-4" />
                    {blip.blipEngagement.commentsCount}
                  </span>
                  {blip.averageRating && (
                    <span className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      {blip.averageRating.toFixed(1)} ({blip.reviewCount})
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 

BlipsTab.propTypes = {
  sellerId: PropTypes.string.isRequired,
};

