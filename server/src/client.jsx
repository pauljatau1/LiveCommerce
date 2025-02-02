import { Link, useNavigate, useLoaderData } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useAuthContext } from '../../Hooks/useAuthContext';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { fetchOnboardingProcess } from '../../Utilities/apiRestaurant';
import { BASE_URL } from '../../Constants/Server';
import Modal from '../../Components/Modal';
import Logo from '../../assets/auqli-official-logo.png';
import LoginImage from '../../assets/login-image.png';
import CircularProgress from '@mui/material/CircularProgress';
import axios from 'axios';
import Emoji from '../../assets/Emoji -_.png'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../Components/ui/dialog';

const LoginPage = () => {
  const { seller, otpStatus, verifyOtp, requestNewOtp, isLoading, login, resetPassword, token, isTokenValid } = useAuthContext();
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [password, setPassword] = useState('');
  const [forgotPassword, setForgotPassword] = useState(false);
  const navigate = useNavigate();
  const onboardingProcess = useLoaderData();

  // Forgot password states
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  //function to submit the user data to login
  const handleLogin = async (event) => {
    event.preventDefault();
    if (email !== "" && password !== "") {
      await login(email, password);
    } else {
      toast.error("Please fill in all fields");
    }
  }

  // Step 1: Request reset code
  const handleRequestResetCode = async () => {
    if (!resetEmail) {
      return toast.error('Please enter your email');
    }
    
    setResetLoading(true);
    try {
      await axios.post(`${BASE_URL}/api/seller/forgot-password`, { 
        email: resetEmail 
      });
      toast.success('Reset code sent to your email');
      setIsForgotPasswordOpen(false);
      setIsResetPasswordOpen(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send reset code');
    } finally {
      setResetLoading(false);
    }
  }

  // Step 2: Reset password with code
  const handleResetPassword = async () => {
    if (!resetCode || resetCode.length !== 4) {
      return toast.error('Please enter a valid 4-digit code');
    }
    if (!newPassword || newPassword.length < 8) {
      return toast.error('Password must be at least 8 characters');
    }

    setResetLoading(true);
    try {
      await axios.post(`${BASE_URL}/api/seller/reset-password`, {
        email: resetEmail,
        code: resetCode,
        newPassword
      });
      toast.success('Password reset successfully');
      setIsResetPasswordOpen(false);
      // Clear states
      setResetEmail('');
      setResetCode('');
      setNewPassword('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <div className="relative xl:flex ">
      <img src={LoginImage} alt="login2" className='xl:hidden fixed inset-0 w-full h-screen object-cover object-center' />
      <img src={LoginImage} alt="login" className='w-[414.614px] xl:w-1/2 h-screen object-cover object-center hidden xl:block  ' />
      <div className="hidden xl:block z-40 absolute top-1/2 left-20 -translate-y-1/2" >
        <img src={Logo} alt="Logo" className='w-[197.544px] 2xl:w-[300px] h-[60.779px] 2xl:h-[90px] ' />
      </div>
      <div className=" xl:static fixed inset-0 m-auto h-full xl:inset-auto flex flex-col justify-center items-center z-10 py-5 px-5 md:px-10 xl:w-1/2 overflow-y-auto " >
        <div className="mb-5  xl:hidden flex justify-center items-center" >
          <img src={Logo} alt="Logo" className='w-[197.544px] 2xl:w-[300px] h-[60.779px] 2xl:h-[90px] ' />
        </div>
        <div className="xl:container xl:max-w-[680px] 2xl:max-w-[800px] py-5 px-10 md:py-20 md:px-28 xl:py-10 xl:px-24 rounded-lg w-full flex flex-col justify-center bg-[#F7FAFC] xl:bg-transparent " >
          <div className='flex flex-col' >
            <img src={Emoji} alt="Emoji" className='w-10 h-10 mb-4 xl:mb-8' />
            <h1 className='text-xl md:text-3xl font-semibold font-inter' >Welcome Back!</h1>
            <p className='text-sm md:text-base font-inter' >Let's build something great</p>
          </div>
          <form className="w-full mt-8" >
            <div className="flex flex-col gap-2 w-full mb-4" >
              <label htmlFor="email" className='text-sm md:text-base font-inter text-[#425466] ' >Email</label>
              <input
                type="text"
                id="email"
                name="email"
                value={email}
                placeholder='Enter your email'
                onChange={(e) => setEmail(e.target.value)}
                className='w-full h-12 rounded-md bg-[#EDF2F7]  p-2 text-sm md:text-base font-inter focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent placeholder:text-[#425466] placeholder:font-inter placeholder:text-sm' />
            </div>
            <div className="flex flex-col gap-2 w-full mb-4" >
              <label htmlFor="password" className='text-sm md:text-base font-inter text-[#425466]'>Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={password}
                  placeholder='Enter your password'
                  onChange={(e) => setPassword(e.target.value)}
                  className='w-full h-12 rounded-md bg-[#EDF2F7] p-2 text-sm md:text-base font-inter focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent placeholder:text-[#425466] placeholder:font-inter placeholder:text-sm'
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  <Icon icon={showPassword ? "mdi:eye-off" : "mdi:eye"} width="20" height="20" />
                </button>
              </div>
            </div>
            <button
              type="submit"
              onClick={handleLogin}
              className="w-full bg-[#0BB248] text-white font-semibold text-sm md:text-base font-inter py-3 rounded-md hover:bg-green-600 transition-colors mb-4"
            >
              {
                isLoading ? <CircularProgress color="#FFFFFF" size={20} /> : "Sign In"
              }
            </button>

            <div className="text-center xl:text-right mb-4">
              <span className="text-sm text-gray-500">Forgot Password? </span>
              <button 
                onClick={() => setIsForgotPasswordOpen(true)} 
                className="text-[#0BB248] font-inter text-sm font-bold hover:underline"
              >
                Reset
              </button>
            </div>
            <div className="text-center mt-10 mb-4">
              <span className="text-sm text-gray-500">Don't have an account? </span>{' '}
              <Link to="/signup" className="text-[#0BB248] font-inter text-sm md:text-base font-bold hover:underline">
                create
              </Link>
            </div>
            <div className="flex justify-center gap-4">
              <button
                type="button"
                className="p-2 border rounded-full hover:bg-gray-50 transition-colors"
              >
                <img src="https://cdn.cdnlogo.com/logos/g/35/google-icon.svg" alt="Google" className="w-6 h-6" />
              </button>
              <button
                type="button"
                className="p-2 border rounded-full hover:bg-gray-50 transition-colors"
              >
                <img src="https://cdn.cdnlogo.com/logos/a/12/apple.svg" alt="Apple" className="w-6 h-6" />
              </button>
              <button
                type="button"
                className="p-2 border rounded-full hover:bg-gray-50 transition-colors"
              >
                <img src="https://cdn.cdnlogo.com/logos/f/91/facebook-icon.svg" alt="Facebook" className="w-6 h-6" />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Step 1: Email Collection Dialog */}
      <Dialog open={isForgotPasswordOpen} onOpenChange={setIsForgotPasswordOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Enter your email to receive a reset code
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full p-2 border rounded"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
              />
              <button
                onClick={handleRequestResetCode}
                disabled={resetLoading}
                className="w-full bg-[#0BB248] text-white p-2 rounded hover:bg-green-600"
              >
                {resetLoading ? <CircularProgress size={20} /> : 'Send Reset Code'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Step 2: Reset Code and New Password Dialog */}
      <Dialog open={isResetPasswordOpen} onOpenChange={setIsResetPasswordOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reset Your Password</DialogTitle>
            <DialogDescription>
              Enter the 4-digit code sent to your email and your new password
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Reset Code</label>
                <input
                  type="text"
                  maxLength={4}
                  placeholder="Enter 4-digit code"
                  className="w-full p-2 border rounded text-center text-2xl tracking-[1em]"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    className="w-full p-2 border rounded"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <Icon icon={showPassword ? "mdi:eye-off" : "mdi:eye"} />
                  </button>
                </div>
              </div>
              <button
                onClick={handleResetPassword}
                disabled={resetLoading}
                className="w-full bg-[#0BB248] text-white p-2 rounded hover:bg-green-600 mt-2"
              >
                {resetLoading ? <CircularProgress size={20} /> : 'Reset Password'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
};

export async function Loader() {
  const onboardingProcess = await fetchOnboardingProcess();
  return onboardingProcess;
}

export default LoginPage
