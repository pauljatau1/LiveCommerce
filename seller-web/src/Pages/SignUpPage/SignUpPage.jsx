import { Link, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import eyeIcon from '@iconify-icons/mdi/eye';
import eyeOffIcon from '@iconify-icons/mdi/eye-off';
import { useAuthContext } from '../../Hooks/useAuthContext';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Logo from '../../assets/auqli-official-logo.png';
import SignupImage from '../../assets/signup.png';
import CircularProgress from '@mui/material/CircularProgress';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { Tooltip, TooltipTrigger, TooltipContent } from '../../Components/ui/tooltip';

// Add phone number validation utilities
const isValidNigerianPhoneNumber = (phone) => {
  if (!phone) return false;
  // Remove any spaces, dashes, or other characters
  const cleanPhone = phone.replace(/\D/g, '');

  // Check if it starts with Nigeria country code (234) or 0
  const hasValidPrefix = cleanPhone.startsWith('234') || cleanPhone.startsWith('0');

  // Check if it has the correct length (13 with 234 prefix, or 11 with 0 prefix)
  const hasValidLength = (cleanPhone.startsWith('234') && cleanPhone.length === 13) ||
    (cleanPhone.startsWith('0') && cleanPhone.length === 11);

  return hasValidPrefix && hasValidLength;
};

// Add a new function to format the phone number for backend
const formatPhoneForBackend = (phone) => {
  if (!phone) return '';
  const cleanPhone = phone.replace(/\D/g, '');

  // If starts with 0, replace with 234
  if (cleanPhone.startsWith('0')) {
    return '234' + cleanPhone.slice(1);
  }

  // If already starts with 234, return as is
  if (cleanPhone.startsWith('234')) {
    return cleanPhone;
  }

  return cleanPhone;
};

const SignUpPage = () => {
  const navigate = useNavigate();
  const { createSeller, isLoading } = useAuthContext();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    storeName: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    showPassword: false,
    showConfirmPassword: false
  });

  // Check if seller is already authenticated and redirect to dashboard
  useEffect(() => {
    const sellerToken = localStorage.getItem('sellerToken');
    if (sellerToken) {
      const tokenData = JSON.parse(sellerToken);
      const sellerData = JSON.parse(localStorage.getItem('seller') || '{}');

      // If user has valid token, redirect to dashboard
      if (tokenData.data && sellerData._id) {
        navigate('/studio', { replace: true });
        return;
      }
    }
  }, [navigate]);

  //function to submit the user data
  const submitUserData = async (event) => {
    event.preventDefault();

    // Validate phone number first
    if (!isValidNigerianPhoneNumber(formData.phoneNumber)) {
      toast.error('Please enter a valid Nigerian phone number', {
        style: {
          backgroundColor: '#425466',
          color: '#F7FAFC',
          fontFamily: 'Inter',
          fontSize: '14px',
          fontWeight: '400',
        }
      });
      return;
    }

    // Format email - convert to lowercase and remove spaces
    const formattedEmail = formData.email.toLowerCase().replace(/\s+/g, '');

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
    } else if (formData.firstName === '' || formData.lastName === '' || formData.email === '' || formData.storeName === '' || formData.phoneNumber === '' || formData.password === '' || formData.confirmPassword === '') {
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
      // Format phone number before sending to backend
      const formattedPhone = formatPhoneForBackend(formData.phoneNumber);
      //if the data is valid, create the seller
      const result = await createSeller(
        formData.firstName,
        formData.lastName,
        formattedEmail,
        formData.password,
        formattedPhone,
        formData.storeName
      );

      if (result) {
        // Navigate directly to dashboard after successful signup
        navigate('/studio', { replace: true });
        
        //reset the form data
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          storeName: '',
          phoneNumber: '',
          password: '',
          confirmPassword: '',
        });
      }
    }
  };

  return (
    <div className="relative h-screen xl:flex">
      {/* Mobile/Tablet Background Image */}
      <img
        src={SignupImage}
        alt="signup2"
        className='xl:hidden fixed inset-0 w-full h-screen object-cover object-center'
      />

      {/* Desktop Left Section with Container */}
      <div className="hidden xl:block xl:w-1/2 min-h-screen relative  overflow-hidden">
        <img
          src={SignupImage}
          alt="SignUp"
          className='absolute inset-0 w-full h-full object-cover object-center'
        />
        <div className="container mx-auto relative h-full px-12">
          <div className="flex flex-col h-full gap-32 py-8">
            <img
              src={Logo}
              alt="Logo"
              className='w-[197.544px] 2xl:w-[300px] h-[60.779px] 2xl:h-[90px]'
            />
            <div>
              <h1 className='text-4xl font-bold text-white max-w-[500px] mb-20'>
                Welcome to Auqli Seller Center
              </h1>
              <p className='text-white max-w-[450px] text-lg'>
                Join our interactive live shopping platform to connect with customers in real-time and boost your sales.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div className="xl:static absolute inset-x-0 min-h-screen xl:w-1/2 flex flex-col z-10 overflow-y-auto">
        {/* Mobile Logo */}
        <div className="mb-5 xl:hidden flex justify-center items-center pt-5">
          <img
            src={Logo}
            alt="Logo"
            className='w-[197.544px] 2xl:w-[300px] h-[60.779px] 2xl:h-[90px]'
          />
        </div>

        {/* Form Section */}
        <div className="flex-1 flex items-center justify-center px-5 md:px-10 py-8">
          <div className="bg-[#F7FAFC] p-5 md:py-12 md:px-16 xl:py-10 xl:px-24 rounded-lg w-full xl:container xl:max-w-[680px]">
            <div className="text-center mb-8">
              <h2 className="text-xl md:text-3xl font-semibold font-inter">Create your account</h2>
              <p className="text-sm md:text-base font-inter">It&apos;s free and easy</p>
            </div>

            <form onSubmit={submitUserData} className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4 w-full mb-4 " >
                <div className="flex flex-col gap-2 w-full">
                  <label htmlFor="firstName" className='text-sm md:text-base font-inter text-[#425466]'>
                    First Name
                  </label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        placeholder='Enter your first name'
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className='w-full h-12 rounded-md bg-[#FFFFFF] shadow-sm shadow-[#32324714] p-2 text-sm md:text-base font-inter focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent placeholder:text-[#B5B5BD] placeholder:font-inter placeholder:text-sm'
                      />
                    </TooltipTrigger>
                    <TooltipContent className="bg-white/80 backdrop-blur-sm dark:bg-neutral-900/90">
                      <p>Your legal first name</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="flex flex-col gap-2 w-full">
                  <label htmlFor="lastName" className='text-sm md:text-base font-inter text-[#425466]'>
                    Last Name
                  </label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        placeholder='Enter your last name'
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className='w-full h-12 rounded-md bg-[#FFFFFF] shadow-sm shadow-[#32324714] p-2 text-sm md:text-base font-inter focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent placeholder:text-[#B5B5BD] placeholder:font-inter placeholder:text-sm'
                      />
                    </TooltipTrigger>
                    <TooltipContent className="bg-white/80 backdrop-blur-sm dark:bg-neutral-900/90">
                      <p>Your legal last name</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
              <div className="flex flex-col gap-2 w-full mb-4">
                <label htmlFor="email" className='text-sm md:text-base font-inter text-[#425466]'>
                  Email
                </label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      placeholder='Enter your email'
                      onChange={(e) => {
                        // Store the value as is (for UI display), but will format on submission
                        setFormData({ ...formData, email: e.target.value });
                      }}
                      className='w-full h-12 rounded-md bg-[#FFFFFF] shadow-sm shadow-[#32324714] p-2 text-sm md:text-base font-inter focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent placeholder:text-[#B5B5BD] placeholder:font-inter placeholder:text-sm'
                    />
                  </TooltipTrigger>
                  <TooltipContent className="bg-white/80 backdrop-blur-sm dark:bg-neutral-900/90">
                    <p>Valid email address</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="flex flex-col gap-2 w-full mb-4">
                <label htmlFor="storeName" className='text-sm md:text-base font-inter text-[#425466]'>
                  Store Name
                </label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <input
                      type="text"
                      id="storeName"
                      name="storeName"
                      value={formData.storeName}
                      placeholder='Enter your store name'
                      onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                      className='w-full h-12 rounded-md bg-[#FFFFFF] shadow-sm shadow-[#32324714] p-2 text-sm md:text-base font-inter focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent placeholder:text-[#B5B5BD] placeholder:font-inter placeholder:text-sm'
                    />
                  </TooltipTrigger>
                  <TooltipContent className="bg-white/80 backdrop-blur-sm dark:bg-neutral-900/90">
                    <p>Your store name</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="flex flex-col gap-2 w-full mb-4">
                <label htmlFor="phoneNumber" className='text-sm md:text-base font-inter text-[#425466]'>
                  Phone Number
                </label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <PhoneInput
                        country={'ng'}
                        value={formData.phoneNumber}
                        onChange={(phone) => {
                          setFormData({ ...formData, phoneNumber: phone });
                          // Only show validation message when input loses focus and is invalid
                          if (phone && phone.length >= 13 && !isValidNigerianPhoneNumber(phone)) {
                            toast.error('Please enter a valid Nigerian phone number', {
                              style: {
                                backgroundColor: '#425466',
                                color: '#F7FAFC',
                                fontFamily: 'Inter',
                                fontSize: '14px',
                                fontWeight: '400',
                              }
                            });
                          }
                        }}
                        inputStyle={{
                          width: '100%',
                          height: '48px',
                          fontSize: '14px',
                          borderRadius: '6px',
                          border: 'transparent',
                          backgroundColor: 'white'
                        }}
                        containerStyle={{
                          width: '100%'
                        }}
                        inputClass="focus:outline-none bg-[#FFFFFF] shadow-sm shadow-[#32324714] focus:ring-2 focus:ring-blue-200 focus:border-transparent placeholder:text-[#425466] placeholder:font-inter placeholder:text-sm"
                        onlyCountries={['ng']}
                        disableCountryCode={false}
                        countryCodeEditable={false}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="bg-white/80 backdrop-blur-sm dark:bg-neutral-900/90">
                    <p>Enter a valid Nigerian phone number</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="flex flex-col gap-2 w-full mb-4">
                <label htmlFor="password" className='text-sm md:text-base font-inter text-[#425466]'>
                  Password
                </label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="relative">
                      <input
                        type={formData.showPassword ? "text" : "password"}
                        id="password"
                        name="password"
                        value={formData.password}
                        placeholder='Enter your password'
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className='w-full h-12 rounded-md bg-[#FFFFFF] shadow-sm shadow-[#32324714] p-2 text-sm md:text-base font-inter focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent placeholder:text-[#B5B5BD] placeholder:font-inter placeholder:text-sm'
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, showPassword: !formData.showPassword })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        <Icon icon={formData.showPassword ? eyeOffIcon : eyeIcon} width="20" height="20" />
                      </button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="bg-white/80 backdrop-blur-sm dark:bg-neutral-900/90">
                    <p>At least 8 characters</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="flex flex-col gap-2 w-full mb-4">
                <label htmlFor="confirmPassword" className='text-sm md:text-base font-inter text-[#425466]'>
                  Confirm Password
                </label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="relative">
                      <input
                        type={formData.showConfirmPassword ? "text" : "password"}
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        placeholder='Enter your password'
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className='w-full h-12 rounded-md bg-[#FFFFFF] shadow-sm shadow-[#32324714] p-2 text-sm md:text-base font-inter focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent placeholder:text-[#B5B5BD] placeholder:font-inter placeholder:text-sm'
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, showConfirmPassword: !formData.showConfirmPassword })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        <Icon icon={formData.showConfirmPassword ? "mdi:eye-off" : "mdi:eye"} width="20" height="20" />
                      </button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="bg-white/80 backdrop-blur-sm dark:bg-neutral-900/90">
                    <p>Must match password</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="flex items-start gap-2 mb-6">
                <input
                  type="checkbox"
                  id="terms"
                  className="mt-1"
                  required
                />
                <label htmlFor="terms" className="text-sm text-[#425466] font-inter">
                  By creating an account means you agree to the{' '}
                  <Link
                    to="https://www.auqli.live/privacy-policy"
                    className="text-[#425466] font-bold hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Terms and Conditions
                  </Link>
                  , and our{' '}
                  <Link
                    to="https://www.auqli.live/terms"
                    className="text-[#425466] font-bold hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Privacy Policy
                  </Link>
                </label>

              </div>

              <button
                type="submit"
                className="w-full bg-[#0BB248] text-white font-semibold text-sm md:text-base font-inter py-3 rounded-md hover:bg-green-600 transition-colors mb-4"
              >
                {
                  isLoading ? <CircularProgress color="#FFFFFF" size={20} /> : "Register"
                }
              </button>

              <div className="text-center mb-4">
                <span className="text-sm text-gray-500">or</span>{' '}
                <Link to="/login" className="text-[#0BB248] font-inter text-sm md:text-base font-bold hover:underline">
                  Sign In
                </Link>
              </div>
              {/* <div className="flex justify-center gap-4">
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
              </div> */}
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SignUpPage
