import { z } from "zod";

/**
 * Phone number validation schema for OTP request
 * Supports various formats: 10-digit local, 11-digit local, or international format
 */
export const phoneOtpRequestSchema = z.object({
  phoneNumber: z
    .string()
    .min(1, "Phone number is required")
    .regex(/^(\+?234|0)?[0-9]{10}$/, "Please enter a valid phone number")
    .transform((val) => {
      // Normalize phone number: remove +234 or 0 prefix and return 10 digits
      let cleaned = val.replace(/\s+/g, ""); // Remove spaces
      
      // Remove +234 prefix
      if (cleaned.startsWith("+234")) {
        cleaned = cleaned.slice(4);
      }
      // Remove 234 prefix
      else if (cleaned.startsWith("234")) {
        cleaned = cleaned.slice(3);
      }
      // Remove 0 prefix
      else if (cleaned.startsWith("0")) {
        cleaned = cleaned.slice(1);
      }
      
      // Return 10-digit number
      return cleaned;
    })
    .refine((val) => val.length === 10, {
      message: "Phone number must be 10 digits",
    }),
});

/**
 * OTP verification schema
 * Validates phone number and 4-digit OTP
 */
export const phoneOtpVerifySchema = z.object({
  phoneNumber: z
    .string()
    .min(1, "Phone number is required")
    .regex(/^(\+?234|0)?[0-9]{10}$/, "Please enter a valid phone number")
    .transform((val) => {
      // Normalize phone number: remove +234 or 0 prefix and return 10 digits
      let cleaned = val.replace(/\s+/g, ""); // Remove spaces
      
      // Remove +234 prefix
      if (cleaned.startsWith("+234")) {
        cleaned = cleaned.slice(4);
      }
      // Remove 234 prefix
      else if (cleaned.startsWith("234")) {
        cleaned = cleaned.slice(3);
      }
      // Remove 0 prefix
      else if (cleaned.startsWith("0")) {
        cleaned = cleaned.slice(1);
      }
      
      // Return 10-digit number
      return cleaned;
    })
    .refine((val) => val.length === 10, {
      message: "Phone number must be 10 digits",
    }),
  otp: z
    .string()
    .min(1, "OTP is required")
    .length(4, "OTP must be exactly 4 digits")
    .regex(/^[0-9]{4}$/, "OTP must contain only numbers"),
});

export type PhoneOtpRequestFormData = z.infer<typeof phoneOtpRequestSchema>;
export type PhoneOtpVerifyFormData = z.infer<typeof phoneOtpVerifySchema>;

