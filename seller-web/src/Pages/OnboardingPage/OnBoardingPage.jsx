import { useState } from 'react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import { useOnboardingContext } from "../../Hooks/useOnboardingContext"
import MobileApp from '../../assets/mobile-app-pic.png';
import GooglePlay from '../../assets/playstore.png';
import AppleStore from '../../assets/app-store.png';
import CircularProgress from '@mui/material/CircularProgress';
import Background from '../../assets/signup.png';
import Logo from '../../assets/auqli-official-logo.png';

const OnBoardingPage = () => {
  const { registerAccountType, isLoading } = useOnboardingContext();
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState('business');


  const handleNextButton = async () => {
    await registerAccountType(accountType);
  };

  return (
    <div className="flex flex-col xl:flex-row justify-between">
      <div className=" w-full h-full xl:w-1/2 relative">
        <img src={Background} alt="Background" className="w-full min-h-[109dvh] object-cover object-center" />
        <div className="absolute inset-0 m-auto h-fit w-full px-10 py-2">
          <img src={Logo} alt="Logo" className="w-[197.544px] 2xl:w-[300px] h-[60.779px] 2xl:h-[90px] " />
          <div className="mt-14 xl:mt-[174px] " >
            <h1 className='text-2xl xl:text-[40px] font-bold text-white font-inter'>Apply To Sell</h1>
            <p className='text-base xl:text-xl font-inter text-white mt-4 xl:mt-8 max-w-[327px] '>Which option best describe who you are?</p>
          </div>
          <div className="mt-[38.22px] md:mt-[55.2px]">
            <label onClick={() => setAccountType('business')} className={`flex items-center justify-between py-[18px] px-[17.5px] md:py-[31px] md:px-[35px] border-[0.65px] rounded-lg cursor-pointer mb-[17.61px] lg:mb-[28.22px] border-[#0BB248] ${accountType === 'business' ? 'bg-[#FFFFFF]' : 'bg-transparent'}`}>
              <p className={`text-xl xl:text-2xl font-medium ${accountType === 'business' ? 'text-[#05031F]' : 'text-[#FFFFFF]'}`} >Business</p>
              <input type="radio" defaultChecked={accountType === 'business'} className={`appearance-none w-[25px] h-[25px] border-4 border-[#0BB248] rounded-full ${accountType === 'business' ? 'bg-[#FFFFFF] border-4 ring-2 ring-[#0BB248]' : 'bg-transparent'}`} />
            </label>
            <label onClick={() => setAccountType('individual')} className={`flex items-center justify-between py-[18px] px-[17.5px] md:py-[31px] md:px-[35px] border-[0.65px] rounded-lg cursor-pointer border-[#0BB248] ${accountType === 'individual' ? 'bg-[#FFFFFF]' : 'bg-transparent'}`}>
              <p className={`text-xl xl:text-2xl font-medium ${accountType === 'individual' ? 'text-[#05031F]' : 'text-[#FFFFFF]'}`}>Individual</p>
              <input type="radio" defaultChecked={accountType === 'individual'} className={`appearance-none w-[25px] h-[25px] border-4 border-[#0BB248] rounded-full ${accountType === 'individual' ? 'bg-[#FFFFFF] border-4 ring-2 ring-[#0BB248]' : 'bg-transparent'}`} />
            </label>
          </div>
          <div className="flex items-center gap-[10px] mt-10 lg:mt-12 ">
            <Icon icon="ep:info-filled" color='#34A853' className="text-[#FFFFFF] w-[30.81px] h-[30.81px] md:w-[41.63px] md:h-[41.63px] " />
            <p className="text-lg md:text-xl font-light text-[#FFFFFF]">Useful Tips</p>
          </div>
          <ul className="list-disc pl-5">
            <li className="text-sm md:text-base font-extralight text-[#FFFFFF] mt-5 lg:mt-7 ">Choose "Business" if you have a registered business in your country of origin or residence</li>
            <li className="text-sm md:text-base font-extralight text-[#FFFFFF] mt-5 lg:mt-7 ">Choose "individual" if you are a sole prop or just an individual looking to sell.</li>
          </ul>
          <button onClick={handleNextButton} className="bg-[#0BB248] text-[#FFFFFF] text-base font-light py-[12px] px-[35px] md:py-[14px] md:px-[55px] rounded-md mt-10 lg:mt-12 hover:bg-[#0BB248]/80 transition-all duration-300 ease-in-out ">
            {
              isLoading ? <CircularProgress color='white' size={20} /> : "Next"
            }
          </button>
        </div>
      </div>
      <div className="hidden xl:flex flex-col w-1/2 justify-center items-center gap-10 " >
        <h1 className='text-2xl xl:text-[40px] font-bold text-[#27272E] font-inter'>Download Our Mobile App</h1>
        <p className='text-base xl:text-xl font-inter text-[#27272E] mt-4 xl:mt-8 max-w-[327px] '>It’s free and easy</p>
        <img src={MobileApp} alt="Mobile App" className='w-[501px] h-[597px] object-cover object-center mt-10 xl:mt-12' />
        <div className='flex items-center gap-[30px] mt-10 lg:mt-12 '>
          <button className="hover:scale-105 transition-all duration-300">
            <img src={GooglePlay} alt="google play" className="w-[167px] h-[52.5px]" />
          </button>
          <button className="hover:scale-105 transition-all duration-300">
            <img src={AppleStore} alt="apple store" className="w-[167px] h-[52.5px]" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default OnBoardingPage
