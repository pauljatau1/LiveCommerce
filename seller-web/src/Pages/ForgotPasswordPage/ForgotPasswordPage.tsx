import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import AuqliLogo from "@/assets/icons/AuqliLogo";
import ForgotPasswordForm from "@/Components/forgotPassword/ForgotPasswordForm";
import PrimaryButton from "@/Components/shared/PrimaryButton";
import MarketingSection from "@/Components/loginPage/MarketingSection";

export default function ForgotPasswordPage() {
    const navigate = useNavigate();
    
    const handleSignupClick = () => {
        navigate("/signup");
    };

    const handleForgotPasswordSuccess = () => {
        toast.success("Password reset successfully! You can now log in with your new password.");
        navigate("/login");
    };

    const handleForgotPasswordCancel = () => {
        navigate("/login");
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
                <MarketingSection title="Reset Your Access with Ease!" description="This is just a step process. Enter your email and we’ll send an OTP so you can set a new one right away." />
                <div className="absolute inset-0 lg:relative flex-1 flex justify-center items-center p-4 lg:p-8 overflow-y-auto">
                    <div className="w-full max-w-md py-4">
                        <ForgotPasswordForm 
                            onSuccess={handleForgotPasswordSuccess}
                            onCancel={handleForgotPasswordCancel}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
