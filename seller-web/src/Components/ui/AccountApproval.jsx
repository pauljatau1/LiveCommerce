import { useState, useEffect } from 'react';
import { useAuthContext } from '../../Hooks/useAuthContext';
import Icon from '../../assets/account-approval.png'

const AccountApproval = () => {
    const { seller } = useAuthContext();
    const [isAccountApproved, setIsAccountApproved] = useState(false);


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
                    <p className='text-base lg:text-2xl text-center text-[#05031F] font-normal mt-2 mb-4'>We have received your application and you are now ready to sell on Auqli! Access the dashboard and start selling!</p>
                    <button className='bg-[#05031F] text-white text-sm lg:text-base px-8 lg:px-10 py-4 rounded-md mt-4 mb-2 lg:mt-6 lg:mb-4 hover:transform hover:scale-95 transition-all duration-300'>Access Dashboard</button>
                </div>
            ) : (
                <div className='flex flex-col items-center justify-center gap-5 w-full'>
                    <img src={Icon} alt="Account Approved" className=' h-1/2' />
                    <h1 className='text-2xl lg:text-3xl text-center text-[#05031F] font-normal mt-4 mb-2 lg:mt-6 lg:mb-4'>Application In Review</h1>
                    <p className='text-base lg:text-2xl text-center text-[#05031F] font-normal mt-2 mb-4'>We have received your application, it would be reviewed by our support team and approved shortly.</p>
                    <button className='bg-[#05031F] text-white text-sm lg:text-base px-8 lg:px-10 py-4 rounded-md mt-4 mb-2 lg:mt-6 lg:mb-4 hover:transform hover:scale-95 transition-all duration-300'>Contact Support</button>
                </div>
            )}
        </div>
    )
}

export default AccountApproval
