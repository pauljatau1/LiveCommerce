// import seller type
import type { Seller } from "../types";

const LOCAL_STORAGE_KEYS = {
  AUTH_TOKEN: "sellerToken",
  USER: "seller",
} as const;

/**
 * Token management utilities
 */

export const tokenUtils = {
  /**
   * Store auth bearer token in local storage
   */

  storeBearerToken: (token: { data: string, isVerified: boolean }) => {
    if (token) {
      console.log("storing bearer token", token);
      localStorage.setItem(
        LOCAL_STORAGE_KEYS.AUTH_TOKEN,
        JSON.stringify(token)
      );
    }
  },

  /**
   * Get auth token object from local storage
   */

  getBearerToken: (): string | null => {
    const token = localStorage.getItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN);

    if (token) {
      return JSON.parse(token)?.data;
    } else {
      return null;
    }
  },

  /**
   * Remove auth bearer token from local storage
   */

  clearBearerToken: () => {
    localStorage.removeItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN);
  },
};

/**
 * User management utilities
 */

export const sellerUtils = {
  /**
   * Get seller from local storage
   */

  getSeller: (): Seller | null => {
    const user = localStorage.getItem(LOCAL_STORAGE_KEYS.USER);
    return user ? JSON.parse(user) : null;
  },

  /**
   * store seller in local storage
   */

  storeSeller: (user: Seller) => {
    if (user) {
      console.log("storing seller", user);
      localStorage.setItem(LOCAL_STORAGE_KEYS.USER, JSON.stringify(user));
    }
  },

  /**
   * Clear seller data from local storage
   */

  clearSeller: (): void => {
    localStorage.removeItem(LOCAL_STORAGE_KEYS.USER);
  },
};

/**
 * Authentication utilities
 */

export const authUtils = {
  /**
   * Check if user is authenticated - requires both JWT token and user data
   */

  isAuthenticated: () => {
    const token = tokenUtils.getBearerToken();
    console.log("isAuthenticated token", token);
    const seller = sellerUtils.getSeller();
    console.log("isAuthenticated seller", seller);
    return token && seller ? true : false;
  },

  /**
   * Clear all authentication data from local storage
   */
  clearAllAuthData: () => {
    tokenUtils.clearBearerToken();
    sellerUtils.clearSeller();
  },
};
