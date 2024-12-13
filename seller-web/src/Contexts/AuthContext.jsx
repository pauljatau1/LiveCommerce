import { createContext, useContext, useReducer } from "react";
import { BASE_URL } from '../Constants/Server';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import PropTypes from 'prop-types';

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
    const initialState = {
        seller: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        token: null,
        message: "",
        otpStatus: ""
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
                    seller: action.payload,
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
                    message: action.payload
                }
            case "LOGOUT":
                return {
                    ...state,
                    isAuthenticated: false,
                    seller: null,
                    token: null,
                    message: "Logout successful"
                }
        }
    }, initialState);

    //function to create a new seller and signup
    const createSeller = async(firstName, lastName, email, password, phoneNumber) => {
        try {
            dispatch({type: 'SET_LOADING', payload: true});
            const response = await axios.post(`${BASE_URL}/seller/register`, {
                firstName,
                lastName,
                email,
                password,
                phoneNumber
            });

            if (response.status === 201) {
                console.log(`signup: ${response}`);
                dispatch({type: 'SIGNUP_SUCCESS', payload: response.data.user});
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
            dispatch({type: 'SIGNUP_FAILED', payload: AxiosError.response.data.message});
            toast.error(AxiosError.response.data.message)
        } finally {
            dispatch({type: 'SET_LOADING', payload: false});
        }
    };

    //function to verify otp after sign up
    const verifyOtp = async(email, otp) => {
        try {
            dispatch({type: 'SET_LOADING', payload: true});
            dispatch({type: 'RESET'});
            const response = await axios.post(`${BASE_URL}/seller/verify-otp`, {
                email,
                otp
            });

            if (response.status === 200) {
                console.log(`otp: ${response}`);
                dispatch({type: 'VERIFY_OTP_SUCCESS'});
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
            dispatch({type: 'VERIFY_OTP_FAILED', payload: AxiosError.response.data.message});
            toast.error(AxiosError.response.data.message);
        } finally {
            dispatch({type: 'SET_LOADING', payload: false});
        }
    };


    //function to request for new otp
    const requestNewOtp = async(email) => {
        try {
            dispatch({type: 'RESET'});
            dispatch({type: 'SET_LOADING', payload: true});
            const response = await axios.post(`${BASE_URL}/seller/resend-otp`, {
                email
            });

            if (response.status === 200) {
                console.log(`request otp: ${response}`);
                dispatch({type: 'REQUEST_OTP_SUCCESS', payload: response.data.message});
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
            dispatch({type: 'REQUEST_OTP_FAILED', payload: AxiosError.response.data.message});
            toast.error(AxiosError.response.data.message);
        } finally {
            dispatch({type: 'SET_LOADING', payload: false});
        }
    };

    //function to login a seller
    const login = async(email, password) => {
        try {
            dispatch({type: 'SET_LOADING', payload: true});
            const response = await axios.post(`${BASE_URL}/seller/login`, {
                email,
                password
            });
            if (response.status === 200) {
                console.log('login response:', response.data);
                dispatch({type: 'SET_TOKEN', payload: response.data.token});
                localStorage.setItem('sellerToken', JSON.stringify({
                    data: response.data.token, 
                    firstTime: true
                }));
                dispatch({type: 'LOGIN_SUCCESS', payload: response.data.user});
            }
        } catch (AxiosError) {
            console.log(AxiosError);
            dispatch({type: 'LOGIN_FAILED', payload: AxiosError.response.data.message});
            toast.error(AxiosError.response.data.message);
        } finally {
            dispatch({type: 'SET_LOADING', payload: false});
        }
    };

    //function to log user out
    const logout = () => {
        localStorage.removeItem('sellerToken');
        dispatch({type: 'LOGOUT'});
    };


    return (
        <AuthContext.Provider value={{
            ...state,
            dispatch,
            createSeller,
            verifyOtp,
            requestNewOtp,
            login,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    )
}

//prop types validation for the auth provider
AuthProvider.propTypes = {
    children: PropTypes.node.isRequired,
}


//custom hook to use the auth context
const useAuthContext = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuthContext must be used within an AuthProvider');
    }

    return context;
}

export { AuthProvider, useAuthContext };