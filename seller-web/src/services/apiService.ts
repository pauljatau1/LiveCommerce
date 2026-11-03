import axios, {
    type AxiosRequestConfig,
    type AxiosInstance,
    type AxiosError,
    type InternalAxiosRequestConfig,
    type AxiosResponse,
  } from "axios";
  import { API_CONFIG } from "../config/constants";
  import { tokenUtils } from "@/util/auth"
  
  /**
   * Generic API service for making HTTP requests
   *
   * Provides a centralized way to handle all API calls with consistent error handling,
   * request/response transformation, and configuration.
   */
  
  
  /**
   * LOG NETWORK DATA
   */
  const logNetworkData = (
    config: AxiosRequestConfig,
    status: number,
    data: unknown
  ) => {
    const APP_STATE = import.meta.env.VITE_APP_STATE;
    if (APP_STATE === "development") {
      console.log(
        "\n====================>\n",
        JSON.stringify(config, null, 4),
        "\n====================>"
      );
    } else {
      console.log(
        "\n<========== HTTP " + status + " ==========\n",
        JSON.stringify(data, null, 4),
        "\n<=============================="
      );
    }
  };
  
  /**
   * LOG NETWORK ERROR
   */
  
  const logNetworkError = (error: AxiosError) => {
    if (error.response) {
      const { status, data, config } = error.response;
      logNetworkData(config as AxiosRequestConfig, status, data);
    } else {
      if (import.meta.env.VITE_APP_STATE === "development") {
        console.log('logNetworkError', JSON.stringify(error, null, 4));
      }
    }
  }
  
  class ApiService {
    private api: AxiosInstance;
  
    constructor() {
      const hasHeaderSetter = (
        headers: unknown
      ): headers is { set: (name: string, value: string) => void } => {
        return (
          !!headers && typeof (headers as { set?: unknown }).set === "function"
        );
      };
  
      // API configuration
      this.api = axios.create({
        baseURL: API_CONFIG.BASE_URL,
        //timeout: API_CONFIG.TIMEOUT,
        headers: {
          "Content-Type": "application/json",
        },
      });
  
      // Request interceptor to add auth headers
      this.api.interceptors.request.use(
        (config: InternalAxiosRequestConfig) => {
          const token = tokenUtils.getBearerToken();
          if (token) {
            const { headers } = config;
            if (hasHeaderSetter(headers)) {
              headers.set("Authorization", `Bearer ${token}`);
            } else {
              const plainHeaders =
                (headers as Record<string, string> | undefined) ?? {};
              config.headers = {
                ...plainHeaders,
                Authorization: `Bearer ${token}`,
              } as unknown as InternalAxiosRequestConfig["headers"];
            }
          }
          return config;
        },
        (error: AxiosError) => {
          logNetworkError(error);
          return Promise.reject(error);
        }
      );
    }
  
    /**
     * Generic GET method
     *
     * @param url - API endpoint URL
     * @param config - Optional axios configuration
     * @returns Promise<T> - Response data
     */
    async get<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
      const response = await this.api.get(url, config);
  
      const { status, data } = response;
      logNetworkData(config as AxiosRequestConfig, status, data);
      return response;
    }
  
    /**
     * Generic POST method
     *
     * @param url - API endpoint URL
     * @param data - Request body data
     * @param config - Optional axios configuration
     * @returns Promise<T> - Response data
     */
    async post<T, D = Record<string, unknown>>(
      url: string,
      data?: D,
      config?: AxiosRequestConfig
    ): Promise<T> {
      const response = await this.api.post(url, data, config);
  
      const { status, data: responseData } = response;
      logNetworkData(config as AxiosRequestConfig, status, responseData);
      return response.data;
    }
  
    /**
     * Generic PUT method
     *
     * @param url - API endpoint URL
     * @param data - Request body data
     * @param config - Optional axios configuration
     * @returns Promise<T> - Response data
     */
    async put<T, D = Record<string, unknown>>(
      url: string,
      data?: D,
      config?: AxiosRequestConfig
    ): Promise<T> {
      const response = await this.api.put(url, data, config);
  
      const { status, data: responseData } = response;
      logNetworkData(config as AxiosRequestConfig, status, responseData);
      return response.data;
    }
  
    /**
     * Generic DELETE method
     *
     * @param url - API endpoint URL
     * @param config - Optional axios configuration
     * @returns Promise<T> - Response data
     */
    async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
      const response = await this.api.delete(url, config);
  
      const { status, data: responseData } = response;
      logNetworkData(config as AxiosRequestConfig, status, responseData);
      return response.data;
    }
  
    /**
     * Generic PATCH method
     *
     * @param url - API endpoint URL
     * @param data - Request body data
     * @param config - Optional axios configuration
     * @returns Promise<T> - Response data
     */
    async patch<T, D = Record<string, unknown>>(
      url: string,
      data?: D,
      config?: AxiosRequestConfig
    ): Promise<T> {
      const response = await this.api.patch(url, data, config);
  
      const { status, data: responseData } = response;
      logNetworkData(config as AxiosRequestConfig, status, responseData);
      return response.data;
    }
  }
  
  export const apiService = new ApiService();
  