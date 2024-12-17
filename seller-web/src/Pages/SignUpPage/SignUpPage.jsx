import { Link, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useAuthContext } from '../../Hooks/useAuthContext';
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Modal from '../../Components/Modal';
import Logo from '../../assets/auqli-official-logo.png';
import Background1 from '../../assets/background-asset1.png';
import Background2 from '../../assets/background-asset2.png';
import MailIcon from '../../assets/mail.png';
import Line1 from '../../assets/line1.png';
import CircularProgress from '@mui/material/CircularProgress';
import 'react-toastify/dist/ReactToastify.css';


const SignUpPage = () => {
  const navigate = useNavigate();
  const { createSeller, isLoading, seller, otpStatus } = useAuthContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [otpCount, setOtpCount] = useState(0);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
  });

  //use effect to check if the seller is authenticated and if the otp status is pending and if the otp count is 0, if so, open the otp modal as a reroute from the signup page
  useEffect(() => {
    if (seller !== null && otpStatus === "pending" && otpCount === 0) {
      setIsModalOpen(true);
      setOtpCount((prev) => prev + 1);
    }
  }, [seller, otpStatus, otpCount]);

  //function to submit the user data
  const submitUserData = async(event) => {
    event.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      //if passwords do not match, alert the user
      console.log('Passwords do not match');
      toast.error('Passwords do not match', {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
    } else if (formData.firstName === '' || formData.lastName === '' || formData.email === '' || formData.phoneNumber === '' || formData.password === '' || formData.confirmPassword === '') {
      //if any of the fields are empty, alert the user
      console.log('Please fill in all fields');
      toast.error('Please fill in all fields', {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });

    } else {
      //if the data is valid, create the seller
      await createSeller(formData.firstName, formData.lastName, formData.email, formData.password, formData.phoneNumber);
      //reset the form data
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        password: '',
        confirmPassword: '',
      });
    }
  }

  return (
    <div>
      <img src={Background1} alt="Background" className="fixed inset-0- w-screen h-screen 2xl:h-[150dvh] object-cover object-center" />
      <img src={Background2} alt="Background" className="fixed inset-0 w-screen h-screen 2xl:h-[150dvh] object-none object-center" />
      <div className="px-4 sm:px-[44px] flex lg:flex-row gap-10 flex-col items-center lg:items-start justify-center sm:justify-between relative py-[21px] min-h-dvh">
        <Link className='flex justify-center lg:justify-start w-1/2 lg:w-1/3 lg:mt-[30rem]' to="/"><img src={Logo} alt="Auqli Logo" /></Link>
        <div className="bg-[#E9E9E914] backdrop-blur-[349.6px] rounded-[22px] px-4 sm:px-[50px] py-[40px] sm:py-[84px] w-full max-w-[755px] mx-4">
          <h1 className="text-[#FFFFFF] text-3xl sm:text-[47.64px] font-medium leading-tight sm:leading-[58.07px] mb-8 sm:mb-[16px] capitalize">Create Account</h1>
          <div className="flex flex-col">
            <div className="flex flex-col gap-4 sm:gap-[36.69px] mt-6 sm:mt-[39.42px]">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-10">
                <div className="bg-white flex items-center grow gap-3 sm:gap-[19.65px] p-5 sm:p-6 rounded-full border-4 border-transparent focus-within:border-4 focus-within:border-[#BBC8D4] transition-all duration-300">
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="First Name"
                    className="bg-white focus:outline-none w-full h-full text-black text-sm sm:text-base [&:-webkit-autofill]:bg-white [&:-webkit-autofill]:shadow-[0_0_0_30px_white_inset]"
                  />
                </div>
                <div className="bg-white flex items-center grow gap-3 sm:gap-[19.65px] p-5 sm:p-6 rounded-full border-4 border-transparent focus-within:border-4 focus-within:border-[#BBC8D4] transition-all duration-300">
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Last Name"
                    className="bg-white focus:outline-none w-full h-full text-black text-sm sm:text-base [&:-webkit-autofill]:bg-white [&:-webkit-autofill]:shadow-[0_0_0_30px_white_inset]"
                  />
                </div>
              </div>
              <div className="bg-white flex items-center gap-3 sm:gap-[19.65px] p-4 sm:p-5 rounded-full border-4 border-transparent focus-within:border-4 focus-within:border-[#BBC8D4] transition-all duration-300">
                <Icon icon="hugeicons:mail-01" className="w-6 sm:w-[29.48px] h-6 sm:h-[29.48px]" color='#141B3480' />
                <input
                  type="text"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Email"
                  className="bg-white focus:outline-none w-full h-full text-black text-sm sm:text-base [&:-webkit-autofill]:bg-white [&:-webkit-autofill]:shadow-[0_0_0_30px_white_inset]"
                />
              </div>
              <div className="bg-white flex items-center gap-3 sm:gap-[19.65px] p-4 sm:p-5 rounded-full border-4 border-transparent focus-within:border-4 focus-within:border-[#BBC8D4] transition-all duration-300">
                <Icon icon="akar-icons:phone" className="w-6 sm:w-[29.48px] h-6 sm:h-[29.48px]" color='#141B3480' />
                <input
                  type="number"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  placeholder="Phone Number"
                  className="bg-white focus:outline-none w-full h-full text-black text-sm sm:text-base [&:-webkit-autofill]:bg-white [&:-webkit-autofill]:shadow-[0_0_0_30px_white_inset] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
              </div>
              <div className="bg-white flex items-center gap-3 sm:gap-[19.65px] p-4 sm:p-5 rounded-full border-4 border-transparent focus-within:border-4 focus-within:border-[#BBC8D4] transition-all duration-300">
                <Icon icon="hugeicons:square-lock-02" className="w-6 sm:w-[29.48px] h-6 sm:h-[29.48px]" color='#141B3480' />
                <input
                  type="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="bg-white focus:outline-none w-full h-full text-black text-sm sm:text-base [&:-webkit-autofill]:bg-white [&:-webkit-autofill]:shadow-[0_0_0_30px_white_inset]"
                />
              </div>
              <div className="bg-white flex items-center gap-3 sm:gap-[19.65px] p-4 sm:p-5 rounded-full border-4 border-transparent focus-within:border-4 focus-within:border-[#BBC8D4] transition-all duration-300">
                <Icon icon="hugeicons:square-lock-02" className="w-6 sm:w-[29.48px] h-6 sm:h-[29.48px]" color='#141B3480' />
                <input
                  type="password"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
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
              <Link to="/" className="text-base sm:text-lg font-medium leading-normal sm:leading-[21.86px] text-[#FFFFFF] hover:underline">Sign In</Link>
              , With Your Auqli Buyer Account If You Have One.
            </p>
            <button onClick={submitUserData} className="bg-transparent border-2 border-[#FFFFFF] text-[#FFFFFF] text-xl sm:text-2xl font-medium leading-normal sm:leading-[41.86px] rounded-full w-full py-4 sm:py-[22px] hover:bg-[#FFFFFF] hover:text-[#141B34] transition-all duration-300">
              {
                isLoading ? <CircularProgress color='white' className='w-6 sm:w-[35.5px] h-6 sm:h-[35.5px]' /> : 'Continue'
              }
            </button>
          </div>
        </div>
      </div>
      {
        isModalOpen && (
          <Modal>
            <img src={MailIcon} alt="Mail Icon" className="w-[83.5px] h-[83.5px] lg:w-[127px] lg:h-[127px] mb-10" />
            <h3 className="text-base sm:text-2xl font-medium text-[#FFFFFF] leading-normal sm:leading-[21.86px] text-center">
              {`We've sent a link to ${seller?.email}`}
            </h3>
            <p className="text-base sm:text-lg font-light leading-normal sm:leading-[21.86px] text-[#FFFFFF] text-center mt-2 ">Please verify your email address by clicking on the link we sent to your email.</p>
            <a href={`https://mail.google.com/mail/u/0/#inbox`} onClick={() => {
              navigate('/');
              setIsModalOpen(false);
            }} target="_blank" rel="noopener noreferrer" className="text-base sm:text-lg font-medium leading-normal sm:leading-[21.86px] text-[#FFFFFF] border-[1.4px] border-[#0BB248] rounded-full w-full py-4 sm:py-[22px] mt-10 flex items-center justify-center gap-4 md:gap-6 lg:gap-8 hover:transform hover:scale-95 transition-transform duration-300 ">Go to Gmail <Icon icon="radix-icons:arrow-top-right" width="25" height="25" color="#FFFFFF" /></a>

          </Modal>
        )
      }
    </div>
  )
}

export default SignUpPage
