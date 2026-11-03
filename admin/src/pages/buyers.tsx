import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  Eye,
  Search,
  Filter,
  FileDown,
  User,
  Mail,
  Phone,
  Calendar,
  ShieldCheck,
  ShieldAlert,
  Globe,
  ChevronLeft,
  ChevronRight,
  Info
} from "lucide-react";
import { api } from "@/api/axios";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

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
  isIdentityVerified: boolean;
  profilePicture?: string;
  wallet?: {
    balance: number;
    currency: string;
  };
  preferredCurrency?: string;
  identityDocument?: {
    url?: string;
    status: 'pending' | 'verified' | 'rejected';
  };
}

interface PaginatedResponse {
  success: boolean;
  currentPage: number;
  totalPages: number;
  totalUsers: number;
  users: Buyer[];
}

function Buyers() {
  const { toast } = useToast();
  const navigate = useNavigate();

  // State
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [verificationFilter, setVerificationFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(10);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchBuyers();
  }, [currentPage, limit, verificationFilter, statusFilter, sortBy, countryFilter, search]);

  const fetchBuyers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", currentPage.toString());
      params.append("limit", limit.toString());
      if (search) params.append("search", search);
      if (verificationFilter !== "all") params.append("isVerified", verificationFilter === "verified" ? "true" : "false");
      if (statusFilter !== "all") params.append("isDisabled", statusFilter === "disabled" ? "true" : "false");
      if (countryFilter !== "all") params.append("country", countryFilter);
      params.append("sortBy", sortBy);

      const response = await api.get<PaginatedResponse>(`/api/admin/users?${params.toString()}`);
      setBuyers(response.data.users);
      setTotalPages(response.data.totalPages);
      setCurrentPage(response.data.currentPage);
    } catch (err) {
      toast({ variant: "destructive", description: "Failed to fetch buyers" });
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = () => {
    setSearch(searchInput);
    setCurrentPage(1);
  };

  const toggleDisabled = async (buyerId: string, currentState: boolean) => {
    setUpdatingId(buyerId);
    try {
      await api.put(`/api/admin/buyers/${buyerId}/${currentState ? 'enable' : 'disable'}`);
      setBuyers(buyers.map(b => b._id === buyerId ? { ...b, isDisabled: !currentState } : b));
      toast({ description: `Buyer ${currentState ? 'enabled' : 'disabled'} successfully` });
    } catch (err) {
      toast({ variant: "destructive", description: "Update failed" });
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  const formatCurrency = (val: number, curr?: string) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: curr || 'NGN', maximumFractionDigits: 0 }).format(val);
  };

  const StatusBadge = ({ condition, activeText, inactiveText, activeClass, inactiveClass }: any) => (
    <Badge variant="outline" className={cn(
      "px-2 py-0.5 rounded-md text-[10px] font-bold border",
      condition ? activeClass : inactiveClass
    )}>
      {condition ? activeText : inactiveText}
    </Badge>
  );

  return (
    <div className="space-y-8 p-6 md:p-8 max-w-[1600px] mx-auto min-h-screen">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <User className="h-6 w-6 text-blue-500" />
            </div>
            Buyers
          </h1>
          <p className="text-slate-400 mt-2 text-sm">Manage and monitor platform buyers.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="bg-slate-900/50 border-slate-800 hover:bg-slate-800 text-slate-300 gap-2 h-10 px-4 rounded-xl"
            disabled={exporting}
          >
            <FileDown className="h-4 w-4" />
            <span>Export</span>
          </Button>
        </div>
      </div>

      {/* Filter Shell */}
      <Card className="border-slate-800/60 bg-slate-950/40 backdrop-blur-md overflow-hidden rounded-2xl">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
            {/* Search Input */}
            <div className="lg:col-span-12 space-y-2">
              <label className="text-[10px] uppercase font-black tracking-widest text-slate-500 ml-1">Search</label>
              <div className="flex gap-2">
                <div className="relative flex-1 group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                  <Input
                    placeholder="Search by ID, name, or email..."
                    className="pl-10 h-12 bg-slate-900/50 border-slate-800/60 rounded-xl focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm text-slate-200 placeholder:text-slate-600"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
                  />
                </div>
                <Button
                  onClick={handleSearchSubmit}
                  className="h-12 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-widest"
                >
                  Search
                </Button>
              </div>
            </div>

            {/* Filters */}
            <div className="lg:col-span-12 flex flex-wrap items-center gap-4 mt-2">
              <div className="space-y-2 flex-1 min-w-[140px]">
                <label className="text-[10px] uppercase font-black tracking-widest text-slate-500 ml-1">Verification</label>
                <Select value={verificationFilter} onValueChange={setVerificationFilter}>
                  <SelectTrigger className="h-12 bg-slate-900/50 border-slate-800/60 rounded-xl text-slate-300">
                    <SelectValue placeholder="Verification" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-slate-300">
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="unverified">Unverified</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 flex-1 min-w-[140px]">
                <label className="text-[10px] uppercase font-black tracking-widest text-slate-500 ml-1">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-12 bg-slate-900/50 border-slate-800/60 rounded-xl text-slate-300">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-slate-300">
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="disabled">Disabled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 flex-1 min-w-[140px]">
                <label className="text-[10px] uppercase font-black tracking-widest text-slate-500 ml-1">Country</label>
                <Select value={countryFilter} onValueChange={setCountryFilter}>
                  <SelectTrigger className="h-12 bg-slate-900/50 border-slate-800/60 rounded-xl text-slate-300">
                    <SelectValue placeholder="Country" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-slate-300">
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="NG">Nigeria</SelectItem>
                    <SelectItem value="US">United States</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 flex-1 min-w-[140px]">
                <label className="text-[10px] uppercase font-black tracking-widest text-slate-500 ml-1">Sort By</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="h-12 bg-slate-900/50 border-slate-800/60 rounded-xl text-slate-300">
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-slate-300">
                    <SelectItem value="newest">Recent First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="name_asc">Name A-Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="ghost"
                onClick={() => {
                  setSearchInput("");
                  setSearch("");
                  setVerificationFilter("all");
                  setStatusFilter("all");
                  setCountryFilter("all");
                  setSortBy("newest");
                }}
                className="h-12 px-4 rounded-xl text-slate-500 hover:text-white hover:bg-slate-800 self-end"
              >
                <Filter className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table Shell */}
      <Card className="border-slate-800/60 bg-slate-950/40 rounded-2xl overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-900/40 border-b border-slate-800/60">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="py-5 text-[10px] uppercase font-black text-slate-500 tracking-widest h-auto">Buyer Info</TableHead>
                <TableHead className="py-5 text-[10px] uppercase font-black text-slate-500 tracking-widest h-auto">Contact</TableHead>
                <TableHead className="py-5 text-[10px] uppercase font-black text-slate-500 tracking-widest h-auto text-center">Verification</TableHead>
                <TableHead className="py-5 text-[10px] uppercase font-black text-slate-500 tracking-widest h-auto">Status</TableHead>
                <TableHead className="py-5 text-[10px] uppercase font-black text-slate-500 tracking-widest h-auto text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center border-none">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Syncing...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : buyers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center border-none text-slate-500 font-medium text-sm italic">
                    No buyers found.
                  </TableCell>
                </TableRow>
              ) : buyers.map((buyer) => (
                <TableRow key={buyer._id} className="border-b border-slate-800/40 hover:bg-slate-900/30 transition-colors group">
                  <TableCell className="py-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10 rounded-xl border border-slate-800 overflow-hidden shadow-lg">
                        <AvatarImage src={buyer.profilePicture} />
                        <AvatarFallback className="bg-slate-800 text-slate-400 font-black text-xs">
                          {buyer.firstName?.[0]}{buyer.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-slate-100 group-hover:text-blue-400 transition-colors tracking-tight text-sm">
                          {buyer.firstName} {buyer.lastName}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-medium text-slate-500 tracking-wider">@{buyer.username}</span>
                          <div className="h-1 w-1 rounded-full bg-slate-700" />
                          <span className="text-[10px] font-mono text-slate-600 lowercase">{buyer._id.slice(-6)}</span>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        <Mail className="h-3 w-3 text-slate-500" />
                        <span>{buyer.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium tracking-tight">
                        <Phone className="h-3 w-3 opacity-50" />
                        <span>{buyer.phoneNumber || "No phone"}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex items-center gap-2">
                        <StatusBadge
                          condition={buyer.emailVerified}
                          activeText="Email Verified"
                          inactiveText="Email Unverified"
                          activeClass="bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                          inactiveClass="bg-rose-500/10 text-rose-500 border-rose-500/20"
                        />
                        <StatusBadge
                          condition={buyer.isIdentityVerified}
                          activeText="KYC Verified"
                          inactiveText="KYC Pending"
                          activeClass="bg-blue-500/10 text-blue-500 border-blue-500/20"
                          inactiveClass="bg-amber-500/10 text-amber-500 border-amber-500/20"
                        />
                      </div>
                      <div className="flex items-center gap-4 py-1.5 px-3 rounded-lg bg-slate-900 border border-slate-800 shadow-inner">
                        <div className="flex flex-col items-start min-w-[60px]">
                          <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest leading-none mb-1">Balance</span>
                          <span className="text-xs font-bold text-slate-200">
                            {formatCurrency(buyer.wallet?.balance || 0, buyer.wallet?.currency)}
                          </span>
                        </div>
                        <div className="w-px h-6 bg-slate-800" />
                        <div className="flex flex-col items-start min-w-[60px]">
                          <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest leading-none mb-1">Country</span>
                          <div className="flex items-center gap-1">
                            <Globe className="h-3 w-3 text-slate-500" />
                            <span className="text-xs font-bold text-slate-200 uppercase">{buyer.country || "INTL"}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Badge
                        variant="outline"
                        className={cn(
                          "w-fit px-3 py-1 rounded-full text-[10px] font-black tracking-widest border transition-all",
                          buyer.isDisabled
                            ? "bg-rose-600/10 text-rose-500 border-rose-500/20 shadow-[0_0_12px_rgba(244,63,94,0.1)]"
                            : "bg-blue-600/10 text-blue-400 border-blue-500/20 shadow-[0_0_12px_rgba(59,130,246,0.1)]"
                        )}
                      >
                        {buyer.isDisabled ? "DISABLED" : "ACTIVE"}
                      </Badge>
                      <span className="text-[10px] font-bold text-slate-600 ml-1.5 flex items-center gap-1.5">
                        <Calendar className="h-3 w-3 opacity-50" />
                        Joined {formatDate(buyer.createdAt)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/dashboard/buyer-detail/${buyer._id}`)}
                        className="bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300 h-9 px-4 rounded-xl group/btn transition-all active:scale-95"
                      >
                        <Eye className="h-4 w-4 mr-2 text-blue-500 opacity-70 group-hover/btn:opacity-100" />
                        <span className="text-xs font-bold uppercase tracking-tighter">View</span>
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "h-9 w-9 rounded-xl border border-slate-800/50 transition-all",
                          buyer.isDisabled
                            ? "text-emerald-500 hover:bg-emerald-500/10 hover:border-emerald-500/30"
                            : "text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/30"
                        )}
                        onClick={() => toggleDisabled(buyer._id, buyer.isDisabled)}
                        disabled={updatingId === buyer._id}
                      >
                        {updatingId === buyer._id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          buyer.isDisabled ? <ShieldCheck className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Global Pagination */}
        {totalPages > 0 && (
          <div className="p-4 bg-slate-900/20 border-t border-slate-800/60 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black uppercase text-slate-600 tracking-widest">Rows per page</span>
              <Select value={limit.toString()} onValueChange={(v) => { setLimit(parseInt(v)); setCurrentPage(1); }}>
                <SelectTrigger className="w-[80px] h-9 bg-slate-900 border-slate-800 rounded-lg text-xs font-bold ring-0 focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <div className="w-px h-4 bg-slate-800 mx-1" />
              <span className="text-xs font-bold text-slate-500">Page {currentPage} of {totalPages}</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-xl bg-slate-900 border-slate-800 hover:bg-blue-600/10 disabled:opacity-30 disabled:hover:bg-slate-900"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-1.5 px-2">
                {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                  const pageNum = i + 1;
                  return (
                    <div
                      key={i}
                      className={cn(
                        "h-1 transition-all duration-300 rounded-full",
                        currentPage === pageNum ? "w-4 bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" : "w-1.5 bg-slate-800"
                      )}
                    />
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-xl bg-slate-900 border-slate-800 hover:bg-blue-600/10 disabled:opacity-30 disabled:hover:bg-slate-900"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Infrastructure Note */}
      <div className="flex items-center justify-center gap-2 text-[10px] font-black text-slate-700 uppercase tracking-[0.3em] py-4">
        <Info className="h-3 w-3 opacity-50" />
        <span>Auqli Admin v1.0</span>
      </div>
    </div>
  );
}

export default Buyers;
