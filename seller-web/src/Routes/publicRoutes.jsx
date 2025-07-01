import {lazy} from 'react';

const LoginPage = lazy(() => import('../Pages/LoginPage/LoginPage'));
const SignUpPage = lazy(() => import('../Pages/SignUpPage/SignUpPage'));
const Loader = lazy(() => import('../Components/Loader'));
const NotFoundPage = lazy(() => import('../Pages/NotFoundPage/NotFoundPage'));

export const publicRoutes = [
    {
        index: true,
        element: <Loader/>
    },
    {
        path: 'login',
        element: <LoginPage/>,
        errorElement: <NotFoundPage/>,
    },
    {
        path: 'signup',
        element: <SignUpPage/>,
        errorElement: <NotFoundPage/>,
    },
];
