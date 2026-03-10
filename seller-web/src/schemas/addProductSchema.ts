import { z } from 'zod';

export const addProductSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.string().min(1, "Category is required"),
  subCategory: z.string().min(1, "Sub-category is required"),
  brand: z.string().optional(),
  basePrice: z.number({ error: "Price must be greater than 0" }).min(1, "Price must be greater than 0"),
  discountPrice: z.number({ error: "Discount Price must be a number" }).min(0).optional(),
  quantity: z.number({ error: "Quantity must be at least 1" }).min(1, "Quantity must be at least 1"),
  weight: z.number({ error: "Weight must be greater than 0" }).min(0.1, "Weight must be greater than 0"),
  weightUnit: z.enum(['kg', 'g', 'lb', 'oz']).default('kg'),
  dimensions: z.object({
    length: z.number().optional(),
    width: z.number().optional(),
    height: z.number().optional()
  }).optional(),
  condition: z.string().min(1, "Condition is required"),
  tags: z.array(z.string()).optional(),
  images: z.array(z.object({
    url: z.string(),
    file: z.any().optional(), // For file upload handling
    contentType: z.string().optional(),
    isDefault: z.boolean().optional()
  })).min(1, "At least one image is required").max(5, "Maximum 5 images allowed"),
  status: z.enum(['active', 'draft']).default('active'),
  freeShipping: z.boolean().optional().default(false),
  // Variant structure placeholder if needed later
  variants: z.array(z.any()).optional()
});

export type AddProductFormValues = z.infer<typeof addProductSchema>;
