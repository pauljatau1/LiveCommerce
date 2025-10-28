import { toast } from "sonner";
import { AxiosError } from "axios";
import { authService } from "@/services/authService";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { SignupFormData } from "@/schemas/signupSchema";
import { GoogleOAuthRequestData } from "@/types";
import { useAuthContext } from "@/Hooks/useAuthContextV2";
import AuqliLogo from "@/assets/icons/AuqliLogo";
import SignUpForm from "@/Components/signUpPage/SignUpForm";
import PrimaryButton from "@/Components/shared/PrimaryButton";
import MarketingSection from "@/Components/loginPage/MarketingSection";

export default function SignUpPageV2() {
    const { signUp, googleAuth } = authService;
    const { isLoading, handleSignupActivity } = useAuthContext();
    const navigate = useNavigate();

    // Regular signup mutation
    const { mutate, isPending } = useMutation({
        mutationFn: (data: SignupFormData) => signUp(data)
    });

    // Google OAuth mutation
    const { mutate: googleAuthMutate, isPending: isGoogleAuthPending } = useMutation({ 
        mutationFn: (data: GoogleOAuthRequestData) => googleAuth(data) 
    });

    // Mock handlers for demonstration
    const handleSignInClick = () => {
        navigate("/login");
    };

    const handleGoogleSignup = (googleToken: string) => {
        console.log("Processing Google OAuth token for signup:", googleToken);
        
        // Call the Google OAuth mutation with the token
        googleAuthMutate({ token: googleToken }, {
            onSuccess: async (response) => {
                console.log("Google OAuth signup successful:", response);
                
                // Extract user and token from response
                const { user, token } = response.data;
                
                // Call handleSignupActivity to complete the signup process
                const signUpActivity = await handleSignupActivity(user, token);
                if (signUpActivity) {
                    toast.success("Account created successfully!", {
                        description: "Welcome to Auqli! Your account has been created.",
                        style: {
                            background: "#17171B",
                            color: "#fff",
                        }
                    });

                    // Navigate to dashboard after successful signup
                    navigate("/dashboard/home", { replace: true });
                }
            },
            onError: (error) => {
                console.error("Google OAuth signup failed:", error);
                
                if (error instanceof AxiosError) {
                    if (error.status === 401) {
                        toast.error("Google Authentication Failed", {
                            description: "Invalid Google token. Please try again.",
                            style: {
                                background: "#17171B",
                                color: "#fff",
                            }
                        });
                    } else if (error.status === 400) {
                        toast.error("Google Authentication Failed", {
                            description: error.response?.data?.message || "Invalid request. Please try again.",
                            style: {
                                background: "#17171B",
                                color: "#fff",
                            }
                        });
                    } else {
                        toast.error("Google Authentication Failed", {
                            description: error.response?.data?.message || error.message,
                            style: {
                                background: "#17171B",
                                color: "#fff",
                            }
                        });
                    }
                } else {
                    toast.error("Google Authentication Failed", {
                        description: "Something went wrong. Please try again later.",
                        style: {
                            background: "#17171B",
                            color: "#fff",
                        }
                    });
                }
            }
        });
    };

    const handleSubmit = (data: SignupFormData) => {
        mutate(data, {
            onSuccess: async (res) => {
                console.log("Signup successful:", res);

                const signUpActivity = await handleSignupActivity(res.data.user, res.data.token);
                if (signUpActivity) {
                    toast.success("Account created successfully!", {
                        description: "Please check your email to verify your account.",
                        style: {
                            background: "#17171B",
                            color: "#fff",
                        }
                    });

                    // Navigate to login page after successful signup

                    navigate("/dashboard/home", { replace: true });
                }

            },
            onError: (error) => {
                console.log("Signup error:", error instanceof AxiosError);

                toast.error("Signup Failed", {
                    description: error?.message || "Something went wrong. Please try again later.",
                    style: {
                        background: "#17171B",
                        color: "#fff",
                    }
                });
            }
        });
    };

    return (
        <div className="min-h-[100dvh] bg-gray-50">
            {/* Header */}
            <div className="flex z-10 justify-between py-[9px] lg:py-[10px] px-[20px] lg:px-[30px]">
                <AuqliLogo className="w-[95px] lg:w-[131px] h-[24.1px] lg:h-[35px]" />
                <PrimaryButton outline onClick={handleSignInClick}>
                    Sign In
                </PrimaryButton>
            </div>

            {/* Main Content */}
            <div className="relative flex flex-col lg:flex-row h-[calc(100dvh-50px)] lg:h-[calc(100vh-80px)]">
                <MarketingSection title="Get Onboarded in 2 Minutes — Start Selling Today!" description="You can add products, Go Live & Start Earning. Sell via live streams, Blips or on marketplace." />
                <div className="absolute inset-0 lg:relative flex-1 flex justify-center items-start p-4 lg:p-8 overflow-y-auto">
                    <div className="w-full max-w-md py-4">
                        <SignUpForm
                            onSubmit={handleSubmit}
                            isPending={isPending || isLoading || isGoogleAuthPending}
                            onSignInClick={handleSignInClick}
                            onGoogleSignup={handleGoogleSignup}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}