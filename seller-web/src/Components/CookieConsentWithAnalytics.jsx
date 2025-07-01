import {useCallback} from 'react';
import CookieConsent from './CookieConsent';
import {initAllAnalytics} from "@/util/analytics.js";

function getSellerFromStorage() {
    try {
        const raw = localStorage.getItem('seller');
        const parsed = JSON.parse(raw);
        return parsed && parsed._id ? parsed : null;
    } catch {
        return null;
    }
}

export default function CookieConsentWithAnalytics() {
    const seller = getSellerFromStorage();

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

    return (
        <CookieConsent
            onAccept={handleAccept}
            onDecline={handleDecline}
        />
    );
}
