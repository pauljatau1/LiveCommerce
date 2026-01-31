import { Suspense } from 'react';
import { LivestreamSocketProvider } from './Contexts/LivestreamSocketContext';
import { TooltipProvider } from './Components/ui/tooltip';
import { DeviceProvider } from '@/Contexts/DeviceContext';
import Loader from './Components/Loader';
import PropTypes from 'prop-types';

// Only contexts that do NOT call react-router hooks belong here
export default function AppProviders({ children }) {
    return (
        <DeviceProvider>
        <LivestreamSocketProvider>
                <TooltipProvider>
                    <Suspense fallback={<Loader />}>{children}</Suspense>
                </TooltipProvider>
        </LivestreamSocketProvider>
        </DeviceProvider>
    );
}

AppProviders.propTypes = {
    children: PropTypes.node.isRequired,
}
