import { createContext, useReducer, useMemo } from "react";
import {
  AuthContextType,
  AuthState,
  AuthAction,
  AuthProviderProps,
} from '../types';

// Create the AuthContext with proper typing
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider component that provides authentication context to the entire application
 * Handles user authentication, token management, and seller data operations
 */
function AuthProvider({ children }: AuthProviderProps) {
    
    // Initial state with proper typing
    const initialState: AuthState = {
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

    // Typed reducer function
    const [state, dispatch] = useReducer<(state: AuthState, action: AuthAction) => AuthState>((state, action) => {
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
                    token: { data: action.payload.token, isVerified: action.payload.seller.isVerified },
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

    const contextValue = useMemo(() => ({
        ...state,
        dispatch
    }), [state, dispatch])


    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    )
}

export { AuthContext };
export default AuthProvider;