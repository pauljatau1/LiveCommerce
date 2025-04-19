import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/authContext';
import Login from '@/auth/login';
import Dashboard from '@/pages/dashboard';
import Sellers from '@/pages/sellers';
import Categories from '@/pages/categories';
import ProtectedRoute from './ProtectedRoute';
import MainLayout from '@/components/layouts/MainLayout';
import Buyers from '@/pages/buyers';
import Orders from '@/pages/orders';
import Products from '@/pages/products';
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

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
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
            <Route path="/dashboard/categories" element={<Categories />} />
            <Route path="/dashboard/buyers" element={<Buyers />} />
            <Route path="/dashboard/orders" element={<Orders />} />
            <Route path="/dashboard/products" element={<Products />} />
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
          </Route>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
