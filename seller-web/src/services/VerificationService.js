import axios from 'axios';
import { BASE_URL } from '../Constants/Server';

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
      const { data: authToken } = JSON.parse(token);
      
      const response = await axios.put(
        `${BASE_URL}/seller/profile/account-type`,
        { accountType },
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );
      
      return response.data;
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
      
      return response.data;
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
        `${BASE_URL}/seller/verification/individual`,
        formData,
        {
          headers: { 
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      return response.data;
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
      const { data: authToken } = JSON.parse(token);
      
      const response = await axios.put(
        `${BASE_URL}/seller/business-details`,
        businessDetails,
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );
      
      return response.data;
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
        `${BASE_URL}/seller/business-information`,
        businessInfo,
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );
      
      return response.data;
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
    try {
      const token = localStorage.getItem('sellerToken');
      const { data: authToken } = JSON.parse(token);
      
      const formData = new FormData();
      
      if (documents.certificateOfIncorporation) {
        formData.append('certificateOfIncorporation', documents.certificateOfIncorporation);
      }
      
      if (documents.businessTaxId) {
        formData.append('businessTaxId', documents.businessTaxId);
      }
      
      const response = await axios.post(
        `${BASE_URL}/seller/verification/company`,
        formData,
        {
          headers: { 
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error uploading company verification:', error);
      throw error;
    }
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
      const { data: authToken } = JSON.parse(token);
      
      const response = await axios.post(
        `${BASE_URL}/seller/select-categories`,
        { categories },
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );
      
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
      const { data: authToken } = JSON.parse(token);
      
      const response = await axios.put(
        `${BASE_URL}/seller/profile/bank-details`,
        { bankDetails },
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );
      
      return response.data;
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
      const { data: authToken } = JSON.parse(token);
      
      const formData = new FormData();
      formData.append('avatar', avatarFile);
      
      const response = await axios.post(
        `${BASE_URL}/seller/profile/avatar`,
        formData,
        {
          headers: { 
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      return response.data;
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
      const { data: authToken } = JSON.parse(token);
      
      const formData = new FormData();
      formData.append('banner', bannerFile);
      
      const response = await axios.post(
        `${BASE_URL}/seller/profile/banner`,
        formData,
        {
          headers: { 
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      return response.data;
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
      const { data: authToken } = JSON.parse(token);
      
      const response = await axios.put(
        `${BASE_URL}/seller/store-profile`,
        storeProfile,
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );
      
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
      const { data: authToken } = JSON.parse(token);
      
      const response = await axios.put(
        `${BASE_URL}/seller/account-pending`,
        { status },
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error updating account pending status:', error);
      throw error;
    }
  }
};

export default VerificationService; 