import { Suspense }                 from 'react';
import { SocketProvider }           from './Contexts/SocketContext';
import { LivestreamSocketProvider } from './Contexts/LivestreamSocketContext';
import { OnboardingProvider }       from './Contexts/OnboardingContext';
import { TooltipProvider }          from './Components/ui/tooltip';
import Loader                       from './Components/Loader';

// Only contexts that do NOT call react-router hooks belong here
export default function AppProviders({ children }) {
    return (
        <LivestreamSocketProvider>
            <SocketProvider>
                <OnboardingProvider>
                    <TooltipProvider>
                        <Suspense fallback={<Loader />}>{children}</Suspense>
                    </TooltipProvider>
                </OnboardingProvider>
            </SocketProvider>
        </LivestreamSocketProvider>
    );
}