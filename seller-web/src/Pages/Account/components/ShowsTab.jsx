import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card"
import { Badge } from "@/Components/ui/badge"
import { Calendar, Clock, Users, Eye } from "lucide-react"
import { format } from "date-fns"
import { BASE_URL } from "@/Constants/Server"
import { Skeleton } from "@/Components/ui/skeleton"
import PropTypes from "prop-types";
export default function ShowsTab({ sellerId }) {
  const [streams, setStreams] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (sellerId) {
      fetchStreams()
    }
  }, [sellerId])

  const fetchStreams = async () => {
    try {
      const response = await fetch(`${BASE_URL}/streams/seller/${sellerId}?page=1&limit=20`)
      const data = await response.json()
      setStreams(data.streams)
    } catch (error) {
      console.error('Error fetching streams:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'ended':
        return 'destructive'
      case 'scheduled':
        return 'default'
      case 'live':
        return 'success'
      case 'expired':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const getImageUrl = (stream) => {
    // Handle different stream data structures
    if (stream.coverImage && stream.coverImage.url) {
      return stream.coverImage.url
    }
    
    if (stream.products && stream.products.length > 0) {
      const firstProduct = stream.products[0]
      
      // Check if product has nested product object with images
      if (firstProduct.product && typeof firstProduct.product === 'object' && 
          firstProduct.product.images && firstProduct.product.images.length > 0) {
        return firstProduct.product.images[0].url
      }
      
      // Handle case where product is a string ID
      if (firstProduct.product && typeof firstProduct.product === 'string') {
        return 'https://picsum.photos/400/300'
      }
    }
    
    // Fallback to placeholder
    return 'https://picsum.photos/400/300'
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="overflow-hidden">
            <div className="md:flex">
              <Skeleton className="w-full md:w-64 h-48" />
              <div className="flex-1 p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                  <Skeleton className="h-20 w-full" />
                  <div className="flex gap-4">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {streams.length === 0 ? (
        <div className="text-center py-10">
          <div className="mb-4">
            <Eye className="h-12 w-12 mx-auto text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">No streams found</h3>
          <p className="text-muted-foreground mt-2">
            You haven't created any livestream shows yet.
          </p>
        </div>
      ) : (
        streams.map((stream) => (
          <Card key={stream._id} className="overflow-hidden border-zinc-200 hover:border-zinc-300 hover:shadow-md transition-all duration-200">
            <div className="md:flex">
              <div className="w-full md:w-64 h-48 relative overflow-hidden">
                <img
                  src={getImageUrl(stream)}
                  alt="Show thumbnail"
                  className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
                />
                <Badge 
                  variant={getStatusBadgeVariant(stream.status)} 
                  className="capitalize absolute top-2 right-2 shadow-sm"
                >
                  {stream.status}
                </Badge>
              </div>
              <div className="flex-1">
                <CardHeader>
                  <CardTitle className="text-xl">{stream.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground line-clamp-2">
                    {stream.description || "No description provided"}
                  </p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <span className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-green-600" />
                      {format(new Date(stream.scheduledStartTime), 'MMM dd, yyyy')}
                    </span>
                    <span className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-green-600" />
                      {format(new Date(stream.scheduledStartTime), 'h:mm a')}
                    </span>
                    <span className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-green-600" />
                      {stream.viewers?.length || 0} viewers
                    </span>
                  </div>
                </CardContent>
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  )
} 

ShowsTab.propTypes = {
  sellerId: PropTypes.string.isRequired,
};

