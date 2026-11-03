import { z } from "zod";

/**
 * Profile completion schema for store name and phone number
 */
export const profileCompletionSchema = z.object({
  storeName: z
    .string()
    .min(1, "Store name is required")
    .min(2, "Store name must be at least 2 characters")
    .max(100, "Store name must be less than 100 characters")
    .trim(),
  phoneNumber: z
    .string()
    .min(1, "Phone number is required")
    .regex(/^\d{10}$/, "Phone number must be exactly 10 digits"),
});

/**
 * Pickup address form validation schema using Zod
 */
export const pickupAddressSchema = z.object({
  country: z.string().min(1, "Country is required"),
  state: z.string().min(1, "State is required"),
  city: z.string().min(1, "City is required"),
  streetAddress1: z
    .string()
    .min(1, "Street address is required")
    .min(5, "Street address must be at least 5 characters")
    .max(200, "Street address must be less than 200 characters")
    .trim(),
  streetAddress2: z
    .string()
    .max(200, "Street address line 2 must be less than 200 characters")
    .trim()
    .optional()
    .or(z.literal("")),
  zipCode: z
    .string()
    .min(1, "Zip/Postal code is required")
    .min(3, "Zip/Postal code must be at least 3 characters")
    .max(20, "Zip/Postal code must be less than 20 characters")
    .trim(),
});

/**
 * Account type selection schema
 */
export const accountTypeSchema = z.enum(["individual", "business"], {
  message: "Please select an account type",
});

export type ProfileCompletionFormData = z.infer<typeof profileCompletionSchema>;
export type PickupAddressFormData = z.infer<typeof pickupAddressSchema>;
export type AccountType = z.infer<typeof accountTypeSchema>;

