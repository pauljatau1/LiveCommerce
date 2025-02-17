import { createContext, useEffect, useReducer } from "react";
import { BASE_URL } from '../Constants/Server';
import { toast } from "sonner";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import mixpanel from "mixpanel-browser";
import { getClientIP } from '../Utilities/networkUtils';
import { useIntercomChat } from '../Hooks/useIntercom';

const AuthContext = createContext();

function AuthProvider({ children }) {
    const navigate = useNavigate();
    const { initUser, shutdown } = useIntercomChat();
    const initialState = {
        seller: null,
        signUpSellerDetails: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        token: null,
        message: "",
        otpStatus: "",
        isTokenValid: false,
        top3SellingProducts: null,
        stuffToDo: null,
        unverifiedUser: null,
        onboardingStep: null,
        blockedUser: false,
        isForgotPasswordRequestSuccessful: false,
        passwordResetSuccessful: false,
        isDataReady: false
    }

    const [state, dispatch] = useReducer((state, action) => {
        switch (action.type) {
            case 'SET_LOADING':
                return {
                    ...state,
                    isLoading: action.payload
                }
            case "SET_TOKEN":
                return {
                    ...state,
                    token: action.payload,
                    isAuthenticated: true
                }
            case "SET_MESSAGE":
                return {
                    ...state,
                    message: action.payload
                }
            case "SIGNUP_SUCCESS":
                return {
                    ...state,
                    signUpSellerDetails: action.payload,
                    message: "Signup successful",
                    otpStatus: "pending"
                }
            case "SIGNUP_FAILED":
                return {
                    ...state,
                    isAuthenticated: false,
                    seller: null,
                    message: `Signup failed: ${action.payload}`
                }
            case "VERIFY_OTP_SUCCESS":
                return {
                    ...state,
                    otpStatus: "verified",
                }
            case "VERIFY_OTP_FAILED":
                return {
                    ...state,
                    otpStatus: "failed",
                    message: `OTP verification failed: ${action.payload}`
                }
            case "RESET":
                return {
                    ...state,
                    isAuthenticated: false,
                    message: "",
                    otpStatus: ""
                }
            case "REQUEST_OTP_SUCCESS":
                return {
                    ...state,
                    message: action.payload
                }
            case "REQUEST_OTP_FAILED":
                return {
                    ...state,
                    message: action.payload
                }
            case "LOGIN_SUCCESS":
                return {
                    ...state,
                    isAuthenticated: true,
                    seller: action.payload,
                    message: "Login successful"
                }
            case "LOGIN_FAILED":
                return {
                    ...state,
                    message: action.payload,
                    isAuthenticated: false,
                    seller: null,
                }
            case "LOGOUT":
                return {
                    ...state,
                    isAuthenticated: false,
                    seller: null,
                    token: null,
                    message: "Logout successful"
                }
            case "SIGNUP_USER_EXISTS":
                return {
                    ...state,
                    message: "User already exists"
                };
            case "FETCH_SELLER_DETAILS":
                return {
                    ...state,
                    seller: action.payload
                };
            case "CHECK_TOKEN_SUCCESS":
                return {
                    ...state,
                    isTokenValid: true
                };
            case "CHECK_TOKEN_FAILED":
                return {
                    ...state,
                    isTokenValid: false
                };
            case "FETCH_TOP_3_SELLING_PRODUCTS":
                return {
                    ...state,
                    top3SellingProducts: action.payload
                };
            case "FETCH_STUFF_TO_DO":
                return {
                    ...state,
                    stuffToDo: action.payload
                };
            case "UNVERIFIED_SELLER":
                return {
                    ...state,
                    otpStatus: "pending",
                    unverifiedUser: true,
                    signUpSellerDetails: action.payload
                }
            case "FETCH_ONBOARDING_PROCESS":
                return {
                    ...state,
                    onboardingStep: action.payload
                }
            case "BLOCKED_USER":
                return {
                    ...state,
                    blockedUser: true
                }
            case "RESET_PASSWORD_SUCCESS":
                return {
                    ...state,
                    isForgotPasswordRequestSuccessful: true
                }
            case "RESET_PASSWORD_WITH_TOKEN_SUCCESS":
                return {
                    ...state,
                    passwordResetSuccessful: true
                }
            case "CANCEL_RESET_PASSWORD":
                return {
                    ...state,
                    isForgotPasswordRequestSuccessful: false,
                    passwordResetSuccessful: false
                }
            case 'SET_DATA_READY':
                return { ...state, isDataReady: action.payload };
            default:
                return state;
        }
    }, initialState);

    //function to create a new seller and signup
    const createSeller = async (firstName, lastName, email, password, phoneNumber) => {
        try {
            shutdown()
            dispatch({ type: 'SET_LOADING', payload: true });
            const response = await axios.post(`${BASE_URL}/seller/register`, {
                firstName,
                lastName,
                email,
                password,
                phoneNumber
            });

            if (response.status === 201) {
                console.log(response);
                localStorage.setItem('sellerToken', JSON.stringify({
                    data: response.data.token,
                    isVerified: response.data.user.isVerified
                }));
                localStorage.setItem('seller', JSON.stringify(response.data.user));
                dispatch({ type: 'SIGNUP_SUCCESS', payload: response.data.user });
                toast.success(response.data.message, {
                    style: {
                        backgroundColor: '#17171B',
                        color: '#F7FAFC',
                        fontFamily: 'Inter',
                        fontSize: '14px',
                        fontWeight: '400',
                    }
                });

                // Track signup event
                try {
                    mixpanel.identify(response.data.user._id);
                    mixpanel.track("User Signed Up", {
                        "Signup Method": "Email", // or "Google"/"Phone" if implementing social logins
                        "Referral Used": response.data.referralUsed ? "Yes" : "No",
                        "Referrer ID": response.data.referrerId || "None",
                        "User Type": "Seller",
                        "IP Address": await getClientIP().catch(() => 'unknown')
                    });
                } catch (e) {
                    console.error('Mixpanel tracking error:', e);
                }
            }

        } catch (AxiosError) {
            console.log(AxiosError);
            dispatch({ type: 'SIGNUP_FAILED', payload: AxiosError.response.data.message });
            toast.error(AxiosError.response.data.message, {
                style: {
                    backgroundColor: '#425466',
                    color: '#F7FAFC',
                    fontFamily: 'Inter',
                    fontSize: '14px',
                    fontWeight: '400',
                }
            })
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    const getOnboardingProcess = async () => {
        try {
            const token = localStorage.getItem('sellerToken');
            if (token) {
                const { data } = JSON.parse(token);
                const response = await axios.get(`${BASE_URL}/seller/onboarding-process`, {
                    headers: {
                        Authorization: `Bearer ${data}`
                    }
                });
                if (response.status === 200) {
                    console.log(response);
                    dispatch({ type: 'FETCH_ONBOARDING_PROCESS', payload: response.onboardingProcess });

                    // Update the tracking call in getOnboardingProcess
                    mixpanel.track("Onboarding Completed", {
                        "Time to Complete": formatOnboardingTime(
                            Math.round((Date.now() - new Date(response.data.user.createdAt)) / 1000 / 60)
                        ),
                        "Total Minutes": Math.round((Date.now() - new Date(response.data.user.createdAt)) / 1000 / 60),
                        "Current Onboarding Step": response.onboardingProcess
                    });
                } else {
                    navigate('/signup');
                }
            }
        } catch (error) {
            console.error("Error fetching onboarding process:", error);
            console.log("Error status:", error.response.status);

        }
    }

    const checkTokenValidity = async () => {
        try {
            const storedToken = localStorage.getItem('sellerToken');
            const tokenData = storedToken ? JSON.parse(storedToken) : { data: null, isVerified: null };
            console.log('tokenData', tokenData)
            const response = await axios.get(`${BASE_URL}/seller/check-token`, {
                headers: {
                    Authorization: `Bearer ${tokenData.data}`
                }
            });

            console.log('token validity response', response)
            console.log('validity', response)
            if (response.status === 200) {
                localStorage.setItem('sellerToken', JSON.stringify({
                    ...tokenData,
                    data: response.data.token,
                }));
                dispatch({ type: 'CHECK_TOKEN_SUCCESS' });
            }
        } catch (error) {
            if (error.response.status === 401) {
                console.log("Token is invalid", error);
                toast.error("Token is invalid", {
                    description: error.response?.data?.message || error.message,
                    style: {
                        background: '#05031F',
                        color: '#fff',
                    }
                });
            }
        }
    }

    //function to verify otp after sign up
    const verifyOtp = async (email, otp) => {
        try {
            shutdown()
            dispatch({ type: 'SET_LOADING', payload: true });
            dispatch({ type: 'RESET' });
            const response = await axios.post(`${BASE_URL}/seller/verify-otp`, {
                email,
                otp
            });

            if (response.status === 200) {
                console.log(`otp: ${response}`);
                dispatch({ type: 'VERIFY_OTP_SUCCESS' });
                toast.success(response.data.message);
                navigate('/onboarding');
            }
        } catch (AxiosError) {
            console.log(AxiosError);
            dispatch({ type: 'VERIFY_OTP_FAILED', payload: AxiosError.response.data.message });
            toast.error(AxiosError.response.data.message);
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };


    //function to request for new otp
    const requestNewOtp = async (email) => {
        try {
            dispatch({ type: 'RESET' });
            dispatch({ type: 'SET_LOADING', payload: true });
            const response = await axios.post(`${BASE_URL}/seller/resend-otp`, {
                email
            });

            if (response.status === 200) {
                console.log(`request otp: ${response}`);
                dispatch({ type: 'REQUEST_OTP_SUCCESS', payload: response.data.message });
                toast.success(response.data.message, {
                    position: "top-center",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "dark",
                });

            }
        } catch (AxiosError) {
            console.log(AxiosError);
            dispatch({ type: 'REQUEST_OTP_FAILED', payload: AxiosError.response.data.message });
            toast.error(AxiosError.response.data.message);
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    //function to login a seller
    const login = async (email, password) => {
        try {
            shutdown()
            dispatch({ type: "RESET" })
            dispatch({ type: 'SET_LOADING', payload: true });
            const response = await axios.post(`${BASE_URL}/seller/login`, {
                email,
                password
            });
            dispatch({ type: 'SET_DATA_READY', payload: false });
            if (response.status === 200) {
                dispatch({ type: 'LOGIN_SUCCESS', payload: response.data.user });
                localStorage.setItem('seller', JSON.stringify(response.data.user));
                localStorage.setItem('sellerToken', JSON.stringify({
                    data: response.data.token,
                    isVerified: response.data.user.isVerified
                }));

                // Mixpanel User Identification
                mixpanel.identify(response.data.user?._id);

                // Get IP address (only with consent)
                let clientIP = 'unknown';

                try {
                    clientIP = await getClientIP();
                } catch (e) {
                    console.error('IP tracking failed:', e);
                }

                // Set user properties
                mixpanel.people.set({
                    "$email": response.data.user?.email,
                    "$name": `${response.data.user?.firstName} ${response.data.user?.lastName}`,
                    "Store Name": response.data.user?.storeName,
                    "User Type": "Seller",
                    "Seller Account Type": response.data.user?.accountType,
                    "Signup Date": new Date(response.data.user?.createdAt).toISOString().split('T')[0],
                    "Verification Status": response.data.user?.isVerified ? "Verified" : "Not Verified",
                    "Primary Payment Account Number": response.data.user?.bankDetails?.accountNumber || "None",
                    "Primary Payment Account Name": response.data.user?.bankDetails?.accountName || "None",
                    "Primary Payment Account Bank": response.data.user?.bankDetails?.bankName || "None",
                    "Primary Payment Account Currency": response.data.user?.bankDetails?.accountCurrency || "None",
                    "Location": `${response.data.user?.businessAddress?.country || ''}, ${response.data.user?.businessAddress?.city || ''}, ${response.data.user?.businessAddress?.state || ''}, ${response.data.user?.businessAddress?.addressLine1 || ''}`,
                    "Total Wallet Balance": response.data.user?.walletBalance || 0,
                    "IP Address": clientIP,
                });

                // Track login event with device context and IP
                mixpanel.track("Login", {
                    "Verification Status": response.data.user?.isVerified ? "Verified" : "Not Verified",
                    "Device Type": getDeviceType(),
                    "IP Address": clientIP,
                    "Approximate Location": clientIP !== 'unknown' ? 'Derived from IP' : 'Not available'
                });

                console.log('login response:', response.data);

                toast.success('Login successful', {
                    style: {
                        border: '1px solid #05031F',
                    }
                });
                navigate('/dashboard/home');
                dispatch({ type: 'SET_DATA_READY', payload: true });
                window.dispatchEvent(new Event('appLoginComplete'));
            }
        } catch (error) {
            console.log(error);
            dispatch({ type: 'LOGIN_FAILED', payload: error.response?.data?.message || error.message });
            toast.error('Login failed', {
                description: error.response?.data?.message || error.message,
                style: {
                    background: '#fff',
                    color: '#05031F',
                }
            });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };


    //function to reset password
    const resetPassword = async (email) => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            const response = await axios.post(`${BASE_URL}/seller/forgot-password`, {
                email
            });

            if (response.status === 200) {
                dispatch({ type: 'RESET_PASSWORD_SUCCESS', payload: response.data.message });
                console.log(`reset password: ${response}`);
                toast.success('Password reset request sent', {
                    description: 'We have sent a password reset link to your email',
                    style: {
                        background: '#17171B',
                        color: '#fff',
                    }
                });
            }
        } catch (error) {
            console.log(error);
            toast.error('Login Unauthorized', {
                description: error.response?.data?.message || error.message,
                style: {
                    background: '#17171B',
                    color: '#fff',
                }
            });

        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    const resetPasswordWithOtp = async (resetData) => {
        try {
            dispatch({ type: 'SET_LOADING', payload: false });
            dispatch({ type: 'SET_LOADING', payload: true });
            const response = await axios.post(`${BASE_URL}/seller/reset-password`, {
                email: resetData.email,
                code: resetData.code,
                newPassword: resetData.newPassword
            });
            if (response.status === 200) {
                dispatch({ type: 'RESET_PASSWORD_WITH_TOKEN_SUCCESS', payload: response.data.message });
                toast.success('Password reset successful');
            }
        } catch (error) {
            console.log(error);
            toast.error('Password reset failed', {
                description: error.response?.data?.message || error.message,
                style: {
                    background: '#17171B',
                    color: '#fff',
                }
            });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }


    }

    const fetchSellerDetails = async () => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            const sellerToken = localStorage.getItem('sellerToken');
            const tokenData = sellerToken ? JSON.parse(sellerToken) : { data: null, isVerified: null };
            console.log(tokenData);
            const response = await axios.get(`${BASE_URL}/seller/profile`, {
                headers: {
                    Authorization: `Bearer ${tokenData.data}`
                }
            });
            if (response.status === 200) {
                dispatch({ type: 'FETCH_SELLER_DETAILS', payload: response.data });
                console.log("seller details:", response.data);
                localStorage.setItem('sellerToken', JSON.stringify({
                    ...tokenData,
                    isVerified: response.data.isVerified
                }));
                localStorage.setItem('seller', JSON.stringify(response.data));
                const profileComplete = Boolean(
                    response.data.storeName &&
                    response.data.businessAddress &&
                    response.data.bankDetails &&
                    response.data.isProfileComplete
                );

                mixpanel.track("Profile Completed", {
                    "Completion %": profileComplete ? 100 : calculateProfileCompletion(response.data),
                    "User Type": "Seller"
                });

                if (!response.data.isVerified) {
                    mixpanel.track("Onboarding Completed", {
                        "Time to Complete Onboarding": formatOnboardingTime(
                            Math.round((Date.now() - new Date(response.data.createdAt)) / 1000 / 60)
                        ),
                        "Total Minutes": Math.round((Date.now() - new Date(response.data.createdAt)) / 1000 / 60),
                        "Current Onboarding Step": response.data.onboardingProcess
                    });
                }
            }
        } catch (error) {
            console.log(error);
            if (error.response?.status === 404) {
                console.log("Seller not found, clearing auth state");
                dispatch({ type: 'BLOCKED_USER' });
                localStorage.removeItem('sellerToken');
                localStorage.removeItem('seller');
                dispatch({ type: 'LOGOUT' });
                navigate('/login');
                toast.error('Unauthorized Seller', {
                    description: error.response.data.message,
                    style: {
                        background: '#17171B',
                        color: '#fff',
                    }
                });
            }
            return null;
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    //function to log user out
    const logout = async () => {
        try {
            shutdown();
            dispatch({ type: 'LOGOUT' });
            // Clear Intercom storage tracks
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('intercom')) {
                    localStorage.removeItem(key);
                }
            });

            // Clear app-specific storage
            localStorage.removeItem('sellerToken');
            localStorage.removeItem('seller');
            localStorage.removeItem('onboardingProcess');
            localStorage.removeItem('visitorId')
            dispatch({ type: 'SET_DATA_READY', payload: false });
            navigate('/login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const getTop3SellingProducts = async () => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            const token = localStorage.getItem('sellerToken');
            if (token) {
                const { data } = JSON.parse(token);
                const response = await axios.get(`${BASE_URL}/seller/top-sold-products`, {
                    headers: {
                        Authorization: `Bearer ${data}`
                    }
                });
                if (response.status === 200) {
                    dispatch({ type: 'FETCH_TOP_3_SELLING_PRODUCTS', payload: response.data });
                }
            }
        } catch (error) {
            console.error('Failed to fetch top 3 selling products', error);
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }

    const getSellerNotifications = async () => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            const token = localStorage.getItem('sellerToken');
            if (token) {
                const { data } = JSON.parse(token);
                const response = await axios.get(`${BASE_URL}/notifications`, {
                    headers: {
                        Authorization: `Bearer ${data}`
                    }
                });
                if (response.status === 200) {
                    dispatch({ type: 'FETCH_STUFF_TO_DO', payload: response.data });
                }
            }
        } catch (error) {
            console.error('Failed to fetch seller notifications', error);
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }

    // Add helper function outside the login function
    const getDeviceType = () => {
        const userAgent = navigator.userAgent;
        if (/android/i.test(userAgent)) return "Android";
        if (/iPad|iPhone|iPod/.test(userAgent)) return "iOS";
        return "Desktop";
    };

    // Add helper function
    const calculateProfileCompletion = (sellerData) => {
        const requiredFields = ['storeName', 'businessAddress', 'bankDetails', 'isProfileComplete', 'storeAvatar', 'storeBanner'];
        const completedFields = requiredFields.filter(field => sellerData[field]);
        return Math.round((completedFields.length / requiredFields.length) * 100);
    };

    // Add this helper function in your AuthProvider component
    const formatOnboardingTime = (minutes) => {
        if (isNaN(minutes) || minutes <= 0) return 'N/A';

        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;

        let timeString = '';
        if (hours > 0) {
            timeString += `${hours}h `;
        }
        if (remainingMinutes > 0) {
            timeString += `${remainingMinutes}m`;
        }

        return timeString.trim() || '0m';
    };

    return (
        <AuthContext.Provider value={{
            ...state,
            dispatch,
            createSeller,
            verifyOtp,
            requestNewOtp,
            login,
            logout,
            resetPassword,
            fetchSellerDetails,
            checkTokenValidity,
            getTop3SellingProducts,
            getSellerNotifications,
            getOnboardingProcess,
            resetPasswordWithOtp
        }}>
            {children}
        </AuthContext.Provider>
    )
}

//prop types validation for the auth provider
AuthProvider.propTypes = {
    children: PropTypes.node.isRequired,
}




export { AuthContext };
export default AuthProvider;