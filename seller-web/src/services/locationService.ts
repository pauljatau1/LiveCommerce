import { API_CONFIG } from "@/config/constants";
import { apiService } from "@/services/apiService";
import type { StatesResponse, CitiesResponse } from "@/types";

const LOCATION_ENDPOINTS = {
  fetchStates: "/orders/states",
  fetchCities: "/orders/cities",
} as const;

export const locationService = {
  /**
   * Fetch all states for Nigeria
   *
   * @returns Promise<State[]> - Array of states
   */
  async fetchStates(): Promise<StatesResponse["data"]> {
    const url = LOCATION_ENDPOINTS.fetchStates;
    const config = {
      baseURL: API_CONFIG.BASE_URL_V2,
    };
    const response = await apiService.get<StatesResponse>(url, config);
    console.log("states service", response.data);
    return response.data.data;
  },

  /**
   * Fetch cities for a given state code
   *
   * @param stateCode - The ISO code of the state (e.g., "LA" for Lagos)
   * @returns Promise<City[]> - Array of cities
   */
  async fetchCities(stateCode: string): Promise<CitiesResponse["data"]> {
    const url = `${LOCATION_ENDPOINTS.fetchCities}/${stateCode}`;
    const config = {
      baseURL: API_CONFIG.BASE_URL_V2,
    };
    const response = await apiService.get<CitiesResponse>(url, config);
    console.log("cities service", response.data);
    return response.data.data;
  },
};

