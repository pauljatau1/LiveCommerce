import { toast } from "sonner";
import { AxiosError } from "axios";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { authService } from "@/services/authService";
import { LoginFormData } from "@/schemas/loginSchema";
import { useAuthContext } from "@/Hooks/useAuthContextV2";
import AuqliLogo from "@/assets/icons/AuqliLogo";
import LoginForm from "@/Components/loginPage/LoginForm";
import PrimaryButton from "@/Components/shared/PrimaryButton";
import MarketingSection from "@/Components/loginPage/MarketingSection";


export default function LoginPageV2() {
    const navigate = useNavigate();
    const { login } = authService
    const { isLoading, handleLoginActivity } = useAuthContext();


    const { mutate, isPending } = useMutation({ mutationFn: (data: LoginFormData) => login(data) });
    // Mock handlers for demonstration
    const handleSignupClick = () => {
        // navigate to signup page
        navigate("/signup");
    };

    const handleGoogleLogin = () => {
        console.log("Initiate Google login");
        // In a real app, you would initiate Google OAuth
    };

    const handleResetPasswordClick = () => {
        console.log("Navigate to reset password page");
        // In a real app, you would navigate to the reset password page
    };

    const handleSubmit = (data: LoginFormData) => {
        mutate(data, {
            onSuccess: (res) => {
                console.log(res);

                // store seller data in global auth context
                const data = {
                    seller: res?.data?.user,
                    token: res?.data?.token
                }

                console.log("login data from login page v2", data);
                handleLoginActivity(data.seller, data.token);

                // wait for 2 seconds after showing toast and then navigate to dashboard
                setTimeout(() => {
                    navigate("/dashboard/home", { replace: true });
                }, 2000);
            },
            onError: (error) => {
                console.log(error instanceof AxiosError);
                if (error instanceof AxiosError) {
                    if (error.status === 404) {
                        toast.error("Login failed", {
                            description: "Incorrect email or password",
                            style: {
                                background: "#17171B",
                                color: "#fff",
                            }
                        })
                    } else {
                        toast.error("Login Failed", {
                            description: error.response?.data?.message || error.message,
                            style: {
                                background: "#17171B",
                                color: "#fff",
                            }
                        })
                    }
                } else {
                    toast.error("Login Failed", {
                        description: "Something went wrong please try again later",
                        style: {
                            background: "#17171B",
                            color: "#fff",
                        }
                    })
                }
            }
        });
    };

    return (
        <div className="min-h-[100dvh] bg-gray-50">
            {/* Header */}
            <div className="flex z-10 justify-between py-[9px] lg:py-[10px] px-[20px] lg:px-[30px]">
                <AuqliLogo className="w-[95px] lg:w-[131px] h-[24.1px] lg:h-[35px]" />
                <PrimaryButton onClick={handleSignupClick}>
                    Register a Seller
                </PrimaryButton>
            </div>

            {/* Main Content */}
            <div className="relative flex flex-col lg:flex-row h-[calc(100dvh-50px)] lg:h-[calc(100vh-80px)]">
                <MarketingSection />
                <div className="absolute inset-0 lg:relative flex-1 flex justify-center items-center p-4 lg:p-8 overflow-y-auto">
                    <div className="w-full max-w-md py-4">
                        <LoginForm
                            onSubmit={handleSubmit}
                            isPending={isPending || isLoading}
                            onSignupClick={handleSignupClick}
                            onGoogleLogin={handleGoogleLogin}
                            onResetPasswordClick={handleResetPasswordClick}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}