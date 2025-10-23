import { useState } from "react";
import { Button } from "@/Components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema, type SignupFormData } from "@/schemas/signupSchema";
import { FloatingLabelInput } from "@/Components/shared/floating-label-input";
import { Link } from "react-router-dom";
import NigerianFlagIcon from "@/assets/icons/NigerianFlagIcon";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from "@/Components/ui/form/form";
// import { Checkbox } from "@/Components/ui/checkbox";
import GoogleIcon from "@/assets/icons/GoogleIcon";
import PrimaryTypography from "@/Components/shared/PrimaryTypography";

interface SignUpFormProps {
    onSubmit: (data: SignupFormData) => void;
    isPending: boolean;
    onSignInClick: () => void;
    onGoogleSignup: () => void;
}

export default function SignUpForm({ onSignInClick, onGoogleSignup, onSubmit, isPending }: SignUpFormProps) {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    // Initialize form with React Hook Form and Zod validation
    const form = useForm<SignupFormData>({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            fullName: "",
            email: "",
            storeName: "",
            phoneNumber: "",
            password: "",
            confirmPassword: "",
            termsAccepted: false,
        },
    });

    const handleSubmit = (data: SignupFormData) => {
        onSubmit(data);
    };

    return (
        <div className="border border-solid border-gray-300 rounded-[16px] bg-gray-50 xl:bg-none p-[24px] w-full max-w-md mx-auto">
            {/* Header Section */}
            <div className="mb-6">
                <h2 className="text-[24px] font-lexend font-semibold text-[#27272E] lg:text-[28px]">
                    Create your account
                </h2>
                <PrimaryTypography className="text-[#777E90] mt-0">
                    It&apos;s free and easy
                </PrimaryTypography>
            </div>

            {/* Signup Form */}
            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                    {/* Full Name Field */}
                    <FormField
                        control={form.control}
                        name="fullName"
                        render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <FloatingLabelInput
                                        {...field}
                                        id="fullName"
                                        type="text"
                                        label="Full name"
                                        className={`w-full ${form.formState.errors.fullName ? "border-[#ff4444] focus-visible:border-[#ff4444] focus-visible:ring-[#ff4444]/20" : "border-input focus-visible:border-input focus-visible:ring-input"}`}
                                        disabled={isPending}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

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
                                        label="Enter your e-mail"
                                        className={`w-full ${form.formState.errors.email ? "border-[#ff4444] focus-visible:border-[#ff4444] focus-visible:ring-[#ff4444]/20" : "border-input focus-visible:border-input focus-visible:ring-input"}`}
                                        disabled={isPending}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Store Name Field */}
                    <FormField
                        control={form.control}
                        name="storeName"
                        render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <FloatingLabelInput
                                        {...field}
                                        id="storeName"
                                        type="text"
                                        label="Enter your store name"
                                        className={`w-full ${form.formState.errors.storeName ? "border-[#ff4444] focus-visible:border-[#ff4444] focus-visible:ring-[#ff4444]/20" : "border-input focus-visible:border-input focus-visible:ring-input"}`}
                                        disabled={isPending}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Phone Number Field */}
                    <FormField
                        control={form.control}
                        name="phoneNumber"
                        render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <div className="flex w-full">
                                        {/* Country Code Selector */}
                                        <div className="flex items-center border border-input rounded-l-md px-3 bg-white border-r-0">
                                            <div className="flex items-center space-x-2">
                                                <NigerianFlagIcon />
                                                <span className="text-sm text-gray-600">+234</span>
                                                <svg className="w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <FloatingLabelInput
                                                {...field}
                                                id="phoneNumber"
                                                type="tel"
                                                label="Enter phone number"
                                                className={`w-full rounded-l-none ${form.formState.errors.phoneNumber ? "border-[#ff4444] focus-visible:border-[#ff4444] focus-visible:ring-[#ff4444]/20" : "border-input focus-visible:border-input focus-visible:ring-input"}`}
                                                disabled={isPending}
                                            />
                                        </div>
                                    </div>
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
                                            label="Enter your password"
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
                                <div className="text-xs text-gray-500 mt-1">Must be 8 characters at least</div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Confirm Password Field */}
                    <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <div className="relative">
                                        <FloatingLabelInput
                                            {...field}
                                            id="confirmPassword"
                                            type={showConfirmPassword ? "text" : "password"}
                                            label="Re-enter your password"
                                            className={`w-full pr-10 ${form.formState.errors.confirmPassword ? "border-[#ff4444] focus-visible:border-[#ff4444] focus-visible:ring-[#ff4444]/20" : "border-input focus-visible:border-input focus-visible:ring-input"}`}
                                            disabled={isPending}
                                        />
                                        <button
                                            type="button"
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            disabled={isPending}
                                        >
                                            {showConfirmPassword ? (
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
                                <div className="text-xs text-gray-500 mt-1">Must be 8 characters at least</div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Terms and Conditions */}
                    <FormField
                        control={form.control}
                        name="termsAccepted"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                    <input
                                        type="checkbox"
                                        checked={field.value}
                                        onChange={field.onChange}
                                        disabled={isPending}
                                        className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 focus:ring-2"
                                    />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                    <label className="text-sm text-[#27272E]">
                                        By creating an account means you agree to the{" "}
                                        <Link
                                            to="https://www.auqli.live/terms"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-green-600 hover:text-green-700 font-medium underline"
                                        >
                                            Terms and Conditions
                                        </Link>
                                        , and our{" "}
                                        <Link
                                            to="https://www.auqli.live/privacy-policy"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-green-600 hover:text-green-700 font-medium underline"
                                        >
                                            Privacy Policy
                                        </Link>
                                        .
                                    </label>
                                    <FormMessage />
                                </div>
                            </FormItem>
                        )}
                    />

                    {/* Register Button */}
                    <Button
                        type="submit"
                        className="w-full bg-[#27272E] hover:bg-[#27272E]/90 text-white font-medium py-3 rounded-lg"
                        disabled={isPending}
                    >
                        {isPending ? "Creating account..." : "Register"}
                    </Button>
                </form>
            </Form>

            {/* Sign In Link */}
            <div className="text-center mt-4">
                <span className="text-[#27272E] text-sm">
                    or{" "}
                    <button
                        type="button"
                        onClick={onSignInClick}
                        className="text-green-600 hover:text-green-700 font-medium"
                    >
                        Sign In
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

            {/* Google Signup Button */}
            <Button
                type="button"
                variant="outline"
                className="w-full border-gray-300 hover:bg-gray-50"
                onClick={onGoogleSignup}
            >
                <div className="flex items-center justify-center space-x-2">
                    <GoogleIcon />
                    <span className="text-[#27272E]">Log In With Google</span>
                </div>
            </Button>
        </div>
    );
}
