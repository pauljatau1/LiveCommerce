export type NotificationType = 'information' | 'warning' | 'error';
export type NotificationVisibility = 'fixed' | 'dismissible';

export interface NotificationState {
    message: string;
    type: NotificationType | null;
    visibility: NotificationVisibility;
    isVisible: boolean;
}

export interface NotificationAction {
    type: 'SHOW_NOTIFICATION' | 'HIDE_NOTIFICATION' | 'CLEAR_NOTIFICATION';
    payload?: {
        message: string;
        type: NotificationType;
        visibility?: NotificationVisibility;
    };
}

export interface NotificationContextType {
    notification: NotificationState;
    showNotification: (message: string, type: NotificationType, visibility?: NotificationVisibility) => void;
    hideNotification: () => void;
    clearNotification: () => void;
}

export interface NotificationProviderProps {
    children: React.ReactNode;
}

