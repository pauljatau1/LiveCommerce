import { 
    RefreshCcw,
    DollarSign,
    Clock,
    Eye,
    Download,
    CheckCircle,
    XCircle,
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
  import { useEffect, useState, useMemo } from "react"
  import { api } from "@/api/axios"
  import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
  } from "@/components/ui/dialog"
  import { toast } from "sonner"
  import { Textarea } from "@/components/ui/textarea"
  import { Pagination } from "@/components/ui/pagination"
  
  /**
   * @typedef {Object} RefundRequest
   * @property {string} orderId
   * @property {string} orderNumber
   * @property {Object} buyer
   * @property {string} buyer.id
   * @property {string} buyer.name
   * @property {string} buyer.email
   * @property {Object} seller
   * @property {string} seller.id
   * @property {string} seller.name
   * @property {string} seller.email
   * @property {number} amount
   * @property {string} paymentMethod
   * @property {Object} refundRequest
   * @property {string} refundRequest.status
   * @property {string} refundRequest.requestedAt
   * @property {string} refundRequest.requestedBy
   * @property {string} refundRequest.reason
   * @property {string} createdAt
   */
  
  /**
   * @typedef {Object} PaginationInfo
   * @property {number} total
   * @property {number} pages
   * @property {number} currentPage
   * @property {number} limit
   */

  interface RefundRequest {
    orderId: string;
    orderNumber: string;
    buyer: {
      id: string;
      name: string;
      email: string;
    };
    seller: {
      id: string;
      name: string;
      email: string;
    };
    amount: number;
    paymentMethod: string;
    refundRequest: {
      status: string;
      requestedAt: string;
      requestedBy: string;
      reason: string;
    };
    createdAt: string;
  }
  
  interface PaginationInfo {
    total: number;
    pages: number;
    currentPage: number;
    limit: number;
  }
  
  function RefundRequests() {
    const [refundRequests, setRefundRequests] = useState<RefundRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState<RefundRequest | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [notes, setNotes] = useState("");
    const [processingAction, setProcessingAction] = useState(false);
    const [pagination, setPagination] = useState<PaginationInfo>({
      total: 0,
      pages: 0,
      currentPage: 1,
      limit: 10
    });
    const [statusFilter, setStatusFilter] = useState("");
  
    // Fetch refund requests
    const fetchRefundRequests = async (page = 1, status = "") => {
      setLoading(true);
      try {
        const query = new URLSearchParams();
        query.append('page', page.toString());
        query.append('limit', pagination.limit.toString());
        if (status) query.append('status', status);
        
        const response = await api.get(`/api/order/refund-requests?${query.toString()}`);
        setRefundRequests(response.data.refundRequests);
        setPagination(response.data.pagination);
      } catch (error) {
        console.error("Failed to fetch refund requests:", error);
        toast.error("Failed to load refund requests");
      } finally {
        setLoading(false);
      }
    };
  
    // Initial fetch
    useEffect(() => {
      fetchRefundRequests(pagination.currentPage, statusFilter);
    }, [pagination.currentPage, statusFilter]);
  
    // Calculate statistics
    const totalRequests = pagination.total;
    const pendingRequests = refundRequests.filter(req => req.refundRequest.status === "pending").length;
    const totalRefundAmount = refundRequests.reduce((sum, req) => 
      req.refundRequest.status === "approved" ? sum + req.amount : sum, 0);
  
    // Helper function to handle refund approval
    const handleApprove = async () => {
      if (!selectedRequest) return;
      
      setProcessingAction(true);
      try {
        await api.post(`/api/order/${selectedRequest.orderId}/process-refund`, {
          status: 'approved',
          notes: notes
        });
        
        // Refresh the list
        await fetchRefundRequests(pagination.currentPage, statusFilter);
        toast.success("Refund request approved successfully");
        closeApproveModal();
      } catch (error) {
        console.error("Failed to approve refund:", error);
        toast.error("Failed to approve refund request");
      } finally {
        setProcessingAction(false);
      }
    };
  
    // Helper function to handle refund rejection
    const handleReject = async () => {
      if (!selectedRequest) return;
      
      setProcessingAction(true);
      try {
        await api.post(`/api/order/${selectedRequest.orderId}/process-refund`, {
          status: 'rejected',
          notes: notes
        });
        
        // Refresh the list
        await fetchRefundRequests(pagination.currentPage, statusFilter);
        toast.success("Refund request rejected successfully");
        closeRejectModal();
      } catch (error) {
        console.error("Failed to reject refund:", error);
        toast.error("Failed to reject refund request");
      } finally {
        setProcessingAction(false);
      }
    };
  
    // Helper function to format date
    const formatDate = (dateString: string): string => {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };
  
    // Helper function to get status style
    const getStatusStyle = (status: string): string => {
      switch (status.toLowerCase()) {
        case 'approved':
          return 'bg-green-100 text-green-700';
        case 'pending':
          return 'bg-yellow-100 text-yellow-700';
        case 'rejected':
          return 'bg-red-100 text-red-700';
        default:
          return 'bg-blue-100 text-blue-700';
      }
    };
  
    const getStatusDot = (status: string): string => {
      switch (status.toLowerCase()) {
        case 'approved':
          return 'bg-green-600';
        case 'pending':
          return 'bg-yellow-600';
        case 'rejected':
          return 'bg-red-600';
        default:
          return 'bg-blue-600';
      }
    };
  
    /**
     * Helper function to open details modal
     * @param {RefundRequest} request
     */
    const openDetailsModal = (request: RefundRequest): void => {
      setSelectedRequest(request);
      setShowDetailsModal(true);
    };
  
    // Helper function to close details modal
    const closeDetailsModal = (): void => {
      setShowDetailsModal(false);
      setSelectedRequest(null);
    };
  
    /**
     * Helper function to open approve modal
     * @param {RefundRequest} request
     */
    const openApproveModal = (request: RefundRequest): void => {
      setSelectedRequest(request);
      setNotes("");
      setShowApproveModal(true);
    };
  
    // Helper function to close approve modal
    const closeApproveModal = (): void => {
      setShowApproveModal(false);
      setSelectedRequest(null);
      setNotes("");
    };
  
    /**
     * Helper function to open reject modal
     * @param {RefundRequest} request
     */
    const openRejectModal = (request: RefundRequest): void => {
      setSelectedRequest(request);
      setNotes("");
      setShowRejectModal(true);
    };
  
    // Helper function to close reject modal
    const closeRejectModal = (): void => {
      setShowRejectModal(false);
      setSelectedRequest(null);
      setNotes("");
    };
  
    /**
     * Helper function to handle page change
     * @param {number} page
     */
    const handlePageChange = (page: number): void => {
      if (page < 1 || page > pagination.pages) return;
      fetchRefundRequests(page, statusFilter);
    };
  
    /**
     * Export refund requests as CSV file
     */
    const exportToCSV = (): void => {
      // Only export if we have data
      if (refundRequests.length === 0) {
        toast.error("No data to export");
        return;
      }
  
      try {
        // Create CSV headers
        const headers = [
          "Order ID",
          "Customer",
          "Seller",
          "Amount",
          "Payment Method",
          "Reason",
          "Request Date",
          "Status"
        ].join(",");
  
        // Create CSV rows
        const rows = refundRequests.map(request => [
          `"${request.orderNumber}"`,
          `"${request.buyer.name}"`,
          `"${request.seller.name}"`,
          `"₦${request.amount.toLocaleString()}"`,
          `"${request.paymentMethod || 'N/A'}"`,
          `"${(request.refundRequest.reason || 'No reason provided').replace(/"/g, '""')}"`,
          `"${formatDate(request.refundRequest.requestedAt)}"`,
          `"${request.refundRequest.status.toUpperCase()}"`
        ].join(","));
  
        // Combine headers and rows
        const csvContent = [headers, ...rows].join("\n");
  
        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `refund-requests-${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        
        // Trigger download and clean up
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast.success("Export successful");
      } catch (error) {
        console.error("Export error:", error);
        toast.error("Failed to export data");
      }
    };
  
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white">Refund Requests</h2>
            <p className="text-muted-foreground">Manage buyer refund requests</p>
          </div>
          <div className="flex gap-4">
            <select 
              className="p-2 rounded-md bg-background"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <Button variant="outline" onClick={() => fetchRefundRequests(1, statusFilter)}>
              <RefreshCcw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" onClick={exportToCSV} disabled={loading || refundRequests.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
  
        {/* Refund Stats */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 p-3 rounded-lg">
                <RefreshCcw className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Total Requests</p>
                <h3 className="text-2xl font-bold">{totalRequests}</h3>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-yellow-500/10 p-3 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Pending Requests</p>
                <h3 className="text-2xl font-bold">{pendingRequests}</h3>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-green-500/10 p-3 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Total Refunded</p>
                <h3 className="text-2xl font-bold">₦{totalRefundAmount.toLocaleString()}</h3>
              </div>
            </div>
          </Card>
        </div>
  
        {/* Refund Requests Table */}
        <Card className="overflow-hidden">
          <div className="p-6 bg-card">
            <h3 className="font-medium">Recent Refund Requests</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Request Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-20">
                    <div className="flex justify-center">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : refundRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10">
                    No refund requests found
                  </TableCell>
                </TableRow>
              ) : (
                refundRequests.map((request) => (
                  <TableRow key={request.orderId}>
                    <TableCell className="font-medium">{request.orderNumber}</TableCell>
                    <TableCell>{request.buyer.name}</TableCell>
                    <TableCell>₦{request.amount.toLocaleString()}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {request.refundRequest.reason || "No reason provided"}
                    </TableCell>
                    <TableCell>{formatDate(request.refundRequest.requestedAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <div className={`h-2 w-2 rounded-full ${getStatusDot(request.refundRequest.status)} mr-2`}></div>
                        <span className={`px-2 py-1 rounded text-xs ${getStatusStyle(request.refundRequest.status)}`}>
                          {request.refundRequest.status.toUpperCase()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => openDetailsModal(request)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {request.refundRequest.status === "pending" && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="text-green-600 hover:text-green-700 hover:bg-green-100"
                              onClick={() => openApproveModal(request)}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="text-red-600 hover:text-red-700 hover:bg-red-100"
                              onClick={() => openRejectModal(request)}
                            >
                              <XCircle className="h-4 w-4" />
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
          
          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="p-4 flex justify-center">
              <Pagination>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                >
                  Previous
                </Button>
                <span className="mx-4 flex items-center">
                  Page {pagination.currentPage} of {pagination.pages}
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.pages}
                >
                  Next
                </Button>
              </Pagination>
            </div>
          )}
        </Card>
  
        {/* Details Modal */}
        <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Refund Request Details</DialogTitle>
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-2 right-2"
                onClick={closeDetailsModal}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogHeader>
            {selectedRequest && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-muted-foreground">Order ID</h4>
                    <p>{selectedRequest.orderNumber}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-muted-foreground">Status</h4>
                    <div className="flex items-center mt-1">
                      <div className={`h-2 w-2 rounded-full ${getStatusDot(selectedRequest.refundRequest.status)} mr-2`}></div>
                      <span className={`px-2 py-1 rounded text-xs ${getStatusStyle(selectedRequest.refundRequest.status)}`}>
                        {selectedRequest.refundRequest.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
  
                <div>
                  <h4 className="font-medium text-muted-foreground">Customer</h4>
                  <p>{selectedRequest.buyer.name} ({selectedRequest.buyer.email})</p>
                </div>
  
                <div>
                  <h4 className="font-medium text-muted-foreground">Seller</h4>
                  <p>{selectedRequest.seller.name} ({selectedRequest.seller.email})</p>
                </div>
  
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-muted-foreground">Amount</h4>
                    <p>₦{selectedRequest.amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-muted-foreground">Payment Method</h4>
                    <p>{selectedRequest.paymentMethod || "N/A"}</p>
                  </div>
                </div>
  
                <div>
                  <h4 className="font-medium text-muted-foreground">Reason</h4>
                  <p>{selectedRequest.refundRequest.reason || "No reason provided"}</p>
                </div>
  
                <div>
                  <h4 className="font-medium text-muted-foreground">Request Date</h4>
                  <p>{formatDate(selectedRequest.refundRequest.requestedAt)}</p>
                </div>
  
                <div>
                  <h4 className="font-medium text-muted-foreground">Requested By</h4>
                  <p className="capitalize">{selectedRequest.refundRequest.requestedBy}</p>
                </div>
  
                {selectedRequest.refundRequest.status === "pending" && (
                  <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                      variant="destructive"
                      onClick={() => {
                        closeDetailsModal();
                        openRejectModal(selectedRequest);
                      }}
                    >
                      Reject
                    </Button>
                    <Button
                      onClick={() => {
                        closeDetailsModal();
                        openApproveModal(selectedRequest);
                      }}
                    >
                      Approve
                    </Button>
                  </DialogFooter>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
  
        {/* Approve Modal */}
        <Dialog open={showApproveModal} onOpenChange={setShowApproveModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Approve Refund Request</DialogTitle>
              <DialogDescription>
                This action will approve the refund request and add the refund amount to the buyer's wallet.
              </DialogDescription>
            </DialogHeader>
            {selectedRequest && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-muted-foreground">Order ID</h4>
                    <p>{selectedRequest.orderNumber}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-muted-foreground">Amount</h4>
                    <p>₦{selectedRequest.amount.toLocaleString()}</p>
                  </div>
                </div>
  
                <div>
                  <h4 className="font-medium text-muted-foreground">Customer</h4>
                  <p>{selectedRequest.buyer.name}</p>
                </div>
  
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium mb-1">
                    Notes (Optional)
                  </label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any optional notes about this refund approval"
                    rows={3}
                  />
                </div>
  
                <DialogFooter>
                  <Button variant="outline" onClick={closeApproveModal} disabled={processingAction}>
                    Cancel
                  </Button>
                  <Button onClick={handleApprove} disabled={processingAction}>
                    {processingAction ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                    Confirm Approval
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
  
        {/* Reject Modal */}
        <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Refund Request</DialogTitle>
              <DialogDescription>
                This action will reject the refund request. Please provide a reason for the rejection.
              </DialogDescription>
            </DialogHeader>
            {selectedRequest && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-muted-foreground">Order ID</h4>
                    <p>{selectedRequest.orderNumber}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-muted-foreground">Amount</h4>
                    <p>₦{selectedRequest.amount.toLocaleString()}</p>
                  </div>
                </div>
  
                <div>
                  <h4 className="font-medium text-muted-foreground">Customer</h4>
                  <p>{selectedRequest.buyer.name}</p>
                </div>
  
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium mb-1">
                    Rejection Reason <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Provide a reason for rejecting this refund request"
                    rows={3}
                    required
                  />
                </div>
  
                <DialogFooter>
                  <Button variant="outline" onClick={closeRejectModal} disabled={processingAction}>
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleReject} 
                    disabled={processingAction || !notes.trim()}
                  >
                    {processingAction ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                    Confirm Rejection
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }
  
  export default RefundRequests; 