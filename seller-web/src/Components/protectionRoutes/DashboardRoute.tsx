import { useAuthContext } from "@/Hooks/useAuthContextV2";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { tokenUtils, sellerUtils } from "@/util/auth";
import { toast } from "sonner";

export default function DashboardRoute({ children }: { children: React.ReactNode }) {
    const { seller, token } = useAuthContext();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // Use both context and localStorage to decide
        const hasToken = Boolean(token?.data || tokenUtils.getBearerToken());
        const hasSeller = Boolean(seller || sellerUtils.getSeller());

        // Note: LivestreamSocketContext handles socket connection automatically
        // No need to manually connect here

        if (!hasToken && !hasSeller) {
            navigate("/login", { replace: true });
        }

        const isPickupAddressRequired = seller?.accountType === 'individual' ? seller?.hasFilledAddress === false : seller?.hasFilledBusinessAddress === false;
        
        // Restricted paths that require verification
        const restrictedPaths = [
          '/dashboard/add-products',
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
          toast.error('Pickup Address Required', {
            description: 'Register your pickup address to access this feature',
            style: {
              background: '#17171B',
              color: '#fff',
            }
          });

          // Redirect to dashboard home where verification dialog will appear
          navigate('/dashboard/home', { replace: true });
        }
    }, [seller, token, location.pathname]);

    return children;
}