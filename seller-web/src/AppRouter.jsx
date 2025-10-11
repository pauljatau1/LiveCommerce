import { useMemo } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { rootRoutes } from '@/Routes/rootRoutes';
import Loader from './Components/Loader';

export default function AppRouter() {
    const router = useMemo(() => createBrowserRouter(rootRoutes), []);

    return <RouterProvider router={router} fallbackElement={<Loader />} />;
}
