import AuthProvider from '../Contexts/AuthContext';
import AppProviders from '../AppProviders';
import AppLayout from '../Components/AppLayout';
import AppInitializer from '../AppInitializer';
import ProtectedRoute from '../Components/ProtectedRoute';
import DashboardRoute from '../Components/DashboardRoute';
import OnboardingLayout from '../Components/OnboardingLayout';
import DashboardLayout from '../Components/DashboardLayout';
import NotFoundPage from '../Pages/NotFoundPage/NotFoundPage';
import { Navigate } from "react-router-dom";

import {publicRoutes} from './publicRoutes.jsx';
import {onboardingRoutes} from './onboardingRoutes.jsx';
import {dashboardRoutes} from './dashboardRoutes.jsx';


export const rootRoutes = [
    { index: true, element: <Navigate to="dashboard/home" replace /> },
    {
        path: '/',
        element: (
            <AuthProvider>
                <AppProviders>
                    <AppLayout/>
                    <AppInitializer/>
                </AppProviders>
            </AuthProvider>
        ),
        errorElement: <NotFoundPage/>,
        children: [
            ...publicRoutes,
            {
                path: 'onboarding',
                element: (
                    <ProtectedRoute>
                        <OnboardingLayout/>
                    </ProtectedRoute>
                ),
                children: onboardingRoutes,
            },
            {
                path: 'dashboard',
                element: (
                    <ProtectedRoute>
                        <DashboardRoute>
                            <DashboardLayout/>
                        </DashboardRoute>
                    </ProtectedRoute>
                ),
                children: dashboardRoutes,
            },
        ],
    },
    { path: '*', element: <NotFoundPage /> }, // catch-all unmatched paths and render NotFoundPage
];
