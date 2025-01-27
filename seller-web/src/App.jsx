import AuthProvider from './Contexts/AuthContext';
import { createBrowserRouter, RouterProvider, Navigate, BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { Suspense } from 'react';
import { Toaster } from "sonner";
import { OnboardingProvider } from './Contexts/OnboardingContext';
import LoginPage, { Loader as loginLoader } from './Pages/LoginPage/LoginPage';
import { ProductProvider } from './Contexts/ProductContext';
import { LivestreamProvider } from './Contexts/LivestreamContext';
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
import ProductsPage from './Pages/ProductsPage/ProductsPage';
import AddProduct from './Pages/ProductsPage/AddProduct';
import Drafts from './Pages/ProductsPage/Drafts';
import Inactive from './Pages/ProductsPage/Inactive';
import OrderDetails from './Pages/Orders/OrderDetails';
import OrdersDashboard from './Pages/Orders/Orders';
import CookieConsent from './Components/CookieConsent';
import MarketingPage from './Pages/MarketingPage/MarketingPage';
import { VariantsProvider } from './Contexts/VariantContext';
import Payout from './Pages/payout/Payout';
import Messages from './Pages/messages/messages';
import { SocketProvider } from './Contexts/SocketContext';
import AuqliConnect from './Pages/AuqliConnect/AuqliConnect';
import EditProduct from './Pages/ProductsPage/EditProduct';
import LiveStream from './Pages/LiveStream/LiveStream';
import DashboardRoute from './Components/DashboardRoute';
import SettingsDashboard from './Pages/Settings/SettingsDashboard';
import Analytics from './Pages/Analytics/anayltics';
import Help from './Pages/help/help';
import LiveStreamLayout from './Components/LiveStreamLayout';
import CreateLiveAuction from './Pages/LiveStream/CreateLiveAuction';
import CreateLiveShow from './Pages/LiveStream/CreateLiveShow';
import ScheduleShows from './Pages/LiveStream/ScheduleShows';
import PastShows from './Pages/LiveStream/PastShows';
import SubmitLiveShow from './Pages/LiveStream/SubmitLiveShow';
import SubmitLiveAuction from './Pages/LiveStream/SubmitLiveAuction';
import LivestreamStudio from './Pages/LiveStream/LivestreamStudio';
import TempLoginPage from './Pages/LoginPage/TempLoginPage';

// Create a wrapper component that provides both Router and Auth contexts
function AppProviders({ children }) {
  return (
    <BrowserRouter>
      <AuthProvider>
        {children}
      </AuthProvider>
    </BrowserRouter>
  );
}

// Create router configuration
const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />,
    errorElement: <NotFoundPage />
  },
  {
    path: '/temp/login',
    element: (
      <AuthProvider>
        <ProtectedRoute>
          <TempLoginPage />
        </ProtectedRoute>
      </AuthProvider>
    ),
    errorElement: <NotFoundPage />
  },
  {
    path: '/login',
    element: (
      <AuthProvider>
        <ProtectedRoute>
          <LoginPage />
        </ProtectedRoute>
      </AuthProvider>
    ),
    loader: loginLoader,
    errorElement: <NotFoundPage />
  },
  {
    path: '/signup',
    element: (
      <AuthProvider>

        <SignUpPage />

      </AuthProvider>
    ),
    loader: () => new Promise(resolve => setTimeout(resolve, 500)),
    errorElement: <NotFoundPage />
  },
  {
    path: '/onboarding',
    element: (
      <AuthProvider>
        <ProtectedRoute>
          <OnboardingProvider>
            <OnBoardingPage />
          </OnboardingProvider>
        </ProtectedRoute>
      </AuthProvider>
    ),
    loader: () => new Promise(resolve => setTimeout(resolve, 1000)),
    errorElement: <NotFoundPage />
  },
  {
    path: '/business-onboarding',
    element: (
      <AuthProvider>
        <ProtectedRoute>
          <OnboardingProvider>
            <BusinessOnboarding />
          </OnboardingProvider>
        </ProtectedRoute>
      </AuthProvider>
    ),
    loader: () => new Promise(resolve => setTimeout(resolve, 1000)),
    errorElement: <NotFoundPage />
  },
  {
    path: '/individual-onboarding',
    element: (
      <AuthProvider>
        <ProtectedRoute>
          <OnboardingProvider>
            <IndividualOnboarding />
          </OnboardingProvider>
        </ProtectedRoute>
      </AuthProvider>
    ),
    loader: () => new Promise(resolve => setTimeout(resolve, 1000)),
    errorElement: <NotFoundPage />
  },
  {
    path: '/business-information-onboarding',
    element: (
      <AuthProvider>
        <ProtectedRoute>
          <OnboardingProvider>
            <BusinessInformationOnboarding />
          </OnboardingProvider>
        </ProtectedRoute>
      </AuthProvider>
    ),
    loader: () => new Promise(resolve => setTimeout(resolve, 1000)),
    errorElement: <NotFoundPage />
  },
  {
    path: '/business-verification-onboarding',
    element: (
      <AuthProvider>
        <ProtectedRoute>
          <OnboardingProvider>
            <BusinessVerificationOnboarding />
          </OnboardingProvider>
        </ProtectedRoute>
      </AuthProvider>
    ),
    loader: () => new Promise(resolve => setTimeout(resolve, 1000)),
    errorElement: <NotFoundPage />
  },
  {
    path: '/business-bank-onboarding',
    element: (
      <AuthProvider>
        <ProtectedRoute>
          <OnboardingProvider>
            <BusinessBankOnboarding />
          </OnboardingProvider>
        </ProtectedRoute>
      </AuthProvider>
    ),
    loader: () => new Promise(resolve => setTimeout(resolve, 1000)),
    errorElement: <NotFoundPage />
  },
  {
    path: '/business-category-onboarding',
    element: (
      <AuthProvider>
        <ProtectedRoute>
          <OnboardingProvider>
            <BusinessCategoryOnboarding />
          </OnboardingProvider>
        </ProtectedRoute>
      </AuthProvider>
    ),
    loader: categoriesLoader,
    errorElement: <NotFoundPage />
  },
  {
    path: '/shipping-options-onboarding',
    element: (
      <AuthProvider>
        <ProtectedRoute>
          <OnboardingProvider>
            <ShippingOptionsOnboarding />
          </OnboardingProvider>
        </ProtectedRoute>
      </AuthProvider>
    ),
    loader: () => new Promise(resolve => setTimeout(resolve, 1000)),
    errorElement: <NotFoundPage />
  },
  {
    path: '/individual-verification-onboarding',
    element: (
      <AuthProvider>
        <ProtectedRoute>
          <OnboardingProvider>
            <IndividualVerificationOnboarding />
          </OnboardingProvider>
        </ProtectedRoute>
      </AuthProvider>
    ),
    loader: () => new Promise(resolve => setTimeout(resolve, 1000)),
    errorElement: <NotFoundPage />
  },
  {
    path: '/account-approval',
    element: (
      <AuthProvider>
        <ProtectedRoute>
          <OnboardingProvider>
            <AccountApproval />
          </OnboardingProvider>
        </ProtectedRoute>
      </AuthProvider>
    ),
    loader: () => new Promise(resolve => setTimeout(resolve, 1000)),
    errorElement: <NotFoundPage />
  },
  {
    path: '/dashboard',
    element: (
      <AuthProvider>
        <DashboardRoute>
          <SocketProvider>
            <OnboardingProvider>
              <ProductProvider>
                <DashboardLayout />
              </ProductProvider>
            </OnboardingProvider>
          </SocketProvider>
        </DashboardRoute>
      </AuthProvider>
    ),
    errorElement: <NotFoundPage />,
    children: [
      {
        path: 'home',
        element: <HomePage />,
        errorElement: <NotFoundPage />
      },
      {
        path: 'customers',
        element: <Customers />,
        errorElement: <NotFoundPage />
      },
      {
        path: 'customer/:id',
        element: <CustomerDetail />,
        errorElement: <NotFoundPage />
      },
      {
        path: 'orders',
        element: <OrdersDashboard />,
        errorElement: <NotFoundPage />
      },
      {
        path: 'order/:id',
        element: <OrderDetails />,
        errorElement: <NotFoundPage />
      },
      {
        path: 'products',
        element: <ProductsPage />,
        errorElement: <NotFoundPage />,
      },
      {
        path: 'add-products',
        element: (
          <VariantsProvider>
            <AddProduct />
          </VariantsProvider>
        ),
        errorElement: <NotFoundPage />
      },
      {
        path: 'edit-product/:id',
        element: (
          <VariantsProvider>
            <EditProduct />
          </VariantsProvider>
        ),
        errorElement: <NotFoundPage />
      },
      {
        path: 'drafts',
        element: <Drafts />,
        errorElement: <NotFoundPage />
      },
      {
        path: 'inactive',
        element: <Inactive />,
        errorElement: <NotFoundPage />
      },
      {
        path: 'marketing',
        element: <MarketingPage />,
        errorElement: <NotFoundPage />
      },
      {
        path: 'earnings-payouts',
        element: <Payout />,
        errorElement: <NotFoundPage />
      },
      {
        path: 'messages',
        element: <Messages />,
        errorElement: <NotFoundPage />
      },
      {
        path: 'auqli-connect',
        element: <AuqliConnect />,
        errorElement: <NotFoundPage />
      },
      {
        path: 'live-streams',
        element: (
          <LivestreamProvider>
            <LiveStreamLayout />
          </LivestreamProvider>
        ),
        loader: () => new Promise(resolve => setTimeout(resolve, 1000)),
        children: [
          {
            path: 'live-stream',
            element: <LiveStream />,
            errorElement: <NotFoundPage />
          },
          {
            path: 'create-live-auction',
            element: <CreateLiveAuction />,
            errorElement: <NotFoundPage />
          },
          {
            path: 'create-live-show',
            element: <CreateLiveShow />,
            errorElement: <NotFoundPage />
          },
          {
            path: 'past-shows',
            element: <PastShows />,
            errorElement: <NotFoundPage />
          },
          {
            path: 'scheduled-shows',
            element: <ScheduleShows />,
            errorElement: <NotFoundPage />
          },
          {
            path: 'submit-live-show',
            element: <SubmitLiveShow />,
            errorElement: <NotFoundPage />
          },
          {
            path: 'submit-live-auction',
            element: <SubmitLiveAuction />,
            errorElement: <NotFoundPage />
          },
          {
            path: 'live-stream-studio/:id',
            element: <LivestreamStudio />,
            errorElement: <NotFoundPage />
          }
        ],
        errorElement: <NotFoundPage />
      },
      {
        path: '/dashboard/settings',
        element: <SettingsDashboard />,
        errorElement: <NotFoundPage />
      },
      {
        path: '/dashboard/help',
        element: <Help />,
        errorElement: <NotFoundPage />
      },
      {
        path: 'analytics-insights',
        element: <Analytics />,
        errorElement: <NotFoundPage />
      }
    ]
  }
]);

function App() {
  const handleConsentAccept = () => {
    // Initialize Clarity when user accepts
    window.initClarity?.();
  };

  return (
    <Suspense fallback={<Loader />}>
      <RouterProvider router={router} fallbackElement={<Loader />} />
      <Toaster />
      <ToastContainer />
      <CookieConsent
        onAccept={handleConsentAccept}
        onDecline={() => console.log('Analytics declined')}
      />
    </Suspense>
  );
}

export default App
