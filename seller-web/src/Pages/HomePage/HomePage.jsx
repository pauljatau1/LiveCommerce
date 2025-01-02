import { useEffect, useState } from "react";
import { useAuthContext } from "../../Hooks/useAuthContext";
import { Icon } from "@iconify/react";
import { orderTempData, toDoCardTempData, suggestVideosData, platformAnnouncementData } from "../../Utilities/data";
import { Crisp } from "crisp-sdk-web";
import { useNavigate, useNavigation } from "react-router-dom";
import { useSidebar } from '../../Hooks/useSideBar';
import SideBarNav from "../../Components/ui/DashboardHomepageUi/SideBarNav";
import { BASE_URL } from "../../Constants/Server";
import { getTotalSellerUCustomers } from "../../Utilities/apiRestaurant";
import SearchBar from "../../Components/ui/DashboardHomepageUi/SearchBar";
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

// Helper function: Formats numbers with K/M suffix and handles pluralization
// Example: formatNumber(1500, "view") returns "1.5K views"
const formatNumber = (number, label) => {
  if (number > 1000000) return `${number}M ${label}s`;
  if (number > 1000) return `${number}K ${label}s`;
  return `${number} ${number === 1 ? label : label + 's'}`;
};

const HomePage = () => {
  // Core hooks initialization
  const navigate = useNavigate();
  const { seller, fetchSellerDetails } = useAuthContext();
  const { isSidebarOpen, setIsSidebarOpen } = useSidebar();

  // State management for dashboard data and UI
  const [notification, setNotification] = useState(false);  // Controls notification visibility
  const [orders, setOrders] = useState([]);               // Stores all seller orders
  const [isLoading, setIsLoading] = useState(true);       // Controls loading state
  const [isDataReady, setIsDataReady] = useState(false);  // Indicates when data is ready to display
  const [error, setError] = useState(null);               // Stores error state
  const [homeAnalyticsCardData, setHomeAnalyticsCardData] = useState([]); // Analytics cards data


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

  // Fetch seller details on component mount
  useEffect(() => {
    fetchSellerDetails();
  }, []);

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
    console.log('totalCustomers', totalCustomers);
    console.log('orders', orders);
    console.log('storeVisits', storeVisits);
    return [
      {
        id: ObjectID().toHexString(),
        title: 'Store Visits',
        icon: 'bi:person-walking',
        current: calculateStoreVisitsDisplay(storeVisits) || 0,
        percentage: '0%',
        color: '#0BB248',
        backgroundColor: '#05031F'
      },
      {
        id: ObjectID().toHexString(),
        title: 'Total Sales',
        icon: 'emojione-monotone:money-bag',
        current: calculateTotalSales(orders) || 0,
        percentage: '0%',
        color: '#0BB248',
        backgroundColor: '#05031F'
      },
      {
        id: ObjectID().toHexString(),
        title: 'Total Orders',
        icon: 'icon-park-solid:shopping-bag',
        current: formatNumber(orders.length, 'Order'),
        percentage: '0%',
        color: '#0BB248',
        backgroundColor: '#05031F'
      },
      {
        id: ObjectID().toHexString(),
        title: 'Total Conversions',
        icon: 'icon-park-solid:shopping-bag',
        current: '0%',
        percentage: '0%',
        color: '#0BB248',
        backgroundColor: '#05031F'
      },
      {
        id: ObjectID().toHexString(),
        title: 'Total Customers',
        icon: 'icon-park-solid:shopping-bag',
        current: formatNumber(totalCustomers?.followers?.length || 0, 'Customer'),
        percentage: '0%',
        color: '#0BB248',
        backgroundColor: '#05031F'
      }
    ];
  };

  // Main data fetching effect
  // Retrieves orders and customer data on component mount
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setIsDataReady(false);

        // Authentication setup
        const token = localStorage.getItem('sellerToken');
        const { data: authToken } = JSON.parse(token);
        const seller = JSON.parse(localStorage.getItem('seller'));

        // Parallel API calls for better performance
        const [ordersResponse, customersResponse] = await Promise.all([
          axios.get(
            `${BASE_URL}/order/seller/${seller._id}`,
            {
              headers: { Authorization: `Bearer ${authToken}` },
              signal
            }
          ),
          getTotalSellerUCustomers()
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
        setIsLoading(false);
      }
    };

    fetchDashboardData();

    // Cleanup: abort any pending requests when component unmounts
    return () => controller.abort();
  }, []);



  return (
    <>
      {/* Search Bar */}
      <SearchBar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />
      {/* Notification */}
      {
        notification && (
          <AlertNotification />
        )
      }

      {isLoading || !isDataReady ? (
        <div className="flex flex-col justify-center items-center h-[80dvh]">
          <div className="w-1/4">
            <LinearProgress color="success" />
          </div>
        </div>
      ) : (
        <div>
          {/* Greeting */}
          <div className="flex justify-between items-center flex-wrap xl:flex-nowrap">
            <h4 className="text-lg font-cabin font-normal text-black mt-9 w-[250px] xl:w-full ">{getGreeting()}, {seller?.firstName || 'User'}, how are you today?</h4>
            <button className="flex items-center gap-2 text-sm font-cabin font-normal text-[#05031F] mt-9 bg-[#0BB24817] rounded-[7.8px] py-3 px-4 hover:bg-[#0BB24820] transition-all duration-300 ease-in-out">
              <Icon icon="solar:calendar-outline" width="24" height="24" color="#05031F" />
              <p className="whitespace-nowrap">Filtering by date</p>
            </button>
          </div>
          {/* Analytics Cards */}
          <div className="flex justify-center items-center">
            {
              homeAnalyticsCardData.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-9 w-full">
                  {
                    homeAnalyticsCardData.map((card) => (
                      <HomeAnalyticsCard key={card.id} card={card} />
                    ))
                  }
                </div>
              ) : (
                <div>
                  No data found, check your network
                </div>
              )
            }
          </div>
          {/* Stuff to do 1 */}
          <div className="mt-20 lg:mt-28 flex flex-col lg:flex-row lg:align-center lg:justify-between gap-14 lg:gap-4">
            <div className="w-full">
              <div>
                <h3 className="text-lg font-cabin font-bold text-black">Stuff to do</h3>
              </div>
              <div className="flex flex-col md:h-[364px] gap-4 border border-[#00000026] bg-[#F7F7F7] px-4 py-3 lg:px-8 lg:py-7 rounded-[10px] mt-7">
                {
                  toDoCardTempData.map((card) => (
                    <ToDoCard key={card.id} card={card} />
                  ))
                }
              </div>
            </div>
            {/* Stuff to do 2 */}
            <div className="w-full">
              {/* Top 3 selling products */}
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-cabin font-bold text-black">Your top 3 selling products</h3>
                <button className="text-sm font-cabin font-normal  rounded-[7.8px] px-4 py-2 bg-[#05031F] text-white ">View all</button>
              </div>
              <div className="flex flex-col md:h-[364px] gap-4 border border-[#00000026] bg-[#F7F7F7] px-4 py-3 lg:px-8 lg:py-7 rounded-[10px] mt-5">
                {
                  orderTempData.map((order) => (
                    <QuickOrderCard key={order.id} order={order} />
                  ))
                }
              </div>
            </div>
          </div>
          <div className="mt-20">
            <OrdersTable orders={orders} />
          </div>
          <div className="mt-20 bg-[#E7F7ED] rounded-[10px] px-4 py-3 lg:px-8 lg:py-7">
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
                  suggestVideosData.map((video) => (
                    <div key={video.id} className="flex-none">
                      <SuggestedVideoCard video={video} />
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
          <div className="mt-20">
            <h1 className="text-lg font-lexend font-bold text-[#05031F] mb-2">Platform Announcements</h1>
            <div className="flex flex-col mt-4 bg-[#0BB2481A] " >
              {
                platformAnnouncementData.map((announcement) => (
                  <AnnouncementCard key={announcement.id} announcement={announcement} />
                ))
              }
            </div>
          </div>
        </div>
      )}
    </>
  )
};

export default HomePage
