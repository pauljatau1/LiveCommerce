import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../Hooks/useAuthContext';
import { useState } from 'react';
import { toast } from 'sonner';
import Logo from '../../assets/auqli-official-logo.png';
import CircularProgress from '@mui/material/CircularProgress';

const TempLoginPage = () => {
  const { login, isLoading } = useAuthContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (event) => {
    event.preventDefault();
    if (email !== "" && password !== "") {
      try {
        await login(email, password);
        navigate('/studio');
      } catch (error) {
        toast.error("Login failed. Please try again.");
      }
    } else {
      toast.error("Please fill in all fields");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#17171B] to-[#17171B]/90 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="flex justify-center mb-8">
          <img src={Logo} alt="Logo" className="h-12" />
        </div>
        <h2 className="text-2xl font-semibold text-center mb-2">Temporary Login</h2>
        <p className="text-gray-500 text-center mb-8">Please login again to continue</p>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0BB248] focus:border-transparent"
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0BB248] focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#0BB248] text-white py-3 rounded-lg hover:bg-[#0BB248]/90 transition-all duration-300 flex items-center justify-center"
          >
            {isLoading ? <CircularProgress size={24} className="text-white" /> : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TempLoginPage; 