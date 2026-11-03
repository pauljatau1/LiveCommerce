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
import { Download, Loader2, MoreHorizontal, Building2, Mail, Phone, MapPin, Wallet, Eye, Tags, Users, Store, AlertCircle, CheckCircle2, ShieldCheck, Calendar, Package, User, Briefcase, Building, UserCheck, LineChart, Megaphone, FileText, ExternalLink, XCircle, File, X, Clock, Star } from "lucide-react";
import { api } from "@/api/axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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
  onboardingProcess?: string;
  stats?: {
    totalReviews: number;
    averageRating: number;
  };
  campaignStats?: {
    totalCampaigns: number;
    totalRecipients: number;
    totalOpens: number;
    totalClicks: number;
    dailyCampaignCount: number;
  };
  emailVerified?: boolean;
  taxInformation?: string;
}

function Sellers() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedTab, setSelectedTab] = useState<"all" | "business" | "individual">("all");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectDetails, setRejectDetails] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

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

  const getStatusColor = (seller: Seller) => {
    if (seller.isDisabled) return "text-destructive";
    if (!seller.isVerified) return "text-yellow-500";
    if (seller.isVerified && seller.isProfileComplete) return "text-green-500";
    return "text-blue-500";
  };

  const getStatusText = (seller: Seller) => {
    if (seller.isDisabled) return "Disabled";
    if (!seller.isVerified) return "Pending Verification";
    if (seller.isVerified && !seller.isProfileComplete) return "Onboarding";
    return "Active";
  };

  const filteredSellers = sellers.filter(seller => {
    if (selectedTab === "all") return true;
    return seller.accountType === selectedTab;
  });

  const handleReject = async () => {
    if (!selectedSeller || !rejectReason) return;
    
    setIsRejecting(true);
    try {
      await api.put(`/api/admin/sellers/${selectedSeller._id}/reject`, {
        reason: rejectReason,
        details: rejectDetails
      });
      
      // Update the seller in the list
      setSellers(sellers.map(seller => 
        seller._id === selectedSeller._id 
          ? {...seller, isVerified: false, onboardingProcess: 'rejected'}
          : seller
      ));
      
      setShowRejectModal(false);
      setRejectReason("");
      setRejectDetails("");
    } catch (err) {
      console.error("Error rejecting seller:", err);
    } finally {
      setIsRejecting(false);
    }
  };

  const verificationButtons = (seller) => (
    <div className="flex items-center gap-2">
      <Badge 
        variant="outline" 
        className={`${
          seller.isVerified 
            ? "bg-green-500/10 text-green-500" 
            : "bg-yellow-500/10 text-yellow-500"
        }`}
      >
        {seller.isVerified ? (
          <CheckCircle2 className="h-4 w-4 mr-1" />
        ) : (
          <Clock className="h-4 w-4 mr-1" />
        )}
        {seller.isVerified ? "Verified" : "Pending"}
      </Badge>
      {!seller.isVerified && (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleVerification(seller._id)}
            disabled={updatingId === seller._id}
            className="ml-2"
          >
            {updatingId === seller._id ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              setSelectedSeller(seller);
              setShowRejectModal(true);
            }}
            disabled={updatingId === seller._id}
          >
            <XCircle className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  );

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
    <div className="space-y-6 p-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-2">
            <Users className="h-8 w-8" />
            Sellers
          </h2>
          <p className="text-muted-foreground">Manage your platform sellers</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="px-4 py-2">
            <Users className="h-4 w-4 mr-2" />
            Total: {sellers.length}
          </Badge>
          <Badge variant="outline" className="px-4 py-2">
            <Building className="h-4 w-4 mr-2" />
            Business: {sellers.filter(s => s.accountType === "business").length}
          </Badge>
          <Badge variant="outline" className="px-4 py-2">
            <User className="h-4 w-4 mr-2" />
            Individual: {sellers.filter(s => s.accountType === "individual").length}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full" onValueChange={(value) => setSelectedTab(value as any)}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Sellers</TabsTrigger>
          <TabsTrigger value="business">Business Accounts</TabsTrigger>
          <TabsTrigger value="individual">Individual Accounts</TabsTrigger>
        </TabsList>

        <Card className="p-4 overflow-auto">
          <div className="min-w-[800px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Seller Information</TableHead>
                  <TableHead className="w-[150px]">Account Type</TableHead>
                  <TableHead className="w-[180px]">Verification Status</TableHead>
                  <TableHead className="w-[80px]">Featured</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSellers.map((seller) => (
                  <TableRow key={seller._id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={seller.storeAvatar?.url} />
                          <AvatarFallback>
                            {seller.accountType === "business" ? 
                              <Store className="h-5 w-5" /> : 
                              <User className="h-5 w-5" />
                            }
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {getDisplayName(seller)}
                            {seller.isProfileComplete && (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">{seller.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={`${
                          seller.accountType === "business" ? "bg-blue-500/10" : "bg-purple-500/10"
                        }`}
                      >
                        {seller.accountType === "business" ? (
                          <Briefcase className="h-4 w-4 mr-1" />
                        ) : (
                          <User className="h-4 w-4 mr-1" />
                        )}
                        {seller.accountType || "N/A"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {verificationButtons(seller)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleFeature(seller._id)}
                        disabled={updatingId === seller._id}
                        className={`${
                          seller.isFeatured 
                            ? "text-yellow-500 hover:text-yellow-600" 
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Star className={`h-5 w-5 ${seller.isFeatured ? "fill-current" : ""}`} />
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                          onClick={() => {
                            setSelectedSeller(seller);
                            setShowModal(true);
                          }}
                        >
                          View Details
                        </Button>
                        {seller.verificationDocuments?.documents?.length > 0 && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                <FileText className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[200px]">
                              {seller.verificationDocuments.documents.map((doc) => (
                                <DropdownMenuItem 
                                  key={doc._id}
                                  onClick={() => window.open(doc.fileUrl, "_blank")}
                                  className="flex items-center gap-2"
                                >
                                  <File className="h-4 w-4" />
                                  <span className="capitalize">
                                    {doc.documentType.replace(/([A-Z])/g, ' $1').trim()}
                                  </span>
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </Tabs>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto bg-zinc-950 text-zinc-100 border border-zinc-800">
          <DialogHeader className="border-b border-zinc-800 pb-4">
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-white">
              <Store className="h-5 w-5" />
              Seller Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedSeller && (
            <div className="space-y-6 py-4">
              {/* Header Section with Banner */}
              <div className="relative rounded-lg overflow-hidden bg-gradient-to-b from-zinc-800 to-zinc-900">
                {selectedSeller.storeBanner?.url && (
                  <div className="h-48 w-full">
                    <img 
                      src={selectedSeller.storeBanner.url} 
                      alt="Store Banner"
                      className="w-full h-full object-cover opacity-40"
                    />
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-zinc-950/90 to-transparent">
                  <div className="flex items-center gap-6">
                    <Avatar className="h-24 w-24 border-4 border-zinc-950">
                      <AvatarImage src={selectedSeller.storeAvatar?.url} />
                      <AvatarFallback className="bg-zinc-800">
                        {selectedSeller.accountType === "business" ? 
                          <Store className="h-12 w-12" /> : 
                          <User className="h-12 w-12" />
                        }
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-3xl font-bold text-white">{getDisplayName(selectedSeller)}</h2>
                      <div className="flex items-center gap-3 mt-2">
                        <Badge variant="outline" className={`
                          px-3 py-1 
                          ${selectedSeller.accountType === "business" ? "bg-blue-500/10 text-blue-400" : "bg-purple-500/10 text-purple-400"}
                        `}>
                          {selectedSeller.accountType === "business" ? 
                            <Briefcase className="h-4 w-4 mr-2" /> : 
                            <User className="h-4 w-4 mr-2" />
                          }
                          {selectedSeller.accountType}
                        </Badge>
                        <Badge variant="outline" className={`
                          px-3 py-1
                          ${selectedSeller.isVerified ? "bg-green-500/10 text-green-400" : "bg-yellow-500/10 text-yellow-400"}
                        `}>
                          {selectedSeller.isVerified ? 
                            <CheckCircle2 className="h-4 w-4 mr-2" /> : 
                            <Clock className="h-4 w-4 mr-2" />
                          }
                          {selectedSeller.isVerified ? "Verified" : "Pending Verification"}
                        </Badge>
                        {selectedSeller.isFeatured && (
                          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 px-3 py-1">
                            <Star className="h-4 w-4 mr-2 fill-current" />
                            Featured Seller
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Column - Contact & Basic Info */}
                <div className="space-y-6">
                  <div className="bg-zinc-900 rounded-lg p-5 border border-zinc-800">
                    <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                      <Mail className="h-5 w-5 text-zinc-400" />
                      Contact Information
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm text-zinc-400">Email</label>
                        <p className="text-zinc-100">{selectedSeller.email}</p>
                      </div>
                      <div>
                        <label className="text-sm text-zinc-400">Phone</label>
                        <p className="text-zinc-100">{selectedSeller.phoneNumber}</p>
                      </div>
                      {selectedSeller.accountType === "business" && (
                        <>
                          <div>
                            <label className="text-sm text-zinc-400">Business Email</label>
                            <p className="text-zinc-100">{selectedSeller.businessEmail}</p>
                          </div>
                          <div>
                            <label className="text-sm text-zinc-400">Business Phone</label>
                            <p className="text-zinc-100">{selectedSeller.businessNumber}</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {selectedSeller.businessAddress && (
                    <div className="bg-zinc-900 rounded-lg p-5 border border-zinc-800">
                      <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-zinc-400" />
                        Business Address
                      </h3>
                      <div className="space-y-2 text-zinc-100">
                        <p>{selectedSeller.businessAddress.addressLine1}</p>
                        {selectedSeller.businessAddress.addressLine2 && (
                          <p>{selectedSeller.businessAddress.addressLine2}</p>
                        )}
                        <p>
                          {selectedSeller.businessAddress.city}, {selectedSeller.businessAddress.state}
                        </p>
                        <p>{selectedSeller.businessAddress.zipCode}</p>
                        <p>{selectedSeller.businessAddress.country}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Middle Column - Stats & Performance */}
                <div className="space-y-6 md:col-span-2">
                  {/* Store Statistics */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-zinc-900 p-5 rounded-lg border border-zinc-800">
                      <h3 className="text-sm font-medium text-zinc-400">Store Visits</h3>
                      <div className="mt-2 flex items-center gap-2">
                        <Eye className="h-5 w-5 text-blue-400" />
                        <span className="text-2xl font-bold text-white">
                          {selectedSeller.storeVisits || 0}
                        </span>
                      </div>
                    </div>
                    
                    <div className="bg-zinc-900 p-5 rounded-lg border border-zinc-800">
                      <h3 className="text-sm font-medium text-zinc-400">Wallet Balance</h3>
                      <div className="mt-2 flex items-center gap-2">
                        <Wallet className="h-5 w-5 text-green-400" />
                        <span className="text-2xl font-bold text-white">
                          ${selectedSeller.walletBalance || 0}
                        </span>
                      </div>
                    </div>

                    <div className="bg-zinc-900 p-5 rounded-lg border border-zinc-800">
                      <h3 className="text-sm font-medium text-zinc-400">Total Campaigns</h3>
                      <div className="mt-2 flex items-center gap-2">
                        <Megaphone className="h-5 w-5 text-purple-400" />
                        <span className="text-2xl font-bold text-white">
                          {selectedSeller.campaignStats?.totalCampaigns || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Campaign Performance */}
                  {selectedSeller.campaignStats && (
                    <div className="bg-zinc-900 p-5 rounded-lg border border-zinc-800">
                      <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                        <LineChart className="h-5 w-5 text-zinc-400" />
                        Campaign Performance
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-zinc-400">Recipients</p>
                          <p className="text-xl font-bold text-white mt-1">
                            {selectedSeller.campaignStats.totalRecipients}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-zinc-400">Opens</p>
                          <p className="text-xl font-bold text-white mt-1">
                            {selectedSeller.campaignStats.totalOpens}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-zinc-400">Clicks</p>
                          <p className="text-xl font-bold text-white mt-1">
                            {selectedSeller.campaignStats.totalClicks}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-zinc-400">Daily Campaigns</p>
                          <p className="text-xl font-bold text-white mt-1">
                            {selectedSeller.campaignStats.dailyCampaignCount}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Categories */}
                  {selectedSeller.categories && selectedSeller.categories.length > 0 && (
                    <div className="bg-zinc-900 p-5 rounded-lg border border-zinc-800">
                      <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                        <Tags className="h-5 w-5 text-zinc-400" />
                        Store Categories
                      </h3>
                      <div className="space-y-3">
                        {selectedSeller.categories.map((category) => (
                          <div key={category._id} className="bg-zinc-800 p-3 rounded-lg">
                            <div className="font-medium text-white">{category.name}</div>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {category.subCategories.map((sub) => (
                                <Badge 
                                  key={sub._id} 
                                  variant="outline"
                                  className="bg-zinc-700/50 text-zinc-300"
                                >
                                  {sub.name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Documents */}
                  {selectedSeller.verificationDocuments?.documents?.length > 0 && (
                    <div className="bg-zinc-900 p-5 rounded-lg border border-zinc-800">
                      <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                        <FileText className="h-5 w-5 text-zinc-400" />
                        Verification Documents
                      </h3>
                      <div className="grid gap-4 sm:grid-cols-2">
                        {selectedSeller.verificationDocuments.documents.map((doc) => (
                          <div 
                            key={doc._id} 
                            className="bg-zinc-800 p-4 rounded-lg flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3">
                              <File className="h-5 w-5 text-zinc-400" />
                              <div>
                                <p className="text-zinc-100 capitalize">
                                  {doc.documentType.replace(/([A-Z])/g, ' $1').trim()}
                                </p>
                                <p className="text-xs text-zinc-400">
                                  Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(doc.fileUrl, "_blank")}
                              className="text-blue-400 hover:text-blue-300"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent className="bg-zinc-950 text-zinc-100 border border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-white">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Reject Seller Verification
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">
                Rejection Reason*
              </label>
              <Input
                placeholder="Enter the main reason for rejection"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="bg-zinc-900 border-zinc-800"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">
                Additional Details
              </label>
              <Textarea
                placeholder="Provide any additional details or instructions"
                value={rejectDetails}
                onChange={(e) => setRejectDetails(e.target.value)}
                className="bg-zinc-900 border-zinc-800"
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowRejectModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectReason || isRejecting}
            >
              {isRejecting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Reject Verification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Sellers
