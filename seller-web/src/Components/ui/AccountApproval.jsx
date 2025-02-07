import { useState, useEffect } from 'react';
import { useAuthContext } from '../../Hooks/useAuthContext';
import { Link } from 'react-router-dom';
import Icon from '../../assets/account-approval.png'
import { CircularProgress } from '@mui/material';

const AccountApproval = () => {
    const { seller, isLoading, fetchSellerDetails, logout } = useAuthContext();
    const [isAccountApproved, setIsAccountApproved] = useState(false);

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
            {
                isLoading ? (
                    <CircularProgress className='text-[#05031F]' size={20} />
                ) : (
                    isAccountApproved ? (
                        <div className='flex flex-col items-center justify-center gap-5 w-full'>
                            <img src={Icon} alt="Account Approved" className='h-1/2' />
                            <h1 className='text-2xl lg:text-3xl text-center text-[#05031F] font-normal mt-4 mb-2 lg:mt-6 lg:mb-4'>Account Approved</h1>
                            <p className='text-base lg:text-2xl text-center text-[#05031F] font-normal mt-2 mb-4'>We have received your application and you have been approved to sell on Auqli! Access the dashboard and start selling!</p>
                            <Link to="/dashboard/home" className='bg-[#05031F] text-white text-sm lg:text-base px-8 lg:px-10 py-4 rounded-md mt-4 mb-2 lg:mt-6 lg:mb-4 hover:transform hover:scale-95 transition-all duration-300'>Access Dashboard</Link>
                        </div>
                    ) : (
                        <div className='flex flex-col items-center justify-center gap-5 w-full'>
                            <img src={Icon} alt="Account Approved" className=' h-1/2' />
                            <h1 className='text-2xl lg:text-3xl text-center text-[#05031F] font-normal mt-4 mb-2 lg:mt-6 lg:mb-4'>Application In Review</h1>
                            <p className='text-base lg:text-2xl text-center text-[#05031F] font-normal mt-2 mb-4'>We have received your application, it would be reviewed by our support team and approved shortly.</p>
                            <div className='flex items-center justify-center gap-10 mt-20 lg:mt-14 '>
                                <button onClick={logout} className='bg-transparent text-[#05031F] border border-[#05031F] rounded-md px-11 py-3 lg:py-4 hover:transform hover:scale-95 transition-all duration-300 cursor-pointer '>Logout</button>
                                <button className='bg-[#05031F] text-white rounded-md px-11 py-3 lg:py-4 hover:transform hover:scale-95 transition-all duration-300 cursor-pointer '>Contact Support</button>
                            </div>
                        </div>
                    )
                )
            }
        </div>
    )
}

export default AccountApproval
