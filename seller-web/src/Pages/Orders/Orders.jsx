import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import { toast } from 'sonner'
import Loader from '@/Components/Loader'
import { BASE_URL, BASE_URL_V2 } from '@/Constants/Server'
import { Button } from "@/Components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/select";
import { Filter } from "lucide-react";
import { fetchOrders as fetchOrdersThunk, fetchSellerProfile as fetchSellerProfileThunk } from "@/Redux/Slices/OrdersSlice";
import OrderListSkeleton from "@/Components/orders/OrderListSkeleton";
import OrdersMobileTabs from "@/Components/orders/OrdersMobileTabs";
import OrdersDesktopTabs from "@/Components/orders/OrdersDesktopTabs";
import OrdersFilterBar from "@/Components/orders/OrdersFilterBar";
import OrdersMobileFilters from "@/Components/orders/OrdersMobileFilters";
import OrdersTable from "@/Components/orders/OrdersTable";
import OrdersMobileCardList from "@/Components/orders/OrdersMobileCardList";
import OrderEmptyState from "@/Components/orders/OrderEmptyState";

export default function OrdersDashboard() {
  const { setHeaderName, setNavName } = useOutletContext();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { list: displayedOrders, listLoading: loading, sellerId, pagination, sellerProfile } = useSelector((state) => state.orders);
  const [activeTab, setActiveTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage, setOrdersPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [date, setDate] = useState();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState("-createdAt");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    setHeaderName("Orders");
    setNavName("");
  }, []);

  const fetchOrders = (id) => {
    const params = {
      page: currentPage.toString(),
      limit: ordersPerPage.toString(),
      ...(date?.from && date?.to && {
        startDate: date.from.toISOString(),
        endDate: date.to.toISOString(),
      }),
      ...(searchTerm && { search: searchTerm }),
      ...(paymentFilter !== "all" && { paymentStatus: paymentFilter }),
      ...(channelFilter !== "all" && { channel: channelFilter }),
      ...(activeTab && { tab: activeTab }),
      sort: sortConfig,
    };
    dispatch(fetchOrdersThunk({ sellerId: id, params }));
  };

  useEffect(() => {
    dispatch(fetchSellerProfileThunk());
  }, [dispatch]);

  // Reset page when non-pagination filters change
  useEffect(() => {
    setCurrentPage(1);

  }, [activeTab, date, searchTerm, paymentFilter, channelFilter]);

  // Refetch orders when filters, pagination, or sorting changes
  useEffect(() => {
    const effectiveSellerId = sellerId || sellerProfile?.data?._id || sellerProfile?._id;
    if (effectiveSellerId) fetchOrders(effectiveSellerId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sellerId, currentPage, ordersPerPage, activeTab, date, searchTerm, paymentFilter, channelFilter, sortConfig]);

  const handleOrdersPerPageChange = (e) => {
    setOrdersPerPage(Number.parseInt(e, 10));
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const handlePrevPage = () => {
    setCurrentPage((prevPage) => Math.max(1, prevPage - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prevPage) => Math.min(totalPages, prevPage + 1));
  };

  const handleSearch = () => {
    setCurrentPage(1);
    setSearchTerm(searchInput.trim());
  };

  const handleResetFilters = () => {
    setDate(null);
    setSearchTerm("");
    setSearchInput("");
    setPaymentFilter("all");
    setChannelFilter("all");
    setActiveTab("all");
    setSortConfig("-createdAt");
    setCurrentPage(1);
  };

  if (loading) return <OrderListSkeleton />;

  return (
    <>
      <div className="relative">
        <div className="sm:hidden flex justify-between items-center sm:px-4 py-3">
          <h2 className="text-lg font-semibold font-inter">Orders</h2>
          {/*<Link to="/dashboard/returns">
            <Button
              variant="outline"
              className="border-green-600 text-green-600 font-inter px-2 text-xs hover:bg-green-600 hover:text-white"
            >
              Returns Center
            </Button>
          </Link>*/}
        </div>



        <div className="py-3 sm:py-6">
          {/* Mobile Tabs */}
          <OrdersMobileTabs value={activeTab} onChange={setActiveTab} />
          <div className="hidden sm:flex gap-4 justify-between">

            {/* Desktop Tabs */}
            <OrdersDesktopTabs value={activeTab} onChange={setActiveTab} />
            {/*<Link to="/dashboard/returns" className="hidden sm:block">
              <Button
                variant="outline"
                className="border-green-600 text-green-600 font-inter px-2 lg:px-3 hover:bg-green-600 hover:text-white"
              >
                Returns Center
              </Button>
            </Link>*/}
          </div>

          <div className="bg-[#F8FAF9] rounded-lg sm:p-6 shadow-sm">
            <div className="flex flex-col xl:flex-row justify-between gap-4 xl:items-center mb-6">
              <div className="flex justify-between items-center w-full xl:w-auto">
                <h2 className="text-xl lg:text-2xl font-semibold font-inter">Latest Orders</h2>

                {/* Mobile Filter Button */}
                <Button
                  variant="outline"
                  className="sm:hidden border-green-600 text-green-600"
                  onClick={() => setIsFilterOpen(true)}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </div>

              {/* Mobile Filters Drawer */}
              <OrdersMobileFilters
                open={isFilterOpen}
                onOpenChange={setIsFilterOpen}
                searchInput={searchInput}
                setSearchInput={setSearchInput}
                onSearch={handleSearch}
                paymentFilter={paymentFilter}
                setPaymentFilter={setPaymentFilter}
                channelFilter={channelFilter}
                setChannelFilter={setChannelFilter}
                onClear={() => {
                  setDate(null);
                  setSearchTerm("");
                  setSearchInput("");
                  setPaymentFilter("all");
                  setChannelFilter("all");
                }}
              />

              {/* Desktop Filters */}
              <OrdersFilterBar
                searchInput={searchInput}
                setSearchInput={setSearchInput}
                onSearch={handleSearch}
                paymentFilter={paymentFilter}
                setPaymentFilter={setPaymentFilter}
                channelFilter={channelFilter}
                setChannelFilter={setChannelFilter}
                onReset={handleResetFilters}
              />
            </div>

            {/* Desktop Table */}
            <OrdersTable orders={displayedOrders} />

            {/* Mobile Card View */}
            {displayedOrders.length > 0 ? (
              <OrdersMobileCardList orders={displayedOrders} />
            ) : (
              <OrderEmptyState
                onClear={() => {
                  setDate(null);
                  setSearchTerm("");
                  setPaymentFilter("all");
                  setChannelFilter("all");
                  setActiveTab("all");
                }}
                onViewProducts={() => navigate("/dashboard/products")}
              />
            )}

            <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-3 sm:gap-0">
              <Select value={ordersPerPage.toString()} onValueChange={handleOrdersPerPageChange}>
                <SelectTrigger className="bg-white w-full sm:w-[140px] text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="20">20 PER PAGE</SelectItem>
                  <SelectItem value="30">30 PER PAGE</SelectItem>
                  <SelectItem value="40">40 PER PAGE</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2 sm:gap-4">
                <span className="text-xs sm:text-sm font-inter text-gray-500">
                  Page {currentPage} of {totalPages}
                </span>
                <div className="flex gap-2 sm:gap-4">
                  <Button
                    variant="outline"
                    className="bg-white text-xs sm:text-sm px-2 sm:px-3 py-1 h-8 sm:h-10"
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                  >
                    ← Back
                  </Button>
                  <Button
                    variant="outline"
                    className="bg-white text-xs sm:text-sm px-2 sm:px-3 py-1 h-8 sm:h-10"
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                  >
                    Next →
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}