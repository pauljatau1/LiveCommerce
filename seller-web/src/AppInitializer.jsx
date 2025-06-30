import { useEffect } from 'react';
import { initAllAnalytics } from './util/analytics';
import { setupAxiosInterceptors } from './util/axiosInterceptors';
import { useNavigate } from 'react-router-dom';

export default function AppInitializer() {
    const navigate = useNavigate();

    useEffect(() => {
        setupAxiosInterceptors(navigate);
        initAllAnalytics();
    }, [navigate]);

    return null; // renders nothing
}