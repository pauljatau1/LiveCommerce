import { useState } from 'react';
import { toast } from "sonner";
import { useOnboardingContext } from '../../Hooks/useOnboardingContext';
import { useNavigate } from 'react-router-dom';
import Step1 from '../../assets/onboarding-setp1.png';
import CircularProgress from '@mui/material/CircularProgress';
import { Tooltip, TooltipTrigger, TooltipContent } from '../../Components/ui/tooltip';

const BusinessOnboarding = () => {
    const navigate = useNavigate();
    const { registerBusinessBasicDetails, isLoading } = useOnboardingContext();
    const [businessName, setBusinessName] = useState('');
    const [businessType, setBusinessType] = useState('');
    const [businessTaxInformation, setBusinessTaxInformation] = useState('');

    //function to handle form submission
    const handleSubmit = async(e) => {
        e.preventDefault();
        if (businessName !== '' && businessType !== '' && businessTaxInformation !== '') {
            await registerBusinessBasicDetails(businessName, businessType, businessTaxInformation);
        } else {
            toast.error('Please fill in all fields', {
                description: 'All fields are required',
                style: {
                    background: '#2D3748',
                    color: '#fff',
                }
            });
        }
    }

    const handleBack = () => {
        navigate(-1);
    }

    return (
        <div className="py-[47.5px] lg:py-[135px] px-[32px] lg:px-[203.5px] ">
            <div className="flex flex-col items-center justify-center">
                <img src={Step1} alt="Step 1" className="w-full lg:w-[1000px]" />
                <div className="flex flex-col items-center justify-center mt-[64px] lg:mt-[125px] ">
                    <div className="flex flex-col items-center justify-center">
                        <h1 className="text-center text-2xl lg:text-3xl font-bold mb-4 text-[#2D3748] lg:mb-7 ">Business Details</h1>
                        <p className="text-center text-base lg:text-2xl font-light text-[#2D3748]">Let us know details about your business, with just these few questions</p>
                        <form className="w-full mt-14 lg:mt-28">
                            <div className="flex flex-col items-center justify-center mb-4 lg:mb-7">
                                <label htmlFor="businessName" className="text-base text-[#2D3748] lg:text-2xl font-light">Business Name</label>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder='Enter your business name' type="text" id="businessName" className="w-full border border-gray-300 rounded-full mt-2 lg:mt-4 py-5 lg:py-6 px-4 lg:px-8 focus:outline-none focus:border-[#2D3748] text-md lg:text-lg hover:border hover:border-[#2D3748] transition-all duration-500 cursor-pointer" />
                                    </TooltipTrigger>

                                    <TooltipContent className="bg-white/80 backdrop-blur-sm dark:bg-neutral-900/90">
                                        <p>Registered business name</p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                            <div className="flex flex-col items-center justify-center mb-4 lg:mb-7">
                                <label htmlFor="businessType" className="text-base text-[#2D3748] lg:text-2xl font-light">Business Type</label>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <input value={businessType} onChange={(e) => setBusinessType(e.target.value)} placeholder='Enter your business type' type="text" id="businessType" className="w-full border border-gray-300 rounded-full mt-2 lg:mt-4 py-5 lg:py-6 px-4 lg:px-8 focus:outline-none focus:border-[#2D3748] text-md lg:text-lg hover:border hover:border-[#2D3748] transition-all duration-500 cursor-pointer" />

                                    </TooltipTrigger>
                                    <TooltipContent className="bg-white/80 backdrop-blur-sm dark:bg-neutral-900/90">
                                        <p>e.g., LLC, Corporation</p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                            <div className="flex flex-col items-center justify-center mb-4 lg:mb-7">
                                <label htmlFor="businessTaxInfo" className="text-base text-[#2D3748] lg:text-2xl font-light">Business Tax Information</label>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <input value={businessTaxInformation} onChange={(e) => setBusinessTaxInformation(e.target.value)} placeholder='Enter your business tax information' type="text" id="businessTaxInfo" className="w-full border border-gray-300 rounded-full mt-2 lg:mt-4 py-5 lg:py-6 px-4 lg:px-8 focus:outline-none focus:border-[#2D3748] text-md lg:text-lg hover:border hover:border-[#2D3748] transition-all duration-300 cursor-pointer" />

                                    </TooltipTrigger>
                                    <TooltipContent className="bg-white/80 backdrop-blur-sm dark:bg-neutral-900/90">
                                        <p>Tax ID or VAT number, or use C.A.C B.N if you are in Nigeria</p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                            <div className="flex items-center justify-center gap-10 mt-20 lg:mt-14 ">
                                <button onClick={handleBack} className="bg-transparent text-[#2D3748] border border-[#2D3748] rounded-md px-11 py-3 lg:py-4 hover:transform hover:scale-95 transition-all duration-300 cursor-pointer ">Back</button>
                                <button onClick={handleSubmit} className="bg-[#2D3748] text-white rounded-md px-11 py-3 lg:py-4 hover:transform hover:scale-95 transition-all duration-300 cursor-pointer ">
                                    {
                                        isLoading ? <CircularProgress size={20} color='white' /> : 'Next'
                                    }
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default BusinessOnboarding;