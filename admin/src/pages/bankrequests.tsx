import { 
    RefreshCcw,
    Building2,
    ArrowUpRight,
    Eye,
    Check,
    X,
    Loader2
  } from "lucide-react"
  import { Card } from "@/components/ui/card"
  import { Button } from "@/components/ui/button"
  import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table"
  import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
  } from "@/components/ui/dialog"
  import { Input } from "@/components/ui/input"
  import { Label } from "@/components/ui/label"
  import { useEffect, useState } from "react"
  import { api } from "@/api/axios"
  import { toast } from "sonner"
  
  // Define interfaces for the API data
  interface BankRequest {
    _id: string
    seller: {
      businessName?: string
      firstName: string
      lastName: string
      email: string
    }
    currentBankDetails: {
      bankName: string
      accountNumber: string
      accountName: string
    }
    newBankDetails: {
      bankName: string
      accountNumber: string
      accountName: string
    }
    proofDocument: {
      url: string
    }
    status: "pending" | "approved" | "rejected"
    requestDate: string
    rejectionReason?: string
  }
  
  interface BankRequestStats {
    total: number
    pending: number
    approved: number
    rejected: number
  }
  
  function BankRequests() {
    const [requests, setRequests] = useState<BankRequest[]>([])
    const [stats, setStats] = useState<BankRequestStats>({
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0
    })
    const [isLoading, setIsLoading] = useState(true)
    const [processingId, setProcessingId] = useState<string | null>(null)
    const [selectedRequest, setSelectedRequest] = useState<BankRequest | null>(null)
    const [rejectionReason, setRejectionReason] = useState("")
    const [showRejectDialog, setShowRejectDialog] = useState(false)
  
    // Fetch bank requests and stats
    const fetchData = async () => {
      try {
        const [requestsRes, statsRes] = await Promise.all([
          api.get("/api/admin/bank-requests"),
          api.get("/api/admin/bank-requests/stats")
        ])
        setRequests(requestsRes.data)
        setStats(statsRes.data.data) // Access the data property from the response
      } catch (error) {
        console.error("Error fetching bank requests:", error)
        toast.error("Failed to fetch bank requests")
      } finally {
        setIsLoading(false)
      }
    }
  
    useEffect(() => {
      fetchData()
    }, [])
  
    // Handle request approval
    const handleApprove = async (id: string) => {
      setProcessingId(id)
      try {
        await api.post(`/api/admin/bank-requests/${id}/approve`)
        toast.success("Bank request approved successfully")
        fetchData() // Refresh the data after approval
      } catch (error: any) {
        console.error("Error approving bank request:", error)
        toast.error(error.response?.data?.message || "Failed to approve bank request")
      } finally {
        setProcessingId(null)
      }
    }
  
    // Handle request rejection
    const handleReject = async () => {
      if (!selectedRequest) return;
      
      setProcessingId(selectedRequest._id)
      try {
        await api.post(`/api/admin/bank-requests/${selectedRequest._id}/reject`, {
          rejectionReason
        })
        toast.success("Bank request rejected successfully")
        setShowRejectDialog(false)
        setRejectionReason("")
        setSelectedRequest(null)
        fetchData() // Refresh the data after rejection
      } catch (error: any) {
        console.error("Error rejecting bank request:", error)
        toast.error(error.response?.data?.message || "Failed to reject bank request")
      } finally {
        setProcessingId(null)
      }
    }
  
    // Helper function to get status style
    const getStatusStyle = (status: string) => {
      switch (status.toLowerCase()) {
        case 'approved':
          return 'bg-green-100 text-green-700'
        case 'pending':
          return 'bg-yellow-100 text-yellow-700'
        case 'rejected':
          return 'bg-red-100 text-red-700'
        default:
          return 'bg-gray-100 text-gray-700'
      }
    }
  
    const getStatusDot = (status: string) => {
      switch (status.toLowerCase()) {
        case 'approved':
          return 'bg-green-600'
        case 'pending':
          return 'bg-yellow-600'
        case 'rejected':
          return 'bg-red-600'
        default:
          return 'bg-gray-600'
      }
    }
  
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white">Bank Requests</h2>
            <p className="text-muted-foreground">Manage and review seller bank account requests</p>
          </div>
        </div>
  
        {/* Statistics Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 p-3 rounded-lg">
                <RefreshCcw className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Total Requests</p>
                <h3 className="text-2xl font-bold">{stats.total}</h3>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 p-3 rounded-lg">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Pending Requests</p>
                <h3 className="text-2xl font-bold">{stats.pending}</h3>
              </div>
            </div>
          </Card>
  
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 p-3 rounded-lg">
                <ArrowUpRight className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Approved Requests</p>
                <h3 className="text-2xl font-bold">{stats.approved}</h3>
              </div>
            </div>
          </Card>
        </div>
  
        {/* Bank Requests Table */}
        <Card className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request ID</TableHead>
                <TableHead>Seller</TableHead>
                <TableHead>Current Bank</TableHead>
                <TableHead>New Bank</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">
                    No bank requests found
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((request) => (
                  <TableRow key={request._id}>
                    <TableCell className="font-medium">{request._id}</TableCell>
                    <TableCell>
                      {request.seller.businessName || 
                       `${request.seller.firstName} ${request.seller.lastName}`}
                      <br />
                      <span className="text-sm text-muted-foreground">
                        {request.seller.email}
                      </span>
                    </TableCell>
                    <TableCell>
                      {request.currentBankDetails.bankName}
                      <br />
                      <span className="text-sm text-muted-foreground">
                        {request.currentBankDetails.accountNumber}
                      </span>
                    </TableCell>
                    <TableCell>
                      {request.newBankDetails.bankName}
                      <br />
                      <span className="text-sm text-muted-foreground">
                        {request.newBankDetails.accountNumber}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className={`inline-flex items-center gap-2 rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusStyle(request.status)}`}>
                        <div className={`h-1.5 w-1.5 rounded-full ${getStatusDot(request.status)}`} />
                        {request.status.toUpperCase()}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(request.requestDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => window.open(request.proofDocument.url, '_blank')}
                          title="View Proof Document"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {request.status === 'pending' && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-green-600 hover:text-green-700"
                              onClick={() => handleApprove(request._id)}
                              disabled={processingId === request._id}
                              title="Approve Request"
                            >
                              {processingId === request._id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => {
                                setSelectedRequest(request)
                                setShowRejectDialog(true)
                              }}
                              disabled={processingId === request._id}
                              title="Reject Request"
                            >
                              {processingId === request._id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <X className="h-4 w-4" />
                              )}
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
  
        {/* Reject Dialog */}
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Bank Change Request</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Reason for Rejection</Label>
                <Input
                  placeholder="Enter reason for rejection"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRejectDialog(false)
                    setRejectionReason("")
                    setSelectedRequest(null)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={!rejectionReason.trim() || processingId !== null}
                >
                  {processingId ? "Rejecting..." : "Reject Request"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
  }
  
  export default BankRequests
  