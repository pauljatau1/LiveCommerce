import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from '@/auth/login';
import MainLayout from '@/components/layouts/MainLayout';
import Dashboard from '@/pages/Dashboard';
// import Buyers from '@/pages/Buyers';
// import Sellers from '@/pages/Sellers';
// import Orders from '@/pages/Orders';
// import Products from '@/pages/Products';
// import Settings from '@/pages/Settings';

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/dashboard" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="buyers" element={<Buyers />} />
          <Route path="sellers" element={<Sellers />} />
          <Route path="orders" element={<Orders />} />
          <Route path="products" element={<Products />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
