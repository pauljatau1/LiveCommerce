import { Icon } from '@iconify/react';
import { Skeleton } from '@/Components/shared/Skeleton';
import { useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { sellerService } from '@/services/sellerService';
import { useNotification } from '@/Hooks/useNotification';
import React, { useRef, useEffect } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getNotificationIcon, getNotificationDisplayData, extractAxiosErrorMessage } from '@/util/helpers';
import GlassImage from '@/Components/ui/GlassImageV2';
import EmptyActivityIcon from '@/assets/icons/EmptyActivityIcon';

export default function ActivityFeed() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { showNotification } = useNotification();
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const {
        data,
        isLoading,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteQuery({
        queryKey: ['sellerPaginatedNotifications'],
        initialPageParam: 1,
        queryFn: ({ pageParam = 1 }) =>
            sellerService.fetchSellerNotificationsPaginated({
                page: pageParam as number,
                limit: 10
            }),
        getNextPageParam: (lastPage) => {
            if (lastPage?.pagination?.hasMore) {
                return (lastPage.pagination.currentPage || 1) + 1;
            }
            return undefined;
        },
        refetchOnMount: true,
        refetchOnReconnect: true,
        refetchOnWindowFocus: true,
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 10, // 10 minutes
        retry: (failureCount, error) => {
            if (isAxiosError(error) && error.response?.status === 401) {
                return false;
            }
            return failureCount < 3;
        },
    });

    // Flatten all notifications from all pages
    const notifications = data?.pages.flatMap(page => page.notifications || []) || [];

    const markNotificationAsReadMutation = useMutation({
        mutationFn: (notificationId: string) =>
            sellerService.markNotificationAsRead(notificationId),
        onError: (error) => {
            console.error("Error marking notification as read:", error);
            showNotification(
                `Failed to mark notification as read ${extractAxiosErrorMessage(error) || "Something went wrong. Please try again later."}`,
                "error"
            );
        },
    });

    const handleNotificationClick = (notification: any) => {
        // Mark notification as read if it isn't already
        if (!notification.isRead) {
            markNotificationAsReadMutation.mutate(notification._id);
        }

        // Route based on notification type
        switch (notification.type) {
            case "low_stock":
            case "back_in_stock":
                navigate(`/dashboard/products`);
                break;

            case "new_follower":
                // Redirect to account page with parameter to open followers dialog
                navigate("/dashboard/account?openFollowers=true");
                break;

            case "new_order":
            case "order_paid":
            case "order_delivered":
            case "order_cancelled":
            case "order_status_update":
            case "order_shipped":
            case "order_reminder":
            case "order_picked_up":
            case "order_in_transit":
                // Navigate to the specific order if orderId is available in the notification data
                if (notification.data && notification.data.orderId) {
                    navigate(`/dashboard/order/${notification.data.orderId}`);
                } else {
                    navigate("/dashboard/orders");
                }
                break;

            case "return_request":
            case "return_created":
            case "return_approved":
            case "return_rejected":
            case "return_info_needed":
            case "return_partial_refund":
            case "return_label_created":
            case "return_pickup_arranged":
                navigate("/dashboard/returns");
                break;

            case "new_campaign":
            case "campaign_scheduled":
                navigate("/dashboard/marketing/inbox-campaigns/list");
                break;

            case "blip_like":
            case "blip_comment":
                // Just navigate to the blips page without opening any specific details
                navigate("/dashboard/blips");
                break;

            case "buyer_message": {
                const conversationId = notification.data?.conversationId;

                if (conversationId) {
                    navigate("/dashboard/messages", {
                        state: {
                            openConversationById: true,
                            conversationId,
                        },
                    });
                } else {
                    navigate("/dashboard/messages");
                }

                // Invalidate conversations so unread counts are updated
                queryClient.invalidateQueries({ queryKey: ["sellerConversations"] });

                break;
            }

            default:
                // Default to dashboard if no specific route
                navigate("/dashboard/home");
        }
    };

    // Handle scroll to load more when reaching bottom
    useEffect(() => {
        const scrollContainer = scrollContainerRef.current;
        if (!scrollContainer) return;

        const handleScroll = () => {
            if (!hasNextPage || isFetchingNextPage) return;

            const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
            // Trigger fetch when user is within 50px of the bottom
            const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
            if (distanceFromBottom < 50) {
                fetchNextPage();
            }
        };

        scrollContainer.addEventListener('scroll', handleScroll);
        return () => {
            scrollContainer.removeEventListener('scroll', handleScroll);
        };
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    if (isLoading && notifications.length === 0) {
        return (
            <div className="w-full p-6 bg-white rounded-2xl shadow-[0px_3px_8px_-1px_rgba(50,50,71,0.05)]hover:shadow-[0px_0px_1px_0px_rgba(12,26,75,0.24)] flex flex-col gap-6">
                <div className="flex flex-col gap-3">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-5 w-64" />
                </div>
                <div className="flex flex-col gap-1">
                    {[...Array(4)].map((_, index) => (
                        <React.Fragment key={index}>
                            <div className="py-2 flex items-center gap-2">
                                <Skeleton className="w-11 h-11 rounded-full" />
                                <div className="flex-1 flex flex-col gap-2">
                                    <Skeleton className="h-4 w-48" />
                                    <Skeleton className="h-3 w-32" />
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <Skeleton className="h-4 w-20" />
                                    <Skeleton className="h-3 w-16" />
                                </div>
                            </div>
                            {index < 3 && <div className="h-px bg-slate-100" />}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        );
    }

    if (notifications.length === 0) {
        return (
            <div className="w-full p-6 bg-white rounded-2xl shadow-[0px_3px_8px_-1px_rgba(50,50,71,0.05)] hover:shadow-[0px_0px_1px_0px_rgba(12,26,75,0.24)] flex flex-col gap-6">
                <div className="flex flex-col gap-3">
                    <h2 className="text-zinc-800 lg:text-2xl text-xl font-semibold font-['Lexend'] leading-8">Activity Feed</h2>
                    <p className="text-[#7A828A] lg:text-base text-sm font-normal font-['Lexend']">Your recent activities and events</p>
                </div>
                <div className="flex flex-col items-center justify-center">
                    <EmptyActivityIcon width={100} height={100} />
                    <div className="text-center py-2 text-[#425466] font-lexend font-medium text-base lg:text-xl leading-6">
                        <p>No activities yet</p>
                    </div>
                    <div className="text-[#7A828A] text-sm font-normal font-['Lexend']">
                        <p>Your activities appears here</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="group w-full p-4 sm:p-6 border border-solid border-[#EDF2F7] bg-white rounded-2xl shadow-[0px_3px_8px_-1px_rgba(50,50,71,0.05)] hover:shadow-[0px_4px_12px_-1px_rgba(50,50,71,0.08)] transition-shadow flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col">
                <h2 className="text-[#27272E] text-lg md:text-xl lg:text-2xl font-semibold font-['Lexend'] leading-8">Activity Feed</h2>
                <p className="text-[#7A828A] text-xs lg:text-sm 5xl:text-base font-normal font-['Lexend']">Your recent activities and events</p>
            </div>

            {/* Notifications List - Scrollable Container */}
            <div
                ref={scrollContainerRef}
                className="flex flex-col gap-1 max-h-[319px] lg:max-h-[385px] overflow-y-auto pr-2 activity-feed-scrollbar"
            >
                {notifications.map((notification, index) => {
                    const displayData = getNotificationDisplayData(notification);
                    const iconName = getNotificationIcon(notification.type);
                    const isLast = index === notifications.length - 1 && !hasNextPage;

                    return (
                        <React.Fragment key={notification._id}>
                            <div
                                onClick={() => handleNotificationClick(notification)}
                                className={`py-2 ${displayData.showProfilePicture ? 'h-16' : 'space-y-1'}`}
                            >
                                <div className='flex items-start gap-2 hover:bg-gray-100/80 cursor-pointer hover:backdrop-blur-sm rounded-lg p-2 transition-all duration-300 ease-in-out' >


                                    {/* Icon or Profile Picture */}
                                    <div className="w-12 h-12 flex-shrink-0 flex justify-end items-start">
                                        {displayData.showProfilePicture ? (
                                            <div className="w-12 h-12 relative">
                                                <div className="w-12 h-12 rounded-full border border-gray-200 overflow-hidden">
                                                    {displayData.profilePictureUrl ? (
                                                        <GlassImage
                                                            src={displayData.profilePictureUrl}
                                                            alt={displayData.rightText || 'User'}
                                                            containerClassName="w-12 h-12 rounded-full"
                                                            glassClassName="w-12 h-12 rounded-full"
                                                            imageClassName="w-12 h-12 rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                                                            <Icon icon="mdi:account" className="w-6 h-6 text-gray-400" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="w-11 h-11 relative bg-green-600/10 rounded-[100px] flex items-center justify-center">
                                                {iconName && (
                                                    <Icon
                                                        icon={iconName}
                                                        className="w-4 h-4 text-green-600"
                                                    />
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 flex flex-col gap-2 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <h3 className="flex-1 max-w-[250px] text-zinc-800 text-xs lg:text-sm font-semibold font-['Lexend_Deca'] leading-4 line-clamp-2">
                                                {displayData.mainText}
                                            </h3>
                                            {displayData.rightText && (
                                                <div className="w-20 flex-shrink-0 text-right">
                                                    <p className="text-zinc-800 text-xs  font-semibold font-['Lexend'] leading-4 truncate">
                                                        {displayData.rightText}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="flex-1 capitalize text-zinc-500 text-xs font-normal font-['Lexend'] leading-4 line-clamp-2">
                                                {displayData.subText}
                                            </p>
                                            {displayData.rightSubText && (
                                                <div className="w-20 flex-shrink-0 text-right">
                                                    <p className="text-zinc-500 text-xs font-semibold font-['Lexend'] leading-4">
                                                        {displayData.rightSubText}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {<div className="w-full h-px bg-[#EDF2F7] " />}
                            </div>
                        </React.Fragment>
                    );
                })}

                {/* Loading indicator when fetching next page */}
                {isFetchingNextPage && (
                    <div className="flex justify-center items-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                    </div>
                )}
            </div>
        </div>
    );
}
