import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux';
import './index.css'
import AppWithErrorBoundary from './AppWithErrorBoundary.jsx';
import store from './Redux/Store';
import { LivestreamSocketProvider } from './Contexts/LivestreamSocketContext';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
        <AppWithErrorBoundary />
    </Provider>
  </StrictMode>,
)
