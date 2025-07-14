import { createContext, useReducer } from "react";
import { BASE_URL } from '../Constants/Server';
import { toast } from "sonner";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { trackEvent, identifyUserMixpanel } from "../util/analytics";
import { getClientIP } from '../Utilities/networkUtils';
import { useIntercomChat } from '../Hooks/useIntercom';

const AuthContext = createContext();

function AuthProvider({ children }) {
    const navigate = useNavigate();
    const { shutdown } = useIntercomChat();
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
        isDataReady: false,
        emailVerified: false,
        isAccountDisabled: false,
        isSubmittingOtp: false,
        isResendingOtp: false,
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
                    isAuthenticated: action.payload.isVerified === true // Only authenticate if verified
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
                    emailVerified: true,
                    isAuthenticated: true
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
                    isLoading: false,
                    seller: null,
                    isAuthenticated: false,
                    message: "",
                    otpStatus: "",
                    token: null
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
                    isAuthenticated: action.payload.seller.isVerified === true && (action.payload.seller.emailVerified === true || action.payload.seller.isVerified === true),
                    seller: action.payload.seller,
                    token: action.payload.token,
                    emailVerified: action.payload.seller.emailVerified === true || action.payload.seller.isVerified === true,
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
            case "STORE_TOKEN":
                return {
                    ...state,
                    token: action.payload
                };
            case "STORE_SELLER":
                return {
                    ...state,
                    seller: action.payload
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
            case "ACCOUNT_DISABLED":
                return {
                    ...state,
                    isAccountDisabled: true
                }
            case "SET_SUBMITTING_OTP":
                return {
                    ...state,
                    isSubmittingOtp: action.payload
                }
            case "SET_RESENDING_OTP":
                return {
                    ...state,
                    isResendingOtp: action.payload
                }
            default:
                return state;
        }
    }, initialState);

    //function to create a new seller and signup
    const createSeller = async (firstName, lastName, email, password, phoneNumber, storeName) => {
        try {
            shutdown()
            dispatch({ type: 'SET_LOADING', payload: true });
            const response = await axios.post(`${BASE_URL}/seller/register`, {
                firstName,
                lastName,
                email,
                password,
                phoneNumber,
                storeName
            });

            if (response.status === 201 || response.status === 200) {
                console.log("create seller response", response);
                // Store token and user data
                localStorage.setItem('sellerToken', JSON.stringify({
                    data: response.data.token,
                    isVerified: false // Email verification still needed
                }));

                // Store user data
                localStorage.setItem('seller', JSON.stringify(response.data.user));

                dispatch({ type: 'SIGNUP_SUCCESS', payload: response.data.user });

                // Set the user as authenticated but with unverified email
                dispatch({
                    type: 'SET_TOKEN', payload: {
                        data: response.data.token,
                        isVerified: false // Email verification still needed
                    }
                });

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
                    const userData = {
                        "Seller ID": response.data.user._id,
                        "$email": email,                           // Use reserved property
                        "$name": `${firstName} ${lastName}`,       // Use reserved property
                        "Seller Phone Number": phoneNumber,
                        "Seller Store Name": storeName,
                        "Signup Method": "Email",
                        "Referral Used": response.data.referralUsed ? "Yes" : "No",
                        "Referrer ID": response.data.referrerId || "None",
                        "User Type": "Seller",
                        "IP Address": await getClientIP().catch(() => 'unknown')
                    };

                    await identifyUserMixpanel(response.data.user._id, userData);
                    await trackEvent("Seller Signed Up", userData);

                    // Track seller account creation with Customer.io
                    if (window.cioanalytics) {
                        const clientIP = await getClientIP().catch(() => 'unknown');
                        // First identify the user
                        window.cioanalytics.identify(response.data.user._id, {
                            seller_id: response.data.user._id,
                            email: email,
                            first_name: firstName,
                            last_name: lastName,
                            phone: phoneNumber,
                            store_name: storeName,
                            created_at: Math.floor(new Date().getTime() / 1000),
                            user_type: 'seller'
                        });

                        // Then track events after a small delay
                        setTimeout(() => {
                            window.cioanalytics.track('seller_account_created', {
                                seller_id: response.data.user._id,
                                email: email,
                                first_name: firstName,
                                last_name: lastName,
                                phone: phoneNumber,
                                store_name: storeName,
                                ip_address: clientIP,
                                device_type: getDeviceType(),
                            });
                        }, 500);
                    }
                } catch (e) {
                    console.error('Analytics tracking error:', e);
                }

                return true; // Return success
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
            return false; // Return failure
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
                    trackEvent("Onboarding Completed", {
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

            // If there's no token at all, just return false without showing any error
            if (!storedToken) {
                console.log('No token found, skipping validation');
                dispatch({ type: 'CHECK_TOKEN_FAILED' });
                return false;
            }

            const tokenData = JSON.parse(storedToken);
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
                return true;
            }
        } catch (error) {
            console.log("Token validation error:", error);

            // Only show the error toast if there was actually a token that failed validation
            if (localStorage.getItem('sellerToken') && (error.response?.data?.message === "Invalid token" || error.response?.status === 401)) {
                console.log("Invalid token detected, redirecting to login");

                // Clean up auth state
                localStorage.removeItem('sellerToken');
                localStorage.removeItem('seller');
                dispatch({ type: 'LOGOUT' });

                // Show error toast
                toast.error("Session expired", {
                    description: "Please log in again",
                    style: {
                        background: '#17171B',
                        color: '#fff',
                    }
                });

                // Redirect to login
                navigate('/login', { replace: true });
            } else if (localStorage.getItem('sellerToken')) {
                // Only show generic error if there was a token present
                toast.error("Authentication error", {
                    description: error.response?.data?.message || error.message,
                    style: {
                        background: '#17171B',
                        color: '#fff',
                    }
                });
            }

            dispatch({ type: 'CHECK_TOKEN_FAILED' });
            return false;
        }
    }

    //function to verify otp after sign up
    const verifyOtp = async (email, otp) => {
        try {
            shutdown()
            dispatch({ type: 'SET_SUBMITTING_OTP', payload: true });

            const response = await axios.post(`${BASE_URL}/seller/verify-otp`, {
                email,
                otp
            });

            if (response.status === 200) {
                console.log(`otp verification response:`, response.data);
                dispatch({ type: 'VERIFY_OTP_SUCCESS' });

                // Only after successful verification, set the user as authenticated
                if (response.data.token) {
                    // Set isVerified to true in localStorage
                    localStorage.setItem('sellerToken', JSON.stringify({
                        data: response.data.token,
                    }));

                    if (response.data.user) {
                        // Update the user in localStorage with verified status
                        const userData = response.data.user;
                        userData.emailVerified = true; // Add emailVerified flag
                        localStorage.setItem('seller', JSON.stringify(userData));
                        dispatch({ type: 'STORE_SELLER', payload: userData });
                    }

                    // Now set authenticated state after verification
                    dispatch({
                        type: 'SET_TOKEN', payload: {
                            data: response.data.token,
                        }
                    });

                    const sellerDetails = JSON.parse(localStorage.getItem('seller') || '{}');

                    trackEvent("Seller Email Verified", {
                        "Seller ID": sellerDetails?._id,
                        "Email": sellerDetails?.email,
                        "Verification Method": "Email",
                        "Seller Name": `${sellerDetails?.firstName} ${sellerDetails?.lastName}`,
                        "Seller Store Name": sellerDetails?.storeName,
                        "Seller Phone Number": sellerDetails?.phoneNumber,
                    });

                    toast.success('Account verified successfully!');

                    // Return success - navigation will be handled by the component
                    return true;
                } else {
                    // Even if token wasn't in the response, still consider verification successful
                    // This handles the case where the backend returns verification success but no token
                    dispatch({ type: 'VERIFY_OTP_SUCCESS' });
                    toast.success(response.data.message || 'Email verified successfully');

                    // Update email verification status in local storage
                    const sellerData = JSON.parse(localStorage.getItem('seller') || '{}');
                    if (sellerData) {
                        sellerData.emailVerified = true;
                        localStorage.setItem('seller', JSON.stringify(sellerData));
                    }

                    return true;
                }
            }
            return false;
        } catch (AxiosError) {
            console.log(AxiosError);
            dispatch({ type: 'VERIFY_OTP_FAILED', payload: AxiosError?.response?.data?.message || 'Verification failed' });
            toast.error(AxiosError?.response?.data?.message || 'OTP verification failed');
            return false;
        } finally {
            dispatch({ type: 'SET_SUBMITTING_OTP', payload: false });
        }
    };


    //function to request for new otp
    const requestNewOtp = async (email) => {
        try {
            dispatch({ type: 'SET_RESENDING_OTP', payload: true });
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

                return true;

            }
        } catch (AxiosError) {
            console.log(AxiosError);
            dispatch({ type: 'REQUEST_OTP_FAILED', payload: AxiosError?.response?.data?.message });
            toast.error(AxiosError?.response?.data?.message);
        } finally {
            dispatch({ type: 'SET_RESENDING_OTP', payload: false });
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
                // Check if account is disabled
                if (response.data.user.isDisabled === true) {
                    dispatch({ type: 'ACCOUNT_DISABLED' });

                    // Store minimal data needed for the disabled dialog
                    localStorage.setItem('seller', JSON.stringify(response.data.user));
                    localStorage.setItem('sellerToken', JSON.stringify({
                        data: response.data.token,
                        isVerified: false
                    }));

                    toast.error('Account Disabled', {
                        description: 'Your account has been disabled. Please contact support.',
                        style: {
                            background: '#fff',
                            color: '#17171B',
                        }
                    });

                    return;
                }

                // Check if email is verified before setting authenticated state
                const isEmailVerified = response.data.user.emailVerified === true || response.data.user.isVerified === true;

                dispatch({ type: 'STORE_SELLER', payload: response.data.user });

                // Set token but respect verification status
                dispatch({
                    type: 'STORE_TOKEN', payload: {
                        data: response.data.token,
                        isVerified: response.data.user.isVerified && isEmailVerified
                    }
                });

                localStorage.setItem('seller', JSON.stringify(response.data.user));
                localStorage.setItem('sellerToken', JSON.stringify({
                    data: response.data.token,
                    isVerified: response.data.user.isVerified && isEmailVerified
                }));


                // Get IP address (only with consent)
                let clientIP = 'unknown';

                try {
                    clientIP = await getClientIP();
                } catch (e) {
                    console.error('IP tracking failed:', e);
                }

                const isPickupAddressRequired = response?.data?.user?.accountType === 'individual' ? response?.data?.user?.hasFilledAddress === false : response?.data?.user?.hasFilledBusinessAddress === false;
                const onboardingCompletionStatus = response?.data?.user?.emailVerified && !isPickupAddressRequired ? "Completed" : "Not Completed";

                // Track analytics using our utility
                try {
                    // User properties for identification
                    const userTraits = {
                        "$email": response?.data?.user?.email,
                        "$name": `${response?.data?.user?.firstName} ${response?.data?.user?.lastName}`,
                        "Store Name": response?.data?.user?.storeName,
                        "User Type": "Seller",
                        "Seller Account Type": response?.data?.user?.accountType,
                        "Signup Date": new Date(response?.data?.user?.createdAt).toISOString().split('T')[0],
                        "Email Verification Status": response?.data?.user?.emailVerified ? "Verified" : "Not Verified",
                        "Onboarding Completion Status": onboardingCompletionStatus,
                        "Onboarding Steps Remaining": `${onboardingCompletionStatus === "Not Completed" ? `${isPickupAddressRequired && "Pickup Address"}${response?.data?.user?.emailVerified && ", Email Verification"}` : "onboarding completed" } `,
                        "Primary Payment Account Number": response?.data?.user?.bankDetails?.accountNumber || "None",
                        "Primary Payment Account Name": response?.data?.user?.bankDetails?.accountName || "None",
                        "Primary Payment Account Bank": response.data.user?.bankDetails?.bankName || "None",
                        "Primary Payment Account Currency": response?.data?.user?.bankDetails?.accountCurrency || "None",
                        "Location": `${response?.data?.user?.businessAddress?.country || ''}, ${response?.data?.user?.businessAddress?.city || ''}, ${response?.data?.user?.businessAddress?.state || ''}, ${response?.data?.user?.businessAddress?.addressLine1 || ''}`,
                        "Total Wallet Balance": response?.data?.user?.walletBalance,
                        "IP Address": clientIP,
                    };

                    // Identify user
                    await identifyUserMixpanel(response?.data?.user?._id, userTraits);

                    // Track login event with device context and IP
                    await trackEvent("Seller Login", {
                        ...userTraits,
                        "seller id": response?.data?.user?._id,
                        "seller full name": `${response?.data?.user?.firstName} ${response?.data?.user?.lastName}`,
                        "Device Type": getDeviceType(),
                        "Approximate Location": clientIP !== 'unknown' ? 'Derived from IP' : 'Not available'
                    });
                } catch (analyticError) {
                    console.error('Analytics tracking error:', analyticError);
                }

                // Also identify the user in Microsoft Clarity
                if (window.initClarity) {
                    // If clarity isn't directly available but initClarity is, use that
                    window.initClarity({
                        id: response?.data?.user?._id,
                        email: response?.data?.user?.email,
                        firstName: response?.data?.user?.firstName,
                        lastName: response?.data?.user?.lastName
                    });
                }

                console.log('login response:', response.data);

                toast.success('Login successful', {
                    style: {
                        border: '1px solid #17171B',
                    }
                });

                // Only navigate to dashboard if email is verified

                navigate('/dashboard/home', { replace: true });
                dispatch({ type: 'SET_DATA_READY', payload: true });
                window.dispatchEvent(new Event('appLoginComplete'));

                // Identify user with Customer.io
                try {
                    if (window.cioanalytics) {
                        // Always use _id consistently (appears to be your MongoDB ID)
                        window.cioanalytics.identify(response?.data?.user?._id, {
                            seller_id: response?.data?.user?._id,
                            email: response?.data?.user?.email,
                            email_verification_status: response?.data?.user?.emailVerified ? "Verified" : "Not Verified",
                            onboarding_completion_status: onboardingCompletionStatus,
                            onboarding_steps_remaining: `${onboardingCompletionStatus === "Not Completed" ? `${isPickupAddressRequired && "Pickup Address"}${response?.data?.user?.emailVerified && ", Email Verification"}` : "onboarding completed" } `,
                            first_name: response?.data?.user?.firstName,
                            last_name: response?.data?.user?.lastName,
                            phone: response?.data?.user?.phoneNumber,
                            created_at: Math.floor(new Date(response?.data?.user?.createdAt).getTime() / 1000),
                            user_type: 'seller',
                            account_type: response?.data?.user?.accountType,
                            store_name: response?.data?.user?.storeName,
                            location: `${response?.data?.user?.sellerAddress?.country || ''}, ${response?.data?.user?.sellerAddress?.city || ''}, ${response?.data?.user?.sellerAddress?.state || ''}, ${response?.data?.user?.sellerAddress?.addressLine1 || 'pending onboarding completion'}`,
                            total_wallet_balance: `₦${response?.data?.user?.walletBalance.toLocaleString('en-NG') || '0'}`,
                            ip_address: clientIP,
                            device_type: getDeviceType(),
                            approximate_location: clientIP !== 'unknown' ? 'Derived from IP' : 'Not available'
                        });

                        // Use setTimeout to ensure identification is processed before tracking events
                        setTimeout(() => {
                            window.cioanalytics.track('seller_account_login', {
                                seller_id: response?.data?.user?._id,
                                email: response?.data?.user?.email,
                                first_name: response?.data?.user?.firstName,
                                last_name: response?.data?.user?.lastName,
                                phone: response?.data?.user?.phoneNumber,
                                ip_address: clientIP,
                                device_type: getDeviceType(),
                            });
                        }, 500);
                    }
                } catch (error) {
                    console.log('error tracking customer.io login event', error);
                }
            }
        } catch (error) {
            console.log(error);
            dispatch({ type: 'LOGIN_FAILED', payload: error.response?.data?.message || error.message });
            toast.error('Login failed', {
                description: error.response?.data?.message || error.message,
                style: {
                    background: '#fff',
                    color: '#17171B',
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
            dispatch({ type: 'SET_LOADING', payload: true });
            const response = await axios.post(`${BASE_URL}/seller/reset-password`, {
                email: resetData.email,
                code: resetData.code,
                newPassword: resetData.newPassword
            });
            if (response.status === 200) {
                dispatch({ type: 'RESET_PASSWORD_WITH_TOKEN_SUCCESS', payload: response.data.message });
                toast.success('Password reset successful');
                return true;
            }
            return false;
        } catch (error) {
            console.log(error);
            toast.error('Password reset failed', {
                description: error.response?.data?.message || error.message,
                style: {
                    background: '#17171B',
                    color: '#fff',
                }
            });
            return false;
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }

    const fetchSellerDetails = async () => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            const sellerToken = localStorage.getItem('sellerToken');

            // If there's no token or we're on direct login access, return without errors
            if (!sellerToken || sessionStorage.getItem('directLoginAccess') === 'true') {
                dispatch({ type: 'SET_LOADING', payload: false });
                return null;
            }

            const tokenData = JSON.parse(sellerToken);
            console.log(tokenData);
            const response = await axios.get(`${BASE_URL}/seller/profile`, {
                headers: {
                    Authorization: `Bearer ${tokenData.data}`
                }
            });
            if (response.status === 200) {
                // Check if account is disabled
                if (response.data.isDisabled === true) {
                    dispatch({ type: 'ACCOUNT_DISABLED' });
                    return null;
                }

                // Explicitly check emailVerified status from response
                const isEmailVerified = response.data.emailVerified === true || response.data.isVerified === true;

                dispatch({ type: 'FETCH_SELLER_DETAILS', payload: response.data });
                console.log("seller details:", response.data);

                // Save token with proper verification status
                localStorage.setItem('sellerToken', JSON.stringify({
                    ...tokenData,
                    isVerified: isEmailVerified && response.data.isVerified
                }));

                // Include emailVerified status in user data
                const userData = {
                    ...response.data,
                    emailVerified: isEmailVerified
                };

                localStorage.setItem('seller', JSON.stringify(userData));

                // If email is not verified, trigger the unverified user state
                if (!isEmailVerified) {
                    dispatch({ type: 'UNVERIFIED_SELLER', payload: userData });
                }
            }
        } catch (error) {
            console.log("Fetch seller details error:", error);

            // Handle invalid token or authentication errors
            if (error.response?.data?.message === "Invalid token" || error.response?.status === 401) {
                console.log("Invalid token detected in fetchSellerDetails, redirecting to login");

                // Clean up auth state
                localStorage.removeItem('sellerToken');
                localStorage.removeItem('seller');
                dispatch({ type: 'LOGOUT' });

                // Show error toast
                toast.error("Session expired", {
                    description: "Please log in again",
                    style: {
                        background: '#17171B',
                        color: '#fff',
                    }
                });

                // Redirect to login page
                navigate('/login', { replace: true });
            } else if (error.response?.status === 404) {
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
            dispatch({ type: 'RESET' });
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