import {
    AuthContextType,
    AuthState,
    AuthAction,
    AuthProviderProps,
    Seller,
} from '../types';
import { useNavigate } from "react-router-dom";
import { trackEvent, identifyUserMixpanel } from '@/util/analytics';
import { useIntercom } from 'react-use-intercom';
import { useNotification } from "@/Hooks/useNotification";
import { tokenUtils, sellerUtils, authUtils } from "@/util/auth";
import { getClientIP, getDeviceType } from '@/util/helpers';
import { createContext, useReducer, useMemo } from "react";

// Create the AuthContext with proper typing
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider component that provides authentication context to the entire application
 * Handles user authentication, token management, and seller data operations
 */
function AuthProvider({ children }: AuthProviderProps) {
    // initialize intercom chat hook to configure intercom functionality
    const { boot, shutdown } = useIntercom();
    const { showNotification } = useNotification();
    const navigate = useNavigate();
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
                    token: null,
                    isAccountDisabled: false,
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
            case "AUTH_SUCCESS":
                return {
                    ...state,
                    isAuthenticated: true,
                    seller: action.payload.seller,
                    token: { data: action.payload.token, isVerified: action.payload.seller.isVerified },
                    message: "Login successful"
                }
            case "AUTH_FAILED":
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


    // Function to handle login activity
    const handleLoginActivity = async (seller: Seller, token: string) => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            // shutdown intercom for fresh restart upon login
            boot();
            dispatch({ type: "RESET" })
            // dispatch auth success action to update all auth state
            dispatch({ type: "AUTH_SUCCESS", payload: { seller, token } });
            dispatch({ type: 'SET_DATA_READY', payload: true });
            sellerUtils.storeSeller(seller);
            tokenUtils.storeBearerToken({ data: token, isVerified: seller.isVerified });

            // Get seller's IP address (only with consent)
            let clientIP = 'unknown';
            clientIP = await getClientIP();

            if (seller.isDisabled === true) {
                // store seller data needed for the disabled seller dialog
                sellerUtils.storeSeller(seller);
                tokenUtils.storeBearerToken({ data: token, isVerified: seller.isVerified });

                showNotification('Account Disabled, Your account has been disabled. Please contact support at (support@auqli.com) to reactivate your account.', 'error', 'fixed');

                return
            }

            // track analytics using the global analytics tracking helper
            // define seller properties for identification
            const userTraits = {
                "$email": seller.email,
                "$name": `${seller.firstName} ${seller.lastName}`,
                "Store Name": seller.storeName,
                "User Type": "Seller",
                "Seller Account Type": seller.accountType,
                "Signup Date": new Date(seller.createdAt).toISOString().split('T')[0],
                "Email Verification Status": seller.emailVerified ? "Verified" : "Not Verified",
                "Primary Payment Account Number": seller.bankDetails?.accountNumber || "None",
                "Primary Payment Account Name": seller.bankDetails?.accountName || "None",
                "Primary Payment Account Bank": seller.bankDetails?.bankName || "None",
                "Primary Payment Account Currency": seller.bankDetails?.accountCurrency || "None",
                "Location": `${seller.businessAddress?.country || ''}, ${seller.businessAddress?.city || ''}, ${seller.businessAddress?.state || ''}, ${seller.businessAddress?.addressLine1 || ''}`,
                "Total Wallet Balance": seller.walletBalance,
                "IP Address": clientIP,
            };

            // Identify user
            await identifyUserMixpanel(seller._id, userTraits);

            // Track login event with device context and IP
            await trackEvent("Seller Login", {
                ...userTraits,
                "seller id": seller._id,
                "seller full name": `${seller.firstName} ${seller.lastName}`,
                "Device Type": getDeviceType(),
                "Approximate Location": clientIP !== 'unknown' ? 'Derived from IP' : 'Not available'
            });

            // Also identify the user in Microsoft Clarity
            if (window.initClarity) {
                // If clarity isn't directly available but initClarity is, use that
                window.initClarity({
                    id: seller._id,
                    email: seller.email,
                    firstName: seller.firstName,
                    lastName: seller.lastName
                });
            }

            // identify seller on customerio
            if (window.cioanalytics) {
                // Always use _id consistently (appears to be your MongoDB ID)
                window.cioanalytics.identify(seller._id, {
                    seller_id: seller._id,
                    email: seller.email,
                    email_verification_status: seller.emailVerified ? "Verified" : "Not Verified",
                    first_name: seller.firstName,
                    last_name: seller.lastName,
                    phone: seller.phoneNumber,
                    created_at: Math.floor(new Date(seller.createdAt).getTime() / 1000),
                    user_type: 'seller',
                    account_type: seller.accountType,
                    store_name: seller.storeName,
                    location: `${seller.sellerAddress?.country || ''}, ${seller.sellerAddress?.city || ''}, ${seller.sellerAddress?.state || ''}, ${seller.sellerAddress?.addressLine1 || 'pending onboarding completion'}`,
                    total_wallet_balance: `₦${seller.walletBalance.toLocaleString('en-NG') || '0'}`,
                    ip_address: clientIP,
                    device_type: getDeviceType(),
                    approximate_location: clientIP !== 'unknown' ? 'Derived from IP' : 'Not available'
                });

                // Use setTimeout to ensure identification is processed before tracking events
                window.cioanalytics?.track('seller_account_login', {
                    seller_id: seller._id,
                    email: seller.email,
                    first_name: seller.firstName,
                    last_name: seller.lastName,
                    phone: seller.phoneNumber,
                    ip_address: clientIP,
                    device_type: getDeviceType(),
                });
            }


            // display success banner after storing seller data in global auth context
            showNotification("Login successful, Welcome back!", "information", "dismissible");

            // wait for 2 seconds after showing banner and then navigate to dashboard
            setTimeout(() => {
                navigate("/studio", { replace: true });
            }, 1000);
        } catch (error) {
            console.log(error);
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    // Function to log user out
    const logout = async () => {
        try {
            shutdown();
            dispatch({ type: 'RESET' });
            dispatch({ type: 'LOGOUT' });

            // Clear app-specific storage
            authUtils.clearAllAuthData();
            dispatch({ type: 'SET_DATA_READY', payload: false });
            navigate('/login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    // function to handle signup activity
    const handleSignupActivity = async (seller: Seller, token: string) => {
        try {
            // shutdown intercom for fresh restart upon login
            boot();
            // dispatch loading action to show loading state
            dispatch({ type: 'SET_LOADING', payload: true });
            // dispatch signup success action to update all auth state
            dispatch({ type: 'SIGNUP_SUCCESS', payload: seller });
            // dispatch token action to update all auth state
            dispatch({ type: 'SET_TOKEN', payload: { data: token, isVerified: true } })
            // store seller data in global auth context
            sellerUtils.storeSeller(seller);
            // store token in global auth context
            tokenUtils.storeBearerToken({ data: token, isVerified: true });

            // Track signup event
            try {
                const userData = {
                    "Seller ID": seller?._id,
                    "$email": seller?.email,                           // Use reserved property
                    "$name": `${seller?.firstName} ${seller?.lastName}`,       // Use reserved property
                    "Seller Phone Number": seller?.phoneNumber,
                    "Seller Store Name": seller?.storeName,
                    "Signup Method": "Email",
                    "Referral Used": seller?.referralUsed ? "Yes" : "No",
                    "Referrer ID": seller?.referrerId || "None",
                    "User Type": "Seller",
                    "IP Address": await getClientIP().catch(() => 'unknown')
                };

                await identifyUserMixpanel(seller?._id, userData);
                await trackEvent("Seller Signed Up", userData);

                // Track seller account creation with Customer.io
                if (window.cioanalytics) {
                    const clientIP = await getClientIP().catch(() => 'unknown');
                    // First identify the user
                    window.cioanalytics?.identify?.(seller?._id, {
                        seller_id: seller?._id,
                        email: seller?.email,
                        first_name: seller?.firstName,
                        last_name: seller?.lastName,
                        phone: seller?.phoneNumber,
                        store_name: seller?.storeName,
                        created_at: Math.floor(new Date().getTime() / 1000),
                        user_type: 'seller'
                    });

                    // Then track events after a small delay
                    setTimeout(() => {
                        window.cioanalytics?.track?.('seller_account_created', {
                            seller_id: seller?._id,
                            email: seller?.email,
                            first_name: seller?.firstName,
                            last_name: seller?.lastName,
                            phone: seller?.phoneNumber,
                            store_name: seller?.storeName,
                            ip_address: clientIP,
                            device_type: getDeviceType(),
                        });
                    }, 500);
                }

                return true;
            } catch (e) {
                console.error('Analytics tracking error:', e);
                return false;
            }
        } catch (error) {
            console.log(error);
            return false;
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }

    const contextValue = useMemo(() => ({
        ...state,
        handleLoginActivity,
        handleSignupActivity,
        dispatch,
        logout
    }), [state, dispatch])

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    )
}

export { AuthContext };
export default AuthProvider;