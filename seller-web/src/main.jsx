import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux';
import './index.css'
import AppWithErrorBoundary from './AppWithErrorBoundary.jsx';
import store from './Redux/Store';
import { LivestreamSocketProvider } from './Contexts/LivestreamSocketContext';
import { GoogleOAuthProvider } from '@react-oauth/google';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <Provider store={store}>
        <LivestreamSocketProvider>
          <AppWithErrorBoundary />
        </LivestreamSocketProvider>
      </Provider>
    </GoogleOAuthProvider>
  </StrictMode>,
)
