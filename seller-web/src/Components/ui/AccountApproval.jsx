import { useState, useEffect } from 'react';
import { useAuthContext } from '../../Hooks/useAuthContext';
import { Link } from 'react-router-dom';
import { Crisp } from "crisp-sdk-web";

import Icon from '../../assets/account-approval.png'

const AccountApproval = () => {
    const { seller, fetchSellerDetails } = useAuthContext();
    const [isAccountApproved, setIsAccountApproved] = useState(false);
    const WEBSITE_ID = "1e433cca-97ba-42a7-bac7-b3ea79d648f1"

    // Crisp will be displayed
    Crisp.configure(WEBSITE_ID, {
        autoLoad: false,
    });

    useEffect(() => {
        const fetchDetails = async () => {
            await fetchSellerDetails();
        }
        fetchDetails();
    }, []);
    
    
    
    useEffect(() => {
        if (seller) {
            setIsAccountApproved(seller.isVerified);
        }
    }, [seller])


    return (
        <div className='flex flex-col items-center justify-center h-screen px-[50px] lg:px-[203.5px] w-full'>
            {isAccountApproved ? (
                <div className='flex flex-col items-center justify-center gap-5 w-full'>
                    <img src={Icon} alt="Account Approved" className='h-1/2' />
                    <h1 className='text-2xl lg:text-3xl text-center text-[#05031F] font-normal mt-4 mb-2 lg:mt-6 lg:mb-4'>Account Approved</h1>
                    <p className='text-base lg:text-2xl text-center text-[#05031F] font-normal mt-2 mb-4'>We have received your application and you have been approved to sell on Auqli! Access the dashboard and start selling!</p>
                    <Link to="/dashboard/home"  className='bg-[#05031F] text-white text-sm lg:text-base px-8 lg:px-10 py-4 rounded-md mt-4 mb-2 lg:mt-6 lg:mb-4 hover:transform hover:scale-95 transition-all duration-300'>Access Dashboard</Link>
                </div>
            ) : (
                <div className='flex flex-col items-center justify-center gap-5 w-full'>
                    <img src={Icon} alt="Account Approved" className=' h-1/2' />
                    <h1 className='text-2xl lg:text-3xl text-center text-[#05031F] font-normal mt-4 mb-2 lg:mt-6 lg:mb-4'>Application In Review</h1>
                    <p className='text-base lg:text-2xl text-center text-[#05031F] font-normal mt-2 mb-4'>We have received your application, it would be reviewed by our support team and approved shortly.</p>
                    <button onMouseOver={() => Crisp.message.show("text", "Can I help?!")} onClick={() => Crisp.chat.open()} className='bg-[#05031F] text-white text-sm lg:text-base px-8 lg:px-10 py-4 rounded-md mt-4 mb-2 lg:mt-6 lg:mb-4 hover:transform hover:scale-95 transition-all duration-300'>Contact Support</button>
                </div>
            )}
        </div>
    )
}

export default AccountApproval
