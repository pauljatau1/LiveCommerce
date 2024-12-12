import { Link, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useAuthContext } from '../../Contexts/AuthContext';
import Modal from '../../Components/Modal';
import Logo from '../../assets/auqli-official-logo.png';
import Background1 from '../../assets/background-asset1.png';
import Background2 from '../../assets/background-asset-3.png';
import Line1 from '../../assets/line1.png';


const LoginPage = () => {
  const { isAuthenticated } = useAuthContext();
  const navigate = useNavigate();

  if (isAuthenticated) {
    navigate('/dashboard', { replace: true });
  }

  return (
    <div>
      <img src={Background1} alt="Background" className="fixed inset-0- w-screen h-screen 2xl:h-[150dvh] object-cover object-center" />
      <img src={Background2} alt="Background" className="fixed inset-0 w-screen h-screen 2xl:h-[150dvh] object-none object-center" />
      <div className="px-4 sm:px-[44px] flex lg:flex-row gap-10 flex-col items-center justify-center sm:justify-between relative z-10 py-[21px] min-h-dvh">
        <img src={Logo} alt="Auqli Logo" className="w-1/2 lg:w-1/4" />
        <div className="bg-[#E9E9E914] backdrop-blur-[349.6px] rounded-[22px] px-4 sm:px-[50px] py-[40px] sm:py-[84px] w-full max-w-[755px] mx-4">
          <h1 className="text-[#FFFFFF] text-3xl sm:text-[47.64px] font-medium leading-tight sm:leading-[58.07px] mb-8 sm:mb-[96px] capitalize">Hey, Welcome Back</h1>
          <div className="flex flex-col">
            <p className="text-lg sm:text-xl font-light leading-normal sm:leading-[33.71px] text-[#FFFFFF]">Login With Email</p>
            <div className="flex flex-col gap-4 sm:gap-[26.69px] mt-6 sm:mt-[39.42px]">
              <div className="bg-white flex items-center gap-3 sm:gap-[19.65px] p-4 sm:p-5 rounded-full border-4 border-transparent focus-within:border-4 focus-within:border-[#BBC8D4] transition-all duration-300">
                <Icon icon="hugeicons:mail-01" className="w-6 sm:w-[29.48px] h-6 sm:h-[29.48px]" color='#141B3480' />
                <input
                  type="text"
                  placeholder="Email"
                  className="bg-white focus:outline-none w-full h-full text-black text-sm sm:text-base [&:-webkit-autofill]:bg-white [&:-webkit-autofill]:shadow-[0_0_0_30px_white_inset]"
                />
              </div>
              <div className="bg-white flex items-center gap-3 sm:gap-[19.65px] p-4 sm:p-5 rounded-full border-4 border-transparent focus-within:border-4 focus-within:border-[#BBC8D4] transition-all duration-300">
                <Icon icon="hugeicons:square-lock-02" className="w-6 sm:w-[29.48px] h-6 sm:h-[29.48px]" color='#141B3480' />
                <input
                  type="password"
                  placeholder="Password"
                  className="bg-white focus:outline-none w-full h-full text-black text-sm sm:text-base [&:-webkit-autofill]:bg-white [&:-webkit-autofill]:shadow-[0_0_0_30px_white_inset]"
                />
              </div>
              <Link className="text-xs sm:text-sm font-light leading-normal sm:leading-[21.86px] text-[#FFFFFF] self-end hover:underline">Forgot Password?</Link>
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
            <button className="bg-transparent border-2 border-[#FFFFFF] text-[#FFFFFF] text-xl sm:text-2xl font-medium leading-normal sm:leading-[41.86px] rounded-full w-full py-4 sm:py-[22px]">Continue</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
