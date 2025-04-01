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
  const [showRefundDialog, setShowRefundDialog] = useState(false)
  const [refundRequestAmount, setRefundRequestAmount] = useState('')
  const [refundRequestReason, setRefundRequestReason] = useState('')
  const [isRequestingRefund, setIsRequestingRefund] = useState(false)

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

  const handleRefundRequest = async () => {
    try {
      setIsRequestingRefund(true)
      const sellerToken = JSON.parse(localStorage.getItem("sellerToken")).data
      const response = await fetch(`${BASE_URL}/returns/${id}/seller/request-refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sellerToken}`
        },
        body: JSON.stringify({
          amount: parseFloat(refundRequestAmount),
          reason: refundRequestReason
        })
      })

      if (response.ok) {
        toast.success("Refund request sent to admin successfully")
        setShowRefundDialog(false)
        await fetchReturnDetails()
      } else {
        const error = await response.json()
        toast.error(error.message || "Failed to send refund request")
      }
    } catch (error) {
      console.error("Error requesting refund:", error)
      toast.error("Failed to send refund request")
    } finally {
      setIsRequestingRefund(false)
    }
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

  const renderRefundRequestDialog = () => (
    <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
      <DialogContent className="w-[95vw] max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle>Request Refund</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="refundAmount">Refund Amount</Label>
            <Input
              id="refundAmount"
              type="number"
              value={refundRequestAmount}
              onChange={(e) => setRefundRequestAmount(e.target.value)}
              placeholder="Enter refund amount"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="refundReason">Reason for Refund</Label>
            <Textarea
              id="refundReason"
              value={refundRequestReason}
              onChange={(e) => setRefundRequestReason(e.target.value)}
              placeholder="Explain why you're requesting this refund"
              required
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setShowRefundDialog(false)}
            disabled={isRequestingRefund}
          >
            Cancel
          </Button>
          <Button
            onClick={handleRefundRequest}
            disabled={isRequestingRefund || !refundRequestAmount || !refundRequestReason}
            className="bg-primary hover:bg-primary/90"
          >
            {isRequestingRefund ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Requesting...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Request Refund
              </>
            )}
          </Button>
        </DialogFooter>
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
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Fixed bottom action bar for mobile */}
      {returnData?.status === "PENDING_SELLER_REVIEW" && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50">
          {renderActionButtons()}
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto py-6 px-4 space-y-6">
        {/* Return Header Card */}
        <Card className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">Return #{id.slice(-6)}</h1>
                <Badge variant="outline" className={`px-3 py-1 ${statusConfig.color}`}>
                  {statusConfig.icon}
                  <span className="ml-2">{statusConfig.label}</span>
                </Badge>
              </div>
              <p className="text-muted-foreground">
                Requested on {new Date(returnData?.requestDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <div className="hidden lg:block">
              {returnData?.status === "PENDING_SELLER_REVIEW" && renderActionButtons()}
              
              {/* Button to create shipping label */}
              {returnData?.status === "APPROVED" && 
                (!returnData?.returnShipment?.shipment_id) && (
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
              )}
            </div>
          </div>
        </Card>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Product and Timeline */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Details */}
            <Card className="overflow-hidden">
              <div className="p-6 border-b flex justify-between items-center">
                <h2 className="text-xl font-semibold">Return Details</h2>
                <Button variant="outline" size="sm">
                  <Eye className="w-4 h-4 mr-2" />
                  View Order
                </Button>
              </div>
              <div className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="w-full md:w-32 h-32 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                    <img
                      src={returnData?.items[0]?.product?.images[0]?.url}
                      alt={returnData?.items[0]?.product?.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <h3 className="text-lg font-medium">{returnData?.items[0]?.product?.name}</h3>
                      <p className="text-muted-foreground">Order #{returnData?.order?.order_id}</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Return Reason:</span>
                        <p className="font-medium">{returnData?.items[0]?.reason}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Quantity:</span>
                        <p className="font-medium">{returnData?.items[0]?.quantity}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Unit Price:</span>
                        <p className="font-medium text-green-600">
                          ₦{returnData?.items[0]?.product?.price?.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Preferred Resolution:</span>
                        <p className="font-medium capitalize">{returnData?.preferredResolution}</p>
                      </div>
                    </div>
                  </div>
                </div>
                {returnData?.description && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Customer's Note:</span> {returnData.description}
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Return Evidence */}
            {returnData?.evidence?.length > 0 && (
              <Card>
                <div className="p-6 border-b">
                  <h2 className="text-xl font-semibold">Return Evidence</h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-4">
                    {returnData.evidence.map((file, index) => (
                      <a
                        key={file._id}
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100"
                      >
                        <img
                          src={file.url}
                          alt={`Evidence ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Eye className="w-6 h-6 text-white" />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* Return Shipment Details */}
            {returnData?.returnShipment && (
              <Card>
                <div className="p-6 border-b">
                  <h2 className="text-xl font-semibold">Return Shipment</h2>
                </div>
                <div className="p-6 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="text-muted-foreground text-sm">Carrier</span>
                      <p className="font-medium">{returnData?.returnShipment?.carrier?.name || 'Fez Delivery'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-sm">Status</span>
                      <div>
                        <Badge variant={
                          returnData.returnShipment.tracking?.status === "delivered" ? "success" : "default"
                        }>
                          {returnData.returnShipment.tracking?.status?.toUpperCase() || 'PENDING'}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-sm">Shipping Fee</span>
                      <p className="font-medium">
                        {returnData?.returnShipment?.fee?.currency || 'NGN'} {returnData?.returnShipment?.fee?.amount?.toLocaleString() || '0'}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-sm">Tracking Number</span>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{returnData?.returnShipment?.shipment_id || returnData?.returnShipment?.tracking?.number || 'N/A'}</p>
                        {returnData?.returnShipment?.tracking?.url && (
                          <a 
                            href={returnData.returnShipment.tracking.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline text-sm flex items-center"
                          >
                            <Eye className="w-3 h-3 mr-1" /> Track
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {returnData.returnShipment.tracking?.history?.length > 0 && (
                    <div className="mt-6 pt-4 border-t">
                      <h4 className="text-sm font-semibold mb-3">Tracking History</h4>
                      <div className="space-y-3">
                        {returnData.returnShipment.tracking.history.map((event, index) => (
                          <div key={index} className="bg-muted p-3 rounded-lg">
                            <div className="flex flex-wrap justify-between gap-2">
                              <span className="text-sm font-medium">
                                {event.status}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(event.timestamp).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-sm mt-1">{event.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Dispute Information */}
            {returnData?.dispute && returnData.dispute.status !== "none" && (
              <Card className="border border-orange-200">
                <div className="p-6 border-b border-orange-200">
                  <h2 className="text-xl font-semibold flex items-center">
                    <Scale className="mr-2 h-5 w-5 text-orange-500" />
                    Dispute Information
                  </h2>
                </div>
                <div className="p-6 space-y-5">
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
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
                              <Eye className="w-5 h-5 text-white" />
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
            )}
          </div>

          {/* Right Column - Customer, Shipping, etc. */}
          <div className="space-y-6">
            {/* Customer Details */}
            <Card>
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold">Customer Details</h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="font-medium">
                    {returnData?.order?.delivery_address?.first_name} {returnData?.order?.delivery_address?.last_name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {returnData?.order?.delivery_address?.email}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{returnData?.order?.delivery_address?.phone}</span>
                </div>
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium mb-2">Shipping Address</h4>
                  <p className="text-sm text-muted-foreground">
                    {returnData?.order?.delivery_address?.line1}<br />
                    {returnData?.order?.delivery_address?.line2 && `${returnData?.order?.delivery_address?.line2},`}<br />
                    {returnData?.order?.delivery_address?.city}, {returnData?.order?.delivery_address?.state}<br />
                    {returnData?.order?.delivery_address?.zip}<br />
                    {returnData?.order?.delivery_address?.country}
                  </p>
                </div>
              </div>
            </Card>

            {/* Rejection Details */}
            {returnData?.rejectionDetails && Object.keys(returnData.rejectionDetails).length > 0 && (
              <Card className="border-red-200">
                <div className="p-6 border-b border-red-200">
                  <h2 className="text-xl font-semibold text-red-700 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Rejection Details
                  </h2>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Reason</h3>
                    <p className="mt-1">{returnData.rejectionDetails.reason}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                    <p className="mt-1">{returnData.rejectionDetails.description}</p>
                  </div>
                  {returnData.rejectionDetails.evidence?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Evidence</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {returnData.rejectionDetails.evidence.map((file, index) => (
                          <a
                            key={file._id}
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative aspect-square rounded-lg overflow-hidden bg-gray-100"
                          >
                            <img
                              src={file.url}
                              alt={`Rejection Evidence ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="text-sm text-muted-foreground pt-4 border-t">
                    Rejected on {new Date(returnData.rejectionDetails.rejectedAt).toLocaleString()}
                  </div>
                </div>
              </Card>
            )}

            {/* Timeline */}
            <Card>
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold">Return Timeline</h2>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  {returnData?.timeline?.map((event, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full ring-4 ${
                          getStatusConfig(event.status).color.replace('bg-', 'ring-')
                        }`} />
                        {index !== returnData.timeline.length - 1 && (
                          <div className="w-0.5 h-full bg-gray-200 mt-3" />
                        )}
                      </div>
                      <div className="-mt-1.5 flex-1">
                        <p className="font-medium text-gray-900">
                          {getStatusConfig(event.status).label}
                        </p>
                        {event.note && (
                          <p className="text-sm text-gray-600 mt-1">{event.note}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          {new Date(event.date).toLocaleString()}
                          <span>•</span>
                          <span className="capitalize">by {event.updatedBy}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Quick Actions */}
            <Card>
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold">Quick Actions</h2>
              </div>
              <div className="p-6 space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Printer className="mr-2 h-4 w-4" />
                  Print Return Details
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Contact Customer
                </Button>
                {returnData?.status === "PENDING_SELLER_REVIEW" && 
                 returnData?.preferredResolution?.toUpperCase() === "REFUND" && (
                  <Button
                    className="w-full justify-start bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => setShowRefundDialog(true)}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Request Refund
                  </Button>
                )}
                {returnData?.status === "APPROVED" && 
                  (!returnData?.returnShipment?.shipment_id) && (
                  <Button 
                    className="w-full justify-start bg-black text-white hover:bg-black/80"
                    onClick={handleCreateShippingLabel}
                    disabled={isCreatingLabel}
                  >
                    {isCreatingLabel ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Return Shipment
                      </>
                    )}
                  </Button>
                )}
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
            Back to Returns
          </Button>
        </div>
      </div>

      {/* Render dialogs */}
      {renderShippingRatesDialog()}
      {renderRejectDialog()}
      {renderApprovalDialog()}
      {renderRefundRequestDialog()}
    </div>
  )
}
