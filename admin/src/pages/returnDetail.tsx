import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '@/api/axios'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  Package,
  Truck,
  XCircle,
  FileText,
  MapPin,
  User,
  Store,
  Image as ImageIcon,
  ShoppingCart,
  Calendar,
  DollarSign,
  Printer,
  ExternalLink,
  Gavel
} from 'lucide-react'
import { format } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

// Define interfaces based on the MongoDB schema
interface ReturnDetail {
  _id: string
  order: {
    order_id: string
    createdAt: string
    shipping: {
      carrier: {
        name: string
        reference: string
      }
      tracking: {
        number: string
        url: string
        status: string
        history: {
          status: string
          timestamp: string
          location: string
          description: string
        }[]
      }
      documents: {
        shippingLabel: string
        commercialInvoice: string
      }
    }
    items: OrderItem[]
    totalAmount: number
    paymentInfo: {
      method: string
      status: string
      paidAt: string
    }
    pickup_address: Address
    delivery_address: Address
  }
  buyer: {
    firstName: string
    lastName: string
    email: string
  }
  seller: {
    firstName: string
    lastName: string
    businessName?: string
    email: string
  }
  items: {
    product: {
      name: string
      price: number
      images: {
        url: string
        _id: string
      }[]
    }
    quantity: number
    reason: string
    specifications?: {
      color?: string
      size?: string
      material?: string
    }
  }[]
  status: string
  description: string
  evidence: {
    type: string
    url: string
  }[]
  preferredResolution: string
  requestDate: string
  timeline: {
    status: string
    date: string
    note: string
    updatedBy: string
  }[]
  refundDetails?: {
    amount: number
    processedAt: string
    method: string
  }
  adminNotes: {
    note: string
    date: string
  }[]
  sellerResponse?: {
    status: string
    message: string
    date: string
    partialRefundAmount: number
  }
  returnShippingLabel?: {
    url: string
    carrier: string
    trackingNumber: string
    generatedAt: string
  }
  rejectionDetails?: {
    reason: string
    description: string
    evidence: {
      type: string
      url: string
      public_id: string
      uploadedAt: string
    }[]
    rejectedAt: string
    rejectedBy: string
  }
  dispute?: {
    status: string
    resolution?: string
    resolutionDetails?: {
      decidedBy: string
      decidedAt: string
      action: string
      refundAmount: number
      note: string
      evidence: any[]
    }
    adminNotes: {
      note: string
      addedBy: string
      addedAt: string
    }[]
  }
  returnShipment?: {
    status: string
    shipment_id: string
    rate_id: string
    tracking: {
      status: string
      lastUpdate: string
      history: {
        status: string
        timestamp: string
        location: string
        description: string
      }[]
    }
    carrier: {
      name: string
    }
    fee: {
      amount: number
      currency: string
    }
    pickup_address: Address
    delivery_address: Address
  }
}

interface Address {
  first_name: string
  last_name: string
  email: string
  phone: string
  line1: string
  line2?: string
  city: string
  state: string
  country: string
  zip: string
}

interface OrderItem {
  product: {
    name: string
    price: number
    images: {
      url: string
      _id: string
    }[]
  }
  quantity: number
  specifications?: {
    color?: string
    size?: string
    material?: string
  }
}

// Add these helper functions before the ReturnDetail component
const getStatusStyle = (status: string) => {
  switch (status) {
    case 'PENDING_SELLER_REVIEW':
      return 'bg-yellow-50 text-yellow-700'
    case 'NEED_MORE_INFO':
      return 'bg-blue-50 text-blue-700'
    case 'APPROVED':
      return 'bg-green-50 text-green-700'
    case 'REJECTED':
      return 'bg-red-50 text-red-700'
    case 'IN_TRANSIT':
      return 'bg-purple-50 text-purple-700'
    case 'RECEIVED':
      return 'bg-indigo-50 text-indigo-700'
    case 'REFUNDED':
      return 'bg-emerald-50 text-emerald-700'
    case 'CLOSED':
      return 'bg-gray-50 text-gray-700'
    case 'DISPUTED':
      return 'bg-orange-50 text-orange-700'
    case 'RESOLVED':
      return 'bg-teal-50 text-teal-700'
    case 'RETURN_LABEL_CREATED':
      return 'bg-cyan-50 text-cyan-700'
    case 'RETURN_SHIPPING_ARRANGED':
      return 'bg-violet-50 text-violet-700'
    default:
      return 'bg-gray-50 text-gray-700'
  }
}

const getStatusDot = (status: string) => {
  switch (status) {
    case 'PENDING_SELLER_REVIEW':
      return 'bg-yellow-500'
    case 'NEED_MORE_INFO':
      return 'bg-blue-500'
    case 'APPROVED':
      return 'bg-green-500'
    case 'REJECTED':
      return 'bg-red-500'
    case 'IN_TRANSIT':
      return 'bg-purple-500'
    case 'RECEIVED':
      return 'bg-indigo-500'
    case 'REFUNDED':
      return 'bg-emerald-500'
    case 'CLOSED':
      return 'bg-gray-500'
    case 'DISPUTED':
      return 'bg-orange-500'
    case 'RESOLVED':
      return 'bg-teal-500'
    case 'RETURN_LABEL_CREATED':
      return 'bg-cyan-500'
    case 'RETURN_SHIPPING_ARRANGED':
      return 'bg-violet-500'
    default:
      return 'bg-gray-500'
  }
}

// Add dispute resolution schema
const disputeResolutionSchema = z.object({
  resolution: z.enum(['BUYER_FAVORED', 'SELLER_FAVORED', 'COMPROMISE']),
  action: z.enum(['FULL_REFUND', 'PARTIAL_REFUND', 'NO_REFUND', 'REPLACEMENT_APPROVED', 'RETURN_APPROVED']),
  refundAmount: z.number().min(0).optional(),
  note: z.string().min(1, "Note is required"),
})

type DisputeResolutionForm = z.infer<typeof disputeResolutionSchema>

// Add this component for the dispute resolution form
const DisputeResolutionDialog = ({ returnId, onResolved }: { returnId: string, onResolved: () => void }) => {
  const [open, setOpen] = useState(false)
  const form = useForm<DisputeResolutionForm>({
    resolver: zodResolver(disputeResolutionSchema),
    defaultValues: {
      resolution: 'BUYER_FAVORED',
      action: 'FULL_REFUND',
      refundAmount: 0,
      note: '',
    },
  })

  const onSubmit = async (data: DisputeResolutionForm) => {
    try {
      await api.post(`/returns/${returnId}/admin/resolve-dispute`, data)
      setOpen(false) // Close dialog on success
      onResolved()
      form.reset() // Reset form
    } catch (error) {
      console.error('Failed to resolve dispute:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="ml-4">
          <Gavel className="h-4 w-4 mr-2" />
          Resolve Dispute
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Resolve Return Dispute</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="resolution"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resolution</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select resolution" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BUYER_FAVORED">Buyer Favored</SelectItem>
                      <SelectItem value="SELLER_FAVORED">Seller Favored</SelectItem>
                      <SelectItem value="COMPROMISE">Compromise</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="action"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Action</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select action" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FULL_REFUND">Full Refund</SelectItem>
                      <SelectItem value="PARTIAL_REFUND">Partial Refund</SelectItem>
                      <SelectItem value="NO_REFUND">No Refund</SelectItem>
                      <SelectItem value="REPLACEMENT_APPROVED">Replacement Approved</SelectItem>
                      <SelectItem value="RETURN_APPROVED">Return Approved</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch('action') === 'PARTIAL_REFUND' && (
              <FormField
                control={form.control}
                name="refundAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Refund Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={e => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full">
              Submit Resolution
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

function ReturnDetail() {
  const { id } = useParams()
  const [returnData, setReturnData] = useState<ReturnDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [adminNote, setAdminNote] = useState('')
  const [newStatus, setNewStatus] = useState('')

  useEffect(() => {
    const fetchReturnDetail = async () => {
      try {
        const response = await api.get(`/api/returns/${id}`)
        setReturnData(response.data)
      } catch (error) {
        console.error('Error fetching return details:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchReturnDetail()
  }, [id])

  const handleAddNote = async () => {
    try {
      await api.post(`/api/returns/${id}/admin/add-note`, { note: adminNote })
      // Refresh data
      const response = await api.get(`/api/returns/${id}`)
      setReturnData(response.data)
      setAdminNote('')
    } catch (error) {
      console.error('Error adding note:', error)
    }
  }

  const handleUpdateStatus = async () => {
    try {
      await api.put(`/api/returns/${id}/admin/update-status`, {
        status: newStatus,
        note: `Status updated to ${newStatus} by admin`
      })
      // Refresh data
      const response = await api.get(`/api/returns/${id}`)
      setReturnData(response.data)
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'REFUNDED':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'REJECTED':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'PENDING_SELLER_REVIEW':
        return <Clock className="h-5 w-5 text-yellow-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-blue-500" />
    }
  }

  const renderShippingDetails = (returnData: ReturnDetail) => {
    // Early return if no return shipment data exists
    if (!returnData.returnShipment) {
      return (
        <div className="text-sm text-muted-foreground">
          No shipping details available
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {/* Carrier Info */}
        {returnData.returnShipment.carrier?.name && (
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            <span>Carrier: {returnData.returnShipment.carrier.name}</span>
          </div>
        )}

        {/* Tracking Info */}
        {returnData.returnShipment.tracking && (
          <>
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span>Status: {returnData.returnShipment.tracking.status}</span>
            </div>

            {/* Tracking History */}
            {returnData.returnShipment.tracking.history && 
             returnData.returnShipment.tracking.history.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Tracking History</h4>
                <div className="space-y-3">
                  {returnData.returnShipment.tracking.history.map((event, index) => (
                    <div key={index} className="text-sm">
                      <div className="font-medium">{event.status}</div>
                      <div className="text-muted-foreground">
                        {format(new Date(event.timestamp), 'MMM d, yyyy HH:mm')}
                      </div>
                      {event.location && (
                        <div className="text-muted-foreground">{event.location}</div>
                      )}
                      {event.description && (
                        <div className="text-muted-foreground">{event.description}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Shipping Fee - Add null checks */}
        {returnData.returnShipment.fee?.amount !== undefined && (
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            <span>
              Shipping Fee: {returnData.returnShipment.fee.currency || ''} {' '}
              {returnData.returnShipment.fee.amount.toLocaleString()}
            </span>
          </div>
        )}

        {/* Shipment IDs */}
        {returnData.returnShipment.shipment_id && (
          <div className="text-sm text-muted-foreground">
            Shipment ID: {returnData.returnShipment.shipment_id}
          </div>
        )}
        {returnData.returnShipment.rate_id && (
          <div className="text-sm text-muted-foreground">
            Rate ID: {returnData.returnShipment.rate_id}
          </div>
        )}
      </div>
    )
  }

  const renderShippingLabel = (returnData: ReturnDetail) => {
    if (!returnData.returnShippingLabel) {
      return null
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>Shipping Label</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(returnData.returnShippingLabel?.url, '_blank')}
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
        {returnData.returnShippingLabel.carrier && (
          <div className="text-sm text-muted-foreground">
            Carrier: {returnData.returnShippingLabel.carrier}
          </div>
        )}
        {returnData.returnShippingLabel.trackingNumber && (
          <div className="text-sm text-muted-foreground">
            Tracking Number: {returnData.returnShippingLabel.trackingNumber}
          </div>
        )}
        {returnData.returnShippingLabel.generatedAt && (
          <div className="text-sm text-muted-foreground">
            Generated: {format(new Date(returnData.returnShippingLabel.generatedAt), 'MMM d, yyyy HH:mm')}
          </div>
        )}
      </div>
    )
  }

  const renderAddress = (address: Address, title: string) => (
    <div>
      <h4 className="font-medium mb-2">{title}</h4>
      <div className="text-sm space-y-1">
        <p>{address.first_name} {address.last_name}</p>
        <p>{address.line1}</p>
        {address.line2 && <p>{address.line2}</p>}
        <p>{address.city}, {address.state} {address.zip}</p>
        <p>{address.country}</p>
        <p className="text-muted-foreground">{address.phone}</p>
        <p className="text-muted-foreground">{address.email}</p>
      </div>
    </div>
  )

  const refreshData = () => {
    // Refresh the return data after dispute resolution
    fetchReturnData()
  }

  if (loading || !returnData) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-3xl font-bold text-white">Return Request</h2>
            <div className={`px-2 py-1 rounded-full text-sm ${getStatusStyle(returnData.status)}`}>
              {returnData.status.replace(/_/g, ' ')}
            </div>
          </div>
          <p className="text-muted-foreground">Return ID: {returnData._id}</p>
          <p className="text-muted-foreground">Order ID: {returnData.order.order_id}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          {returnData.returnShippingLabel && (
            <Button variant="outline" asChild>
              <a 
                href={returnData.returnShippingLabel.url} 
                target="_blank" 
                rel="noopener"
              >
                <Printer className="h-4 w-4 mr-2" />
                Return Label
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Quick Info Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-lg">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Customer</p>
              <p className="font-medium">
                {returnData.buyer.firstName} {returnData.buyer.lastName}
              </p>
              <p className="text-sm text-muted-foreground">{returnData.buyer.email}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-lg">
              <Store className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Seller</p>
              <p className="font-medium">
                {returnData.seller.businessName || `${returnData.seller.firstName} ${returnData.seller.lastName}`}
              </p>
              <p className="text-sm text-muted-foreground">{returnData.seller.email}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-lg">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Request Date</p>
              <p className="font-medium">
                {format(new Date(returnData.requestDate), 'MMM d, yyyy')}
              </p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(returnData.requestDate), 'HH:mm')}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column - Return Details */}
        <div className="space-y-6 md:col-span-2">
          {/* Return Items */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Return Items</h3>
            <div className="space-y-4">
              {returnData.items.map((item, index) => (
                <div key={index} className="flex gap-4 border-b pb-4">
                  {item.product.images?.[0] && (
                    <img 
                      src={item.product.images[0].url} 
                      alt={item.product.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <h4 className="font-medium">{item.product.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      Quantity: {item.quantity} • Reason: {item.reason}
                    </p>
                    <p className="text-sm">
                      Price: ₦{item.product.price.toLocaleString()}
                    </p>
                    {item.specifications && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {Object.entries(item.specifications).map(([key, value]) => (
                          <span key={key} className="mr-2">
                            {key}: {value}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Evidence */}
          {returnData.evidence && returnData.evidence.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Return Evidence</h3>
              <div className="grid grid-cols-3 gap-4">
                {returnData.evidence.map((evidence, index) => (
                  <a 
                    key={index}
                    href={evidence.url}
                    target="_blank"
                    rel="noopener"
                    className="block"
                  >
                    {evidence.type === 'image' ? (
                      <img 
                        src={evidence.url} 
                        alt={`Evidence ${index + 1}`}
                        className="w-full h-40 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-40 bg-primary/10 rounded-lg flex items-center justify-center">
                        <FileText className="h-8 w-8 text-primary" />
                      </div>
                    )}
                  </a>
                ))}
              </div>
            </Card>
          )}

          {/* Shipping Details */}
          {(returnData.returnShipment || returnData.returnShippingLabel) && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Shipping Details</h3>
              {renderShippingDetails(returnData)}
              {renderShippingLabel(returnData)}
            </Card>
          )}

          {/* Timeline */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Return Timeline</h3>
            <div className="space-y-4">
              {returnData.timeline.map((event, index) => (
                <div key={index} className="flex gap-4">
                  <div className="w-32 text-sm text-muted-foreground">
                    {format(new Date(event.date), 'MMM d, HH:mm')}
                  </div>
                  <div>
                    <p className="font-medium">{event.status.replace(/_/g, ' ')}</p>
                    {event.note && (
                      <p className="text-sm text-muted-foreground">{event.note}</p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Updated by: {event.updatedBy}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column - Actions and Additional Info */}
        <div className="space-y-6">
          {/* Status Actions */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Actions</h3>
            <div className="space-y-4">
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Update Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="APPROVED">Approve Return</SelectItem>
                  <SelectItem value="REJECTED">Reject Return</SelectItem>
                  <SelectItem value="REFUNDED">Mark as Refunded</SelectItem>
                  <SelectItem value="NEED_MORE_INFO">Need More Info</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                className="w-full"
                onClick={handleUpdateStatus}
                disabled={!newStatus}
              >
                Update Status
              </Button>
            </div>
          </Card>

          {/* Admin Notes */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Admin Notes</h3>
            <div className="space-y-4">
              <Textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Add a note..."
                className="mb-2"
              />
              <Button 
                onClick={handleAddNote} 
                disabled={!adminNote}
                className="w-full"
              >
                Add Note
              </Button>
              
              <div className="mt-4 space-y-4">
                {returnData.adminNotes.map((note, index) => (
                  <div key={index} className="border-b pb-4">
                    <p className="text-sm">{note.note}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(note.date), 'MMM d, yyyy HH:mm')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Addresses */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Addresses</h3>
            <div className="space-y-6">
              {renderAddress(returnData.order.pickup_address, 'Pickup Address')}
              {renderAddress(returnData.order.delivery_address, 'Delivery Address')}
            </div>
          </Card>

          {/* Rejection Details */}
          {returnData.rejectionDetails && Object.keys(returnData.rejectionDetails).length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Rejection Details</h3>
              <div className="space-y-4">
                <p className="font-medium">Reason: {returnData.rejectionDetails.reason}</p>
                <p className="text-sm">{returnData.rejectionDetails.description}</p>
                {returnData.rejectionDetails.evidence && (
                  <div className="grid grid-cols-2 gap-2">
                    {returnData.rejectionDetails.evidence.map((evidence, index) => (
                      <a 
                        key={index}
                        href={evidence.url}
                        target="_blank"
                        rel="noopener"
                        className="block"
                      >
                        <img 
                          src={evidence.url} 
                          alt={`Rejection Evidence ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Add this where you want the dispute resolution button to appear */}
      <div className="mt-4">
        {returnData.status === 'REJECTED' && 
         (!returnData.dispute || returnData.dispute.status === 'PENDING') && (
          <DisputeResolutionDialog
            returnId={returnData._id}
            onResolved={refreshData}
          />
        )}
      </div>
    </div>
  )
}

export default ReturnDetail
