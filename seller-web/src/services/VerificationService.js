import axios from 'axios';
import { BASE_URL, BASE_URL_V2 } from '../Constants/Server';
import { trackEvent } from '../util/analytics';

/**
 * Service for handling all verification-related API calls
 */
export const VerificationService = {
  /**
   * Selects the account type for a seller
   * @param {string} accountType - The account type ('individual' or 'business')
   * @returns {Promise} - The API response
   */
  selectAccountType: async (accountType) => {
    try {
      const token = localStorage.getItem('sellerToken');
      const sellerData = JSON.parse(localStorage.getItem('seller'));
      const { data: authToken } = JSON.parse(token);
      
      const response = await axios.put(
        `${BASE_URL_V2}/sellers/profile/account-type`,
        { accountType },
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );

      console.log('response', response);

      if (response.status === 200) {
        trackEvent("seller Account Type Selected", {
          "Account Type": accountType,
          "seller id": sellerData._id,
          "seller email": sellerData.email,
          "seller store name": sellerData.storeName,
          "seller first name": sellerData.firstName,
          "seller last name": sellerData.lastName,
          "seller phone number": sellerData.phoneNumber,
          "Signup Date": new Date(sellerData.createdAt).toISOString().split('T')[0],
          "Verification Status": sellerData.isVerified ? "Verified" : "Not Verified",
        });
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Error selecting account type:', error);
      throw error;
    }
  },
  
  /**
   * Updates the individual seller information
   * @param {Object} individualInfo - The individual information
   * @returns {Promise} - The API response
   */
  updateIndividualInformation: async (individualInfo) => {
    try {
      const token = localStorage.getItem('sellerToken');
      const { data: authToken } = JSON.parse(token);
      
      const response = await axios.put(
        `${BASE_URL}/seller/individual-information`,
        individualInfo,
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );

      return response;
    } catch (error) {
      console.error('Error updating individual information:', error);
      throw error;
    }
  },
  
  /**
   * Uploads individual verification documents
   * @param {Object} documents - The verification documents (individualTaxId, governmentId, proofOfAddress)
   * @returns {Promise} - The API response
   */
  uploadIndividualVerification: async (documents) => {
    try {
      const token = localStorage.getItem('sellerToken');
      const sellerData = JSON.parse(localStorage.getItem('seller'));
      const { data: authToken } = JSON.parse(token);
      
      const formData = new FormData();
      
      if (documents.individualTaxId) {
        formData.append('individualTaxId', documents.individualTaxId);
      }
      
      if (documents.governmentId) {
        formData.append('governmentId', documents.governmentId);
      }
      
      if (documents.proofOfAddress) {
        formData.append('proofOfAddress', documents.proofOfAddress);
      }
      
      const response = await axios.post(
        `${BASE_URL_V2}/sellers/verification/individual`,
        formData,
        {
          headers: { 
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.status === 200) {
        trackEvent("seller onboarding step 3: Individual Verification Documents Uploaded", {
          "seller id": sellerData._id,
          "seller email": sellerData.email,
          "seller store name": sellerData.storeName,
          "seller first name": sellerData.firstName,
          "seller last name": sellerData.lastName,
          "seller phone number": sellerData.phoneNumber,
          "Individual Tax ID": documents.individualTaxId ? "Uploaded" : "Not Uploaded",
          "Government ID": documents.governmentId ? "Uploaded" : "Not Uploaded",
          "Proof of Address": documents.proofOfAddress ? "Uploaded" : "Not Uploaded",
          "Signup Date": new Date(sellerData.createdAt).toISOString().split('T')[0],
          "Verification Status": sellerData.isVerified ? "Verified" : "Not Verified",
        });
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Error uploading individual verification:', error);
      throw error;
    }
  },
  
  /**
   * Adds basic business details
   * @param {Object} businessDetails - The business details
   * @returns {Promise} - The API response
   */
  addBusinessDetails: async (businessDetails) => {
    try {
      const token = localStorage.getItem('sellerToken');
      const sellerData = JSON.parse(localStorage.getItem('seller'));  
      const { data: authToken } = JSON.parse(token);
      
      const response = await axios.put(
        `${BASE_URL_V2}/sellers/business-details`,
        businessDetails,
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );

      if (response.status === 200) {
        trackEvent("seller onboarding step 4: Business Details Added", {
          "seller id": sellerData._id,
          "seller email": sellerData.email,
          "seller store name": sellerData.storeName,
          "seller first name": sellerData.firstName,
          "seller last name": sellerData.lastName,
          "seller phone number": sellerData.phoneNumber,
          "Business Name": businessDetails.businessName,
          "Business Type": businessDetails.businessType,
          "Tax Information": businessDetails.taxInformation,
          "Signup Date": new Date(sellerData.createdAt).toISOString().split('T')[0],
          "Verification Status": sellerData.isVerified ? "Verified" : "Not Verified",
        });
      }
      
    } catch (error) {
      console.error('Error adding business details:', error);
      throw error;
    }
  },
  
  /**
   * Adds business contact and address information
   * @param {Object} businessInfo - The business information
   * @returns {Promise} - The API response
   */
  addBusinessInformation: async (businessInfo) => {
    try {
      const token = localStorage.getItem('sellerToken');
      const { data: authToken } = JSON.parse(token);
      
      const response = await axios.put(
        `${BASE_URL_V2}/sellers/business-information`,
        businessInfo,
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );
      
      return response;
    } catch (error) {
      console.error('Error adding business information:', error);
      throw error;
    }
  },
  
  /**
   * Uploads company verification documents
   * @param {Object} documents - The verification documents (certificateOfIncorporation, businessTaxId)
   * @returns {Promise} - The API response
   */
  uploadCompanyVerification: async (documents) => {
    const token = localStorage.getItem('sellerToken');
    const sellerData = JSON.parse(localStorage.getItem('seller'));
    const { data: authToken } = JSON.parse(token);
    
    const formData = new FormData();
    
    if (documents.certificateOfIncorporation) {
      formData.append('certificateOfIncorporation', documents.certificateOfIncorporation);
    }
    
    if (documents.businessTaxId) {
      formData.append('businessTaxId', documents.businessTaxId);
    }
    
    const response = await axios.post(
      `${BASE_URL_V2}/sellers/verification/company`,
      formData,
      {
        headers: { 
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'multipart/form-data'
        }
      }
    );

    if (response.status === 200) {
      trackEvent("seller onboarding step 6: Company Verification Documents Uploaded", {
        "seller id": sellerData._id,
        "seller email": sellerData.email,
        "seller store name": sellerData.storeName,
        "seller first name": sellerData.firstName,
        "seller last name": sellerData.lastName,
        "seller phone number": sellerData.phoneNumber,
        "Certificate of Incorporation": documents.certificateOfIncorporation ? "Uploaded" : "Not Uploaded",
        "Business Tax ID": documents.businessTaxId ? "Uploaded" : "Not Uploaded",
        "Signup Date": new Date(sellerData.createdAt).toISOString().split('T')[0],
        "Verification Status": sellerData.isVerified ? "Verified" : "Not Verified", 
      });
    }

    return response.data.data;
  },
  
  /**
   * Fetches all available categories
   * @returns {Promise} - The API response with categories
   */
  getCategories: async () => {
    try {
      const response = await axios.get(`${BASE_URL}/public/categories`);
      return response.data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },
  
  /**
   * Searches categories by name or subcategories
   * @param {String} query - The search query
   * @returns {Promise} - The API response with matching categories
   */
  searchCategories: async (query) => {
    try {
      const response = await axios.get(`${BASE_URL}/public/categories/search`, {
        params: { query }
      });
      return response.data.results;
    } catch (error) {
      console.error('Error searching categories:', error);
      throw error;
    }
  },
  
  /**
   * Selects categories for a seller
   * @param {Array} categories - The selected categories
   * @returns {Promise} - The API response
   */
  selectCategories: async (categories) => {
    try {
      const token = localStorage.getItem('sellerToken');
      const sellerData = JSON.parse(localStorage.getItem('seller'));
      const { data: authToken } = JSON.parse(token);
      
      const response = await axios.post(
        `${BASE_URL}/seller/select-categories`,
        { categories },
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );
      
      if (response.status === 200) {
        trackEvent("seller onboarding step 7: Categories Selected", {
          "seller id": sellerData._id,
          "seller email": sellerData.email,
          "seller store name": sellerData.storeName,
          "seller first name": sellerData.firstName,
          "seller last name": sellerData.lastName,
          "seller phone number": sellerData.phoneNumber,
          "Categories": categories.map(cat => cat.name).join(', '),
          "Signup Date": new Date(sellerData.createdAt).toISOString().split('T')[0],
          "Verification Status": sellerData.isVerified ? "Verified" : "Not Verified",
        });
      }
      return response.data;
    } catch (error) {
      console.error('Error selecting categories:', error);
      throw error;
    }
  },
  
  /**
   * Adds bank details for a seller
   * @param {Object} bankDetails - The bank details
   * @returns {Promise} - The API response
   */
  addBankDetails: async (bankDetails) => {
    try {
      const token = localStorage.getItem('sellerToken');
      const sellerData = JSON.parse(localStorage.getItem('seller'));
      const { data: authToken } = JSON.parse(token);
      
      const response = await axios.put(
        `${BASE_URL_V2}/sellers/profile/bank-details`,
        { bankDetails },
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );
      
      if (response.status === 200) {
        trackEvent("seller onboarding step 8: Bank Details Added", {
          "seller id": sellerData._id,
          "seller email": sellerData.email,
          "seller store name": sellerData.storeName,
          "seller first name": sellerData.firstName,
          "seller last name": sellerData.lastName,
          "seller phone number": sellerData.phoneNumber,
          "Bank Country": bankDetails.bankCountry,
          "Bank Name": bankDetails.bankName,
          "Account Type": bankDetails.accountType,
          "Account Currency": bankDetails.accountCurrency,
          "Account Number": bankDetails.accountNumber,
          "Account Name": bankDetails.accountName,
          "SWIFT Code": bankDetails.swiftCode,
          "Bank Identifier Code": bankDetails.bankIdentifierCode,
          "Signup Date": new Date(sellerData.createdAt).toISOString().split('T')[0],
          "Verification Status": sellerData.isVerified ? "Verified" : "Not Verified",
        });
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Error adding bank details:', error);
      throw error;
    }
  },
  
  /**
   * Uploads a store avatar image
   * @param {File} avatarFile - The avatar file
   * @returns {Promise} - The API response
   */
  uploadStoreAvatar: async (avatarFile) => {
    try {
      const token = localStorage.getItem('sellerToken');
      const sellerData = JSON.parse(localStorage.getItem('seller'));
      const { data: authToken } = JSON.parse(token);
      
      const formData = new FormData();
      formData.append('avatar', avatarFile);
      
      const response = await axios.post(
        `${BASE_URL_V2}/sellers/profile/avatar`,
        formData,
        {
          headers: { 
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      if (response.status === 200) {
        trackEvent("seller onboarding step 9: Store Avatar Uploaded", {
          "seller id": sellerData._id,
          "seller email": sellerData.email,
          "seller store name": sellerData.storeName,
          "seller first name": sellerData.firstName,
          "seller last name": sellerData.lastName,
          "seller phone number": sellerData.phoneNumber,
          "Avatar": avatarFile ? "Uploaded" : "Not Uploaded",
          "Signup Date": new Date(sellerData.createdAt).toISOString().split('T')[0],
          "Verification Status": sellerData.isVerified ? "Verified" : "Not Verified",
        });
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Error uploading store avatar:', error);
      throw error;
    }
  },
  
  /**
   * Uploads a store banner image
   * @param {File} bannerFile - The banner file
   * @returns {Promise} - The API response
   */
  uploadStoreBanner: async (bannerFile) => {
    try {
      const token = localStorage.getItem('sellerToken');
      const sellerData = JSON.parse(localStorage.getItem('seller'));
      const { data: authToken } = JSON.parse(token);
      
      const formData = new FormData();
      formData.append('banner', bannerFile);
      
      const response = await axios.post(
        `${BASE_URL_V2}/sellers/profile/banner`,
        formData,
        {
          headers: { 
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      if (response.status === 200) {
        trackEvent("seller onboarding step 10: Store Banner Uploaded", {
          "seller id": sellerData._id,
          "seller email": sellerData.email,
          "seller store name": sellerData.storeName,
          "seller first name": sellerData.firstName,
          "seller last name": sellerData.lastName,
          "seller phone number": sellerData.phoneNumber,
          "Banner": bannerFile ? "Uploaded" : "Not Uploaded",
          "Signup Date": new Date(sellerData.createdAt).toISOString().split('T')[0],
          "Verification Status": sellerData.isVerified ? "Verified" : "Not Verified",
        });
      }
      return response.data.data;
    } catch (error) {
      console.error('Error uploading store banner:', error);
      throw error;
    }
  },
  
  /**
   * Updates the store profile information
   * @param {Object} storeProfile - The store profile information
   * @returns {Promise} - The API response
   */
  updateStoreProfile: async (storeProfile) => {
    try {
      const token = localStorage.getItem('sellerToken');
      const sellerData = JSON.parse(localStorage.getItem('seller'));
      const { data: authToken } = JSON.parse(token);

      const response = await axios.put(
        `${BASE_URL}/seller/store-profile`,
        storeProfile,
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );

      if (response.status === 200) {
        trackEvent("Seller Final Onboarding Step: Store Profile Updated", {
          "Seller ID": sellerData._id,
          "Seller Email": sellerData.email,
          "Seller Store Name": sellerData.storeName,
          "Seller First Name": sellerData.firstName,
          "Seller Last Name": sellerData.lastName,
          "Seller Phone Number": sellerData.phoneNumber,
          "New Store Name": storeProfile.storeName,
          "New Store Bio": storeProfile.storeBio,
          "Signup Date": new Date(sellerData.createdAt).toISOString().split('T')[0],
          "Verification Status": sellerData.isVerified ? "Verified" : "Not Verified",
        });
      }
      
      return response.data;
    } catch (error) {
      console.error('Error updating store profile:', error);
      throw error;
    }
  },
  
  /**
   * Updates the account pending status
   * @param {boolean} status - The pending status to set
   * @returns {Promise} - The API response
   */
  updateAccountPendingStatus: async (status = true) => {
    try {
      const token = localStorage.getItem('sellerToken');
      const sellerData = JSON.parse(localStorage.getItem('seller'));
      const { data: authToken } = JSON.parse(token);
      
      const response = await axios.put(
        `${BASE_URL}/seller/account-pending`,
        { status },
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );
      
      if (response.status === 200) {
        trackEvent("Seller onboarding step 12: Account Pending Status Updated", {
          "Seller ID": sellerData._id,
          "Seller Email": sellerData.email,
          "Seller Store Name": sellerData.storeName,
          "Seller First Name": sellerData.firstName,
          "Seller Last Name": sellerData.lastName,
          "Seller Phone Number": sellerData.phoneNumber,
          "Pending Status": status ? "Pending" : "Not Pending",
          "Signup Date": new Date(sellerData.createdAt).toISOString().split('T')[0],
          "Verification Status": sellerData.isVerified ? "Verified" : "Not Verified",
        });
      }
      
      return response.data;
    } catch (error) {
      console.error('Error updating account pending status:', error);
      throw error;
    }
  },
  
  /**
   * Saves individual SmileID verification result
   * @param {Object} verificationData - The SmileID verification result data
   * @returns {Promise} - The API response
   */
  saveIndividualVerification: async (verificationData) => {
    try {
      const token = localStorage.getItem('sellerToken');
      const sellerData = JSON.parse(localStorage.getItem('seller'));
      const { data: authToken } = JSON.parse(token);
      
      const response = await axios.post(
        `${BASE_URL_V2}/sellers/verification/smileid/individual`,
        verificationData,
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );

      if (response.status === 200) {
        trackEvent("seller onboarding: Individual SmileID Verification Completed", {
          "seller id": sellerData._id,
          "seller email": sellerData.email,
          "seller store name": sellerData.storeName,
          "seller first name": sellerData.firstName,
          "seller last name": sellerData.lastName,
          "seller phone number": sellerData.phoneNumber,
          "Verification Provider": verificationData.verificationProvider,
          "Verified At": verificationData.verifiedAt,
          "Signup Date": new Date(sellerData.createdAt).toISOString().split('T')[0],
          "Verification Status": "SmileID Verified",
        });
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Error saving individual SmileID verification:', error);
      throw error;
    }
  },

  /**
   * Saves business SmileID verification result
   * @param {Object} verificationData - The SmileID verification result data
   * @returns {Promise} - The API response
   */
  saveBusinessVerification: async (verificationData) => {
    try {
      const token = localStorage.getItem('sellerToken');
      const sellerData = JSON.parse(localStorage.getItem('seller'));
      const { data: authToken } = JSON.parse(token);
      
      const response = await axios.post(
        `${BASE_URL_V2}/sellers/verification/smileid/business`,
        verificationData,
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );

      if (response.status === 200) {
        trackEvent("seller onboarding: Business SmileID Verification Completed", {
          "seller id": sellerData._id,
          "seller email": sellerData.email,
          "seller store name": sellerData.storeName,
          "seller first name": sellerData.firstName,
          "seller last name": sellerData.lastName,
          "seller phone number": sellerData.phoneNumber,
          "Verification Provider": verificationData.verificationProvider,
          "Verified At": verificationData.verifiedAt,
          "Signup Date": new Date(sellerData.createdAt).toISOString().split('T')[0],
          "Verification Status": "SmileID Verified",
        });
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Error saving business SmileID verification:', error);
      throw error;
    }
  },

  /**
   * Generates a SmileID token for verification
   * @param {Object} tokenRequest - Request data for token generation
   * @returns {Promise} - The API response with token
   */
  generateSmileIdToken: async (tokenRequest) => {
    try {
      const token = localStorage.getItem('sellerToken');
      const { data: authToken } = JSON.parse(token);
      
      const response = await axios.post(
        `${BASE_URL_V2}/sellers/verification/smileid/token`,
        tokenRequest,
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );
      
      return response.data.data;
    } catch (error) {
      console.error('Error generating SmileID token:', error);
      throw error;
    }
  },

  /**
   * Processes SmileID job submission with captured images
   * @param {Object} jobData - Job data containing images and partner_params
   * @returns {Promise} - The API response with job result
   */
  processSmileIdJob: async (jobData) => {
    try {
      const token = localStorage.getItem('sellerToken');
      const sellerData = JSON.parse(localStorage.getItem('seller'));
      const { data: authToken } = JSON.parse(token);
      
      const response = await axios.post(
        `${BASE_URL_V2}/sellers/verification/smileid/job`,
        jobData,
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );

      if (response.status === 200) {
        trackEvent("SmileID Job Submission", {
          "seller id": sellerData._id,
          "seller email": sellerData.email,
          "seller store name": sellerData.storeName,
          "seller first name": sellerData.firstName,
          "seller last name": sellerData.lastName,
          "seller phone number": sellerData.phoneNumber,
          "Images Count": jobData.images ? jobData.images.length : 0,
          "Account Type": sellerData.accountType,
          "Job ID": response.data.data.jobId,
          "Signup Date": new Date(sellerData.createdAt).toISOString().split('T')[0],
          "Verification Status": sellerData.isVerified ? "Verified" : "Not Verified",
        });
      }

      return response.data.data;
    } catch (error) {
      console.error('Error processing SmileID job:', error);
      throw error;
    }
  },
};

export default VerificationService;