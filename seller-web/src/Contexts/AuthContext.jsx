import { createContext, useEffect, useReducer } from "react";
import { BASE_URL } from '../Constants/Server';
import { toast } from "sonner";
import { Crisp } from "crisp-sdk-web";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

const AuthContext = createContext();

function AuthProvider({ children }) {
    const navigate = useNavigate();
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
            default:
                return state;
        }
    }, initialState);



    //function to create a new seller and signup
    const createSeller = async (firstName, lastName, email, password, phoneNumber) => {
        try {
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
            dispatch({ type: "RESET" })
            dispatch({ type: 'SET_LOADING', payload: true });
            const response = await axios.post(`${BASE_URL}/seller/login`, {
                email,
                password
            });
            if (response.status === 200) {
                localStorage.setItem('seller', JSON.stringify(response.data.user));
                localStorage.setItem('sellerToken', JSON.stringify({
                    data: response.data.token,
                    isVerified: response.data.user.isVerified
                }));
                console.log('login response:', response.data);
                dispatch({ type: 'LOGIN_SUCCESS', payload: response.data.user });
                Crisp.setTokenId(response.data.token);
                Crisp.user.setEmail(response.data.user.email);
                Crisp.user.setNickname(response.data.user.firstName + " " + response.data.user.lastName);
                Crisp.session.setData({
                    user_id: response.data.user._id,
                    plan: "free"
                })
                toast.success('Login successful', {
                    style: {
                        border: '1px solid #05031F',
                    }
                });
                navigate('/dashboard/home');
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
                console.log("seller details:", response.data);
                dispatch({ type: 'FETCH_SELLER_DETAILS', payload: response.data });
                localStorage.setItem('sellerToken', JSON.stringify({
                    ...tokenData,
                    isVerified: response.data.isVerified
                }));
                localStorage.setItem('seller', JSON.stringify(response.data));
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
            localStorage.removeItem('sellerToken');
            localStorage.removeItem('seller');
            localStorage.removeItem('onboardingProcess');

            Crisp.setTokenId();
            Crisp.session.reset();

            dispatch({ type: 'LOGOUT' });
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