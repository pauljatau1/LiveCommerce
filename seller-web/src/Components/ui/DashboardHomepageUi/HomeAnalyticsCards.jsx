import HomeAnalyticsCard from "./HomeAnalyticsCard";
import { Skeleton } from "@/Components/ui/skeleton";
import { useEffect, useState } from "react";
import ObjectID from "bson-objectid";
import { BASE_URL } from "@/Constants/Server";
import { BiWallet } from "react-icons/bi";
import { FiShoppingBag, FiBarChart2, FiUserPlus } from "react-icons/fi";
import { FaStoreAlt } from "react-icons/fa";
import axios from "axios";

// Add this helper function for number formatting
function formatMetricValue(value) {
  if (!value) return "0";
  if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}B`;
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toString();
}

// Prepares data for analytics dashboard cards
// Includes: Store Visits, Total Sales, Orders, Conversions, Customers
function prepareAnalyticsData(analytics) {
  if (!analytics) return [];

  return [
    {
      id: ObjectID().toHexString(),
      title: "Payable Balance",
      icon: BiWallet,
      current: `₦${formatMetricValue(analytics.walletBalance.amount)}`,
      value: analytics.walletBalance.change.value,
      type: analytics.walletBalance.change.type,
      iconColor: "text-green-600",
      iconBackground: "bg-green-50",
      link: "/dashboard/earnings-payouts",
    },
    {
      id: ObjectID().toHexString(),
      title: "Store Visits",
      icon: FaStoreAlt,
      current: formatMetricValue(analytics.storeVisits.count),
      value: analytics.storeVisits.change.value,
      type: analytics.storeVisits.change.type,
      iconColor: "text-blue-600",
      iconBackground: "bg-blue-50",
      link: "/dashboard/analytics-insights",
    },
    {
      id: ObjectID().toHexString(),
      title: "Total Orders",
      icon: FiShoppingBag,
      current: formatMetricValue(analytics.totalOrders.count),
      value: analytics.totalOrders.change.value,
      type: analytics.totalOrders.change.type,
      iconColor: "text-purple-600",
      iconBackground: "bg-purple-50",
      link: "/dashboard/orders",
    },
    {
      id: ObjectID().toHexString(),
      title: "Conversion Rate",
      icon: FiBarChart2,
      current: `${analytics.conversionRate.percentage}%`,
      value: analytics.conversionRate.change.value,
      type: analytics.conversionRate.change.type,
      iconColor: "text-green-600",
      iconBackground: "bg-green-50",
      link: "/dashboard/analytics-insights",
    },
    {
      id: ObjectID().toHexString(),
      title: "Customers",
      icon: FiUserPlus,
      current: formatMetricValue(analytics.newCustomers.count),
      value: analytics.newCustomers.change.value,
      type: analytics.newCustomers.change.type,
      iconColor: "text-orange-600",
      iconBackground: "bg-orange-50",
      link: "/dashboard/customers",
    },
  ];
}

export default function HomeAnalyticsCards() {
  const [homeAnalyticsCardData, setHomeAnalyticsCardData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const getSellerAnalytics = async () => {
    const url = `${BASE_URL}/seller/statistics`;
    const response = await axios.get(url);
    return response.data;
  };

  useEffect(() => {
    console.log("Fetching seller analytics data...");
    setIsLoading(true);
    const fetchAnalytics = async () => {
      try {
        const analytics = await getSellerAnalytics();
        const preparedData = prepareAnalyticsData(analytics);
        setHomeAnalyticsCardData(preparedData);
      } catch (error) {
        console.error("Error fetching seller analytics:", error);
        setHomeAnalyticsCardData([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-x-4 xl:gap-x-8 gap-y-2 md:gap-y-4 xl:gap-y-8">
        {[...Array(5)].map((_, index) => (
          <div
            key={index}
            className="bg-white px-6 py-4 rounded-xl border border-gray-200"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="h-7 bg-gray-200 rounded w-32"></div>
              <div className="h-4 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // if (homeAnalyticsCardData.length === 0) {
  //   return null;
  // }

  return (
    <div className="w-full">
      {/* Mobile scrollable cards */}
      <div className="sm:hidden w-full overflow-x-auto pb-4 pt-2 -mx-4 px-4 scrollbar-hide">
        <div className="flex space-x-3 min-w-max">
          {homeAnalyticsCardData.map((card) => (
            <div key={card.id} className="w-[260px] flex-shrink-0">
              <HomeAnalyticsCard card={card} />
            </div>
          ))}
        </div>
        <div className="flex justify-center mt-3">
          <div className="flex space-x-1">
            {homeAnalyticsCardData.map((_, index) => (
              <div
                key={index}
                className={`w-1.5 h-1.5 rounded-full ${
                  index === 0 ? "bg-green-500" : "bg-gray-300"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Desktop grid layout */}
      <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-x-4 xl:gap-x-8 gap-y-2 md:gap-y-4 xl:gap-y-8 w-full">
        {homeAnalyticsCardData.map((card) => (
          <HomeAnalyticsCard key={card.id} card={card} />
        ))}
      </div>
    </div>
  );
}
