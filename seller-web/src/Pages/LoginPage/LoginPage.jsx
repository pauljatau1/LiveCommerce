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



  const onboardingStep = onboardingProcess?.onboardingProcess;


  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    const storedToken = localStorage.getItem('sellerToken');
    const tokenData = storedToken ? JSON.parse(storedToken) : { data: null, isVerified: null };
    console.log("Token Data:", tokenData.data);
    const checkTokenValidity = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/seller/check-token`, {
          headers: {
            Authorization: `Bearer ${tokenData.data}`
          }
        }, { signal });
        if (response.status === 200) {
          if (tokenData.data && tokenData.isVerified === false && onboardingStep !== "") {
            //if the seller is logged in and the first time, redirect to the onboarding page
            if (onboardingStep) {
              navigate(`/${onboardingStep}`, { replace: true });
              setTimeout(() => {
                toast.success('Continue Onboarding', {
                  description: 'Continue from where you left off',
                  style: {
                    background: '#05031F',
                    color: '#fff',
                  }
                });
              }, 2500);
            } else {
              navigate('/onboarding', { replace: true });
            }
          } else if (tokenData.data && tokenData.isVerified === true) {
            navigate('/dashboard/home', { replace: true });
          } else {
            navigate('/onboarding', { replace: true });
          }
        } else if (response.status === 401) {
          console.log("Token is invalid");
          toast.error("Token is invalid", {
            description: "Please login again",
            style: {
              background: '#05031F',
              color: '#fff',
            }
          });
          navigate('/', { replace: true });
        }
      } catch (error) {
        console.log(error);
        toast.error('Token Verification Failed', {
          description: error.response?.data?.message || error.message,
          style: {
            background: '#05031F',
            color: '#fff',
          }
        });
      }
    }

    if (tokenData.data) {
      checkTokenValidity();
    } else if (token) {
      navigate('/onboarding', { replace: true });
    } else {
      console.log("No user found");
    }
    return () => controller.abort();
  }, [token, navigate, onboardingStep]);



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
      setForgotPassword(false);
      setResetEmail('');
    } else {
      toast.error("Please fill in all fields");
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
      {
        forgotPassword && (
          <Modal onClick={() => setForgotPassword(false)}>
            <h2 className="text-base sm:text-2xl mb-[15.61px] font-medium text-[#FFFFFF] leading-normal sm:leading-[21.86px] text-center">Forgot Password</h2>
            <p className="text-base sm:text-lg font-light leading-normal sm:leading-[21.86px] text-[#FFFFFF] text-center">Please input an email address where we can send follow-up instructions for a new password.</p>
            <div className="flex flex-col items-center justify-center gap-4 w-full sm:gap-[26.69px] mt-6 sm:mt-[39.42px]">
              <div className="bg-white w-full flex items-center gap-3 sm:gap-[19.65px] p-4 sm:p-5 rounded-full border-4 border-transparent focus-within:border-4 focus-within:border-[#BBC8D4] transition-all duration-300">
                <Icon icon="hugeicons:mail-01" className="w-6 sm:w-[29.48px] h-6 sm:h-[29.48px]" color='#141B3480' />
                <input
                  type="text"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="Email"
                  className="bg-white focus:outline-none w-full h-full text-black text-sm sm:text-base [&:-webkit-autofill]:bg-white [&:-webkit-autofill]:shadow-[0_0_0_30px_white_inset]"
                />
              </div>
              <button onClick={handleResetPasswordSubmit} className="px-5 mt-5 lg:px-10 py-4 sm:py-[22px] bg-transparent border-2 border-[#0BB248] text-[#FFFFFF] text-base sm:text-lg font-medium leading-normal sm:leading-[41.86px] rounded-lg w-full hover:bg-[#FFFFFF] hover:text-[#141B34] transition-all duration-300">
                {
                  isLoading ? <CircularProgress color='white' size={20} /> : "Send Request"
                }
              </button>
              <button onClick={() => setForgotPassword(false)} className="text-base sm:text-lg font-medium leading-normal sm:leading-[21.86px] text-[#FFFFFF] border-[1.4px] border-[#0BB248] rounded-lg w-full py-4 sm:py-[22px] flex items-center justify-center gap-4 md:gap-6 lg:gap-8 hover:transform hover:scale-95 transition-transform duration-300 ">cancel</button>
            </div>
          </Modal>
        )
      }
    </div>
  )
};

export async function Loader() {
  const onboardingProcess = await fetchOnboardingProcess();
  return onboardingProcess;
}

export default LoginPage
