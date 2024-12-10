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
import { Download, Loader2, MoreHorizontal, Building2, Mail, Phone, MapPin, Wallet, Eye, Tags } from "lucide-react";
import { api } from "@/api/axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface BusinessAddress {
  country: string;
  state: string;
  city: string;
  addressLine1: string;
  addressLine2?: string;
  zipCode: string;
}

interface VerificationDocument {
  documentType: string;
  fileUrl: string;
  public_id: string;
  _id: string;
  uploadedAt: string;
}

interface BankDetails {
  bankCountry: string;
  bankName: string;
  bankAccountType: string;
  accountCurrency: string;
  accountNumber: string;
  accountName: string;
  swiftCode?: string;
  bankIdentifierCode?: string;
}

interface ShippingOptions {
  shippingMethod: string;
  returnsAndExchangePolicy: string;
}

interface WarehouseDetails {
  address: BusinessAddress;
  name: string;
  contactNumber: string;
}

interface StoreImage {
  url: string;
  public_id: string;
}

interface Category {
  name: string;
  subCategories: Array<{
    name: string;
    _id: string;
  }>;
  _id: string;
}

interface Seller {
  _id: string;
  businessName?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phoneNumber: string;
  businessEmail?: string;
  businessNumber?: string;
  businessAddress?: BusinessAddress;
  verificationDocuments?: {
    type: string;
    documents: VerificationDocument[];
  };
  bankDetails?: BankDetails;
  shippingOptions?: ShippingOptions;
  warehouseDetails?: WarehouseDetails;
  storeAvatar?: StoreImage;
  storeBanner?: StoreImage;
  isProfileComplete: boolean;
  isVerified: boolean;
  isFeatured: boolean;
  isDisabled?: boolean;
  accountType?: string;
  businessType?: string;
  createdAt: string;
  categories?: Category[];
  walletBalance: number;
  storeVisits: number;
}

function Sellers() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
  const [showModal, setShowModal] = useState(false);

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
    return seller.businessName || `${seller.firstName} ${seller.lastName}`;
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
              <TableHead>Seller</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Verification</TableHead>
              <TableHead>Featured</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Join Date</TableHead>
              <TableHead>Documents</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sellers.map((seller) => (
              <TableRow key={seller._id}>
                <TableCell className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={seller.storeAvatar?.url} />
                    <AvatarFallback>{getDisplayName(seller).charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{getDisplayName(seller)}</div>
                    <div className="text-sm text-muted-foreground">{seller.email}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {seller.accountType || "N/A"}
                  </Badge>
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
                  {seller.verificationDocuments?.documents?.length ? (
                    <div className="flex gap-2">
                      {seller.verificationDocuments.documents.map((doc) => (
                        <Button
                          key={doc._id}
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(doc.fileUrl, "_blank")}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          {doc.documentType}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">
                      No documents
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedSeller(seller);
                      setShowModal(true);
                    }}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto bg-zinc-950 text-white border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Seller Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedSeller && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-900 p-4 rounded-lg">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Business Information
                  </h3>
                  <div className="space-y-2">
                    <p className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-zinc-400" />
                      <span className="text-zinc-400">Business Name:</span> {selectedSeller.businessName}
                    </p>
                    <p className="flex items-center gap-2">
                      <Tags className="h-4 w-4 text-zinc-400" />
                      <span className="text-zinc-400">Business Type:</span> {selectedSeller.businessType}
                    </p>
                    <p className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-zinc-400" />
                      <span className="text-zinc-400">Business Email:</span> {selectedSeller.businessEmail}
                    </p>
                    <p className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-zinc-400" />
                      <span className="text-zinc-400">Business Phone:</span> {selectedSeller.businessNumber}
                    </p>
                  </div>
                </div>

                <div className="bg-zinc-900 p-4 rounded-lg">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Store Statistics
                  </h3>
                  <div className="space-y-2">
                    <p className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-zinc-400" />
                      <span className="text-zinc-400">Store Visits:</span> {selectedSeller.storeVisits}
                    </p>
                    <p className="flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-zinc-400" />
                      <span className="text-zinc-400">Wallet Balance:</span> ${selectedSeller.walletBalance}
                    </p>
                  </div>
                </div>
              </div>

              {selectedSeller.businessAddress && (
                <div className="bg-zinc-900 p-4 rounded-lg">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Business Address
                  </h3>
                  <div className="space-y-2 text-zinc-300">
                    <p>{selectedSeller.businessAddress.addressLine1}</p>
                    {selectedSeller.businessAddress.addressLine2 && (
                      <p>{selectedSeller.businessAddress.addressLine2}</p>
                    )}
                    <p>
                      {selectedSeller.businessAddress.city}, {selectedSeller.businessAddress.state}
                    </p>
                    <p>
                      {selectedSeller.businessAddress.country} {selectedSeller.businessAddress.zipCode}
                    </p>
                  </div>
                </div>
              )}

              {selectedSeller.categories && selectedSeller.categories.length > 0 && (
                <div className="bg-zinc-900 p-4 rounded-lg">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Tags className="h-4 w-4" />
                    Categories
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedSeller.categories.map((category) => (
                      <Badge key={category._id} variant="secondary" className="bg-zinc-800 text-white">
                        {category.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Sellers
