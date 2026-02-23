import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  Building2,
  Mail,
  Eye,
  Store,
  ShieldCheck,
  Package,
  Users,
  Zap,
  Search,
  MoreVertical,
  FileDown,
  Loader2,
  CheckCircle2,
  Star,
  XCircle,
  ShieldIcon,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { api } from "@/api/axios";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Types
interface Seller {
  _id: string;
  businessName?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phoneNumber: string;
  isVerified: boolean;
  isFeatured: boolean;
  isDisabled?: boolean;
  accountType?: string;
  createdAt: string;
  walletBalance: number;
  productCount?: number;
  storeAvatar?: { url: string };
  isProfileComplete: boolean;
  storeName?: string;
}

function Sellers() {
  const navigate = useNavigate();
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState({
    totalSellers: 0,
    verifiedSellers: 0,
    totalProducts: 0,
    businessAccounts: 0
  });

  useEffect(() => {
    fetchSellers();
    fetchStats();
  }, [page, limit, selectedTab, search]);

  const fetchStats = async () => {
    try {
      const resp = await api.get('/api/admin/sellers/statistics');
      if (resp.data.success) {
        setStats({
          totalSellers: resp.data.totalSellers || 0,
          verifiedSellers: resp.data.totalVerifiedSellers || 0,
          totalProducts: resp.data.totalProducts || 0,
          businessAccounts: resp.data.totalBusinessAccounts || 0
        });
      }
    } catch (err) {
      console.error("Stats fetch failed");
    }
  };

  const fetchSellers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      if (search) params.append('search', search);
      if (selectedTab !== 'all') params.append('accountType', selectedTab);

      const response = await api.get(`/api/admin/sellers?${params.toString()}`);
      if (response.data.success) {
        setSellers(response.data.sellers);
        setTotalPages(response.data.totalPages);
      }
    } catch (err) {
      toast({ variant: "destructive", description: "Failed to fetch merchants" });
    } finally {
      setLoading(false);
    }
  };

  const toggleVerification = async (sellerId: string) => {
    setUpdatingId(sellerId);
    try {
      await api.put(`/api/admin/sellers/${sellerId}/verify`);
      setSellers(sellers.map(s => s._id === sellerId ? { ...s, isVerified: !s.isVerified } : s));
      toast({ description: "Verification status updated" });
    } catch (err) {
      toast({ variant: "destructive", description: "Update failed" });
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(val);
  };

  const StatCard = ({ title, value, icon: Icon, colorClass }: any) => (
    <Card className="border-slate-800/60 bg-slate-950/40 overflow-hidden relative group rounded-2xl">
      <div className={cn("absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 opacity-10 blur-2xl transition-all duration-500 group-hover:scale-150 rounded-full", colorClass.replace('text-', 'bg-'))} />
      <CardContent className="p-6 flex items-center gap-4 relative z-10">
        <div className={cn("p-4 rounded-2xl bg-opacity-10 shadow-lg border border-opacity-20", colorClass.replace('text-', 'bg-'), colorClass.replace('text-', 'border-'))}>
          <Icon className={cn("h-6 w-6", colorClass)} />
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{title}</p>
          <h3 className="text-2xl font-black text-white mt-1 tracking-tight">{value}</h3>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8 p-6 md:p-8 max-w-[1600px] mx-auto min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/20">
              <Store className="h-6 w-6 text-orange-500" />
            </div>
            Merchants
          </h1>
          <p className="text-slate-400 mt-2 text-sm">Manage and monitor platform sellers.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300 gap-2 h-11 px-5 rounded-2xl shadow-xl transition-all active:scale-95"
          >
            <FileDown className="h-4 w-4 text-orange-500" />
            <span className="font-bold uppercase text-[11px] tracking-widest">Export Data</span>
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Sellers" value={stats.totalSellers} icon={Users} colorClass="text-blue-500" />
        <StatCard title="Verified Sellers" value={stats.verifiedSellers} icon={ShieldCheck} colorClass="text-emerald-500" />
        <StatCard title="Total Products" value={stats.totalProducts} icon={Package} colorClass="text-orange-500" />
        <StatCard title="Business Accounts" value={stats.businessAccounts} icon={Building2} colorClass="text-purple-500" />
      </div>

      {/* Modern Filter Shell */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-6 bg-slate-950/40 p-4 border border-slate-800/60 rounded-3xl backdrop-blur-md">
        <div className="flex flex-1 items-center gap-4 w-full">
          <div className="relative w-full max-w-md group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-orange-500 transition-colors" />
            <Input
              placeholder="Search merchants..."
              className="pl-12 h-12 text-white bg-slate-900/40 border-slate-800/60 rounded-2xl text-sm focus:ring-orange-500/20 focus:border-orange-500 transistion-all"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && setSearch(searchInput)}
            />
          </div>

          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="hidden lg:block">
            <TabsList className="bg-slate-900/60 border border-slate-800/60 p-1 rounded-2xl h-12">
              <TabsTrigger value="all" className="rounded-xl px-4 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-orange-600 data-[state=active]:text-white transition-all">All</TabsTrigger>
              <TabsTrigger value="business" className="rounded-xl px-4 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-orange-600 data-[state=active]:text-white transition-all">Business</TabsTrigger>
              <TabsTrigger value="individual" className="rounded-xl px-4 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-orange-600 data-[state=active]:text-white transition-all">Individual</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
          <Badge variant="outline" className="bg-slate-900 border-slate-800 text-[10px] px-3 py-1.5 rounded-full text-slate-400 gap-2 cursor-pointer hover:border-slate-600">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            ACTIVE ONLY
          </Badge>
          <Badge variant="outline" className="bg-slate-900 border-slate-800 text-[10px] px-3 py-1.5 rounded-full text-slate-400 gap-2 cursor-pointer hover:border-slate-600">
            <div className="h-1.5 w-1.5 rounded-full bg-orange-500" />
            TOP RATED
          </Badge>
        </div>
      </div>

      {/* Merchant Table OS */}
      <Card className="border-slate-800/60 bg-slate-950/40 rounded-3xl overflow-hidden backdrop-blur-sm shadow-2xl">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-900/40 border-b border-slate-800/60">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] pl-8">Merchant Info</TableHead>
                <TableHead className="py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">Status</TableHead>
                <TableHead className="py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">Statistics</TableHead>
                <TableHead className="py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">Registration</TableHead>
                <TableHead className="py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] text-right pr-8">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center border-none">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                      <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Loading merchants...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : sellers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center border-none italic text-slate-600">
                    No merchants found.
                  </TableCell>
                </TableRow>
              ) : sellers.map((seller) => (
                <TableRow key={seller._id} className="border-b border-slate-800/40 hover:bg-slate-900/30 transition-all group">
                  <TableCell className="py-5 pl-8">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Avatar className="h-12 w-12 rounded-2xl border-2 border-slate-800 group-hover:border-orange-500/50 transition-all overflow-hidden shadow-xl">
                          <AvatarImage src={seller.storeAvatar?.url} />
                          <AvatarFallback className="bg-slate-800 text-slate-500 font-black tracking-tighter">
                            {seller.firstName?.[0]}{seller.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        {seller.isVerified && (
                          <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-blue-600 border-2 border-slate-950 flex items-center justify-center shadow-lg">
                            <CheckCircle2 className="h-2.5 w-2.5 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-black text-slate-100 group-hover:text-orange-400 transition-colors tracking-tight text-sm uppercase">
                          {seller.storeName || seller.businessName || `${seller.firstName} ${seller.lastName}`}
                        </span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[8px] font-black uppercase px-2 py-0 border-slate-800 text-slate-500 rounded-sm">
                            {seller.accountType || "REGULAR"}
                          </Badge>
                          <span className="text-[9px] font-mono text-slate-600 uppercase">{seller._id.slice(-6)}</span>
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <div className={cn("h-2 w-2 rounded-full", seller.isDisabled ? "bg-rose-500" : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]")} />
                        <span className={cn("text-xs font-bold uppercase tracking-tighter", seller.isDisabled ? "text-rose-500" : "text-emerald-500")}>
                          {seller.isDisabled ? "Disabled" : "Active"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3 text-slate-600" />
                        <span className="text-[11px] text-slate-400 font-medium truncate max-w-[150px]">{seller.email}</span>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-6">
                      <div className="flex flex-col gap-0.5 min-w-[70px]">
                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Products</span>
                        <div className="flex items-center gap-1.5">
                          <Package className="h-3 w-3 text-slate-500" />
                          <span className="text-xs font-bold text-slate-200">{seller.productCount || 0}</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-0.5 min-w-[90px]">
                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Balance</span>
                        <div className="flex items-center gap-1.5">
                          <Zap className="h-3 w-3 text-orange-500" />
                          <span className="text-xs font-bold text-slate-200">{formatCurrency(seller.walletBalance || 0)}</span>
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold text-slate-300 tracking-tight">{formatDate(seller.createdAt)}</span>
                      <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">Joined Date</span>
                    </div>
                  </TableCell>

                  <TableCell className="text-right pr-8">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/dashboard/seller-detail/${seller._id}`)}
                        className="bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300 h-10 px-4 rounded-xl group/btn transition-all active:scale-95"
                      >
                        <Eye className="h-4 w-4 mr-2 text-orange-500 opacity-70 group-hover/btn:opacity-100" />
                        <span className="text-[10px] font-black uppercase tracking-widest">View</span>
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-slate-800 border border-transparent hover:border-slate-700">
                            <MoreVertical className="h-4 w-4 text-slate-500" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 bg-slate-950 border-slate-800 rounded-2xl shadow-2xl p-2 pb-3">
                          <div className="px-3 py-2 mb-2 border-b border-slate-800/60">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Merchant Actions</span>
                          </div>
                          <DropdownMenuItem
                            className="rounded-xl px-3 py-2.5 text-xs font-bold text-slate-300 hover:bg-blue-600/10 hover:text-blue-400 gap-3 cursor-pointer"
                            onClick={() => toggleVerification(seller._id)}
                            disabled={updatingId === seller._id}
                          >
                            <ShieldCheck className="h-4 w-4" />
                            {seller.isVerified ? "Revoke Verification" : "Verify Seller"}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="rounded-xl px-3 py-2.5 text-xs font-bold text-slate-300 hover:bg-orange-600/10 hover:text-orange-400 gap-3 cursor-pointer">
                            <Star className="h-4 w-4" />
                            {seller.isFeatured ? "Unfeature" : "Feature Seller"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-slate-800/60 my-1 mx-2" />
                          <DropdownMenuItem className="rounded-xl px-3 py-2.5 text-xs font-bold text-rose-500 hover:bg-rose-600/10 gap-3 cursor-pointer">
                            <XCircle className="h-4 w-4" />
                            {seller.isDisabled ? "Enable Seller" : "Disable Seller"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Global Pagination Hub */}
        <div className="p-6 bg-slate-900/10 border-t border-slate-800/60 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Display</span>
              <select
                value={limit}
                onChange={(e) => { setLimit(parseInt(e.target.value)); setPage(1); }}
                className="bg-slate-900 border-slate-800 text-[10px] font-black text-slate-300 rounded-lg px-2 h-8 ring-0 focus:ring-1 focus:ring-orange-500/50"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              Page {page} of {totalPages}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              className="h-10 rounded-xl bg-slate-900 border-slate-800 font-black text-[10px] uppercase tracking-widest hover:bg-orange-600/10 hover:text-orange-500 disabled:opacity-30 px-6"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>

            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(3, totalPages) }).map((_, i) => (
                <div key={i} className={cn("h-1.5 rounded-full transition-all duration-300", page === (i + 1) ? "w-6 bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]" : "w-1.5 bg-slate-800")} />
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="h-10 rounded-xl bg-slate-900 border-slate-800 font-black text-[10px] uppercase tracking-widest hover:bg-orange-600/10 hover:text-orange-500 disabled:opacity-30 px-6"
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {/* Network Integrity Signal */}
      <div className="flex items-center justify-center gap-2 text-[10px] font-black text-slate-700 uppercase tracking-[0.4em] py-8 border-t border-slate-900">
        <ShieldIcon className="h-3 w-3 opacity-30" />
        <span>Auqli Admin v2.0</span>
      </div>
    </div>
  );
}

export default Sellers;
