import { useQuery } from "@tanstack/react-query";
import { sellerService } from "@/services/sellerService";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/Components/ui/dialog";
import { Skeleton } from "@/Components/shared/Skeleton";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/Hooks/useAuthContextV2";
import { BASE_URL } from "@/Constants/Server";
import { getInitials, formatTimestamp } from "@/util/helpers";

interface HeaderNotificationsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const HeaderNotificationsModal = ({ open, onOpenChange }: HeaderNotificationsModalProps) => {
    const navigate = useNavigate();
    const { token } = useAuthContext();

    const { data: notifications, isLoading } = useQuery({
        queryKey: ["sellerNotifications"],
        queryFn: () => sellerService.fetchSellerNotifications(),
        enabled: open, // Only fetch when modal is open
    });



    const markNotificationAsRead = async (notificationId: string) => {
        try {
            const sellerToken = token?.data;
            if (!sellerToken) return;

            await fetch(`${BASE_URL}/notifications/${notificationId}/mark-read`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${sellerToken}`,
                    'accept': '*/*'
                }
            });
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const handleNotificationClick = async (notification: any) => {
        if (!notification.isRead) {
            await markNotificationAsRead(notification._id);
        }

        onOpenChange(false);

        // Navigate based on notification type
        if (notification.type === 'buyer_message' && notification.data?.buyerId) {
            navigate('/dashboard/messages', {
                state: {
                    openChatWithCustomer: true,
                    customerId: notification.data.buyerId,
                    customerName: notification.data.buyerName || 'Buyer'
                }
            });
        } else {
            // Handle other notification types similar to NotificationsDialog
            switch (notification.type) {
                case 'new_order':
                case 'order_paid':
                case 'order_delivered':
                case 'order_cancelled':
                case 'order_status_update':
                case 'order_shipped':
                    if (notification.data?.orderId) {
                        navigate(`/dashboard/order/${notification.data.orderId}`);
                    } else {
                        navigate('/dashboard/orders');
                    }
                    break;
                case 'blip_like':
                case 'blip_comment':
                    navigate('/dashboard/blips');
                    break;
                default:
                    navigate('/dashboard/home');
            }
        }
    };

    const handleCloseAll = () => {
        onOpenChange(false);
    };

    const handleViewAll = () => {
        onOpenChange(false);
        navigate('/dashboard/notifications');
    };

    const renderAvatar = (notification: any) => {
        // For buyer_message notifications, try to get avatar from data
        if (notification.type === 'buyer_message' && notification.data?.buyerAvatar) {
            return (
                <img
                    src={notification.data.buyerAvatar}
                    alt={notification.data.buyerName || 'Buyer'}
                    className="w-10 h-10 rounded-full object-cover"
                />
            );
        }

        // Fallback to initials
        const name = notification.data?.buyerName || notification.title || 'U';
        const initials = getInitials(name, '');
        const colors = [
            'bg-orange-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500',
            'bg-pink-500', 'bg-yellow-500', 'bg-indigo-500', 'bg-red-500'
        ];
        const colorIndex = name.charCodeAt(0) % colors.length;

        return (
            <div className={`w-10 h-10 rounded-full ${colors[colorIndex]} flex items-center justify-center text-white font-semibold text-sm`}>
                {initials || name[0]?.toUpperCase() || 'U'}
            </div>
        );
    };

    const getMessagePreview = (notification: any): string => {
        if (notification.type === 'buyer_message' && notification.data?.message) {
            return notification.data.message;
        }
        return notification.message || '';
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {/* @ts-ignore - Dialog components from .jsx file work correctly at runtime */}
            <DialogContent showCloseButton={false} className="sm:max-w-[500px] p-0 bg-white rounded-lg border border-gray-200">
                {/* @ts-ignore - Dialog components from .jsx file work correctly at runtime */}
                <DialogHeader className="px-6 pt-6 pb-4">
                    <div className="flex items-center justify-between">
                        {/* @ts-ignore - Dialog components from .jsx file work correctly at runtime */}
                        <DialogTitle className="text-lg font-semibold text-[#718096] font-lexend">
                            Notifications
                        </DialogTitle>
                        {notifications && notifications.length > 0 && (
                            <button
                                onClick={handleCloseAll}
                                className="text-sm font-medium text-[#0BB248] hover:text-[#0BB248]/80 transition-colors font-lexend"
                            >
                                close
                            </button>
                        )}
                    </div>
                </DialogHeader>

                <div className="max-h-[60vh] overflow-y-auto">
                    {isLoading ? (
                        <div className="px-6 py-4 space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-3/4" />
                                        <Skeleton className="h-3 w-full" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : !notifications || notifications.length === 0 ? (
                        <div className="px-6 py-12 flex flex-col items-center justify-center">
                            <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                                <span className="text-5xl">👋</span>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-2 font-lexend">
                                You have no notifications!
                            </h3>
                            <p className="text-sm text-gray-500 text-center font-lexend">
                                If you will get any notifications we will tell you about it.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200">
                            {notifications.map((notification: any) => (
                                <div
                                    key={notification._id}
                                    onClick={() => handleNotificationClick(notification)}
                                    className={`px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors ${!notification.isRead ? 'bg-gray-50' : ''
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        {renderAvatar(notification)}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2 mb-1">
                                                <h4 className="text-sm font-semibold text-gray-800 font-lexend">
                                                    {notification.title}
                                                </h4>
                                            </div>
                                            <p className="text-sm text-gray-600 font-lexend line-clamp-2">
                                                {getMessagePreview(notification)}
                                            </p>
                                            <span className="text-xs text-[#0BB248] whitespace-nowrap font-lexend">
                                                {formatTimestamp(notification.createdAt)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {notifications && notifications.length && !isLoading && (
                    <div className="px-6 py-4 border-t border-gray-200 flex justify-center">
                        <button
                            onClick={handleViewAll}
                            className="text-sm font-medium text-[#0BB248] hover:text-[#0BB248]/80 transition-colors font-lexend"
                        >
                            View all
                        </button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};


export default HeaderNotificationsModal;
