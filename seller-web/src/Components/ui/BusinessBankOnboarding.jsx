import { useState } from 'react';
import { useOnboardingContext } from '../../Hooks/useOnboardingContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import CircularProgress from '@mui/material/CircularProgress';
import Step4 from '../../assets/Step4.png'

const BusinessBankOnboarding = () => {
    const navigate = useNavigate();
    const { submitBankDetails, isLoading } = useOnboardingContext();
    const [bankDetails, setBankDetails] = useState({
        bankName: '',
        bankCountry: '',
        bankAccountType: "",
        accountCurrency: "",
        accountNumber: "",
        accountName: "",
        swiftCode: "",
        bankIdentifierCode: "",
    })

    const handleChange = (e) => {
        const { name, value } = e.target;
        setBankDetails(prev => ({
            ...prev,
            [name]: value
        }));
    };

    console.log(bankDetails);


    const handleSubmit = async (e) => {
        e.preventDefault();
        if (bankDetails.bankName !== '' && bankDetails.bankCountry !== '' && bankDetails.bankAccountType !== '' && bankDetails.accountCurrency !== '' && bankDetails.accountNumber !== '' && bankDetails.accountName !== '' && bankDetails.swiftCode !== '' && bankDetails.bankIdentifierCode !== '') {
            await submitBankDetails(bankDetails);
        } else {
            toast.error('Please fill in all fields', {
                description: 'All fields are required',
                style: {
                    background: '#05031F',
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
                <img src={Step4} alt="Step 4" className="w-full lg:w-[1000px]" />
                <div className="flex flex-col items-center justify-center mt-[64px] lg:mt-[125px] ">
                    <div className="flex flex-col items-center justify-center">
                        <h1 className="text-center text-2xl lg:text-3xl font-bold mb-4 lg:mb-7">Bank Details</h1>
                        <p className="text-center text-base lg:text-2xl font-light">Let us know details about your business, with just these few questions</p>
                        <form className="w-full mt-14 lg:mt-28">
                            <div className="flex flex-col items-center justify-center mb-4 lg:mb-7">
                                <label htmlFor="bankCountry" className="text-base lg:text-2xl font-light">Bank Country</label>
                                <input 
                                    type="text" 
                                    id="bankCountry"
                                    name="bankCountry"
                                    placeholder='Enter Bank Country'
                                    value={bankDetails.bankCountry}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-full mt-2 lg:mt-4 py-5 lg:py-6 px-4 lg:px-8 focus:outline-none focus:border-primary text-md lg:text-lg hover:border hover:border-[#05031F] transition-all duration-500 cursor-pointer"
                                />
                            </div>
                            <div className="flex flex-col items-center justify-center mb-4 lg:mb-7">
                                <label htmlFor="bankName" className="text-base lg:text-2xl font-light">Bank Name</label>
                                <input 
                                    type="text"
                                    id="bankName"
                                    name="bankName"
                                    placeholder='Enter Bank Name'
                                    value={bankDetails.bankName}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-full mt-2 lg:mt-4 py-5 lg:py-6 px-4 lg:px-8 focus:outline-none focus:border-primary text-md lg:text-lg hover:border hover:border-[#05031F] transition-all duration-500 cursor-pointer"
                                />
                            </div>
                            <div className="flex flex-col items-center justify-center mb-4 lg:mb-7">
                                <label htmlFor="bankAccountType" className="text-base lg:text-2xl font-light">Bank Account Type</label>
                                <input 
                                    type="text"
                                    id="bankAccountType"
                                    name="bankAccountType"
                                    placeholder='Enter Bank Account Type'
                                    value={bankDetails.bankAccountType}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-full mt-2 lg:mt-4 py-5 lg:py-6 px-4 lg:px-8 focus:outline-none focus:border-primary text-md lg:text-lg hover:border hover:border-[#05031F] transition-all duration-500 cursor-pointer"
                                />
                            </div>
                            <div className="flex flex-col items-center justify-center mb-4 lg:mb-7">
                                <label htmlFor="bankAccountCurrency" className="text-base lg:text-2xl font-light">Account Currency</label>
                                <input 
                                    type="text"
                                    id="accountCurrency"
                                    name="accountCurrency"
                                    placeholder='Enter Account Currency'
                                    value={bankDetails.accountCurrency}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-full mt-2 lg:mt-4 py-5 lg:py-6 px-4 lg:px-8 focus:outline-none focus:border-primary text-md lg:text-lg hover:border hover:border-[#05031F] transition-all duration-500 cursor-pointer"
                                />
                            </div>
                            <div className="flex flex-col md:flex-row gap-4 w-full">
                                <div className="flex flex-col items-center justify-center mb-4 lg:mb-7 w-full">
                                    <label htmlFor="bankAccountNumber" className="text-base lg:text-2xl font-light">Account No.</label>
                                    <input 
                                        type="text"
                                        id="accountNumber"
                                        name="accountNumber"
                                        placeholder='Enter Account No.'
                                        value={bankDetails.accountNumber}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-full mt-2 lg:mt-4 py-5 lg:py-6 px-4 lg:px-8 focus:outline-none focus:border-primary text-md lg:text-lg hover:border hover:border-[#05031F] transition-all duration-500 cursor-pointer"
                                    />
                                </div>
                                <div className="flex flex-col items-center justify-center mb-4 lg:mb-7 w-full">
                                    <label htmlFor="bankAccountHolderName" className="text-base lg:text-2xl font-light">Account Name</label>
                                    <input 
                                        type="text"
                                        id="accountName"
                                        name="accountName"
                                        placeholder='Enter Account Name'
                                        value={bankDetails.accountName}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-full mt-2 lg:mt-4 py-5 lg:py-6 px-4 lg:px-8 focus:outline-none focus:border-primary text-md lg:text-lg hover:border hover:border-[#05031F] transition-all duration-500 cursor-pointer"
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col md:flex-row gap-4 w-full">
                                <div className="flex flex-col items-center justify-center mb-4 lg:mb-7 w-full">
                                    <label htmlFor="bankSwiftCode" className="text-base lg:text-2xl font-light">Swift Code</label>
                                    <input 
                                        type="text"
                                        id="swiftCode"
                                        name="swiftCode"
                                        placeholder='Enter Swift Code'
                                        value={bankDetails.swiftCode}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-full mt-2 lg:mt-4 py-5 lg:py-6 px-4 lg:px-8 focus:outline-none focus:border-primary text-md lg:text-lg hover:border hover:border-[#05031F] transition-all duration-500 cursor-pointer"
                                    />
                                </div>
                                <div className="flex flex-col items-center justify-center mb-4 lg:mb-7 w-full">
                                    <label htmlFor="bankIdentifierCode" className="text-base lg:text-2xl font-light">Bank Identifier Code</label>
                                    <input 
                                        type="text"
                                        id="bankIdentifierCode"
                                        name="bankIdentifierCode"
                                        placeholder='Enter Bank Identifier Code'
                                        value={bankDetails.bankIdentifierCode}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-full mt-2 lg:mt-4 py-5 lg:py-6 px-4 lg:px-8 focus:outline-none focus:border-primary text-md lg:text-lg hover:border hover:border-[#05031F] transition-all duration-500 cursor-pointer"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center justify-center gap-10 mt-20 lg:mt-14">
                                <button type="button" onClick={handleBack} className="bg-transparent text-[#0BB248] border border-[#0BB248] rounded-md px-11 py-3 lg:py-4 hover:transform hover:scale-95 transition-all duration-300 cursor-pointer">Back</button>
                                <button type="submit" onClick={handleSubmit} className="bg-[#0BB248] text-white rounded-md px-11 py-3 lg:py-4 hover:transform hover:scale-95 transition-all duration-300 cursor-pointer">
                                    {
                                        isLoading ? <CircularProgress size={20} color='white' /> : 'Finish'
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

export default BusinessBankOnboarding
