import { Skeleton } from "@/Components/shared/Skeleton";
import { useQuery } from "@tanstack/react-query";
import { sellerService } from "@/services/sellerService";
import { useEffect, useState } from "react";
import { formatMetricValue, formatChangeFromLastWeek } from "@/util/helpers";
import { sellerUtils } from "@/util/auth";
import type { AnalyticsData } from "@/types";
import ObjectID from "bson-objectid";
import StoreIcon from "@/assets/icons/StoreIcon";
import WalletIcon from "@/assets/icons/WalletIcon";
import EyeOpenIcon from "@/assets/icons/EyeOpenIcon";
import EyeCloseIcon from "@/assets/icons/EyeCloseIcon";
import OrdersBagIcon from "@/assets/icons/OrdersBagIcon";
import AnalyticsIcon from "@/assets/icons/Analytics";
import CustomersIcon from "@/assets/icons/CustomersIcon";
import AnalyticsCard from "./AnalyticsCard";

interface AnalyticsCardData {
    id: string;
    title: string;
    icon: React.ComponentType<{ color?: string; width?: number; height?: number; className?: string }>;
    current: string;
    value: number | undefined | null;
    type: string | undefined;
    iconColor: string;
    iconBackground: string;
    link: string;
}

// Prepares data for analytics dashboard cards
// Includes: Store Visits, Total Sales, Orders, Conversions, Customers
function prepareAnalyticsData(analytics: AnalyticsData | undefined): AnalyticsCardData[] {
    if (!analytics) return [];

    return [
        {
            id: ObjectID().toHexString(),
            title: "Payable Balance",
            icon: WalletIcon,
            current: formatMetricValue(analytics?.walletBalance?.amount),
            value: analytics?.walletBalance?.change?.value,
            type: analytics?.walletBalance?.change?.type,
            iconColor: "text-green-600",
            iconBackground: "bg-green-600/10",
            link: "/dashboard/earnings-payouts",
        },
        {
            id: ObjectID().toHexString(),
            title: "Store Visits",
            icon: StoreIcon,
            current: formatMetricValue(analytics?.storeVisits.count),
            value: analytics?.storeVisits?.change?.value,
            type: analytics?.storeVisits?.change?.type,
            iconColor: "text-blue-600",
            iconBackground: "bg-blue-600/10",
            link: "/dashboard/analytics-insights",
        },
        {
            id: ObjectID().toHexString(),
            title: "Total Orders",
            icon: OrdersBagIcon,
            current: formatMetricValue(analytics?.totalOrders.count),
            value: analytics?.totalOrders.change.value,
            type: analytics?.totalOrders.change.type,
            iconColor: "text-purple-600",
            iconBackground: "bg-purple-600/10",
            link: "/dashboard/orders",
        },
        {
            id: ObjectID().toHexString(),
            title: "Conversion Rate",
            icon: AnalyticsIcon,
            current: `${analytics?.conversionRate.percentage}%`,
            value: analytics?.conversionRate.change.value,
            type: analytics?.conversionRate.change.type,
            iconColor: "text-green-600",
            iconBackground: "bg-green-600/10",
            link: "/dashboard/analytics-insights",
        },
        {
            id: ObjectID().toHexString(),
            title: "Customers",
            icon: CustomersIcon,
            current: formatMetricValue(analytics?.newCustomers.count),
            value: analytics?.newCustomers.change.value,
            type: analytics?.newCustomers.change.type,
            iconColor: "text-orange-600",
            iconBackground: "bg-orange-600/10",
            link: "/dashboard/customers",
        },
    ];
}

export default function HomeAnalyticsSection() {
    const [homeAnalyticsCardData, setHomeAnalyticsCardData] = useState<AnalyticsCardData[]>([]);
    const [isBalanceHidden, setIsBalanceHidden] = useState<boolean>(false);

    // Get seller ID and initialize visibility state from localStorage
    useEffect(() => {
        const seller = sellerUtils.getSeller();
        if (seller?._id) {
            const storageKey = `balanceVisibility_${seller._id}`;
            const storedValue = localStorage.getItem(storageKey);
            // Default to false (show values) if not in localStorage
            setIsBalanceHidden(storedValue === "true");
        }
    }, []);

    const { data, isPending: isLoading } = useQuery({
        queryKey: ["sellerAnalytics"],
        queryFn: () => sellerService.fetchSellerAnalytics(),
        refetchOnMount: true,
        refetchOnReconnect: true,
        refetchOnWindowFocus: true,
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 10, // 10 minutes
        retry: 5,
        retryDelay: 7000,
    });

    useEffect(() => {
        if (data) {
            const preparedData = prepareAnalyticsData(data);
            setHomeAnalyticsCardData(preparedData);
        }
    }, [data]);

    // Toggle balance visibility and save to localStorage
    const toggleBalanceVisibility = () => {
        const seller = sellerUtils.getSeller();
        if (seller?._id) {
            const newVisibility = !isBalanceHidden;
            setIsBalanceHidden(newVisibility);
            const storageKey = `balanceVisibility_${seller._id}`;
            localStorage.setItem(storageKey, String(newVisibility));
        }
    };

    // Helper function to mask values with asterisks
    const maskValue = (value: string): string => {
        return value.replace(/./g, "*");
    };

    if (isLoading) {
        return (
            <div className="w-full">
                {/* Mobile scrollable skeleton */}
                <div className="sm:hidden w-full flex flex-col gap-4">
                    {/* Payable Balance skeleton */}
                    <div className="w-full bg-[#505780] px-[24px] py-[18px] rounded-[16px] h-[83px]">
                        <div className="flex items-center justify-between mb-2">
                            <Skeleton className="h-4 w-32 bg-white/20" />
                            <Skeleton className="h-3 w-20 bg-white/20" />
                        </div>
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-7 w-24 bg-white/20" />
                            <div className="flex items-center justify-center gap-4">
                                <Skeleton className="w-4 h-4 rounded bg-white/20" />
                                <Skeleton className="h-5 w-16 bg-white/20 rounded-md" />
                            </div>
                        </div>
                    </div>
                    {/* Other cards skeleton */}
                    <ul className="w-full grid grid-cols-2 gap-4">
                        {[...Array(4)].map((_, index) => (
                            <li key={index} className="w-full">
                                <div className="self-stretch p-6 bg-white rounded-2xl shadow-[0px_3px_8px_-1px_rgba(50,50,71,0.05)] outline outline-1 outline-offset-[-1px] outline-slate-100 flex flex-col justify-start items-start gap-2.5">
                                    <div className="self-stretch flex flex-col justify-start items-start gap-2">
                                        <Skeleton className="w-11 h-11 rounded-full" />
                                        <div className="self-stretch flex flex-col justify-start items-start gap-2.5">
                                            <Skeleton className="h-4 w-24" />
                                            <Skeleton className="h-7 w-16" />
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Desktop flex skeleton */}
                <div className="hidden sm:flex sm:flex-wrap gap-x-4 xl:gap-x-6 gap-y-2 md:gap-y-4 xl:gap-y-8 w-full">
                    {[...Array(5)].map((_, index) => (
                        <div
                            key={index}
                            className="flex-1 min-w-0 sm:min-w-[calc(50%-0.5rem)] lg:min-w-[calc(33.333%-1rem)] p-6 bg-white rounded-2xl shadow-[0px_3px_8px_-1px_rgba(50,50,71,0.05)]  outline outline-1 outline-offset-[-1px] outline-slate-100 flex flex-col justify-start items-start gap-2.5"
                        >
                            <div className="self-stretch flex flex-col justify-start items-start gap-4">
                                <div className="self-stretch flex flex-col justify-start items-start gap-2.5">
                                    <div className="self-stretch inline-flex justify-start items-center gap-2">
                                        <div className="flex-1 inline-flex flex-col justify-start items-start gap-1">
                                            <Skeleton className="h-4 w-24 mb-2" />
                                            <Skeleton className="h-7 w-32" />
                                        </div>
                                        <Skeleton className="w-11 h-11 rounded-full" />
                                    </div>
                                    <div className="self-stretch inline-flex justify-start items-center gap-2.5">
                                        <Skeleton className="h-5 w-16" />
                                        <Skeleton className="h-4 w-20" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <section className="w-full">
            {/* Mobile scrollable cards */}
            <div className="sm:hidden w-full flex flex-col gap-4">
                <ul>
                    {
                        homeAnalyticsCardData.filter((card) => card?.title === "Payable Balance").map((card) => (
                            <div key={card.id} className="w-full bg-[#505780] px-[24px] py-[18px] rounded-[16px] h-[83px] ">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-white text-sm font-semibold font-lexend ">Payable Balance</h3>
                                    <p className="text-white text-xs font-medium font-lexend ">vs last week</p>
                                </div>
                                <div className="flex items-center justify-between">
                                    <h2 className="text-white text-xl font-extrabold font-lexend leading-7">
                                        <span>₦</span>
                                        <span>{isBalanceHidden ? maskValue(card.current) : card.current}</span>
                                    </h2>
                                    <div className="flex items-center justify-center gap-4 ">
                                        <button
                                            onClick={toggleBalanceVisibility}
                                            className="cursor-pointer focus:outline-none"
                                            aria-label={isBalanceHidden ? "Show balance" : "Hide balance"}
                                        >
                                            {isBalanceHidden ? (
                                                <EyeCloseIcon width={16} height={16} color="#fff" />
                                            ) : (
                                                <EyeOpenIcon width={16} height={16} color="#fff" />
                                            )}
                                        </button>
                                        <div className="text-white text-xs font-medium font-lexend bg-[#A6B7D4] px-2 py-1 rounded-md">
                                            {isBalanceHidden 
                                                ? maskValue(formatChangeFromLastWeek(card.value, card.type) || "")
                                                : formatChangeFromLastWeek(card.value, card.type)
                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    }
                </ul>
                <ul className="w-full grid grid-cols-2 gap-4 min-w-max">
                    {homeAnalyticsCardData.filter((card) => card?.title !== "Payable Balance").map((card) => (
                        <li key={card.id} className="w-full">
                            <AnalyticsCard {...card} />
                        </li>
                    ))}
                </ul>
            </div>

            {/* Desktop flex layout */}
            <ul className="hidden sm:flex sm:flex-wrap gap-x-4 xl:gap-x-6 gap-y-2 md:gap-y-4 xl:gap-y-6 w-full">
                {homeAnalyticsCardData.map((card) => (
                    <li key={card.id} className="flex-1 min-w-0 sm:min-w-[calc(50%-0.5rem)] lg:min-w-[calc(33.333%-1rem)]">
                        <AnalyticsCard {...card} />
                    </li>
                ))}
            </ul>
        </section>
    );
}
