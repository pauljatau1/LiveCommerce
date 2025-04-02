import AuthProvider from './Contexts/AuthContext';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { Suspense, useEffect } from 'react';
import { Toaster } from "sonner";
import { OnboardingProvider } from './Contexts/OnboardingContext';
import LoginPage from './Pages/LoginPage/LoginPage';
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
import { LivestreamSocketProvider } from './Contexts/LivestreamSocketContext';
import AuqliConnect from './Pages/AuqliConnect/AuqliConnect';
import EditProduct from './Pages/ProductsPage/EditProduct';
import LiveStream from './Pages/LiveStream/LiveStream';
import DashboardRoute from './Components/DashboardRoute';
import SettingsDashboard from './Pages/Settings/SettingsDashboard';
import AnalyticsDashboard from './Pages/Analytics/anayltics';
import Help from './Pages/help/help';
import LiveStreamLayout from './Components/LiveStreamLayout';
import CreateLiveAuction from './Pages/LiveStream/CreateLiveAuction';
import CreateLiveShow from './Pages/LiveStream/CreateLiveShow';
import ScheduleShows from './Pages/LiveStream/ScheduleShows';
import PastShows from './Pages/LiveStream/PastShows';
import SubmitLiveShow from './Pages/LiveStream/SubmitLiveShow';
import SubmitLiveAuction from './Pages/LiveStream/SubmitLiveAuction';
import LivestreamStudio from './Pages/LiveStream/LivestreamStudio';
import OnboardingLayout from './Components/OnboardingLayout';
import CreateProfile from './Components/ui/CreateProfile';
import Coupons from './Pages/MarketingPage/Coupons';
import CouponsList from './Pages/MarketingPage/CouponsList'
import InboxCampaigns from './Pages/MarketingPage/InboxCampaigns';
import CreateCampaign from './Pages/MarketingPage/CreateCampaign';
import { TooltipProvider } from './Components/ui/tooltip';
import Returns from './Pages/Orders/Returns';
import ReturnDetail from './Pages/Orders/ReturnDetail';
import Account from './Pages/Account/account';
import { ThemeProvider } from '@mui/material/styles';
import theme from './lib/theme';
import mixpanel from "mixpanel-browser";
import IntercomWrapper from './Components/IntercomProvider';
import IntercomInitializer from './Components/IntercomInitializer';
import TestTopup from './Pages/google/google';
// Create a wrapper component that provides both Router and Auth contexts


// Create router configuration
const router = createBrowserRouter([
  {
    element: (
      <AuthProvider>
        <ProtectedRoute>
          <SocketProvider>
            <LivestreamSocketProvider>
              <OnboardingProvider>
                <TooltipProvider>
                  <AppLayout />
                </TooltipProvider>
              </OnboardingProvider>
            </LivestreamSocketProvider>
          </SocketProvider>
        </ProtectedRoute>
      </AuthProvider>
    ),
    errorElement: <NotFoundPage />,

    children: [
      {
        path: '/',
        element: <Loader />,
        // element: <TestTopup />
      },
      {
        path: '/login',
        element: <LoginPage />,
        // element: <TestTopup />,
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
        path: '/onboarding',
        element: (
          <AuthProvider>
            <ProtectedRoute>
              <SocketProvider>
                <OnboardingProvider>
                  <OnboardingLayout />
                </OnboardingProvider>
              </SocketProvider>
            </ProtectedRoute>
          </AuthProvider >
        ),
        loader: () => new Promise(resolve => setTimeout(resolve, 1000)),
        errorElement: <NotFoundPage />,
        children: [
          {
            path: '/onboarding',
            element: <Navigate to="profile" replace />,
          },
          {
            path: 'profile',
            element: <OnBoardingPage />,
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
            path: 'create-profile',
            element: <CreateProfile />,
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
        ]
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
        loader: () => new Promise(resolve => setTimeout(resolve, 1000)),
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
            path: 'returns',
            element: <Returns />,
            errorElement: <NotFoundPage />
          },
          {
            path: 'return/:id',
            element: <ReturnDetail />,
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
            path: 'coupons',
            children: [
              {
                path: '',
                element: <Navigate to="list" replace />,
              },
              {
                path: 'list',
                element: <CouponsList />,
              },
              {
                path: 'create',
                element: <Coupons />,
              },
            ],
          },
          {
            path: 'inbox-campaigns',
            children: [
              {
                path: '',
                element: <Navigate to="list" replace />,
              },
              {
                path: 'create',
                element: <CreateCampaign />,
              },
              {
                path: 'list',
                element: <InboxCampaigns />,
              },
            ],
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
            path: '/dashboard/account',
            element: <Account />,
            errorElement: <NotFoundPage />
          },
          {
            path: '/dashboard/help',
            element: <Help />,
            errorElement: <NotFoundPage />
          },
          {
            path: 'analytics-insights',
            element: <AnalyticsDashboard />,
            errorElement: <NotFoundPage />
          }
        ]
      }
    ]
  },
]);

function App() {
  useEffect(() => {
    // Initialize Mixpanel based on existing consent
    mixpanel.init("94b0cfbe14bc101f450403071cb7169d", {
      debug: true,
      track_pageview: true,
      persistence: "localStorage",
      autocapture: true,
    });
  }, []);

  const handleConsentAccept = () => {
    // Initialize Customer.io analytics
    window.cioanalytics.load("403c9b971fd0501b68ee");
    // Track initial pageview
    window.cioanalytics.page();
    // Near entry of your product, init Mixpanel
    mixpanel.init("94b0cfbe14bc101f450403071cb7169d", {
      debug: true,
      track_pageview: true,
      persistence: "localStorage",
      autocapture: true,

    });

  };

  const handleConsentDecline = () => {
    // Initialize Customer.io analytics
    window.cioanalytics.load("403c9b971fd0501b68ee");
    // Track initial pageview
    window.cioanalytics.page();
    // Near entry of your product, init Mixpanel
    mixpanel.init("94b0cfbe14bc101f450403071cb7169d", {
      debug: true,
      track_pageview: true,
      persistence: "localStorage",
      autocapture: true,
    });
  };

  return (
    <ThemeProvider theme={theme}>
      <IntercomWrapper>
        <Suspense fallback={<Loader />}>
          <RouterProvider router={router} fallbackElement={<Loader />} />
          <Toaster />
          <ToastContainer />
          <CookieConsent
            onAccept={handleConsentAccept}
            onDecline={handleConsentDecline}
          />
        </Suspense>
      </IntercomWrapper>
    </ThemeProvider>
  );
}

export default App
