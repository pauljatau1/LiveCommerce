import * as Sentry from '@sentry/react';
import App from './App.jsx';

const APP_STATE = import.meta.env.VITE_APP_STATE || 'development';

if (APP_STATE !== 'development') {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    sendDefaultPii: false,
    environment: APP_STATE,
    release: import.meta.env.VITE_RELEASE_HASH,
  });
}

export default function AppWithErrorBoundary() {
  if (APP_STATE === 'development') {
    return <App />;
  }

  return (
    <Sentry.ErrorBoundary showDialog={false}>
      <App />
    </Sentry.ErrorBoundary>
  );
}
