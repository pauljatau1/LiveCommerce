import { useEffect, useState } from "react";
import { useAuthContext } from "../../Hooks/useAuthContext";
import { Icon } from "@iconify/react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { BASE_URL } from "../../Constants/Server";
import { getTotalSellerUCustomers, getPlatformAnnouncement, getPublicResources } from "../../Utilities/apiRestaurant";
import { Link } from "react-router-dom";
import AlertNotification from "../../Components/ui/AlertNotification";
import HomeAnalyticsCard from "../../Components/ui/DashboardHomepageUi/HomeAnalyticsCard";
import QuickOrderCard from "../../Components/QuickOrderCard";
import OrdersTable from "../../Components/OrdersTable";
import AnnouncementCard from "../../Components/AnnouncementCard";
import DashboardSkeleton from "../../Components/ui/DashboardSkeleton";
import DisabledAccountDialog from "../../Components/DisabledAccountDialog";
import axios from "axios";
import ObjectID from 'bson-objectid';
import CircularProgress from '@mui/material/CircularProgress';
import { FiShoppingBag, FiBarChart2, FiUserPlus } from 'react-icons/fi';
import { FaStoreAlt } from "react-icons/fa";
import { BiWallet } from 'react-icons/bi';
import { Dialog, DialogTrigger } from "@/Components/ui/dialog";
import { Tooltip, TooltipTrigger, TooltipContent } from "../../Components/ui/tooltip";
import NotificationsDialog from "../../Components/NotificationsDialog";
import { useOutletContext } from "react-router-dom";
import NoOrderFound from "../../assets/no-order-found.png";
import { useIntercomChat } from "../../Hooks/useIntercom";
import Skeleton from 'react-loading-skeleton';
import AuqliUniversity from "../../Components/AuqliUniversity";
import EmailVerificationModal from "../../Components/EmailVerificationModal";
import PickupAddressVerificationModal from "../../Components/PickupAddressVerificationModal";
import { handleApiError } from "../../util/tokenValidation";



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
    if (!token) {
      throw new Error('No authentication token found');
    }
    
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
    // Let the parent function handle the error for consistent token validation
    throw error;
  }
};

const HomePage = () => {
  // Core hooks initialization
  const navigate = useNavigate();
  const { initUser } = useIntercomChat();
  const { setHeaderName, setNavName, setShowBackButton } = useOutletContext()
  const { seller, fetchSellerDetails, getTop3SellingProducts, top3SellingProducts, isLoading, stuffToDo, getSellerNotifications, logout, isAccountDisabled } = useAuthContext();
  const [searchParams, setSearchParams] = useSearchParams();
  // State management for dashboard data and UI
  const [notification] = useState(false);
  const [orders, setOrders] = useState([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isDataReady, setIsDataReady] = useState(false);
  const [homeAnalyticsCardData, setHomeAnalyticsCardData] = useState([]);
  const [platformAnnouncement, setPlatformAnnouncement] = useState([]);
  const [publicResources, setPublicResources] = useState([]);
  const [showDisabledDialog, setShowDisabledDialog] = useState(false);
  const [showEmailVerificationModal, setShowEmailVerificationModal] = useState(false);
  const [showPickupAddressModal, setShowPickupAddressModal] = useState(false);

  useEffect(() => {
    setHeaderName("Dashboard")
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

  


  const sellerDetails = JSON.parse(localStorage.getItem('seller'));

  useEffect(() => {
    const pickupAddressRequired = searchParams.get('pickupAddressRequired');
    if (pickupAddressRequired) {
      setShowPickupAddressModal(true);
    }
  }, [searchParams]);

  // Check for disabled account
  useEffect(() => {
    if (isAccountDisabled) {
      // Add a small delay to ensure the page is fully loaded
      // before showing the dialog to prevent analytics errors
      const timer = setTimeout(() => {
        setShowDisabledDialog(true);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isAccountDisabled]);

  // Check for email verification status
  useEffect(() => {
    const storedSeller = JSON.parse(localStorage.getItem('seller') || '{}');
    if (storedSeller && storedSeller._id) {
      const isEmailVerified = storedSeller.emailVerified === true;
      if (!isEmailVerified) {
        setShowEmailVerificationModal(true);
      }
    }
  }, []);

  // Handler for when the disabled account dialog is closed
  const handleCloseDisabledDialog = () => {
    setShowDisabledDialog(false);
    // Log the user out when they close the dialog
    logout();
  };

  // Main data fetching effect with loading optimization
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchDashboardData = async () => {
      try {
        setIsDataLoading(true);

        // Add a timeout to abort the request if it takes too long
        const timeoutId = setTimeout(() => {
          controller.abort();
          console.log('Dashboard data fetch timed out, showing placeholder data');
          
          // Show minimal UI with placeholder data rather than blocking the dashboard
          setIsDataReady(true);
          setIsDataLoading(false);
        }, 10000); // 10 second timeout

        // Authentication setup
        const token = localStorage.getItem('sellerToken');
        if (!token) {
          navigate('/login', { replace: true });
          clearTimeout(timeoutId);
          return;
        }
        
        const { data: authToken } = JSON.parse(token);
        const seller = JSON.parse(localStorage.getItem('seller'));

        // Split API calls into critical and non-critical data
        try {
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

          // Clear timeout since data loaded successfully
          clearTimeout(timeoutId);

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
          try {
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
          } catch (nonCriticalError) {
            // Log but don't block UI for non-critical data
            console.error('Error loading non-critical dashboard data:', nonCriticalError);
          }
        } catch (apiError) {
          clearTimeout(timeoutId);
          
          // Handle token validation errors with our utility function
          const wasHandled = handleApiError(apiError, navigate);
          if (wasHandled) return;
          
          // If the error wasn't handled by our utility, throw it for the outer catch
          throw apiError;
        }
              } catch (error) {
          if (error.name === 'AbortError') {
            console.log('Fetch aborted');
            return;
          }
          console.error('Dashboard loading error:', error);
        
        // Ensure UI is not blocked even if data fetch fails
        setIsDataReady(true);
        setIsDataLoading(false);
      }
    };

    fetchDashboardData();

    return () => {
      controller.abort();
    };
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

  const formatChangeFromLastWeek = (value, type) => {
    if (type == 'number') {
      return `+${value}`;
    } else if (type == 'percentage') {
      return `${value}%`;
    } else {
      return "";
    }
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
        percentage: formatChangeFromLastWeek(analytics.walletBalance.change.value, analytics.walletBalance.change.type),
        trend: analytics.walletBalance.change.value >= 0 ? 'up' : 'down',
        iconColor: 'text-green-600',
        iconBackground: 'bg-green-50',
        link: '/dashboard/earnings-payouts'
      },
      {
        id: ObjectID().toHexString(),
        title: 'Store Visits',
        icon: FaStoreAlt,
        current: formatMetricValue(analytics.storeVisits.count),
        percentage: formatChangeFromLastWeek(analytics.storeVisits.change.value, analytics.storeVisits.change.type),
        trend: analytics.storeVisits.change.value >= 0 ? 'up' : 'down',
        iconColor: 'text-blue-600',
        iconBackground: 'bg-blue-50',
        link: '/dashboard/analytics-insights'
      },
      {
        id: ObjectID().toHexString(),
        title: 'Total Orders',
        icon: FiShoppingBag,
        current: formatMetricValue(analytics.totalOrders.count),
        percentage: formatChangeFromLastWeek(analytics.totalOrders.change.value, analytics.totalOrders.change.type),
        trend: analytics.totalOrders.change.value >= 0 ? 'up' : 'down',
        iconColor: 'text-purple-600',
        iconBackground: 'bg-purple-50',
        link: '/dashboard/orders'
      },
      {
        id: ObjectID().toHexString(),
        title: 'Conversion Rate',
        icon: FiBarChart2,
        current: `${analytics.conversionRate.percentage}%`,
        percentage: formatChangeFromLastWeek(analytics.conversionRate.change.value, analytics.conversionRate.change.type),
        trend: analytics.conversionRate.change.value >= 0 ? 'up' : 'down',
        iconColor: 'text-green-600',
        iconBackground: 'bg-green-50',
        link: '/dashboard/analytics-insights'
      },
      {
        id: ObjectID().toHexString(),
        title: 'Customers',
        icon: FiUserPlus,
        current: formatMetricValue(analytics.newCustomers.count),
        percentage: formatChangeFromLastWeek(analytics.newCustomers.change.value, analytics.newCustomers.change.type),
        trend: analytics.newCustomers.change.value >= 0 ? 'up' : 'down',
        iconColor: 'text-orange-600',
        iconBackground: 'bg-orange-50',
        link: '/dashboard/customers'
      }
    ];
  };

  // Listen for verification completed event
  useEffect(() => {
    const handleVerificationCompleted = () => {
      console.log("Verification completed event received, refreshing seller data...");
      fetchSellerDetails();
    };

    window.addEventListener('seller-verification-completed', handleVerificationCompleted);
    
    return () => {
      window.removeEventListener('seller-verification-completed', handleVerificationCompleted);
    };
  }, []);

  const isPickupAddressRequired = sellerDetails?.accountType === 'individual' ? sellerDetails?.hasFilledAddress === false : sellerDetails?.hasFilledBusinessAddress === false;

  return (
    <div className="mt-28">
      {/* Disabled Account Dialog */}
      <DisabledAccountDialog
        isOpen={showDisabledDialog}
        onClose={handleCloseDisabledDialog}
      />



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

          {/* Verification Banner */}
          {sellerDetails && (
            !sellerDetails?.emailVerified || 
            // !sellerDetails?.isVerified || 
            isPickupAddressRequired ||
            sellerDetails?.hasProducts === false ||
            sellerDetails?.hasMoreThan10Blips === false
          ) && (
            <div className="hidden lg:flex mb-6">
              <div className="w-full bg-[#ECECD5] rounded-xl p-[8px] ">
                <div className="flex items-center overflow-x-auto scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Icon icon="solar:shield-warning-bold" className="h-5 w-5 text-green-600" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {/* Email Verification */}
                    {sellerDetails?.emailVerified === false && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center cursor-help gap-1.5 px-3 py-1.5 bg-white rounded-lg border border-gray-200">
                              <Icon icon="material-symbols-light:mail-sharp" className="h-4 w-4 text-green-500" />
                              <span className="text-xs font-medium whitespace-nowrap text-[#4D5E6D] ">E-mail not verified</span>
                            </div>
                            <button
                              onClick={() => setShowEmailVerificationModal(true)}
                              className="px-4 py-1.5 bg-green-600 whitespace-nowrap text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors"
                            >
                              Verify
                            </button>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="bg-white/90 backdrop-blur-sm border border-gray-200 shadow-lg max-w-xs">
                          <div className="p-2">
                            <p className="font-medium text-sm text-gray-900 mb-1">Email Verification Required</p>
                            <p className="text-xs text-gray-600">
                              Verify your email to secure your account, receive order notifications, and enable password recovery. This helps protect your business and ensures you never miss important updates.
                            </p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    )}

                    {/* KYC Verification 
                    {sellerDetails?.isVerified === false && (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg border border-gray-200">
                          <Icon icon="solar:shield-check-bold" className="h-4 w-4 text-green-500" />
                          <span className="text-xs font-medium whitespace-nowrap text-[#4D5E6D]">You have pending KYC support</span>
                        </div>
                        <button
                          className="px-4 py-1.5 bg-green-600 text-white whitespace-nowrap text-xs font-medium rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Complete Now
                        </button>
                      </div>
                    )} */}

                    {/* Address Verification */}
                    {isPickupAddressRequired && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center cursor-help gap-1.5 px-3 py-1.5 bg-white rounded-lg border border-gray-200">
                              <Icon icon="solar:map-point-bold" className="h-4 w-4 text-green-500" />
                              <span className="text-xs font-medium whitespace-nowrap text-[#4D5E6D]">Pickup address required</span>
                            </div>
                            <button
                              onClick={() => setShowPickupAddressModal(true)}
                              className="px-4 py-1.5 bg-green-600 text-white whitespace-nowrap text-xs font-medium rounded-lg hover:bg-green-700 transition-colors"
                            >
                              Add Address
                            </button>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="bg-white/90 backdrop-blur-sm border border-gray-200 shadow-lg max-w-xs">
                          <div className="p-2">
                            <p className="font-medium text-sm text-gray-900 mb-1">Pickup Address Required</p>
                            <p className="text-xs text-gray-600">
                              Add your pickup address to enable order fulfillment. This allows customers to place orders and helps us calculate accurate shipping costs for your products.
                            </p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    )}

                    {/* Products Required */}
                    {sellerDetails?.hasProducts === false && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center cursor-help gap-1.5 px-3 py-1.5 bg-white rounded-lg border border-gray-200">
                              <Icon icon="solar:bag-bold" className="h-4 w-4 text-green-500" />
                              <span className="text-xs font-medium whitespace-nowrap text-[#4D5E6D]">Add your first product</span>
                            </div>
                            <button
                              onClick={() => navigate('/dashboard/products')}
                              className="px-4 py-1.5 bg-green-600 text-white whitespace-nowrap text-xs font-medium rounded-lg hover:bg-green-700 transition-colors"
                            >
                              Add Product
                            </button>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="bg-white/90 backdrop-blur-sm border border-gray-200 shadow-lg max-w-xs">
                          <div className="p-2">
                            <p className="font-medium text-sm text-gray-900 mb-1">Start Selling Today</p>
                            <p className="text-xs text-gray-600">
                              Add your first product to start your selling journey on Auqli. Upload product images, set prices, and reach thousands of potential customers instantly.
                            </p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    )}

                    {/* Blips Required */}
                    {sellerDetails?.hasMoreThan10Blips === false && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 px-3 cursor-help py-1.5 bg-white rounded-lg border border-gray-200">
                              <Icon icon="solar:video-frame-bold" className="h-4 w-4 text-green-500" />
                              <span className="text-xs font-medium whitespace-nowrap text-[#4D5E6D]">Create more blips</span>
                            </div>
                            <button
                              onClick={() => navigate('/dashboard/products')}
                              className="px-4 py-1.5 bg-green-600 text-white whitespace-nowrap text-xs font-medium rounded-lg hover:bg-green-700 transition-colors"
                            >
                              Create Blips
                            </button>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="bg-white/90 backdrop-blur-sm border border-gray-200 shadow-lg max-w-xs">
                          <div className="p-2">
                            <p className="font-medium text-sm text-gray-900 mb-1">Boost Your Visibility</p>
                            <p className="text-xs text-gray-600">
                              Create engaging blips to showcase your products and increase visibility. Blips help you connect with your audience, drive sales, and build your brand presence on Auqli.
                            </p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Analytics Cards */}
          <div className="flex justify-center items-center">
            {
              homeAnalyticsCardData.length > 0 ? (
                <div className="w-full">
                  {/* Mobile scrollable cards */}
                  <div className="sm:hidden w-full overflow-x-auto pb-4 pt-2 -mx-4 px-4 scrollbar-hide">
                    <div className="flex space-x-3 min-w-max">
                      {
                        homeAnalyticsCardData.map((card) => (
                          <div key={card.id} className="w-[260px] flex-shrink-0">
                            <HomeAnalyticsCard card={card} />
                          </div>
                        ))
                      }
                    </div>
                    <div className="flex justify-center mt-3">
                      <div className="flex space-x-1">
                        {
                          homeAnalyticsCardData.map((_, index) => (
                            <div 
                              key={index} 
                              className={`w-1.5 h-1.5 rounded-full ${index === 0 ? 'bg-green-500' : 'bg-gray-300'}`}
                            />
                          ))
                        }
                      </div>
                    </div>
                  </div>
                  
                  {/* Desktop grid layout */}
                  <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-x-4 xl:gap-x-8 gap-y-2 md:gap-y-4 xl:gap-y-8 w-full">
                    {
                      homeAnalyticsCardData.map((card) => (
                        <HomeAnalyticsCard key={card.id} card={card} />
                      ))
                    }
                  </div>
                </div>
              ) : (
                <div className="w-full">
                  {/* Mobile skeleton */}
                  <div className="sm:hidden w-full  overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
                    <div className="flex space-x-3 min-w-max">
                      {[...Array(5)].map((_, index) => (
                        <div key={index} className="w-[260px] flex-shrink-0">
                          <Skeleton height={120} />
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Desktop skeleton */}
                  <div className="hidden  sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mt-9 w-full">
                    {[...Array(5)].map((_, index) => (
                      <Skeleton key={index} height={150} />
                    ))}
                  </div>
                </div>
              )
            }
          </div>
          {/* Stuff to do 1 */}
          <div className="mt-10 hidden sm:flex flex-col lg:flex-row lg:align-center lg:justify-between gap-14 lg:gap-4">
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
                        <button 
                          onClick={() => {
                            // Mark notification as read if it isn't already
                            if (!notification.isRead) {
                              const markNotificationAsRead = async (notificationId) => {
                                try {
                                  const sellerToken = JSON.parse(localStorage.getItem('sellerToken'))?.data;
                                  if (!sellerToken) return;
                                  
                                  const response = await fetch(`${BASE_URL}/notifications/${notificationId}/mark-read`, {
                                    method: 'PUT',
                                    headers: {
                                      'Authorization': `Bearer ${sellerToken}`,
                                      'accept': '*/*'
                                    }
                                  });
                                  
                                  if (!response.ok) {
                                    throw new Error('Failed to mark notification as read');
                                  }
                                } catch (error) {
                                  console.error('Error marking notification as read:', error);
                                }
                              };
                              
                              markNotificationAsRead(notification._id);
                            }
                            
                            // Route based on notification type
                            switch (notification.type) {
                              case 'low_stock':
                              case 'back_in_stock':
                                navigate(`/dashboard/products`);
                                break;
                              
                              case 'new_follower':
                                // Redirect to account page with parameter to open followers dialog
                                navigate('/dashboard/account?openFollowers=true');
                                break;
                              
                              case 'new_order':
                              case 'order_paid':
                              case 'order_delivered':
                              case 'order_cancelled':
                              case 'order_status_update':
                              case 'order_shipped':
                              case 'order_reminder':
                              case 'order_picked_up':
                              case 'order_in_transit':
                                // Navigate to the specific order if orderId is available in the notification data
                                if (notification.data && notification.data.orderId) {
                                  navigate(`/dashboard/order/${notification.data.orderId}`);
                                } else {
                                  navigate('/dashboard/orders');
                                }
                                break;
                              
                              case 'return_request':
                              case 'return_created':
                              case 'return_approved':
                              case 'return_rejected':
                              case 'return_info_needed':
                              case 'return_partial_refund':
                              case 'return_label_created':
                              case 'return_pickup_arranged':
                                navigate('/dashboard/returns');
                                break;
                              
                              case 'new_campaign':
                              case 'campaign_scheduled':
                                navigate('/dashboard/marketing/inbox-campaigns/list');
                                break;
                              
                              case 'blip_like':
                              case 'blip_comment':
                                // Just navigate to the blips page without opening any specific details
                                navigate('/dashboard/blips');
                                break;
                              
                              default:
                                // Default to dashboard if no specific route
                                navigate('/dashboard/home');
                            }
                          }}
                          className="border border-[#0BB248] text-sm text-[#0BB248] font-cabin whitespace-nowrap hover:bg-[#DEFFEE] px-3 py-1 rounded-lg transition-all duration-300 ease-in-out"
                        >
                          Check It
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full min-h-[364px] text-gray-500">
                    <Icon icon="line-md:bell-loop" className="text-gray-400 w-20 h-20  " />
                    <p className="text-base font-medium text-[#425466] font-inter">No notifications</p>

                    <p className="text-sm text-[#425466] font-inter">You&apos;re all caught up!</p>
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
                  to="/dashboard/analytics-insights"
                  className="flex items-center w-fit px-3 py-2.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md transition-colors duration-200 shadow-sm hover:shadow"
                >
                  View Analytics
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
          <div className=" bg-white mt-1.5 sm:mt-5">
            {isLoading ? (
              <Skeleton height={400} />
            ) : (
              <OrdersTable orders={orders} />
            )}
          </div>
          <div className="mt-10">
            <AuqliUniversity />
          </div>
          <div className="mt-5">
            <h1 className="text-lg font-lexend font-bold text-[#17171B] mb-2">Platform Announcements</h1>
            <div className="flex flex-col bg-white mt-4 rounded-md border border-gray-200 " >
              {
                platformAnnouncement.length > 0 ? (
                  platformAnnouncement.map((announcement) => (
                    <AnnouncementCard key={announcement._id} announcement={announcement} />
                  ))
                ) : (
                  isDataLoading ? (
                    <Skeleton count={3} height={100} className="mb-4" />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-8 text-gray-500">
                      <Icon icon="line-md:clipboard-list" className="text-gray-400 w-20 h-20" />
                      <p className="text-base font-medium text-[#425466] font-inter mt-3">No announcements available</p>
                      <p className="text-sm text-[#425466] font-inter mt-1">Check back later for updates from Auqli</p>
                    </div>
                  )
                )
              }
            </div>
          </div>
        </div>
      )}

      
      {/* Disabled Account Dialog */}
      {showDisabledDialog && (
        <DisabledAccountDialog onClose={handleCloseDisabledDialog} />
      )}

      {/* Email Verification Modal */}
      <EmailVerificationModal
        isOpen={showEmailVerificationModal}
        onClose={() => setShowEmailVerificationModal(false)}
        userEmail={sellerDetails?.email || ''}
      />

      {/* Pickup Address Verification Modal */}
      <PickupAddressVerificationModal
        isOpen={showPickupAddressModal}
        onClose={() => setShowPickupAddressModal(false)}
      />
    </div>
  )
};

export default HomePage;
