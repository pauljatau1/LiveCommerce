import { Icon } from '@iconify/react';
import { useAuthContext } from '../Hooks/useAuthContext';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const EmailVerificationModal = ({ isOpen, onClose, userEmail }) => {
    const { verifyOtp, requestNewOtp, isLoading } = useAuthContext();
    const [step, setStep] = useState('welcome'); // 'welcome', 'otp', 'success'
    const [otp, setOtp] = useState(['', '', '', '']);
    const [isResending, setIsResending] = useState(false);
    const [canResend, setCanResend] = useState(true);
    const [countdown, setCountdown] = useState(0);
    const [isRequestingOtp, setIsRequestingOtp] = useState(false);

    // Handle countdown for resend button
    useEffect(() => {
        let timer;
        if (countdown > 0) {
            timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        } else if (countdown === 0 && !canResend) {
            setCanResend(true);
        }
        return () => clearTimeout(timer);
    }, [countdown, canResend]);

    // Reset state when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setStep('welcome');
            setOtp(['', '', '', '']);
            setCanResend(true);
            setCountdown(0);
        }
    }, [isOpen]);

    const handleOtpChange = (index, value) => {
        if (value.length > 1) return; // Prevent multiple characters

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 3) {
            const nextInput = document.querySelector(`[data-otp-index="${index + 1}"]`);
            if (nextInput) nextInput.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        // Handle backspace to move to previous input
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            const prevInput = document.querySelector(`[data-otp-index="${index - 1}"]`);
            if (prevInput) prevInput.focus();
        }
    };

    const handleVerifyOtp = async () => {
        const otpCode = otp.join('');
        if (otpCode.length !== 4) {
            toast.error('Please enter a complete 4-digit code');
            return;
        }

        const success = await verifyOtp(userEmail, otpCode);
        if (success) {
            setStep('success');
        }
    };

    const handleRequestOtp = async () => {
        setIsRequestingOtp(true);
        const success = await requestNewOtp(userEmail);
        if (success) {
            toast.success('Verification code sent successfully');
            setOtp(['', '', '', '']); // Clear OTP inputs
            setIsRequestingOtp(false);
            setStep('otp');
            setCanResend(false);
            setCountdown(60);
        } else {
            setIsRequestingOtp(false);
            setStep('welcome');
        }
    };

    const handleResendOtp = async () => {
        if (!canResend || isResending) return;

        setIsResending(true);
        setCanResend(false);
        setCountdown(60);

        try {
            await requestNewOtp(userEmail);
            toast.success('Verification code sent successfully');
            setOtp(['', '', '', '']); // Clear OTP inputs
        } catch (error) {
            console.error('Resend OTP error:', error);
            setCanResend(true);
            setCountdown(0);
        } finally {
            setIsResending(false);
        }
    };

    const handleGetStarted = () => {
        onClose();
        // The user is already authenticated, so they'll stay on the dashboard
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                {/* Close Button */}
                <div className="flex justify-end p-4">
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                    >
                        <Icon icon="mdi:close" width="24" height="24" />
                    </button>
                </div>

                <div className="px-6 pb-6">
                    {/* Welcome Step */}
                    {step === 'welcome' && (
                        <div className="text-center">
                            <div className="mb-6">
                                <div className="w-16 h-16 bg-[#0BB248] rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Icon icon="mdi:email-outline" width="32" height="32" className="text-white" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Auqli!</h2>
                                <p className="text-gray-600 leading-relaxed">
                                    Please verify your email address to continue. We&apos;ve sent a verification code to
                                    <span className="block font-semibold text-gray-900 mt-1">{userEmail}</span>
                                </p>
                            </div>

                            <button
                                onClick={handleRequestOtp}
                                disabled={isRequestingOtp}
                                className="w-full bg-[#0BB248] flex items-center justify-center gap-2 text-white font-semibold py-3 px-6 rounded-xl hover:bg-green-600 transition-all duration-200 transform hover:scale-105 shadow-lg"
                            >
                                Verify Email
                                {isRequestingOtp && <Icon icon="mdi:loading" width="20" height="20" className="animate-spin ml-2" />}
                            </button>
                        </div>
                    )}

                    {/* OTP Step */}
                    {step === 'otp' && (
                        <div className="text-center">
                            <div className="mb-6">
                                <div className="w-16 h-16 bg-[#0BB248] rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Icon icon="mdi:key-outline" width="32" height="32" className="text-white" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">Enter Verification Code</h2>
                                <p className="text-gray-600 mb-4">
                                    We sent a 4-digit code to
                                    <span className="block font-semibold text-gray-900">{userEmail}</span>
                                </p>
                            </div>

                            {/* OTP Input */}
                            <div className="flex justify-center gap-3 mb-6">
                                {otp.map((digit, index) => (
                                    <input
                                        key={index}
                                        type="text"
                                        maxLength="1"
                                        value={digit}
                                        onChange={(e) => handleOtpChange(index, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(index, e)}
                                        data-otp-index={index}
                                        className="w-12 h-12 text-center text-xl font-semibold border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none transition-colors"
                                        placeholder="0"
                                    />
                                ))}
                            </div>

                            <button
                                onClick={handleVerifyOtp}
                                disabled={isLoading || otp.some(digit => !digit)}
                                className="w-full bg-[#0BB248] text-white font-semibold py-3 px-6 rounded-xl hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-lg mb-4"
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center">
                                        <Icon icon="mdi:loading" width="20" height="20" className="animate-spin mr-2" />
                                        Verifying...
                                    </div>
                                ) : (
                                    'Verify Code'
                                )}
                            </button>

                            {/* Resend Button */}
                            <button
                                onClick={handleResendOtp}
                                disabled={!canResend || isResending}
                                className="text-green-600 cursor-pointer text-sm hover:text-green-800 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isResending ? (
                                    <div className="flex items-center justify-center">
                                        <Icon icon="mdi:loading" width="16" height="16" className="animate-spin mr-1" />
                                        Sending...
                                    </div>
                                ) : canResend ? (
                                    'Resend Code'
                                ) : (
                                    `Resend in ${countdown}s`
                                )}
                            </button>
                        </div>
                    )}

                    {/* Success Step */}
                    {step === 'success' && (
                        <div className="text-center">
                            <div className="mb-6">
                                <div className="w-16 h-16 bg-[#0BB248] rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Icon icon="mdi:check" width="32" height="32" className="text-white" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Verified!</h2>
                                <p className="text-gray-600 leading-relaxed">
                                    Great! Your email has been successfully verified. You can now access all features of your Auqli seller account.
                                </p>
                            </div>

                            <button
                                onClick={handleGetStarted}
                                className="w-full bg-[#0BB248] text-white font-semibold py-3 px-6 rounded-xl hover:bg-green-600 transition-all duration-200 transform hover:scale-105 shadow-lg"
                            >
                                Get Started
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

EmailVerificationModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    userEmail: PropTypes.string.isRequired,
};

export default EmailVerificationModal; 