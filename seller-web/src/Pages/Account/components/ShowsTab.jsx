import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Users } from "lucide-react"
import { format } from "date-fns"
import LinearProgress from "@mui/material/LinearProgress"
import { BASE_URL } from "@/Constants/Server"

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
      case 'expired':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      {streams.map((stream) => (
        <Card key={stream._id}>
          <div className="md:flex">
            <img
              src={stream.products[0]?.product?.images[0]?.url || 'https://picsum.photos/400/300'}
              alt="Show thumbnail"
              className="w-full md:w-64 h-48 object-cover"
            />
            <div className="flex-1">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{stream.title}</CardTitle>
                  <Badge variant={getStatusBadgeVariant(stream.status)} className="capitalize">
                    {stream.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  {stream.description}
                </p>
                <div className="flex gap-4 text-sm">
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
      ))}
    </div>
  )
} 