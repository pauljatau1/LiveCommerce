import { AxiosError } from "axios";
import { useNavigate } from "react-router-dom";
import { authService } from "@/services/authService";
import { useMutation } from "@tanstack/react-query";
import { SignupFormData } from "@/schemas/signupSchema";
import { useAuthContext } from "@/Hooks/useAuthContextV2";
import { useNotification } from "@/Hooks/useNotification";
import { GoogleOAuthRequestData } from "@/types";
import { extractAxiosErrorMessage } from "@/util/helpers";
import AuqliLogo from "@/assets/icons/AuqliLogo";
import SignUpForm from "@/Components/signUpPage/SignUpForm";
import PrimaryButton from "@/Components/shared/PrimaryButton";
import MarketingSection from "@/Components/loginPage/MarketingSection";
import NotificationBanner from "@/Components/ui/NotificationBanner";

export default function SignUpPageV2() {
    const { signUp, googleAuth } = authService;
    const { showNotification, notification, hideNotification } = useNotification();
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
                    showNotification("Account created successfully!", "information", "dismissible");

                    // Navigate to dashboard after successful signup
                    navigate("/dashboard/home", { replace: true });
                }
            },
            onError: (error) => {
                console.error("Google OAuth signup failed:", error);

                if (error instanceof AxiosError) {
                    if (error.status === 401) {
                        showNotification("Google Authentication Failed", "error", "dismissible");
                    } else if (error.status === 400) {
                        showNotification("Google Authentication Failed", "error", "dismissible");
                    } else {
                        showNotification("Google Authentication Failed", "error", "dismissible");
                    }
                } else {
                    showNotification("Something went wrong. Please try again later", "error", "dismissible");
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
                    showNotification("Account created successfully!", "information", "dismissible");

                    // Navigate to login page after successful signup

                    navigate("/dashboard/home", { replace: true });
                }

            },
            onError: (error) => {
                console.log("Signup error:", error instanceof AxiosError);

                showNotification(`Signup Failed ${extractAxiosErrorMessage(error) || "Something went wrong. Please try again later."}`, "error", "dismissible");
            }
        });
    };

    return (
        <div className="min-h-[100dvh] bg-gray-50">
            {/* Header */}
            <div className="flex flex-col gap-2 z-10 py-[9px] lg:py-[10px] px-[20px] lg:px-[30px]">
                <div className="flex items-center justify-between">
                    <AuqliLogo className="w-[95px] lg:w-[131px] h-[24.1px] lg:h-[35px]" />
                    <PrimaryButton outline onClick={handleSignInClick}>
                        Sign In
                    </PrimaryButton>
                </div>
                {/* Notification Banner - Renders at this location for all pages */}
                {notification.isVisible && notification.type && (
                    <div className="pb-3 pt-0 lg:pt-2 ">
                        <NotificationBanner
                            message={notification.message}
                            type={notification.type}
                            visibility={notification.visibility}
                            onClose={hideNotification}
                        />
                    </div>
                )}
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