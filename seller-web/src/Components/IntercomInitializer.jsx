import { useEffect } from 'react';
import { useIntercomChat } from '../Hooks/useIntercom';
import { useAuthContext } from '../Hooks/useAuthContextV2';
import { useLocation } from 'react-router-dom';

const IntercomInitializer = () => {
    const { seller, token } = useAuthContext();
    const { initUser, initVisitor } = useIntercomChat();
    const location = useLocation();

    useEffect(() => {
        const validateSession = async () => {
            try {

                if (token?.data || location.pathname !== '/login') {
                    initUser(seller);
                } else {
                    initVisitor();
                }
            } catch (error) {
                console.error('Session validation failed:', error);
                initVisitor();
            }
        };

        validateSession();
    }, [initUser, initVisitor, location.pathname]);

    return null;
};

export default IntercomInitializer; 