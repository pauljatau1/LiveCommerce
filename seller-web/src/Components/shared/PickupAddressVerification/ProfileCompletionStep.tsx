import { Building, Phone } from "lucide-react";
import { Label } from "@/Components/ui/label";
import { Input } from "@/Components/ui/form/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/Components/ui/form/form";
import { UseFormReturn } from "react-hook-form";
import type { ProfileCompletionFormData } from "@/schemas/pickupAddressSchema";

interface ProfileCompletionStepProps {
  form: UseFormReturn<ProfileCompletionFormData>;
}

export function ProfileCompletionStep({ form }: ProfileCompletionStepProps) {
  return (
    <div className="space-y-6 py-4">
      <FormField
        control={form.control}
        name="storeName"
        render={({ field }) => (
          <FormItem>
            <Label htmlFor="storeName" className="flex items-center gap-1.5 text-sm font-medium">
              <Building className="h-4 w-4 text-gray-500" /> Store Name{" "}
              <span className="text-red-500">*</span>
            </Label>
            <FormControl>
              <Input
                id="storeName"
                {...field}
                placeholder="Your store name"
                className="border-gray-300 text-xs placeholder:text-xs focus-visible:ring-1 focus-visible:ring-green-500 focus-visible:border-green-500 h-10"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="phoneNumber"
        render={({ field }) => (
          <FormItem>
            <Label htmlFor="phoneNumber" className="flex items-center gap-1.5 text-sm font-medium">
              <Phone className="h-4 w-4 text-gray-500" /> Phone Number{" "}
              <span className="text-red-500">*</span>
            </Label>
            <FormControl>
              <div className="flex w-full">
                <div className="flex items-center border border-gray-300 rounded-l-md px-3 bg-white border-r-0 text-gray-700 text-sm">
                  +234
                </div>
                <Input
                  id="phoneNumber"
                  {...field}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={10}
                  placeholder="8123456789"
                  onChange={(e) => {
                    const digitsOnly = (e.target.value || "").replace(/\D/g, "").slice(0, 10);
                    field.onChange(digitsOnly);
                  }}
                  className="border-gray-300 text-xs placeholder:text-xs focus-visible:ring-1 focus-visible:ring-green-500 focus-visible:border-green-500 h-10 rounded-l-none"
                />
              </div>
            </FormControl>
            <FormMessage />
            <p className="text-xs text-gray-500">Enter the remaining 10 digits after +234.</p>
          </FormItem>
        )}
      />
    </div>
  );
}

