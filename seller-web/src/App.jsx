import { AuthProvider } from './Contexts/AuthContext';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import LoginPage from './Pages/LoginPage/LoginPage';
import SignUpPage from './Pages/SignUpPage/SignUpPage';
import DashBoard from './Pages/DashBoard/DashBoard';
import AppLayout from './Components/AppLayout';
import ProtectedRoute from './Components/ProtectedRoute';
import NotFoundPage from './Pages/NotFoundPage/NotFoundPage';

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    errorElement: <NotFoundPage />,
    children: [
      {
        path: '/',
        element: <LoginPage />
      },
      {
        path: '/signup',
        element: <SignUpPage />
      },
      {
        path: '/dashboard',
        // use the protected route to guard other children routes that need protection with the useAuthContext hook
        element: <ProtectedRoute><DashBoard /></ProtectedRoute>,
        
      }
    ]
  }
]);

const App = () => {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}

export default App
