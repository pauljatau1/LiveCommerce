import { z } from "zod";

/**
 * Forgot password form validation schema using Zod
 * Defines the structure and validation rules for the forgot password form
 */
export const forgotPasswordStep1Schema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address")
    .min(1, "Email is required")
    .toLowerCase()
    .trim(),
});

export const forgotPasswordStep2Schema = z.object({
  otp: z
    .string()
    .min(6, "Please enter the complete 6-digit code")
    .max(6, "Code must be exactly 6 digits")
    .regex(/^\d{6}$/, "Please enter a valid 6-digit code"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .min(1, "Password is required"),
  confirmPassword: z
    .string()
    .min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type ForgotPasswordStep1Data = z.infer<typeof forgotPasswordStep1Schema>;
export type ForgotPasswordStep2Data = z.infer<typeof forgotPasswordStep2Schema>;
