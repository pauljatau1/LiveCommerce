import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { api } from "@/api/axios";
import { toast } from "sonner";

const ReturnRequests = () => {
  const [refundRequests, setRefundRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [adminNote, setAdminNote] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchRefundRequests();
  }, []);

  const fetchRefundRequests = async () => {
    try {
      const response = await api.get("/api/returns/admin/refund-requests");
      setRefundRequests(response.data.refundRequests);
    } catch (error) {
      console.error("Error fetching refund requests:", error);
      toast.error("Failed to fetch refund requests");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveClick = (request) => {
    setSelectedRequest(request);
    setShowApproveDialog(true);
  };

  const handleApproveRefund = async () => {
    try {
      setIsProcessing(true);
      const response = await api.post(`/api/returns/${selectedRequest._id}/admin/process-refund`, {
        action: 'approve',
        note: adminNote
      });

      if (response.status === 200) {
        toast.success("Refund approved and processed successfully");
        setShowApproveDialog(false);
        fetchRefundRequests(); // Refresh the list
      }
    } catch (error) {
      console.error("Error processing refund:", error);
      toast.error(error.response?.data?.message || "Failed to process refund");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectRefund = async (requestId) => {
    try {
      const response = await api.post(`/api/returns/${requestId}/admin/process-refund`, {
        action: 'reject',
        note: 'Refund request rejected by admin'
      });

      if (response.status === 200) {
        toast.success("Refund request rejected");
        fetchRefundRequests(); // Refresh the list
      }
    } catch (error) {
      console.error("Error rejecting refund:", error);
      toast.error("Failed to reject refund request");
    }
  };

  const renderApproveDialog = () => (
    <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Approve Refund Request</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <p className="text-sm font-medium">Order ID: {selectedRequest?.order?.order_id}</p>
            <p className="text-sm font-medium">Amount: ₦{selectedRequest?.sellerResponse?.partialRefundAmount}</p>
            <p className="text-sm font-medium">Buyer: {selectedRequest?.buyer?.firstName} {selectedRequest?.buyer?.lastName}</p>
            <Textarea
              placeholder="Add a note (optional)"
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowApproveDialog(false)} disabled={isProcessing}>
            Cancel
          </Button>
          <Button onClick={handleApproveRefund} disabled={isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve & Process Refund
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Refund Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Buyer</TableHead>
                <TableHead>Seller</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {refundRequests.map((request) => (
                <TableRow key={request._id}>
                  <TableCell>{request.order?.order_id}</TableCell>
                  <TableCell>{request.buyer?.firstName} {request.buyer?.lastName}</TableCell>
                  <TableCell>{request.seller?.businessName}</TableCell>
                  <TableCell>₦{request.sellerResponse?.partialRefundAmount?.toLocaleString()}</TableCell>
                  <TableCell>{request.sellerResponse?.message}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        request.status === "REFUNDED"
                          ? "success"
                          : request.status === "REJECTED"
                          ? "destructive"
                          : "default"
                      }
                    >
                      {request.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(request.sellerResponse?.date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {request.status === "PENDING_ADMIN_REVIEW" && (
                        <>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleApproveClick(request)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRejectRefund(request._id)}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {renderApproveDialog()}
    </div>
  );
};

export default ReturnRequests; 