import { useEffect } from 'react';
import { initAllAnalytics } from './util/analytics';
import { useNavigate } from 'react-router-dom';

export default function AppInitializer() {
    const navigate = useNavigate();

    useEffect(() => {
        initAllAnalytics();
    }, [navigate]);

    return null; // renders nothing
}