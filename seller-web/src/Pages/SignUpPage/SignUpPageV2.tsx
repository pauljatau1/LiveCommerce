import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { SignupFormData } from "@/schemas/signupSchema";
import { useAuthContext } from "@/Hooks/useAuthContextV2";
import AuqliLogo from "@/assets/icons/AuqliLogo";
import SignUpForm from "@/Components/signUpPage/SignUpForm";
import PrimaryButton from "@/Components/shared/PrimaryButton";
import MarketingSection from "@/Components/loginPage/MarketingSection";

export default function SignUpPageV2() {
    const navigate = useNavigate();
    const { isLoading } = useAuthContext();

    // Mock mutation for signup - will be replaced with actual API call in another ticket
    const { mutate, isPending } = useMutation({ 
        mutationFn: (data: SignupFormData) => {
            // Mock API call - replace with actual signup service
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve({ success: true, data });
                }, 2000);
            });
        }
    });

    // Mock handlers for demonstration
    const handleSignInClick = () => {
        navigate("/login");
    };

    const handleGoogleSignup = () => {
        console.log("Initiate Google signup");
        // In a real app, you would initiate Google OAuth for signup
    };

    const handleSubmit = (data: SignupFormData) => {
        mutate(data, {
            onSuccess: (res) => {
                console.log("Signup successful:", res);
                
                toast.success("Account created successfully!", {
                    description: "Please check your email to verify your account.",
                    style: {
                        background: "#17171B",
                        color: "#fff",
                    }
                });

                // Navigate to login page after successful signup
                setTimeout(() => {
                    navigate("/login", { replace: true });
                }, 2000);
            },
            onError: (error) => {
                console.log("Signup error:", error);
                
                toast.error("Signup Failed", {
                    description: "Something went wrong. Please try again later.",
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
                            isPending={isPending || isLoading}
                            onSignInClick={handleSignInClick}
                            onGoogleSignup={handleGoogleSignup}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}