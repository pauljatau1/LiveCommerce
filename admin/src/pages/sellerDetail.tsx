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
  Pencil,
  Search,
  Filter,
  X,
  Trash2,
  Tag,
  Package2,
  BarChart2,
  PlusCircle,
  MinusCircle,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard
} from "lucide-react";
import EditSellerForm from "@/components/sellers/EditSellerForm";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

interface ProductStats {
  views?: number;
  soldCount?: number;
  averageRating?: number;
  reviewCount?: number;
}

interface ProductDiscount {
  isActive: boolean;
  type: string;
  value: number;
  discountedPrice?: number;
}

interface ProductInventory {
  quantity?: number;
  lowStockThreshold?: number;
  sku?: string;
}

interface Product {
  _id: string;
  id?: string;
  name: string;
  brand?: string;
  category: string;
  subCategory?: string;
  price: number;
  discountedPrice?: number;
  stock: number;
  status: string;
  sku?: string;
  upc?: string;
  visibility?: string;
  createdAt?: string;
  updatedAt?: string;
  condition?: string;
  discount?: ProductDiscount;
  seller?: Seller;
  stats?: ProductStats;
  inventory?: ProductInventory;
  images: {
    url: string;
    _id?: string;
  }[];
  reviews?: any[];
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
  const [loading, setLoading] = useState(true);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectDetails, setRejectDetails] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);

  // Wallet management state
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  const [showDeductFundsModal, setShowDeductFundsModal] = useState(false);
  const [walletAmount, setWalletAmount] = useState<string>('');
  const [walletReason, setWalletReason] = useState<string>('');
  const [walletLoading, setWalletLoading] = useState<boolean>(false);

  // Products state
  const [sellerProducts, setSellerProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [productsPagination, setProductsPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalProducts: 0,
    productsPerPage: 10
  });
  const [productsFilter, setProductsFilter] = useState({
    status: '',
    category: '',
    search: '',
    sortBy: 'newest'
  });
  const [showDeleteProductModal, setShowDeleteProductModal] = useState(false);
  const [showDisableProductModal, setShowDisableProductModal] = useState(false);
  const [showDeleteAllProductsModal, setShowDeleteAllProductsModal] = useState(false);
  const [deleteAllProductsReason, setDeleteAllProductsReason] = useState("");
  const [isDeletingAllProducts, setIsDeletingAllProducts] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Tab state
  const [activeTab, setActiveTab] = useState('overview');

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

  // Fetch seller products when tab changes to products
  useEffect(() => {
    if (id && activeTab === 'products' && sellerProducts.length === 0) {
      fetchSellerProducts(true);
    }
  }, [id, activeTab]);

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

  // Format price to readable format with currency
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  // Fetch seller's products
  const fetchSellerProducts = async (isNewFilter = false) => {
    if (!id) return;

    try {
      // If it's a new filter, we start from page 1, otherwise we use the next page
      const page = isNewFilter ? 1 : productsPagination.currentPage + 1;
      
      if (isNewFilter) {
        setLoadingProducts(true);
      } else {
        setLoadingMore(true);
      }

      const params = {
        page,
        limit: productsPagination.productsPerPage,
        ...(productsFilter.status && { status: productsFilter.status }),
        ...(productsFilter.category && { category: productsFilter.category }),
        ...(productsFilter.search && { search: productsFilter.search }),
        sortBy: productsFilter.sortBy
      };

      const response = await SellerService.getSellerProducts(id, params);
      
      console.log("API Response:", response.data); // Log the response to check structure
      
      // Extract products and pagination from the response based on API structure
      const products = response.data.products || [];
      
      // Handle pagination data based on the API response structure
      const pagination = response.data.pagination || {
        currentPage: page,
        totalPages: 1,
        totalProducts: products.length,
        limit: productsPagination.productsPerPage
      };
      
      setProductsPagination({
        currentPage: pagination.currentPage,
        totalPages: pagination.totalPages,
        totalProducts: pagination.totalProducts,
        productsPerPage: pagination.limit
      });

      if (isNewFilter) {
        setSellerProducts(products);
      } else {
        setSellerProducts(prev => [...prev, ...products]);
      }
    } catch (error) {
      console.error("Error fetching seller products:", error);
      toast.error("Failed to load seller's products");
    } finally {
      setLoadingProducts(false);
      setLoadingMore(false);
    }
  };

  // Load more products
  const handleLoadMoreProducts = () => {
    if (productsPagination.currentPage < productsPagination.totalPages) {
      fetchSellerProducts(false);
    }
  };

  // Apply product filters
  const applyProductsFilter = () => {
    setProductsPagination(prev => ({ ...prev, currentPage: 1 }));
    fetchSellerProducts(true);
  };

  // Reset product filters
  const resetProductsFilter = () => {
    setProductsFilter({
      status: '',
      category: '',
      search: '',
      sortBy: 'newest'
    });
    setProductsPagination(prev => ({ ...prev, currentPage: 1 }));
    fetchSellerProducts(true);
  };

  // Handle product filter change
  const handleProductFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setProductsFilter(prev => ({ ...prev, [name]: value }));
  };

  // Handle delete product
  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;

    try {
      await SellerService.deleteProduct(selectedProduct._id);
      toast.success("Product deleted successfully");
      setSellerProducts(products => products.filter(p => p._id !== selectedProduct._id));
      setShowDeleteProductModal(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product");
    }
  };

  // Handle disable product
  const handleDisableProduct = async () => {
    if (!selectedProduct) return;

    try {
      await SellerService.disableProduct(selectedProduct._id);
      toast.success("Product disabled successfully");
      setSellerProducts(products => products.map(p => 
        p._id === selectedProduct._id ? { ...p, status: 'draft' } : p
      ));
      setShowDisableProductModal(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error("Error disabling product:", error);
      toast.error("Failed to disable product");
    }
  };

  // Get the product discount percentage
  const getDiscountPercentage = (product: Product) => {
    if (!product.discount?.isActive || !product.discount.value) return 0;
    return product.discount.type === 'percentage' ? 
      product.discount.value : 
      Math.round((product.discount.value / product.price) * 100);
  };

  // Handle adding funds to wallet
  const handleAddFunds = async () => {
    if (!id || !walletAmount || parseFloat(walletAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    try {
      setWalletLoading(true);
      
      const response = await SellerService.addToSellerWallet(id, {
        amount: parseFloat(walletAmount),
        reason: walletReason || "Manual fund addition by admin"
      });
      
      // Update the seller object with the new wallet balance
      setSeller(prevSeller => {
        if (!prevSeller) return null;
        return {
          ...prevSeller,
          walletBalance: response.data.newBalance || (prevSeller.walletBalance + parseFloat(walletAmount))
        };
      });
      
      toast.success(`Successfully added ${formatPrice(parseFloat(walletAmount))} to seller's wallet`);
      
      // Reset form and close modal
      setWalletAmount('');
      setWalletReason('');
      setShowAddFundsModal(false);
    } catch (error: any) {
      console.error("Error adding funds:", error);
      toast.error(error.response?.data?.message || "Failed to add funds to wallet");
    } finally {
      setWalletLoading(false);
    }
  };

  // Handle deducting funds from wallet
  const handleDeductFunds = async () => {
    if (!id || !walletAmount || parseFloat(walletAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    try {
      setWalletLoading(true);
      
      const response = await SellerService.deductFromSellerWallet(id, {
        amount: parseFloat(walletAmount),
        reason: walletReason || "Manual fund deduction by admin"
      });
      
      // Update the seller object with the new wallet balance
      setSeller(prevSeller => {
        if (!prevSeller) return null;
        return {
          ...prevSeller,
          walletBalance: response.data.newBalance || (prevSeller.walletBalance - parseFloat(walletAmount))
        };
      });
      
      toast.success(`Successfully deducted ${formatPrice(parseFloat(walletAmount))} from seller's wallet`);
      
      // Reset form and close modal
      setWalletAmount('');
      setWalletReason('');
      setShowDeductFundsModal(false);
    } catch (error: any) {
      console.error("Error deducting funds:", error);
      toast.error(error.response?.data?.message || "Failed to deduct funds from wallet");
    } finally {
      setWalletLoading(false);
    }
  };

  const handleDeleteAllProducts = async () => {
    if (!deleteAllProductsReason) {
      toast.error("Please provide a reason for deleting all products");
      return;
    }

    try {
      setIsDeletingAllProducts(true);
      
      await api.delete(`/api/admin/sellers/${id}/products`, {
        data: { reason: deleteAllProductsReason }
      });
      
      // Reset product list and counts
      setSellerProducts([]);
      setProductsPagination(prev => ({
        ...prev,
        currentPage: 1,
        totalPages: 0,
        totalProducts: 0
      }));
      
      toast.success("All products for this seller have been deleted");
      setShowDeleteAllProductsModal(false);
      setDeleteAllProductsReason("");
    } catch (error: any) {
      console.error("Error deleting all products:", error);
      toast.error(error.response?.data?.message || "Failed to delete all products");
    } finally {
      setIsDeletingAllProducts(false);
    }
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
          
          {/* Delete All Products Button */}
          {/* <Button 
            variant="destructive" 
            size="sm"
            onClick={() => setShowDeleteAllProductsModal(true)}
            className="bg-red-600 hover:bg-red-700"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete All Products
          </Button> */}
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
      <Tabs defaultValue="overview" className="w-full" onValueChange={setActiveTab}>
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
                  <span className="text-2xl font-semibold text-white">{seller.storeVisits?.toLocaleString() || 0}</span>
                </div>
              </div>
            </Card>
            
            <Card className="p-4 bg-zinc-900 border-zinc-800">
              <div className="flex flex-col">
                <span className="text-sm text-zinc-400">Wallet Balance</span>
                <div className="mt-2 flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-green-400" />
                  <span className="text-2xl font-semibold text-white">NGN {seller.walletBalance?.toLocaleString() || 0}</span>
                </div>
              </div>
            </Card>
            
            <Card className="p-4 bg-zinc-900 border-zinc-800">
              <div className="flex flex-col">
                <span className="text-sm text-zinc-400">Avg. Rating</span>
                <div className="mt-2 flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-400" />
                  <span className="text-2xl font-semibold text-white">{seller.stats?.averageRating || 0}</span>
                </div>
              </div>
            </Card>
            
            <Card className="p-4 bg-zinc-900 border-zinc-800">
              <div className="flex flex-col">
                <span className="text-sm text-zinc-400">Total Reviews</span>
                <div className="mt-2 flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-purple-400" />
                  <span className="text-2xl font-semibold text-white">{seller.stats?.totalReviews || 0}</span>
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
                    <span className="text-2xl font-semibold text-white">{metrics.ordersCount || 0}</span>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4 bg-zinc-900 border-zinc-800">
                <div className="flex flex-col">
                  <span className="text-sm text-zinc-400">Total Products</span>
                  <div className="mt-2 flex items-center gap-2">
                    <Store className="h-5 w-5 text-indigo-400" />
                    <span className="text-2xl font-semibold text-white">{metrics.productsCount || 0}</span>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4 bg-zinc-900 border-zinc-800">
                <div className="flex flex-col">
                  <span className="text-sm text-zinc-400">Streams</span>
                  <div className="mt-2 flex items-center gap-2">
                    <Video className="h-5 w-5 text-pink-400" />
                    <span className="text-2xl font-semibold text-white">{metrics.streamsCount || 0}</span>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4 bg-zinc-900 border-zinc-800">
                <div className="flex flex-col">
                  <span className="text-sm text-zinc-400">Total Revenue</span>
                  <div className="mt-2 flex items-center gap-2">
                   NGN
                    <span className="text-2xl font-semibold text-white">{metrics.totalRevenue?.toLocaleString(undefined, {
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
                          <td className="py-3 text-sm">₦{order.totalAmount?.toLocaleString()}</td>
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
                          ₦{month.totalSales.toLocaleString(undefined, {
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
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Package className="h-5 w-5 text-zinc-400" />
                Products ({productsPagination.totalProducts || 0})
              </h3>
              <div className="flex items-center gap-3">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteAllProductsModal(true)}
                  className="mr-2"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete All Products
                </Button>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search products..."
                    name="search"
                    value={productsFilter.search}
                    onChange={handleProductFilterChange}
                    className="bg-zinc-800 text-white border border-zinc-700 rounded-md px-4 py-2 text-sm w-64 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  {productsFilter.search && (
                    <button 
                      onClick={() => {
                        setProductsFilter(prev => ({ ...prev, search: '' }));
                      }}
                      className="absolute right-8 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  <button 
                    onClick={applyProductsFilter}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-white"
                  >
                    <Search className="h-4 w-4" />
                  </button>
                </div>
                <select
                  name="status"
                  value={productsFilter.status}
                  onChange={handleProductFilterChange}
                  className="bg-zinc-800 text-white border border-zinc-700 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="offline_auction">Offline Auction</option>
                </select>
                <select
                  name="sortBy"
                  value={productsFilter.sortBy}
                  onChange={handleProductFilterChange}
                  className="bg-zinc-800 text-white border border-zinc-700 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="best_selling">Best Selling</option>
                  <option value="most_viewed">Most Viewed</option>
                </select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetProductsFilter}
                  className="border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-700"
                >
                  Reset
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={applyProductsFilter}
                  className="border-indigo-600 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/40"
                >
                  Apply Filters
                </Button>
              </div>
            </div>

            <Card className="p-5 bg-zinc-900 border-zinc-800">
              {loadingProducts && sellerProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-10 w-10 animate-spin text-indigo-500 mb-4" />
                  <p className="text-zinc-400">Loading products...</p>
                </div>
              ) : sellerProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Package2 className="h-16 w-16 text-zinc-700 mb-4" />
                  <p className="text-zinc-400 mb-2">No products found</p>
                  <p className="text-zinc-500 text-sm">This seller doesn't have any products matching your criteria.</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-zinc-800">
                          <TableHead className="text-zinc-400">Image</TableHead>
                          <TableHead className="text-zinc-400">Product Details</TableHead>
                          <TableHead className="text-zinc-400">Price</TableHead>
                          <TableHead className="text-zinc-400">Inventory</TableHead>
                          <TableHead className="text-zinc-400">Status</TableHead>
                          <TableHead className="text-zinc-400">Sales & Analytics</TableHead>
                          <TableHead className="text-zinc-400">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sellerProducts.map((product) => (
                          <TableRow key={product._id} className="border-zinc-800 hover:bg-zinc-800/50">
                            <TableCell className="align-top">
                              {product.images && product.images.length > 0 && (
                                <div className="relative group">
                                  <img 
                                    src={product.images[0].url} 
                                    alt={product.name}
                                    className="w-16 h-16 object-cover rounded-md"
                                  />
                                  {product.images.length > 1 && (
                                    <Badge className="absolute -top-2 -right-2 bg-zinc-700 text-zinc-300 text-xs">
                                      +{product.images.length - 1}
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="max-w-md align-top">
                              <div className="flex flex-col">
                                <span className="font-medium text-sm mb-1 text-white">{product.name}</span>
                                <div className="flex flex-col text-xs text-zinc-400">
                                  <span>ID: {product._id}</span>
                                  {product.sku && <span>SKU: {product.sku}</span>}
                                  <div className="flex items-center gap-1 mt-1">
                                    <Badge variant="outline" className="text-xs bg-zinc-700 text-zinc-300">
                                      {product.category}
                                    </Badge>
                                    {product.subCategory && (
                                      <Badge variant="outline" className="text-xs">
                                        {product.subCategory}
                                      </Badge>
                                    )}
                                  </div>
                                  {product.brand && (
                                    <span className="mt-1 text-xs">Brand: {product.brand}</span>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="align-top">
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-white">{formatPrice(product.price)}</span>
                                  {product.discount?.isActive && (
                                    <Badge className="bg-red-500/20 text-red-400 text-xs">
                                      -{getDiscountPercentage(product)}%
                                    </Badge>
                                  )}
                                </div>
                                {product.discount?.isActive && product.discount.discountedPrice && (
                                  <span className="text-xs text-zinc-500 line-through">
                                    {formatPrice(product.discount.discountedPrice)}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="align-top">
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-white">{product.stock}</span>
                                  <span className="text-xs text-zinc-400">units</span>
                                </div>
                                {product.inventory?.lowStockThreshold && (
                                  <span className="text-xs text-zinc-400">
                                    Low stock alert: {product.inventory.lowStockThreshold}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="align-top">
                              <div className="flex flex-col gap-2">
                                <span className={`px-2 py-1 rounded-full text-xs flex items-center justify-center w-fit ${
                                  product.stock > 20 
                                    ? 'bg-green-500/20 text-green-400'
                                    : product.stock > 0
                                    ? 'bg-yellow-500/20 text-yellow-400'
                                    : 'bg-red-500/20 text-red-400'
                                }`}>
                                  {product.stock > 20 
                                    ? 'In Stock' 
                                    : product.stock > 0 
                                    ? 'Low Stock'
                                    : 'Out of Stock'}
                                </span>
                                <Badge variant={product.status === 'active' ? 'default' : 'outline'} className={`text-xs w-fit ${
                                  product.status === 'active' 
                                    ? 'bg-green-500/20 text-green-400' 
                                    : product.status === 'draft'
                                    ? 'text-zinc-400'
                                    : 'bg-blue-500/20 text-blue-400'
                                }`}>
                                  {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell className="align-top">
                              <div className="flex flex-col text-xs gap-1 text-zinc-400">
                                <div className="flex items-center gap-1">
                                  <Package2 className="h-3 w-3 text-blue-400" />
                                  <span>{product.stats?.soldCount || 0} sold</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Eye className="h-3 w-3 text-purple-400" />
                                  <span>{product.stats?.views || 0} views</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Star className="h-3 w-3 text-yellow-400" />
                                  <span>{product.stats?.averageRating || 0} rating ({product.stats?.reviewCount || 0})</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="align-top">
                              <div className="flex space-x-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="text-red-400 hover:text-red-300 border-zinc-700 hover:bg-red-500/10"
                                  onClick={() => {
                                    setSelectedProduct(product);
                                    setShowDeleteProductModal(true);
                                  }}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                                
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="text-amber-400 hover:text-amber-300 border-zinc-700 hover:bg-amber-500/10"
                                  onClick={() => {
                                    setSelectedProduct(product);
                                    setShowDisableProductModal(true);
                                  }}
                                >
                                  <Tag className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Loading indicator */}
                  {loadingMore && (
                    <div className="flex justify-center items-center py-6">
                      <Loader2 className="h-6 w-6 animate-spin text-indigo-500 mr-2" />
                      <span className="text-zinc-400">Loading more products...</span>
                    </div>
                  )}

                  {/* Pagination info */}
                  <div className="mt-4 text-center text-sm text-zinc-500">
                    Showing {sellerProducts.length} of {productsPagination.totalProducts} products
                  </div>

                  {/* Load more button */}
                  {!loadingProducts && !loadingMore && productsPagination.currentPage < productsPagination.totalPages && (
                    <div className="mt-6 flex justify-center">
                      <Button 
                        onClick={handleLoadMoreProducts}
                        disabled={loadingMore}
                        className="bg-indigo-600/20 text-indigo-400 border border-indigo-600/30 hover:bg-indigo-600/40"
                      >
                        {loadingMore ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          <>Load More Products</>
                        )}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="finances">
          <div className="space-y-6">
            {/* Wallet Management */}
            <Card className="p-5 bg-zinc-900 border-zinc-800">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-zinc-400" />
                  Wallet Management
                </h3>
                <div className="flex items-center gap-3 mt-4 md:mt-0">
                  <Button
                    variant="outline"
                    onClick={() => setShowAddFundsModal(true)}
                    className="bg-green-600/20 border-green-600/40 text-green-400 hover:bg-green-600/30"
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Funds
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowDeductFundsModal(true)}
                    className="bg-red-600/20 border-red-600/40 text-red-400 hover:bg-red-600/30"
                  >
                    <MinusCircle className="h-4 w-4 mr-2" />
                    Deduct Funds
                  </Button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex-1 bg-zinc-800 rounded-lg p-5 flex flex-col justify-between">
                  <div>
                    <div className="text-sm text-zinc-400">Current Balance</div>
                    <div className="text-3xl font-bold text-white mt-2">
                      {formatPrice(seller?.walletBalance || 0)}
                    </div>
                  </div>
                  <div className="flex items-center mt-6">
                    <CreditCard className="h-5 w-5 text-zinc-400 mr-2" />
                    <span className="text-sm text-zinc-300">Seller Account</span>
                  </div>
                </div>

                <div className="flex-1 bg-zinc-800 rounded-lg p-5">
                  <div className="text-sm text-zinc-400 mb-4">Quick Actions</div>
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start border-zinc-700 text-zinc-300"
                      onClick={() => {
                        setWalletAmount('1000');
                        setShowAddFundsModal(true);
                      }}
                    >
                      <ArrowUpRight className="h-4 w-4 mr-2 text-green-400" />
                      Add ₦1,000
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start border-zinc-700 text-zinc-300"
                      onClick={() => {
                        setWalletAmount('5000');
                        setShowAddFundsModal(true);
                      }}
                    >
                      <ArrowUpRight className="h-4 w-4 mr-2 text-green-400" />
                      Add ₦5,000
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start border-zinc-700 text-zinc-300"
                      onClick={() => {
                        setWalletAmount('1000');
                        setShowDeductFundsModal(true);
                      }}
                    >
                      <ArrowDownRight className="h-4 w-4 mr-2 text-red-400" />
                      Deduct ₦1,000
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
            
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
                            {transaction.type === 'processing_fee' ? '-' : ''}₦{transaction.amount.toLocaleString()}
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
                            ₦{withdrawal.amount.toLocaleString()}
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
                        <p className="font-medium text-green-400">₦{customer.totalSpent?.toLocaleString(undefined, {
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

      {/* Delete Product Confirmation Modal */}
      {showDeleteProductModal && selectedProduct && (
        <Dialog open={showDeleteProductModal} onOpenChange={setShowDeleteProductModal}>
          <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-red-400" />
                Delete Product
              </DialogTitle>
              <DialogDescription className="text-zinc-400">
                Are you sure you want to delete this product? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="bg-zinc-800 p-4 rounded-md mb-4">
              <div className="flex items-center gap-3">
                {selectedProduct.images && selectedProduct.images.length > 0 && (
                  <img 
                    src={selectedProduct.images[0].url} 
                    alt={selectedProduct.name}
                    className="w-12 h-12 object-cover rounded-md"
                  />
                )}
                <div>
                  <p className="font-medium text-white">{selectedProduct.name}</p>
                  <p className="text-sm text-zinc-400">
                    {formatPrice(selectedProduct.price)} • {selectedProduct.category}
                  </p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteProductModal(false);
                  setSelectedProduct(null);
                }}
                className="border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-700"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteProduct}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete Product
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Disable Product Confirmation Modal */}
      {showDisableProductModal && selectedProduct && (
        <Dialog open={showDisableProductModal} onOpenChange={setShowDisableProductModal}>
          <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                <Tag className="h-5 w-5 text-amber-400" />
                Disable Product
              </DialogTitle>
              <DialogDescription className="text-zinc-400">
                This will set the product status to draft and hide it from customers.
              </DialogDescription>
            </DialogHeader>
            <div className="bg-zinc-800 p-4 rounded-md mb-4">
              <div className="flex items-center gap-3">
                {selectedProduct.images && selectedProduct.images.length > 0 && (
                  <img 
                    src={selectedProduct.images[0].url} 
                    alt={selectedProduct.name}
                    className="w-12 h-12 object-cover rounded-md"
                  />
                )}
                <div>
                  <p className="font-medium text-white">{selectedProduct.name}</p>
                  <p className="text-sm text-zinc-400">
                    {formatPrice(selectedProduct.price)} • {selectedProduct.category}
                  </p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDisableProductModal(false);
                  setSelectedProduct(null);
                }}
                className="border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-700"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDisableProduct}
                className="bg-amber-600 hover:bg-amber-700"
              >
                Disable Product
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Add Funds Modal */}
      <Dialog open={showAddFundsModal} onOpenChange={setShowAddFundsModal}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-green-400" />
              Add Funds to Wallet
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Add funds to {seller?.storeName || getDisplayName(seller || {} as Seller)}'s wallet balance.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">
                Amount (₦)*
              </label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="Enter amount to add"
                value={walletAmount}
                onChange={(e) => setWalletAmount(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">
                Reason
              </label>
              <Textarea
                placeholder="Enter reason for adding funds (optional)"
                value={walletReason}
                onChange={(e) => setWalletReason(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white"
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setWalletAmount('');
                setWalletReason('');
                setShowAddFundsModal(false);
              }}
              className="border-zinc-700 text-zinc-400"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddFunds}
              disabled={walletLoading || !walletAmount || parseFloat(walletAmount) <= 0}
              className="bg-green-600 hover:bg-green-700"
            >
              {walletLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <PlusCircle className="h-4 w-4 mr-2" />
              )}
              Add Funds
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deduct Funds Modal */}
      <Dialog open={showDeductFundsModal} onOpenChange={setShowDeductFundsModal}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <MinusCircle className="h-5 w-5 text-red-400" />
              Deduct Funds from Wallet
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Deduct funds from {seller?.storeName || getDisplayName(seller || {} as Seller)}'s wallet balance.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="py-2 rounded-md bg-zinc-800 px-3 flex justify-between">
              <span className="text-zinc-300">Current Balance:</span>
              <span className="font-medium text-white">{formatPrice(seller?.walletBalance || 0)}</span>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">
                Amount (₦)*
              </label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="Enter amount to deduct"
                value={walletAmount}
                onChange={(e) => setWalletAmount(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white"
              />
              {parseFloat(walletAmount) > (seller?.walletBalance || 0) && (
                <p className="text-xs text-red-400 mt-1">
                  Amount exceeds current balance
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">
                Reason*
              </label>
              <Textarea
                placeholder="Enter reason for deducting funds"
                value={walletReason}
                onChange={(e) => setWalletReason(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white"
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setWalletAmount('');
                setWalletReason('');
                setShowDeductFundsModal(false);
              }}
              className="border-zinc-700 text-zinc-400"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeductFunds}
              disabled={
                walletLoading || 
                !walletAmount || 
                parseFloat(walletAmount) <= 0 || 
                parseFloat(walletAmount) > (seller?.walletBalance || 0) ||
                !walletReason
              }
              className="bg-red-600 hover:bg-red-700"
            >
              {walletLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <MinusCircle className="h-4 w-4 mr-2" />
              )}
              Deduct Funds
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete All Products Confirmation Modal */}
      <Dialog open={showDeleteAllProductsModal} onOpenChange={setShowDeleteAllProductsModal}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-400" />
              Delete All Products
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Are you sure you want to delete all products for this seller? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">
                Reason*
              </label>
              <Textarea
                placeholder="Enter reason for deleting all products"
                value={deleteAllProductsReason}
                onChange={(e) => setDeleteAllProductsReason(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white"
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteAllProductsReason('');
                setShowDeleteAllProductsModal(false);
              }}
              className="border-zinc-700 text-zinc-400"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteAllProducts}
              disabled={isDeletingAllProducts || !deleteAllProductsReason}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeletingAllProducts ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete All Products
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default SellerDetail; 