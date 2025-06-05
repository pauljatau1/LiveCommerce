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
import { Loader2, Copy, Download, Trash2, Eye, Search, Filter, FileDown } from "lucide-react";
import { api } from "@/api/axios";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

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
  isNewBuyer?: boolean;
  wallet?: {
    balance: number;
    currency: string;
  };
  preferredCurrency?: string;
  authProvider?: string;
  shippingAddresses?: Array<{
    addressType?: string;
    country?: string;
    state?: string;
    city?: string;
    addressLine1?: string;
    addressLine2?: string;
    zipCode?: string;
    _id?: string;
  }>;
}

interface PaginatedResponse {
  success: boolean;
  currentPage: number;
  totalPages: number;
  totalUsers: number;
  usersPerPage: number;
  users: Buyer[];
}

function Buyers() {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Filtering and pagination state
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState(""); // New state for input value
  const [verificationFilter, setVerificationFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(10);
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [totalUsers, setTotalUsers] = useState(0);
  
  // Data state
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Operations state
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [buyerToDelete, setBuyerToDelete] = useState<Buyer | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Add new state for export functionality
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchBuyers();
  }, [currentPage, limit, verificationFilter, statusFilter, sortBy, countryFilter]);

  const fetchBuyers = async () => {
    setLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append("page", currentPage.toString());
      params.append("limit", limit.toString());
      
      if (search) params.append("search", search);
      
      if (verificationFilter && verificationFilter !== "all") {
        params.append("isVerified", verificationFilter === "verified" ? "true" : "false");
      }
      
      if (statusFilter && statusFilter !== "all") {
        params.append("isDisabled", statusFilter === "disabled" ? "true" : "false");
      }
      
      if (countryFilter && countryFilter !== "all") {
        params.append("country", countryFilter);
      }
      
      // Map sortBy values to backend sort options
      if (sortBy) {
        let sortParam;
        switch (sortBy) {
          case "name_asc":
            sortParam = "name_asc";
            break;
          case "name_desc":
            sortParam = "name_desc";
            break;
          case "oldest":
            sortParam = "oldest";
            break;
          case "email":
            sortParam = "email";
            break;
          default:
            sortParam = "newest"; // Default is newest first
        }
        params.append("sortBy", sortParam);
      }
      
      const response = await api.get<PaginatedResponse>(`/api/admin/users?${params.toString()}`);
      setBuyers(response.data.users);
      setTotalPages(response.data.totalPages);
      setTotalUsers(response.data.totalUsers);
      setCurrentPage(response.data.currentPage);
    } catch (err) {
      setError("Failed to fetch buyers");
      console.error("Error fetching buyers:", err);
    } finally {
      setLoading(false);
    }
  };

  // New handlers for search
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };

  const handleSearchSubmit = () => {
    setSearch(searchInput);
    setCurrentPage(1); // Reset to first page on new search
    fetchBuyers();
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
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

  const handleDeleteClick = (buyer: Buyer) => {
    setBuyerToDelete(buyer);
    setShowDeleteDialog(true);
  };

  const confirmDeleteBuyer = async () => {
    if (!buyerToDelete) return;
    
    setDeletingId(buyerToDelete._id);
    try {
      await api.delete(`/api/admin/buyers/${buyerToDelete._id}`);
      
      // Remove the buyer from the state
      setBuyers(buyers.filter(buyer => buyer._id !== buyerToDelete._id));
      
      toast({
        description: "Buyer account deleted successfully",
      });
    } catch (err) {
      console.error("Error deleting buyer account:", err);
      toast({
        variant: "destructive",
        description: "Failed to delete buyer account",
      });
    } finally {
      setDeletingId(null);
      setShowDeleteDialog(false);
      setBuyerToDelete(null);
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

  const navigateToBuyerDetails = (buyerId: string) => {
    navigate(`/dashboard/buyer-detail/${buyerId}`);
  };

  // Updated handlePageChange
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  // Updated handleLimitChange
  const handleLimitChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setLimit(Number(event.target.value));
    setCurrentPage(1); // Reset to first page when limit changes
  };

  // Add filter reset function
  const resetFilters = () => {
    setSearch("");
    setSearchInput("");
    setVerificationFilter("all");
    setStatusFilter("all");
    setCountryFilter("all");
    setSortBy("newest");
    setCurrentPage(1);
    // Fetch buyers with reset filters
    fetchBuyers();
  };

  // Add CSV export functionality
  const fetchAllBuyers = async (): Promise<Buyer[]> => {
    try {
      // Fetch all buyers without pagination
      const params = new URLSearchParams();
      params.append("limit", "10000"); // Large number to get all buyers
      
      if (search) params.append("search", search);
      
      if (verificationFilter && verificationFilter !== "all") {
        params.append("isVerified", verificationFilter === "verified" ? "true" : "false");
      }
      
      if (statusFilter && statusFilter !== "all") {
        params.append("isDisabled", statusFilter === "disabled" ? "true" : "false");
      }
      
      if (countryFilter && countryFilter !== "all") {
        params.append("country", countryFilter);
      }
      
      if (sortBy) {
        let sortParam;
        switch (sortBy) {
          case "name_asc":
            sortParam = "name_asc";
            break;
          case "name_desc":
            sortParam = "name_desc";
            break;
          case "oldest":
            sortParam = "oldest";
            break;
          case "email":
            sortParam = "email";
            break;
          default:
            sortParam = "newest";
        }
        params.append("sortBy", sortParam);
      }
      
      const response = await api.get<PaginatedResponse>(`/api/admin/users?${params.toString()}`);
      return response.data.users;
    } catch (err) {
      console.error("Error fetching all buyers:", err);
      throw err;
    }
  };

  const convertToCSV = (buyers: Buyer[]): string => {
    // Define CSV headers
    const headers = [
      "Name",
      "Email",
      "Phone Number",
      "Country",
      "State",
      "Wallet Balance",
      "Wallet Currency",
      "Join Date"
    ];

    // Convert buyers data to CSV rows
    const rows = buyers.map(buyer => {
      // Extract state from shipping addresses if available
      const primaryAddress = buyer.shippingAddresses?.[0];
      const state = primaryAddress?.state || "";
      
      return [
        `${buyer.firstName || ""} ${buyer.lastName || ""}`.trim(),
        buyer.email || "",
        buyer.phoneNumber || "",
        buyer.country || "",
        state,
        buyer.wallet?.balance?.toString() || "0",
        buyer.wallet?.currency || "",
        formatDate(buyer.createdAt)
      ];
    });

    // Combine headers and rows
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => {
        // Escape fields that contain commas, quotes, or newlines
        const stringField = String(field);
        if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
          return `"${stringField.replace(/"/g, '""')}"`;
        }
        return stringField;
      }).join(','))
      .join('\n');

    return csvContent;
  };

  const downloadCSV = (csvContent: string, filename: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const allBuyers = await fetchAllBuyers();
      const csvContent = convertToCSV(allBuyers);
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `buyers_export_${timestamp}.csv`;
      
      downloadCSV(csvContent, filename);
      
      toast({
        description: `Successfully exported ${allBuyers.length} buyers to CSV`,
      });
    } catch (err) {
      console.error("Error exporting buyers:", err);
      toast({
        variant: "destructive",
        description: "Failed to export buyers. Please try again.",
      });
    } finally {
      setExporting(false);
    }
  };

  if (loading && buyers.length === 0) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error && buyers.length === 0) {
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

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium">Filters</h3>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleExportCSV}
                disabled={exporting}
                className="text-xs h-8"
              >
                {exporting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <FileDown className="h-4 w-4 mr-2" />
                )}
                Export CSV
              </Button>
              <Button 
                variant="ghost" 
                onClick={resetFilters}
                className="text-xs h-8"
              >
                Reset All
              </Button>
            </div>
          </div>
          
          <div className="flex gap-2 flex-1 min-w-[200px]">
            <div className="relative flex-1">
              <Input
                placeholder="Search buyers..."
                value={searchInput}
                onChange={handleSearchInputChange}
                onKeyDown={handleSearchKeyDown}
                className="pr-16"
              />
              <Button 
                variant="secondary" 
                onClick={handleSearchSubmit}
                className="absolute right-0 top-0 h-full rounded-l-none"
              >
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Select value={verificationFilter} onValueChange={setVerificationFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Verification" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="unverified">Unverified</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="name_asc">Name A-Z</SelectItem>
                <SelectItem value="name_desc">Name Z-A</SelectItem>
                <SelectItem value="email">Email</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={countryFilter} onValueChange={setCountryFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Countries</SelectItem>
                <SelectItem value="US">United States</SelectItem>
                <SelectItem value="UK">United Kingdom</SelectItem>
                <SelectItem value="CA">Canada</SelectItem>
                <SelectItem value="AU">Australia</SelectItem>
                {/* Add more countries as needed */}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Card className="p-6 overflow-auto">
        {loading && buyers.length > 0 && (
          <div className="flex justify-center my-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
        
        <div className="min-w-[1000px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">Buyer</TableHead>
                <TableHead>Contact Info</TableHead>
                <TableHead>Identity Status</TableHead>
                <TableHead>Verification</TableHead>
                <TableHead>Wallet</TableHead>
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
                        @{buyer.username}
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
                      {buyer.isNewBuyer && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs mt-1 inline-block">
                          New
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm">
                        {buyer.email}
                      </div>
                      <div className="text-sm">
                        {buyer.phoneNumber}
                      </div>
                      <div className="text-sm">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-800">
                          {buyer.country}
                        </span>
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
                    <div className="space-y-2">
                      <div>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          buyer.emailVerified 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          Email: {buyer.emailVerified ? 'Verified' : 'Unverified'}
                        </span>
                      </div>
                      {/* <div>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          buyer.phoneVerified 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          Phone: {buyer.phoneVerified ? 'Verified' : 'Unverified'}
                        </span>
                      </div> */}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {buyer.wallet ? (
                        <>
                          <div className="font-medium">
                            {buyer.wallet.balance.toLocaleString()} {buyer.wallet.currency || buyer.preferredCurrency}
                          </div>
                         
                        </>
                      ) : (
                        <div className="text-xs text-muted-foreground">No wallet data</div>
                      )}
                    </div>
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigateToBuyerDetails(buyer._id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Details
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {/* Improved Pagination */}
        {totalPages > 0 && (
          <div className="flex flex-col md:flex-row justify-between items-center mt-6 gap-4">
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <span className="text-muted-foreground">Show</span>
              <select
                className="h-8 rounded-md bg-background border border-input px-2"
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
              Showing {buyers.length ? ((currentPage - 1) * limit) + 1 : 0}-
              {Math.min(currentPage * limit, totalUsers)} of {totalUsers} buyers
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                className="h-7 sm:h-8 w-7 sm:w-8 p-0"
              >
                <span className="sr-only">First Page</span>
                <span>«</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="h-7 sm:h-8 w-7 sm:w-8 p-0"
              >
                <span className="sr-only">Previous Page</span>
                <span>‹</span>
              </Button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                // Calculate which page numbers to show
                let pageNum = i + 1;
                if (totalPages > 5) {
                  if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === currentPage ? "default" : "outline"}
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
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="h-7 sm:h-8 w-7 sm:w-8 p-0"
              >
                <span className="sr-only">Next Page</span>
                <span>›</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                className="h-7 sm:h-8 w-7 sm:w-8 p-0"
              >
                <span className="sr-only">Last Page</span>
                <span>»</span>
              </Button>
            </div>
          </div>
        )}
      </Card>
      
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete {buyerToDelete?.firstName} {buyerToDelete?.lastName}'s account.
              This action cannot be undone and will remove all of their data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteBuyer} className="bg-destructive text-white">
              {deletingId ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default Buyers;
