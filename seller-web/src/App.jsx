import AuthProvider from './Contexts/AuthContext';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { Suspense, useEffect, lazy } from 'react';
import { Toaster } from "sonner";
import { OnboardingProvider } from './Contexts/OnboardingContext';
import Loader from "./Components/Loader";
import { SocketProvider } from './Contexts/SocketContext';
import { LivestreamSocketProvider } from './Contexts/LivestreamSocketContext';
import { VariantsProvider } from './Contexts/VariantContext';
import { ProductProvider } from './Contexts/ProductContext';
import { LivestreamProvider } from './Contexts/LivestreamContext';
import DashboardRoute from './Components/DashboardRoute';
import AppLayout from './Components/AppLayout';
import ProtectedRoute from './Components/ProtectedRoute';
import { TooltipProvider } from './Components/ui/tooltip';
import { ThemeProvider } from '@mui/material/styles';
import theme from './lib/theme';
import CookieConsent from './Components/CookieConsent';
import IntercomWrapper from './Components/IntercomProvider';
import OnboardingLayout from './Components/OnboardingLayout';
// Import analytics utilities instead of Mixpanel directly
import { initAllAnalytics } from './util/analytics';

// Lazy load all page components to reduce initial bundle size
const LoginPage = lazy(() => import('./Pages/LoginPage/LoginPage'));
const SignUpPage = lazy(() => import('./Pages/SignUpPage/SignUpPage'));
const NotFoundPage = lazy(() => import('./Pages/NotFoundPage/NotFoundPage'));
const OnBoardingPage = lazy(() => import('./Pages/OnboardingPage/OnBoardingPage'));
const HomePage = lazy(() => import('./Pages/HomePage/HomePage'));
const BusinessOnboarding = lazy(() => import('./Pages/BusinessOnboarding/BusinessOnboarding'));
const IndividualOnboarding = lazy(() => import('./Pages/IndividualOnboarding/IndividualOnboarding'));
const BusinessInformationOnboarding = lazy(() => import('./Components/ui/BusinessInformationOnboarding'));
const BusinessVerificationOnboarding = lazy(() => import('./Components/ui/BusinessVerificationOnboarding'));
const BusinessBankOnboarding = lazy(() => import('./Components/ui/BusinessBankOnboarding'));
const BusinessCategoryOnboarding = lazy(() => import('./Components/ui/BusinessCategoryOnboarding'));
const ShippingOptionsOnboarding = lazy(() => import('./Components/ui/ShippingOptionsOnboarding'));
const AccountApproval = lazy(() => import('./Components/ui/AccountApproval'));
const IndividualVerificationOnboarding = lazy(() => import('./Components/ui/IndividualVerificationOnboarding'));
const CreateProfile = lazy(() => import('./Components/ui/CreateProfile'));
const DashboardLayout = lazy(() => import('./Components/DashboardLayout'));

// Lazily load content pages with higher payloads
const Customers = lazy(() => import('./Pages/Customers/Customers'));
const CustomerDetail = lazy(() => import('./Pages/Customers/CustomerDetail'));
const ProductsPage = lazy(() => import('./Pages/ProductsPage/ProductsPage'));
const AddProduct = lazy(() => import('./Pages/ProductsPage/AddProduct'));
const EditProduct = lazy(() => import('./Pages/ProductsPage/EditProduct'));
const Drafts = lazy(() => import('./Pages/ProductsPage/Drafts'));
const OrderDetails = lazy(() => import('./Pages/Orders/OrderDetails'));
const OrdersDashboard = lazy(() => import('./Pages/Orders/Orders'));
const MarketingPage = lazy(() => import('./Pages/MarketingPage/MarketingPage'));
const Payout = lazy(() => import('./Pages/payout/Payout'));
const Messages = lazy(() => import('./Pages/messages/messages'));
const AuqliConnect = lazy(() => import('./Pages/AuqliConnect/AuqliConnect'));
const LiveStream = lazy(() => import('./Pages/LiveStream/LiveStream'));
const SettingsDashboard = lazy(() => import('./Pages/Settings/SettingsDashboard'));
const AnalyticsDashboard = lazy(() => import('./Pages/Analytics/anayltics'));
const Help = lazy(() => import('./Pages/help/help'));
const LiveStreamLayout = lazy(() => import('./Components/LiveStreamLayout'));
const CreateLiveAuction = lazy(() => import('./Pages/LiveStream/CreateLiveAuction'));
const CreateLiveShow = lazy(() => import('./Pages/LiveStream/CreateLiveShow'));
const ScheduleShows = lazy(() => import('./Pages/LiveStream/ScheduleShows'));
const PastShows = lazy(() => import('./Pages/LiveStream/PastShows'));
const SubmitLiveShow = lazy(() => import('./Pages/LiveStream/SubmitLiveShow'));
const SubmitLiveAuction = lazy(() => import('./Pages/LiveStream/SubmitLiveAuction'));
const LivestreamStudio = lazy(() => import('./Pages/LiveStream/LivestreamStudio'));
const Coupons = lazy(() => import('./Pages/MarketingPage/Coupons'));
const CouponsList = lazy(() => import('./Pages/MarketingPage/CouponsList'));
const InboxCampaigns = lazy(() => import('./Pages/MarketingPage/InboxCampaigns'));
const CreateCampaign = lazy(() => import('./Pages/MarketingPage/CreateCampaign'));
const Returns = lazy(() => import('./Pages/Orders/Returns'));
const ReturnDetail = lazy(() => import('./Pages/Orders/ReturnDetail'));
const Account = lazy(() => import('./Pages/Account/account'));

// Create router configuration with Suspense boundary for each lazy-loaded component
const router = createBrowserRouter([
  {
    element: (
      <AuthProvider>
        <ProtectedRoute>
          <SocketProvider>
            <LivestreamSocketProvider>
              <OnboardingProvider>
                <TooltipProvider>
                  <Suspense fallback={<Loader />}>
                    <AppLayout />
                  </Suspense>
                </TooltipProvider>
              </OnboardingProvider>
            </LivestreamSocketProvider>
          </SocketProvider>
        </ProtectedRoute>
      </AuthProvider>
    ),
    errorElement: <Suspense fallback={<Loader />}><NotFoundPage /></Suspense>,

    children: [
      {
        path: '/',
        element: <Loader />,
      },
      {
        path: '/login',
        element: <Suspense fallback={<Loader />}><LoginPage /></Suspense>,
        loader: () => new Promise(resolve => setTimeout(resolve, 500)),
        errorElement: <Suspense fallback={<Loader />}><NotFoundPage /></Suspense>
      },
      {
        path: '/signup',
        element: <Suspense fallback={<Loader />}><SignUpPage /></Suspense>,
        loader: () => new Promise(resolve => setTimeout(resolve, 500)),
        errorElement: <Suspense fallback={<Loader />}><NotFoundPage /></Suspense>
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
            element: <Suspense fallback={<Loader />}><BusinessCategoryOnboarding /></Suspense>,
            loader: () => {
              return new Promise(resolve => setTimeout(() => resolve([]), 1000));
            },
            errorElement: <Suspense fallback={<Loader />}><NotFoundPage /></Suspense>
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
    initAllAnalytics();
  }, []);

  const handleConsentAccept = () => {
    // Get user data if available
    const seller = JSON.parse(localStorage.getItem('seller'));
    
    // Initialize all analytics systems with user data if available
    initAllAnalytics({
      userData: seller ? {
        id: seller._id,
        email: seller.email,
        firstName: seller.firstName,
        lastName: seller.lastName
      } : null
    });
  };

  const handleConsentDecline = () => {
    // On decline, we still initialize with minimal tracking options
    initAllAnalytics({
      mixpanelOptions: {
        track_pageview: false,
        autocapture: false
      }
    });
  };

  return (
    <ThemeProvider theme={theme}>
      <IntercomWrapper>
        <Suspense fallback={<Loader />}>
          <RouterProvider router={router} fallbackElement={<Loader />} />
          <Toaster />
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
