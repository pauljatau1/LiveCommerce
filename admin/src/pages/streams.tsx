import { useState, useEffect } from "react";
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
import {
  Eye, Ban, Play, AlertCircle, Search, Filter,
  ChevronDown, Loader2, Video, Calendar, Users,
  MessageSquare, Radio
} from "lucide-react";
import { api } from "@/api/axios";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface Stream {
  id: string;
  title: string;
  description: string;
  status: 'scheduled' | 'live' | 'ended' | 'expired';
  type: 'auction' | 'open_show';
  category: string;
  seller: {
    id: string;
    name: string;
    email: string;
    storeName: string;
    storeAvatar?: string;
  };
  productsCount: number;
  viewersCount: number;
  scheduledStartTime: string;
  actualStartTime: string | null;
  endTime?: string | null;
  duration: number | null;
  createdAt: string;
  coverImageUrl: string | null;
  bidCount: number;
  cancelled: boolean;
}

interface StreamsAnalytics {
  totalStreams: number;
  activeStreams: number;
  totalViewers: number;
  totalInteractions: number;
}

function Streams() {
  // State for streams data
  const [streams, setStreams] = useState<Stream[]>([]);
  const [analytics, setAnalytics] = useState<StreamsAnalytics>({
    totalStreams: 0,
    activeStreams: 0,
    totalViewers: 0,
    totalInteractions: 0
  });
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0
  });

  // Filtering state
  const [statusFilter, setStatusFilter] = useState("all");
  const [sellerNameFilter, setSellerNameFilter] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  const { toast } = useToast();

  // Fetch streams analytics
  const fetchStreamAnalytics = async () => {
    try {
      const response = await api.get("/api/admin/streams/analytics");
      if (response.data && response.data.data) {
        setAnalytics({
          totalStreams: response.data.data.overview?.totalStreams || 0,
          activeStreams: response.data.data.overview?.liveStreams || 0,
          totalViewers: response.data.data.overview?.averageViewers || 0, // Using avg viewers as proxy if total not avail
          totalInteractions: response.data.data.overview?.averageBids || 0
        });
      }
    } catch (error) {
      console.error("Error fetching stream analytics:", error);
    }
  };

  // Fetch streams with filters
  const fetchStreams = async () => {
    setLoading(true);
    try {
      // Build query parameters based on filters
      let queryParams = `page=${pagination.page}&limit=${pagination.limit}`;

      if (statusFilter && statusFilter !== "all") {
        queryParams += `&status=${statusFilter}`;
      }

      if (sellerNameFilter) {
        queryParams += `&sellerName=${encodeURIComponent(sellerNameFilter)}`;
      }

      // Format date range for API
      if (dateRange && dateRange.from && dateRange.to) {
        const fromDate = format(dateRange.from, "yyyy-MM-dd");
        const toDate = format(dateRange.to, "yyyy-MM-dd");
        queryParams += `&dateRange=${fromDate},${toDate}`;
      }

      // Add sorting parameters
      if (sortBy) {
        queryParams += `&sortBy=${sortBy}`;
      }

      if (sortOrder) {
        queryParams += `&sortOrder=${sortOrder}`;
      }

      const response = await api.get(`/api/admin/streams?${queryParams}`);

      if (response.data && response.data.data && Array.isArray(response.data.data.streams)) {
        setStreams(response.data.data.streams);
        setPagination({
          ...pagination,
          total: response.data.data.pagination.total || 0,
        });
      } else {
        setStreams([]);
      }
    } catch (error) {
      console.error("Error fetching streams:", error);
      setStreams([]);
      toast({
        title: "Error",
        description: "Failed to fetch streams",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStreamDetails = async (streamId: string) => {
    try {
      await api.get(`/api/admin/streams/${streamId}`);
      toast({
        title: "Stream Details",
        description: "Stream details fetched successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch stream details",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchStreamAnalytics();
    fetchStreams();
  }, [pagination.page, pagination.limit, statusFilter, sortBy, sortOrder, dateRange]);

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range || { from: undefined, to: undefined });
    setPagination({ ...pagination, page: 1 });
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // Helper for status badges
  const getStatusBadge = (status: Stream['status']) => {
    switch (status) {
      case 'live':
        return <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20"><Radio className="w-3 h-3 mr-1 animate-pulse" /> Live</Badge>;
      case 'scheduled':
        return <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/20"><Calendar className="w-3 h-3 mr-1" /> Scheduled</Badge>;
      case 'ended':
        return <Badge variant="secondary" className="bg-gray-800 text-gray-400">Ended</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Live streams for the grid
  const liveStreams = streams.filter(s => s.status === 'live');

  return (
    <div className="space-y-8 pb-10">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <Video className="h-8 w-8 text-orange-500" />
            Streams Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Real-time monitoring and management of platform streams.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => {
            setStatusFilter("all");
            setSellerNameFilter("");
            setDateRange(undefined);
            setSortBy("createdAt");
            setPagination({ ...pagination, page: 1 });
          }}>
            <Filter className="w-4 h-4 mr-2" />
            Reset Filters
          </Button>
          <Button className="bg-orange-500 hover:bg-orange-600 text-white">
            Generate Report
          </Button>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-6 bg-[#0a0a0a] border-[#2a2a2a] relative overflow-hidden group hover:border-orange-500/50 transition-colors">
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Radio className="w-16 h-16 text-red-500" />
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground text-sm font-medium flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              Live Now
            </span>
            <span className="text-3xl font-bold mt-2 text-white">
              {analytics.activeStreams}
            </span>
          </div>
        </Card>

        <Card className="p-6 bg-[#0a0a0a] border-[#2a2a2a]">
          <div className="flex flex-col">
            <span className="text-muted-foreground text-sm font-medium flex items-center gap-2">
              <Video className="w-4 h-4 text-blue-500" />
              Total Streams
            </span>
            <span className="text-3xl font-bold mt-2 text-white">
              {analytics.totalStreams}
            </span>
          </div>
        </Card>

        <Card className="p-6 bg-[#0a0a0a] border-[#2a2a2a]">
          <div className="flex flex-col">
            <span className="text-muted-foreground text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4 text-green-500" />
              Avg. Viewers
            </span>
            <span className="text-3xl font-bold mt-2 text-white">
              {analytics.totalViewers}
            </span>
          </div>
        </Card>

        <Card className="p-6 bg-[#0a0a0a] border-[#2a2a2a]">
          <div className="flex flex-col">
            <span className="text-muted-foreground text-sm font-medium flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-purple-500" />
              Avg. Interactions
            </span>
            <span className="text-3xl font-bold mt-2 text-white">
              {analytics.totalInteractions}
            </span>
          </div>
        </Card>
      </div>

      {/* Live Now Grid (Only if there are live streams) */}
      {liveStreams.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Radio className="w-5 h-5 text-red-500 animate-pulse" />
            Live Now
          </h2>
          <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4">
            {liveStreams.map(stream => (
              <Card key={stream.id} className="overflow-hidden bg-[#0a0a0a] border-[#2a2a2a] group hover:border-orange-500/50 transition-all cursor-pointer">
                <div className="aspect-video relative bg-gray-900">
                  {stream.coverImageUrl ? (
                    <img src={stream.coverImageUrl} alt={stream.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-700">
                      <Video className="w-12 h-12" />
                    </div>
                  )}
                  <div className="absolute top-2 left-2">
                    <Badge className="bg-red-500 text-white border-none animate-pulse">LIVE</Badge>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/60 px-2 py-1 rounded text-xs text-white flex items-center gap-1">
                    <Eye className="w-3 h-3" /> {stream.viewersCount}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-white truncate">{stream.title}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <Avatar className="w-6 h-6 border border-gray-700">
                      <AvatarImage src={stream.seller.storeAvatar} />
                      <AvatarFallback>{stream.seller.storeName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-gray-400 truncate">{stream.seller.storeName}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                    <span>{stream.category}</span>
                    <span>{stream.productsCount} Products</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Filters & Table Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white">All Streams</h2>

        {/* Filter Bar */}
        <Card className="p-4 bg-[#0a0a0a] border-[#2a2a2a]">
          <div className="grid gap-4 md:grid-cols-6">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search seller..."
                  className="pl-9 bg-[#111] border-[#333]"
                  value={sellerNameFilter}
                  onChange={(e) => setSellerNameFilter(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-[#111] border-[#333]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="live">Live</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="ended">Ended</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <DateRangePicker value={dateRange} onChange={handleDateRangeChange} />
            </div>
            <div className="flex items-center justify-end">
              <span className="text-sm text-gray-500">
                {pagination.total} results
              </span>
            </div>
          </div>
        </Card>

        {/* Table */}
        <Card className="bg-[#0a0a0a] border-[#2a2a2a] overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-orange-500 mb-4" />
              <p className="text-muted-foreground">Loading streams...</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-[#111]">
                <TableRow className="border-b border-[#2a2a2a] hover:bg-[#111]">
                  <TableHead className="text-gray-400">Stream Info</TableHead>
                  <TableHead className="text-gray-400">Seller</TableHead>
                  <TableHead className="text-gray-400">Status</TableHead>
                  <TableHead className="text-gray-400">Stats</TableHead>
                  <TableHead className="text-gray-400">Time</TableHead>
                  <TableHead className="text-right text-gray-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {streams.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      No streams found.
                    </TableCell>
                  </TableRow>
                ) : (
                  streams.map((stream) => (
                    <TableRow key={stream.id} className="border-b border-[#2a2a2a] hover:bg-[#111]/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-10 bg-gray-800 rounded-md overflow-hidden relative shrink-0">
                            {stream.coverImageUrl ? (
                              <img src={stream.coverImageUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-600">
                                <Video className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-white line-clamp-1 max-w-[180px]" title={stream.title}>
                              {stream.title}
                            </p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {stream.type.replace('_', ' ')} • {stream.category}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-8 h-8 border border-gray-700">
                            <AvatarImage src={stream.seller.storeAvatar} />
                            <AvatarFallback>{stream.seller.storeName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-200">{stream.seller.storeName}</span>
                            <span className="text-xs text-gray-500">{stream.seller.email}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(stream.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 text-sm text-gray-300">
                          <span className="flex items-center gap-1.5"><Eye className="w-3 h-3 text-gray-500" /> {stream.viewersCount}</span>
                          <span className="flex items-center gap-1.5"><Users className="w-3 h-3 text-gray-500" /> {stream.bidCount} Bids</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-300">
                          {stream.status === 'scheduled' ? (
                            <span className="text-blue-400">{formatDate(stream.scheduledStartTime)}</span>
                          ) : (
                            <span>Started: {formatDate(stream.actualStartTime)}</span>
                          )}
                        </div>
                        {stream.duration && (
                          <span className="text-xs text-gray-500 block mt-0.5">Duration: {stream.duration}m</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-[#222]" onClick={() => fetchStreamDetails(stream.id)}>
                            <Eye className="w-4 h-4 text-gray-400" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-[#222]">
                                <ChevronDown className="w-4 h-4 text-gray-400" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-[#111] border-[#333]">
                              <DropdownMenuItem className="text-yellow-500 hover:text-yellow-400 hover:bg-[#222] cursor-pointer">
                                <AlertCircle className="w-4 h-4 mr-2" /> Issue Warning
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-500 hover:text-red-400 hover:bg-[#222] cursor-pointer">
                                <Ban className="w-4 h-4 mr-2" /> Suspend Stream
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          <div className="p-4 border-t border-[#2a2a2a] flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Page {pagination.page}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                disabled={pagination.page === 1}
                className="bg-transparent border-[#333] hover:bg-[#111]"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                disabled={streams.length < pagination.limit}
                className="bg-transparent border-[#333] hover:bg-[#111]"
              >
                Next
              </Button>
            </div>
          </div>
        </Card>
      </div>

    </div>
  );
}

export default Streams;
