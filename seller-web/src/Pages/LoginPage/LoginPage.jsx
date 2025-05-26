import { Link, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useAuthContext } from '../../Hooks/useAuthContext';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useIntercomChat } from '../../Hooks/useIntercom';
import { Tooltip, TooltipTrigger, TooltipContent } from '../../Components/ui/tooltip';
import Modal from '../../Components/Modal';
import Logo from '../../assets/auqli-official-logo.png';
import LoginImage from '../../assets/login-image.png';
import CircularProgress from '@mui/material/CircularProgress';
import Emoji from '../../assets/Emoji -_.png'
import OtpInput from 'react-otp-input';




const LoginPage = () => {
  const { initVisitor } = useIntercomChat();
  const { isLoading, login, resetPassword, resetPasswordWithOtp, isForgotPasswordRequestSuccessful, passwordResetSuccessful, dispatch } = useAuthContext();
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');

  const [resetEmail, setResetEmail] = useState('');
  const [password, setPassword] = useState('');
  const [forgotPassword, setForgotPassword] = useState(false);
  const navigate = useNavigate();
  const [otp, setOtp] = useState('');
  const [isOtpEntered, setIsOtpEntered] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');



  useEffect(() => {
    // Clear any token error handling flags to prevent error messages
    localStorage.removeItem('tokenErrorHandled');
    
    // If user is coming to login page directly, we can clear any stale tokens
    // but don't show error messages
    const wasRedirected = document.referrer.includes(window.location.host);
    if (!wasRedirected) {
      // This is a direct login access, clear tokens and set a flag
      localStorage.removeItem('sellerToken');
      localStorage.removeItem('seller');
      // Set a session flag to indicate this is a fresh login page access
      sessionStorage.setItem('directLoginAccess', 'true');
    }
    
    initVisitor();
    
    // Cleanup function to remove the flag when component unmounts
    return () => {
      sessionStorage.removeItem('directLoginAccess');
    };
  }, []);


  useEffect(() => {
    if (passwordResetSuccessful) {
      setForgotPassword(false);
      setIsOtpEntered(false);
      setNewPassword('');
      setConfirmPassword('');
      setOtp('');
      setResetEmail('');
      setEmail('');
      setPassword('');
    }
  }, [passwordResetSuccessful]);




  const handleCancel = () => {
    setForgotPassword(false);
    setIsOtpEntered(false);
    setNewPassword('');
    setConfirmPassword('');
    setOtp('');
    setEmail('');
    setPassword('');
    setResetEmail('');
    dispatch({ type: 'CANCEL_RESET_PASSWORD' });

  }


  //function to submit the user data to login


  const handleLogin = async (event) => {
    event.preventDefault();
    if (email !== "" && password !== "") {
      await login(email, password);
    } else {
      toast.error("Please fill in all fields");
    }
  }


  const handleResetPasswordSubmit = async () => {
    if (resetEmail !== "") {
      await resetPassword(resetEmail);
    } else {
      toast.error("Please fill in all fields");
    }
  }

  const handleOtpSubmit = () => {
    setIsOtpEntered(true);
  }

  const handleNewPasswordSubmit = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
    } else {
      const resetData = {
        email: resetEmail,
        code: otp,
        newPassword: newPassword,
      }
      console.log(resetData);
      await resetPasswordWithOtp(resetData);

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
            <div className="flex flex-col gap-2 w-full mb-4">
              <label htmlFor="email" className='text-sm md:text-base font-inter text-[#425466]'>
                Email
              </label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <input
                    type="text"
                    id="email"
                    name="email"
                    value={email}
                    placeholder='Enter your email'
                    onChange={(e) => setEmail(e.target.value)}
                    className='w-full h-12 rounded-md bg-[#EDF2F7] p-2 text-sm md:text-base font-inter focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent placeholder:text-[#425466] placeholder:font-inter placeholder:text-sm'
                  />
                </TooltipTrigger>
                <TooltipContent className="bg-white/80 backdrop-blur-sm dark:bg-neutral-900/90">
                  <p>Registered email address</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex flex-col gap-2 w-full mb-4">
              <label htmlFor="password" className='text-sm md:text-base font-inter text-[#425466]'>
                Password
              </label>
              <Tooltip>
                <TooltipTrigger asChild>
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
                </TooltipTrigger>
                <TooltipContent className="bg-white/80 backdrop-blur-sm dark:bg-neutral-900/90">
                  <p>At least 8 characters</p>
                </TooltipContent>
              </Tooltip>
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
              <span className="text-sm text-gray-500">Forgot Password? </span>{' '}
              <button onClick={(event) => {
                event.preventDefault();
                setForgotPassword(true);

              }} className="text-[#0BB248] font-inter text-sm font-bold hover:underline">
                Reset
              </button>
            </div>
            <div className="text-center mt-10 mb-4">
              <span className="text-sm text-gray-500">Don't have an account? </span>{' '}
              <Link to="/signup" className="text-[#0BB248] font-inter text-sm md:text-base font-bold hover:underline">
                create
              </Link>
            </div>
            {/* <div className="flex justify-center gap-4">
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
            </div> */}
          </form>
        </div>
        {/* jsjs */}
      </div>
      {
        forgotPassword && (
          <Modal onClick={() => setForgotPassword(false)}>
            <div className="bg-white p-8 rounded-xl w-full max-w-[500px]">
              <h2 className="text-base sm:text-2xl mb-4 font-semibold text-[#425466] leading-normal sm:leading-[21.86px] text-center">Forgot Password</h2>
              <p className="text-sm sm:text-base font-light leading-normal sm:leading-[21.86px] text-[#425466] text-center mb-8">Please input an email address where we can send follow-up instructions for a new password.</p>
              <div className="flex flex-col items-center justify-center gap-4 w-full sm:gap-[26.69px]">
                {
                  isForgotPasswordRequestSuccessful ? (
                    <>
                      {
                        !isOtpEntered && (
                          <div className="w-full">
                            <p className="text-sm text-[#425466] mb-4 text-center">Enter the verification code sent to your email</p>
                            <OtpInput
                              value={otp}
                              onChange={setOtp}
                              numInputs={4}
                              shouldAutoFocus={true}
                              renderInput={(props, index) => (
                                <Tooltip key={index}>
                                  <TooltipTrigger asChild>
                                    <input
                                      {...props}
                                      className='w-12 h-12 lg:w-16 lg:h-16 rounded-md bg-[#EDF2F7] border-2 border-[#0BB248] text-center text-xl lg:text-2xl text-[#425466] focus:outline-none focus:ring-2 focus:ring-[#0BB248]'
                                    />
                                  </TooltipTrigger>
                                  <TooltipContent className="bg-white/80 backdrop-blur-sm dark:bg-neutral-900/90">
                                    <p>Verification code</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                              containerStyle={{
                                display: 'flex',
                                justifyContent: 'center',
                                gap: '16px',
                                marginTop: '16px',
                              }}
                              skipDefaultStyles={true}
                            />
                          </div>
                        )
                      }
                      {
                        isOtpEntered && (
                          <>
                            <div className="w-full">
                              <label className="text-sm text-[#425466] mb-2 block">New Password</label>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter new password"
                                    className="w-full h-12 rounded-md bg-[#EDF2F7] p-4 text-sm md:text-base font-inter focus:outline-none focus:ring-2 focus:ring-[#0BB248] focus:border-transparent placeholder:text-[#425466] placeholder:font-inter placeholder:text-sm"
                                  />
                                </TooltipTrigger>
                                <TooltipContent className="bg-white/80 backdrop-blur-sm dark:bg-neutral-900/90">
                                  <p>Minimum 8 characters</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <div className="w-full">
                              <label className="text-sm text-[#425466] mb-2 block">Confirm Password</label>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm new password"
                                    className="w-full h-12 rounded-md bg-[#EDF2F7] p-4 text-sm md:text-base font-inter focus:outline-none focus:ring-2 focus:ring-[#0BB248] focus:border-transparent placeholder:text-[#425466] placeholder:font-inter placeholder:text-sm"
                                  />
                                </TooltipTrigger>
                                <TooltipContent className="bg-white/80 backdrop-blur-sm dark:bg-neutral-900/90">
                                  <p>Must match new password</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </>
                        )
                      }
                    </>
                  ) : (
                    <div className="w-full">
                      <label className="text-sm text-[#425466] mb-2 block">Email Address</label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <input
                            type="email"
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            placeholder="Enter your email"
                            className="w-full h-12 rounded-md bg-[#EDF2F7] p-4 text-sm md:text-base font-inter focus:outline-none focus:ring-2 focus:ring-[#0BB248] focus:border-transparent placeholder:text-[#425466] placeholder:font-inter placeholder:text-sm"
                          />
                        </TooltipTrigger>
                        <TooltipContent className="bg-white/80 backdrop-blur-sm dark:bg-neutral-900/90">
                          <p>Registered email address</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  )
                }
                {
                  isForgotPasswordRequestSuccessful ? (
                    <>
                      {
                        !isOtpEntered && (
                          <button onClick={handleOtpSubmit} className="w-full bg-[#0BB248] text-white font-semibold text-sm md:text-base font-inter py-3 rounded-md hover:bg-green-600 transition-colors mt-4">
                            {
                              isLoading ? <CircularProgress color='white' size={20} /> : "Verify Code"
                            }
                          </button>
                        )
                      }
                      {
                        isOtpEntered && (
                          <button onClick={handleNewPasswordSubmit} className="w-full bg-[#0BB248] text-white font-semibold text-sm md:text-base font-inter py-3 rounded-md hover:bg-green-600 transition-colors mt-4">
                            {
                              isLoading ? <CircularProgress color='white' size={20} /> : "Reset Password"
                            }
                          </button>
                        )
                      }
                    </>
                  ) : (
                    <button onClick={handleResetPasswordSubmit} className="w-full bg-[#0BB248] text-white font-semibold text-sm md:text-base font-inter py-3 rounded-md hover:bg-green-600 transition-colors mt-4">
                      {
                        isLoading ? <CircularProgress color='white' size={20} /> : "Send Reset Link"
                      }
                    </button>
                  )
                }
                <button 
                  onClick={handleCancel} 
                  className="w-full border border-[#0BB248] text-[#0BB248] font-semibold text-sm md:text-base font-inter py-3 rounded-md hover:bg-[#EDF2F7] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </Modal>
        )
      }
    </div>
  )
};

export default LoginPage
