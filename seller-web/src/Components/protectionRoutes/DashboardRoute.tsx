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

        const isPickupAddressRequired = seller?.accountType === 'individual' ? seller?.hasFilledAddress === false : seller?.hasFilledBusinessAddress === false;
        
        // Restricted paths that require verification
        const restrictedPaths = [
          '/dashboard/add-products',
          '/studio/list',
          '/dashboard/edit-product',
          '/dashboard/livestreaming',
          '/dashboard/live-streams/create-live-auction',
          '/dashboard/live-streams/create-live-show',
          '/dashboard/live-streams/live-stream-studio'
        ];

        // Check if current path is restricted and user is unverified
        const currentPath = location.pathname;
        const isRestrictedPath = restrictedPaths.some(path => currentPath.startsWith(path));

        if (isRestrictedPath && seller && isPickupAddressRequired) {
          showNotification('Pickup Address Required', 'error', 'dismissible');

          // Redirect to dashboard home where verification dialog will appear
          navigate('/dashboard/home', { replace: true });
        }
    }, [seller, token, location.pathname]);

    return children;
}