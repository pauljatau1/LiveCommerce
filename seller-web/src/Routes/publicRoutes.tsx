import { CLASSIC_DASHBOARD } from '@/config/featureFlags';
import {lazy} from 'react';

//const LoginPage = lazy(() => import('../Pages/LoginPage/LoginPage'));
const LoginPageV2 = lazy(() => import('../Pages/LoginPage/LoginPageV2'));
//const SignUpPage = lazy(() => import('../Pages/SignUpPage/SignUpPage'));
const SignUpPageV2 = lazy(() => import('../Pages/SignUpPage/SignUpPageV2'));
const ForgotPasswordPage = lazy(() => import('../Pages/ForgotPasswordPage/ForgotPasswordPage'));
const Loader = lazy(() => import('../Components/Loader'));
const NotFoundPage = lazy(() => import('../Pages/NotFoundPage/NotFoundPage'));

const StudioEntry = lazy(() => import('../studio/Entry.jsx'));

export const publicRoutes = [
    {
        index: true,
        element: <Loader/>
    },
    {
        path: 'login',
        element: CLASSIC_DASHBOARD ? <LoginPageV2/> : <StudioEntry key="login" mode="login"/>,
        errorElement: <NotFoundPage/>,
    },
    {
        path: 'signup',
        element: CLASSIC_DASHBOARD ? <SignUpPageV2/> : <StudioEntry key="signup" mode="signup"/>,
        errorElement: <NotFoundPage/>,
    },
    {
        path: 'forgot-password',
        element: CLASSIC_DASHBOARD ? <ForgotPasswordPage/> : <StudioEntry key="forgot" mode="forgot"/>,
        errorElement: <NotFoundPage/>,
    },
];
