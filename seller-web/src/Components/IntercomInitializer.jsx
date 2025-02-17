import { useEffect } from 'react';
import { useIntercomChat } from '../Hooks/useIntercom';
import { useAuthContext } from '../Hooks/useAuthContext';
import { useLocation } from 'react-router-dom';

const IntercomInitializer = () => {
    const { seller, isAuthenticated, isDataReady } = useAuthContext();
    const { initUser, initVisitor, shutDown } = useIntercomChat();
    const location = useLocation();

    console.log(location.pathname);

    useEffect(() => {
        const validateSession = async () => {
            try {

                // Remove the artificial delay
                const token = localStorage.getItem('sellerToken');
                const userToken = token ? JSON.parse(token) : { data: null };
                const storedSeller = JSON.parse(localStorage.getItem('seller')) || seller;

                if (userToken?.data || location.pathname !== '/login') {
                    initUser(seller || storedSeller);
                } else {
                    initVisitor();
                }
            } catch (error) {
                console.error('Session validation failed:', error);
                initVisitor();
            }
        };

        validateSession();

        // Add event listener for login completion
        window.addEventListener('appLoginComplete', validateSession);
        return () => window.removeEventListener('appLoginComplete', validateSession);
    }, [seller, initUser, initVisitor, location.pathname, isDataReady]);

    return null;
};

export default IntercomInitializer; 