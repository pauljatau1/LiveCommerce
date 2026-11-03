import { z } from "zod";

/**
 * Login form validation schema using Zod
 * Defines the structure and validation rules for the login form
 */
export const loginSchema = z.object({
  email: z
    .email("Please enter a valid email address").min(1, "Email is required").toLowerCase().trim(),
  password: z
    .string()
    .min(1, "Password is required")
});

export type LoginFormData = z.infer<typeof loginSchema>;
