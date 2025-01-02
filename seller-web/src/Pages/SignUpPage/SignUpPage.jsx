import { Link, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useAuthContext } from '../../Hooks/useAuthContext';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Modal from '../../Components/Modal';
import Logo from '../../assets/auqli-official-logo.png';
import SignupImage from '../../assets/signup.png';
import MailIcon from '../../assets/mail.png';
import CircularProgress from '@mui/material/CircularProgress';
import PhoneInput from 'react-phone-input-2';
import OtpInput from 'react-otp-input';
import 'react-phone-input-2/lib/style.css';



const SignUpPage = () => {
  const navigate = useNavigate();
  const { createSeller, isLoading, seller, otpStatus, verifyOtp, requestNewOtp } = useAuthContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [otpCount, setOtpCount] = useState(0);
  const [otp, setOtp] = useState('');
  const [activateOtp, setActivateOtp] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    showPassword: false,
    showConfirmPassword: false
  });

  //use effect to check if the seller is authenticated and if the otp status is pending and if the otp count is 0, if so, open the otp modal as a reroute from the signup page
  useEffect(() => {
    if (seller !== null && otpStatus === "pending" && otpCount === 0) {
      setIsModalOpen(true);
      setOtpCount((prev) => prev + 1);
    }
  }, [seller, otpStatus, otpCount]);

  //function to submit the user data
  const submitUserData = async (event) => {
    event.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      //if passwords do not match, alert the user
      console.log('Passwords do not match');
      toast.error('Passwords do not match', {
        style: {
          backgroundColor: '#425466',
          color: '#F7FAFC',
          fontFamily: 'Inter',
          fontSize: '14px',
          fontWeight: '400',
        }
      });
    } else if (formData.firstName === '' || formData.lastName === '' || formData.email === '' || formData.phoneNumber === '' || formData.password === '' || formData.confirmPassword === '') {
      //if any of the fields are empty, alert the user
      console.log('Please fill in all fields');
      toast.error('Please fill in all fields',
        {
          style: {
            backgroundColor: '#425466',
            color: '#F7FAFC',
            fontFamily: 'Inter',
            fontSize: '14px',
            fontWeight: '400',
          }
        }
      );

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
  };

  //function to submit the otp to verify new user
  const handleOtpSubmit = async () => {
    if (otp.length === 4 && seller !== null) {
      await verifyOtp(seller?.email, otp);
      setIsModalOpen(false);
    } else {
      toast.error("Please fill in all fields");
    }
  };

  const handleNewOtpRequest = async () => {
    if (seller !== null) {
      await requestNewOtp(seller?.email);
    } else {
      toast.error("You are unauthorized to request for a new OTP");
    }
  };

  return (
    <div className='relative xl:flex' >
      <img src={SignupImage} alt="signup2" className='xl:hidden fixed inset-0 w-full h-screen object-cover object-center' />
      <img src={SignupImage} alt="SignUp" className='w-[414.614px] xl:w-1/2  min-h-screen object-cover object-center hidden xl:block  ' />
      <div className="hidden xl:fixed inset-x-0 xl:inset-auto xl:px-6 xl:flex flex-col z-10 justify-center items-center xl:items-start xl:justify-start xl:space-y-[300px] pt-5" >
        <img src={Logo} alt="Logo" className='w-[197.544px] 2xl:w-[300px] h-[60.779px] 2xl:h-[90px] ' />
        <h1 className=' hidden xl:block text-2xl 2xl:text-4xl font-bold text-center text-[#FFFFFF] xl:text-left xl:max-w-[500px] ' >I see you’re a first timer here.</h1>
      </div>
      <div className=" xl:static absolute inset-x-0 top-5 xl:inset-auto xl:flex flex-col z-10 items-center py-5 px-5 md:px-10 xl:w-1/2 " >
        <div className="mb-5 xl:hidden flex justify-center items-center" >
          <img src={Logo} alt="Logo" className='w-[197.544px] 2xl:w-[300px] h-[60.779px] 2xl:h-[90px] ' />
        </div>
        <div className=" bg-[#F7FAFC] p-5 md:p-10 rounded-lg w-full " >
          <h1 className='text-xl md:text-3xl font-semibold font-inter text-center' >Create your account</h1>
          <p className='text-sm md:text-base font-inter text-center' >It's free and easy</p>
          <form action="" className="w-full h-full mt-8" >
            <div className="flex flex-col md:flex-row gap-4 w-full mb-4 " >
              <div className="flex flex-col gap-2 w-full " >
                <label htmlFor="firstName" className='text-sm md:text-base font-inter text-[#425466] ' >First Name</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  placeholder='Enter your first name'
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className='w-full h-12 rounded-md border border-gray-300 p-2 text-sm md:text-base font-inter focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent placeholder:text-[#425466] placeholder:font-inter placeholder:text-sm' />
              </div>
              <div className="flex flex-col gap-2 w-full" >
                <label htmlFor="lastName" className='text-sm md:text-base font-inter text-[#425466] ' >Last Name</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  placeholder='Enter your last name'
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className='w-full h-12 rounded-md border border-gray-300 p-2 text-sm md:text-base font-inter focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent placeholder:text-[#425466] placeholder:font-inter placeholder:text-sm' />
              </div>
            </div>
            <div className="flex flex-col gap-2 w-full mb-4" >
              <label htmlFor="email" className='text-sm md:text-base font-inter text-[#425466] ' >Email</label>
              <input
                type="text"
                id="email"
                name="email"
                value={formData.email}
                placeholder='Enter your email'
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className='w-full h-12 rounded-md border border-gray-300 p-2 text-sm md:text-base font-inter focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent placeholder:text-[#425466] placeholder:font-inter placeholder:text-sm' />
            </div>
            <div className="flex flex-col gap-2 w-full mb-4" >
              <label htmlFor="phoneNumber" className='text-sm md:text-base font-inter text-[#425466]'>Phone Number</label>
              <PhoneInput
                country={'ng'}
                value={formData.phoneNumber}
                onChange={(phone) => setFormData({ ...formData, phoneNumber: phone })}
                inputStyle={{
                  width: '100%',
                  height: '48px',
                  fontSize: '14px',
                  borderRadius: '6px',
                  border: '1px solid #E2E8F0',
                  backgroundColor: 'white'
                }}
                containerStyle={{
                  width: '100%'
                }}
                inputClass="focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent placeholder:text-[#425466] placeholder:font-inter placeholder:text-sm"
              />
            </div>
            <div className="flex flex-col gap-2 w-full mb-4" >
              <label htmlFor="password" className='text-sm md:text-base font-inter text-[#425466]'>Password</label>
              <div className="relative">
                <input
                  type={formData.showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  placeholder='Enter your password'
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className='w-full h-12 rounded-md border border-gray-300 p-2 text-sm md:text-base font-inter focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent placeholder:text-[#425466] placeholder:font-inter placeholder:text-sm'
                />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, showPassword: !formData.showPassword })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  <Icon icon={formData.showPassword ? "mdi:eye-off" : "mdi:eye"} width="20" height="20" />
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-2 w-full mb-4" >
              <label htmlFor="confirmPassword" className='text-sm md:text-base font-inter text-[#425466]'>Confirm Password</label>
              <div className="relative">
                <input
                  type={formData.showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  placeholder='Enter your password'
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className='w-full h-12 rounded-md border border-gray-300 p-2 text-sm md:text-base font-inter focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent placeholder:text-[#425466] placeholder:font-inter placeholder:text-sm'
                />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, showConfirmPassword: !formData.showConfirmPassword })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  <Icon icon={formData.showConfirmPassword ? "mdi:eye-off" : "mdi:eye"} width="20" height="20" />
                </button>
              </div>
            </div>
            <div className="flex items-start gap-2 mb-6">
              <input
                type="checkbox"
                id="terms"
                className="mt-1"
              />
              <label htmlFor="terms" className="text-sm text-[#425466] font-inter">
                By creating an account means you agree to the{' '}
                <Link className="text-[#425466] font-bold hover:underline">
                  Terms and Conditions
                </Link>
                , and our{' '}
                <Link className="text-[#425466] font-bold hover:underline">
                  Privacy Policy
                </Link>
              </label>
            </div>

            <button
              type="submit"
              onClick={submitUserData}
              className="w-full bg-[#0BB248] text-white font-semibold text-sm md:text-base font-inter py-3 rounded-md hover:bg-green-600 transition-colors mb-4"
            >
              {
                isLoading ? <CircularProgress color="#FFFFFF" size={20} /> : "Register"
              }
            </button>

            <div className="text-center mb-4">
              <span className="text-sm text-gray-500">or</span>{' '}
              <Link to="/" className="text-[#0BB248] font-inter text-sm md:text-base font-bold hover:underline">
                Sign In
              </Link>
            </div>
            <div className="flex justify-center gap-4">
              <button
                type="button"
                className="p-2 border rounded-full hover:bg-gray-50 transition-colors"
              >
                <img src="https://cdn.cdnlogo.com/logos/g/35/google-icon.svg" alt="Google" className="w-6 h-6" />
              </button>
              <button
                type="button"
                className="p-2 border rounded-full hover:bg-gray-50 transition-colors"
              >
                <img src="https://cdn.cdnlogo.com/logos/a/12/apple.svg" alt="Apple" className="w-6 h-6" />
              </button>
              <button
                type="button"
                className="p-2 border rounded-full hover:bg-gray-50 transition-colors"
              >
                <img src="https://cdn.cdnlogo.com/logos/f/91/facebook-icon.svg" alt="Facebook" className="w-6 h-6" />
              </button>
            </div>
          </form>

        </div>
      </div>
      {
        isModalOpen && (
          <Modal>
            <img src={MailIcon} alt="Mail Icon" className="w-[83.5px] h-[83.5px] lg:w-[127px] lg:h-[127px] mb-10" />
            <h3 className="text-base sm:text-2xl font-medium text-[#FFFFFF] leading-normal sm:leading-[21.86px] text-center">
              {`We've sent a link to ${seller?.email}`}
            </h3>
            <p className="text-base sm:text-lg font-light leading-normal sm:leading-[21.86px] text-[#FFFFFF] text-center mt-4 ">Please verify your email address by clicking on the link we sent to your email and inputting the code we sent to your email.</p>
            {
              activateOtp ? (
                <>
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
                  <button onClick={handleOtpSubmit} className="text-base sm:text-lg font-medium leading-normal sm:leading-[21.86px] text-[#FFFFFF] border-[1.4px] border-[#0BB248] rounded-md w-full py-4 sm:py-[22px] mt-10 flex items-center justify-center gap-4 md:gap-6 lg:gap-8 hover:transform hover:scale-95 transition-transform duration-300 ">
                    {
                      isLoading ? <CircularProgress color='white' size={20} /> : "Verify Code"
                    }
                  </button>
                  <button onClick={() => setIsModalOpen(false)} className="text-base sm:text-lg font-medium leading-normal sm:leading-[21.86px] text-[#FFFFFF] border-[1.4px] border-[#0BB248] rounded-md w-full py-4 sm:py-[22px] mt-5 flex items-center justify-center gap-4 md:gap-6 lg:gap-8 hover:transform hover:scale-95 transition-transform duration-300 ">cancel</button>
                </>
              ) : (
                <>
                  <a href={`https://mail.google.com/mail/u/0/#inbox`}
                    target="_blank" rel="noopener noreferrer"
                    className="text-base sm:text-lg font-medium leading-normal sm:leading-[21.86px] text-[#FFFFFF] bg-[#0BB248] rounded-md w-full py-4 sm:py-[22px] mt-10 flex items-center justify-center gap-4 md:gap-6 lg:gap-8 hover:transform hover:scale-95 transition-transform duration-300 ">Go to Gmail <Icon icon="radix-icons:arrow-top-right" width="25" height="25" color="#FFFFFF" />
                  </a>
                  <button onClick={() => setActivateOtp(true)} className="text-base sm:text-lg font-medium leading-normal sm:leading-[21.86px] text-[#FFFFFF] border border-[#0BB248] rounded-md w-full py-4 sm:py-[22px] mt-5 flex items-center justify-center gap-4 md:gap-6 lg:gap-8 hover:transform hover:scale-95 transition-transform duration-300 ">Input Code</button>
                </>
              )
            }
          </Modal>
        )
      }

    </div>
  )
}

export default SignUpPage
