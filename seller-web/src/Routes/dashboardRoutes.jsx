import { lazy } from 'react';
import { Navigate } from 'react-router-dom';
//import NotFoundPage from '../Pages/NotFoundPage/NotFoundPage';
import RouterErrorHandler from '../Components/RouterErrorHandler';
import { VariantsProvider } from '../Contexts/VariantContext';
import { LivestreamProvider } from '../Contexts/LivestreamContext';

const HomePage = lazy(() => import('../Pages/HomePage/HomePageV2'));
const Customers = lazy(() => import('../Pages/Customers/Customers'));
const CustomerDetail = lazy(() => import('../Pages/Customers/CustomerDetail'));
const OrdersDashboard = lazy(() => import('../Pages/Orders/Orders'));
const OrderDetails = lazy(() => import('../Pages/Orders/OrderDetails'));
const Returns = lazy(() => import('../Pages/Orders/Returns'));
const ReturnDetail = lazy(() => import('../Pages/Orders/ReturnDetail'));
const ProductsPageV2 = lazy(() => import('../Pages/ProductsPage/ProductsPageV2'));
const AddProduct = lazy(() => import('../Pages/ProductsPage/AddProductPage'));
const EditProduct = lazy(() => import('../Pages/ProductsPage/EditProductPage'));
//const Drafts = lazy(() => import('../Pages/ProductsPage/Drafts'));
//const Blips = lazy(() => import('../Pages/ProductsPage/Blips'));
const MarketingPage = lazy(() => import('../Pages/MarketingPage/MarketingPageV2'));
const Coupons = lazy(() => import('../Pages/MarketingPage/Coupons'));
const CouponsList = lazy(() => import('../Pages/MarketingPage/CouponsList'));
const InboxCampaigns = lazy(() => import('../Pages/MarketingPage/InboxCampaigns'));
const CreateCampaign = lazy(() => import('../Pages/MarketingPage/CreateCampaign'));
const Payout = lazy(() => import('../Pages/payout/Payout'));
const Messages = lazy(() => import('../Pages/messages/messages'));
const SettingsDashboard = lazy(() => import('../Pages/Settings/SettingsDashboard'));
const AnalyticsDashboard = lazy(() => import('../Pages/Analytics/anayltics'));
const Help = lazy(() => import('../Pages/help/help'));
const Account = lazy(() => import('../Pages/Account/account'));
const KycVerificationPage = lazy(() => import('../Pages/KycVerification/KycVerificationPage'));
const LiveStreamLayout = lazy(() => import('../Components/LiveStreamLayout'));
const LiveStream = lazy(() => import('../Pages/LiveStream/LiveStream'));
//const CreateLiveAuction = lazy(() => import('../Pages/LiveStream/CreateLiveAuction'));
const CreateLiveShow = lazy(() => import('../Pages/LiveStream/CreateLiveShow'));
const ScheduleShows = lazy(() => import('../Pages/LiveStream/ScheduleShows'));
const PastShows = lazy(() => import('../Pages/LiveStream/PastShows'));
const SubmitLiveShow = lazy(() => import('../Pages/LiveStream/SubmitLiveShow'));
//const SubmitLiveAuction = lazy(() => import('../Pages/LiveStream/SubmitLiveAuction'));
const LivestreamStudio = lazy(() => import('../Pages/LiveStream/LivestreamStudio'));
const NotificationsPage = lazy(() => import('../Pages/Notififcations/NotificationsPage'));
const ReferralPage = lazy(() => import('../Pages/ReferralPage/ReferralPage'));

export const dashboardRoutes = [
    {
        errorElement: <RouterErrorHandler />,
        children: [
            { index: true, element: <Navigate to="home" replace /> },
            { path: 'home', element: <HomePage /> },
            { path: 'customers',
                children: [
                    { index: true, element: <Navigate to="list" replace /> },
                    { path: 'list', element: <Customers /> },
                    { path: 'customer/:id', element: <CustomerDetail /> },
                ]   
             },
            { path: 'orders',
                children: [
                    { index: true, element: <Navigate to="list" replace /> },
                    { path: 'list', element: <OrdersDashboard /> },
                    { path: 'order/:id', element: <OrderDetails /> },
                ] 

            },
            { path: 'returns', element: <Returns /> },
            { path: 'return/:id', element: <ReturnDetail /> },
            {
                path: 'products',
                children: [
                    { index: true, element: <Navigate to="list" replace /> },
                    { path: 'list', element: <ProductsPageV2 /> },
                    {
                        path: 'edit-product/:id',
                        element: (
                            <VariantsProvider>
                                <EditProduct />
                            </VariantsProvider>
                        ),
                    },
                    {
                        path: 'add-products',
                        element: (
                            <VariantsProvider>
                                <AddProduct />
                            </VariantsProvider>
                        ),
                    },
                ]

            },
            //{ path: 'drafts', element: <Drafts /> },
            //{ path: 'blips', element: <Blips /> }, 
            { path: 'marketing', element: <MarketingPage /> },
            { path: 'referrals', element: <ReferralPage /> },

            {
                path: 'coupons',
                children: [
                    { index: true, element: <Navigate to="list" replace /> },
                    { path: 'list', element: <CouponsList /> },
                    { path: 'create', element: <Coupons /> },
                ],
            },
            {
                path: 'inbox-campaigns',
                children: [
                    { index: true, element: <Navigate to="list" replace /> },
                    { path: 'list', element: <InboxCampaigns /> },
                    { path: 'create', element: <CreateCampaign /> },
                ],
            },
            { path: 'earnings-payouts', element: <Payout /> },
            { path: 'messages', element: <Messages /> },
            {
                path: 'live-streams',
                element: (
                    <LivestreamProvider>
                        <LiveStreamLayout />
                    </LivestreamProvider>
                ),
                children: [
                    { index: true, element: <Navigate to="live-stream" replace /> },
                    { path: 'live-stream', element: <LiveStream /> },
                    {/** commented out create-live-auction and submit-live-auction routes' components and replaced with
                         NotFoundPage since live auctions is now a coming soon feature per management */},
                    {/* path: 'create-live-auction', element: <CreateLiveAuction/>}, */ },
                    { path: 'create-live-show', element: <CreateLiveShow /> },
                    { path: 'past-shows', element: <PastShows /> },
                    { path: 'scheduled-shows', element: <ScheduleShows /> },
                    { path: 'submit-live-show', element: <SubmitLiveShow /> },
                    {/* path: 'submit-live-auction', element: <SubmitLiveAuction/>}, */ },
                    { path: 'live-stream-studio/:id', element: <LivestreamStudio /> },
                ],
            },
            { path: 'settings', element: <SettingsDashboard /> },
            { path: 'account', element: <Account /> },
            { path: 'help', element: <Help /> },
            { path: 'analytics-insights', element: <AnalyticsDashboard /> },
            { path: 'kyc-verification/:id', element: <KycVerificationPage /> },
            { path: 'notifications', element: <NotificationsPage /> },
        ],
    },
];
