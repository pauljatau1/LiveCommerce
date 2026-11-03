import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Copy, Download } from "lucide-react";
import { api } from "@/api/axios";
import { useToast } from "@/hooks/use-toast";

interface Buyer {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  country: string;
  phoneNumber: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  isDisabled: boolean;
  createdAt: string;
  selectedCategories: Array<{
    name: string;
    subCategories: Array<{
      name: string;
      _id: string;
    }>;
  }>;
  identityDocument?: {
    url?: string;
    status: 'pending' | 'verified' | 'rejected';
    uploadedAt?: string;
  };
  isIdentityVerified: boolean;
}

function Buyers() {
  const { toast } = useToast();
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  useEffect(() => {
    fetchBuyers();
  }, []);

  const fetchBuyers = async () => {
    try {
      const response = await api.get("/api/admin/users");
      setBuyers(response.data);
    } catch (err) {
      setError("Failed to fetch buyers");
      console.error("Error fetching buyers:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleDisabled = async (buyerId: string, currentState: boolean) => {
    setUpdatingId(buyerId);
    try {
      await api.put(`/api/admin/buyers/${buyerId}/${currentState ? 'enable' : 'disable'}`);
      setBuyers(buyers.map(buyer => 
        buyer._id === buyerId 
          ? {...buyer, isDisabled: !currentState}
          : buyer
      ));
    } catch (err) {
      console.error("Error updating disabled status:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const verifyIdentity = async (buyerId: string, status: 'verified' | 'rejected', note?: string) => {
    setVerifyingId(buyerId);
    try {
      await api.put(`/api/admin/buyers/${buyerId}/verify-identity`, {
        status,
        note
      });
      
      // Update the local state
      setBuyers(buyers.map(buyer => 
        buyer._id === buyerId 
          ? {
              ...buyer,
              identityDocument: {
                ...buyer.identityDocument,
                status
              },
              isIdentityVerified: status === 'verified'
            }
          : buyer
      ));

      toast({
        description: `Identity ${status} successfully`,
      });
    } catch (err) {
      console.error("Error updating identity status:", err);
      toast({
        variant: "destructive",
        description: "Failed to update identity status",
      });
    } finally {
      setVerifyingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      description: "ID copied to clipboard",
      duration: 2000,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-destructive p-4">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white">Buyers</h2>
        <p className="text-muted-foreground">Manage your platform buyers</p>
      </div>

      <Card className="p-6 overflow-auto">
        <div className="min-w-[1000px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">Buyer</TableHead>
                <TableHead>Identity Status</TableHead>
                <TableHead>Email Verified</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Join Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {buyers.map((buyer) => (
                <TableRow key={buyer._id}>
                  <TableCell className="flex items-center gap-3">
                    <div className="min-w-0">
                      <div className="font-medium truncate">
                        {buyer.firstName} {buyer.lastName}
                      </div>
                      <div className="text-sm text-muted-foreground truncate">
                        {buyer.email}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="text-xs text-muted-foreground truncate">
                          {buyer._id}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4"
                          onClick={() => copyToClipboard(buyer._id)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs inline-flex items-center w-fit ${
                        buyer.identityDocument?.status === 'verified'
                          ? 'bg-green-100 text-green-800'
                          : buyer.identityDocument?.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {buyer.identityDocument?.status || 'pending'}
                      </span>
                      {buyer.identityDocument?.url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(buyer.identityDocument?.url, "_blank")}
                          className="w-fit"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          View ID
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      buyer.emailVerified 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {buyer.emailVerified ? 'Verified' : 'Unverified'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant={buyer.isDisabled ? "destructive" : "outline"}
                      size="sm"
                      onClick={() => toggleDisabled(buyer._id, !!buyer.isDisabled)}
                      disabled={updatingId === buyer._id}
                      className="w-full"
                    >
                      {updatingId === buyer._id ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : null}
                      {buyer.isDisabled ? "Disabled" : "Active"}
                    </Button>
                  </TableCell>
                  <TableCell>{formatDate(buyer.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {buyer.identityDocument?.url ? (
                        <>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => verifyIdentity(buyer._id, 'verified')}
                            disabled={verifyingId === buyer._id}
                          >
                            {verifyingId === buyer._id ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            ) : null}
                            Verify
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => verifyIdentity(buyer._id, 'rejected')}
                            disabled={verifyingId === buyer._id}
                          >
                            {verifyingId === buyer._id ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            ) : null}
                            Reject
                          </Button>
                        </>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Document Pending
                        </span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

export default Buyers;
