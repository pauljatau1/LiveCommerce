const registerService = require('../services/register.service');
const loginService = require('../services/login.service');
const profileService = require('../services/profile.service');
const updateProfileService = require('../services/updateProfile.service');
const uploadProfileImageService = require('../services/uploadProfileImage.service');
const verifyOTPService = require('../services/verifyOTP.service');
const resendOTPService = require('../services/resendOTP.service');
const checkTokenService = require('../services/checkToken.service');
const updateSelectedCategoriesService = require('../services/updateSelectedCategories.service');
const getSelectedCategoriesService = require('../services/getSelectedCategories.service');
const getOrdersService = require('../services/getOrders.service');
const getOrderDetailsService = require('../services/getOrderDetails.service');
const getPurchaseAnalyticsService = require('../services/getPurchaseAnalytics.service');
const getAddressesService = require('../services/getAddresses.service');
const addAddressService = require('../services/addAddress.service');
const updateAddressService = require('../services/updateAddress.service');
const deleteAddressService = require('../services/deleteAddress.service');
const followSellerService = require('../services/followSeller.service');
const unfollowSellerService = require('../services/unfollowSeller.service');
const addToWishlistService = require('../services/addToWishlist.service');
const getWishlistService = require('../services/getWishlist.service');
const removeFromWishlistService = require('../services/removeFromWishlist.service');
const uploadIdentityDocumentService = require('../services/uploadIdentityDocument.service');
const sendPhoneOTPService = require('../services/sendPhoneOTP.service');
const verifyPhoneOTPService = require('../services/verifyPhoneOTP.service');
const getSellerProfileService = require('../services/getSellerProfile.service');
const getFollowersService = require('../services/getFollowers.service');
const getFollowingService = require('../services/getFollowing.service');
const reviewSellerService = require('../services/reviewSeller.service');
const getSellerReviewsService = require('../services/getSellerReviews.service');
const getNotificationPreferencesService = require('../services/getNotificationPreferences.service');
const updateNotificationPreferencesService = require('../services/updateNotificationPreferences.service');
const forgotPasswordService = require('../services/forgotPassword.service');


/**
 * Register a buyer user.
 *
 * This controller handles the registration HTTP request.
 * It delegates the registration logic to the service layer, and sends a success response.
 *
 * @param {Request} req - Express request object containing the buyer's registration data in `req.body`
 * @param {Response} res - Express response object used to return the response
 * @param {Function} next - Express next middleware function for error handling
 */
async function register(req, res, next) {
  try {
    // Extract registration data from request body
    const registrationData = req.body;

    // Call the service layer to handle buyer registration logic
    const response = await registerService.register(registrationData);

    // Send a 201 Created response with success message and buyer data
    res.success(response, 'Buyer registered successfully', 201);
  } catch (err) {
    // Forward any error to the error-handling middleware
    next(err);
  }
}

/**
 * Authenticate a buyer and return user data with a JWT token.
 *
 * Handles both email/password login and Google login for mobile.
 *
 * @param {Request} req - Express request object containing login data
 * @param {Response} res - Express response object for sending formatted success/error responses
 * @param {Function} next - Express next middleware for error handling
 */
async function login(req, res, next) {
  try {
    // Extract login credentials from request body
    const loginData = req.body;

    // Call the service layer to handle authentication
    const response = await loginService.login(loginData);

    // Send success response with user data and token
    res.success(response, 'Login successful');
  } catch (err) {
    // Forward any error to the error-handling middleware
    next(err);
  }
}

/**
 * Get buyer profile information.
 *
 * This controller handles the profile retrieval HTTP request.
 * It delegates the profile logic to the service layer and returns the enhanced profile data.
 *
 * @param {Request} req - Express request object containing the buyer's ID in `req.user.id`
 * @param {Response} res - Express response object used to return the response
 * @param {Function} next - Express next middleware function for error handling
 */
async function getProfile(req, res, next) {
  try {
    // Extract buyer ID from authenticated user
    const buyerId = req.user.id;

    // Call the service layer to handle profile retrieval logic
    const response = await profileService.getProfile(buyerId);

    // Send success response with profile data
    res.success(response, 'Profile retrieved successfully');
  } catch (err) {
    // Forward any error to the error-handling middleware
    next(err);
  }
}

/**
 * Check and validate JWT token.
 *
 * This controller handles token validation HTTP request.
 * It delegates the token validation logic to the service layer and returns a new token if valid.
 *
 * @param {Request} req - Express request object containing the token in `req.headers.authorization`
 * @param {Response} res - Express response object used to return the response
 * @param {Function} next - Express next middleware function for error handling
 */
async function checkToken(req, res, next) {
  try {
    // Extract token from authorization header
    const token = req.headers['authorization']?.split(' ')[1];
    
    // Call the service layer to handle token validation logic
    const response = await checkTokenService.checkToken(token);

    // Send success response with new token
    res.success(response, 'Token validated successfully');
  } catch (err) {
    // Forward any error to the error-handling middleware
    next(err);
  }
}

/**
 * Update buyer profile information.
 *
 * This controller handles the profile update HTTP request.
 * It delegates the profile update logic to the service layer and returns the updated profile data.
 *
 * @param {Request} req - Express request object containing the profile update data in `req.body`
 * @param {Response} res - Express response object used to return the response
 * @param {Function} next - Express next middleware function for error handling
 */
async function updateProfile(req, res, next) {
  try {
    // Extract buyer ID from authenticated user
    const buyerId = req.user.id;

    // Extract profile update data from request body
    const profileData = req.body;

    // Call the service layer to handle profile update logic
    const response = await updateProfileService.updateProfile(buyerId, profileData);

    // Send success response with updated profile data
    res.success(response, 'Profile updated successfully');
  } catch (err) {
    // Forward any error to the error-handling middleware
    next(err);
  }
}

/**
 *
 * Upload buyer profile image.
 *
 * This controller handles the profile image upload HTTP request.
 * It delegates the upload logic to the service layer and returns the updated profile data.
 *
 * @param {Request} req - Express request object containing the uploaded file in `req.file`
 * @param {Response} res - Express response object used to return the response
 * @param {Function} next - Express next middleware function for error handling
 */
async function uploadProfileImage(req, res, next) {
  try {
    // Extract buyer ID from authenticated user
    const buyerId = req.user.id;

    // Call the service layer to handle profile image upload logic
    const response = await uploadProfileImageService.uploadProfileImage(buyerId, req.file);

    // Send success response with updated profile data
    res.success(response, 'Profile image uploaded successfully');
  } catch (err) {
    // Forward any error to the error-handling middleware
    next(err);
  }
}
/**    
 * Verify OTP for buyer email verification.
 *
 * This controller handles the OTP verification HTTP request.
 * It delegates the verification logic to the service layer and returns the verification result.
 *
 * @param {Request} req - Express request object containing email and OTP in `req.body`
 * @param {Response} res - Express response object used to return the response
 * @param {Function} next - Express next middleware function for error handling
 */
async function verifyOTP(req, res, next) {
  try {
    // Extract email and OTP from request body
    const { email, otp } = req.body;

    // Call the service layer to handle OTP verification logic
    const response = await verifyOTPService.verifyOTP(email, otp);

    // Send success response with verification result
    res.success(response, 'OTP verified successfully');
  } catch (err) {
    // Forward any error to the error-handling middleware
    next(err);
  }
}

/**
 * Resend OTP to buyer's email.
 *
 * This controller handles the OTP resend HTTP request.
 * It delegates the OTP resend logic to the service layer and returns a success message.
 *
 * @param {Request} req - Express request object containing the email in `req.body`
 * @param {Response} res - Express response object used to return the response
 * @param {Function} next - Express next middleware function for error handling
 */
async function resendOTP(req, res, next) {
  try {
    // Extract email from request body
    const { email } = req.body;

    // Call the service layer to handle OTP resend logic
    const response = await resendOTPService.resendOTP(email);

    // Send success response
    res.success(response, 'OTP resent successfully');
  } catch (err) {
    // Forward any error to the error-handling middleware
    next(err);
  }
}

/**
 * Update selected categories for a buyer.
 *
 * This controller handles the selected categories update HTTP request.
 * It delegates the update logic to the service layer and returns the updated buyer data.
 *
 * @param {Request} req - Express request object containing the selectedCategories in `req.body`
 * @param {Response} res - Express response object used to return the response
 * @param {Function} next - Express next middleware function for error handling
 */
async function updateSelectedCategories(req, res, next) {
  try {
    // Extract buyer ID from authenticated user
    const buyerId = req.user.id;

    // Extract selected categories from request body
    const selectedCategories = req.body.selectedCategories;

    // Call the service layer to handle selected categories update logic
    const response = await updateSelectedCategoriesService.updateSelectedCategories(buyerId, selectedCategories);

    // Send success response with updated buyer data
    res.success(response, 'Selected categories updated successfully');
  } catch (err) {
    // Forward any error to the error-handling middleware
    next(err);
  }
}

/**
 * Get selected categories for a buyer.
 *
 * This controller handles the selected categories retrieval HTTP request.
 * It delegates the retrieval logic to the service layer and returns the formatted categories data.
 *
 * @param {Request} req - Express request object containing the buyer's ID in `req.user.id`
 * @param {Response} res - Express response object used to return the response
 * @param {Function} next - Express next middleware function for error handling
 */
async function getSelectedCategories(req, res, next) {
  try {
    // Extract buyer ID from authenticated user
    const buyerId = req.user.id;

    // Call the service layer to handle selected categories retrieval logic
    const response = await getSelectedCategoriesService.getSelectedCategories(buyerId);

    // Send success response with categories data
    res.success(response, 'Selected categories retrieved successfully');
  } catch (err) {
    // Forward any error to the error-handling middleware
    next(err);
  }
}

/**
 * Get orders for a buyer with filtering and pagination.
 *
 * This controller handles the orders retrieval HTTP request.
 * It delegates the retrieval logic to the service layer and returns the formatted orders data.
 *
 * @param {Request} req - Express request object containing query parameters and buyer's ID
 * @param {Response} res - Express response object used to return the response
 * @param {Function} next - Express next middleware function for error handling
 */
async function getOrders(req, res, next) {
  try {
    // Extract buyer ID from authenticated user
    const buyerId = req.user.id;

    // Get pagination options from request using service method
    const pagination = getOrdersService.getPaginationOptions(req);
    // Get filter options from request using service method
    const filters = getOrdersService.getFilters(req);

    let response = {};
    if (pagination.enabled) {
      // Use paginated retrieval with combined pagination and filter parameters
      const params = { ...pagination, filters: filters };
      response = await getOrdersService.getPaginatedOrders(buyerId, params);
    } else {
      // Use non-paginated retrieval with filter parameters only
      response = await getOrdersService.getOrders(buyerId, filters);
    }

    // Send success response with orders data
    res.success(response, 'Orders retrieved successfully');
  } catch (err) {
    // Forward any error to the error-handling middleware
    next(err);
  }
}

/**
 * Get detailed information about a specific order for a buyer.
 *
 * This controller handles the order details retrieval HTTP request.
 * It delegates the retrieval logic to the service layer and returns the formatted order data.
 *
 * @param {Request} req - Express request object containing the order ID in `req.params.id`
 * @param {Response} res - Express response object used to return the response
 * @param {Function} next - Express next middleware function for error handling
 */
async function getOrderDetails(req, res, next) {
  try {
    // Extract buyer ID from authenticated user
    const buyerId = req.user.id;

    // Call the service layer to handle order details retrieval logic
    const response = await getOrderDetailsService.getOrderDetails(buyerId, req.params.id);

    // Send success response with order details
    res.success(response, 'Order details retrieved successfully');
  } catch (err) {
    // Forward any error to the error-handling middleware
    next(err);
  }
}

/**
 * Get purchase analytics for a buyer.
 *
 * This controller handles the purchase analytics retrieval HTTP request.
 * It delegates the analytics logic to the service layer and returns comprehensive purchase insights.
 *
 * @param {Request} req - Express request object containing the buyer's ID in `req.user.id`
 * @param {Response} res - Express response object used to return the response
 * @param {Function} next - Express next middleware function for error handling
 */
async function getPurchaseAnalytics(req, res, next) {
  try {
    // Extract buyer ID from authenticated user
    const buyerId = req.user.id;

    // Call the service layer to handle purchase analytics logic
    const response = await getPurchaseAnalyticsService.getPurchaseAnalytics(buyerId);

    // Send success response with analytics data
    res.success(response, 'Purchase analytics retrieved successfully');
  } catch (err) {
    // Forward any error to the error-handling middleware
    next(err);
  }
}

/**
 * Get all shipping addresses for a buyer.
 *
 * This controller handles the addresses retrieval HTTP request.
 * It delegates the retrieval logic to the service layer and returns the formatted addresses data.
 *
 * @param {Request} req - Express request object containing the buyer's ID in `req.user.id`
 * @param {Response} res - Express response object used to return the response
 * @param {Function} next - Express next middleware function for error handling
 */
async function getAddresses(req, res, next) {
  try {
    // Extract buyer ID from authenticated user
    const buyerId = req.user.id;

    // Call the service layer to handle addresses retrieval logic
    const response = await getAddressesService.getAddresses(buyerId);

    // Send success response with addresses data
    res.success(response, 'Addresses retrieved successfully');
  } catch (err) {
    // Forward any error to the error-handling middleware
    next(err);
  }
}

/**
 * Add a new shipping address for a buyer.
 *
 * This controller handles the address addition HTTP request.
 * It delegates the addition logic to the service layer and returns the newly added address.
 *
 * @param {Request} req - Express request object containing the address data in `req.body` and buyer's ID in `req.user.id`
 * @param {Response} res - Express response object used to return the response
 * @param {Function} next - Express next middleware function for error handling
 */
async function addAddress(req, res, next) {
  try {
    // Extract buyer ID from authenticated user
    const buyerId = req.user.id;

    // Call the service layer to handle address addition logic
    const response = await addAddressService.addAddress(buyerId, req.body);

    // Send success response with newly added address
    res.success(response, 'Address added successfully', 201);
  } catch (err) {
    // Forward any error to the error-handling middleware
    next(err);
  }
}

/**
 * Update an existing shipping address for a buyer.
 *
 * This controller handles the address update HTTP request.
 * It delegates the address update logic to the service layer and returns the updated address.
 *
 * @param {Request} req - Express request object containing the address update data in `req.body`, buyer ID in `req.user.id`, and address ID in `req.params.addressId`
 * @param {Response} res - Express response object used to return the response
 * @param {Function} next - Express next middleware function for error handling
 */
async function updateAddress(req, res, next) {
  try {
    // Extract buyer ID from authenticated user
    const buyerId = req.user.id;

    // Call the service layer to handle address update logic
    const response = await updateAddressService.updateAddress(buyerId, req.params.addressId, req.body);

    // Send success response with updated address data
    res.success(response, 'Address updated successfully');
  } catch (err) {
    // Forward any error to the error-handling middleware
    next(err);
  }
}

/**
 * Delete a shipping address for a buyer.
 *
 * This controller handles the address deletion HTTP request.
 * It delegates the address deletion logic to the service layer and returns a success message.
 *
 * @param {Request} req - Express request object containing the address ID in `req.params.addressId`
 * @param {Response} res - Express response object used to return the response
 * @param {Function} next - Express next middleware function for error handling
 */
async function deleteAddress(req, res, next) {
  try {
    // Extract buyer ID from authenticated user
    const buyerId = req.user.id;

    // Call the service layer to handle address deletion logic
    const response = await deleteAddressService.deleteAddress(buyerId, req.params.addressId);

    // Send success response with deletion message
    res.success(response, 'Address deleted successfully');
  } catch (err) {
    // Forward any error to the error-handling middleware
    next(err);
  }
}

/**
 * Follow a seller by a buyer.
 *
 * This controller handles the follow seller HTTP request.
 * It delegates the follow logic to the service layer and returns the follow data.
 *
 * @param {Request} req - Express request object containing the seller ID in `req.params.sellerId` and buyer's ID in `req.user.id`
 * @param {Response} res - Express response object used to return the response
 * @param {Function} next - Express next middleware function for error handling
 */
async function followSeller(req, res, next) {
  try {
    // Extract buyer ID and seller ID from request parameters
    const buyerId = req.user.id;
    const sellerId = req.params.sellerId;

    // Call the service layer to handle follow seller logic
    const response = await followSellerService.followSeller(buyerId, sellerId);

    // Send success response with follow data
    res.success(response, 'Successfully followed seller');
  } catch (err) {
    // Forward any error to the error-handling middleware
    next(err);
  }
}

/**
 * Unfollow a seller by a buyer.
 *
 * This controller handles the unfollow seller HTTP request.
 * It delegates the unfollow logic to the service layer and returns the unfollow data.
 *
 * @param {Request} req - Express request object containing the seller ID in `req.params.sellerId` and buyer's ID in `req.user.id`
 * @param {Response} res - Express response object used to return the response
 * @param {Function} next - Express next middleware function for error handling
 */
async function unfollowSeller(req, res, next) {
  try {
    // Extract buyer ID and seller ID from request parameters
    const buyerId = req.user.id;
    const sellerId = req.params.sellerId;

    // Call the service layer to handle unfollow seller logic
    const response = await unfollowSellerService.unfollowSeller(buyerId, sellerId);

    // Send success response with unfollow data
    res.success(response, 'Successfully unfollowed seller');
  } catch (err) {
    // Forward any error to the error-handling middleware
    next(err);
  }
}

/**
 * Add a product to buyer's wishlist.
 *
 * This controller handles the add to wishlist HTTP request.
 * It delegates the add to wishlist logic to the service layer and returns the wishlist data.
 *
 * @param {Request} req - Express request object containing the product ID in `req.body.productId` and buyer's ID in `req.user.id`
 * @param {Response} res - Express response object used to return the response
 * @param {Function} next - Express next middleware function for error handling
 */
async function addToWishlist(req, res, next) {
  try {
    // Extract buyer ID and product ID from request body
    const buyerId = req.user.id;
    const productId = req.body.productId;

    // Call the service layer to handle add to wishlist logic
    const response = await addToWishlistService.addToWishlist(buyerId, productId);

    // Send success response with wishlist data
    res.success(response, 'Product added to wishlist successfully');
  } catch (err) {
    // Forward any error to the error-handling middleware
    next(err);
  }
}

/**
 * Get buyer's wishlist.
 *
 * This controller handles the get wishlist HTTP request.
 * It delegates the get wishlist logic to the service layer and returns the wishlist data.
 *
 * @param {Request} req - Express request object containing the buyer's ID in `req.user.id`
 * @param {Response} res - Express response object used to return the response
 * @param {Function} next - Express next middleware function for error handling
 */
async function getWishlist(req, res, next) {
  try {
    // Extract buyer ID from authenticated user
    const buyerId = req.user.id;

    // Call the service layer to handle get wishlist logic
    const response = await getWishlistService.getWishlist(buyerId);

    // Send success response with wishlist data
    res.success(response, 'Wishlist retrieved successfully');
  } catch (err) {
    // Forward any error to the error-handling middleware
    next(err);
  }
}

/**
 * Remove a product from buyer's wishlist.
 *
 * This controller handles the remove from wishlist HTTP request.
 * It delegates the remove from wishlist logic to the service layer and returns the updated wishlist data.
 *
 * @param {Request} req - Express request object containing the product ID in `req.params.productId` and buyer's ID in `req.user.id`
 * @param {Response} res - Express response object used to return the response
 * @param {Function} next - Express next middleware function for error handling
 */
async function removeFromWishlist(req, res, next) {
  try {
    // Extract buyer ID and product ID from request parameters
    const buyerId = req.user.id;
    const productId = req.params.productId;

    // Call the service layer to handle remove from wishlist logic
    const response = await removeFromWishlistService.removeFromWishlist(buyerId, productId);

    // Send success response with updated wishlist data
    res.success(response, 'Product removed from wishlist successfully');
  } catch (err) {
    // Forward any error to the error-handling middleware
    next(err);
  }
}

/**
 * Upload identity document for buyer verification.
 *
 * This controller handles the upload identity document HTTP request.
 * It delegates the upload logic to the service layer and returns the uploaded document information.
 *
 * @param {Request} req - Express request object containing the uploaded file in `req.file` and buyer's ID in `req.user.id`
 * @param {Response} res - Express response object used to return the response
 * @param {Function} next - Express next middleware function for error handling
 */
async function uploadIdentityDocument(req, res, next) {
  try {
    // Extract buyer ID from authenticated user
    const buyerId = req.user.id;

    // Call the service layer to handle upload identity document logic
    const response = await uploadIdentityDocumentService.uploadIdentityDocument(buyerId, req.file);

    // Send success response with uploaded document information
    res.success(response, 'Identity document uploaded successfully');
  } catch (err) {
    // Forward any error to the error-handling middleware
    next(err);
  }
}

/**
 * Send phone OTP to the specified phone number.
 *
 * This controller handles the send phone OTP HTTP request.
 * It delegates the OTP sending logic to the service layer and returns the success response.
 *
 * @param {Request} req - Express request object containing the phone number in `req.body.phoneNumber` and buyer's ID in `req.user.id`
 * @param {Response} res - Express response object used to return the response
 * @param {Function} next - Express next middleware function for error handling
 */
async function sendPhoneOTP(req, res, next) {
  try {
    // Extract buyer ID and phone number from request body
    const buyerId = req.user.id;
    const phoneNumber = req.body.phoneNumber;

    // Call the service layer to handle send phone OTP logic
    const response = await sendPhoneOTPService.sendPhoneOTP(buyerId, phoneNumber);

    // Send success response with OTP sending confirmation
    res.success(response, 'OTP sent successfully');
  } catch (err) {
    // Forward any error to the error-handling middleware
    next(err);
  }
}

/**
 * Verify phone OTP for buyer phone verification.
 *
 * This controller handles the verify phone OTP HTTP request.
 * It delegates the OTP verification logic to the service layer and returns the verification result.
 *
 * @param {Request} req - Express request object containing the OTP in `req.body.otp` and buyer's ID in `req.user.id`
 * @param {Response} res - Express response object used to return the response
 * @param {Function} next - Express next middleware function for error handling
 */
async function verifyPhoneOTP(req, res, next) {
  try {
    // Extract buyer ID and OTP from request body
    const buyerId = req.user.id;
    const otp = req.body.otp;

    // Call the service layer to handle verify phone OTP logic
    const response = await verifyPhoneOTPService.verifyPhoneOTP(buyerId, otp);

    // Send success response with verification result
    res.success(response, 'Phone number verified successfully');
  } catch (err) {
    // Forward any error to the error-handling middleware
    next(err);
  }
}

/**
 * Get detailed seller profile information.
 *
 * This controller handles the seller profile retrieval HTTP request.
 * It delegates the profile logic to the service layer and returns the complete seller profile.
 *
 * @param {Request} req - Express request object containing the seller ID in `req.params.sellerId` and buyer's ID in `req.user.id`
 * @param {Response} res - Express response object used to return the response
 * @param {Function} next - Express next middleware function for error handling
 */
async function getSellerProfile(req, res, next) {
  try {
    // Extract buyer ID from authenticated user
    const buyerId = req.user.id;

    // Extract seller ID from request parameters
    const sellerId = req.params.sellerId;

    // Call the service layer to handle seller profile retrieval logic
    const response = await getSellerProfileService.getSellerProfile(sellerId, buyerId);

    // Send success response with seller profile data
    res.success(response, 'Seller profile retrieved successfully');
  } catch (err) {
    // Forward any error to the error-handling middleware
    next(err);
  }
}

/**
 * Get followers for the authenticated buyer
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getFollowers(req, res, next) {
  try {
    // Extract buyer ID from authenticated user
    const buyerId = req.user.id;

    // Get pagination options from request using service method
    const pagination = getFollowersService.getPaginationOptions(req);
    // Get filter options from request using service method
    const filters = getFollowersService.getFilters(req);

    let followers = [];
    if (pagination.enabled) {
      // Use paginated retrieval with combined pagination and filter parameters
      const params = { ...pagination, filters: filters };
      followers = await getFollowersService.listPaginatedFollowers(buyerId, params);
    } else {
      // Use non-paginated retrieval with filter parameters only
      followers = await getFollowersService.listFollowers(buyerId, filters);
    }

    return res.success(followers, 'Followers retrieved successfully', 200);
  } catch (err) {
    next(err);
  }
}

/**
 * Get following for the authenticated buyer
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getFollowing(req, res, next) {
  try {
    // Extract buyer ID from authenticated user
    const buyerId = req.user.id;

    // Get pagination options from request using service method
    const pagination = getFollowingService.getPaginationOptions(req);
    // Get filter options from request using service method
    const filters = getFollowingService.getFilters(req);

    let following = [];
    if (pagination.enabled) {
      // Use paginated retrieval with combined pagination and filter parameters
      const params = { ...pagination, filters: filters };
      following = await getFollowingService.listPaginatedFollowing(buyerId, params);
    } else {
      // Use non-paginated retrieval with filter parameters only
      following = await getFollowingService.listFollowing(buyerId, filters);
    }

    return res.success(following, 'Following retrieved successfully', 200);
  } catch (err) {
    next(err);
  }
}

/**
 * Review a seller's store
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
async function reviewSeller(req, res, next) {
  try {
    // Extract buyer ID from authenticated user
    const buyerId = req.user.id;

    // Extract seller ID and review data from request parameters and body
    const { sellerId } = req.params;
    const { rating, comment } = req.body;

    // Call the service layer to handle review submission
    const review = await reviewSellerService.reviewSeller(buyerId, sellerId, { rating, comment });

    // Return success response with review data and success message
    return res.success({ review }, 'Review submitted successfully', 201);
  } catch (err) {
    // Forward any error to the error-handling middleware
    next(err);
  }
}

/**
 * Get seller reviews with pagination and filtering support.
 *
 * This controller handles the seller reviews retrieval HTTP request.
 * It supports both paginated and non-paginated responses based on query parameters.
 * The response includes reviews data and statistics about the seller's reviews.
 *
 * @param {Request} req - Express request object containing seller ID in params and query parameters
 * @param {Response} res - Express response object used to return the response
 * @param {Function} next - Express next middleware function for error handling
 */
async function getSellerReviews(req, res, next) {
  try {
    // Extract seller ID from request parameters
    const { sellerId } = req.params;

    // Get pagination options from request using service method
    const pagination = getSellerReviewsService.getPaginationOptions(req);
    // Get filter options from request using service method
    const filters = getSellerReviewsService.getFilters(req);

    let result = {};
    if (pagination.enabled) {
      // Use paginated retrieval with combined pagination and filter parameters
      const params = { ...pagination, filters: filters };
      result = await getSellerReviewsService.listPaginatedSellerReviews(sellerId, params);
    } else {
      // Use non-paginated retrieval with filter parameters only
      result = await getSellerReviewsService.listSellerReviews(sellerId, filters);
    }

    // Return success response with reviews data and success message
    return res.success(result.data, 'Seller reviews retrieved successfully', 200);
  } catch (err) {
    // Forward any error to the error-handling middleware
    next(err);
  }
}

/**
 * Get notification preferences for a buyer.
 *
 * This controller handles the notification preferences retrieval HTTP request.
 * It delegates the preferences logic to the service layer and returns the preferences data.
 *
 * @param {Request} req - Express request object containing the buyer's ID in req.user.id
 * @param {Response} res - Express response object used to return the response
 * @param {Function} next - Express next middleware function for error handling
 */
async function getNotificationPreferences(req, res, next) {
  try {
    // Extract buyer ID from request user object
    const buyerId = req.user.id;

    // Call the service layer to handle notification preferences retrieval logic
    const response = await getNotificationPreferencesService.getNotificationPreferences(buyerId);

    // Return success response with preferences data and success message
    return res.success(response.data, 'Notification preferences retrieved successfully', 200);
  } catch (err) {
    // Forward any error to the error-handling middleware
    next(err);
  }
}

/**
 * Update notification preferences for a buyer.
 *
 * This controller handles the notification preferences update HTTP request.
 * It delegates the update logic to the service layer and returns the updated preferences data.
 * The service performs validation and deep merging of preferences.
 *
 * @param {Request} req - Express request object containing the buyer's ID in req.user.id and preferences in req.body
 * @param {Response} res - Express response object used to return the response
 * @param {Function} next - Express next middleware function for error handling
 */
async function updateNotificationPreferences(req, res, next) {
  try {
    // Extract buyer ID from request user object
    const buyerId = req.user.id;
    
    // Extract preferences from request body
    const { preferences } = req.body;

    // Call the service layer to handle notification preferences update logic
    // The service will validate the preferences and perform deep merging
    const response = await updateNotificationPreferencesService.updateNotificationPreferences(buyerId, preferences);

    // Return success response with updated preferences data and success message
    return res.success(response.data, 'Notification preferences updated successfully', 200);
  } catch (err) {
    // Forward any error to the error-handling middleware
    next(err);
  }
}

/**
 * Process forgot password request.
 *
 * This controller handles the forgot password HTTP request.
 * It delegates the forgot password logic to the service layer and returns a success response.
 *
 * @param {Request} req - Express request object containing the email in req.body
 * @param {Response} res - Express response object used to return the response
 * @param {Function} next - Express next middleware function for error handling
 */
async function forgotPassword(req, res, next) {
  try {
    // Extract email from request body
    const forgotPasswordData = req.body;

    // Call the service layer to handle forgot password logic
    const response = await forgotPasswordService.forgotPassword(forgotPasswordData);

    // Send success response with message
    res.success(response, 'Password reset code sent successfully');
  } catch (err) {
    // Forward any error to the error-handling middleware
    next(err);
  }
}

module.exports = {
  register,
  login,
  getProfile,
  checkToken,
  updateProfile,
  uploadProfileImage,
  verifyOTP,
  resendOTP,
  updateSelectedCategories,
  getSelectedCategories,
  getOrders,
  getOrderDetails,
  getPurchaseAnalytics,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  followSeller,
  unfollowSeller,
  addToWishlist,
  getWishlist,
  removeFromWishlist,
  uploadIdentityDocument,
  sendPhoneOTP,
  verifyPhoneOTP,
  getSellerProfile,
  getFollowers,
  getFollowing,
  reviewSeller,
  getSellerReviews,
  getNotificationPreferences,
  updateNotificationPreferences,
  forgotPassword,
};
