import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/authContext';
import Login from '@/auth/login';
import Dashboard from '@/pages/dashboard';
import ProtectedRoute from './ProtectedRoute';
import MainLayout from '@/components/layouts/MainLayout';

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
            {/* Commented out routes for future implementation
            <Route path="buyers" element={<Buyers />} />
            <Route path="sellers" element={<Sellers />} />
            <Route path="orders" element={<Orders />} />
            <Route path="products" element={<Products />} />
            <Route path="settings" element={<Settings />} />
            */}
          </Route>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
