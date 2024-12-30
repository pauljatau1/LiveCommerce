import { Link, useNavigate, useLoaderData } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useAuthContext } from '../../Hooks/useAuthContext';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { fetchOnboardingProcess } from '../../Utilities/apiRestaurant';
import { BASE_URL } from '../../Constants/Server';
import Modal from '../../Components/Modal';
import Logo from '../../assets/auqli-official-logo.png';
import Background1 from '../../assets/background-asset1.png';
import Background2 from '../../assets/background-asset-3.png';
import Line1 from '../../assets/line1.png';
import OtpInput from 'react-otp-input';
import CircularProgress from '@mui/material/CircularProgress';
import axios from 'axios';


const LoginPage = () => {
  const { seller, otpStatus, verifyOtp, requestNewOtp, isLoading, login, resetPassword, token, isTokenValid } = useAuthContext();
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpCount, setOtpCount] = useState(0);
  const [email, setEmail] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [password, setPassword] = useState('');
  const [forgotPassword, setForgotPassword] = useState(false);
  const navigate = useNavigate();
  const onboardingProcess = useLoaderData();



  const onboardingStep = onboardingProcess?.onboardingProcess;


  //use effect to check if the otp status is pending and if the otp count is 0, if so, open the otp modal as a reroute from the login page
  useEffect(() => {
    if (otpStatus === "pending" && otpCount === 0) {
      setIsOtpModalOpen(true);
      setOtpCount((prev) => prev + 1);
    }
  }, [otpStatus, otpCount]);


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

  //function to submit the otp to verify new user
  const handleOtpSubmit = async () => {
    if (otp.length === 4 && seller !== null) {
      await verifyOtp(seller?.email, otp);
      setIsOtpModalOpen(false);
    } else {
      toast.error("Please fill in all fields");
    }
  }

  //function to submit the user data to login
  const handleLogin = async () => {
    if (email !== "" && password !== "") {
      await login(email, password);
    } else {
      toast.error("Please fill in all fields");
    }
  }

  const handleNewOtpRequest = async () => {
    if (seller !== null) {
      await requestNewOtp(seller?.email);
    } else {
      toast.error("You are unauthorized to request for a new OTP");
    }
  };

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
    <div>
      <img src={Background1} alt="Background" className="fixed inset-0- w-screen h-screen 2xl:h-[150dvh] object-cover object-center" />
      <img src={Background2} alt="Background" className="fixed inset-0 w-screen h-screen 2xl:h-[150dvh] object-none object-center" />
      <div className="px-4 sm:px-[44px] flex lg:flex-row gap-10 flex-col items-center justify-center sm:justify-between relative py-[21px] min-h-dvh">
        <Link className="flex justify-center lg:justify-start w-1/2 lg:w-1/3 md:mt-14 " to="/"><img src={Logo} alt="Auqli Logo" /></Link>
        <div className="bg-[#E9E9E914] backdrop-blur-[349.6px] rounded-[22px] px-4 sm:px-[50px] py-[40px] sm:py-[84px] w-full max-w-[755px] mx-4">
          <h1 className="text-[#FFFFFF] text-3xl sm:text-[47.64px] font-medium leading-tight sm:leading-[58.07px] mb-8 sm:mb-[96px] capitalize">Hey, Welcome Back</h1>
          <div className="flex flex-col">
            <p className="text-lg sm:text-xl font-light leading-normal sm:leading-[33.71px] text-[#FFFFFF]">Login With Email</p>
            <div className="flex flex-col gap-4 sm:gap-[26.69px] mt-6 sm:mt-[39.42px]">
              <div className="bg-white flex items-center gap-3 sm:gap-[19.65px] p-4 sm:p-5 rounded-full border-4 border-transparent focus-within:border-4 focus-within:border-[#BBC8D4] transition-all duration-300">
                <Icon icon="hugeicons:mail-01" className="w-6 sm:w-[29.48px] h-6 sm:h-[29.48px]" color='#141B3480' />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="bg-white focus:outline-none w-full h-full text-black text-sm sm:text-base [&:-webkit-autofill]:bg-white [&:-webkit-autofill]:shadow-[0_0_0_30px_white_inset]"
                />
              </div>
              <div className="bg-white flex items-center gap-3 sm:gap-[19.65px] p-4 sm:p-5 rounded-full border-4 border-transparent focus-within:border-4 focus-within:border-[#BBC8D4] transition-all duration-300">
                <Icon icon="hugeicons:square-lock-02" className="w-6 sm:w-[29.48px] h-6 sm:h-[29.48px]" color='#141B3480' />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="bg-white focus:outline-none w-full h-full text-black text-sm sm:text-base [&:-webkit-autofill]:bg-white [&:-webkit-autofill]:shadow-[0_0_0_30px_white_inset]"
                />
              </div>
              <button onClick={() => setForgotPassword(true)} className="text-xs sm:text-sm font-light leading-normal sm:leading-[21.86px] text-[#FFFFFF] self-end hover:underline">Forgot Password?</button>
            </div>
            <div className="flex items-center justify-center gap-[18px] mt-4 sm:mt-[23px] mb-6 sm:mb-[42px]">
              <div className="flex-1">
                <img src={Line1} alt="Line" className="w-full h-full" />
              </div>
              <p className="text-lg sm:text-xl font-medium text-[#FFFFFF] mx-[18px]">Or</p>
              <div className="flex-1">
                <img src={Line1} alt="Line" className="w-full h-full" />
              </div>
            </div>
            <button className="flex items-center justify-center gap-2 sm:gap-[14px] bg-transparent border-2 border-[#FFFFFF] rounded-full w-full py-4 sm:py-[22px]">
              <Icon icon="logos:google-icon" className="w-6 sm:w-[35.5px] h-6 sm:h-[35.5px]" />
              <p className="text-xl sm:text-3xl font-medium text-[#FFFFFF]">Google</p>
            </button>
            <p className="text-base sm:text-lg font-light leading-normal sm:leading-[21.86px] text-[#FFFFFF] text-center my-8 sm:my-[62px]">
              <Link to="/signup" className="text-base sm:text-lg font-medium leading-normal sm:leading-[21.86px] text-[#FFFFFF] hover:underline">Sign Up</Link>
              , If You Don&apos;t Have An Auqli Seller Account.
            </p>
            <button onClick={handleLogin} className="bg-transparent border-2 border-[#FFFFFF] text-[#FFFFFF] text-xl sm:text-2xl font-medium leading-normal sm:leading-[41.86px] rounded-full w-full py-4 sm:py-[22px] hover:bg-[#FFFFFF] hover:text-[#141B34] transition-all duration-300">
              {
                isLoading ? <CircularProgress color='white' className='w-6 sm:w-[35.5px] h-6 sm:h-[35.5px]' /> : "Continue"
              }
            </button>
          </div>
        </div>
      </div>
      {
        isOtpModalOpen && (
          <Modal>
            <h2 className="text-base sm:text-2xl mb-[15.61px] font-medium text-[#FFFFFF] leading-normal sm:leading-[21.86px] text-center">Verify Otp</h2>
            <p className="text-base sm:text-lg font-light leading-normal sm:leading-[21.86px] text-[#FFFFFF] text-center">we sent an OTP to {seller?.email}</p>
            <p className="text-base sm:text-lg font-light leading-normal sm:leading-[21.86px] text-[#FFFFFF] text-center">Please enter the OTP to continue</p>
            <div className="mb-5">
              <OtpInput
                value={otp}
                onChange={setOtp}
                numInputs={4}
                shouldAutoFocus={true}
                renderInput={(props, index) => (
                  <input
                    {...props}
                    className='w-12 h-12 lg:w-20 lg:h-20 rounded-md bg-transparent border-2 border-[#0BB248] text-center text-xl lg:text-3xl text-[#FFFFFF] focus:outline-none'
                    key={index}
                  />
                )}

                containerStyle={{
                  display: 'flex',
                  marginTop: '48px',
                  gap: '27px',
                }}
                skipDefaultStyles={true}
              />
            </div>
            <p className="text-base sm:text-lg font-light leading-normal sm:leading-[21.86px] text-[#FFFFFF] text-center mt-5">Didn&apos;t receive the OTP? <span className="text-[#0BB248] hover:underline cursor-pointer" onClick={handleNewOtpRequest}>Request New OTP</span></p>
            <button onClick={handleOtpSubmit} className="text-base sm:text-lg font-medium leading-normal sm:leading-[21.86px] text-[#FFFFFF] border-[1.4px] border-[#0BB248] rounded-full w-full py-4 sm:py-[22px] mt-10 flex items-center justify-center gap-4 md:gap-6 lg:gap-8 hover:transform hover:scale-95 transition-transform duration-300 ">
              {
                isLoading ? <CircularProgress color='white' /> : "Verify Code"
              }
            </button>
            <button onClick={() => setIsOtpModalOpen(false)} className="text-base sm:text-lg font-medium leading-normal sm:leading-[21.86px] text-[#FFFFFF] border-[1.4px] border-[#0BB248] rounded-full w-full py-4 sm:py-[22px] mt-5 flex items-center justify-center gap-4 md:gap-6 lg:gap-8 hover:transform hover:scale-95 transition-transform duration-300 ">cancel</button>
          </Modal>
        )
      }
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
              <button onClick={handleResetPasswordSubmit} className="px-5 mt-5 lg:px-10 py-4 sm:py-[22px] bg-transparent border-2 border-[#0BB248] text-[#FFFFFF] text-base sm:text-lg font-medium leading-normal sm:leading-[41.86px] rounded-full w-full hover:bg-[#FFFFFF] hover:text-[#141B34] transition-all duration-300">
                {
                  isLoading ? <CircularProgress color='white' size={20} /> : "Send Request"
                }
              </button>
              <button onClick={() => setForgotPassword(false)} className="text-base sm:text-lg font-medium leading-normal sm:leading-[21.86px] text-[#FFFFFF] border-[1.4px] border-[#0BB248] rounded-full w-full py-4 sm:py-[22px] flex items-center justify-center gap-4 md:gap-6 lg:gap-8 hover:transform hover:scale-95 transition-transform duration-300 ">cancel</button>
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
