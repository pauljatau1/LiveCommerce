import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth';
import Home from './pages/Home';
import './styles.css';

const Watch = lazy(() => import('./pages/Watch'));
const Auth = lazy(() => import('./pages/Auth'));
const Wallet = lazy(() => import('./pages/Wallet'));
const Orders = lazy(() => import('./pages/Orders'));

const Loading = () => <div className="center"><span className="mut">Loading…</span></div>;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/live/:streamId" element={<Watch />} />
            <Route path="/signin" element={<Auth />} />
            <Route path="/wallet" element={<Wallet />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>
);
