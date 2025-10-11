import { useIntercomChat } from "@/Hooks/useIntercom";
import { useAuthContext } from "@/Hooks/useAuthContextV2";
import { useOutletContext } from "react-router-dom";
import { useEffect, useState } from "react";
import AlertNotification from "@/Components/ui/AlertNotification";
import HomeAnalyticsCards from "@/Components/ui/DashboardHomepageUi/HomeAnalyticsCards";
import DisabledAccountDialog from "@/Components/DisabledAccountDialog";
import AuqliUniversity from "@/Components/AuqliUniversity";
import DashboardNotificationsCard from "@/Components/ui/DashboardHomepageUi/DashboardNotificationsCard";
import DashboardTopSellingProductsCard from "@/Components/ui/DashboardHomepageUi/DashboardTopSellingProductsCard";
import DashboardPlatformAnnouncmentsCard from "@/Components/ui/DashboardHomepageUi/DashboardPlatformAnnouncmentsCard";
import DashboardOrdersTableCard from "@/Components/ui/DashboardHomepageUi/DashboardOrdersTableCard";
import DashboardTopBanner from "@/Components/ui/DashboardHomepageUi/DashboardTopBanner";

const HomePage = () => {
  const { initUser } = useIntercomChat();
  const { setHeaderName, setNavName, setShowBackButton } = useOutletContext();
  const { seller, logout, isAccountDisabled } = useAuthContext();

  const [notification] = useState(false);
  const [showDisabledDialog, setShowDisabledDialog] = useState(false);

  // useEffect to set the header name, nav name, and show back button
  useEffect(() => {
    setHeaderName("Dashboard");
    setNavName("");
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

  // Handler for when the disabled account dialog is closed
  const handleCloseDisabledDialog = () => {
    setShowDisabledDialog(false);
    // Log the user out when they close the dialog
    logout();
  };

  return (
    <div className="mt-28">
      {/* Disabled Account Dialog */}
      <DisabledAccountDialog
        isOpen={showDisabledDialog}
        onClose={handleCloseDisabledDialog}
      />

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

      {/* Disabled Account Dialog */}
      {showDisabledDialog && (
        <DisabledAccountDialog onClose={handleCloseDisabledDialog} />
      )}
    </div>
  );
};

export default HomePage;
