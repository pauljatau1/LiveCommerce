import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useParams, useNavigate } from "react-router-dom"
import { MessageCircle, Phone, Printer, Plus, ShoppingBag, ArrowLeft, CheckCircle } from "lucide-react"
import { useState, useEffect } from "react"
import { BASE_URL } from "@/Constants/Server"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/Components/ui/dialog"
import { toast } from "sonner";

export default function ReturnDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [returnData, setReturnData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isLoading, setIsLoading] = useState(false);
  const [shippingRates, setShippingRates] = useState([]);
  const [selectedRate, setSelectedRate] = useState(null);
  const [showRatesModal, setShowRatesModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  useEffect(() => {
    fetchReturnDetails()
  }, [id])

  // Fetch shipping rates when component mounts if status is appropriate
  useEffect(() => {
    if (returnData?.status === "APPROVED" && !returnData?.returnShipment?.rate_id) {
      fetchShippingRates(id);
    }
  }, [returnData?.status, id]);

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

  const fetchShippingRates = async (returnId) => {
    try {
      setIsLoading(true);
      const sellerToken = JSON.parse(localStorage.getItem("sellerToken")).data;
      const response = await fetch(`${BASE_URL}/returns/${returnId}/shipping-rates`, {
        headers: {
          Authorization: `Bearer ${sellerToken}`
        }
      });
      const data = await response.json();
      
      if (response.ok) {
        setShippingRates(data.rates);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast.error('Failed to fetch shipping rates');
    } finally {
      setIsLoading(false);
    }
  };

  const createShippingLabel = async (returnId) => {
    try {
      setIsLoading(true);
      const sellerToken = JSON.parse(localStorage.getItem("sellerToken")).data;
      const response = await fetch(`${BASE_URL}/returns/${returnId}/create-label`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sellerToken}`
        },
        body: JSON.stringify({
          rate_id: selectedRate.rate_id,
          carrier_name: selectedRate.carrier_name,
          amount: selectedRate.amount
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success('Shipping label created successfully');
        fetchReturnDetails(); // Refresh the return data
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast.error('Failed to create shipping label');
    } finally {
      setIsLoading(false);
    }
  };

  const arrangePickup = async (returnId) => {
    try {
      setIsLoading(true);
      const sellerToken = JSON.parse(localStorage.getItem("sellerToken")).data;
      const response = await fetch(`${BASE_URL}/returns/${returnId}/arrange-pickup`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sellerToken}`
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success('Shipment pickup arranged successfully');
        fetchReturnDetails(); // Refresh the return data
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast.error('Failed to arrange pickup');
    } finally {
      setIsLoading(false);
    }
  };

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

            {/* Add new shipping rates section when status is appropriate */}
            {returnData?.status === "APPROVED" && !returnData?.returnShipment?.rate_id && (
              <div className="mt-6 border-t pt-4">
                <h3 className="text-lg font-semibold mb-4">Select Shipping Rate</h3>
                <div className="space-y-4">
                  {shippingRates.map((rate) => (
                    <div 
                      key={rate.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedRate?.id === rate.id 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-gray-200 hover:border-green-300'
                      }`}
                      onClick={() => setSelectedRate(rate)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img 
                            src={rate.carrier_logo} 
                            alt={rate.carrier_name}
                            className="h-8 w-8 object-contain"
                          />
                          <div>
                            <h3 className="font-medium">{rate.carrier_name}</h3>
                            <p className="text-sm text-gray-600">{rate.carrier_rate_description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">₦{rate.amount.toLocaleString()}</p>
                          <p className="text-sm text-gray-600">{rate.delivery_time}</p>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="flex justify-end gap-4 mt-4">
                    <Button
                      onClick={() => createShippingLabel(id)}
                      disabled={!selectedRate || isLoading}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isLoading ? 'Creating Label...' : 'Create Shipping Label'}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Add pickup arrangement section when label is created */}
            {returnData?.status === "RETURN_LABEL_CREATED" && !returnData?.returnShipment?.status !== "PICKUP_ARRANGED" && (
              <div className="mt-6 border-t pt-4">
                <div className="bg-green-50 p-4 rounded-lg mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="text-green-600 w-5 h-5" />
                    <h3 className="font-medium">Shipping Label Created</h3>
                  </div>
                  <p className="text-sm text-gray-600">Your shipping label has been created successfully with {returnData?.returnShipment?.carrier?.name}</p>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={() => arrangePickup(id)}
                    disabled={isLoading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isLoading ? 'Arranging Pickup...' : 'Arrange Pickup Now'}
                  </Button>
                </div>
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

