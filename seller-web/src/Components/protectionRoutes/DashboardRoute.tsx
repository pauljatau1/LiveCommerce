import { useAuthContext } from "@/Hooks/useAuthContextV2";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { tokenUtils, sellerUtils } from "@/util/auth";
import { useNotification } from "@/Hooks/useNotification";

export default function DashboardRoute({ children }: { children: React.ReactNode }) {
    const { seller, token } = useAuthContext();
    const navigate = useNavigate();
    const location = useLocation();
    const { showNotification } = useNotification();
    useEffect(() => {
        // Use both context and localStorage to decide
        const hasToken = Boolean(token?.data || tokenUtils.getBearerToken());
        const hasSeller = Boolean(seller || sellerUtils.getSeller());

        // Note: LivestreamSocketContext handles socket connection automatically
        // No need to manually connect here
        // Note: LivestreamSocketContext handles socket connection automatically
        // No need to manually connect here

        if (!hasToken && !hasSeller) {
            navigate("/login", { replace: true });
        }

        const currentSeller = seller || sellerUtils.getSeller();
        const isPickupAddressRequired = currentSeller?.accountType === 'individual' ? currentSeller?.hasFilledAddress === false : currentSeller?.hasFilledBusinessAddress === false;
        
        // Restricted paths that require verification
        const restrictedPaths = [
          '/dashboard/add-products',
          '/studio/list',
          '/studio/plan',
          '/studio/golive/',
          '/studio/live/',
          '/dashboard/edit-product',
          '/dashboard/livestreaming',
          '/dashboard/live-streams/create-live-auction',
          '/dashboard/live-streams/create-live-show',
          '/dashboard/live-streams/live-stream-studio'
        ];

        // Check if current path is restricted and user is unverified
        const currentPath = location.pathname;
        // Listing and planning are open before pickup setup; Go Live owns the service-area gate.
        const planningOrListing = currentPath.startsWith('/studio/list') || currentPath.startsWith('/studio/plan');
        const isRestrictedPath = !planningOrListing && restrictedPaths.some(path => currentPath.startsWith(path));

        if (isRestrictedPath && seller && isPickupAddressRequired) {
          if (!currentPath.startsWith('/studio')) showNotification('Pickup Address Required', 'error', 'dismissible');

          // Studio pages go to Getting started (pickup step); old dashboard pages keep their dialog
          navigate(currentPath.startsWith('/studio') ? '/studio/start?step=pickup' : '/dashboard/home', { replace: true, state: { studioNotice: 'Add your pickup address so couriers know where to collect.' } });
        }
    }, [seller, token, location.pathname]);

    return children;
}