import { createContext, useReducer, useMemo, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
    NotificationContextType,
    NotificationState,
    NotificationAction,
    NotificationProviderProps,
    NotificationType,
    NotificationVisibility,
} from '@/types';

// Create the NotificationContext
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Initial state
const initialState: NotificationState = {
    message: '',
    type: null,
    visibility: 'dismissible',
    isVisible: false,
};

// Reducer function
const notificationReducer = (state: NotificationState, action: NotificationAction): NotificationState => {
    switch (action.type) {
        case 'SHOW_NOTIFICATION':
            if (!action.payload) return state;
            return {
                message: action.payload.message,
                type: action.payload.type,
                visibility: action.payload.visibility || 'dismissible',
                isVisible: true,
            };
        case 'HIDE_NOTIFICATION':
            return {
                ...state,
                isVisible: false,
            };
        case 'CLEAR_NOTIFICATION':
            return initialState;
        default:
            return state;
    }
};

/**
 * NotificationProvider component that provides notification context to the entire application
 * Handles notification state management and auto-dismiss functionality
 */
export function NotificationProvider({ children }: NotificationProviderProps) {
    const [state, dispatch] = useReducer(notificationReducer, initialState);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const location = useLocation();
    const prevPathnameRef = useRef<string>(location.pathname);

    // Hide notification when pathname changes
    useEffect(() => {
        // Only hide if pathname actually changed (not on initial mount)
        if (prevPathnameRef.current !== location.pathname) {
            // Clear any existing timeout
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }

            // Hide notification when pathname changes (reducer handles if already hidden)
            dispatch({ type: 'HIDE_NOTIFICATION' });

            // Update the previous pathname
            prevPathnameRef.current = location.pathname;
        } else {
            // On initial mount, just set the ref
            prevPathnameRef.current = location.pathname;
        }
    }, [location.pathname]);

    // Auto-dismiss functionality for dismissible notifications
    useEffect(() => {
        // Clear any existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }

        // If notification is visible and visibility is dismissible, auto-dismiss after 5 seconds
        if (state.isVisible && state.visibility === 'dismissible') {
            timeoutRef.current = setTimeout(() => {
                dispatch({ type: 'HIDE_NOTIFICATION' });
            }, 5000);
        }

        // Cleanup function
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        };
    }, [state.isVisible, state.visibility]);

    // Function to show notification
    const showNotification = (
        message: string,
        type: NotificationType,
        visibility: NotificationVisibility = 'dismissible'
    ) => {
        // Clear any existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }

        // Dispatch the notification
        dispatch({
            type: 'SHOW_NOTIFICATION',
            payload: {
                message,
                type,
                visibility,
            },
        });
    };

    // Function to hide notification
    const hideNotification = () => {
        // Clear any existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        dispatch({ type: 'HIDE_NOTIFICATION' });
    };

    // Function to clear notification completely
    const clearNotification = () => {
        // Clear any existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        dispatch({ type: 'CLEAR_NOTIFICATION' });
    };

    // Memoize context value to prevent unnecessary re-renders
    const contextValue = useMemo<NotificationContextType>(
        () => ({
            notification: state,
            showNotification,
            hideNotification,
            clearNotification,
        }),
        [state]
    );

    return (
        <NotificationContext.Provider value={contextValue}>
            {children}
        </NotificationContext.Provider>
    );
}

export { NotificationContext };
export default NotificationProvider;

