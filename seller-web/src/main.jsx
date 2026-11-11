import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux';
import { CLASSIC_DASHBOARD } from './config/featureFlags';
if (CLASSIC_DASHBOARD) import('./index.css');
else import('./studio/base.css');
import './envBadge';
import AppWithErrorBoundary from './AppWithErrorBoundary.jsx';
import store from './Redux/Store';
import { GoogleOAuthProvider } from '@react-oauth/google';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <Provider store={store}>
          <AppWithErrorBoundary />
      </Provider>
    </GoogleOAuthProvider>
  </StrictMode>,
)
