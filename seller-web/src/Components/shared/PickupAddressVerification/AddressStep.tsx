import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/Components/ui/form/form";
import { Label } from "@/Components/ui/label";
import { Input } from "@/Components/ui/form/input";
import { Skeleton } from "@/Components/shared/Skeleton";
import { Globe, Info, AlertCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/select";
import { UseFormReturn } from "react-hook-form";
import type { PickupAddressFormData } from "@/schemas/pickupAddressSchema";
import type { State, City } from "@/types";
import StateIcon from "@/assets/icons/StateIcon";
import CityIcon from "@/assets/icons/CityIcon";
import ZipCodeIcon from "@/assets/icons/ZipCodeIcon";
import LocationIcon from "@/assets/icons/LocationIcon";

interface AddressStepProps {
  form: UseFormReturn<PickupAddressFormData>;
  states: State[];
  cities: City[];
  isLoadingStates: boolean;
  isLoadingCities: boolean;
  isErrorStates: boolean;
  isErrorCities: boolean;
}

export default function AddressStep({
  form,
  states,
  cities,
  isLoadingStates,
  isLoadingCities,
  isErrorStates,
  isErrorCities,
}: AddressStepProps) {
  const selectedState = form.watch("state");

  return (
    <div className="space-y-6 py-4">
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4 flex items-center gap-3">
        <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
        <p className="text-xs text-blue-700 dark:text-blue-300">
          This address will be used as your pickup location for order fulfillment. Please ensure
          all details are accurate.
        </p>
      </div>

      {/* Country, State, City and Zip Code Select */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="country"
          render={({ field }) => (
            <FormItem>
              <Label htmlFor="country" className="flex items-center gap-1.5 text-sm text-[#888787] font-lexend font-medium">
                <Globe className="h-4 w-4 text-gray-500" /> Country{" "}
                <span className="text-red-500">*</span>
              </Label>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange} defaultValue="nigeria">
                  <SelectTrigger className="w-full h-10 text-xs border-gray-300 focus:ring-1 focus:ring-green-500 focus:border-green-500 ">
                    <SelectValue placeholder="Select your country" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem className="text-xs 3xl:text-sm hover:bg-gray-100 cursor-pointer" value="nigeria">Nigeria</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="state"
          render={({ field }) => (
            <FormItem>
              <Label htmlFor="state" className="flex items-center gap-1.5 text-sm text-[#888787] font-lexend font-medium">
                <StateIcon className="h-4 w-4 text-gray-500" /> State/Province{" "}
                <span className="text-red-500">*</span>
              </Label>
              <FormControl>
                {isLoadingStates ? (
                  <Skeleton className="h-10 w-full" />
                ) : isErrorStates ? (
                  <div className="flex items-center gap-2 text-xs text-red-600 p-2 border border-red-200 rounded-md bg-red-50">
                    <AlertCircle className="h-4 w-4" />
                    <span>Failed to load states. Please try again.</span>
                  </div>
                ) : (
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      form.setValue("city", ""); // Reset city when state changes
                    }}
                  >
                    <SelectTrigger className="w-full text-xs border-gray-300 focus:ring-1 focus:ring-green-500 focus:border-green-500 h-10">
                      <SelectValue placeholder="Select your state" />
                    </SelectTrigger>
                    <SelectContent className="bg-white max-h-[300px]">
                      {states.map((state: State) => (
                        <SelectItem className="text-xs 3xl:text-sm hover:bg-gray-100 cursor-pointer" key={state.isoCode} value={state.name}>
                          {state.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* City Select */}
        <FormField
          control={form.control}
          name="city"
          render={({ field }) => (
            <FormItem>
              <Label htmlFor="city" className="flex items-center gap-1.5 text-sm text-[#888787] font-lexend font-medium">
                <CityIcon className="h-4 w-4 text-gray-500" /> City{" "}
                <span className="text-red-500">*</span>
              </Label>
              <FormControl>
                {!selectedState ? (
                  <Select disabled>
                    <SelectTrigger className="w-full text-xs border-gray-300 h-10">
                      <SelectValue placeholder="Select state first" />
                    </SelectTrigger>
                  </Select>
                ) : isLoadingCities ? (
                  <Skeleton className="h-10 w-full" />
                ) : isErrorCities ? (
                  <div className="flex items-center gap-2 text-xs text-red-600 p-2 border border-red-200 rounded-md bg-red-50">
                    <AlertCircle className="h-4 w-4" />
                    <span>Failed to load cities. Please try again.</span>
                  </div>
                ) : (
                  <Select value={field.value} onValueChange={field.onChange} disabled={!selectedState}>
                    <SelectTrigger className="w-full text-xs border-gray-300 focus:ring-1 focus:ring-green-500 focus:border-green-500 h-10">
                      <SelectValue placeholder="Select your city" />
                    </SelectTrigger>
                    <SelectContent className="bg-white max-h-[300px]">
                      {cities.map((city: City) => (
                        <SelectItem className="text-xs 3xl:text-sm hover:bg-gray-100 cursor-pointer" key={city.name} value={city.name}>
                          {city.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="zipCode"
          render={({ field }) => (
            <FormItem>
              <Label htmlFor="zipCode" className="flex items-center gap-1.5 text-sm text-[#888787] font-lexend font-medium">
                <ZipCodeIcon className="h-4 w-4 text-gray-500" /> Zip/Postal Code{" "}
                <span className="text-red-500">*</span>
              </Label>
              <FormControl>
                <Input
                  id="zipCode"
                  {...field}
                  placeholder="Zip/Postal code"
                  className="border-gray-300 text-xs focus-visible:ring-1 focus-visible:ring-green-500 focus-visible:border-green-500 placeholder:text-xs h-10"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="streetAddress1"
        render={({ field }) => (
          <FormItem>
            <Label
              htmlFor="streetAddress1"
              className="flex items-center gap-1.5 text-sm text-[#888787] font-lexend font-medium"
            >
              <LocationIcon className="h-4 w-4 " color="#425466" /> Street Address Line 1{" "}
              <span className="text-red-500">*</span>
            </Label>
            <FormControl>
              <Input
                id="streetAddress1"
                {...field}
                placeholder="Street address, P.O. box, company name"
                className="border-gray-300 text-xs focus-visible:ring-1 focus-visible:ring-green-500 focus-visible:border-green-500 placeholder:text-xs h-10"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="streetAddress2"
        render={({ field }) => (
          <FormItem>
            <Label
              htmlFor="streetAddress2"
              className="flex items-center gap-1.5 text-sm text-[#888787] font-lexend font-medium"
            >
              <LocationIcon className="h-4 w-4 " color="#425466" /> Street Address Line 2
            </Label>
            <FormControl>
              <Input
                id="streetAddress2"
                {...field}
                placeholder="Apartment, suite, unit, building, floor, etc."
                className="border-gray-300 text-xs focus-visible:ring-1 focus-visible:ring-green-500 focus-visible:border-green-500 placeholder:text-xs h-10"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

