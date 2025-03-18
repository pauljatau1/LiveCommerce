import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useParams, useNavigate } from "react-router-dom"
import { MessageCircle, Phone, Printer, Plus, ShoppingBag, ArrowLeft, Clock, HelpCircle, CheckCircle, XCircle, Truck, Package, RefreshCw, Lock, AlertTriangle, CheckSquare, Loader2, CalendarPlus, Upload, Eye, Scale } from "lucide-react"
import { useState, useEffect } from "react"
import { BASE_URL } from "@/Constants/Server"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
// import { toast } from "@/components/ui/use-toast"

const getStatusConfig = (status) => {
  const configs = {
    PENDING_SELLER_REVIEW: {
      color: 'bg-yellow-50 text-yellow-700 border-yellow-300',
      icon: <Clock className="w-4 h-4" />,
      label: 'Pending Review'
    },
    NEED_MORE_INFO: {
      color: 'bg-blue-50 text-blue-700 border-blue-300',
      icon: <HelpCircle className="w-4 h-4" />,
      label: 'Need More Information'
    },
    APPROVED: {
      color: 'bg-green-50 text-green-700 border-green-300',
      icon: <CheckCircle className="w-4 h-4" />,
      label: 'Approved'
    },
    REJECTED: {
      color: 'bg-red-50 text-red-700 border-red-300',
      icon: <XCircle className="w-4 h-4" />,
      label: 'Rejected'
    },
    IN_TRANSIT: {
      color: 'bg-purple-50 text-purple-700 border-purple-300',
      icon: <Truck className="w-4 h-4" />,
      label: 'In Transit'
    },
    RECEIVED: {
      color: 'bg-teal-50 text-teal-700 border-teal-300',
      icon: <Package className="w-4 h-4" />,
      label: 'Received'
    },
    REFUNDED: {
      color: 'bg-emerald-50 text-emerald-700 border-emerald-300',
      icon: <RefreshCw className="w-4 h-4" />,
      label: 'Refunded'
    },
    CLOSED: {
      color: 'bg-gray-50 text-gray-700 border-gray-300',
      icon: <Lock className="w-4 h-4" />,
      label: 'Closed'
    },
    DISPUTED: {
      color: 'bg-orange-50 text-orange-700 border-orange-300',
      icon: <AlertTriangle className="w-4 h-4" />,
      label: 'Disputed'
    },
    RESOLVED: {
      color: 'bg-indigo-50 text-indigo-700 border-indigo-300',
      icon: <CheckSquare className="w-4 h-4" />,
      label: 'Resolved'
    },
    RETURN_SHIPPING_ARRANGED: {
      color: 'bg-purple-50 text-purple-700 border-purple-300',
      icon: <Truck className="w-4 h-4" />,
      label: 'Return Shipping Arranged'
    }
  }
  return configs[status] || configs.PENDING_SELLER_REVIEW
}

export default function ReturnDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [returnData, setReturnData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [approvalDialog, setApprovalDialog] = useState(false)
  const [refundAmount, setRefundAmount] = useState('')
  const [approvalMessage, setApprovalMessage] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState(null)

  // New state variables
  const [shippingRates, setShippingRates] = useState(null)
  const [selectedRate, setSelectedRate] = useState(null)
  const [showRatesDialog, setShowRatesDialog] = useState(false)
  const [isCreatingLabel, setIsCreatingLabel] = useState(false)
  const [isLoadingRates, setIsLoadingRates] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [rejectDescription, setRejectDescription] = useState("")
  const [rejectEvidence, setRejectEvidence] = useState([])
  const [isRejecting, setIsRejecting] = useState(false)

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
    if (action === 'approve' && !approvalDialog) {
      setApprovalDialog(true)
      return
    }

    try {
      setIsProcessing(true)
      const sellerToken = JSON.parse(localStorage.getItem("sellerToken")).data
      const response = await fetch(`${BASE_URL}/returns/${id}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sellerToken}`
        },
        body: JSON.stringify({
          action: action,
          message: action === 'reject' ? 'Return request denied' : approvalMessage,
          partialRefundAmount: parseFloat(refundAmount) || 0
        })
      })

      if (response.ok) {
        toast.success(`Return request ${action === 'approve' ? 'approved' : 'rejected'} successfully`)
        setApprovalDialog(false)
        await fetchReturnDetails()
      } else {
        const error = await response.json()
        setError(error.message)
        toast.error(error.message || `Failed to ${action} return request`)
      }
    } catch (error) {
      setError(`Failed to process return ${action}`)
      console.error(`Error handling return ${action}:`, error)
      toast.error(`Failed to process return ${action}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCreateShippingLabel = async () => {
    try {
      setIsCreatingLabel(true)
      const sellerToken = JSON.parse(localStorage.getItem("sellerToken")).data
      const response = await fetch(`${BASE_URL}/returns/${id}/create-label`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sellerToken}`
        },
        body: JSON.stringify({
          pickup_address: returnData?.order?.pickup_address
        })
      })

      if (response.ok) {
        toast.success("Return shipping label created successfully")
        await fetchReturnDetails()
        // No need to fetch rates or show rates dialog since Fez handles everything in one step
      } else {
        const error = await response.json()
        setError(error.message)
        toast.error(error.message || "Failed to create shipping label")
      }
    } catch (error) {
      setError("Failed to create shipping label")
      console.error("Error creating shipping label:", error)
      toast.error("Failed to create shipping label")
    } finally {
      setIsCreatingLabel(false)
    }
  }

  const handleSelectRate = async (rate) => {
    setSelectedRate(rate)
  }

  const handleReject = async (e) => {
    e.preventDefault()
    
    try {
      setIsRejecting(true)
      const formData = new FormData()
      formData.append("reason", rejectReason)
      formData.append("description", rejectDescription)
      
      // Append each file to the formData
      rejectEvidence.forEach(file => {
        formData.append("evidence", file)
      })

      const sellerToken = JSON.parse(localStorage.getItem("sellerToken")).data
      const response = await fetch(`${BASE_URL}/returns/${id}/reject`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sellerToken}`,
        },
        body: formData
      })

      if (response.ok) {
        toast.success("Return request rejected successfully")
        setShowRejectDialog(false)
        await fetchReturnDetails()
      } else {
        const error = await response.json()
        toast.error(error.message || "Failed to reject return request")
      }
    } catch (error) {
      console.error("Error rejecting return:", error)
      toast.error("Failed to reject return request")
    } finally {
      setIsRejecting(false)
    }
  }

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files)
    if (files.length > 5) {
      toast.error("Maximum 5 files allowed")
      return
    }
    setRejectEvidence(files)
  }

  const renderShippingRatesDialog = () => (
    <Dialog open={showRatesDialog} onOpenChange={setShowRatesDialog}>
      <DialogContent className="w-[95vw] max-w-3xl mx-auto">
        <DialogHeader>
          <DialogTitle>Return Shipping Created</DialogTitle>
        </DialogHeader>

        <div className="p-4 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Return Shipping Created Successfully</h3>
          <p className="text-muted-foreground mb-4">
            The return shipping has been created with Fez Delivery. The customer will be notified to prepare the package for pickup.
          </p>
          
          {returnData?.returnShipment?.tracking?.number && (
            <div className="bg-muted p-4 rounded-lg mb-4">
              <p className="font-medium">Tracking Number:</p>
              <p className="text-primary">{returnData.returnShipment.tracking.number}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={() => setShowRatesDialog(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  const statusConfig = getStatusConfig(returnData?.status)

  const renderApprovalDialog = () => (
    <Dialog open={approvalDialog} onOpenChange={setApprovalDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Approve Return Request</DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Refund Amount</label>
            <Input
              type="number"
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              placeholder="Enter refund amount"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Approval Message</label>
            <Input
              value={approvalMessage}
              onChange={(e) => setApprovalMessage(e.target.value)}
              placeholder="Enter approval message"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setApprovalDialog(false)}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            onClick={() => handleReturnAction('approve')}
            disabled={isProcessing}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve Return
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  const renderRejectDialog = () => (
    <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
      <DialogContent className="w-[95vw] max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle>Reject Return Request</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleReject} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Rejection</Label>
            <Input
              id="reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter reason for rejection"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Detailed Description</Label>
            <Textarea
              id="description"
              value={rejectDescription}
              onChange={(e) => setRejectDescription(e.target.value)}
              placeholder="Provide detailed explanation"
              required
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="evidence">Evidence (Max 5 files)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="evidence"
                type="file"
                onChange={handleFileChange}
                multiple
                accept="image/*"
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById("evidence").click()}
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Files
              </Button>
            </div>
            {rejectEvidence.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {rejectEvidence.length} file(s) selected
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowRejectDialog(false)}
              disabled={isRejecting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isRejecting || !rejectReason || !rejectDescription || !rejectEvidence.length}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isRejecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Reject Return
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )

  const renderActionButtons = () => (
    <div className="flex flex-col md:flex-row gap-2 md:gap-4 w-full">
      <Button
        variant="destructive"
        onClick={() => setShowRejectDialog(true)}
        disabled={returnData?.status !== "PENDING_SELLER_REVIEW"}
        className="w-full md:w-auto"
      >
        <AlertTriangle className="mr-2 h-4 w-4" />
        Decline/Escalate
      </Button>
      <Button
        className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white"
        onClick={() => setApprovalDialog(true)}
        disabled={returnData?.status !== "PENDING_SELLER_REVIEW" || isProcessing}
      >
        <CheckCircle className="mr-2 h-4 w-4" />
        Accept Request
      </Button>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading return details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="pt-6 md:pt-10 px-4 md:px-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 bg-white p-4 md:p-6 rounded-lg -sm">
        <div className="space-y-4 w-full md:w-auto">
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Return ID: #{id.slice(-6)}</h1>
            <Badge variant="outline" className={`px-2 md:px-4 py-1 md:py-1.5 text-sm font-medium flex items-center gap-2 ${statusConfig.color}`}>
              {statusConfig.icon}
              {statusConfig.label}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 text-gray-600">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">Return Reason:</span>
                <span>{returnData?.items[0]?.reason}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Order ID:</span>
                <span className="text-blue-600 hover:underline cursor-pointer">
                  #{returnData?.order?.order_id}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Preferred Resolution:</span>
                <Badge variant="secondary" className="capitalize">
                  {returnData?.preferredResolution}
                </Badge>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">Request Date:</span>
                <span>{new Date(returnData?.requestDate).toLocaleDateString()}</span>
              </div>
              {returnData?.refundDetails?.amount && (
                <div className="flex items-center gap-2">
                  <span className="font-medium">Refund Amount:</span>
                  <span className="text-green-600 font-medium">
                    ₦{returnData.refundDetails.amount.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
          <Button variant="outline" size="sm" className="w-full md:w-auto">
            <Printer className="w-4 h-4 mr-2" />
            Print Details
          </Button>
          {returnData?.returnShippingLabel?.url && (
            <Button variant="outline" size="sm" className="w-full md:w-auto">
              Download Label
            </Button>
          )}
          <Button variant="outline" size="sm" className="w-full md:w-auto">
            <MessageCircle className="w-4 h-4 mr-2" />
            Contact Buyer
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="md:col-span-2 space-y-4 md:space-y-6">
          {/* Product Section */}
          <Card className="p-4 md:p-6 -md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Product Details</h2>
              {returnData?.status === "APPROVED" && (
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  Return Approved
                </Badge>
              )}
            </div>
            <div className="flex flex-col md:flex-row gap-4 md:gap-6">
              <div className="w-full md:w-32 h-32 rounded-lg overflow-hidden border border-gray-200">
                <img
                  src={returnData?.items[0]?.product?.images[0]?.url}
                  alt={returnData?.items[0]?.product?.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {returnData?.items[0]?.product?.name}
                </h3>
                <div className="sm:grid sm:grid-cols-2 gap-4 text-sm text-gray-600">
                  <p>Quantity: {returnData?.items[0]?.quantity}</p>
                  <p>Status: <span className="text-yellow-600 font-medium">{returnData?.status}</span></p>
                  <p className="text-green-700 font-medium">
                    Unit Price: ₦{returnData?.items[0]?.product?.price?.toLocaleString()}
                  </p>
                  <p className="text-green-700 font-medium">
                    Total: ₦{((returnData?.items[0]?.product?.price || 0) * (returnData?.items[0]?.quantity || 1)).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 md:mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Buyer's Comment:</span> {returnData?.description}
              </p>
            </div>
            <div className="mt-4 flex flex-col md:flex-row gap-2 md:gap-4">
              {renderActionButtons()}
            </div>
          </Card>

          {/* Return Timeline */}
          <Card className="p-6 -md">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Return Timeline</h2>
            <div className="space-y-6">
              {returnData?.timeline?.map((activity, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full ring-4 ${
                      getStatusConfig(activity.status).color.replace('bg-', 'bg-').replace('text-', 'ring-')
                    }`} />
                    {index !== (returnData?.timeline?.length - 1) && (
                      <div className="w-0.5 h-full bg-gray-200" />
                    )}
                  </div>
                  <div className="flex-1 -mt-1">
                    <div className="font-medium text-gray-900 mb-1">
                      {getStatusConfig(activity.status).label}
                    </div>
                    <div className="text-sm text-gray-600">{activity.note}</div>
                    <div className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      {new Date(activity.date).toLocaleString()}
                      <span className="capitalize text-gray-500">
                        • by {activity.updatedBy}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Dispute Section - Show only if disputed */}
          {returnData?.dispute?.status !== 'PENDING' && (
            <Card className="p-6 -md border-orange-200">
              <div className="flex items-center gap-3 mb-6">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                <h2 className="text-xl font-bold text-gray-900">Dispute Information</h2>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium">Status:</span>
                    <Badge variant="outline" className={
                      returnData.dispute.status === 'RESOLVED'
                        ? 'bg-green-50 text-green-700'
                        : 'bg-orange-50 text-orange-700'
                    }>
                      {returnData.dispute.status}
                    </Badge>
                  </div>
                  {returnData.dispute.resolution && (
                    <div>
                      <span className="font-medium">Resolution:</span>
                      <Badge variant="outline">{returnData.dispute.resolution}</Badge>
                    </div>
                  )}
                </div>
                {/* Add more dispute details as needed */}
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-4 md:space-y-6">
          {/* Customer Details */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Customer Details</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div>
                  <p className="font-medium">
                    {`${returnData?.order?.pickup_address?.first_name} ${returnData?.order?.pickup_address?.last_name}`}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ShoppingBag className="w-4 h-4" />
                    <span>{returnData?.order?.pickup_address?.email}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4" />
                <span>{returnData?.order?.pickup_address?.phone}</span>
              </div>
            </div>
          </Card>

          {/* Shipping Information */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Shipping Information</h2>
            <div className="space-y-2">
              <p className="font-medium">Return Address:</p>
              <p className="text-sm text-muted-foreground">
                {returnData?.order?.pickup_address?.line1},<br/>
                {returnData?.order?.pickup_address?.line2 && `${returnData?.order?.pickup_address?.line2},`}<br/>
                {returnData?.order?.pickup_address?.city}, {returnData?.order?.pickup_address?.state}.<br/>
                {returnData?.order?.pickup_address?.zip},<br/>
                {returnData?.order?.pickup_address?.country}
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

          {/* Shipping Status - if return is approved */}
          {returnData?.returnShipment?.status !== 'PENDING' && (
            <Card className="p-6 -md">
              <h2 className="text-xl font-semibold mb-4">Return Shipping Status</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Status:</span>
                  <Badge variant={
                    returnData.returnShipment.status === 'DELIVERED'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-blue-50 text-blue-700'
                  }>
                    {returnData.returnShipment.status}
                  </Badge>
                </div>
                {returnData.returnShipment.tracking?.number && (
                  <div>
                    <span className="font-medium">Tracking Number:</span>
                    <p className="text-blue-600 hover:underline cursor-pointer">
                      {returnData.returnShipment.tracking.number}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Button to create shipping label */}
      {returnData?.status === "APPROVED" && 
        (!returnData?.returnShipment?.shipment_id) && (
        <div className="mt-4">
          <Button
            className="bg-black text-white"
            onClick={handleCreateShippingLabel}
            disabled={isCreatingLabel}
          >
            {isCreatingLabel ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Return Shipment...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Create Return Shipment
              </>
            )}
          </Button>
        </div>
      )}

      {/* Update Shipment Status Information */}
      {returnData?.returnShipment && (
        <div className="mt-6 space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Return Shipment Details</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Carrier:</span>
                <span className="font-medium">{returnData?.returnShipment?.carrier?.name || 'Fez Delivery'}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant={
                  returnData.returnShipment.tracking?.status === "delivered" ? "success" :
                  "default"
                }>
                  {returnData.returnShipment.tracking?.status?.toUpperCase() || 'PENDING'}
                </Badge>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Shipping Fee:</span>
                <span className="font-medium">
                  {returnData?.returnShipment?.fee?.currency || 'NGN'} {returnData?.returnShipment?.fee?.amount?.toLocaleString() || '0'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Tracking Number:</span>
                <span className="font-medium">{returnData?.returnShipment?.shipment_id || returnData?.returnShipment?.tracking?.number || 'N/A'}</span>
              </div>

              {returnData?.returnShipment?.tracking?.url && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Track Package:</span>
                  <a 
                    href={returnData.returnShipment.tracking.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center"
                  >
                    <Eye className="w-4 h-4 mr-1" /> Track
                  </a>
                </div>
              )}

              {returnData.returnShipment.tracking?.history?.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-semibold mb-2">Tracking History</h4>
                  <div className="space-y-2">
                    {returnData.returnShipment.tracking.history.map((event, index) => (
                      <div key={index} className="text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            {new Date(event.timestamp).toLocaleString()}
                          </span>
                          <Badge variant="outline">{event.status}</Badge>
                        </div>
                        <p className="text-sm mt-1">{event.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Add Rejection Details Section */}
      {returnData?.rejectionDetails && (
        <div className="mt-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center text-red-600">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Return Request Rejected
            </h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Reason for Rejection</h4>
                <p className="mt-1">{returnData.rejectionDetails.reason}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Detailed Description</h4>
                <p className="mt-1">{returnData.rejectionDetails.description}</p>
              </div>

              {returnData.rejectionDetails.evidence?.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Evidence</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {returnData.rejectionDetails.evidence.map((evidence, index) => (
                      <a 
                        key={evidence._id} 
                        href={evidence.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block group relative aspect-square rounded-lg overflow-hidden border bg-muted hover:bg-muted/80 transition-colors"
                      >
                        <img 
                          src={evidence.url} 
                          alt={`Rejection evidence ${index + 1}`}
                          className="object-cover w-full h-full"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Eye className="w-6 h-6 text-white" />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-sm text-muted-foreground">
                Rejected on {new Date(returnData.rejectionDetails.rejectedAt).toLocaleString()}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Add Dispute Section */}
      {returnData?.dispute && returnData.dispute.status !== "none" && (
        <div className="mt-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Scale className="mr-2 h-5 w-5" />
              Dispute Information
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={
                  returnData.dispute.status === "PENDING" ? "warning" :
                  returnData.dispute.status === "RESOLVED" ? "success" :
                  "default"
                }>
                  {returnData.dispute.status}
                </Badge>
              </div>

              {returnData.dispute.resolutionDetails?.evidence?.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Resolution Evidence</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {returnData.dispute.resolutionDetails.evidence.map((evidence, index) => (
                      <a 
                        key={index}
                        href={evidence.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block group relative aspect-square rounded-lg overflow-hidden border bg-muted hover:bg-muted/80 transition-colors"
                      >
                        <img 
                          src={evidence.url} 
                          alt={`Resolution evidence ${index + 1}`}
                          className="object-cover w-full h-full"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Eye className="w-6 h-6 text-white" />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {returnData.dispute.adminNotes?.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Admin Notes</h4>
                  <div className="space-y-2">
                    {returnData.dispute.adminNotes.map((note, index) => (
                      <div key={index} className="p-3 bg-muted rounded-lg">
                        <p className="text-sm">{note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
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

      {/* Render the rates dialog */}
      {renderShippingRatesDialog()}
      {renderRejectDialog()}
    </div>
  )
}
