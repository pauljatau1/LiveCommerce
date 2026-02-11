import type { Seller } from "@/types";
import { useEffect, lazy, Suspense } from "react";
import { useAuthContext } from "@/Hooks/useAuthContextV2";
import { useIntercomChat } from "@/Hooks/useIntercom";
import { useOutletContext } from "react-router-dom";
import { OutletContextType } from "@/types";
import Loader from "@/Components/Loader";

// Lazy load child components to reduce initial bundle size
const DashboardTopBannerV2 = lazy(() => import("@/Components/ui/DashboardHomepageUi/DashboardTopBannerV2"));
const HomeAnalyticsSection = lazy(() => import("@/Components/ui/DashboardHomepageUi/HomeAnalyticsSection"));
const DashboardActivitiesSection = lazy(() => import("@/Components/ui/DashboardHomepageUi/DashboardActivitiesSection"));
const DashboardOrdersSection = lazy(() => import("@/Components/ui/DashboardHomepageUi/DashboardOrdersSection"));
const AuqliUniversity = lazy(() => import("@/Components/shared/AuqliUniversity"));



export default function HomePageV2() {
    const { seller } = useAuthContext();
    const { initUser } = useIntercomChat();
    const { setHeaderName, setNavName, setShowBackButton } = useOutletContext<OutletContextType>();

    // useEffect to set the header name, nav name,show back button and initialize the user for intercom chat boot up
    useEffect(() => {
        setHeaderName(`Hello ${seller?.firstName ? seller?.firstName : ""}`);
        setNavName("Let's makes some sales today!");
        setShowBackButton(false);
        if (seller) {
            initUser(seller);
        }

        return () => {
            setShowBackButton(true);
        };
    }, []);

    return (
        <main className="py-[10px] lg:py-[20px] " >
            {/* Verification Banner */}
            <DashboardTopBannerV2 sellerDetails={seller as Seller} />
            {/* Home Analytics Section */}
            <HomeAnalyticsSection />
            {/* Dashboard Activities Section */}
            <DashboardActivitiesSection />
            {/* Dashboard Orders Section */}
            <DashboardOrdersSection />
            {/* Auqli Seller University */}
            <div className="mt-4 lg:mt-8">
                <AuqliUniversity />
            </div>
        </main>
    )
}
