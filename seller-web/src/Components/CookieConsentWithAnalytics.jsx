import {useCallback} from 'react';
import {useLocation} from 'react-router-dom';
import CookieConsent from './CookieConsent';
import {initAllAnalytics} from "@/util/analytics.js";
import { sellerUtils } from '@/util/auth';



export default function CookieConsentWithAnalytics() {
    const seller = sellerUtils.getSeller();
    const location=useLocation();

    const handleAccept = useCallback(async () => {
        if (seller) {
            const {_id: id, email, firstName, lastName} = seller;
            await initAllAnalytics({userData: {id, email, firstName, lastName}});
        } else {
            await initAllAnalytics();
        }
    }, [seller]);

    const handleDecline = useCallback(async () => {
        await initAllAnalytics({
            mixpanelOptions: {track_pageview: false, autocapture: false},
        });
    }, []);

    if(location.pathname.startsWith('/studio'))return null;
    return (
        <CookieConsent
            onAccept={handleAccept}
            onDecline={handleDecline}
        />
    );
}
