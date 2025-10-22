import { useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { authService } from "@/services/authService";
import { Button } from "@/Components/ui/button";
import { FloatingLabelInput } from "@/Components/shared/floating-label-input";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from "@/Components/ui/form/form";
import { AxiosError } from 'axios';
import PrimaryTypography from '../shared/PrimaryTypography';
import { forgotPasswordStep1Schema, forgotPasswordStep2Schema, type ForgotPasswordStep1Data, type ForgotPasswordStep2Data } from '@/schemas/forgotPasswordSchema';

interface ForgotPasswordFormProps {
    onSuccess?: () => void;
    onCancel?: () => void;
}

export default function ForgotPasswordForm({ onSuccess, onCancel }: ForgotPasswordFormProps) {
    const [currentStep, setCurrentStep] = useState(1);
    const [email, setEmail] = useState('');
    const [otpTimer, setOtpTimer] = useState(30);
    const [canResend, setCanResend] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Step 1 form (Email)
    const step1Form = useForm<ForgotPasswordStep1Data>({
        resolver: zodResolver(forgotPasswordStep1Schema),
        defaultValues: {
            email: "",
        },
    });

    // Step 2 form (OTP + New Password)
    const step2Form = useForm<ForgotPasswordStep2Data>({
        resolver: zodResolver(forgotPasswordStep2Schema),
        defaultValues: {
            otp: "",
            newPassword: "",
            confirmPassword: "",
        },
    });

    // Step 1: request forgot password (send OTP to email)
    const sendOtpMutation = useMutation({
        mutationFn: async (data: ForgotPasswordStep1Data) => {
            const response = await authService.forgotPasswordRequest(data.email);
            return response;
        },
        onSuccess: () => {
            const submittedEmail = step1Form.getValues('email');
            setEmail(submittedEmail);
            setCurrentStep(2);
            setOtpTimer(30);
            setCanResend(false);
            toast.success("Verification code sent to your email");
        },
        onError: (error: unknown) => {
            console.error('Error sending OTP:', error);
            toast.error("Failed to send verification code", {
                description: error instanceof AxiosError ? error.response?.data?.message : "Something went wrong. Please try again later.",
            });
        },
    });

    // Resend OTP
    const resendOtpMutation = useMutation({
        mutationFn: async (emailToResend: string) => {
            const response = await authService.requestOtp(emailToResend);
            return response;
        },
        onSuccess: () => {
            setOtpTimer(30);
            setCanResend(false);
            toast.success("A new verification code has been sent");
        },
        onError: (error: unknown) => {
            console.error('Error resending OTP:', error);
            toast.error("Failed to resend verification code", {
                description: error instanceof AxiosError ? error.response?.data?.message : "Something went wrong. Please try again later.",
            });
        },
    });

    // Step 2: reset password with OTP
    const resetPasswordMutation = useMutation({
        mutationFn: async (data: ForgotPasswordStep2Data) => {
            const payload = { email, code: data.otp, newPassword: data.newPassword };
            const response = await authService.resetPasswordWithOtp(payload);
            return response;
        },
        onSuccess: () => {
            toast.success("Password updated successfully");
            onSuccess?.();
        },
        onError: (error: unknown) => {
            console.error('Error resetting password:', error);
            toast.error("Failed to update password. Check code and try again");
        },
    });

    // OTP Timer effect
    useEffect(() => {
        if (currentStep === 2 && otpTimer > 0) {
            const timer = setTimeout(() => {
                setOtpTimer(prev => prev - 1);
            }, 1000);
            return () => clearTimeout(timer);
        } else if (otpTimer === 0) {
            setCanResend(true);
        }
    }, [otpTimer, currentStep]);

    const handleStep1Submit = (data: ForgotPasswordStep1Data) => {
        sendOtpMutation.mutate(data);
    };

    const handleStep2Submit = (data: ForgotPasswordStep2Data) => {
        resetPasswordMutation.mutate(data);
    };

    const handleResendOtp = () => {
        if (canResend && email) {
            resendOtpMutation.mutate(email);
        }
    };

    const handleBackToStep1 = () => {
        setCurrentStep(1);
        step2Form.reset();
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="border border-solid border-gray-300 rounded-[16px] bg-gray-50 xl:bg-none p-[24px] w-full max-w-md mx-auto">
            {/* Header Section */}
            <div className="mb-6">
                <h2 className="text-[36px] mb-2">🔐</h2>
                <h2 className="text-[24px] font-lexend font-semibold text-[#27272E] lg:text-[28px]">
                    {currentStep === 1 ? "Nothing to worry about" : "Enter Verification Code"}
                </h2>
                <PrimaryTypography className="text-[#777E90] mt-2">
                    {currentStep === 1
                        ? "Enter your email and we will send you a one-time password"
                        : `Type in the 4-digit code sent to`
                    } {currentStep !== 1 && <span className="font-semibold text-[#425466] ">{email}</span>}
                </PrimaryTypography>
            </div>

            {/* Step 1: Email Input */}
            {currentStep === 1 && (
                <Form {...step1Form}>
                    <form onSubmit={step1Form.handleSubmit(handleStep1Submit)} className="space-y-6">
                        <FormField
                            control={step1Form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <FloatingLabelInput
                                            {...field}
                                            id="email"
                                            type="email"
                                            label="Enter you e-mail"
                                            className={`w-full ${step1Form.formState.errors.email ? "border-[#ff4444] focus-visible:border-[#ff4444] focus-visible:ring-[#ff4444]/20" : "border-input focus-visible:border-input focus-visible:ring-input"}`}
                                            disabled={sendOtpMutation.isPending}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button
                            type="submit"
                            className="w-full bg-[#27272E] hover:bg-[#27272E]/90 text-white font-medium py-3 rounded-lg"
                            disabled={sendOtpMutation.isPending}
                        >
                            {sendOtpMutation.isPending ? "Sending..." : "Send Verification Code"}
                        </Button>

                        {onCancel && (
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={onCancel}
                                className="w-full text-[#27272E] hover:text-[#27272E]/80"
                            >
                                Cancel
                            </Button>
                        )}
                    </form>
                </Form>
            )}

            {/* Step 2: OTP + New Password */}
            {currentStep === 2 && (
                <Form {...step2Form}>
                    <form onSubmit={step2Form.handleSubmit(handleStep2Submit)} className="space-y-6">
                        {/* OTP Input */}
                        <FormField
                            control={step2Form.control}
                            name="otp"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <div className="flex justify-center gap-4">
                                            {[0, 1, 2, 3].map((index) => (
                                                <input
                                                    key={index}
                                                    type="text"
                                                    maxLength={1}
                                                    className={`w-12 h-12 lg:w-16 lg:h-16 rounded-md bg-[#EDF2F7] border-2 text-center text-xl lg:text-2xl text-[#425466] focus:outline-none focus:ring-2 focus:ring-[#27272E] ${step2Form.formState.errors.otp ? "border-[#ff4444]" : "border-[#27272E]"
                                                        }`}
                                                    value={field.value[index] || ''}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        if (/^\d$/.test(value) || value === '') {
                                                            const newOtp = field.value.split('');
                                                            newOtp[index] = value;
                                                            field.onChange(newOtp.join(''));

                                                            // Auto-focus next input
                                                            if (value && index < 3) {
                                                                const nextInput = document.querySelector(`input[data-index="${index + 1}"]`) as HTMLInputElement;
                                                                nextInput?.focus();
                                                            }
                                                        }
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Backspace' && !field.value[index] && index > 0) {
                                                            const prevInput = document.querySelector(`input[data-index="${index - 1}"]`) as HTMLInputElement;
                                                            prevInput?.focus();
                                                        }
                                                    }}
                                                    data-index={index}
                                                />
                                            ))}
                                        </div>
                                    </FormControl>
                                    <FormMessage className="flex justify-center" />
                                </FormItem>
                            )}
                        />

                        {/* Resend OTP Timer */}
                        <div className="text-center">
                            {!canResend ? (
                                <p className="text-sm text-[#425466]">
                                    Resend OTP in {formatTime(otpTimer)}
                                </p>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleResendOtp}
                                    className="text-sm text-[#0BB248] hover:text-[#0BB248]/80 font-medium"
                                    disabled={sendOtpMutation.isPending}
                                >
                                    Resend OTP
                                </button>
                            )}
                        </div>

                        {/* Change Email Link */}
                        <div className="text-center">
                            <button
                                type="button"
                                onClick={handleBackToStep1}
                                className="text-sm text-[#425466]"
                            >
                                Wrong E-mail? <span className="text-[#0BB248] font-medium">Change E-mail</span>
                            </button>
                        </div>

                        {/* New Password Field */}
                        <FormField
                            control={step2Form.control}
                            name="newPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <div className="relative">
                                            <FloatingLabelInput
                                                {...field}
                                                id="newPassword"
                                                type={showPassword ? "text" : "password"}
                                                label="Type in New Password"
                                                className={`w-full pr-10 ${step2Form.formState.errors.newPassword ? "border-[#ff4444] focus-visible:border-[#ff4444] focus-visible:ring-[#ff4444]/20" : "border-input focus-visible:border-input focus-visible:ring-input"}`}
                                                disabled={resetPasswordMutation.isPending}
                                            />
                                            <button
                                                type="button"
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                                                onClick={() => setShowPassword(!showPassword)}
                                                disabled={resetPasswordMutation.isPending}
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
                                    <div className="text-xs text-gray-500 mt-1">Must be 8 characters long</div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Confirm Password Field */}
                        <FormField
                            control={step2Form.control}
                            name="confirmPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <div className="relative">
                                            <FloatingLabelInput
                                                {...field}
                                                id="confirmPassword"
                                                type={showConfirmPassword ? "text" : "password"}
                                                label="Retype in New Password"
                                                className={`w-full pr-10 ${step2Form.formState.errors.confirmPassword ? "border-[#ff4444] focus-visible:border-[#ff4444] focus-visible:ring-[#ff4444]/20" : "border-input focus-visible:border-input focus-visible:ring-input"}`}
                                                disabled={resetPasswordMutation.isPending}
                                            />
                                            <button
                                                type="button"
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                disabled={resetPasswordMutation.isPending}
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
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button
                            type="submit"
                            className="w-full bg-[#27272E] hover:bg-[#27272E]/90 text-white font-medium py-3 rounded-lg"
                            disabled={resetPasswordMutation.isPending}
                        >
                            {resetPasswordMutation.isPending ? "Verifying..." : "Verify & Save"}
                        </Button>
                    </form>
                </Form>
            )}
        </div>
    );
}
