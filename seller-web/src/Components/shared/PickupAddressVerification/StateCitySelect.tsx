import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/select";
import { Skeleton } from "@/Components/shared/Skeleton";
import { locationService } from "@/services/locationService";
import { AlertCircle } from "lucide-react";
import type { State, City } from "@/types";

interface StateCitySelectProps {
  selectedState: string;
  selectedCity: string;
  onStateChange: (state: string) => void;
  onCityChange: (city: string) => void;
  disabled?: boolean;
}

export function StateCitySelect({
  selectedState,
  selectedCity,
  onStateChange,
  onCityChange,
  disabled = false,
}: StateCitySelectProps) {
  // Fetch states
  const {
    data: states,
    isLoading: isLoadingStates,
    isError: isErrorStates,
  } = useQuery({
    queryKey: ["states"],
    queryFn: () => locationService.fetchStates(),
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  // Fetch cities when state is selected
  const {
    data: cities,
    isLoading: isLoadingCities,
    isError: isErrorCities,
  } = useQuery({
    queryKey: ["cities", selectedState],
    queryFn: () => {
      const state = states?.find((s) => s.name === selectedState);
      if (!state) throw new Error("State not found");
      return locationService.fetchCities(state.isoCode);
    },
    enabled: !!selectedState && !!states,
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  // Find selected state object to get ISO code
  const selectedStateObj = states?.find((s) => s.name === selectedState);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* State Select */}
      <div className="space-y-2">
        <label className="flex items-center gap-1.5 text-sm font-medium">
          <span className="text-red-500">*</span> State/Province
        </label>
        {isLoadingStates ? (
          <Skeleton className="h-10 w-full" />
        ) : isErrorStates ? (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span>Failed to load states. Please try again.</span>
          </div>
        ) : (
          <Select value={selectedState} onValueChange={onStateChange} disabled={disabled}>
            <SelectTrigger className="w-full border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 h-10">
              <SelectValue placeholder="Select your state" />
            </SelectTrigger>
            <SelectContent className="bg-gray-100 max-h-[300px]">
              {states?.map((state: State) => (
                <SelectItem key={state.isoCode} value={state.name}>
                  {state.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* City Select */}
      <div className="space-y-2">
        <label className="flex items-center gap-1.5 text-sm font-medium">
          <span className="text-red-500">*</span> City
        </label>
        {!selectedState ? (
          <Select disabled>
            <SelectTrigger className="w-full border-gray-300 h-10">
              <SelectValue placeholder="Select state first" />
            </SelectTrigger>
          </Select>
        ) : isLoadingCities ? (
          <Skeleton className="h-10 w-full" />
        ) : isErrorCities ? (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span>Failed to load cities. Please try again.</span>
          </div>
        ) : (
          <Select
            value={selectedCity}
            onValueChange={onCityChange}
            disabled={disabled || !selectedState}
          >
            <SelectTrigger className="w-full border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 h-10">
              <SelectValue placeholder="Select your city" />
            </SelectTrigger>
            <SelectContent className="bg-gray-100 max-h-[300px]">
              {cities?.map((city: City) => (
                <SelectItem key={city.name} value={city.name}>
                  {city.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}

