import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Icon } from "@iconify/react";
import { BASE_URL } from '@/Constants/Server';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/Hooks/useAuthContextV2';
import PropTypes from 'prop-types';

function NotificationsDialog({ notifications, onClose }) {
  const navigate = useNavigate();
  const { token } = useAuthContext();

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_order':
        return "material-symbols:order-approve-outline";
      case 'new_follower':
        return "material-symbols:person-add-outline";
      case 'order_paid':
      case 'order_delivered':
      case 'order_cancelled':
      case 'order_status_update':
      case 'order_shipped':
      case 'order_reminder':
        return "material-symbols:order-approve-outline";
      case 'low_stock':
      case 'back_in_stock':
        return "material-symbols:inventory-2-outline";
      case 'return_request':
      case 'return_created':
      case 'return_approved':
      case 'return_rejected':
      case 'return_info_needed':
      case 'return_partial_refund':
      case 'return_label_created':
      case 'return_pickup_arranged':
        return "material-symbols:assignment-return";
      case 'new_campaign':
      case 'campaign_scheduled':
        return "material-symbols:campaign-outline";
      case 'blip_like':
      case 'blip_comment':
        return "material-symbols:comment-outline";
      default:
        return "material-symbols:notifications-outline";
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      const sellerToken = token?.data;
      if (!sellerToken) return;

      const response = await fetch(`${BASE_URL}/notifications/${notificationId}/mark-read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${sellerToken}`,
          'accept': '*/*'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleNotificationClick = async (notification) => {
    // Mark notification as read if it isn't already
    if (!notification.isRead) {
      await markNotificationAsRead(notification._id);
    }
    
    // Close the dialog
    if (onClose) {
      onClose();
    }

    // Route based on notification type
    switch (notification.type) {
      case 'low_stock':
      case 'back_in_stock':
        navigate(`/dashboard/products`);
        break;
      
      case 'new_follower':
        navigate('/dashboard/customers');
        break;

      case 'new_order':
      case 'order_paid':
      case 'order_delivered':
      case 'order_cancelled':
      case 'order_status_update':
      case 'order_shipped':
      case 'order_reminder':
      case 'order_picked_up':
      case 'order_in_transit':
        // Navigate to the specific order if orderId is available in the notification data
        if (notification.data && notification.data.orderId) {
          navigate(`/dashboard/order/${notification.data.orderId}`);
        } else {
          navigate('/dashboard/orders');
        }
        break;

      case 'return_request':
      case 'return_created':
      case 'return_approved':
      case 'return_rejected':
      case 'return_info_needed':
      case 'return_partial_refund':
      case 'return_label_created':
      case 'return_pickup_arranged':
        navigate('/dashboard/returns');
        break;

      case 'new_campaign':
      case 'campaign_scheduled':
        navigate('/dashboard/marketing/inbox-campaigns/list');
        break;

      case 'blip_like':
      case 'blip_comment':
        // Just navigate to the blips page without opening any specific details
        navigate('/dashboard/blips');
        break;

      default:
        // Default to dashboard if no specific route
        navigate('/dashboard/home');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = Math.abs(now - date);
    const diffInHours = diffInMs / 36e5;

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInMs / 60000);
      if (diffInMinutes < 1) {
        const diffInSeconds = Math.floor(diffInMs / 1000);
        return `${diffInSeconds} seconds ago`;
      }
      return `${diffInMinutes} minutes ago`;
    } else if (diffInHours < 24) {
      return `${Math.round(diffInHours)} hours ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Icon icon="material-symbols:notifications-outline" className="h-5 w-5" />
          Notifications
        </DialogTitle>
      </DialogHeader>
      
      <div className="divide-y divide-gray-100">
        {notifications?.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <Icon icon="material-symbols:notifications-off-outline" className="mx-auto h-12 w-12 mb-3" />
            <p>No notifications yet</p>
          </div>
        ) : (
          notifications?.filter(notification => notification.type !== 'buyer_message')
            .map((notification) => (
            <div
              key={notification._id}
              onClick={() => handleNotificationClick(notification)}
              className={`py-4 px-4 hover:bg-gray-50 cursor-pointer transition-colors duration-200 ${
                !notification.isRead ? 'bg-blue-50/50' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <Icon 
                    icon={getNotificationIcon(notification.type)} 
                    className={`h-6 w-6 ${!notification.isRead ? 'text-blue-600' : 'text-gray-400'}`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-medium text-gray-900">{notification.title}</h4>
                    <p className="text-xs text-gray-500 whitespace-nowrap">
                      {formatDate(notification.createdAt)}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                  
                  
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </DialogContent>
  );
}

NotificationsDialog.propTypes = {
  notifications: PropTypes.array,
  onClose: PropTypes.func,
};

export default NotificationsDialog; 