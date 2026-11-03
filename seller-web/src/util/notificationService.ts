import { NotificationType, NotificationVisibility } from '@/types';

/**
 * Notification service for use outside React components (e.g., Redux slices)
 * This service allows showing notifications from anywhere in the application
 */

type NotificationCallback = (
    message: string,
    type: NotificationType,
    visibility?: NotificationVisibility
) => void;

let notificationCallback: NotificationCallback | null = null;

/**
 * Register the notification callback from NotificationProvider
 * This should be called once when the NotificationProvider mounts
 */
export const registerNotificationCallback = (callback: NotificationCallback) => {
    notificationCallback = callback;
};

/**
 * Unregister the notification callback
 * This should be called when the NotificationProvider unmounts
 */
export const unregisterNotificationCallback = () => {
    notificationCallback = null;
};

/**
 * Show a notification banner
 * @param message - The notification message
 * @param type - The notification type (information, warning, error)
 * @param visibility - The visibility type (fixed or dismissible), defaults to 'dismissible'
 */
export const showNotification = (
    message: string,
    type: NotificationType,
    visibility: NotificationVisibility = 'dismissible'
) => {
    if (notificationCallback) {
        notificationCallback(message, type, visibility);
    } else {
        // Fallback to console if notification system is not available
        console.warn('Notification system not available:', { message, type, visibility });
    }
};

/**
 * Convenience functions for different notification types
 */
export const notificationService = {
    showInfo: (message: string, visibility: NotificationVisibility = 'dismissible') => {
        showNotification(message, 'information', visibility);
    },
    showWarning: (message: string, visibility: NotificationVisibility = 'dismissible') => {
        showNotification(message, 'warning', visibility);
    },
    showError: (message: string, visibility: NotificationVisibility = 'dismissible') => {
        showNotification(message, 'error', visibility);
    },
    showSuccess: (message: string, visibility: NotificationVisibility = 'dismissible') => {
        // Map success to information type since we don't have a success type
        showNotification(message, 'information', visibility);
    },
};

