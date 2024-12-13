import { AuthProvider } from './Contexts/AuthContext';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import LoginPage from './Pages/LoginPage/LoginPage';
import SignUpPage from './Pages/SignUpPage/SignUpPage';
import DashboardLayout from './Components/DashboardLayout';
import AppLayout from './Components/AppLayout';
import ProtectedRoute from './Components/ProtectedRoute';
import NotFoundPage from './Pages/NotFoundPage/NotFoundPage';
import Loader from "./Components/Loader";
import OnBoardingPage from './Pages/OnboardingPage/OnBoardingPage';
import HomePage from './Pages/HomePage/HomePage';
import { Suspense } from 'react';


const router = createBrowserRouter([
  {
    element: <AppLayout />,
    errorElement: <NotFoundPage />,
    loader: () => {
      return new Promise(resolve => setTimeout(resolve, 1000))
    },
    children: [
      {
        path: '/',
        element: <LoginPage />,
        loader: () => new Promise(resolve => setTimeout(resolve, 500)),
        errorElement: <NotFoundPage />
      },
      {
        path: '/signup',
        element: <SignUpPage />,
        loader: () => new Promise(resolve => setTimeout(resolve, 500)),
        errorElement: <NotFoundPage />
      },
      {
        path: '/dashboard',
        element: <ProtectedRoute><DashboardLayout /></ProtectedRoute>,
        loader: () => new Promise(resolve => setTimeout(resolve, 1000)),
        errorElement: <NotFoundPage />,
        children: [
          {
            path: 'onboarding',
            element: <OnBoardingPage />,
            loader: () => new Promise(resolve => setTimeout(resolve, 500)),
            errorElement: <NotFoundPage />
          },
          {
            path: 'home',
            element: <HomePage />,
            loader: () => new Promise(resolve => setTimeout(resolve, 500)),
            errorElement: <NotFoundPage />
          }
        ]
      }
    ]
  }
]);

const App = () => {
  return (
    <Suspense fallback={<Loader />}>
      <AuthProvider>
        <RouterProvider 
          router={router} 
          fallbackElement={<Loader />}
        />
        <ToastContainer
          position="top-center"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
        />
      </AuthProvider>
    </Suspense>
  )
}

export default App
