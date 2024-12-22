import AuthProvider from './Contexts/AuthContext';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { Suspense } from 'react';
import { Toaster } from "@/components/ui/sonner";
import { OnboardingProvider } from './Contexts/OnboardingContext';
import LoginPage, { Loader as loginLoader } from './Pages/LoginPage/LoginPage';
import SignUpPage from './Pages/SignUpPage/SignUpPage';
import DashboardLayout from './Components/DashboardLayout';
import AppLayout from './Components/AppLayout';
import ProtectedRoute from './Components/ProtectedRoute';
import NotFoundPage from './Pages/NotFoundPage/NotFoundPage';
import Loader from "./Components/Loader";
import OnBoardingPage from './Pages/OnboardingPage/OnBoardingPage';
import HomePage from './Pages/HomePage/HomePage';
import BusinessOnboarding from './Pages/BusinessOnboarding/BusinessOnboarding';
import IndividualOnboarding from './Pages/IndividualOnboarding/IndividualOnboarding';
import BusinessInformationOnboarding from './Components/ui/BusinessInformationOnboarding';
import BusinessVerificationOnboarding from './Components/ui/BusinessVerificationOnboarding';
import BusinessBankOnboarding from './Components/ui/BusinessBankOnboarding';
import BusinessCategoryOnboarding, { Loader as categoriesLoader } from './Components/ui/BusinessCategoryOnboarding';
import ShippingOptionsOnboarding from './Components/ui/ShippingOptionsOnboarding';
import AccountApproval from './Components/ui/AccountApproval';
import IndividualVerificationOnboarding from './Components/ui/IndividualVerificationOnboarding';
import Customers from './Pages/Customers/Customers';
import CustomerDetail from './Pages/Customers/CustomerDetail';





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
        loader: loginLoader,
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
        element: (
          <ProtectedRoute>
            <OnboardingProvider>
              <DashboardLayout />
            </OnboardingProvider>
          </ProtectedRoute>
        ),
        loader: () => new Promise(resolve => setTimeout(resolve, 1000)),
        errorElement: <NotFoundPage />,
        children: [
          {
            path: 'onboarding',
            element: <OnBoardingPage />,
            loader: () => new Promise(resolve => setTimeout(resolve, 1000)),
            errorElement: <NotFoundPage />
          },
          {
            path: 'home',
            element: <HomePage />,
            loader: () => new Promise(resolve => setTimeout(resolve, 1000)),
            errorElement: <NotFoundPage />
          },
          {
            path: 'business-onboarding',
            element: <BusinessOnboarding />,
            loader: () => new Promise(resolve => setTimeout(resolve, 1000)),
            errorElement: <NotFoundPage />
          },
          {
            path: 'individual-onboarding',
            element: <IndividualOnboarding />,
            loader: () => new Promise(resolve => setTimeout(resolve, 1000)),
            errorElement: <NotFoundPage />
          },
          {
            path: 'business-information-onboarding',
            element: <BusinessInformationOnboarding />,
            loader: () => new Promise(resolve => setTimeout(resolve, 1000)),
            errorElement: <NotFoundPage />
          },
          {
            path: 'business-verification-onboarding',
            element: <BusinessVerificationOnboarding />,
            loader: () => new Promise(resolve => setTimeout(resolve, 1000)),
            errorElement: <NotFoundPage />
          },
          {
            path: 'business-bank-onboarding',
            element: <BusinessBankOnboarding />,
            loader: () => new Promise(resolve => setTimeout(resolve, 1000)),
            errorElement: <NotFoundPage />
          },
          {
            path: 'business-category-onboarding',
            element: <BusinessCategoryOnboarding />,
            loader: categoriesLoader,
            errorElement: <NotFoundPage />
          },
          {
            path: 'shipping-options-onboarding',
            element: <ShippingOptionsOnboarding />,
            loader: () => new Promise(resolve => setTimeout(resolve, 1000)),
            errorElement: <NotFoundPage />
          },
          {
            path: 'individual-verification-onboarding',
            element: <IndividualVerificationOnboarding />,
            loader: () => new Promise(resolve => setTimeout(resolve, 1000)),
            errorElement: <NotFoundPage />
          },
          {
            path: 'account-approval',
            element: <AccountApproval />,
            loader: () => new Promise(resolve => setTimeout(resolve, 1000)),
            errorElement: <NotFoundPage />
          },
          {
            path: 'customers',
            element: <Customers />,
            loader: () => new Promise(resolve => setTimeout(resolve, 1000)),
            errorElement: <NotFoundPage />
          },
          {
            path: 'customer',
            element: <CustomerDetail />,
            loader: () => new Promise(resolve => setTimeout(resolve, 1000)),
            errorElement: <NotFoundPage />
          },
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
          <Toaster />
      </AuthProvider>
    </Suspense>
  )
}

export default App
