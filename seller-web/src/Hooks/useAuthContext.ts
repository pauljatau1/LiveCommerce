import { useContext } from 'react';
import { AuthContext } from '../Contexts/AuthContext';
import { AuthContextType } from '../types';

/**
 * Custom hook to access the authentication context
 * Provides type-safe access to all authentication state and methods
 * 
 * @returns AuthContextType - The complete authentication context
 * @throws Error if used outside of AuthProvider
 * 
 * @example
 * ```typescript
 * const { seller, isAuthenticated, login, logout } = useAuthContext();
 * ```
 */
const useAuthContext = (): AuthContextType => {
    const context = useContext(AuthContext);
    
    if (!context) {
        throw new Error('useAuthContext must be used within an AuthProvider');
    }

    return context;
}

export { useAuthContext };
