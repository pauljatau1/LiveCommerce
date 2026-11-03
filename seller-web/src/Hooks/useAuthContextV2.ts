import { useContext } from 'react';
import { AuthContext } from '@/Contexts/AuthContextV2';
import { AuthContextType } from '../types';

/**
 * Custom hook to access the authentication context
 * Provides type-safe access to all authentication state and methods
 * 
 * @returns AuthContextType - The complete authentication context
 * @throws Error if used outside of AuthProviderV2
 * 
 * @example
 * ```typescript
 * const { seller, isAuthenticated, login, logout } = useAuthContext();
 * ```
 */
const useAuthContext = (): AuthContextType => {
    const context = useContext(AuthContext);
    
    if (!context) {
        throw new Error('useAuthContext must be used within an AuthProviderV2');
    }

    return context;
}

export { useAuthContext };
