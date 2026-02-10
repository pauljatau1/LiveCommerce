import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import PhoneIcon from "@/assets/icons/PhoneIcon";
import KeyIcon from "@/assets/icons/KeyIcon";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/Components/ui/dialog";
import { Input } from "@/Components/ui/form/input";
import { sellerService } from "@/services/sellerService";
import { phoneOtpRequestSchema, phoneOtpVerifySchema } from "@/schemas/phoneOtpSchema";
import type { PhoneOtpRequestFormData, PhoneOtpVerifyFormData } from "@/schemas/phoneOtpSchema";
import { useNotification } from "@/Hooks/useNotification";
import { useAuthContext } from "@/Hooks/useAuthContextV2";
import { isAxiosError } from "axios";
import { extractAxiosErrorMessage } from "@/util/helpers";
import NigerianFlagIcon from "@/assets/icons/NigerianFlagIcon";

interface PhoneOtpVerificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PhoneOtpVerificationModal({
  open,
  onOpenChange,
}: PhoneOtpVerificationModalProps) {
  const { seller } = useAuthContext();
  const { showNotification } = useNotification();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [resendTimer, setResendTimer] = useState(0);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpValues, setOtpValues] = useState<string[]>(["", "", "", ""]);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Phone number form
  const phoneForm = useForm<PhoneOtpRequestFormData>({
    resolver: zodResolver(phoneOtpRequestSchema),
    defaultValues: {
      phoneNumber: "",
    },
  });

  // OTP form
  const otpForm = useForm<PhoneOtpVerifyFormData>({
    resolver: zodResolver(phoneOtpVerifySchema),
    defaultValues: {
      phoneNumber: "",
      otp: "",
    },
  });

  // Initialize phone number from seller context
  useEffect(() => {
    if (seller?.phoneNumber && open && step === "phone") {
      let phone = String(seller.phoneNumber || ""); // Ensure it's a string
      
      // Remove +234 or 234 prefix
      if (phone.startsWith("+234")) {
        phone = phone.slice(4);
      } else if (phone.startsWith("234")) {
        phone = phone.slice(3);
      }
      // Remove 0 prefix
      else if (phone.startsWith("0")) {
        phone = phone.slice(1);
      }

      // If it's a valid 10-digit number, set it
      if (/^[0-9]{10}$/.test(phone)) {
        setPhoneNumber(phone);
        // Use setValue with proper options to ensure form state is updated
        phoneForm.setValue("phoneNumber", phone, {
          shouldValidate: false,
          shouldDirty: false,
          shouldTouch: false,
        });
      } else {
        // If not in expected format, try to extract valid number
        const extractedPhone = phone.replace(/\D/g, "").slice(-10);
        if (extractedPhone.length === 10) {
          setPhoneNumber(extractedPhone);
          phoneForm.setValue("phoneNumber", extractedPhone, {
            shouldValidate: false,
            shouldDirty: false,
            shouldTouch: false,
          });
        } else {
          // Use the original phone number and let validation handle it
          const originalPhone = String(seller.phoneNumber || "");
          setPhoneNumber(originalPhone);
          phoneForm.setValue("phoneNumber", originalPhone, {
            shouldValidate: false,
            shouldDirty: false,
            shouldTouch: false,
          });
        }
      }
    } else if (open && step === "phone" && !seller?.phoneNumber) {
      // Reset form when modal opens without phone number
      phoneForm.setValue("phoneNumber", "", {
        shouldValidate: false,
        shouldDirty: false,
        shouldTouch: false,
      });
      setPhoneNumber("");
    }
  }, [seller?.phoneNumber, open, step]);

  // Send OTP mutation
  const sendOtpMutation = useMutation({
    mutationFn: (data: PhoneOtpRequestFormData) =>
      sellerService.sendPhoneVerificationOtp(data.phoneNumber),
    onSuccess: () => {
      showNotification("Verification code sent successfully", "information");
      setStep("otp");
      setResendTimer(30); // Start 30-second countdown
      otpForm.setValue("phoneNumber", phoneForm.getValues("phoneNumber"));
      // Focus first OTP input
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    },
    onError: (error) => {
      if (isAxiosError(error)) {
        const errorMessage = extractAxiosErrorMessage(error);
        console.error("Error sending OTP:", errorMessage);
        showNotification(errorMessage, "error");
      } else {
        showNotification("Failed to send verification code. Please try again.", "error");
      }
    },
  });

  // Verify OTP mutation
  const verifyOtpMutation = useMutation({
    mutationFn: (data: PhoneOtpVerifyFormData) =>
      sellerService.verifyPhoneOtp(data.phoneNumber, data.otp),
    onSuccess: () => {
      showNotification("Phone number verified successfully", "information");
      // Invalidate seller profile query to refresh data
      queryClient.invalidateQueries({ queryKey: ["sellerProfile"] });
      queryClient.invalidateQueries({ queryKey: ["sellerDetails"] });
      // Close modal and reset state
      onOpenChange(false);
      setTimeout(() => {
        setStep("phone");
        phoneForm.reset();
        otpForm.reset();
        setPhoneNumber("");
        setOtpValues(["", "", "", ""]);
      }, 300);
    },
    onError: (error) => {
      if (isAxiosError(error)) {
        const errorMessage = extractAxiosErrorMessage(error);
        showNotification(errorMessage, "error");
      } else {
        showNotification("Invalid verification code. Please try again.", "error");
      }
      // Clear OTP inputs on error
      setOtpValues(["", "", "", ""]);
      otpForm.setValue("otp", "");
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    },
  });

  // Resend OTP mutation
  const resendOtpMutation = useMutation({
    mutationFn: () => {
      const phoneNumberValue = phoneForm.getValues("phoneNumber") || phoneNumber || "";
      if (!phoneNumberValue) {
        throw new Error("Phone number is required");
      }
      return sellerService.sendPhoneVerificationOtp(phoneNumberValue);
    },
    onSuccess: () => {
      showNotification("Verification code resent successfully", "information");
      setResendTimer(30); // Reset timer
      // Clear OTP inputs
      setOtpValues(["", "", "", ""]);
      otpForm.setValue("otp", "");
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    },
    onError: (error) => {
      if (isAxiosError(error)) {
        const errorMessage = extractAxiosErrorMessage(error);
        showNotification(errorMessage, "error");
      } else {
        showNotification("Failed to resend verification code. Please try again.", "error");
      }
    },
  });

  // Countdown timer for resend OTP
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => {
        setResendTimer(resendTimer - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  // Handle phone form submission
  const onPhoneSubmit = (data: PhoneOtpRequestFormData) => {
    // Ensure phoneNumber is always a string and not undefined
    const phoneNumberValue = data.phoneNumber || phoneForm.getValues("phoneNumber") || phoneNumber || "";
    
    if (!phoneNumberValue || phoneNumberValue.trim().length === 0) {
      phoneForm.setError("phoneNumber", {
        type: "manual",
        message: "Phone number is required",
      });
      return;
    }
    
    setPhoneNumber(phoneNumberValue);
    sendOtpMutation.mutate({
      phoneNumber: phoneNumberValue,
    });
  };

  // Handle OTP form submission
  const onOtpSubmit = (data: PhoneOtpVerifyFormData) => {
    verifyOtpMutation.mutate(data);
  };

  // Handle OTP input change
  const handleOtpChange = (index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/\D/g, "").slice(0, 1);
    
    // Update state
    const newOtpValues = [...otpValues];
    newOtpValues[index] = digit;
    setOtpValues(newOtpValues);

    // Update form value
    const newOtp = newOtpValues.join("");
    otpForm.setValue("otp", newOtp, { shouldValidate: true });

    // Auto-focus next input
    if (digit && index < 3) {
      setTimeout(() => {
        otpInputRefs.current[index + 1]?.focus();
      }, 0);
    }

    // Auto-submit when all 4 digits are entered
    if (newOtp.length === 4 && index === 3) {
      setTimeout(() => {
        otpForm.handleSubmit(onOtpSubmit)();
      }, 100);
    }
  };

  // Handle OTP input keydown (backspace)
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpInputRefs.current[index]?.value && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste OTP
  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    
    if (pastedData.length === 4) {
      const newOtpValues = pastedData.split("");
      setOtpValues(newOtpValues);
      otpForm.setValue("otp", pastedData, { shouldValidate: true });
      otpInputRefs.current[3]?.focus();
      // Auto-submit
      setTimeout(() => {
        otpForm.handleSubmit(onOtpSubmit)();
      }, 100);
    }
  };

  // Handle change number
  const handleChangeNumber = () => {
    setStep("phone");
    otpForm.reset();
    setOtpValues(["", "", "", ""]);
    setResendTimer(0);
  };

  // Handle resend OTP
  const handleResendOtp = () => {
    if (resendTimer === 0) {
      resendOtpMutation.mutate();
    }
  };

  // Format phone number for display
  const formatPhoneNumber = (phone: string) => {
    if (phone.length === 10) {
      return `${phone.slice(0, 2)} ${phone.slice(2, 5)} ${phone.slice(5, 8)} ${phone.slice(8)}`;
    }
    return phone;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="md::max-w-[635px] rounded-[21px] " showCloseButton={true}>
        {step === "phone" ? (
          <>
            <DialogHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-[#23AD56] flex items-center justify-center">
                  <PhoneIcon width={32} height={32} color="#FFFFFF" />
                </div>
              </div>
              <DialogTitle className="text-2xl font-bold text-gray-900">
                Add Your Phone Number
              </DialogTitle>
              <DialogDescription className="text-sm md:text-base text-gray-600 mt-2">
                Enter your phone number to authenticate your account with us.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)} className="space-y-6 py-[20px] mt-6">
              <div className="space-y-2">
                <label htmlFor="phoneNumber" className="text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <div className="flex w-full">
                  {/* Country Code Selector */}
                  <div className="flex items-center border border-gray-300 rounded-l-md px-3 bg-white border-r-1">
                    <div className="flex items-center space-x-2">
                      <NigerianFlagIcon width={20} height={20} className="" />
                      <span className="text-sm text-gray-600">+234</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <Input
                      type="tel"
                      inputMode="numeric"
                      autoFocus={false}
                      placeholder="80 1234 567"
                      className="rounded-l-none border-l-0"
                      {...phoneForm.register("phoneNumber", {
                        onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                          const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                          // Update both form state and local state
                          phoneForm.setValue("phoneNumber", value, { 
                            shouldValidate: true,
                            shouldDirty: true,
                            shouldTouch: true
                          });
                          setPhoneNumber(value);
                        },
                      })}
                      value={phoneForm.watch("phoneNumber") || ""}
                    />
                  </div>
                </div>
                {phoneForm.formState.errors.phoneNumber && (
                  <p className="text-sm text-red-500">
                    {phoneForm.formState.errors.phoneNumber.message}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={sendOtpMutation.isPending || !phoneForm.watch("phoneNumber") || phoneForm.watch("phoneNumber")?.length === 0}
                  className="w-full text-white text-sm md:text-base font-medium py-3 px-4 rounded-lg transition-colors disabled:cursor-not-allowed disabled:bg-[#7A828A] bg-[#23AD56] hover:bg-[#1e9a4a]"
                >
                  {sendOtpMutation.isPending ? "Sending..." : "Send Verification Code"}
                </button>
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="w-full border border-gray-300 rounded-lg py-2 px-4 text-gray-600 hover:text-gray-700 font-medium text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <DialogHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center">
                  <KeyIcon width={32} height={32} color="#FFFFFF" />
                </div>
              </div>
              <DialogTitle className="text-2xl font-bold text-gray-900">
                Enter Verification Code
              </DialogTitle>
              <DialogDescription className="text-base text-gray-600 mt-2">
                Type in the 4-digit code sent to +234 {formatPhoneNumber(phoneNumber)}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-6 mt-6">
              <div className="space-y-4">
                <div className="flex justify-center gap-3">
                  {[0, 1, 2, 3].map((index) => (
                    <input
                      key={index}
                      ref={(el: HTMLInputElement | null) => {
                        otpInputRefs.current[index] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={otpValues[index]}
                      className="w-14 h-14 text-center text-xl font-semibold border border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:outline-none"
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => handleOtpKeyDown(index, e)}
                      onPaste={handleOtpPaste}
                    />
                  ))}
                </div>
                {otpForm.formState.errors.otp && (
                  <p className="text-sm text-red-500 text-center">
                    {otpForm.formState.errors.otp.message}
                  </p>
                )}
              </div>

              <div className="space-y-3 text-center">
                <div className="text-sm text-gray-600">
                  {resendTimer > 0 ? (
                    <span>Resend OTP in {String(Math.floor(resendTimer / 60)).padStart(2, "0")}:{String(resendTimer % 60).padStart(2, "0")}</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resendOtpMutation.isPending}
                      className="text-green-600 hover:text-green-700 font-medium disabled:opacity-50"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>

                <div className="text-sm text-gray-600">
                  Wrong Number?{" "}
                  <button
                    type="button"
                    onClick={handleChangeNumber}
                    className="text-green-600 hover:text-green-700 font-medium"
                  >
                    Change Number
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={verifyOtpMutation.isPending || otpForm.getValues("otp")?.length !== 4 || !otpForm.getValues("otp")}
                  className="w-full text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:cursor-not-allowed disabled:bg-[#7A828A] bg-[#23AD56] hover:bg-[#1e9a4a]"
                >
                  {verifyOtpMutation.isPending ? "Verifying..." : "Verify & Save"}
                </button>
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="w-full text-green-600 hover:text-green-700 font-medium text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
