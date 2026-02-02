import { useIntercomChat } from "@/Hooks/useIntercom";
import { useAuthContext } from "@/Hooks/useAuthContextV2";
import { useOutletContext } from "react-router-dom";
import { useEffect, useState } from "react";
import AlertNotification from "@/Components/ui/AlertNotification";
import HomeAnalyticsCards from "@/Components/ui/DashboardHomepageUi/HomeAnalyticsCards";
import AuqliUniversity from "@/Components/AuqliUniversity";
import DashboardNotificationsCard from "@/Components/ui/DashboardHomepageUi/DashboardNotificationsCard";
import DashboardTopSellingProductsCard from "@/Components/ui/DashboardHomepageUi/DashboardTopSellingProductsCard";
import DashboardPlatformAnnouncmentsCard from "@/Components/ui/DashboardHomepageUi/DashboardPlatformAnnouncmentsCard";
import DashboardOrdersTableCard from "@/Components/ui/DashboardHomepageUi/DashboardOrdersTableCard";
import DashboardTopBanner from "@/Components/ui/DashboardHomepageUi/DashboardTopBanner";

const HomePage = () => {
  const { initUser } = useIntercomChat();
  const { setHeaderName, setNavName, setShowBackButton } = useOutletContext();
  const { seller } = useAuthContext();

  const [notification] = useState(false);

  // useEffect to set the header name, nav name, and show back button
  useEffect(() => {
    setHeaderName(`Hello ${seller?.firstName ? seller?.firstName : "" }`);
    setNavName("Let's makes some sales today!");
    setShowBackButton(false);

    return () => {
      setShowBackButton(true);
    };
  }, []);

  // useEffect to initialize the user for intercom chat boot up
  useEffect(() => {
    if (seller) {
      initUser(seller);
    }
  }, []);

  return (
    <div className="mt-8">

      {/* Notification */}
      {notification && <AlertNotification />}

      <div>
        {/* Verification Banner */}
        <DashboardTopBanner sellerDetails={seller} />

        {/* Analytics Cards */}
        <HomeAnalyticsCards />

        <div className="mt-10 hidden sm:flex flex-col lg:flex-row lg:align-center lg:justify-between gap-14 lg:gap-4">
          {/* Notifications Section */}
          <DashboardNotificationsCard />

          {/* Top 3 Selling Products Section */}
          <DashboardTopSellingProductsCard />
        </div>

        {/* Orders Table Section */}
        <div className="bg-white mt-1.5 sm:mt-5">
          <DashboardOrdersTableCard />
        </div>

        {/* Auqli University Section */}
        <div className="mt-10">
          <AuqliUniversity />
        </div>

        {/* Platform Announcements Section */}
        <div className="mt-5">
          <DashboardPlatformAnnouncmentsCard />
        </div>
      </div>
    </div>
  );
};

export default HomePage;
