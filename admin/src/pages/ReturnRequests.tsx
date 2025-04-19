import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";
import { api } from "@/api/axios";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function PickupRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchPickupRequests();
  }, []);

  const fetchPickupRequests = async () => {
    try {
      const response = await api.get("/api/pickup");
      setRequests(response.data.data.pickupRequests);
    } catch (error) {
      console.error("Error fetching pickup requests:", error);
      toast.error("Failed to fetch pickup requests");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      setIsProcessing(true);
      const response = await api.post(`/api/pickup/${id}/approve`);

      if (response.status === 200) {
        toast.success("Pickup request approved successfully");
        fetchPickupRequests(); // Refresh the list
      }
    } catch (error) {
      console.error("Error approving request:", error);
      toast.error(error.response?.data?.message || "Failed to approve request");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecline = async (id) => {
    try {
      setIsProcessing(true);
      const response = await api.post(`/api/pickup/${id}/decline`);

      if (response.status === 200) {
        toast.success("Pickup request declined successfully");
        fetchPickupRequests(); // Refresh the list
      }
    } catch (error) {
      console.error("Error declining request:", error);
      toast.error(error.response?.data?.message || "Failed to decline request");
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 text-white">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold tracking-tight">Pickup Requests</h2>
      </div>

      <div className="rounded-md border border-gray-700">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-white">Order Number</TableHead>
              <TableHead className="text-white">Buyer Name</TableHead>
              <TableHead className="text-white">Seller Name</TableHead>
              <TableHead className="text-white">Product Name</TableHead>
              <TableHead className="text-white">Status</TableHead>
              <TableHead className="text-white">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request) => (
              <TableRow key={request._id}>
                <TableCell className="text-white">{request.order.orderNumber}</TableCell>
                <TableCell className="text-white">{`${request.buyer.firstName} ${request.buyer.lastName}`}</TableCell>
                <TableCell className="text-white">{request.seller.storeName}</TableCell>
                <TableCell className="text-white">{request.order.productName}</TableCell>
                <TableCell>
                  <Badge variant={
                    request.status === 'approved' ? 'default' :
                    request.status === 'declined' ? 'destructive' :
                    'secondary'
                  }>
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleApprove(request._id)}
                      disabled={request.status !== 'pending' || isProcessing}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDecline(request._id)}
                      disabled={request.status !== 'pending' || isProcessing}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Decline
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
