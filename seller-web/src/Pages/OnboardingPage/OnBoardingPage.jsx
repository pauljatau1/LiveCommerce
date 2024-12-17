import { useState } from 'react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import { useOnboardingContext } from "../../Hooks/useOnboardingContext"
import MobileApp from '../../assets/mobile-app-pic.png';
import GooglePlay from '../../assets/playstore.png';
import AppleStore from '../../assets/app-store.png';
import CircularProgress from '@mui/material/CircularProgress';

const OnBoardingPage = () => {
  const { registerAccountType, isLoading } = useOnboardingContext();
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState('business');


  const handleNextButton = async() => {
    await registerAccountType(accountType);
  };

  return (
    <div className="bg-gradient-to-br from-[#05031F] from-[30%] to-[#34A853] to-[100%] min-h-screen bg-fixed bg-no-repeat bg-cover h-full w-full py-[72.5px] lg:py-[145px] px-[32.5px] lg:px-[65px] xl:flex xl:flex-row xl:justify-between xl:gap-56  ">
      <div className="3xl:relative">
        <div>
          <h1 className="text-3xl font-bold text-[#FFFFFF] leading-[41.86px] mb-[15.61px] lg:mb-[38.22px] ">Apply To Sell</h1>
          <p className="text-base font-light leading-[21.86px] text-[#FFFFFF]">Which option best describe who you are?</p>
        </div>
        <div className="mt-[38.22px] md:mt-[55.2px]">
          <label onClick={() => setAccountType('business')} className={`flex items-center justify-between py-[18px] px-[17.5px] md:py-[31px] md:px-[35px] bg-transparent border-[0.65px] rounded-full cursor-pointer mb-[17.61px] lg:mb-[28.22px] ${accountType === 'business' ? 'border-[#0BB248]' : 'border-[#FFFFFF]'}`}>
            <p className="text-2xl font-light text-[#FFFFFF]">Business</p>
            <input type="radio" defaultChecked={accountType === 'business'} className={`appearance-none w-[20px] h-[20px] border-[0.65px] border-[#FFFFFF] rounded-full ${accountType === 'business' ? 'bg-[#FFFFFF] border-none ring-2 ring-[#0BB248]' : 'bg-transparent'}`} />
          </label>
          <label onClick={() => setAccountType('individual')} className={`flex items-center justify-between py-[18px] px-[17.5px] md:py-[31px] md:px-[35px] bg-transparent border-[0.65px] rounded-full cursor-pointer ${accountType === 'individual' ? 'border-[#0BB248]' : 'border-[#FFFFFF]'}`}>
            <p className="text-2xl font-light text-[#FFFFFF]">Individual</p>
            <input type="radio" defaultChecked={accountType === 'individual'} className={`appearance-none w-[20px] h-[20px] border-[0.65px] border-[#FFFFFF] rounded-full ${accountType === 'individual' ? 'bg-[#FFFFFF] border-none ring-2 ring-[#0BB248]' : 'bg-transparent'}`} />
          </label>
        </div>
        <div className="3xl:relative">
          <div className="flex items-center gap-[10px] mt-10 lg:mt-12 ">
            <Icon icon="ep:info-filled" color='#34A853' className="text-[#FFFFFF] w-[30.81px] h-[30.81px] md:w-[41.63px] md:h-[41.63px] " />
            <p className="text-lg md:text-xl font-light text-[#FFFFFF]">Useful Tips</p>
          </div>
          <ul className="list-disc pl-5">
            <li className="text-sm md:text-base font-extralight text-[#FFFFFF] mt-5 lg:mt-7 ">Choose "Business" if you have a registered business in your country of origin or residence</li>
            <li className="text-sm md:text-base font-extralight text-[#FFFFFF] mt-5 lg:mt-7 ">Choose "individual" if you are a sole prop or just an individual looking to sell.</li>
          </ul>
        </div>
        <button onClick={handleNextButton} className="bg-[#0BB248] text-[#FFFFFF] text-base font-light py-[12px] px-[35px] md:py-[14px] md:px-[55px] rounded-md mt-10 lg:mt-12 3xl:absolute 3xl:bottom-0 3xl:left-0 ">
          {
            isLoading ? <CircularProgress color='white' size={20} /> : "Next"
          }
        </button>
      </div>
      <div className="hidden xl:flex flex-col items-center justify-center">
        <h3 className='text-2xl font-normal text-[#FFFFFF] leading-[41.86px] mb-[38.61px] '>Download Our Mobile App</h3>
        <img src={MobileApp} alt="mobile app" className='w-[501px] h-[537px]' />
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
