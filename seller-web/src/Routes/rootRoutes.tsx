import AuthProviderV2 from '@/Contexts/AuthContextV2';
import AppProviders from '../AppProviders.jsx';
import AppLayout from '../Components/AppLayout.jsx';
import AppInitializer from '../AppInitializer.jsx';
import ProtectedRoute from '../Components/protectionRoutes/ProtectedRoute';
import DashboardRoute from '../Components/protectionRoutes/DashboardRoute';
import DashboardLayout from '../Components/DashboardLayout.jsx';
import NotFoundPage from '../Pages/NotFoundPage/NotFoundPage.jsx';
import RouterErrorHandler from '../Components/RouterErrorHandler.jsx';
import { Navigate } from "react-router-dom";

import { publicRoutes } from '@/Routes/publicRoutes';
import { dashboardRoutes } from './dashboardRoutes.jsx';

export const rootRoutes = [
    { index: true, element: <Navigate to="dashboard/home" replace /> },
    {
        path: '/',
        element: (
            <AuthProviderV2>
                <ProtectedRoute>
                    <AppProviders>
                        <AppLayout />
                        <AppInitializer />
                    </AppProviders>
                </ProtectedRoute>
            </AuthProviderV2>
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
        ],
    },
    { path: '*', element: <NotFoundPage /> }, // catch-all unmatched paths and render NotFoundPage
];
