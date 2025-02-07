import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useParams, useNavigate } from "react-router-dom"
import { MessageCircle, Phone, Printer, Plus, ShoppingBag, ArrowLeft } from "lucide-react"
import { useState, useEffect } from "react"
import { BASE_URL } from "@/Constants/Server"

export default function ReturnDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [returnData, setReturnData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReturnDetails()
  }, [id])

  const fetchReturnDetails = async () => {
    try {
      const sellerToken = JSON.parse(localStorage.getItem("sellerToken")).data
      const response = await fetch(`${BASE_URL}/returns/${id}`, {
        headers: {
          Authorization: `Bearer ${sellerToken}`
        }
      })
      const data = await response.json()
      setReturnData(data)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching return details:", error)
      setLoading(false)
    }
  }

  const handleReturnAction = async (action) => {
    try {
      const sellerToken = JSON.parse(localStorage.getItem("sellerToken")).data
      const response = await fetch(`${BASE_URL}/returns/${id}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sellerToken}`
        },
        body: JSON.stringify({
          action,
          message: action === 'reject' ? 'Return request denied' : 'Return request approved'
        })
      })
      
      if (response.ok) {
        fetchReturnDetails()
      }
    } catch (error) {
      console.error("Error handling return action:", error)
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="pt-10 px-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-semibold">Return ID: #{id}</h1>
            <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-600">
              {returnData?.status || "PENDING SELLER APPROVAL"}
            </Badge>
          </div>
          <div className="flex gap-4 text-muted-foreground">
            <p>Return Reason: {returnData?.items[0]?.reason || "Wrong Item"}</p>
            <p>Order ID: #{returnData?.order?.order_id || "098765"}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Follow
          </Button>
          <Button variant="outline" size="sm">
            <MessageCircle className="w-4 h-4 mr-2" />
            Chat Buyer
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Product Section */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Product</h2>
            <div className="flex gap-4">
              <img
                src={returnData?.items[0]?.product?.images[0] || "/placeholder.svg"}
                alt={returnData?.items[0]?.product?.name}
                width={100}
                height={100}
                className="rounded-lg object-cover"
              />
              <div className="flex-1">
                <h3 className="font-semibold">{returnData?.items[0]?.product?.name || "Luxury Turtle Neck Polo"}</h3>
                <p className="text-sm text-muted-foreground">Quantity: {returnData?.items[0]?.quantity || 1}</p>
                <div className="flex justify-between mt-2">
                  <p className="text-green-600">Unit Price: ₦{returnData?.items[0]?.product?.price?.toLocaleString() || "1,000,000"}</p>
                  <p className="text-green-600">Total: ₦{((returnData?.items[0]?.product?.price || 1000000) * (returnData?.items[0]?.quantity || 1)).toLocaleString()}</p>
                </div>
              </div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Comment: {returnData?.description || "The item is not what I ordered, it was supposed to be a white T-shirt and not Black."}
            </p>
            {returnData?.status === "PENDING_SELLER_REVIEW" && (
              <div className="flex gap-4 mt-4">
                <Button 
                  variant="outline" 
                  className="text-red-600 hover:text-red-700"
                  onClick={() => handleReturnAction('reject')}
                >
                  Deny/Escalate
                </Button>
                <Button 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => handleReturnAction('approve')}
                >
                  Accept Request
                </Button>
              </div>
            )}
          </Card>

          {/* Activity Timeline */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Activity</h2>
            <div className="space-y-6">
              {returnData?.timeline?.map((activity, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-green-600" />
                    {index !== (returnData?.timeline?.length - 1) && <div className="w-0.5 h-full bg-gray-200" />}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-muted-foreground">
                      {new Date(activity.date).toLocaleString()}
                    </div>
                    <div className="font-medium text-green-600">{activity.status}</div>
                    <div className="text-sm text-muted-foreground">{activity.note}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Customer Details */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Customer Details</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <img 
                  src={returnData?.buyer?.profileImage?.url || "/placeholder.svg"} 
                  alt="Customer Avatar" 
                  width={40} 
                  height={40} 
                  className="rounded-full"
                />
                <div>
                  <p className="font-medium">
                    {`${returnData?.buyer?.firstName} ${returnData?.buyer?.lastName}` || "Odera Joseph"}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ShoppingBag className="w-4 h-4" />
                    <span>10 Orders</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4" />
                <span>{returnData?.buyer?.phoneNumber || "+234123456789"}</span>
              </div>
            </div>
          </Card>

          {/* Shipping Information */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Shipping Information</h2>
            <div className="space-y-2">
              <p className="font-medium">Return Address:</p>
              <p className="text-sm text-muted-foreground">
                {returnData?.buyer?.shippingAddresses?.[0]?.addressLine1 || "Block 6, Vila Cecillia"},
                {returnData?.buyer?.shippingAddresses?.[0]?.city || "Lagos"} State.
                {returnData?.buyer?.shippingAddresses?.[0]?.zipCode || "12345"},
                {returnData?.buyer?.shippingAddresses?.[0]?.country || "Nigeria"}
              </p>
            </div>
          </Card>

          {/* Proof Files */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Proof Files</h2>
            <div className="space-y-4">
              {returnData?.evidence?.map((file, index) => (
                <img 
                  key={index}
                  src={file.url || "/placeholder.svg"} 
                  alt={`Return Evidence ${index + 1}`} 
                  className="w-full rounded-lg"
                />
              ))}
            </div>
          </Card>
        </div>
      </div>

      <div className="mt-6">
        <Button 
          variant="outline" 
          className="text-muted-foreground"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back
        </Button>
      </div>
    </div>
  )
}

