import { useEffect, useState } from "react";
import { useAuthContext } from "../../Hooks/useAuthContext";
import { Icon } from "@iconify/react";
import { orderTempData, toDoCardTempData, suggestVideosData } from "../../Utilities/data";
import { Crisp } from "crisp-sdk-web";
import { useNavigate, useNavigation } from "react-router-dom";
import { useSidebar } from '../../Hooks/useSideBar';
import SideBarNav from "../../Components/ui/DashboardHomepageUi/SideBarNav";
import { BASE_URL } from "../../Constants/Server";
import { getTotalSellerUCustomers, getPlatformAnnouncement, getPublicResources } from "../../Utilities/apiRestaurant";
import SearchBar from "../../Components/ui/DashboardHomepageUi/SearchBar";
import { Link } from "react-router-dom";
import AlertNotification from "../../Components/ui/AlertNotification";
import HomeAnalyticsCard from "../../Components/ui/DashboardHomepageUi/HomeAnalyticsCard";
import ToDoCard from "../../Components/ToDoCard";
import QuickOrderCard from "../../Components/QuickOrderCard";
import OrdersTable from "../../Components/OrdersTable";
import SuggestedVideoCard from "../../Components/SuggestedVideoCard";
import AnnouncementCard from "../../Components/AnnouncementCard";
import axios from "axios";
import LinearProgress from '@mui/material/LinearProgress';
import ObjectID from 'bson-objectid';
import CircularProgress from '@mui/material/CircularProgress';
import { FiUsers, FiShoppingBag, FiBarChart2, FiUserPlus } from 'react-icons/fi';
import { BiWallet } from 'react-icons/bi';
import Header from "@/Components/ui/Header/Header";
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

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

const HomePage = () => {
  // Core hooks initialization
  const navigate = useNavigate();
  const { seller, fetchSellerDetails, getTop3SellingProducts, top3SellingProducts, isLoading, stuffToDo, getSellerNotifications } = useAuthContext();
  const { isSidebarOpen, setIsSidebarOpen } = useSidebar();

  // State management for dashboard data and UI
  const [notification, setNotification] = useState(false);  // Controls notification visibility
  const [orders, setOrders] = useState([]);               // Stores all seller orders
  const [isDataLoading, setIsDataLoading] = useState(true);       // Controls loading state
  const [isDataReady, setIsDataReady] = useState(false);  // Indicates when data is ready to display
  const [error, setError] = useState(null);               // Stores error state
  const [homeAnalyticsCardData, setHomeAnalyticsCardData] = useState([]); // Analytics cards data
  const [platformAnnouncement, setPlatformAnnouncement] = useState([]);
  const [publicResources, setPublicResources] = useState([]);

  // Fetch seller details on component mount
  useEffect(() => {
    fetchSellerDetails();
  }, []);

  // Main data fetching effect
  // Retrieves orders and customer data on component mount
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchDashboardData = async () => {
      try {
        setIsDataLoading(true);
        setIsDataReady(false);

        // Authentication setup
        const token = localStorage.getItem('sellerToken');
        const { data: authToken } = JSON.parse(token);
        const seller = JSON.parse(localStorage.getItem('seller'));

        // Parallel API calls for better performance
        const [ordersResponse, customersResponse, platformAnnouncementResponse, publicResourcesResponse ] = await Promise.all([
          axios.get(
            `${BASE_URL}/order/seller/${seller._id}`,
            {
              headers: { Authorization: `Bearer ${authToken}` },
              signal
            }
          ),
          getTotalSellerUCustomers(),
          getPlatformAnnouncement(),
          getPublicResources(),
        ]);

        // Process and update state with fetched data
        const newOrders = ordersResponse.status === 200 ? ordersResponse.data : [];
        const analyticsData = prepareAnalyticsData(
          newOrders,
          seller?.storeVisits,
          customersResponse
        );

        setOrders(newOrders);
        setHomeAnalyticsCardData(analyticsData);
        setPlatformAnnouncement(platformAnnouncementResponse);
        setPublicResources(publicResourcesResponse);
        setIsDataReady(true);

      } catch (error) {
        // Handle fetch abortion and errors
        if (error.name === 'AbortError') {
          console.log('Fetch aborted');
          return;
        }
        setIsDataReady(true)
        setError(error.message);
        console.error('Dashboard loading error:', error);
      } finally {
        setIsDataLoading(false);
      }
    };

    fetchDashboardData();

    // Cleanup: abort any pending requests when component unmounts
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

  // Prepares data for analytics dashboard cards
  // Includes: Store Visits, Total Sales, Orders, Conversions, Customers
  const prepareAnalyticsData = (orders, storeVisits, totalCustomers) => {
    return [
        {
            id: ObjectID().toHexString(),
            title: 'Store Visits',
            icon: FiUsers,
            current: formatMetricValue(storeVisits),
            percentage: '+13%',
            trend: 'up',
            iconColor: 'text-blue-600',
            iconBackground: 'bg-blue-50'
        },
        {
            id: ObjectID().toHexString(),
            title: 'Wallet Balance',
            icon: BiWallet,
            current: `₦${formatMetricValue(seller?.walletBalance || 0)}`,
            percentage: '+8%',
            trend: 'up',
            iconColor: 'text-green-600',
            iconBackground: 'bg-green-50'
        },
        {
            id: ObjectID().toHexString(),
            title: 'Total Orders',
            icon: FiShoppingBag,
            current: formatMetricValue(orders.length),
            percentage: '+2%',
            trend: 'up',
            iconColor: 'text-purple-600',
            iconBackground: 'bg-purple-50'
        },
        {
            id: ObjectID().toHexString(),
            title: 'Conversion Rate',
            icon: FiBarChart2,
            current: '15%',
            percentage: '+23%',
            trend: 'up',
            iconColor: 'text-green-600',
            iconBackground: 'bg-green-50'
        },
        {
            id: ObjectID().toHexString(),
            title: 'New Customers',
            icon: FiUserPlus,
            current: formatMetricValue(totalCustomers?.followers?.length || 0),
            percentage: '-4%',
            trend: 'down',
            iconColor: 'text-orange-600',
            iconBackground: 'bg-orange-50'
        }
    ];
  };

  return (
    <>
      {/* Search Bar */}
      <Header
  isSidebarOpen={isSidebarOpen}
  setIsSidebarOpen={setIsSidebarOpen}
/>
      {/* Notification */}
      {
        notification && (
          <AlertNotification />
        )
      }

      {isDataLoading || !isDataReady ? (
        <div className="flex flex-col justify-center items-center h-[80dvh]">
          <div className="w-1/4">
            <LinearProgress color="success" />
          </div>
        </div>
      ) : (
        <div>
          {/* Greeting */}

          {/* Analytics Cards */}
          <div className="flex justify-center items-center">
            {
              homeAnalyticsCardData.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mt-9 w-full">
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
          <div className="w-full">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Stuff to do</h3>
        <p className="text-sm text-gray-500 mt-1">Your pending tasks and notifications</p>
      </div>

      <div className="bg-gray-50 rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center h-[364px]">
            <CircularProgress
              size={24}
              className="text-green-600"
            />
          </div>
        ) : stuffToDo?.notifications?.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {stuffToDo.notifications.map((card) => (
              <ToDoCard key={card.id} card={card} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[364px] text-gray-500">
            <svg
              className="w-12 h-12 mb-3 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <p className="text-base font-medium">No tasks pending</p>
            <p className="text-sm">You're all caught up!</p>
          </div>
        )}
      </div>
    </div>
            {/* Stuff to do 2 */}
            <div className="w-full">
  {/* Top 3 selling products */}
  <div className="flex justify-between items-center mb-4">
    <div>
      <h3 className="text-lg font-bold text-gray-900">Your top 3 selling products</h3>
      <p className="text-xs text-gray-500 mt-0.5">Best performing items this month</p>
    </div>
    <Link
      to="/dashboard/products"
      className="inline-flex items-center px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md transition-colors duration-200 shadow-sm hover:shadow"
    >
      View all
      <svg className="ml-1.5 w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  </div>
  <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
    {isLoading ? (
      <div className="flex justify-center items-center h-48">
        <CircularProgress size={20} className="text-green-600" />
      </div>
    ) : (
      <div className="divide-y divide-gray-100">
        {top3SellingProducts?.map((product) => (
          <QuickOrderCard
            key={product._id}
            product={product}
            className="hover:bg-gray-50 transition-colors duration-200 p-3"
          />
        ))}
      </div>
    )}
  </div>
</div>
          </div>
          <div className="mt-5">
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
            <div className="flex flex-col mt-4 rounded-md border border-gray-200 " >
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
