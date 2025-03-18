import { useEffect, useState } from "react";
import { useAuthContext } from "../../Hooks/useAuthContext";
import { Icon } from "@iconify/react";
import { orderTempData, toDoCardTempData, suggestVideosData } from "../../Utilities/data";
import { useNavigate, useNavigation } from "react-router-dom";
import { useSidebar } from '../../Hooks/useSideBar';
import SideBarNav from "../../Components/ui/DashboardHomepageUi/SideBarNav";
import { BASE_URL } from "../../Constants/Server";
import { getTotalSellerUCustomers, getPlatformAnnouncement, getPublicResources } from "../../Utilities/apiRestaurant";
import SearchBar from "../../Components/ui/DashboardHomepageUi/SearchBar";
import { Link } from "react-router-dom";
import AlertNotification from "../../Components/ui/AlertNotification";
import HomeAnalyticsCard from "../../Components/ui/DashboardHomepageUi/HomeAnalyticsCard";
import QuickOrderCard from "../../Components/QuickOrderCard";
import OrdersTable from "../../Components/OrdersTable";
import SuggestedVideoCard from "../../Components/SuggestedVideoCard";
import AnnouncementCard from "../../Components/AnnouncementCard";
import DashboardSkeleton from "../../Components/ui/DashboardSkeleton";
import axios from "axios";
import LinearProgress from '@mui/material/LinearProgress';
import ObjectID from 'bson-objectid';
import CircularProgress from '@mui/material/CircularProgress';
import { FiShoppingBag, FiBarChart2, FiUserPlus } from 'react-icons/fi';
import { FaStoreAlt } from "react-icons/fa";
import { BiWallet } from 'react-icons/bi';
import { Dialog, DialogTrigger } from "@/Components/ui/dialog";
import NotificationsDialog from "../../Components/NotificationsDialog";
import { useOutletContext } from "react-router-dom";
import NoOrderFound from "../../assets/no-order-found.png";
import { useIntercomChat } from "../../Hooks/useIntercom";
import Skeleton from 'react-loading-skeleton';


// Helper function: Formats numbers with K/M suffix and handles pluralization
// Example: formatNumber(1500, "view") returns "1.5K views"
const formatNumber = (number, label) => {
  if (number > 1000000) return `${number}M ${label}s`;
  if (number > 1000) return `${number}K ${label}s`;
  return `${number} ${number === 1 ? label : label + 's'}`;
};

// Add this helper function for number formatting
const formatMetricValue = (value) => {
  if (!value) return '0';
  if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}B`;
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toString();
};

// Update the getSellerAnalytics function
const getSellerAnalytics = async () => {
  try {
    const token = localStorage.getItem('sellerToken');
    const { data: authToken } = JSON.parse(token);

    const response = await axios.get(
      `${BASE_URL}/seller/statistics`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return null;
  }
};

const HomePage = () => {
  // Core hooks initialization
  const navigate = useNavigate();
  const { initUser } = useIntercomChat();
  const { setHeaderName, setNavName, setShowBackButton } = useOutletContext()
  const { seller, fetchSellerDetails, getTop3SellingProducts, top3SellingProducts, isLoading, stuffToDo, getSellerNotifications } = useAuthContext();
  const { isSidebarOpen, setIsSidebarOpen } = useSidebar();

  // State management for dashboard data and UI
  const [notification, setNotification] = useState(false);
  const [orders, setOrders] = useState([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isDataReady, setIsDataReady] = useState(false);
  const [error, setError] = useState(null);
  const [homeAnalyticsCardData, setHomeAnalyticsCardData] = useState([]);
  const [platformAnnouncement, setPlatformAnnouncement] = useState([]);
  const [publicResources, setPublicResources] = useState([]);

  useEffect(() => {
    setHeaderName("Home")
    setNavName("")
    setShowBackButton(false)

    return () => {
      setShowBackButton(true)
    }
    
  }, [])

  useEffect(() => {
    const storedSeller = JSON.parse(localStorage.getItem('seller'))
    if (storedSeller) {
      initUser(storedSeller)
    }
  }, [])

  // Fetch seller details and wallet balance
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        await fetchSellerDetails();
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };

    fetchInitialData();
  }, []);

  // Main data fetching effect with loading optimization
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchDashboardData = async () => {
      try {
        setIsDataLoading(true);

        // Authentication setup
        const token = localStorage.getItem('sellerToken');
        const { data: authToken } = JSON.parse(token);
        const seller = JSON.parse(localStorage.getItem('seller'));

        // Split API calls into critical and non-critical data
        const [analyticsResponse, ordersResponse] = await Promise.all([
          getSellerAnalytics(),
          axios.get(
            `${BASE_URL}/order/seller/${seller._id}`,
            {
              headers: { Authorization: `Bearer ${authToken}` },
              signal
            }
          ),
        ]);
        console.log('analyticsResponse', analyticsResponse);

        const newOrders = ordersResponse.status === 200 ? ordersResponse.data : [];


        // Update critical data immediately
        const initialAnalyticsData = prepareAnalyticsData(
          newOrders,
          analyticsResponse,
          seller // Pass the entire seller object
        );

        setOrders(newOrders);
        setHomeAnalyticsCardData(initialAnalyticsData);
        setIsDataReady(true);
        setIsDataLoading(false);

        // Non-critical data (load after)
        const [customersResponse, platformAnnouncementResponse, publicResourcesResponse] = await Promise.all([
          getTotalSellerUCustomers(),
          getPlatformAnnouncement(),
          getPublicResources(),
        ]);

        // Update analytics with complete data
        const finalAnalyticsData = prepareAnalyticsData(
          newOrders,
          analyticsResponse,
          seller
        );

        setHomeAnalyticsCardData(finalAnalyticsData);
        setPlatformAnnouncement(platformAnnouncementResponse);
        setPublicResources(publicResourcesResponse);

      } catch (error) {
        if (error.name === 'AbortError') {
          console.log('Fetch aborted');
          return;
        }
        setError(error.message);
        console.error('Dashboard loading error:', error);
      }
    };

    fetchDashboardData();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    getTop3SellingProducts();
    getSellerNotifications();
  }, []);

  console.log('platformAnnouncement', platformAnnouncement);
  console.log('publicResources', publicResources);
  console.log('stuffToDo', stuffToDo);
  console.log('top3SellingProducts', top3SellingProducts);

  // Returns appropriate greeting based on Nigerian time
  const getGreeting = () => {
    const nigerianTime = new Date().toLocaleString('en-US', {
      timeZone: 'Africa/Lagos',
      hour: 'numeric',
      hour12: false
    });

    const hour = parseInt(nigerianTime);
    if (hour >= 5 && hour < 12) return "Good Morning";
    if (hour >= 12 && hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  console.log(orders);

  // Formats store visits for display with appropriate suffix (K/M)
  const calculateStoreVisitsDisplay = (storeVisits) => {
    if (storeVisits < 100000) {
      return `${storeVisits} visits`
    } else if (storeVisits >= 100000) {
      return `${storeVisits}K visits`
    } else if (storeVisits >= 1000000) {
      return `${storeVisits}M visits`
    }
  }

  // Calculates total sales from all orders
  // Sums up (price * quantity) for each item in each order
  const calculateTotalSales = (orders) => {
    const totalSales = orders.reduce((total, order) => {
      const orderTotal = order.items.reduce((itemTotal, item) => {
        return itemTotal + (item.price * item.quantity);
      }, 0);
      return total + orderTotal;
    }, 0);

    console.log("totalSales", totalSales);
    if (totalSales >= 1000000000) {
      return `${totalSales}B`
    } else {
      return totalSales.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' });
    };

  };

  // Helper function to calculate proper conversion rate (0-100%)
  const calculateConversionRate = (analytics) => {
    if (!analytics?.storeMetrics?.visits || !analytics?.orders?.total) return 0;

    const rate = (analytics.orders.total / analytics.storeMetrics.visits) * 100;
    // Ensure rate is between 0-100%
    return Math.min(Math.max(rate, 0), 100).toFixed(1);
  };

  // Prepares data for analytics dashboard cards
  // Includes: Store Visits, Total Sales, Orders, Conversions, Customers
  const prepareAnalyticsData = (orders, analytics, seller) => {
    if (!analytics) return [];

    return [
      {
        id: ObjectID().toHexString(),
        title: 'Payable Balance',
        icon: BiWallet,
        current: `₦${formatMetricValue(analytics.walletBalance.amount)}`,
        percentage: `${analytics.walletBalance.changePercentage}%`,
        trend: analytics.walletBalance.changePercentage >= 0 ? 'up' : 'down',
        iconColor: 'text-green-600',
        iconBackground: 'bg-green-50',
        link: '/dashboard/earnings-payouts'
      },
      {
        id: ObjectID().toHexString(),
        title: 'Store Visits',
        icon: FaStoreAlt,
        current: formatMetricValue(analytics.storeVisits.count),
        percentage: `${analytics.storeVisits.changePercentage}%`,
        trend: analytics.storeVisits.changePercentage >= 0 ? 'up' : 'down',
        iconColor: 'text-blue-600',
        iconBackground: 'bg-blue-50',
        link: '/dashboard/analytics-insights'
      },
      {
        id: ObjectID().toHexString(),
        title: 'Total Orders',
        icon: FiShoppingBag,
        current: formatMetricValue(analytics.totalOrders.count),
        percentage: `${analytics.totalOrders.changePercentage}%`,
        trend: analytics.totalOrders.changePercentage >= 0 ? 'up' : 'down',
        iconColor: 'text-purple-600',
        iconBackground: 'bg-purple-50',
        link: '/dashboard/orders'
      },
      {
        id: ObjectID().toHexString(),
        title: 'Conversion Rate',
        icon: FiBarChart2,
        current: `${analytics.conversionRate.percentage}%`,
        percentage: `${analytics.conversionRate.changePercentage}%`,
        trend: analytics.conversionRate.changePercentage >= 0 ? 'up' : 'down',
        iconColor: 'text-green-600',
        iconBackground: 'bg-green-50',
        link: '/dashboard/analytics-insights'
      },
      {
        id: ObjectID().toHexString(),
        title: 'New Customers',
        icon: FiUserPlus,
        current: formatMetricValue(analytics.newCustomers.count),
        percentage: `${analytics.newCustomers.changePercentage}%`,
        trend: analytics.newCustomers.changePercentage >= 0 ? 'up' : 'down',
        iconColor: 'text-orange-600',
        iconBackground: 'bg-orange-50',
        link: '/dashboard/customers'
      }
    ];
  };

  return (
    <>
      {/* Notification */}
      {
        notification && (
          <AlertNotification />
        )
      }

      {isDataLoading || !isDataReady ? (
        <DashboardSkeleton />
      ) : (
        <div>
          {/* Greeting */}

          {/* Analytics Cards */}
          <div className="flex justify-center items-center">
            {
              homeAnalyticsCardData.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-x-4 xl:gap-x-8 gap-y-2 md:gap-y-4 xl:gap-y-8 mt-6 xl:mt-9 w-full">
                  {
                    homeAnalyticsCardData.map((card) => (
                      <HomeAnalyticsCard key={card.id} card={card} />
                    ))
                  }
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mt-9 w-full">
                  {[...Array(5)].map((_, index) => (
                    <Skeleton key={index} height={150} />
                  ))}
                </div>
              )
            }
          </div>
          {/* Stuff to do 1 */}
          <div className="mt-10 flex flex-col lg:flex-row lg:align-center lg:justify-between gap-14 lg:gap-4">
            {/* Notifications Section */}
            <div className="w-full bg-[#FFFFFF] rounded-xl border border-gray-200 p-6 flex flex-col">
              <div className="mb-6">
                <div className="flex flex-col xl:flex-row justify-between items-start gap-y-4 xl:gap-y-0 xl:items-center">
                  <div>
                    <h3 className="text-xl font-semibold text-[#27272E] font-inter ">Notifications</h3>
                    <p className="text-sm text-[#425466] font-inter mt-1">Your recent updates and alerts</p>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <button className="text-sm whitespace-nowrap text-[#0BB248] font-inter font-semibold hover:text-green-700">
                        View all
                      </button>
                    </DialogTrigger>
                    <NotificationsDialog notifications={stuffToDo?.notifications.filter(notification => notification.type !== 'buyer_message')} />
                  </Dialog>
                </div>
              </div>

              <div className="overflow-hidden flex-1">
                {isLoading ? (
                  <div className="flex justify-center items-center h-full min-h-[364px]">
                    <CircularProgress size={24} className="text-green-600" />
                  </div>
                ) : stuffToDo?.notifications?.length > 0 ? (
                  <div className="space-y-3 h-full">
                    {stuffToDo.notifications
                      .filter(notification => notification.type !== 'buyer_message')
                      .slice(0, 3)
                      .map((notification) => (
                      <div key={notification._id} className="p-4 border gap-2 flex-wrap flex items-center justify-between rounded-lg cursor-pointer border-gray-200 hover:bg-gray-50 hover:shadow-md transition-colors">
                        <div>
                          <h4 className="text-sm xl:text-base font-inter font-semibold text-[#27272E]">{notification.title}</h4>
                          <p className="text-sm text-[#425466] max-w-[420px] font-inter mt-1">{notification.message.slice(0, 70)}...</p>
                        </div>
                        <Dialog>
                          <DialogTrigger asChild>
                            <button className="border border-[#0BB248] text-sm text-[#0BB248] font-cabin whitespace-nowrap hover:bg-[#DEFFEE] px-3 py-1 rounded-lg transition-all duration-300 ease-in-out " >
                              Check It
                            </button>
                          </DialogTrigger>
                          <NotificationsDialog notifications={stuffToDo?.notifications.filter(notification => notification.type !== 'buyer_message')} />
                        </Dialog>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full min-h-[364px] text-gray-500">
                    <Icon icon="line-md:bell-loop" className="text-gray-400 w-20 h-20  " />
                    <p className="text-base font-medium text-[#425466] font-inter">No notifications</p>

                    <p className="text-sm text-[#425466] font-inter">You're all caught up!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Top Selling Products Section */}
            <div className="w-full bg-white border border-gray-200 rounded-lg shadow-sm p-6 flex flex-col">
              <div className="flex flex-col xl:flex-row xl:justify-between space-y-3 xl:space-y-0 xl:items-center mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-[#27272E] font-inter ">Your top 3 selling products</h3>
                  <p className="text-sm text-[#425466] font-inter mt-0.5">Best performing items this month</p>
                </div>
                <Link
                  to="/dashboard/products"
                  className="flex items-center w-fit px-3 py-2.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md transition-colors duration-200 shadow-sm hover:shadow"
                >
                  View all
                  <svg className="ml-1.5 w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
              <div className="overflow-hidden flex-1">
                {isLoading ? (
                  <div className="flex justify-center items-center h-full min-h-[364px]">
                    <CircularProgress size={20} className="text-green-600" />
                  </div>
                ) : (
                  <div className=" space-y-3 mt-3 h-full">
                    {
                      top3SellingProducts.length > 0 ? (
                        top3SellingProducts?.map((product) => (
                          <QuickOrderCard
                            key={product._id}
                            product={product}
                            className="hover:bg-gray-50 transition-colors duration-200 p-3"
                          />
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full min-h-[364px] text-gray-500">
                          <img src={NoOrderFound} alt="No Products Sold Yet" className="h-48 " />
                          <p className="text-base font-medium text-[#425466] font-inter">No Products Sold Yet</p>
                        </div>

                      )
                    }
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className=" bg-white mt-5">
            {isLoading ? (
              <Skeleton height={400} />
            ) : (
              <OrdersTable orders={orders} />
            )}
          </div>
          <div className="mt-10 border border-gray-200 rounded-[10px] px-4 py-3 lg:px-8 lg:py-7">
            <h1 className="text-lg font-lexend font-bold text-[#05031F] mb-2">Auqli Seller University</h1>
            <p className="text-sm lg:text-base font-cabin font-normal text-[#05031F]">Get tips and best practices to grow your business on Auqli using Auqli marketing tools</p>
            <div className="relative">
              <div className="flex gap-4 lg:gap-8 overflow-x-scroll pb-4 mt-5 scroll-smooth
              [&::-webkit-scrollbar]:h-2
              [&::-webkit-scrollbar-track]:rounded-full
              [&::-webkit-scrollbar-track]:bg-gray-100
              [&::-webkit-scrollbar-thumb]:rounded-full
              [&::-webkit-scrollbar-thumb]:bg-gray-300
              hover:[&::-webkit-scrollbar-thumb]:bg-gray-400">
                {
                  suggestVideosData?.map((video) => (
                    <div key={video.id} className="flex-none">
                      <SuggestedVideoCard video={video} />
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
          <div className="mt-5">
            <h1 className="text-lg font-lexend font-bold text-[#05031F] mb-2">Platform Announcements</h1>
            <div className="flex flex-col bg-white mt-4 rounded-md border border-gray-200 " >
              {
                platformAnnouncement.length > 0 ? (
                  platformAnnouncement.map((announcement) => (
                    <AnnouncementCard key={announcement._id} announcement={announcement} />
                  ))
                ) : (
                  <Skeleton count={3} height={100} className="mb-4" />
                )
              }
            </div>
          </div>
        </div>
      )}
    </>
  )
};

export default HomePage;
