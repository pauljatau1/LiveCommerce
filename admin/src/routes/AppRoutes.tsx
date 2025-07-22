import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/authContext';
import Login from '@/auth/login';
import Register from '@/auth/register';
import Dashboard from '@/pages/dashboard';
import Sellers from '@/pages/sellers';
import SellerDetail from '@/pages/sellerDetail';
import Categories from '@/pages/categories';
import MajorCategories from '@/pages/majorCategories';
import ProtectedRoute from './ProtectedRoute';
import MainLayout from '@/components/layouts/MainLayout';
import Buyers from '@/pages/buyers';
import BuyerDetail from '@/pages/buyerDetail';
import Orders from '@/pages/orders';
import Products from '@/pages/products';
import Blips from '@/pages/blips';
import Streams from '@/pages/streams';
import Withdrawals from '@/pages/withdrawals';
import Announcements from '@/pages/announcements';
import Resources from '@/pages/resources';
import Banners from '@/pages/banners';
import OrderDetail from '@/pages/orderDetail';
import Returns from '@/pages/returns';
import ReturnDetail from '@/pages/returnDetail';
import BankRequests from '@/pages/bankrequests';
import Payments from '@/pages/payments';
import RefundRequests from '@/pages/refund-requests';
import ReturnRequests from '@/pages/ReturnRequests';
import PickupRequests from '@/pages/pickupRequests';
import BuyerNotifications from '@/pages/buyerNotifications';
import TerminalShipments from '@/pages/terminalShipments';
import { useAuth } from '@/context/authContext';

// Logout component that will clear localStorage and redirect to login
const Logout = () => {
  const { logout } = useAuth();
  
  // Call logout immediately when component renders
  useEffect(() => {
    logout();
  }, [logout]);
  
  return <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/create-admin" element={<Register />} />
          <Route path="/logout" element={<Logout />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="/dashboard/sellers" element={<Sellers />} />
            <Route path="/dashboard/seller/:id" element={<SellerDetail />} />
            <Route path="/dashboard/categories" element={<Categories />} />
            <Route path="/dashboard/major-categories" element={<MajorCategories />} />
            <Route path="/dashboard/buyers" element={<Buyers />} />
            <Route path="/dashboard/buyer-detail/:id" element={<BuyerDetail />} />
            <Route path="/dashboard/orders" element={<Orders />} />
            <Route path="/dashboard/products" element={<Products />} />
            <Route path="/dashboard/blips" element={<Blips />} />
            <Route path="/dashboard/streams" element={<Streams />} />
            <Route path="/dashboard/withdrawals" element={<Withdrawals />} />
            <Route path="/dashboard/announcements" element={<Announcements />} />
            <Route path="/dashboard/resources" element={<Resources />} />
            <Route path="/dashboard/banners" element={<Banners />} />
            <Route path="/dashboard/order-detail/:id" element={<OrderDetail />} />
            <Route path="/dashboard/returns" element={<Returns />} />
            <Route path="/dashboard/return-detail/:id" element={<ReturnDetail />} />
            <Route path="/dashboard/bankrequests" element={<BankRequests />} />
            <Route path="/dashboard/payments" element={<Payments />} />
            <Route path="/dashboard/refund-requests" element={<RefundRequests />} />
            <Route path="/dashboard/return-requests" element={<ReturnRequests />} />
            <Route path="/dashboard/pickup-requests" element={<PickupRequests />} />
            <Route path="/dashboard/buyer-notifications" element={<BuyerNotifications />} />
            <Route path="/dashboard/terminal-shipments" element={<TerminalShipments />} />
          </Route>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
