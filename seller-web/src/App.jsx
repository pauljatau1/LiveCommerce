import {ThemeProvider} from '@mui/material/styles';
import theme from '@/lib/theme';
import AppRouter from '@/AppRouter';
import IntercomWrapper from "@/Components/IntercomProvider.jsx";
import Loader from '@/Components/Loader';
import {Toaster} from 'sonner';
import {Suspense} from "react";
import CookieConsentWithAnalytics from "@/Components/CookieConsentWithAnalytics.jsx";

export default function App() {
    return (
        <ThemeProvider theme={theme}>
            <IntercomWrapper>
                <Suspense fallback={<Loader/>}>
                    <AppRouter/>
                </Suspense>

                <Toaster/>
                <CookieConsentWithAnalytics/>
            </IntercomWrapper>
        </ThemeProvider>
    );
}
