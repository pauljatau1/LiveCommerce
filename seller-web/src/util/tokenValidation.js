import axios from 'axios';
import { toast } from 'sonner';
import { BASE_URL } from '../Constants/Server';

// Keep track of consecutive validation errors to avoid false positives
let consecutiveValidationErrors = 0;
const MAX_VALIDATION_ERRORS = 3;

/**
 * Validates a token with the server and handles invalid token scenarios
 * @param {string} token - The authentication token to validate
 * @param {function} navigate - React Router's navigate function for redirection
 * @returns {Promise<boolean>} - Returns true if token is valid, false otherwise
 */
export const validateToken = async (token, navigate) => {
  if (!token) return false;
  
  // Check if we're on login or signup pages - skip validation there
  const isAuthPage = window.location.pathname.includes('/login') || 
                    window.location.pathname.includes('/signup');
  if (isAuthPage) {
    return true; // Skip validation on auth pages
  }
  
  // Use a timeout to prevent hanging validation requests
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  
  try {
    const response = await axios.get(`${BASE_URL}/seller/check-token`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    // Reset consecutive errors on successful validation
    consecutiveValidationErrors = 0;
    return response.status === 200;
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('Token validation error:', error);
    
    // Handle cancelled requests separately - don't treat as errors
    if (axios.isCancel(error)) {
      console.log('Request was cancelled');
      return true; // Continue as if valid since we can't verify
    }
    
    // Check for invalid token or unauthorized responses
    if (error.response?.data?.message === "Invalid token" || error.response?.status === 401) {
      // Only take action if we've seen several consecutive errors
      // This helps avoid intermittent network issues triggering logouts
      consecutiveValidationErrors++;
      
      if (consecutiveValidationErrors >= MAX_VALIDATION_ERRORS) {
        console.log("Multiple invalid token responses detected, redirecting to login");
        
        // Clean up localStorage
        localStorage.removeItem('sellerToken');
        localStorage.removeItem('seller');
        
        // Show notification to user (skip if already on login page)
        if (!isAuthPage) {
          toast.error("Session expired", {
            description: "Please log in again",
            style: {
              background: '#05031F',
              color: '#fff',
            }
          });
          
          // Redirect to login page if navigate function is provided
          if (navigate) {
            navigate('/login', { replace: true });
          }
        }
        
        // Reset counter
        consecutiveValidationErrors = 0;
        return false;
      }
      
      // For the first few errors, continue normally
      console.log(`Invalid token error ${consecutiveValidationErrors}/${MAX_VALIDATION_ERRORS} - not redirecting yet`);
      return true;
    }
    
    // Network errors - don't count these against consecutiveValidationErrors
    if (!error.response) {
      console.log('Network error during token validation, assuming token is still valid');
      return true;
    }
    
    // For network errors or server issues, assume the token is still valid
    // This prevents unnecessary logouts when server is having issues
    return true;
  }
};

/**
 * Handles API response errors with special handling for invalid tokens
 * @param {Error} error - The error object from an API call
 * @param {function} navigate - React Router's navigate function for redirection
 * @returns {boolean} - Returns true if error was handled, false otherwise
 */
export const handleApiError = (error, navigate) => {
  // Check if we're on login or signup pages - handle differently there
  const isAuthPage = window.location.pathname.includes('/login') || 
                    window.location.pathname.includes('/signup');
  
  // Handle cancelled requests separately - don't treat as errors
  if (axios.isCancel(error)) {
    console.log('Request was cancelled');
    return true; // Mark as handled
  }
  
  // Skip error handling if we don't have a proper error response
  if (!error.response) {
    console.log('Network error, no response available');
    // Only show toast for actual network errors, not cancellations
    if (error.message && error.message !== 'canceled' && !isAuthPage) {
      toast.error("Network Error", {
        description: "Could not connect to server. Please check your connection.",
        style: {
          background: '#05031F',
          color: '#fff',
        }
      });
    }
    return true;
  }
  
  // Invalid token or unauthorized - only handle if not on auth pages
  if ((error.response?.data?.message === "Invalid token" || error.response?.status === 401) && !isAuthPage) {
    console.log("Invalid token detected in API call, redirecting to login");
    
    // Clean up localStorage
    localStorage.removeItem('sellerToken');
    localStorage.removeItem('seller');
    
    // Show notification to user
    toast.error("Session expired", {
      description: "Please log in again",
      style: {
        background: '#05031F',
        color: '#fff',
      }
    });
    
    // Redirect to login page
    if (navigate) {
      navigate('/login', { replace: true });
    }
    
    return true;
  }
  
  // Only show toast for response errors with messages (skip on auth pages)
  if (error.response?.data?.message && !isAuthPage) {
    toast.error("Error", {
      description: error.response.data.message,
      style: {
        background: '#05031F',
        color: '#fff',
      }
    });
    return true;
  }
  
  // For other unknown errors, log but don't necessarily show a toast
  console.error("Unhandled API error:", error);
  return false;
}; 