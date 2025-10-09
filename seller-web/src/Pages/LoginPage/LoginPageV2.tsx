import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import AuqliLogo from "@/assets/icons/AuqliLogo";
import LoginForm from "@/Components/loginPage/LoginForm";
import PrimaryButton from "@/Components/shared/PrimaryButton";
import MarketingSection from "@/Components/loginPage/MarketingSection";
import { LoginFormData } from "@/schemas/loginSchema";
import { toast } from "sonner";


export default function LoginPageV2() {
    const navigate = useNavigate();

    const testLogin = async(data: LoginFormData) => {
        console.log("Test login");
    }
    const { mutate, isPending } = useMutation({ mutationFn: testLogin });
    // Mock handlers for demonstration
    const handleSignupClick = () => {
        console.log("Navigate to signup page");
        // In a real app, you would navigate to the signup page
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
                toast.success("Login successful")
            },
            onError: (error) => {
                toast.error(error.message)
            }
        });
    };

    return (
        <div className="min-h-[100dvh] bg-gray-50">
            {/* Header */}
            <div className="flex justify-between py-[9px] lg:py-[10px] px-[20px] lg:px-[30px]">
                <AuqliLogo className="w-[95px] lg:w-[131px] h-[24.1px] lg:h-[35px]" />
                <PrimaryButton>
                    Register a Seller
                </PrimaryButton>
            </div>
            
            {/* Main Content */}
            <div className="relative flex flex-col lg:flex-row min-h-[calc(100vh-80px)]">
                <MarketingSection />
                <div className="absolute inset-0 lg:relative flex-1 flex justify-center items-center p-4 lg:p-8">
                    <LoginForm 
                        onSubmit={handleSubmit}
                        isPending={isPending}
                        onSignupClick={handleSignupClick}
                        onGoogleLogin={handleGoogleLogin}
                        onResetPasswordClick={handleResetPasswordClick}
                    />   
                </div>
            </div>
        </div>
    );
}