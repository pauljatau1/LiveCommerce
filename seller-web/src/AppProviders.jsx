import { Suspense } from 'react';
import { SocketProvider } from './Contexts/SocketContext';
import { LivestreamSocketProvider } from './Contexts/LivestreamSocketContext';
import { TooltipProvider } from './Components/ui/tooltip';
import Loader from './Components/Loader';
import PropTypes from 'prop-types';

// Only contexts that do NOT call react-router hooks belong here
export default function AppProviders({ children }) {
    return (
        <LivestreamSocketProvider>
            <SocketProvider>
                    <TooltipProvider>
                        <Suspense fallback={<Loader />}>{children}</Suspense>
                    </TooltipProvider>
            </SocketProvider>
        </LivestreamSocketProvider>
    );
}

AppProviders.propTypes = {
    children: PropTypes.node.isRequired,
}
