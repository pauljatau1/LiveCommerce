import {useCallback} from 'react';
import CookieConsent from './CookieConsent';
import {initAllAnalytics} from "@/util/analytics.js";
import { sellerUtils } from '@/util/auth';



export default function CookieConsentWithAnalytics() {
    const seller = sellerUtils.getSeller();

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

    // Rendered outside the router (App.jsx), so read the address directly:
    // router hooks here crash the whole app before it draws.
    if(typeof window!=='undefined'&&window.location.pathname.startsWith('/studio'))return null;
    return (
        <CookieConsent
            onAccept={handleAccept}
            onDecline={handleDecline}
        />
    );
}
