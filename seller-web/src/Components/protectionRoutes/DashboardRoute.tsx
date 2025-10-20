import { useAuthContext } from "@/Hooks/useAuthContextV2";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { tokenUtils, sellerUtils } from "@/util/auth";

export default function DashboardRoute({ children }: { children: React.ReactNode }) {
    const { seller, token } = useAuthContext();
    const navigate = useNavigate();

    useEffect(() => {
        // Use both context and localStorage to decide
        const hasToken = Boolean(token?.data || tokenUtils.getBearerToken());
        const hasSeller = Boolean(seller || sellerUtils.getSeller());

        if (!hasToken && !hasSeller) {
            navigate("/login", { replace: true });
        }
    }, [seller, token, navigate]);

    return children;
}