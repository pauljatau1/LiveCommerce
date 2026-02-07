import { Icon } from "@iconify/react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getInitials } from "@/util/helpers"
import { HeaderV2Props } from '@/types';
import { useNavigate, useLocation } from "react-router-dom"
import { sellerService } from "@/services/sellerService"
import { headerService } from "@/services/headerService"
import { useAuthContext } from "@/Hooks/useAuthContextV2"
import { useEffect, useState } from "react"
import HeaderNotificationsModal from "@/Components/ui/Header/HeaderNotificationsModal";
import GoLiveIcon from "@/assets/icons/GoLiveIcon"
import MenuOpenIcon from "@/assets/icons/MenuOpenIcon"
import MessageIcon from "@/assets/icons/MessageIcon"
import AlertIcon from "@/assets/icons/AlertIcon"
import { Skeleton } from "@/Components/shared/Skeleton"
import NavRightIcon from "@/assets/icons/NavRightIcon";
import { isAxiosError } from "axios";
import { useNotification } from "@/Hooks/useNotification";
import NotificationBanner from "@/Components/ui/NotificationBanner";
import GlassImage from "@/Components/ui/GlassImageV2";

export default function HeaderV2({ name, navName, showBackButton, fullScreenMode, isSidebarOpen, setIsSidebarOpen }: HeaderV2Props) {
    const { seller } = useAuthContext()
    const [unreadMessages, setUnreadMessages] = useState(0)
    const [unreadNotifications, setUnreadNotifications] = useState(0)
    const navigate = useNavigate()
    const [notificationDialogOpen, setNotificationDialogOpen] = useState(false)
    const location = useLocation();
    const queryClient = useQueryClient();
    const { notification, hideNotification } = useNotification();

    // Fetch notifications and conversations
    const { data: notifications, isLoading: isLoadingNotifications } = useQuery({
        queryKey: ["sellerNotifications"],
        queryFn: () => sellerService.fetchSellerNotifications(),
        refetchOnMount: true,
        refetchOnReconnect: true,
        refetchOnWindowFocus: true,
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 10, // 10 minutes
        retry: (failureCount, error) => {
            // Don't retry on 401 errors
            if (isAxiosError(error) && error.response?.status === 401) {
                return false;
            }
            return failureCount < 3;
        },
    });

    const { data: conversations, isLoading: isLoadingConversations } = useQuery({
        queryKey: ["sellerConversations"],
        queryFn: () => sellerService.fetchSellerConversations(),
        refetchOnMount: true,
        refetchOnReconnect: true,
        refetchOnWindowFocus: true,
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 10, // 10 minutes
        retry: (failureCount, error) => {
            // Don't retry on 401 errors
            if (isAxiosError(error) && error.response?.status === 401) {
                return false;
            }
            return failureCount < 3;
        },
    });

    // Calculate unread messages
    const calculateUnreadMessages = () => {
        try {
            const totalUnread = conversations?.reduce((total, conv) =>
                total + (conv.unreadCount || 0), 0) || 0
            setUnreadMessages(totalUnread)
        } catch (error) {
            console.error('Error calculating unread messages:', error)
        }
    }

    // Calculate new notifications (today's unread)
    const calculateNewNotifications = () => {
        if (!notifications || notifications.length === 0) {
            setUnreadNotifications(0)
            return
        }

        const today = new Date().setHours(0, 0, 0, 0)
        const newNotificationsCount = notifications.filter(notification =>
            !notification.isRead &&
            new Date(notification.createdAt).setHours(0, 0, 0, 0) === today
        ).length

        setUnreadNotifications(newNotificationsCount)
    }

    useEffect(() => {
        calculateUnreadMessages()
    }, [conversations])

    useEffect(() => {
        calculateNewNotifications()
    }, [notifications])

    // Mutation to mark all notifications as read
    const markAllNotificationsReadMutation = useMutation({
        mutationFn: () => headerService.markAllNotificationsRead(),
        onSuccess: () => {
            // Invalidate and refetch notifications to update the UI
            queryClient.invalidateQueries({ queryKey: ["sellerNotifications"] });
            // Update local state immediately
            setUnreadNotifications(0);
        },
        onError: (error) => {
            console.error('Error marking all notifications as read:', error);
        },
    });

    // Handle notification button click - marks all as read and opens dialog
    const handleNotificationButtonClick = () => {
        // Mark all notifications as read
        markAllNotificationsReadMutation.mutate();
        // Open the notification dialog
        setNotificationDialogOpen(true);
    };

    const renderAvatar = () => {
        if (seller?.storeAvatar?.url) {
            return (
                <GlassImage
                    src={seller.storeAvatar.url}
                    alt={`${seller.firstName} ${seller.lastName}`}
                    containerClassName="h-[46px] w-[46px] rounded-full object-cover"
                    glassClassName="h-[46px] w-[46px] rounded-full object-cover"
                    imageClassName="h-[46px] w-[46px] rounded-full object-cover"
                />
            )
        }

        return (
            <div className="h-[46px] w-[46px] rounded-full font-lexend font-bold bg-[#00000033] flex items-center justify-center text-[#7A828A] text-sm text-[18px] ">
                {getInitials(seller?.firstName, seller?.lastName)}
            </div>
        )
    }


    return (
        <header className={`${fullScreenMode ? 'hidden' : 'absolute top-0 left-0 right-0 z-40 '}`} >
            <div className="">
                <div className="flex items-center justify-between h-16 bg-white border-b border-[#EDF2F7] pt-[50px] pb-[36px] lg:pt-[50px] lg:pb-[50px] px-5 xl:px-8">
                    {/**Welcome Message and Back Button ui*/}
                    <div className="flex items-center">
                        {!isSidebarOpen && (
                            <button
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                className="rounded-md lg:mr-5 text-gray-400 xl:hidden transition-all duration-300 ease-in-out"
                            >
                                <MenuOpenIcon className="h-[24px] w-[24px]" color="#8492A6" />
                            </button>
                        )}
                        {
                            location?.pathname === "/dashboard/home" ? (
                                <div className="hidden lg:flex flex-col ">
                                    <div className="flex gap-2 items-center">
                                        {showBackButton && (
                                            <button onClick={() => navigate(-1)} className="p-2 rounded-full xl:block hidden text-[#272D30] hover:text-[#272D30]/80 transition-all duration-300 ease-in-out hover:bg-[#272D30]/10">
                                                <Icon icon="ep:back" className="h-6 w-6" />
                                            </button>
                                        )}
                                        <h1 className="ml-2 lg:ml-0 text-base md:text-xl xl:text-3xl font-lexend font-semibold text-[#111111] truncate max-w-[150px] md:max-w-full">{name}</h1>
                                    </div>
                                    {navName !== "" && (
                                        <div className="flex items-center gap-10">
                                            <h1 className="ml-2 lg:ml-0 capitalize text-base font-lexend font-normal text-[#98A2B3] truncate max-w-[100px] md:max-w-full">{navName}</h1>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="hidden lg:flex flex-col lg:flex-row lg:gap-1 lg:items-center">
                                    <div className="flex gap-1 items-center">
                                        {/*{showBackButton && (
                                            <button onClick={() => navigate(-1)} className="p-2 rounded-full xl:block hidden text-[#888787] hover:text-[#272D30]/80 transition-all duration-300 ease-in-out hover:bg-[#272D30]/10">
                                                <Icon icon="ep:back" className="h-6 w-6" />
                                            </button>
                                        )}*/}
                                        <h1 className="ml-2 lg:ml-0 text-base md:text-xl xl:text-3xl font-lexend font-semibold text-[#888787] truncate max-w-[150px] md:max-w-full">{name}</h1>
                                    </div>
                                    {navName !== "" && (
                                        <div className="flex items-center gap-1">
                                            <NavRightIcon className="h-[24px] w-[24px] " color="#888888" />
                                            <h1 className="ml-2 lg:ml-0 capitalize text-base md:text-xl xl:text-3xl font-inter font-semibold text-[#16783A] truncate max-w-[100px] md:max-w-full">{navName}</h1>
                                        </div>
                                    )}
                                </div>
                            )
                        }
                    </div>

                    {/**Mobile header items*/}
                    <nav className="flex items-center gap-1 md:hidden" >
                        <button
                            onClick={() => navigate('/dashboard/live-streams/live-stream')}
                            className="flex items-center justify-center rounded-full bg-[#FF3B3033] w-[46px] h-[46px] text-white hover:bg-[#FF3B3033]/30 transition-all duration-300 ease-in-out"
                        >
                            <GoLiveIcon className="h-[32px] w-[32px] animate-pulse" color="#FF3B30" />
                        </button>
                        {isLoadingConversations ? (
                            <Skeleton className="h-[46px] w-[46px] rounded-full" />
                        ) : (
                            <button
                                onClick={() => navigate('/dashboard/messages')}
                                className="relative flex items-center justify-center h-[46px] w-[46px] rounded-full text-[#757575] bg-[#F6F6F6] hover:bg-gray-200 transition-all duration-300 ease-in-out"
                            >
                                <MessageIcon className="h-[20px] w-[20px]" color="#757575" />
                                {unreadMessages > 0 && (
                                    <span className="absolute -top-[20px] -right-0 bg-[#0BB2481A] text-[#0BB248] text-xs font-lexend font-bold px-[10px] py-[2px] min-w-[35px] h-[19px] flex items-center justify-center rounded-full">
                                        {unreadMessages > 99 ? '99+' : unreadMessages}
                                    </span>
                                )}
                            </button>
                        )}
                        {isLoadingNotifications ? (
                            <Skeleton className="h-[46px] w-[46px] rounded-full" />
                        ) : (
                            <>
                                <button
                                    onClick={handleNotificationButtonClick}
                                    className="relative flex items-center justify-center h-[46px] w-[46px] rounded-full text-[#757575] bg-[#F6F6F6] hover:bg-gray-200 transition-all duration-300 ease-in-out"
                                >
                                    <AlertIcon className="h-[20px] w-[20px]" color="#757575" />
                                    {unreadNotifications > 0 && (
                                        <span className="absolute -top-[20px] -right-0 bg-[#FF00001A] text-[#FF0000] text-xs font-lexend font-bold px-[10px] py-[2px] min-w-[35px] h-[19px] flex items-center justify-center rounded-full">
                                            {unreadNotifications > 99 ? '99+' : unreadNotifications}
                                        </span>
                                    )}
                                </button>
                                <HeaderNotificationsModal
                                    open={notificationDialogOpen}
                                    onOpenChange={setNotificationDialogOpen}
                                />
                            </>
                        )}

                        <div
                            onClick={() => navigate('/dashboard/account')}
                            className="ml-1 cursor-pointer hover:opacity-80 transition-all duration-300"
                        >
                            {renderAvatar()}
                        </div>
                    </nav>

                    {/**Desktop header Items*/}
                    <nav className="hidden md:flex md:items-center md:gap-2">
                        <div
                            onClick={() => navigate('/dashboard/live-streams/live-stream')}
                            className="items-center hidden lg:flex h-[40px] w-[128px] py-[4px] px-[8px] gap-2 mr-2 rounded-[8px] bg-[#FF3B30] cursor-pointer hover:bg-[#FF3B30]/80 transition-all duration-300 ease-in-out"
                        >
                            <GoLiveIcon className="h-[32px] w-[32px] animate-pulse" color="#ffffff" />
                            <span className="inline-flex items-center font-lexend border border-transparent text-sm font-medium text-[#ffffff]">
                                Go Live
                            </span>
                        </div>
                        {isLoadingConversations ? (
                            <button
                                onClick={() => navigate('/dashboard/messages')}
                                className="relative bg-[#F6F6F6] h-[46px] w-[46px] rounded-full flex items-center justify-center p-2 text-[#757575] hover:text-gray-700 hover:bg-gray-200 transition-all duration-300 ease-in-out"
                            >
                                <Icon icon="icon-park-outline:message" className="h-6 w-6" />
                                <Skeleton className="absolute -top-[20px] -right-0 bg-[#0BB2481A] text-[#0BB248] text-xs font-lexend font-bold px-[10px] py-[2px] min-w-[35px] h-[19px] flex items-center justify-center rounded-full" />
                            </button>

                        ) : (
                            <button
                                onClick={() => navigate('/dashboard/messages')}
                                className="relative bg-[#F6F6F6] h-[46px] w-[46px] rounded-full flex items-center justify-center p-2 text-[#757575] hover:text-gray-700 hover:bg-gray-200 transition-all duration-300 ease-in-out"
                            >
                                <Icon icon="icon-park-outline:message" className="h-6 w-6" />
                                    <span className="absolute -top-[20px] -right-0 bg-[#0BB2481A] text-[#0BB248] text-xs font-lexend font-bold px-[10px] py-[2px] min-w-[35px] h-[19px] flex items-center justify-center rounded-full">
                                        {unreadMessages > 99 ? '99+' : unreadMessages}
                                    </span>
                            </button>
                        )}
                        {isLoadingNotifications ? (
                            <button className="relative bg-[#F6F6F6] h-[46px] w-[46px] rounded-full flex items-center justify-center p-2 mr-3 text-[#757575] hover:text-gray-700 hover:bg-gray-200 transition-all duration-300 ease-in-out">
                                <AlertIcon className="h-[24px] w-[24px]" color="#757575" />
                                <Skeleton className="absolute -top-[20px] -right-0 bg-[#FF00001A] text-[#FF0000] text-xs font-lexend font-bold px-[10px] py-[2px] min-w-[35px] h-[19px] flex items-center justify-center rounded-full" />
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={handleNotificationButtonClick}
                                    className="relative bg-[#F6F6F6] h-[46px] w-[46px] rounded-full flex items-center justify-center p-2 mr-3 text-[#757575] hover:text-gray-700 hover:bg-gray-200 transition-all duration-300 ease-in-out"
                                >
                                    <AlertIcon className="h-[24px] w-[24px]" color="#757575" />
                                    <span className="absolute -top-[20px] -right-0 bg-[#FF00001A] text-[#FF0000] text-xs font-lexend font-bold px-[10px] py-[2px] min-w-[35px] h-[19px] flex items-center justify-center rounded-full">
                                        {unreadNotifications > 99 ? '99+' : unreadNotifications}
                                    </span>
                                </button>
                                <HeaderNotificationsModal
                                    open={notificationDialogOpen}
                                    onOpenChange={setNotificationDialogOpen}
                                />
                            </>
                        )}
                        <div
                            onClick={() => navigate('/dashboard/account')}
                            className="flex items-center cursor-pointer hover:opacity-80 transition-all duration-300 hover:bg-[#F6F6F6] p-3 hover:rounded-full "
                        >
                            <div className="flex-shrink-0">
                                {renderAvatar()}
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-lexend font-semibold font-inter capitalize text-[#27272E]">
                                    {seller?.firstName} {seller?.lastName}
                                </p>
                                {seller?.storeName && (
                                    <p className="text-xs font-lexend text-[#7A828A] ">
                                        {seller?.storeName || seller?.businessName}
                                    </p>
                                )}
                            </div>
                        </div>
                    </nav>
                </div>
                {
                    location?.pathname !== "/dashboard/home" && (
                        <div className="px-5 lg:hidden flex items-center gap-[4px] " >
                            <h3 className="font-lexend font-normal text-sm text-[#888888] " >{name}</h3>
                            {
                                navName !== "" && (
                                    <>
                                        <NavRightIcon className="h-4 w-4" color="#888888" />
                                        <h3 className="font-lexend font-bold text-sm text-[#0BB248] " >{navName}</h3>
                                    </>
                                )
                            }
                        </div>
                    )
                }
            </div>
            
            {/* Notification Banner - Renders at this location for all pages */}
            {notification.isVisible && notification.type && (
                <div className="px-5 xl:px-8 pb-3 pt-0 lg:pt-2 ">
                    <NotificationBanner
                        message={notification.message}
                        type={notification.type}
                        visibility={notification.visibility}
                        onClose={hideNotification}
                    />
                </div>
            )}
        </header>
    )
}
