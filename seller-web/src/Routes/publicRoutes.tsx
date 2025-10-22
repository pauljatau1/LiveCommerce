import {lazy} from 'react';

//const LoginPage = lazy(() => import('../Pages/LoginPage/LoginPage'));
const LoginPageV2 = lazy(() => import('../Pages/LoginPage/LoginPageV2'));
//const SignUpPage = lazy(() => import('../Pages/SignUpPage/SignUpPage'));
const SignUpPageV2 = lazy(() => import('../Pages/SignUpPage/SignUpPageV2'));
const Loader = lazy(() => import('../Components/Loader'));
const NotFoundPage = lazy(() => import('../Pages/NotFoundPage/NotFoundPage'));

export const publicRoutes = [
    {
        index: true,
        element: <Loader/>
    },
    {
        path: 'login',
        element: <LoginPageV2/>,
        errorElement: <NotFoundPage/>,
    },
    {
        path: 'signup',
        element: <SignUpPageV2/>,
        errorElement: <NotFoundPage/>,
    },
];
