import { useContext } from 'react';
import { NotificationContext } from '@/Contexts/NotificationContext';
import { NotificationContextType } from '@/types';

/**
 * Hook to access notification context
 * @returns NotificationContextType with notification state and methods
 * @throws Error if used outside NotificationProvider
 */
export const useNotification = (): NotificationContextType => {
    const context = useContext(NotificationContext);
    
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    
    return context;
};

export default useNotification;

