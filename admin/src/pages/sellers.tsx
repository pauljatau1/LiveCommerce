import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Add jsPDF TypeScript fix
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

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
  storeName?: string;
  productCount?: number;
  followers?: any[];
  aboutStore?: string;
  sellerAddress?: BusinessAddress;
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
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);
  const [sendingBulkReminders, setSendingBulkReminders] = useState(false);
  const [showReminderResultModal, setShowReminderResultModal] = useState(false);
  const [reminderResult, setReminderResult] = useState<{
    count: number;
    processedSellers: Array<{
      sellerId: string;
      email: string;
      name: string;
      businessName: string;
      incompleteSteps: string[];
    }>;
  } | null>(null);
  
  // New state for pagination and filtering
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalSellers: 0,
    sellersPerPage: 20
  });
  const [filters, setFilters] = useState({
    search: "",
    isVerified: "",
    isDisabled: "",
    country: "",
    category: "",
    sortBy: "newest",
    emailVerified: "",
    hasProducts: ""
  });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  
  // Temporary search value for the input
  const [searchInput, setSearchInput] = useState("");

  // New state for success dialogs
  const [successDialog, setSuccessDialog] = useState({
    show: false,
    title: "",
    message: "",
    icon: "success" as "success" | "error" | "warning" | "info"
  });

  const [exporting, setExporting] = useState<string | null>(null);

  // Add state for screen size
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    // Check screen size and set mobile state
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkScreenSize();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkScreenSize);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    fetchSellers();
  }, [page, limit, filters]);

  const fetchSellers = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      
      if (filters.search) params.append('search', filters.search);
      if (filters.isVerified) params.append('isVerified', filters.isVerified);
      if (filters.isDisabled) params.append('isDisabled', filters.isDisabled);
      if (filters.country) params.append('country', filters.country);
      if (filters.category) params.append('category', filters.category);
      if (filters.emailVerified) params.append('emailVerified', filters.emailVerified);
      if (filters.hasProducts) params.append('hasProducts', filters.hasProducts);
      
      // Map the sortBy value to the backend expected format
      let sortByValue = "newest";
      switch (filters.sortBy) {
        case "name_asc": sortByValue = "name_asc"; break;
        case "name_desc": sortByValue = "name_desc"; break;
        case "oldest": sortByValue = "oldest"; break;
        case "business_name": sortByValue = "business_name"; break;
        case "store_name": sortByValue = "store_name"; break;
        case "most_visited": sortByValue = "most_visited"; break;
        case "most_followers": sortByValue = "most_followers"; break;
        case "most_products": sortByValue = "most_products"; break;
        default: sortByValue = "newest";
      }
      params.append('sortBy', sortByValue);
      
      // Filter by account type if needed (this is for the tabs)
      if (selectedTab !== "all") {
        params.append('accountType', selectedTab);
      }
      
      const response = await api.get(`/api/admin/sellers?${params.toString()}`);
      
      if (response.data.success) {
        setSellers(response.data.sellers);
        setPagination({
          currentPage: response.data.currentPage,
          totalPages: response.data.totalPages,
          totalSellers: response.data.totalSellers,
          sellersPerPage: response.data.sellersPerPage
        });
      } else {
        throw new Error(response.data.message || "Failed to fetch sellers");
      }
    } catch (err) {
      setError("Failed to fetch sellers");
      console.error("Error fetching sellers:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1); // Reset to first page when filters change
  };

  // Handle search input change (doesn't trigger API call)
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };

  // Handle search submit on Enter key
  const handleSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleFilterChange('search', searchInput);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleLimitChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setLimit(Number(event.target.value));
    setPage(1); // Reset to first page when limit changes
  };

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
      
      // Show success dialog
      showSuccessDialog(
        "Verification Rejected",
        `${getDisplayName(selectedSeller)}'s verification has been rejected successfully`
      );
      
      setShowRejectModal(false);
      setRejectReason("");
      setRejectDetails("");
    } catch (err) {
      console.error("Error rejecting seller:", err);
      toast({
        title: "Error",
        description: "Failed to reject seller verification",
        variant: "destructive",
      });
    } finally {
      setIsRejecting(false);
    }
  };

  const toggleFeature = async (sellerId: string) => {
    setUpdatingId(sellerId);
    try {
      await api.put(`/api/admin/sellers/${sellerId}/feature`);
      
      const updatedSellers = sellers.map(seller => 
        seller._id === sellerId 
          ? {...seller, isFeatured: !seller.isFeatured}
          : seller
      );
      
      setSellers(updatedSellers);
      
      // Show success dialog
      const seller = updatedSellers.find(s => s._id === sellerId);
      if (seller) {
        const action = seller.isFeatured ? 'added to' : 'removed from';
        showSuccessDialog(
          "Feature Status Updated",
          `${getDisplayName(seller)} has been ${action} featured sellers`
        );
      }
    } catch (err) {
      console.error("Error updating featured status:", err);
      toast({
        title: "Error",
        description: "Failed to update featured status",
        variant: "destructive",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleVerification = async (sellerId: string) => {
    const seller = sellers.find(s => s._id === sellerId);
    if (!seller) return;

    const missingDocuments = !seller.verificationDocuments?.documents?.length;
    const invalidAccountType = !seller.accountType || seller.accountType === "N/A";
    
    if (missingDocuments || invalidAccountType) {
      // Can't verify - show error
      const reason = missingDocuments ? "Missing verification documents" : "Invalid account type";
      console.error(`Cannot verify seller: ${reason}`);
      toast({
        title: "Error",
        description: `Cannot verify seller: ${reason}`,
        variant: "destructive",
      });
      return;
    }
    
    setUpdatingId(sellerId);
    try {
      await api.put(`/api/admin/sellers/${sellerId}/verify`);
      
      const updatedSellers = sellers.map(seller => 
        seller._id === sellerId 
          ? {...seller, isVerified: !seller.isVerified}
          : seller
      );
      
      setSellers(updatedSellers);
      
      // Show success dialog
      const updatedSeller = updatedSellers.find(s => s._id === sellerId);
      if (updatedSeller) {
        const action = updatedSeller.isVerified ? 'verified' : 'unverified';
        showSuccessDialog(
          "Verification Status Updated",
          `${getDisplayName(updatedSeller)} has been ${action} successfully`
        );
      }
    } catch (err) {
      console.error("Error updating verification status:", err);
      toast({
        title: "Error",
        description: "Failed to update verification status",
        variant: "destructive",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleDisabled = async (sellerId: string, currentState: boolean) => {
    setUpdatingId(sellerId);
    try {
      await api.put(`/api/admin/sellers/${sellerId}/${currentState ? 'enable' : 'disable'}`);
      
      const updatedSellers = sellers.map(seller => 
        seller._id === sellerId 
          ? {...seller, isDisabled: !currentState}
          : seller
      );
      
      setSellers(updatedSellers);
      
      // Show success dialog
      const seller = updatedSellers.find(s => s._id === sellerId);
      if (seller) {
        const action = currentState ? 'enabled' : 'disabled';
        showSuccessDialog(
          "Account Status Updated",
          `${getDisplayName(seller)} has been ${action} successfully`
        );
      }
    } catch (err) {
      console.error("Error updating disabled status:", err);
      toast({
        title: "Error",
        description: `Failed to ${currentState ? 'enable' : 'disable'} seller account`,
        variant: "destructive",
      });
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

  const verificationButtons = (seller: Seller) => {
    const missingDocuments = !seller.verificationDocuments?.documents?.length;
    const invalidAccountType = !seller.accountType || seller.accountType === "N/A";
    const canVerify = !missingDocuments && !invalidAccountType;
    
    return (
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
            disabled={updatingId === seller._id || !canVerify}
            title={missingDocuments ? "Cannot verify: Missing documents" : 
                  invalidAccountType ? "Cannot verify: Invalid account type" : ""}
            className={`ml-2 ${!canVerify ? "cursor-not-allowed opacity-50" : ""}`}
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
  )};

  const showSuccessDialog = (title: string, message: string, icon: "success" | "error" | "warning" | "info" = "success") => {
    setSuccessDialog({
      show: true,
      title,
      message,
      icon
    });
  };

  const handleCloseSuccessDialog = () => {
    setSuccessDialog(prev => ({ ...prev, show: false }));
  };

  const handleSendOnboardingReminder = async (sellerId: string) => {
    setSendingReminder(sellerId);
    try {
      const response = await api.post(`/api/admin/sellers/${sellerId}/send-onboarding-reminder`);
      
      if (response.data.success) {
        const seller = sellers.find(s => s._id === sellerId);
        if (seller) {
          showSuccessDialog(
            "Reminder Sent",
            `Onboarding reminder email sent successfully to ${getDisplayName(seller)}`
          );
        }
      }
    } catch (error: any) {
      console.error("Error sending onboarding reminder:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to send onboarding reminder",
        variant: "destructive",
      });
    } finally {
      setSendingReminder(null);
    }
  };

  const handleSendBulkOnboardingReminders = async () => {
    setSendingBulkReminders(true);
    try {
      const response = await api.post('/api/admin/sellers/bulk/send-onboarding-reminders');
      
      if (response.data.success) {
        setReminderResult({
          count: response.data.count,
          processedSellers: response.data.processedSellers
        });
        
        // Show success dialog
        showSuccessDialog(
          "Bulk Reminders Sent",
          `Successfully sent ${response.data.count} onboarding reminder emails to sellers`
        );
        
        setShowReminderResultModal(true);
      }
    } catch (error: any) {
      console.error("Error sending bulk onboarding reminders:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to send bulk onboarding reminders",
        variant: "destructive",
      });
    } finally {
      setSendingBulkReminders(false);
    }
  };

  // Check if a seller has incomplete onboarding
  const hasIncompleteOnboarding = (seller: Seller) => {
    return (
      !seller.isProfileComplete || 
      !seller.verificationDocuments?.documents?.length || 
      !seller.accountType || 
      seller.accountType === "N/A"
    );
  };

  // Export functions
  const exportToCSV = () => {
    setExporting('csv');
    try {
      // Define headers
      const headers = [
        'Seller ID',
        'Name',
        'Store Name',
        'Email',
        'Phone',
        'Account Type',
        'Products',
        'Store Visits',
        'Followers',
        'Rating',
        'Wallet Balance',
        'Status',
        'Verified',
        'Featured',
        'Created At',
        'Country',
      ];

      // Transform data
      const data = sellers.map(seller => [
        seller._id,
        getDisplayName(seller),
        seller.storeName || 'N/A',
        seller.email,
        seller.phoneNumber,
        seller.accountType || 'N/A',
        seller.productCount || 0,
        seller.storeVisits || 0,
        seller.followers?.length || 0,
        seller.stats?.averageRating || 0,
        seller.walletBalance || 0,
        getStatusText(seller),
        seller.isVerified ? 'Yes' : 'No',
        seller.isFeatured ? 'Yes' : 'No',
        formatDate(seller.createdAt),
        seller.sellerAddress?.country || seller.businessAddress?.country || 'N/A',
      ]);

      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...data.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `sellers_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Show success message
      toast({
        title: "Export Successful",
        description: "Sellers data has been exported to CSV",
      });
    } catch (error) {
      console.error("Error exporting to CSV:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export sellers data to CSV",
        variant: "destructive",
      });
    } finally {
      setExporting(null);
    }
  };

  const exportToPDF = () => {
    setExporting('pdf');
    try {
      // Create new PDF document with landscape orientation to fit more columns
      const doc = new jsPDF({
        orientation: 'landscape'
      });
      
      // Add title
      doc.setFontSize(16);
      doc.text("Sellers List", 14, 15);
      
      // Add export info
      doc.setFontSize(10);
      doc.text(`Exported on: ${new Date().toLocaleString()}`, 14, 22);
      doc.text(`Total Sellers: ${pagination.totalSellers}`, 14, 27);

      // Format data for PDF
      const tableData = sellers.map(seller => [
        getDisplayName(seller),
        seller.storeName || 'N/A',
        seller.email,
        seller.phoneNumber || 'N/A',
        seller.accountType || 'N/A',
        seller.productCount || 0,
        seller.isVerified ? 'Yes' : 'No',
        seller.isFeatured ? 'Yes' : 'No',
        formatDate(seller.createdAt),
      ]);

      // Set up autoTable
      autoTable(doc, {
        startY: 32,
        head: [['Name', 'Store', 'Email', 'Phone', 'Type', 'Products', 'Verified', 'Featured', 'Created']],
        body: tableData,
        headStyles: { fillColor: [41, 41, 64], textColor: [255, 255, 255] },
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 35 },
          1: { cellWidth: 30 },
          2: { cellWidth: 45 },
          3: { cellWidth: 25 },
          4: { cellWidth: 20 },
          5: { cellWidth: 15 },
          6: { cellWidth: 15 },
          7: { cellWidth: 15 },
          8: { cellWidth: 20 },
        },
        margin: { top: 32 },
      });

      // Save PDF
      doc.save(`sellers_export_${new Date().toISOString().split('T')[0]}.pdf`);

      // Show success message
      toast({
        title: "Export Successful",
        description: "Sellers data has been exported to PDF",
      });
    } catch (error) {
      console.error("Error exporting to PDF:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export sellers data to PDF",
        variant: "destructive",
      });
    } finally {
      setExporting(null);
    }
  };

  // Debug function to test if jsPDF is working properly
  const debugPDFLibrary = () => {
    try {
      setExporting('debug');
      
      // Create a simple PDF as a test
      const doc = new jsPDF();
      doc.text("Testing jsPDF functionality", 10, 10);
      doc.save("test.pdf");
      
      toast({
        title: "Debug Success",
        description: "Basic PDF generation is working. If the full export still fails, there may be an issue with autoTable.",
      });
    } catch (error) {
      console.error("jsPDF Debug Error:", error);
      toast({
        title: "Debug Failed",
        description: `jsPDF is not working properly: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setExporting(null);
    }
  };

  // Basic PDF export without autoTable as a fallback
  const basicPDFExport = () => {
    setExporting('basic');
    try {
      // Create PDF with landscape orientation
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
      });
      
      // Add title and info
      doc.setFontSize(16);
      doc.text("Sellers List", 14, 15);
      doc.setFontSize(10);
      doc.text(`Exported on: ${new Date().toLocaleString()}`, 14, 22);
      doc.text(`Total Sellers: ${pagination.totalSellers}`, 14, 27);
      
      // Set up manual table positioning
      const startY = 35;
      const rowHeight = 8;
      const cols = [
        { header: 'Name', x: 14, width: 40 },
        { header: 'Store', x: 54, width: 35 },
        { header: 'Email', x: 89, width: 50 },
        { header: 'Type', x: 139, width: 25 },
        { header: 'Products', x: 164, width: 20 },
        { header: 'Verified', x: 184, width: 20 },
        { header: 'Featured', x: 204, width: 20 },
        { header: 'Created', x: 224, width: 30 },
      ];
      
      // Draw header
      doc.setFillColor(41, 41, 64);
      doc.setTextColor(255, 255, 255);
      doc.rect(14, startY - 6, 240, 7, 'F');
      
      for (const col of cols) {
        doc.text(col.header, col.x, startY - 1);
      }
      
      // Reset text color for data
      doc.setTextColor(0, 0, 0);
      
      // Draw data rows
      let y = startY + 5;
      sellers.slice(0, 30).forEach((seller, index) => {
        // Add alternating row background
        if (index % 2 === 0) {
          doc.setFillColor(245, 245, 245);
          doc.rect(14, y - 5, 240, rowHeight, 'F');
        }
        
        doc.text(getDisplayName(seller).substring(0, 18), cols[0].x, y);
        doc.text((seller.storeName || 'N/A').substring(0, 16), cols[1].x, y);
        doc.text(seller.email.substring(0, 23), cols[2].x, y);
        doc.text((seller.accountType || 'N/A').substring(0, 10), cols[3].x, y);
        doc.text(String(seller.productCount || 0), cols[4].x, y);
        doc.text(seller.isVerified ? 'Yes' : 'No', cols[5].x, y);
        doc.text(seller.isFeatured ? 'Yes' : 'No', cols[6].x, y);
        doc.text(formatDate(seller.createdAt), cols[7].x, y);
        
        y += rowHeight;
        
        // Add new page if needed
        if (y > 200) {
          doc.addPage();
          y = startY;
        }
      });
      
      // Add note if data was truncated
      if (sellers.length > 30) {
        doc.setFontSize(8);
        doc.text(`* Showing 30 of ${sellers.length} sellers. Export to CSV for full data.`, 14, y + 5);
      }
      
      // Save PDF
      doc.save(`sellers_export_${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast({
        title: "Basic Export Successful",
        description: "Sellers data has been exported using basic PDF formatting",
      });
    } catch (error) {
      console.error("Error in basic PDF export:", error);
      toast({
        title: "Export Failed",
        description: `Basic PDF export failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setExporting(null);
    }
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
    <div className="space-y-6 p-2 sm:p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
            <Users className="h-6 w-6 md:h-8 md:w-8" />
            Sellers
          </h2>
          <p className="text-muted-foreground">Manage your platform sellers</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Badge variant="outline" className="px-2 sm:px-3 py-1 text-xs">
            <Users className="h-3 w-3 mr-1" />
            Total: {pagination.totalSellers}
          </Badge>
          <Badge variant="outline" className="px-2 sm:px-3 py-1 text-xs">
            <Building className="h-3 w-3 mr-1" />
            Business: {sellers.filter(s => s.accountType === "business").length}
          </Badge>
          <Badge variant="outline" className="px-2 sm:px-3 py-1 text-xs">
            <User className="h-3 w-3 mr-1" />
            Individual: {sellers.filter(s => s.accountType === "individual").length}
          </Badge>
          <Badge variant="outline" className="px-2 sm:px-3 py-1 text-xs">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Verified: {sellers.filter(s => s.isVerified).length}
          </Badge>
          <Badge variant="outline" className="px-2 sm:px-3 py-1 text-xs">
            <Package className="h-3 w-3 mr-1" />
            Products: {sellers.reduce((sum, seller) => sum + (seller.productCount || 0), 0)}
          </Badge>
          <Badge variant="outline" className="px-2 sm:px-3 py-1 text-xs">
            <Star className="h-3 w-3 mr-1 fill-current" />
            Featured: {sellers.filter(s => s.isFeatured).length}
          </Badge>
          <Badge variant="outline" className="px-2 sm:px-3 py-1 text-xs">
            <AlertCircle className="h-3 w-3 mr-1" />
            Incomplete: {sellers.filter(seller => hasIncompleteOnboarding(seller)).length}
          </Badge>
           <div className="flex justify-end gap-2 mt-2 sm:mt-0 w-full sm:w-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" disabled={exporting !== null} className="flex text-white bg-gray-600 items-center gap-2 text-xs sm:text-sm w-full sm:w-auto">
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Export Sellers
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={exportToCSV} disabled={exporting !== null}>
              <FileText className="h-4 w-4 mr-2" />
              Export as CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportToPDF} disabled={exporting !== null}>
              <File className="h-4 w-4 mr-2" />
              Export as PDF (AutoTable)
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-md p-3 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-medium text-zinc-300">Filters</h3>
          <Button 
            variant="ghost" 
            onClick={() => {
              setFilters({
                search: "",
                isVerified: "",
                isDisabled: "",
                country: "",
                category: "",
                sortBy: "newest",
                emailVerified: "",
                hasProducts: ""
              });
              setSearchInput("");
              setPage(1);
            }}
            className="text-xs text-zinc-400 h-8"
          >
            Reset All
          </Button>
        </div>
        
        <div>
          <div className="relative">
            <Input
              placeholder="Search sellers..."
              value={searchInput}
              onChange={handleSearchInputChange}
              onKeyDown={handleSearchSubmit}
              className="bg-zinc-800 border-zinc-700 text-white pr-16"
            />
            <Button 
              variant="default" 
              className="absolute right-0 top-0 h-full px-3 rounded-l-none"
              onClick={() => handleFilterChange('search', searchInput)}
            >
              Search
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Verification</label>
            <select 
              className="w-full h-9 rounded-md bg-zinc-800 border border-zinc-700 px-3 text-sm text-white"
              value={filters.isVerified}
              onChange={(e) => handleFilterChange('isVerified', e.target.value)}
            >
              <option value="">All</option>
              <option value="true">Verified</option>
              <option value="false">Unverified</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Status</label>
            <select 
              className="w-full h-9 rounded-md bg-zinc-800 border border-zinc-700 px-3 text-sm text-white"
              value={filters.isDisabled}
              onChange={(e) => handleFilterChange('isDisabled', e.target.value)}
            >
              <option value="">All</option>
              <option value="true">Disabled</option>
              <option value="false">Active</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Products</label>
            <select 
              className="w-full h-9 rounded-md bg-zinc-800 border border-zinc-700 px-3 text-sm text-white"
              value={filters.hasProducts}
              onChange={(e) => handleFilterChange('hasProducts', e.target.value)}
            >
              <option value="">All</option>
              <option value="true">Has Products</option>
              <option value="false">No Products</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Sort By</label>
            <select 
              className="w-full h-9 rounded-md bg-zinc-800 border border-zinc-700 px-3 text-sm text-white"
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name_asc">Name (A-Z)</option>
              <option value="name_desc">Name (Z-A)</option>
              <option value="store_name">Store Name</option>
              <option value="most_visited">Most Visited</option>
              <option value="most_followers">Most Followers</option>
              <option value="most_products">Most Products</option>
            </select>
          </div>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full" onValueChange={(value) => setSelectedTab(value as any)}>
        <TabsList className="mb-4 w-full justify-start overflow-x-auto">
          <TabsTrigger value="all">All Sellers</TabsTrigger>
          <TabsTrigger value="business">Business Accounts</TabsTrigger>
          <TabsTrigger value="individual">Individual Accounts</TabsTrigger>
        </TabsList>

        <Card className="p-2 sm:p-4">
          {/* Mobile View - Card Layout */}
          <div className="md:hidden space-y-4">
            {sellers.map((seller) => (
              <div key={seller._id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-3">
                {/* Seller Info Header */}
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarImage src={seller.storeAvatar?.url} />
                      <AvatarFallback>
                        {seller.accountType === "business" ? 
                          <Store className="h-5 w-5" /> : 
                          <User className="h-5 w-5" />
                        }
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium text-sm flex items-center gap-1">
                        {getDisplayName(seller)}
                        {seller.isProfileComplete && (
                          <CheckCircle2 className="h-3 w-3 text-green-500 flex-shrink-0" />
                        )}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        <Mail className="h-3 w-3 inline mr-1" /> {seller.email}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleFeature(seller._id)}
                    disabled={updatingId === seller._id}
                    className={`${
                      seller.isFeatured 
                        ? "text-yellow-500 hover:text-yellow-600" 
                        : "text-muted-foreground hover:text-foreground"
                    } p-1 h-8 w-8`}
                  >
                    <Star className={`h-5 w-5 ${seller.isFeatured ? "fill-current" : ""}`} />
                  </Button>
                </div>
                
                {/* Store Info */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-zinc-400">Store</p>
                    <p className="font-medium mt-1">
                      {seller.storeName || "No Store"}
                    </p>
                    {seller.sellerAddress && (
                      <p className="text-zinc-500 text-[10px] mt-0.5">
                        <MapPin className="h-3 w-3 inline mr-0.5" /> 
                        {seller.sellerAddress.city}, {seller.sellerAddress.country}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-zinc-400">Account Type</p>
                    <Badge 
                      variant="outline" 
                      className={`${
                        seller.accountType === "business" ? "bg-blue-500/10" : "bg-purple-500/10"
                      } mt-1 text-[10px]`}
                    >
                      {seller.accountType === "business" ? (
                        <Briefcase className="h-3 w-3 mr-1" />
                      ) : (
                        <User className="h-3 w-3 mr-1" />
                      )}
                      <span>{seller.accountType || "N/A"}</span>
                    </Badge>
                  </div>
                </div>
                
                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 text-[10px] bg-zinc-800/50 rounded-md p-2">
                  <div className="text-center">
                    <p className="text-zinc-400">Products</p>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <Package className="h-3 w-3 text-orange-400" />
                      <span className="font-medium">{seller.productCount || 0}</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-zinc-400">Visits</p>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <Eye className="h-3 w-3 text-blue-400" />
                      <span className="font-medium">{seller.storeVisits || 0}</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-zinc-400">Rating</p>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <Star className="h-3 w-3 text-yellow-400" />
                      <span className="font-medium">{seller.stats?.averageRating || 0}</span>
                    </div>
                  </div>
                </div>
                
                {/* Verification */}
                <div className="flex justify-between items-center">
                  {verificationButtons(seller)}
                  
                  <div className="flex items-center gap-1">
                    <Button
                      variant="default"
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 whitespace-nowrap text-xs h-8"
                      asChild
                    >
                      <Link to={`/dashboard/seller/${seller._id}`}>
                        View Details
                      </Link>
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[200px]">
                        {seller.verificationDocuments?.documents && seller.verificationDocuments.documents.length > 0 && (
                          <DropdownMenuItem 
                            onClick={() => window.open(seller.verificationDocuments?.documents[0].fileUrl, "_blank")}
                            className="flex items-center gap-2"
                          >
                            <File className="h-4 w-4" />
                            <span>View Documents</span>
                          </DropdownMenuItem>
                        )}
                        
                        {!seller.isDisabled && (
                          <DropdownMenuItem 
                            onClick={() => toggleDisabled(seller._id, false)}
                            className="flex items-center gap-2 text-destructive"
                          >
                            <XCircle className="h-4 w-4" />
                            <span>Disable Account</span>
                          </DropdownMenuItem>
                        )}
                        
                        {seller.isDisabled && (
                          <DropdownMenuItem 
                            onClick={() => toggleDisabled(seller._id, true)}
                            className="flex items-center gap-2 text-green-500"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Enable Account</span>
                          </DropdownMenuItem>
                        )}
                        
                        {hasIncompleteOnboarding(seller) && (
                          <DropdownMenuItem 
                            onClick={() => {
                              handleSendOnboardingReminder(seller._id);
                            }}
                            disabled={sendingReminder === seller._id}
                            className="flex items-center gap-2"
                          >
                            {sendingReminder === seller._id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Mail className="h-4 w-4" />
                            )}
                            <span>Send Onboarding Reminder</span>
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop View - Table Layout */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[180px]">Seller Information</TableHead>
                  <TableHead className="min-w-[140px]">Store</TableHead>
                  <TableHead className="min-w-[90px]">Account</TableHead>
                  <TableHead className="min-w-[70px]">Products</TableHead>
                  <TableHead className="min-w-[100px]">Engagement</TableHead>
                  <TableHead className="min-w-[140px]">Verification</TableHead>
                  <TableHead className="w-[50px]">Featured</TableHead>
                  <TableHead className="min-w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sellers.map((seller) => (
                  <TableRow key={seller._id}>
                    <TableCell>
                      <div className="flex items-center gap-2 sm:gap-3">
                        <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                          <AvatarImage src={seller.storeAvatar?.url} />
                          <AvatarFallback>
                            {seller.accountType === "business" ? 
                              <Store className="h-4 w-4 sm:h-5 sm:w-5" /> : 
                              <User className="h-4 w-4 sm:h-5 sm:w-5" />
                            }
                          </AvatarFallback>
                        </Avatar>
                        <div className="overflow-hidden">
                          <div className="font-medium flex items-center gap-1 sm:gap-2 truncate text-xs sm:text-sm">
                            {getDisplayName(seller)}
                            {seller.isProfileComplete && (
                              <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                            )}
                          </div>
                          <div className="text-[10px] sm:text-xs text-muted-foreground truncate flex items-center gap-1">
                            <Mail className="h-3 w-3" /> {seller.email}
                            {seller.emailVerified && (
                              <CheckCircle2 className="h-3 w-3 text-green-500" />
                            )}
                          </div>
                          <div className="text-[10px] sm:text-xs text-muted-foreground truncate">
                            <Phone className="h-3 w-3 inline mr-1" /> {seller.phoneNumber}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {seller.storeName ? (
                        <div>
                          <div className="font-medium truncate text-xs sm:text-sm">{seller.storeName}</div>
                         
                          {seller.sellerAddress && (
                            <div className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <MapPin className="h-3 w-3" /> 
                              {seller.sellerAddress.city}, {seller.sellerAddress.country}
                            </div>
                          )}
                        </div>
                      ) : (
                        <Badge variant="outline" className="bg-zinc-800/50 text-[10px] sm:text-xs">No Store</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={`${
                          seller.accountType === "business" ? "bg-blue-500/10" : "bg-purple-500/10"
                        } text-[10px] sm:text-xs`}
                      >
                        {seller.accountType === "business" ? (
                          <Briefcase className="h-3 w-3 mr-1" />
                        ) : (
                          <User className="h-3 w-3 mr-1" />
                        )}
                        <span className="truncate">{seller.accountType || "N/A"}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-xs sm:text-sm">
                        <Package className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                        <span>{seller.productCount || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-[10px] sm:text-xs">
                          <Eye className="h-3 w-3 text-blue-400" />
                          <span>Visits: {seller.storeVisits || 0}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] sm:text-xs">
                          <Users className="h-3 w-3 text-purple-400" />
                          <span>Followers: {seller.followers?.length || 0}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] sm:text-xs">
                          <Star className="h-3 w-3 text-yellow-400" />
                          <span>Rating: {seller.stats?.averageRating || 0}</span>
                        </div>
                      </div>
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
                        } p-1 sm:p-2`}
                      >
                        <Star className={`h-4 w-4 sm:h-5 sm:w-5 ${seller.isFeatured ? "fill-current" : ""}`} />
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 sm:gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 whitespace-nowrap text-[10px] sm:text-xs py-1 h-7 sm:h-8"
                          asChild
                        >
                          <Link to={`/dashboard/seller/${seller._id}`}>
                            <span className="hidden sm:inline-block mr-1">View</span> Details
                          </Link>
                        </Button>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-7 sm:h-8 p-0 w-7 sm:w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-[200px]">
                            {seller.verificationDocuments?.documents && seller.verificationDocuments.documents.length > 0 && (
                              <DropdownMenuItem 
                                onClick={() => window.open(seller.verificationDocuments?.documents[0].fileUrl, "_blank")}
                                className="flex items-center gap-2"
                              >
                                <File className="h-4 w-4" />
                                <span>View Documents</span>
                              </DropdownMenuItem>
                            )}
                            
                            {!seller.isDisabled && (
                              <DropdownMenuItem 
                                onClick={() => toggleDisabled(seller._id, false)}
                                className="flex items-center gap-2 text-destructive"
                              >
                                <XCircle className="h-4 w-4" />
                                <span>Disable Account</span>
                              </DropdownMenuItem>
                            )}
                            
                            {seller.isDisabled && (
                              <DropdownMenuItem 
                                onClick={() => toggleDisabled(seller._id, true)}
                                className="flex items-center gap-2 text-green-500"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                                <span>Enable Account</span>
                              </DropdownMenuItem>
                            )}
                            
                            {hasIncompleteOnboarding(seller) && (
                              <DropdownMenuItem 
                                onClick={() => {
                                  handleSendOnboardingReminder(seller._id);
                                }}
                                disabled={sendingReminder === seller._id}
                                className="flex items-center gap-2"
                              >
                                {sendingReminder === seller._id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Mail className="h-4 w-4" />
                                )}
                                <span>Send Onboarding Reminder</span>
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination Controls */}
          <div className="flex flex-col md:flex-row justify-between items-center mt-4 gap-4">
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <span className="text-muted-foreground">Show</span>
              <select
                className="h-8 rounded-md bg-zinc-900 border border-zinc-800 px-2 text-white"
                value={limit}
                onChange={handleLimitChange}
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
              <span className="text-muted-foreground">per page</span>
            </div>
            
            <div className="text-xs sm:text-sm text-muted-foreground text-center">
              Showing {sellers.length ? (pagination.currentPage - 1) * pagination.sellersPerPage + 1 : 0}-
              {Math.min(pagination.currentPage * pagination.sellersPerPage, pagination.totalSellers)} of {pagination.totalSellers} sellers
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(1)}
                disabled={pagination.currentPage === 1}
                className="h-7 sm:h-8 w-7 sm:w-8 p-0"
              >
                <span className="sr-only">First Page</span>
                <span>«</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="h-7 sm:h-8 w-7 sm:w-8 p-0"
              >
                <span className="sr-only">Previous Page</span>
                <span>‹</span>
              </Button>
              
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                // Calculate which page numbers to show
                let pageNum = i + 1;
                if (pagination.totalPages > 5) {
                  if (pagination.currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.currentPage >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = pagination.currentPage - 2 + i;
                  }
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === pagination.currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                    className="h-7 sm:h-8 w-7 sm:w-8 p-0 hidden xs:flex xs:items-center xs:justify-center"
                  >
                    <span className="sr-only">Page {pageNum}</span>
                    <span>{pageNum}</span>
                  </Button>
                );
              })}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                className="h-7 sm:h-8 w-7 sm:w-8 p-0"
              >
                <span className="sr-only">Next Page</span>
                <span>›</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.totalPages)}
                disabled={pagination.currentPage === pagination.totalPages}
                className="h-7 sm:h-8 w-7 sm:w-8 p-0"
              >
                <span className="sr-only">Last Page</span>
                <span>»</span>
              </Button>
            </div>
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
                  <div className="h-32 md:h-48 w-full">
                    <img 
                      src={selectedSeller.storeBanner.url} 
                      alt="Store Banner"
                      className="w-full h-full object-cover opacity-40"
                    />
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-zinc-950/90 to-transparent">
                  <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
                    <Avatar className="h-16 w-16 md:h-24 md:w-24 border-4 border-zinc-950">
                      <AvatarImage src={selectedSeller.storeAvatar?.url} />
                      <AvatarFallback className="bg-zinc-800">
                        {selectedSeller.accountType === "business" ? 
                          <Store className="h-8 w-8 md:h-12 md:w-12" /> : 
                          <User className="h-8 w-8 md:h-12 md:w-12" />
                        }
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-center md:text-left">
                      <h2 className="text-xl md:text-3xl font-bold text-white">{getDisplayName(selectedSeller)}</h2>
                      {selectedSeller.storeName && (
                        <p className="text-base md:text-lg text-zinc-300 mt-1">
                          <Store className="h-4 w-4 inline mr-1" />
                          {selectedSeller.storeName}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-2">
                        <Badge variant="outline" className={`
                          px-2 py-1 
                          ${selectedSeller.accountType === "business" ? "bg-blue-500/10 text-blue-400" : "bg-purple-500/10 text-purple-400"}
                        `}>
                          {selectedSeller.accountType === "business" ? 
                            <Briefcase className="h-3 w-3 mr-1" /> : 
                            <User className="h-3 w-3 mr-1" />
                          }
                          {selectedSeller.accountType}
                        </Badge>
                        <Badge variant="outline" className={`
                          px-2 py-1
                          ${selectedSeller.isVerified ? "bg-green-500/10 text-green-400" : "bg-yellow-500/10 text-yellow-400"}
                        `}>
                          {selectedSeller.isVerified ? 
                            <CheckCircle2 className="h-3 w-3 mr-1" /> : 
                            <Clock className="h-3 w-3 mr-1" />
                          }
                          {selectedSeller.isVerified ? "Verified" : "Pending Verification"}
                        </Badge>
                        {selectedSeller.emailVerified && (
                          <Badge variant="outline" className="bg-green-500/10 text-green-400 px-2 py-1">
                            <Mail className="h-3 w-3 mr-1" />
                            Email Verified
                          </Badge>
                        )}
                        {selectedSeller.isFeatured && (
                          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 px-2 py-1">
                            <Star className="h-3 w-3 mr-1 fill-current" />
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
                        <p className="text-zinc-100 break-words">{selectedSeller.email}</p>
                      </div>
                      <div>
                        <label className="text-sm text-zinc-400">Phone</label>
                        <p className="text-zinc-100">{selectedSeller.phoneNumber}</p>
                      </div>
                      {selectedSeller.accountType === "business" && (
                        <>
                          <div>
                            <label className="text-sm text-zinc-400">Business Email</label>
                            <p className="text-zinc-100 break-words">{selectedSeller.businessEmail}</p>
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

                  {/* Verification Status */}
                  {!selectedSeller.isVerified && (
                    <div className="bg-zinc-900 rounded-lg p-5 border border-zinc-800">
                      <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-zinc-400" />
                        Verification Status
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 px-2 py-1">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        </div>
                        <div className="space-y-2 mt-3">
                          {(!selectedSeller.accountType || selectedSeller.accountType === "N/A") && (
                            <div className="flex items-center gap-2 text-sm text-red-400">
                              <AlertCircle className="h-4 w-4" />
                              <span>Account type is not set or invalid</span>
                            </div>
                          )}
                          {!selectedSeller.verificationDocuments?.documents?.length && (
                            <div className="flex items-center gap-2 text-sm text-red-400">
                              <AlertCircle className="h-4 w-4" />
                              <span>Missing verification documents</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Middle Column - Stats & Performance */}
                <div className="space-y-6 md:col-span-2">
                  {/* Store Statistics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800">
                      <h3 className="text-xs md:text-sm font-medium text-zinc-400">Store Visits</h3>
                      <div className="mt-2 flex items-center gap-2">
                        <Eye className="h-4 w-4 md:h-5 md:w-5 text-blue-400" />
                        <span className="text-xl md:text-2xl font-bold text-white">
                          {selectedSeller.storeVisits || 0}
                        </span>
                      </div>
                    </div>
                    
                    <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800">
                      <h3 className="text-xs md:text-sm font-medium text-zinc-400">Wallet Balance</h3>
                      <div className="mt-2 flex items-center gap-2">
                        <Wallet className="h-4 w-4 md:h-5 md:w-5 text-green-400" />
                        <span className="text-xl md:text-2xl font-bold text-white">
                          ${selectedSeller.walletBalance || 0}
                        </span>
                      </div>
                    </div>

                    <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800">
                      <h3 className="text-xs md:text-sm font-medium text-zinc-400">Products</h3>
                      <div className="mt-2 flex items-center gap-2">
                        <Package className="h-4 w-4 md:h-5 md:w-5 text-orange-400" />
                        <span className="text-xl md:text-2xl font-bold text-white">
                          {selectedSeller.productCount || 0}
                        </span>
                      </div>
                    </div>

                    <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800">
                      <h3 className="text-xs md:text-sm font-medium text-zinc-400">Followers</h3>
                      <div className="mt-2 flex items-center gap-2">
                        <Users className="h-4 w-4 md:h-5 md:w-5 text-purple-400" />
                        <span className="text-xl md:text-2xl font-bold text-white">
                          {selectedSeller.followers?.length || 0}
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
                          <p className="text-xs md:text-sm text-zinc-400">Recipients</p>
                          <p className="text-lg md:text-xl font-bold text-white mt-1">
                            {selectedSeller.campaignStats.totalRecipients}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs md:text-sm text-zinc-400">Opens</p>
                          <p className="text-lg md:text-xl font-bold text-white mt-1">
                            {selectedSeller.campaignStats.totalOpens}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs md:text-sm text-zinc-400">Clicks</p>
                          <p className="text-lg md:text-xl font-bold text-white mt-1">
                            {selectedSeller.campaignStats.totalClicks}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs md:text-sm text-zinc-400">Daily Campaigns</p>
                          <p className="text-lg md:text-xl font-bold text-white mt-1">
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
                  {selectedSeller?.verificationDocuments?.documents && selectedSeller.verificationDocuments.documents.length > 0 && (
                    <div className="bg-zinc-900 p-5 rounded-lg border border-zinc-800">
                      <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                        <FileText className="h-5 w-5 text-zinc-400" />
                        Verification Documents
                      </h3>
                      <div className="grid gap-4 sm:grid-cols-2">
                        {selectedSeller.verificationDocuments?.documents.map((doc) => (
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
                    </div>
                  )}

                  {/* About Store */}
                  {selectedSeller.aboutStore && (
                    <div className="bg-zinc-900 p-5 rounded-lg border border-zinc-800">
                      <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                        <Store className="h-5 w-5 text-zinc-400" />
                        About Store
                      </h3>
                      <p className="text-zinc-100">{selectedSeller.aboutStore}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent className="bg-zinc-950 text-zinc-100 border border-zinc-800 max-w-md w-[90%]">
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
              onClick={handleReject}
              disabled={!rejectReason || isRejecting}
              className="w-full sm:w-auto"
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

      {/* Reminder Result Modal */}
      <Dialog open={showReminderResultModal} onOpenChange={setShowReminderResultModal}>
        <DialogContent className="bg-zinc-950 text-zinc-100 border border-zinc-800 max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-white">
              <Mail className="h-5 w-5 text-primary" />
              Onboarding Reminder Results
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2 text-lg font-medium">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Sent {reminderResult?.count || 0} reminder emails
            </div>
            
            {reminderResult && reminderResult.processedSellers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Seller</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Incomplete Steps</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reminderResult.processedSellers.map((seller) => (
                    <TableRow key={seller.sellerId}>
                      <TableCell>
                        {seller.businessName || seller.name}
                      </TableCell>
                      <TableCell>{seller.email}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {seller.incompleteSteps.map((step, index) => (
                            <Badge key={index} variant="outline" className="bg-yellow-500/10 text-yellow-400">
                              {step}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground">No reminders were sent. All sellers may have completed their onboarding.</p>
            )}
          </div>
          
          <DialogFooter>
            <Button onClick={() => setShowReminderResultModal(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={successDialog.show} onOpenChange={handleCloseSuccessDialog}>
        <DialogContent className="bg-zinc-950 text-zinc-100 border border-zinc-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-white">
              {successDialog.icon === "success" && (
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              )}
              {successDialog.icon === "warning" && (
                <AlertCircle className="h-6 w-6 text-yellow-500" />
              )}
              {successDialog.icon === "error" && (
                <XCircle className="h-6 w-6 text-red-500" />
              )}
              {successDialog.icon === "info" && (
                <AlertCircle className="h-6 w-6 text-blue-500" />
              )}
              {successDialog.title}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-zinc-200">{successDialog.message}</p>
          </div>
          <DialogFooter>
            <Button onClick={handleCloseSuccessDialog}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Sellers
