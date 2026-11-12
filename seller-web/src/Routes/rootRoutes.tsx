import { CLASSIC_DASHBOARD } from '@/config/featureFlags';
import ClassicRedirect from '../studio/ClassicRedirect.jsx';
import { lazy, Suspense } from 'react';
import AuthProviderV2 from '@/Contexts/AuthContextV2';
import { NotificationProvider } from '@/Contexts/NotificationContext';
import AppProviders from '../AppProviders.jsx';
import AppLayout from '../Components/AppLayout.jsx';
import AppInitializer from '../AppInitializer.jsx';
import ProtectedRoute from '../Components/protectionRoutes/ProtectedRoute';
import DashboardRoute from '../Components/protectionRoutes/DashboardRoute';
import DashboardLayout from '../Components/DashboardLayout.jsx';
import RouterErrorHandler from '../Components/RouterErrorHandler.jsx';
import { Navigate } from "react-router-dom";
import Loader from '../Components/Loader';

import { publicRoutes } from '@/Routes/publicRoutes';
import { dashboardRoutes } from './dashboardRoutes.jsx';

const ListingAgent = lazy(() => import('../studio/ListingAgent.jsx'));
const StudioLayout = lazy(() => import('../studio/StudioLayout.jsx'));
const StudioHome = lazy(() => import('../studio/Home.jsx'));
const StudioProducts = lazy(() => import('../studio/Products.jsx'));
const StudioProductDetail = lazy(() => import('../studio/ProductDetail.jsx'));
const StudioOrders = lazy(() => import('../studio/Orders.jsx').then((m) => ({ default: m.Orders })));
const StudioOrderDetail = lazy(() => import('../studio/Orders.jsx').then((m) => ({ default: m.OrderDetail })));
const StudioRecap = lazy(() => import('../studio/Recap.jsx'));
const StudioPickup = lazy(() => import('../studio/PickupAddress.jsx'));
const StudioStart = lazy(() => import('../studio/Start.jsx'));
const StudioNotifications = lazy(() => import('../studio/Notifications.jsx'));
const StudioMoney = lazy(() => import('../studio/Money.jsx'));
const StudioMe = lazy(() => import('../studio/Me.jsx'));
const StudioShows = lazy(() => import('../studio/Shows.jsx'));
const StudioPlanner = lazy(() => import('../studio/Planner.jsx'));
const StudioGoLive = lazy(() => import('../studio/GoLive.jsx'));
const StudioGoLiveCheck = lazy(() => import('../studio/GoLive.jsx').then((m) => ({ default: m.GoLiveCheck })));
const StudioProductEditor = lazy(() => import('../studio/ProductEditor.jsx'));
const StudioProfile = lazy(() => import('../studio/StoreProfile.jsx'));
const StudioBank = lazy(() => import('../studio/BankAccount.jsx'));
const StudioHelp = lazy(() => import('../studio/Help.jsx'));
const StudioLive = lazy(() => import('../studio/Live.jsx'));

// Full-screen studio page: signed in, past the pickup-address check, lazy loaded
const studioPage = (path: string, Page: any) => ({
    path,
    element: (
        <ProtectedRoute>
            <DashboardRoute>
                <Suspense fallback={<Loader />}>
                    <Page />
                </Suspense>
            </DashboardRoute>
        </ProtectedRoute>
    ),
});

// Lazy load NotFoundPage to reduce initial bundle size
const NotFoundPage = lazy(() => import('../Pages/NotFoundPage/NotFoundPage.jsx'));

export const rootRoutes = [
    ...(!CLASSIC_DASHBOARD ? [{ path: '/dashboard/*', element: <ClassicRedirect /> }] : []),
    { index: true, element: <Navigate to="studio" replace /> },
    {
        path: '/',
        element: (
            <NotificationProvider>
                <AuthProviderV2>
                    <ProtectedRoute>
                        <AppProviders>
                            <AppLayout />
                            <AppInitializer />
                        </AppProviders>
                    </ProtectedRoute>
                </AuthProviderV2>
            </NotificationProvider>
        ),
        errorElement: <RouterErrorHandler />,
        children: [
            ...publicRoutes,
            ...(CLASSIC_DASHBOARD ? [{
                path: 'dashboard',
                element: (
                    <ProtectedRoute>
                        <DashboardRoute>
                            <DashboardLayout />
                        </DashboardRoute>
                    </ProtectedRoute>
                ),
                children: dashboardRoutes,
            }] : []),
            {
                // New seller studio: tab bar on phones, top bar on desktop
                path: 'studio',
                element: (
                    <ProtectedRoute>
                        <DashboardRoute>
                            <Suspense fallback={<Loader />}>
                                <StudioLayout />
                            </Suspense>
                        </DashboardRoute>
                    </ProtectedRoute>
                ),
                children: [
                    { index: true, element: <Suspense fallback={<Loader />}><StudioHome /></Suspense> },
                    { path: 'products', element: <Suspense fallback={<Loader />}><StudioProducts /></Suspense> },
                    { path: 'orders', element: <Suspense fallback={<Loader />}><StudioOrders /></Suspense> },
                    { path: 'golive', element: <Suspense fallback={<Loader />}><StudioGoLive /></Suspense> },
                    { path: 'me', element: <Suspense fallback={<Loader />}><StudioMe /></Suspense> },
                ],
            },
            // Full-screen studio pages (no tab bar)
            { path: 'studio/help', element: <Suspense fallback={<Loader />}><StudioHelp /></Suspense> },
            studioPage('studio/start', StudioStart),
            studioPage('studio/pickup', StudioPickup),
            studioPage('studio/notifications', StudioNotifications),
            studioPage('studio/list', ListingAgent),
            studioPage('studio/products/new', StudioProductEditor),
            studioPage('studio/products/:id/edit', StudioProductEditor),
            studioPage('studio/profile', StudioProfile),
            studioPage('studio/bank', StudioBank),
            studioPage('studio/products/:id', StudioProductDetail),
            studioPage('studio/orders/:id', StudioOrderDetail),
            studioPage('studio/recap/:id', StudioRecap),
            studioPage('studio/money', StudioMoney),
            studioPage('studio/shows', StudioShows),
            studioPage('studio/plan', StudioPlanner),
            studioPage('studio/golive/:showId', StudioGoLiveCheck),
            studioPage('studio/live/:id', StudioLive),
            { path: 'studio/deliveries', element: <Navigate to="/studio/orders" replace /> },
        ],
    },
    { path: '*', element: <NotFoundPage /> }, // catch-all unmatched paths and render NotFoundPage
];
