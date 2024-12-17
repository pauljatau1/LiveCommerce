//custom hook to use the auth context
import { useContext } from 'react';
import { AuthContext } from '../Contexts/AuthContext';

const useAuthContext = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuthContext must be used within an AuthProvider');
    }

    return context;
}

export { useAuthContext };
