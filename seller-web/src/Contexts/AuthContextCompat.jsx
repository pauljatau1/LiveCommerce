/**
 * Compatibility layer for existing JavaScript components
 * This file re-exports the TypeScript AuthContext and AuthProvider
 * to maintain compatibility with existing JavaScript imports
 */

// Re-export the TypeScript AuthContext and AuthProvider
export { AuthContext, default as AuthProvider } from './AuthContext';
export { useAuthContext } from '../Hooks/useAuthContext';
