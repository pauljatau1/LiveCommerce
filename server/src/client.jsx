import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useParams, useNavigate } from "react-router-dom"
import { MessageCircle, Phone, Printer, Plus, ShoppingBag, ArrowLeft } from "lucide-react"
import { useState, useEffect } from "react"
import { BASE_URL } from "@/Constants/Server"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"

export default function ReturnDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [returnData, setReturnData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [shippingRates, setShippingRates] = useState([])
  const [selectedRate, setSelectedRate] = useState(null)
  const [showPickupSuccess, setShowPickupSuccess] = useState(false)
  const [showRatesDialog, setShowRatesDialog] = useState(false)
  const [showPickupDialog, setShowPickupDialog] = useState(false)

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

  const handleCreateShippingLabel = async () => {
    try {
      const sellerToken = JSON.parse(localStorage.getItem("sellerToken")).data
      const response = await fetch(`${BASE_URL}/returns/${id}/create-label`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sellerToken}`
        },
        body: JSON.stringify({
          pickup_address: returnData.order.delivery_address // Buyer's address
        })
      })

      if (!response.ok) throw new Error('Failed to create shipping label')
      
      // Fetch shipping rates after label creation
      const ratesResponse = await fetch(`${BASE_URL}/returns/${id}/shipping-rates`, {
        headers: {
          Authorization: `Bearer ${sellerToken}`
        }
      })
      
      const ratesData = await ratesResponse.json()
      setShippingRates(ratesData.rates)
      fetchReturnDetails() // Refresh return data
      
      toast.success("Shipping label created", {
        description: "Please select a shipping rate to continue"
      })
    } catch (error) {
      console.error('Error creating shipping label:', error)
      toast.error("Failed to create shipping label")
    }
  }

  const handleSelectRate = async () => {
    try {
      const sellerToken = JSON.parse(localStorage.getItem("sellerToken")).data
      const response = await fetch(`${BASE_URL}/returns/${id}/select-rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sellerToken}`
        },
        body: JSON.stringify({
          rate_id: selectedRate.rate_id,
          carrier_name: selectedRate.carrier_name,
          amount: selectedRate.amount
        })
      })

      if (!response.ok) throw new Error('Failed to select rate')
      
      fetchReturnDetails() // Refresh return data
      setSelectedRate(null)
      
      toast.success("Rate selected", {
        description: "You can now arrange pickup for the return"
      })
    } catch (error) {
      console.error('Error selecting rate:', error)
      toast.error("Failed to select shipping rate")
    }
  }

  const handleArrangePickup = async () => {
    try {
      const sellerToken = JSON.parse(localStorage.getItem("sellerToken")).data
      const response = await fetch(`${BASE_URL}/returns/${id}/arrange-pickup`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sellerToken}`
        }
      })

      if (!response.ok) throw new Error('Failed to arrange pickup')
      
      fetchReturnDetails() // Refresh return data
      setShowPickupSuccess(true)
    } catch (error) {
      console.error('Error arranging pickup:', error)
      toast.error("Failed to arrange pickup")
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  const PickupSuccessAlert = showPickupSuccess && (
    <Alert className="mt-4">
      <AlertTitle>Pickup Arranged Successfully!</AlertTitle>
      <AlertDescription>
        The pickup has been arranged for your return shipment. The carrier will collect the package from the specified address.
      </AlertDescription>
    </Alert>
  )

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
                src={returnData?.items[0]?.product?.images[0]?.url}
                alt={returnData?.items[0]?.product?.name}
                width={100}
                height={100}
                className="rounded-lg object-cover"
              />
              <div className="flex-1">
                <h3 className="font-semibold">{returnData?.items[0]?.product?.name}</h3>
                <p className="text-sm text-muted-foreground">Quantity: {returnData?.items[0]?.quantity}</p>
                <div className="flex justify-between mt-2">
                  <p className="text-green-600">Unit Price: ₦{returnData?.items[0]?.product?.price?.toLocaleString()}</p>
                  <p className="text-green-600">Total: ₦{(returnData?.items[0]?.product?.price * returnData?.items[0]?.quantity).toLocaleString()}</p>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">Return Reason: {returnData?.items[0]?.reason}</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Description: {returnData?.description}
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

          {/* Proof Files - Moved and Enhanced */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Return Evidence</h2>
            <div className="grid grid-cols-2 gap-4">
              {returnData?.evidence?.length > 0 ? (
                returnData.evidence.map((file, index) => (
                  <div key={index} className="space-y-2">
                    <a 
                      href={file.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <img 
                        src={file.url} 
                        alt={`Return Evidence ${index + 1}`} 
                        className="w-full h-[200px] object-cover rounded-lg border hover:opacity-90 transition-opacity"
                      />
                    </a>
                    <p className="text-sm text-muted-foreground">
                      Uploaded on: {new Date(file.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                ))
              ) : (
                <div className="col-span-2 py-8 text-center text-muted-foreground">
                  <ShoppingBag className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No evidence files uploaded</p>
                </div>
              )}
            </div>
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
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                  {returnData?.buyer?.firstName?.[0]}{returnData?.buyer?.lastName?.[0]}
                </div>
                <div>
                  <p className="font-medium">
                    {`${returnData?.buyer?.firstName} ${returnData?.buyer?.lastName}`}
                  </p>
                  <p className="text-sm text-muted-foreground">{returnData?.buyer?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4" />
                <span>{returnData?.order?.delivery_address?.phone}</span>
              </div>
            </div>
          </Card>

          {/* Shipping Information */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Shipping Information</h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-medium mb-2">Delivery Address</h3>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">
                    {returnData?.order?.delivery_address?.first_name} {returnData?.order?.delivery_address?.last_name}
                  </p>
                  <p>{returnData?.order?.delivery_address?.line1}</p>
                  {returnData?.order?.delivery_address?.line2 && (
                    <p>{returnData?.order?.delivery_address?.line2}</p>
                  )}
                  <p>
                    {returnData?.order?.delivery_address?.city}, {returnData?.order?.delivery_address?.state}
                  </p>
                  <p>{returnData?.order?.delivery_address?.zip}</p>
                  <p>{returnData?.order?.delivery_address?.country}</p>
                  <p className="mt-2">📞 {returnData?.order?.delivery_address?.phone}</p>
                  <p>✉️ {returnData?.order?.delivery_address?.email}</p>
                </div>
              </div>

              {returnData?.order?.shipping?.carrier && (
                <div>
                  <h3 className="font-medium mb-2">Shipping Details</h3>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>Carrier: {returnData?.order?.shipping?.carrier?.name}</p>
                    <p>Reference: {returnData?.order?.shipping?.carrier?.reference}</p>
                    <p>Tracking Number: {returnData?.order?.shipping?.tracking?.number}</p>
                    <p>Status: {returnData?.order?.shipping?.tracking?.status}</p>
                    <p>Shipping Fee: ₦{returnData?.order?.shipping?.fee?.amount?.toLocaleString()}</p>
                    {returnData?.order?.shipping?.tracking?.url && (
                      <a 
                        href={returnData?.order?.shipping?.tracking?.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Track Shipment
                      </a>
                    )}
                  </div>
                </div>
              )}

              
            </div>
          </Card>

        </div>
      </div>

      {returnData?.status === "APPROVED" && (
        <div className="mt-4">
          <Card className="p-6">
            <div className="flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Return Shipping</h3>
                {!returnData.returnShipment?.shipment_id && (
                  <Button 
                    onClick={handleCreateShippingLabel}
                    className="bg-primary hover:bg-primary/90"
                  >
                    Create Return Shipping Label
                  </Button>
                )}
              </div>

              {returnData.returnShipment?.shipment_id && (
                <div className="space-y-4">
                  <div className="p-4 bg-primary/5 rounded-lg">
                    <h3 className="font-medium mb-2">Return Shipping Details</h3>
                    <div className="space-y-1 text-sm">
                      {returnData.returnShipment.tracking?.number && (
                        <p>Tracking Number: {returnData.returnShipment.tracking.number}</p>
                      )}
                      {returnData.returnShipment.status && (
                        <p>Status: {returnData.returnShipment.status}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-4">
                    {returnData.returnShipment.documents?.shippingLabel && (
                      <Button 
                        variant="outline"
                        onClick={() => window.open(returnData.returnShipment.documents.shippingLabel, '_blank')}
                        className="flex-1"
                      >
                        <Printer className="w-4 h-4 mr-2" />
                        Print Shipping Label
                      </Button>
                    )}
                    
                    {!returnData.returnShipment.rate_id && (
                      <Button 
                        onClick={() => setShowRatesDialog(true)}
                        className="flex-1 bg-primary hover:bg-primary/90"
                      >
                        Select Shipping Rate
                      </Button>
                    )}

                    {returnData.returnShipment.rate_id && !returnData.returnShipment.status?.includes("PICKUP") && (
                      <Button 
                        onClick={() => setShowPickupDialog(true)}
                        className="flex-1 bg-primary hover:bg-primary/90"
                      >
                        Arrange Pickup Now
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Shipping Rates Dialog */}
          <Dialog open={showRatesDialog} onOpenChange={setShowRatesDialog}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Select Shipping Rate</DialogTitle>
                <DialogDescription>
                  Choose a shipping rate for your return shipment
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                {shippingRates?.map((rate) => (
                  <div 
                    key={rate.rate_id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedRate?.rate_id === rate.rate_id ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedRate(rate)}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      {rate.carrier_logo && (
                        <img 
                          src={rate.carrier_logo} 
                          alt={rate.carrier_name}
                          className="h-8 w-auto object-contain"
                        />
                      )}
                      <div>
                        <h3 className="font-semibold">{rate.carrier_name}</h3>
                        {rate.carrier_rate_description && (
                          <p className="text-sm text-muted-foreground">{rate.carrier_rate_description}</p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-green-600 font-medium">₦{rate.amount.toLocaleString()}</p>
                      <p className="text-sm">Delivery Time: {rate.delivery_time}</p>
                      {rate.includes_insurance && (
                        <Badge variant="secondary">Includes Insurance</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowRatesDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    handleSelectRate();
                    setShowRatesDialog(false);
                  }}
                  disabled={!selectedRate}
                  className="bg-primary hover:bg-primary/90"
                >
                  Select Rate & Continue
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Pickup Confirmation Dialog */}
          <Dialog open={showPickupDialog} onOpenChange={setShowPickupDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Arrange Pickup</DialogTitle>
                <DialogDescription>
                  Confirm pickup arrangement for your return shipment
                </DialogDescription>
              </DialogHeader>

              <div className="p-4 bg-primary/5 rounded-lg my-4">
                <h3 className="font-medium mb-2">Selected Shipping Details</h3>
                <div className="space-y-1 text-sm">
                  <p>Carrier: {returnData.returnShipment.carrier?.name}</p>
                  <p>Shipping Fee: ₦{returnData.returnShipment.fee?.amount?.toLocaleString()}</p>
                  {returnData.returnShipment.tracking?.number && (
                    <p>Tracking Number: {returnData.returnShipment.tracking.number}</p>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowPickupDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    handleArrangePickup();
                    setShowPickupDialog(false);
                  }}
                  className="bg-primary hover:bg-primary/90"
                >
                  Confirm Pickup
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Success Alert */}
          {showPickupSuccess && (
            <Alert className="mt-4">
              <AlertTitle>Pickup Arranged Successfully!</AlertTitle>
              <AlertDescription>
                The pickup has been arranged for your return shipment. The carrier will collect the package from the specified address.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

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

