import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Play, Clock, Heart, MessageSquare, Star, Store, Package } from "lucide-react"
import { format } from "date-fns"
import LinearProgress from "@mui/material/LinearProgress"
import { BASE_URL } from "@/Constants/Server"

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

  if (loading) return <LinearProgress />
  if (error) return <div className="text-red-500">Error: {error}</div>

  return (
    <div className="space-y-8">
      {/* Store Info Section */}
      {/* {blips.length > 0 && (
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 p-6">
          <div className="flex items-center gap-4">
            <img
              src={blips[0].seller.storeAvatar.url}
              alt={blips[0].seller.storeName}
              className="w-16 h-16 rounded-full object-cover"
            />
            <div>
              <h2 className="text-xl font-bold">{blips[0].seller.storeName}</h2>
              <p className="text-gray-600">{blips[0].seller.aboutStore}</p>
            </div>
          </div>
        </Card>
      )} */}

      {/* Blips Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {blips.map((blip) => (
          <Card key={blip.blipId} className="overflow-hidden hover:shadow-lg transition-shadow">
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
                    <Play className="h-12 w-12 text-white" />
                  </div>
                </>
              )}
              <Badge className="absolute top-2 right-2 bg-black/60">
                <Clock className="h-3 w-3 mr-1" />
                {formatDate(blip.createdAt)}
              </Badge>
            </div>

            <CardHeader>
              <div className="space-y-4">
                {/* Product Info */}
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg font-bold">{blip.productName}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
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

                {/* Engagement Stats */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Heart className={`h-4 w-4 ${blip.blipEngagement.likesCount > 0 ? 'text-red-500 fill-red-500' : ''}`} />
                    {blip.blipEngagement.likesCount}
                  </span>
                  <span className="flex items-center gap-1">
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
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  )
} 