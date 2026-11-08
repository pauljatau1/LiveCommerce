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
const Deliveries = lazy(() => import('../studio/Deliveries.jsx'));

// Lazy load NotFoundPage to reduce initial bundle size
const NotFoundPage = lazy(() => import('../Pages/NotFoundPage/NotFoundPage.jsx'));

export const rootRoutes = [
    { index: true, element: <Navigate to="dashboard/home" replace /> },
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
            {
                path: 'dashboard',
                element: (
                    <ProtectedRoute>
                        <DashboardRoute>
                            <DashboardLayout />
                        </DashboardRoute>
                    </ProtectedRoute>
                ),
                children: dashboardRoutes,
            },
            {
                // New full-screen studio pages (no dashboard chrome)
                path: 'studio/list',
                element: (
                    <ProtectedRoute>
                        <DashboardRoute>
                            <Suspense fallback={<Loader />}>
                                <ListingAgent />
                            </Suspense>
                        </DashboardRoute>
                    </ProtectedRoute>
                ),
            },
            {
                path: 'studio/deliveries',
                element: (
                    <ProtectedRoute>
                        <DashboardRoute>
                            <Suspense fallback={<Loader />}>
                                <Deliveries />
                            </Suspense>
                        </DashboardRoute>
                    </ProtectedRoute>
                ),
            },
        ],
    },
    { path: '*', element: <NotFoundPage /> }, // catch-all unmatched paths and render NotFoundPage
];
