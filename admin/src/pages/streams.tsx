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
import { Eye, Ban, Play, AlertCircle, Search, Filter, ChevronDown, Loader2 } from "lucide-react";
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
      console.log("Analytics Response:", response.data);
      
      // Check if data exists and has the expected structure
      if (response.data && response.data.data) {
        setAnalytics({
          totalStreams: response.data.data.totalStreams || 0,
          activeStreams: response.data.data.activeStreams || 0,
          totalViewers: response.data.data.totalViewers || 0,
          totalInteractions: response.data.data.totalInteractions || 0
        });
      } else {
        console.error("Unexpected analytics API response structure:", response.data);
      }
    } catch (error) {
      console.error("Error fetching stream analytics:", error);
      toast({
        title: "Error",
        description: "Failed to fetch stream analytics",
        variant: "destructive"
      });
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
      console.log("API Response:", response.data);
      
      // Check if data exists and has the expected structure
      if (response.data && response.data.data && Array.isArray(response.data.data.streams)) {
        setStreams(response.data.data.streams);
        setPagination({
          ...pagination,
          total: response.data.data.total || response.data.data.streams.length || 0
        });
      } else {
        console.error("Unexpected API response structure:", response.data);
        setStreams([]);
        toast({
          title: "Error",
          description: "Received unexpected data structure from API",
          variant: "destructive"
        });
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

  // Fetch stream details (would be used when viewing a specific stream)
  const fetchStreamDetails = async (streamId: string) => {
    try {
      const response = await api.get(`/api/admin/streams/${streamId}`);
      toast({
        title: "Stream Details",
        description: "Stream details fetched successfully",
      });
      // Here you could open a modal or navigate to a details page
      console.log(response.data);
    } catch (error) {
      console.error(`Error fetching stream details for ${streamId}:`, error);
      toast({
        title: "Error",
        description: "Failed to fetch stream details",
        variant: "destructive"
      });
    }
  };

  // Effect to fetch data when component mounts or filters change
  useEffect(() => {
    fetchStreamAnalytics();
    fetchStreams();
  }, [pagination.page, pagination.limit, statusFilter, sortBy, sortOrder, dateRange]);

  // Handle date range changes
  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range || { from: undefined, to: undefined });
    // Reset to first page when filters change
    setPagination({
      ...pagination,
      page: 1
    });
  };

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // Get status color class
  const getStatusColor = (status: Stream['status']) => {
    const colors = {
      live: 'bg-green-100 text-green-800',
      scheduled: 'bg-blue-100 text-blue-800',
      ended: 'bg-gray-100 text-gray-800',
      expired: 'bg-red-100 text-red-800'
    };
    return colors[status];
  };

  // Calculate total interactions for a stream
  const getTotalInteractions = (stream: Stream) => {
    return stream.bidCount;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">Live Streams</h2>
          <p className="text-muted-foreground">Monitor and manage platform streams</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => {
            // Reset all filters
            setStatusFilter("all");
            setSellerNameFilter("");
            setDateRange(undefined);
            setSortBy("createdAt");
            setSortOrder("desc");
            setPagination({ ...pagination, page: 1 });
          }}>
            <Filter className="h-4 w-4 mr-2" />
            Reset Filters
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="p-6">
          <div className="flex flex-col">
            <span className="text-muted-foreground text-sm">Active Streams</span>
            <span className="text-2xl font-bold mt-2">
              {analytics.activeStreams}
            </span>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex flex-col">
            <span className="text-muted-foreground text-sm">Total Viewers</span>
            <span className="text-2xl font-bold mt-2">
              {analytics.totalViewers}
            </span>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex flex-col">
            <span className="text-muted-foreground text-sm">Total Interactions</span>
            <span className="text-2xl font-bold mt-2">
              {analytics.totalInteractions}
            </span>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex flex-col">
            <span className="text-muted-foreground text-sm">Total Streams</span>
            <span className="text-2xl font-bold mt-2">{analytics.totalStreams}</span>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid gap-4 md:grid-cols-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Stream Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="live">Live</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="ended">Ended</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">Date Range</label>
            <DateRangePicker
              value={dateRange}
              onChange={handleDateRangeChange}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Sort By</label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Created Date</SelectItem>
                <SelectItem value="scheduledStartTime">Scheduled Time</SelectItem>
                <SelectItem value="viewersCount">Viewers Count</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Sort Order</label>
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger>
                <SelectValue placeholder="Sort order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Ascending</SelectItem>
                <SelectItem value="desc">Descending</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2 md:col-span-6">
            <label className="text-sm font-medium">Seller Search</label>
            <div className="flex gap-2">
              <Input
                placeholder="Search by seller name..."
                value={sellerNameFilter}
                onChange={(e) => setSellerNameFilter(e.target.value)}
              />
              <Button 
                variant="secondary"
                onClick={() => {
                  setPagination({ ...pagination, page: 1 });
                  fetchStreams();
                }}
              >
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : streams && streams.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Seller</TableHead>
                  <TableHead>Stream Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Viewers</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Started/Scheduled</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {streams.map((stream) => (
                  <TableRow key={stream.id}>
                    <TableCell className="font-medium">{stream.seller.storeName}</TableCell>
                    <TableCell>{stream.title}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        stream.type === 'auction' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {stream.type === 'auction' ? 'Auction' : 'Open Show'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(stream.status)}`}>
                        {stream.status.charAt(0).toUpperCase() + stream.status.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell>{stream.category || "Uncategorized"}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {stream.status === 'live' && <Play className="h-3 w-3 text-green-500 mr-2" />}
                        {stream.viewersCount}
                      </div>
                    </TableCell>
                    <TableCell>{stream.productsCount}</TableCell>
                    <TableCell>{formatDate(stream.actualStartTime || stream.scheduledStartTime)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => fetchStreamDetails(stream.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => {
                                toast({
                                  title: "Warning Issued",
                                  description: `Warning issued to ${stream.seller.storeName}`,
                                })
                              }}
                              className="text-yellow-500"
                            >
                              <AlertCircle className="h-4 w-4 mr-2" />
                              Issue Warning
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => {
                                toast({
                                  title: "Stream Suspended",
                                  description: `${stream.seller.storeName}'s stream has been suspended`,
                                })
                              }}
                              className="text-red-500"
                            >
                              <Ban className="h-4 w-4 mr-2" />
                              Suspend Stream
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                Showing {((pagination.page - 1) * pagination.limit) + 1}-
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} streams
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={pagination.page * pagination.limit >= pagination.total}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="py-10 text-center">
            <p className="text-muted-foreground">No streams found matching your filters.</p>
          </div>
        )}
      </Card>
    </div>
  );
}

export default Streams;
