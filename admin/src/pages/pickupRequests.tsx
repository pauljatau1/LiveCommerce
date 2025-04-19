import { useState, useEffect } from 'react';
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
import { Check, X, Loader2 } from "lucide-react";
import { api } from "@/api/axios";
import { toast } from "sonner";

interface OrderItem {
  productName: string;
}

interface Order {
  order_id: string;
  items: OrderItem[];
}

interface User {
  firstName: string;
  lastName: string;
}

interface Seller {
  storeName: string;
}

interface ProofOfDelivery {
  url: string;
}

interface PickupRequest {
  _id: string;
  order: Order;
  buyer: User;
  seller: Seller;
  status: 'pending' | 'approved' | 'declined';
  proofOfDelivery: ProofOfDelivery;
}

export default function PickupRequests() {
  const [requests, setRequests] = useState<PickupRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [processingRequests, setProcessingRequests] = useState<Record<string, boolean>>({});

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

  const handleProcessRequest = async (id: string, status: 'approved' | 'declined') => {
    setProcessingRequests((prev) => ({ ...prev, [id]: true }));
    try {
      const response = await api.post(`/api/pickup/${id}/process`, {
        status,
        adminNote: "" // Add admin note if needed
      });

      if (response.status === 200) {
        toast.success(`Pickup request ${status} successfully`);
        fetchPickupRequests(); // Refresh the list
      }
    } catch (error: any) {
      console.error(`Error ${status === 'approved' ? 'approving' : 'declining'} request:`, error);
      toast.error(error.response?.data?.message || `Failed to ${status} request`);
    } finally {
      setProcessingRequests((prev) => ({ ...prev, [id]: false }));
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
              <TableHead className="text-white">Proof of Delivery</TableHead>
              <TableHead className="text-white">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request) => (
              <TableRow key={request._id}>
                <TableCell className="text-white">{request.order.order_id}</TableCell>
                <TableCell className="text-white">{`${request.buyer.firstName} ${request.buyer.lastName}`}</TableCell>
                <TableCell className="text-white">{request.seller.storeName}</TableCell>
                <TableCell className="text-white">
                  {request.order.items.map((item) => item.productName).join(", ")}
                </TableCell>
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
                  <a
                    href={request.proofOfDelivery.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 underline"
                  >
                    View Media
                  </a>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleProcessRequest(request._id, 'approved')}
                      disabled={request.status !== 'pending' || processingRequests[request._id]}
                    >
                      {processingRequests[request._id] ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <Check className="h-4 w-4 mr-1" />
                      )}
                      {processingRequests[request._id] ? 'Processing' : 'Approve'}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleProcessRequest(request._id, 'declined')}
                      disabled={request.status !== 'pending' || processingRequests[request._id]}
                    >
                      {processingRequests[request._id] ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <X className="h-4 w-4 mr-1" />
                      )}
                      {processingRequests[request._id] ? 'Processing' : 'Decline'}
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
