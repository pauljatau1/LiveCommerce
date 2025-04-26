import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/api/axios";
import { SellerService } from "@/services/sellerService";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertCircle,
  ArrowLeft,
  Ban,
  Briefcase,
  Building,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Download,
  ExternalLink,
  Eye,
  File,
  FileText,
  LineChart,
  Loader2,
  Mail,
  MapPin,
  Megaphone,
  MessageCircle,
  Package,
  Phone,
  Settings,
  ShieldCheck,
  Star,
  Store,
  Tags,
  User,
  UserCheck,
  Users,
  Video,
  Wallet,
  XCircle,
  Pencil
} from "lucide-react";
import EditSellerForm from "@/components/sellers/EditSellerForm";

// Interface declarations (same as in sellers.tsx)
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
  sellerAddress?: BusinessAddress;
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
  reviews?: {
    _id: string;
    rating: number;
    comment: string;
    isVerifiedPurchase: boolean;
    createdAt: string;
    reply?: {
      content: string;
      updatedAt: string;
    };
  }[];
  followers?: {
    _id: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    followDate: string;
    totalOrders?: number;
    lastInteraction?: string;
  }[];
  customers?: {
    _id: string;
    firstName: string;
    lastName: string;
    firstPurchaseDate: string;
    totalSpent?: number;
    totalOrders: number;
  }[];
  storeName?: string;
  aboutStore?: string;
  socialMedia?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    tiktok?: string;
    youtube?: string;
  };
  operatingHours?: {
    monday?: { isOpen: boolean; openTime: string; closeTime: string };
    tuesday?: { isOpen: boolean; openTime: string; closeTime: string };
    wednesday?: { isOpen: boolean; openTime: string; closeTime: string };
    thursday?: { isOpen: boolean; openTime: string; closeTime: string };
    friday?: { isOpen: boolean; openTime: string; closeTime: string };
    saturday?: { isOpen: boolean; openTime: string; closeTime: string };
    sunday?: { isOpen: boolean; openTime: string; closeTime: string };
  };
  timezone?: string;
  storePolicy?: {
    deliveryTimes?: string;
    freeShippingPolicy?: string;
    processingTime?: string;
    refundMethod?: string;
    nonRefundableItems?: string[];
    returnWindow?: number;
    returnShipping?: string;
    exchangePolicy?: string;
    allowsCod?: boolean;
  };
}

function SellerDetail() {
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectDetails, setRejectDetails] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    // Set loading state
    setLoading(true);
    
    const fetchSellerData = async () => {
      try {
        const response = await api.get(`/api/admin/sellers/${id}/details`);
        if (response.data && response.data.success) {
          setSeller(response.data.data.seller);
          setMetrics(response.data.data.metrics);
          setRecentActivity(response.data.data.recentActivity);
          setAnalytics(response.data.data.analytics);
        } else {
          throw new Error("Failed to fetch seller data");
        }
      } catch (error) {
        console.error("Error fetching seller details:", error);
        setSeller(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchSellerData();
    } else {
      setLoading(false);
      setSeller(null);
    }
  }, [id]);

  const getDisplayName = (seller: Seller) => {
    if (seller.storeName) {
      return seller.storeName;
    } else if (seller.businessName) {
      return seller.businessName;
    } else if (seller.firstName || seller.lastName) {
      return `${seller.firstName || ''} ${seller.lastName || ''}`.trim();
    } else {
      return "Unnamed Seller";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleToggleFeature = async () => {
    if (!seller) return;
    
    setActionLoading('feature');
    try {
      await SellerService.toggleFeature(seller._id);
      setSeller({ ...seller, isFeatured: !seller.isFeatured });
    } catch (error) {
      console.error("Error toggling featured status:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleVerification = async () => {
    if (!seller) return;
    
    setActionLoading('verify');
    try {
      if (seller.isVerified) {
        await SellerService.revokeVerification(seller._id);
      } else {
        await SellerService.verifySeller(seller._id);
      }
      setSeller({ ...seller, isVerified: !seller.isVerified });
    } catch (error) {
      console.error("Error toggling verification status:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleDisabled = async () => {
    if (!seller) return;
    
    setActionLoading('disable');
    try {
      if (seller.isDisabled) {
        await SellerService.enableSeller(seller._id);
      } else {
        await SellerService.disableSeller(seller._id);
      }
      setSeller({ ...seller, isDisabled: !seller.isDisabled });
    } catch (error) {
      console.error("Error toggling disabled status:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectVerification = async () => {
    if (!seller || !rejectReason) return;
    
    setActionLoading('reject');
    try {
      await SellerService.rejectVerification(seller._id, {
        reason: rejectReason,
        details: rejectDetails
      });
      setSeller({ ...seller, isVerified: false, onboardingProcess: 'rejected' });
      setShowRejectModal(false);
      setRejectReason("");
      setRejectDetails("");
    } catch (error) {
      console.error("Error rejecting verification:", error);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle seller data update
  const handleSellerUpdate = (updatedData: any) => {
    setSeller(updatedData);
    setShowEditModal(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h2 className="text-2xl font-bold">Seller Not Found</h2>
        <p className="text-muted-foreground">The seller you're looking for doesn't exist or was removed.</p>
        <Button className="bg-blue-600 hover:bg-blue-700" asChild>
          <Link to="/dashboard/sellers">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sellers
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button className="bg-gray-600 hover:bg-blue-700" size="sm" asChild>
            <Link to="/dashboard/sellers">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go back
            </Link>
          </Button>
        
        </div>
        <div className="flex items-center gap-2">
          {/* Add Edit Button */}
          <Button 
            variant="default" 
            size="sm"
            onClick={() => setShowEditModal(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Pencil className="h-4 w-4 mr-2" />
            Edit Seller
          </Button>
          
          {/* Action Buttons */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-green-600 hover:bg-blue-700" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {/* Verification Actions */}
              <DropdownMenuLabel>Verification</DropdownMenuLabel>
              <DropdownMenuItem 
                onClick={handleToggleVerification}
                disabled={actionLoading === 'verify'}
                className="flex items-center cursor-pointer"
              >
                {actionLoading === 'verify' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : seller?.isVerified ? (
                  <XCircle className="h-4 w-4 mr-2 text-destructive" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2 text-green-400" />
                )}
                {seller?.isVerified ? "Revoke Verification" : "Verify Seller"}
              </DropdownMenuItem>
              
              {!seller?.isVerified && (
                <DropdownMenuItem 
                  onClick={() => setShowRejectModal(true)}
                  disabled={actionLoading !== null}
                  className="flex items-center cursor-pointer"
                >
                  <AlertCircle className="h-4 w-4 mr-2 text-destructive" />
                  Reject Verification
                </DropdownMenuItem>
              )}
              
              <DropdownMenuSeparator />
              
              {/* Store Status */}
              <DropdownMenuLabel>Store Status</DropdownMenuLabel>
              <DropdownMenuItem 
                onClick={handleToggleDisabled}
                disabled={actionLoading === 'disable'}
                className="flex items-center cursor-pointer"
              >
                {actionLoading === 'disable' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : seller?.isDisabled ? (
                  <CheckCircle2 className="h-4 w-4 mr-2 text-green-400" />
                ) : (
                  <Ban className="h-4 w-4 mr-2 text-destructive" />
                )}
                {seller?.isDisabled ? "Enable Seller" : "Disable Seller"}
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              {/* Featured Status */}
              <DropdownMenuLabel>Featured Status</DropdownMenuLabel>
              <DropdownMenuItem 
                onClick={handleToggleFeature}
                disabled={actionLoading === 'feature'}
                className="flex items-center cursor-pointer"
              >
                {actionLoading === 'feature' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Star className={`h-4 w-4 mr-2 ${seller?.isFeatured ? "text-yellow-400 fill-current" : "text-muted-foreground"}`} />
                )}
                {seller?.isFeatured ? "Remove from Featured" : "Mark as Featured"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
         
        </div>
      </div>

      {/* Banner Section */}
      <div className="relative rounded-lg overflow-hidden bg-gradient-to-b from-zinc-800 to-zinc-900">
        {seller.storeBanner?.url && (
          <div className="h-48 w-full">
            <img 
              src={seller.storeBanner.url} 
              alt="Store Banner"
              className="w-full h-full object-cover opacity-40"
            />
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-zinc-950/90 to-transparent">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <Avatar className="h-24 w-24 border-4 border-zinc-950">
              <AvatarImage src={seller.storeAvatar?.url} />
              <AvatarFallback className="bg-zinc-800">
                {seller.accountType === "business" ? 
                  <Building className="h-12 w-12" /> : 
                  <User className="h-12 w-12" />
                }
              </AvatarFallback>
            </Avatar>
            <div className="text-center md:text-left">
              <h2 className="text-3xl font-bold text-white">{getDisplayName(seller)}</h2>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-2">
                <Badge variant="outline" className={`
                  px-2 py-1 
                  ${seller.accountType === "business" ? "bg-blue-500/10 text-blue-400" : "bg-purple-500/10 text-purple-400"}
                `}>
                  {seller.accountType === "business" ? 
                    <Building className="h-3 w-3 mr-1" /> : 
                    <User className="h-3 w-3 mr-1" />
                  }
                  {seller.accountType === "business" ? "Business" : "Individual"}
                </Badge>
                <Badge variant="outline" className={`
                  px-2 py-1
                  ${seller.isVerified ? "bg-green-500/10 text-green-400" : "bg-yellow-500/10 text-yellow-400"}
                `}>
                  {seller.isVerified ? 
                    <CheckCircle2 className="h-3 w-3 mr-1" /> : 
                    <Clock className="h-3 w-3 mr-1" />
                  }
                  {seller.isVerified ? "Verified" : "Pending Verification"}
                </Badge>
                {seller.isFeatured && (
                  <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 px-2 py-1">
                    <Star className="h-3 w-3 mr-1 fill-current" />
                    Featured Seller
                  </Badge>
                )}
                {seller.isProfileComplete && (
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-400 px-2 py-1">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Profile Complete
                  </Badge>
                )}
              </div>
              <div className="flex items-center justify-center md:justify-start gap-2 mt-2 text-sm text-zinc-400">
                <span>ID: {seller._id}</span>
                <span>•</span>
                <span>Joined {formatDate(seller.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-4 w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sales">Sales & Orders</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="finances">Finances</TabsTrigger>
          <TabsTrigger value="followers">Followers</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="p-4 bg-zinc-900 border-zinc-800">
              <div className="flex flex-col">
                <span className="text-sm text-zinc-400">Store Visits</span>
                <div className="mt-2 flex items-center gap-2">
                  <Eye className="h-5 w-5 text-blue-400" />
                  <span className="text-2xl font-bold text-white">{seller.storeVisits?.toLocaleString() || 0}</span>
                </div>
              </div>
            </Card>
            
            <Card className="p-4 bg-zinc-900 border-zinc-800">
              <div className="flex flex-col">
                <span className="text-sm text-zinc-400">Wallet Balance</span>
                <div className="mt-2 flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-green-400" />
                  <span className="text-2xl font-bold text-white">${seller.walletBalance?.toLocaleString() || 0}</span>
                </div>
              </div>
            </Card>
            
            <Card className="p-4 bg-zinc-900 border-zinc-800">
              <div className="flex flex-col">
                <span className="text-sm text-zinc-400">Avg. Rating</span>
                <div className="mt-2 flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-400" />
                  <span className="text-2xl font-bold text-white">{seller.stats?.averageRating || 0}</span>
                </div>
              </div>
            </Card>
            
            <Card className="p-4 bg-zinc-900 border-zinc-800">
              <div className="flex flex-col">
                <span className="text-sm text-zinc-400">Total Reviews</span>
                <div className="mt-2 flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-purple-400" />
                  <span className="text-2xl font-bold text-white">{seller.stats?.totalReviews || 0}</span>
                </div>
              </div>
            </Card>
          </div>
          
          {/* Additional Metrics */}
          {metrics && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card className="p-4 bg-zinc-900 border-zinc-800">
                <div className="flex flex-col">
                  <span className="text-sm text-zinc-400">Total Orders</span>
                  <div className="mt-2 flex items-center gap-2">
                    <Package className="h-5 w-5 text-orange-400" />
                    <span className="text-2xl font-bold text-white">{metrics.ordersCount || 0}</span>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4 bg-zinc-900 border-zinc-800">
                <div className="flex flex-col">
                  <span className="text-sm text-zinc-400">Total Products</span>
                  <div className="mt-2 flex items-center gap-2">
                    <Store className="h-5 w-5 text-indigo-400" />
                    <span className="text-2xl font-bold text-white">{metrics.productsCount || 0}</span>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4 bg-zinc-900 border-zinc-800">
                <div className="flex flex-col">
                  <span className="text-sm text-zinc-400">Streams</span>
                  <div className="mt-2 flex items-center gap-2">
                    <Video className="h-5 w-5 text-pink-400" />
                    <span className="text-2xl font-bold text-white">{metrics.streamsCount || 0}</span>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4 bg-zinc-900 border-zinc-800">
                <div className="flex flex-col">
                  <span className="text-sm text-zinc-400">Total Revenue</span>
                  <div className="mt-2 flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-emerald-400" />
                    <span className="text-2xl font-bold text-white">${metrics.totalRevenue?.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    }) || 0}</span>
                  </div>
                </div>
              </Card>
            </div>
          )}
          
          {/* Two-column layout for details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Contact Information */}
              <Card className="p-5 bg-zinc-900 border-zinc-800">
                <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                  <Mail className="h-5 w-5 text-zinc-400" />
                  Contact Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-zinc-400">Email</label>
                    <p className="text-zinc-100 break-words">{seller.email}</p>
                  </div>
                  <div>
                    <label className="text-sm text-zinc-400">Phone</label>
                    <p className="text-zinc-100">{seller.phoneNumber}</p>
                  </div>
                  {seller.accountType === "business" && (
                    <>
                      <div>
                        <label className="text-sm text-zinc-400">Business Email</label>
                        <p className="text-zinc-100 break-words">{seller.businessEmail}</p>
                      </div>
                      <div>
                        <label className="text-sm text-zinc-400">Business Phone</label>
                        <p className="text-zinc-100">{seller.businessNumber}</p>
                      </div>
                    </>
                  )}
                </div>
              </Card>
              
              {/* Business Address */}
              {seller.accountType === "business" && seller.businessAddress ? (
                <Card className="p-5 bg-zinc-900 border-zinc-800">
                  <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-zinc-400" />
                    Business Address
                  </h3>
                  <div className="space-y-2 text-zinc-100">
                    <p>{seller.businessAddress.addressLine1}</p>
                    {seller.businessAddress.addressLine2 && (
                      <p>{seller.businessAddress.addressLine2}</p>
                    )}
                    <p>
                      {seller.businessAddress.city}, {seller.businessAddress.state}
                    </p>
                    <p>{seller.businessAddress.zipCode}</p>
                    <p>{seller.businessAddress.country}</p>
                  </div>
                </Card>
              ) : seller.accountType === "individual" && seller.sellerAddress ? (
                <Card className="p-5 bg-zinc-900 border-zinc-800">
                  <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-zinc-400" />
                    Address
                  </h3>
                  <div className="space-y-2 text-zinc-100">
                    <p>{seller.sellerAddress.addressLine1}</p>
                    {seller.sellerAddress.addressLine2 && (
                      <p>{seller.sellerAddress.addressLine2}</p>
                    )}
                    <p>
                      {seller.sellerAddress.city}, {seller.sellerAddress.state}
                    </p>
                    <p>{seller.sellerAddress.zipCode}</p>
                    <p>{seller.sellerAddress.country}</p>
                  </div>
                </Card>
              ) : null}
            </div>
            
            {/* Middle/Right Column */}
            <div className="md:col-span-2 space-y-6">
              {/* Store Information */}
              {seller.aboutStore && (
                <Card className="p-5 bg-zinc-900 border-zinc-800">
                  <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                    <Store className="h-5 w-5 text-zinc-400" />
                    Store Information
                  </h3>
                  <div className="space-y-4">
                    {seller.storeName && (
                      <div>
                        <label className="text-sm text-zinc-400">Store Name</label>
                        <p className="text-zinc-100">{seller.storeName}</p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm text-zinc-400">About Store</label>
                      <p className="text-zinc-100">{seller.aboutStore}</p>
                    </div>
                    {seller.timezone && (
                      <div>
                        <label className="text-sm text-zinc-400">Timezone</label>
                        <p className="text-zinc-100">{seller.timezone}</p>
                      </div>
                    )}
                    {seller.socialMedia && Object.values(seller.socialMedia).some(value => value) && (
                      <div>
                        <label className="text-sm text-zinc-400">Social Media</label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {seller.socialMedia.instagram && (
                            <Button variant="outline" size="sm" className="h-8 px-2" asChild>
                              <a href={seller.socialMedia.instagram} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-3.5 w-3.5 mr-1" />
                                Instagram
                              </a>
                            </Button>
                          )}
                          {seller.socialMedia.facebook && (
                            <Button variant="outline" size="sm" className="h-8 px-2" asChild>
                              <a href={seller.socialMedia.facebook} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-3.5 w-3.5 mr-1" />
                                Facebook
                              </a>
                            </Button>
                          )}
                          {seller.socialMedia.twitter && (
                            <Button variant="outline" size="sm" className="h-8 px-2" asChild>
                              <a href={seller.socialMedia.twitter} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-3.5 w-3.5 mr-1" />
                                Twitter
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              )}

            

              {/* Store Policy */}
              {seller.storePolicy && (
                <Card className="p-5 bg-zinc-900 border-zinc-800">
                  <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-zinc-400" />
                    Store Policy
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {seller.storePolicy.deliveryTimes && (
                      <div>
                        <label className="text-sm text-zinc-400">Delivery Time</label>
                        <p className="text-zinc-100">{seller.storePolicy.deliveryTimes} days</p>
                      </div>
                    )}
                    {seller.storePolicy.processingTime && (
                      <div>
                        <label className="text-sm text-zinc-400">Processing Time</label>
                        <p className="text-zinc-100">{seller.storePolicy.processingTime}</p>
                      </div>
                    )}
                    {seller.storePolicy.returnWindow && (
                      <div>
                        <label className="text-sm text-zinc-400">Return Window</label>
                        <p className="text-zinc-100">{seller.storePolicy.returnWindow} days</p>
                      </div>
                    )}
                    {seller.storePolicy.returnShipping && (
                      <div>
                        <label className="text-sm text-zinc-400">Return Shipping</label>
                        <p className="text-zinc-100 capitalize">{seller.storePolicy.returnShipping.replace(/_/g, ' ')}</p>
                      </div>
                    )}
                    {seller.storePolicy.refundMethod && (
                      <div>
                        <label className="text-sm text-zinc-400">Refund Method</label>
                        <p className="text-zinc-100 capitalize">{seller.storePolicy.refundMethod.replace(/_/g, ' ')}</p>
                      </div>
                    )}
                    {seller.storePolicy.freeShippingPolicy && (
                      <div>
                        <label className="text-sm text-zinc-400">Free Shipping</label>
                        <p className="text-zinc-100 capitalize">{seller.storePolicy.freeShippingPolicy.replace(/_/g, ' ')}</p>
                      </div>
                    )}
                    {seller.storePolicy.exchangePolicy && (
                      <div>
                        <label className="text-sm text-zinc-400">Exchange Policy</label>
                        <p className="text-zinc-100 capitalize">{seller.storePolicy.exchangePolicy.replace(/_/g, ' ')}</p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm text-zinc-400">Cash on Delivery</label>
                      <p className="text-zinc-100">{seller.storePolicy.allowsCod ? 'Accepted' : 'Not accepted'}</p>
                    </div>
                  </div>
                </Card>
              )}

             
              
              {/* Bank Details */}
              {seller.bankDetails && (
                <Card className="p-5 bg-zinc-900 border-zinc-800">
                  <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                    <Building className="h-5 w-5 text-zinc-400" />
                    Bank Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-zinc-400">Bank Name</label>
                      <p className="text-zinc-100">{seller.bankDetails.bankName}</p>
                    </div>
                    <div>
                      <label className="text-sm text-zinc-400">Account Type</label>
                      <p className="text-zinc-100">{seller.bankDetails.bankAccountType}</p>
                    </div>
                    <div>
                      <label className="text-sm text-zinc-400">Account Name</label>
                      <p className="text-zinc-100">{seller.bankDetails.accountName}</p>
                    </div>
                    <div>
                      <label className="text-sm text-zinc-400">Account Number</label>
                      <p className="text-zinc-100">{seller.bankDetails.accountNumber}</p>
                    </div>
                    <div>
                      <label className="text-sm text-zinc-400">Currency</label>
                      <p className="text-zinc-100">{seller.bankDetails.accountCurrency}</p>
                    </div>
                    {seller.bankDetails.swiftCode && (
                      <div>
                        <label className="text-sm text-zinc-400">SWIFT Code</label>
                        <p className="text-zinc-100">{seller.bankDetails.swiftCode}</p>
                      </div>
                    )}
                  </div>
                </Card>
              )}
              
              {/* Categories */}
              {seller.categories && seller.categories.length > 0 && (
                <Card className="p-5 bg-zinc-900 border-zinc-800">
                  <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                    <Tags className="h-5 w-5 text-zinc-400" />
                    Store Categories
                  </h3>
                  <div className="space-y-4">
                    {seller.categories.map((category) => (
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
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
        
        {/* Placeholder for other tabs */}
        <TabsContent value="sales">
          <div className="space-y-6">
            {/* Recent Orders */}
            <Card className="p-5 bg-zinc-900 border-zinc-800">
              <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                <Package className="h-5 w-5 text-zinc-400" />
                Recent Orders
              </h3>
              
              {recentActivity?.orders && recentActivity.orders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="text-left text-xs text-zinc-400 border-b border-zinc-800">
                        <th className="pb-2 font-medium">Order ID</th>
                        <th className="pb-2 font-medium">Customer</th>
                        <th className="pb-2 font-medium">Date</th>
                        <th className="pb-2 font-medium">Amount</th>
                        <th className="pb-2 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {recentActivity.orders.slice(0, 5).map((order: any) => (
                        <tr key={order._id} className="text-zinc-200">
                          <td className="py-3 text-sm font-medium">{order.order_id}</td>
                          <td className="py-3 text-sm">
                            {order.buyer?.firstName} {order.buyer?.lastName}
                          </td>
                          <td className="py-3 text-sm text-zinc-400">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 text-sm">${order.totalAmount?.toLocaleString()}</td>
                          <td className="py-3 text-sm">
                            <Badge variant="outline" className={`
                              ${order.items[0]?.status === 'completed' ? 'bg-green-500/10 text-green-400' : 
                                order.items[0]?.status === 'cancelled' ? 'bg-red-500/10 text-red-400' : 
                                'bg-yellow-500/10 text-yellow-400'}
                            `}>
                              {order.items[0]?.status || 'pending'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-6 text-zinc-400">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No recent orders</p>
                </div>
              )}
            </Card>
            
            {/* Sales Analytics */}
            {analytics?.salesByMonth && (
              <Card className="p-5 bg-zinc-900 border-zinc-800">
                <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                  <LineChart className="h-5 w-5 text-zinc-400" />
                  Monthly Sales
                </h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="text-left text-xs text-zinc-400 border-b border-zinc-800">
                        <th className="pb-2 font-medium">Month</th>
                        <th className="pb-2 font-medium">Orders</th>
                        <th className="pb-2 font-medium">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {analytics.salesByMonth.map((month: any) => (
                        <tr key={`${month._id.year}-${month._id.month}`} className="text-zinc-200">
                          <td className="py-3 text-sm font-medium">
                            {new Date(month._id.year, month._id.month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                          </td>
                          <td className="py-3 text-sm">{month.count}</td>
                          <td className="py-3 text-sm text-green-400">
                            ${month.totalSales.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="products">
          <Card className="p-5 bg-zinc-900 border-zinc-800">
            <h3 className="text-xl font-semibold text-center py-8 text-zinc-400">
              Products data will be displayed here
            </h3>
          </Card>
        </TabsContent>
        
        <TabsContent value="finances">
          <div className="space-y-6">
            {/* Recent Transactions */}
            <Card className="p-5 bg-zinc-900 border-zinc-800">
              <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-zinc-400" />
                Recent Transactions
              </h3>
              
              {recentActivity?.transactions && recentActivity.transactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="text-left text-xs text-zinc-400 border-b border-zinc-800">
                        <th className="pb-2 font-medium">Date</th>
                        <th className="pb-2 font-medium">Type</th>
                        <th className="pb-2 font-medium">Description</th>
                        <th className="pb-2 font-medium">Amount</th>
                        <th className="pb-2 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {recentActivity.transactions.slice(0, 5).map((transaction: any) => (
                        <tr key={transaction._id} className="text-zinc-200">
                          <td className="py-3 text-sm text-zinc-400">
                            {new Date(transaction.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 text-sm">
                            <Badge variant="outline" className={`
                              ${transaction.type === 'order_payment' ? 'bg-green-500/10 text-green-400' : 
                                transaction.type === 'withdrawal' ? 'bg-blue-500/10 text-blue-400' : 
                                transaction.type === 'processing_fee' ? 'bg-orange-500/10 text-orange-400' : 
                                'bg-zinc-500/10 text-zinc-400'}
                            `}>
                              {transaction.type.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="py-3 text-sm">{transaction.description}</td>
                          <td className={`py-3 text-sm font-medium ${transaction.type === 'processing_fee' ? 'text-red-400' : 'text-green-400'}`}>
                            {transaction.type === 'processing_fee' ? '-' : ''}${transaction.amount.toLocaleString()}
                          </td>
                          <td className="py-3 text-sm">
                            <Badge variant="outline" className={`
                              ${transaction.status === 'completed' ? 'bg-green-500/10 text-green-400' : 
                                transaction.status === 'failed' ? 'bg-red-500/10 text-red-400' : 
                                'bg-yellow-500/10 text-yellow-400'}
                            `}>
                              {transaction.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-6 text-zinc-400">
                  <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No recent transactions</p>
                </div>
              )}
            </Card>
            
            {/* Withdrawals */}
            <Card className="p-5 bg-zinc-900 border-zinc-800">
              <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                <Wallet className="h-5 w-5 text-zinc-400" />
                Withdrawal History
              </h3>
              
              {recentActivity?.withdrawals && recentActivity.withdrawals.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="text-left text-xs text-zinc-400 border-b border-zinc-800">
                        <th className="pb-2 font-medium">Reference</th>
                        <th className="pb-2 font-medium">Date</th>
                        <th className="pb-2 font-medium">Account</th>
                        <th className="pb-2 font-medium">Amount</th>
                        <th className="pb-2 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {recentActivity.withdrawals.map((withdrawal: any) => (
                        <tr key={withdrawal._id} className="text-zinc-200">
                          <td className="py-3 text-sm font-medium">{withdrawal.reference}</td>
                          <td className="py-3 text-sm text-zinc-400">
                            {new Date(withdrawal.requestDate).toLocaleDateString()}
                          </td>
                          <td className="py-3 text-sm">
                            {withdrawal.bankDetails?.accountName} 
                            <span className="text-zinc-500">
                              {withdrawal.bankDetails?.accountNumber ? 
                                ` (${withdrawal.bankDetails.accountNumber.slice(-4).padStart(withdrawal.bankDetails.accountNumber.length, '*')})` 
                                : ''}
                            </span>
                          </td>
                          <td className="py-3 text-sm font-medium text-green-400">
                            ${withdrawal.amount.toLocaleString()}
                          </td>
                          <td className="py-3 text-sm">
                            <Badge variant="outline" className={`
                              ${withdrawal.status === 'completed' ? 'bg-green-500/10 text-green-400' : 
                                withdrawal.status === 'rejected' ? 'bg-red-500/10 text-red-400' : 
                                'bg-yellow-500/10 text-yellow-400'}
                            `}>
                              {withdrawal.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-6 text-zinc-400">
                  <Wallet className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No withdrawal history</p>
                </div>
              )}
            </Card>
          </div>
        </TabsContent>
        
        {/* Followers Tab */}
        <TabsContent value="followers">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Followers List */}
            <Card className="p-5 bg-zinc-900 border-zinc-800">
              <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-zinc-400" />
                Followers ({seller.followers?.length || 0})
              </h3>
              
              {seller.followers && seller.followers.length > 0 ? (
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                  {seller.followers.map((follower) => (
                    <div key={follower._id} className="bg-zinc-800 p-3 rounded-lg flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-zinc-700">
                        <AvatarFallback>
                          {follower.firstName?.[0] || follower.name?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-zinc-100 truncate">
                          {follower.firstName && follower.lastName 
                            ? `${follower.firstName} ${follower.lastName}`
                            : follower.name || "Anonymous User"}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-zinc-400">
                          {follower.followDate && (
                            <span>Followed: {new Date(follower.followDate).toLocaleDateString()}</span>
                          )}
                          {follower.totalOrders !== undefined && (
                            <Badge variant="outline" className="text-xs">
                              {follower.totalOrders} Orders
                            </Badge>
                          )}
                        </div>
                      </div>
                      {follower.lastInteraction && (
                        <Badge 
                          variant="outline" 
                          className="bg-blue-500/10 text-blue-400 text-xs whitespace-nowrap"
                          title={`Last interaction: ${new Date(follower.lastInteraction).toLocaleString()}`}
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-zinc-400">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No followers yet</p>
                </div>
              )}
            </Card>
            
            {/* Customers List */}
            <Card className="p-5 bg-zinc-900 border-zinc-800">
              <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-zinc-400" />
                Top Customers ({seller.customers?.length || 0})
              </h3>
              
              {seller.customers && seller.customers.length > 0 ? (
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                  {seller.customers.map((customer) => (
                    <div key={customer._id} className="bg-zinc-800 p-3 rounded-lg flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-zinc-700">
                        <AvatarFallback>
                          {customer.firstName?.[0] || "C"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-zinc-100 truncate">
                          {customer.firstName} {customer.lastName}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-zinc-400">
                          <span>First purchase: {new Date(customer.firstPurchaseDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-green-400">${customer.totalSpent?.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}</p>
                        <Badge variant="outline" className="text-xs mt-1">
                          {customer.totalOrders} Orders
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-zinc-400">
                  <UserCheck className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No customers yet</p>
                </div>
              )}
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="documents">
          {seller?.verificationDocuments?.documents && seller.verificationDocuments.documents.length > 0 ? (
            <Card className="p-5 bg-zinc-900 border-zinc-800">
              <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-zinc-400" />
                Verification Documents
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {seller.verificationDocuments.documents.map((doc) => (
                  <div 
                    key={doc._id} 
                    className="bg-zinc-800 p-4 rounded-lg flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <File className="h-5 w-5 text-zinc-400 flex-shrink-0" />
                      <div className="overflow-hidden">
                        <p className="text-zinc-100 capitalize truncate">
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
                      className="text-blue-400 hover:text-blue-300 flex-shrink-0"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <Card className="p-5 bg-zinc-900 border-zinc-800">
              <h3 className="text-xl font-semibold text-center py-8 text-zinc-400">
                No documents available
              </h3>
            </Card>
          )}
          
          {/* Reviews Section */}
          {seller?.reviews && seller.reviews.length > 0 && (
            <Card className="p-5 bg-zinc-900 border-zinc-800 mt-6">
              <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-zinc-400" />
                Customer Reviews
              </h3>
              <div className="space-y-4">
                {seller.reviews.map((review) => (
                  <div key={review._id} className="bg-zinc-800 p-4 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`h-4 w-4 ${i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-zinc-600"}`} 
                            />
                          ))}
                        </div>
                        <span className="text-sm text-zinc-400">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {review.isVerifiedPurchase && (
                        <Badge variant="outline" className="bg-green-500/10 text-green-400 text-xs">
                          Verified Purchase
                        </Badge>
                      )}
                    </div>
                    <p className="mt-2 text-zinc-200">{review.comment}</p>
                    {review.reply && (
                      <div className="mt-3 pl-4 border-l-2 border-zinc-700">
                        <p className="text-sm text-zinc-400 mb-1">Seller's reply:</p>
                        <p className="text-sm text-zinc-300">{review.reply.content}</p>
                        <p className="text-xs text-zinc-500 mt-1">
                          {new Date(review.reply.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Rejection Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent className="bg-zinc-950 text-zinc-100 border border-zinc-800 max-w-md">
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

          <DialogFooter className="flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
            <Button
              variant="ghost"
              onClick={() => setShowRejectModal(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectVerification}
              disabled={!rejectReason || actionLoading === 'reject'}
              className="w-full sm:w-auto"
            >
              {actionLoading === 'reject' ? (
                <Loader2 className="h-4 animate-spin mr-2" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Reject Verification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Seller Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="bg-zinc-950 text-zinc-100 border border-zinc-800 max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Edit Seller Information
            </DialogTitle>
          </DialogHeader>
          
          {seller && (
            <EditSellerForm
              sellerId={seller._id}
              initialData={seller}
              onSuccess={handleSellerUpdate}
              onCancel={() => setShowEditModal(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default SellerDetail; 