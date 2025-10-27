import { useState } from "react";
import { Button } from "@/Components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginFormData } from "@/schemas/loginSchema";
import { FloatingLabelInput } from "@/Components/shared/floating-label-input";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from "@/Components/ui/form/form";
import GoogleIcon from "@/assets/icons/GoogleIcon";
import PrimaryTypography from "@/Components/shared/PrimaryTypography";

interface LoginFormProps {
    onSubmit: (data: LoginFormData) => void;
    isPending: boolean;
    onSignupClick: () => void;
    onGoogleLogin: () => void;
    onResetPasswordClick: () => void;
}

export default function LoginForm({ onSignupClick, onGoogleLogin, onResetPasswordClick, onSubmit, isPending }: LoginFormProps) {
    const [showPassword, setShowPassword] = useState(false);
    
    // Initialize form with React Hook Form and Zod validation
    const form = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    // Mock mutation using React Query


    const handleSubmit = (data: LoginFormData) => {
        onSubmit(data);
    };


    return (
        <div className="border border-solid border-gray-300 rounded-[16px] bg-gray-50 xl:bg-none p-[24px] w-full max-w-md mx-auto">
            {/* Header Section */}
            <div className="mb-6">
                <h2 className="text-[36px] mb-2">👋</h2>
                <h2 className="text-[24px] font-lexend font-semibold text-[#27272E] lg:text-[28px]">
                    Welcome Back!
                </h2>
                <PrimaryTypography className="text-[#777E90] mt-2">
                    Let&apos;s build something great
                </PrimaryTypography>
            </div>

            {/* Login Form */}
            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                    {/* Email Field */}
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <FloatingLabelInput
                                        {...field}
                                        id="email"
                                        type="email"
                                        label="E-mail Address"
                                        className={`w-full ${form.formState.errors.email ? "border-[#ff4444] focus-visible:border-[#ff4444] focus-visible:ring-[#ff4444]/20" : "border-input focus-visible:border-input focus-visible:ring-input"}`}
                                        disabled={isPending}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Password Field */}
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <div className="relative">
                                        <FloatingLabelInput
                                            {...field}
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            label="Password"
                                            className={`w-full pr-10 ${form.formState.errors.password ? "border-[#ff4444] focus-visible:border-[#ff4444] focus-visible:ring-[#ff4444]/20" : "border-input focus-visible:border-input focus-visible:ring-input"}`}
                                            disabled={isPending}
                                        />
                                        <button
                                            type="button"
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                                            onClick={() => setShowPassword(!showPassword)}
                                            disabled={isPending}
                                        >
                                            {showPassword ? (
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                                </svg>
                                            ) : (
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Sign In Button */}
                    <Button
                        type="submit"
                        className="w-full bg-[#27272E] hover:bg-[#27272E]/90 text-white font-medium py-3 rounded-lg"
                        disabled={isPending}
                    >
                        {isPending ? "Signing in..." : "Sign in"}
                    </Button>
                </form>
            </Form>

            {/* Forgot Password Link */}
            <div className="text-right mt-4">
                <span className="text-[#27272E] text-sm">
                    Forgot Password?{" "}
                    <button
                        type="button"
                        onClick={onResetPasswordClick}
                        className="text-green-600 hover:text-green-700 font-medium"
                    >
                        Reset
                    </button>
                </span>
            </div>

            {/* Create Account Link */}
            <div className="text-center mt-4">
                <span className="text-[#27272E] text-sm">
                    Don&apos;t have an account?{" "}
                    <button
                        type="button"
                        onClick={onSignupClick}
                        className="text-green-600 hover:text-green-700 font-medium"
                    >
                        Create an account
                    </button>
                </span>
            </div>

            {/* Divider */}
            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="bg-gray-50 px-2 text-gray-500">or do it via other accounts</span>
                </div>
            </div>

            {/* Google Login Button 
            <Button
                type="button"
                variant="outline"
                className="w-full border-gray-300 hover:bg-gray-50"
                onClick={onGoogleLogin}
            >
                <div className="flex items-center justify-center space-x-2">
                
                    <GoogleIcon />
                    <span className="text-[#27272E]">Log In With Google</span>
                </div>
            </Button> */}
        </div>
    );
}