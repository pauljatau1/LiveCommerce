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
import { Download, Loader2 } from "lucide-react";
import { api } from "@/api/axios";

interface Seller {
  _id: string;
  businessName?: string;
  firstName?: string;
  lastName?: string;
  storeName?: string;
  name?: string;
  isProfileComplete: boolean;
  isVerified: boolean;
  isFeatured: boolean;
  isDisabled?: boolean;
  accountType?: string;
  type?: string;
  createdAt: string;
  verificationDocuments?: Array<{
    fileUrl: string;
    type: string;
  }>;
}

function Sellers() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchSellers();
  }, []);

  const fetchSellers = async () => {
    try {
      const response = await api.get("/api/admin/sellers");
      setSellers(response.data);
    } catch (err) {
      setError("Failed to fetch sellers");
      console.error("Error fetching sellers:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleFeature = async (sellerId: string) => {
    setUpdatingId(sellerId);
    try {
      await api.put(`/api/admin/sellers/${sellerId}/feature`);
      setSellers(sellers.map(seller => 
        seller._id === sellerId 
          ? {...seller, isFeatured: !seller.isFeatured}
          : seller
      ));
    } catch (err) {
      console.error("Error updating featured status:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleVerification = async (sellerId: string) => {
    setUpdatingId(sellerId);
    try {
      await api.put(`/api/admin/sellers/${sellerId}/verify`);
      setSellers(sellers.map(seller => 
        seller._id === sellerId 
          ? {...seller, isVerified: !seller.isVerified}
          : seller
      ));
    } catch (err) {
      console.error("Error updating verification status:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleDisabled = async (sellerId: string, currentState: boolean) => {
    setUpdatingId(sellerId);
    try {
      await api.put(`/api/admin/sellers/${sellerId}/${currentState ? 'enable' : 'disable'}`);
      setSellers(sellers.map(seller => 
        seller._id === sellerId 
          ? {...seller, isDisabled: !currentState}
          : seller
      ));
    } catch (err) {
      console.error("Error updating disabled status:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const getDisplayName = (seller: Seller) => {
    return seller.businessName || seller.storeName || seller.name || seller.firstName + " " + seller.lastName;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
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
        <h2 className="text-3xl font-bold text-white">Sellers</h2>
        <p className="text-muted-foreground">Manage your platform sellers</p>
      </div>

      <Card className="p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Verification</TableHead>
              <TableHead>Featured</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Join Date</TableHead>
              <TableHead>Documents</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sellers.map((seller) => (
              <TableRow key={seller._id}>
                <TableCell className="font-mono text-xs">
                  {seller._id}
                </TableCell>
                <TableCell className="font-medium">
                  {getDisplayName(seller)}
                </TableCell>
                <TableCell>
                  {seller.accountType || seller.type || "N/A"}
                </TableCell>
                <TableCell>
                  <Button
                    variant={seller.isVerified ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleVerification(seller._id)}
                    disabled={updatingId === seller._id}
                  >
                    {updatingId === seller._id ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : null}
                    {seller.isVerified ? "Verified" : "Verify"}
                  </Button>
                </TableCell>
                <TableCell>
                  <Button
                    variant={seller.isFeatured ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleFeature(seller._id)}
                    disabled={updatingId === seller._id}
                  >
                    {updatingId === seller._id ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : null}
                    {seller.isFeatured ? "Featured" : "Feature"}
                  </Button>
                </TableCell>
                <TableCell>
                  <Button
                    variant={seller.isDisabled ? "destructive" : "outline"}
                    size="sm"
                    onClick={() => toggleDisabled(seller._id, !!seller.isDisabled)}
                    disabled={updatingId === seller._id}
                  >
                    {updatingId === seller._id ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : null}
                    {seller.isDisabled ? "Disabled" : "Active"}
                  </Button>
                </TableCell>
                <TableCell>{formatDate(seller.createdAt)}</TableCell>
                <TableCell>
                  {seller.verificationDocuments &&
                  seller.verificationDocuments.length > 0 ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (seller.verificationDocuments && seller.verificationDocuments.length > 0) {
                          window.open(seller.verificationDocuments[0].fileUrl, "_blank");
                        }
                      }}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  ) : (
                    <span className="text-muted-foreground text-sm">
                      No documents
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

export default Sellers
