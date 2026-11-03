import { Icon } from "@iconify/react";
import { BASE_URL } from "@/Constants/Server";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { sellerService } from "@/services/sellerService";
import { Dialog, DialogTrigger } from "@/Components/ui/dialog";
import NotificationsDialog from "@/Components/NotificationsDialog";
import axios from "axios";

export default function DashboardNotificationsCard() {

  const navigate = useNavigate();

  const { data: notifications, isPending } = useQuery({
    queryKey: ["sellerNotifications"],
    queryFn: () => sellerService.fetchSellerNotifications()
  });

  console.log("dashboard notifications", notifications);

  const handleNotificationClick = (notification) => {
    // Mark notification as read if it isn't already
    if (!notification.isRead) {
      const markNotificationAsRead = async (notificationId) => {
        try {
          const response = await axios.put(
            `${BASE_URL}/notifications/${notificationId}/mark-read`
          );

          if (!response.ok) {
            throw new Error("Failed to mark notification as read");
          }
        } catch (error) {
          console.error("Error marking notification as read:", error);
        }
      };

      markNotificationAsRead(notification._id);
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

      default:
        // Default to dashboard if no specific route
        navigate("/dashboard/home");
    }
  };

  return (
    <div className="w-full bg-[#FFFFFF] rounded-xl border border-gray-200 p-6 flex flex-col">
      <div className="mb-6">
        <div className="flex flex-col xl:flex-row justify-between items-start gap-y-4 xl:gap-y-0 xl:items-center">
          <div>
            <h3 className="text-xl font-semibold text-[#27272E] font-inter ">
              Notifications
            </h3>
            <p className="text-sm text-[#425466] font-inter mt-1">
              Your recent updates and alerts
            </p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <button className="text-sm whitespace-nowrap text-[#0BB248] font-inter font-semibold hover:text-green-700">
                View all
              </button>
            </DialogTrigger>
            <NotificationsDialog
              notifications={notifications?.filter(
                (notification) => notification.type !== "buyer_message"
              )}
            />
          </Dialog>
        </div>
      </div>

      <div className="overflow-hidden flex-1">
        {isPending ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#16783A]"></div>
          </div>
        ) : notifications?.length && notifications?.length > 0 ? (
          <div className="space-y-3 h-full">
            {notifications?.filter((notification) => notification.type !== "buyer_message")?.slice(0, 3)?.map((notification) => (
                <div
                  key={notification._id}
                  className="p-4 border gap-2 flex-wrap flex items-center justify-between rounded-lg cursor-pointer border-gray-200 hover:bg-gray-50 hover:shadow-md transition-colors"
                >
                  <div>
                    <h4 className="text-sm xl:text-base font-inter font-semibold text-[#27272E]">
                      {notification.title}
                    </h4>
                    <p className="text-sm text-[#425466] max-w-[420px] font-inter mt-1">
                      {notification.message.slice(0, 70)}...
                    </p>
                  </div>
                  <button
                    onClick={() => handleNotificationClick(notification)}
                    className="border border-[#0BB248] text-sm text-[#0BB248] font-cabin whitespace-nowrap hover:bg-[#DEFFEE] px-3 py-1 rounded-lg transition-all duration-300 ease-in-out"
                  >
                    Check It
                  </button>
                </div>
              ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full min-h-[364px] text-gray-500">
            <Icon
              icon="line-md:bell-loop"
              className="text-gray-400 w-20 h-20  "
            />
            <p className="text-base font-medium text-[#425466] font-inter">
              No notifications
            </p>

            <p className="text-sm text-[#425466] font-inter">
              You&apos;re all caught up!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
