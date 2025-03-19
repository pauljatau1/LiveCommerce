import { useState, useEffect } from "react"
import { Upload } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { BASE_URL } from "@/Constants/Server"
import { toast } from "sonner"
import { Switch } from "@/components/ui/switch"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"

// Add these constants at the top of the file, after the imports
const DELIVERY_POLICIES = {
  LOST_DAMAGED: [
    { value: "replace", label: "Replace item" },
    { value: "refund", label: "Full refund" },
    { value: "partial_refund", label: "Partial refund" },
    { value: "case_by_case", label: "Case by case basis" }
  ],
  REFUND_METHODS: [
    { value: "original_payment", label: "Original payment method" },
    { value: "store_credit", label: "Store credit" },
    { value: "bank_transfer", label: "Bank transfer" }
  ],
  REFUND_WINDOWS: [
    { value: "3", label: "3 days" },
    { value: "7", label: "7 days" },
    { value: "14", label: "14 days" },
    { value: "30", label: "30 days" },
    { value: "no_refund", label: "No refunds" }
  ],
  RETURN_WINDOWS: [
    { value: "7", label: "7 days" },
    { value: "14", label: "14 days" },
    { value: "30", label: "30 days" },
    { value: "no_returns", label: "No returns accepted" }
  ],
  RETURN_CONDITIONS: [
    { value: "unused", label: "Item must be unused with original tags" },
    { value: "defective", label: "Only defective items" },
    { value: "wrong_item", label: "Wrong item received" },
    { value: "damaged", label: "Damaged during shipping" }
  ],
  FREE_SHIPPING: [
    { value: "coupon_dependent", label: "Coupon Dependent" },
    { value: "no_free_shipping", label: "No free shipping" }
  ]
};

export default function StoreSettings() {
  const [formData, setFormData] = useState({
    storeName: "",
    phoneNumber: "",
    email: "",
    description: "",
    address: {
      country: "",
      state: "",
      city: "",
      addressLine1: "",
      addressLine2: "",
      zipCode: "",
    },
    businessDetails: {
      cac: "",
    },
    operatingHours: {
      monday: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
      tuesday: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
      wednesday: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
      thursday: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
      friday: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
      saturday: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
      sunday: { isOpen: false, openTime: "09:00", closeTime: "17:00" }
    },
    specialDates: [],
    timezone: "Africa/Lagos",
    storePolicy: {
      deliveryTimes: "",
      freeShippingPolicy: "",
      lostOrDamagedPolicy: "",
      refundPolicy: "",
      processingTime: "",
      refundMethod: "",
      nonRefundableItems: [],
      returnWindow: 14,
      returnCondition: "",
      returnShipping: "",
      exchangePolicy: "",
      allowsCod: false
    },
    accountType: "",
    businessName: "",
    businessType: "",
    firstName: "",
    lastName: "",
    socialMedia: {
      instagram: "",
      facebook: "",
      tiktok: ""
    },
  });

  const [isLoading, setIsLoading] = useState(false);
  const [storeAvatar, setStoreAvatar] = useState(null);
  const [storeBanner, setStoreBanner] = useState(null);
  const [newSpecialDate, setNewSpecialDate] = useState({
    date: null,
    isOpen: true,
    openTime: "09:00",
    closeTime: "17:00",
    note: ""
  });

  // Add new state for tracking individual section updates
  const [updatingSection, setUpdatingSection] = useState({
    accountType: false,
    businessDetails: false,
    businessInfo: false,
    individualInfo: false,
    storeProfile: false,
    operatingHours: false,
    storePolicy: false,
    socialMedia: false,
  });

  // Fetch initial store data
  useEffect(() => {
    fetchStoreData();
  }, []);

  const fetchStoreData = async () => {
    try {
      const sellerToken = JSON.parse(localStorage.getItem('sellerToken')).data;
      const response = await fetch(`${BASE_URL}/seller/profile`, {
        headers: {
          Authorization: `Bearer ${sellerToken}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setFormData({
          storeName: data.storeName || "",
          phoneNumber: data.accountType === 'business' ? data.businessNumber : data.phoneNumber || "",
          email: data.accountType === 'business' ? data.businessEmail : data.email || "",
          description: data.aboutStore || "",
          address: data.accountType === 'business' ? data.businessAddress : data.sellerAddress || {
            country: "",
            state: "",
            city: "",
            addressLine1: "",
            addressLine2: "",
            zipCode: "",
          },
          businessDetails: {
            taxInformation: data.businessType || "",
          },
          operatingHours: data.operatingHours || {
            monday: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
            tuesday: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
            wednesday: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
            thursday: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
            friday: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
            saturday: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
            sunday: { isOpen: false, openTime: "09:00", closeTime: "17:00" }
          },
          specialDates: data.specialDates || [],
          timezone: data.timezone || "Africa/Lagos",
          storePolicy: data.storePolicy || {
            deliveryTimes: "",
            freeShippingPolicy: "",
            lostOrDamagedPolicy: "",
            refundPolicy: "",
            processingTime: "",
            refundMethod: "",
            nonRefundableItems: [],
            returnWindow: 14,
            returnCondition: "",
            returnShipping: "",
            exchangePolicy: "",
            allowsCod: data.storePolicy?.allowsCod || false
          },
          accountType: data.accountType || "",
          businessName: data.businessName || "",
          businessType: data.businessType || "",
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          socialMedia: {
            instagram: data.socialMedia?.instagram || "",
            facebook: data.socialMedia?.facebook || "",
            tiktok: data.socialMedia?.tiktok || ""
          },
        });
        
        // Set store avatar if exists
        if (data.storeAvatar?.url) {
          setStoreAvatar(data.storeAvatar.url);
        }

        // Set store banner if exists
        if (data.storeBanner?.url) {
          setStoreBanner(data.storeBanner.url);
        }
      }
    } catch (error) {
      toast.error("Failed to fetch store data");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'phoneNumber') {
      // Remove all non-digit characters
      let cleaned = value.replace(/\D/g, '');
      
      // If the number starts with 0, remove it
      if (cleaned.startsWith('0')) {
        cleaned = cleaned.substring(1);
      }
      
      // If the number starts with 234, remove it (to prevent double prefix)
      if (cleaned.startsWith('234')) {
        cleaned = cleaned.substring(3);
      }
      
      // Limit to 10 digits (after removing prefix)
      cleaned = cleaned.substring(0, 10);
      
      // Format for display: if there are digits, add the +234 prefix
      const formatted = cleaned ? `+234${cleaned}` : '';
      
      setFormData(prev => ({
        ...prev,
        [name]: formatted
      }));
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [name]: value
      }
    }));
  };

  const handleAvatarUpload = async (file) => {
    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const sellerToken = JSON.parse(localStorage.getItem('sellerToken')).data;
      const response = await fetch(`${BASE_URL}/seller/profile/avatar`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sellerToken}`,
        },
        body: formData,
      });

      if (response.ok) {
        toast.success("Store logo uploaded successfully");
        fetchStoreData();
      } else {
        throw new Error("Failed to upload logo");
      }
    } catch (error) {
      toast.error("Error uploading logo");
    }
  };

  const handleBannerUpload = async (file) => {
    const formData = new FormData();
    formData.append("banner", file);

    try {
      const sellerToken = JSON.parse(localStorage.getItem('sellerToken')).data;
      const response = await fetch(`${BASE_URL}/seller/profile/banner`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sellerToken}`,
        },
        body: formData,
      });

      if (response.ok) {
        toast.success("Store banner uploaded successfully");
        fetchStoreData();
      } else {
        throw new Error("Failed to upload banner");
      }
    } catch (error) {
      toast.error("Error uploading banner");
    }
  };

  const handleOperatingHoursChange = (day, field, value) => {
    setFormData(prev => ({
      ...prev,
      operatingHours: {
        ...prev.operatingHours,
        [day]: {
          ...prev.operatingHours[day],
          [field]: value
        }
      }
    }));
  };

  const handleAddSpecialDate = () => {
    if (!newSpecialDate.date) {
      toast.error("Please select a date");
      return;
    }

    setFormData(prev => ({
      ...prev,
      specialDates: [...prev.specialDates, newSpecialDate]
    }));

    setNewSpecialDate({
      date: null,
      isOpen: true,
      openTime: "09:00",
      closeTime: "17:00",
      note: ""
    });
  };

  const handleRemoveSpecialDate = (index) => {
    setFormData(prev => ({
      ...prev,
      specialDates: prev.specialDates.filter((_, i) => i !== index)
    }));
  };

  const handleStorePolicyChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      storePolicy: {
        ...prev.storePolicy,
        [field]: value
      }
    }));
  };

  const handleSocialMediaChange = (platform, value) => {
    setFormData(prev => ({
      ...prev,
      socialMedia: {
        ...prev.socialMedia,
        [platform]: value
      }
    }));
  };

  // Add this validation function
  const isValidNigerianNumber = (number) => {
    // Remove all non-digit characters
    const cleaned = number.replace(/\D/g, '');
    
    // Check if it starts with 234 and has 13 digits total
    // OR if it has 10 digits (without prefix)
    return (cleaned.startsWith('234') && cleaned.length === 13) ||
           (cleaned.length === 10);
  };

  // Update validation function to only check fields that are being updated
  const validateBusinessDetails = (dataToUpdate) => {
    // If we're updating business details, only validate the fields that are present
    if (dataToUpdate.businessName || dataToUpdate.businessType || dataToUpdate.taxInformation) {
      // Each field should be valid if it's being updated
      const isValid = Object.entries(dataToUpdate).every(([key, value]) => {
        return value !== undefined && value !== '';
      });
      
      if (!isValid) {
        toast.error("Please fill in all the fields you are trying to update");
        return false;
      }
    }
    return true;
  };

  // Separate API call functions
  const updateAccountType = async () => {
    setUpdatingSection(prev => ({ ...prev, accountType: true }));
    try {
      const sellerToken = JSON.parse(localStorage.getItem('sellerToken')).data;
      const response = await fetch(`${BASE_URL}/seller/profile/account-type`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sellerToken}`,
        },
        body: JSON.stringify({
          accountType: formData.accountType
        }),
      });

      if (!response.ok) throw new Error("Failed to update account type");
      return true;
    } catch (error) {
      toast.error("Error updating account type");
      return false;
    } finally {
      setUpdatingSection(prev => ({ ...prev, accountType: false }));
    }
  };

  const updateBusinessDetails = async () => {
    // Only include fields that have values
    const updateData = {
      ...(formData.businessName && { businessName: formData.businessName }),
      ...(formData.businessType && { businessType: formData.businessType }),
      ...(formData.businessDetails.taxInformation && { taxInformation: formData.businessDetails.taxInformation })
    };

    if (Object.keys(updateData).length === 0) return true; // Skip if no data to update
    
    if (!validateBusinessDetails(updateData)) return false;
    
    setUpdatingSection(prev => ({ ...prev, businessDetails: true }));
    try {
      const sellerToken = JSON.parse(localStorage.getItem('sellerToken')).data;
      const response = await fetch(`${BASE_URL}/seller/business-details`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sellerToken}`,
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) throw new Error("Failed to update business details");
      return true;
    } catch (error) {
      toast.error("Error updating business details");
      return false;
    } finally {
      setUpdatingSection(prev => ({ ...prev, businessDetails: false }));
    }
  };

  const updateBusinessInformation = async () => {
    setUpdatingSection(prev => ({ ...prev, businessInfo: true }));
    try {
      const sellerToken = JSON.parse(localStorage.getItem('sellerToken')).data;
      
      // Validate phone number before updating
      if (formData.phoneNumber && !isValidNigerianNumber(formData.phoneNumber)) {
        toast.error("Please enter a valid Nigerian phone number");
        return false;
      }
      
      // Only include fields that have been modified
      const updateData = {
        ...(formData.email && { businessEmail: formData.email }),
        ...(formData.phoneNumber && { businessNumber: formData.phoneNumber }),
        ...(formData.address && { businessAddress: formData.address })
      };

      if (Object.keys(updateData).length === 0) return true; // Skip if no changes

      const response = await fetch(`${BASE_URL}/seller/business-information`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sellerToken}`,
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) throw new Error("Failed to update business information");
      return true;
    } catch (error) {
      toast.error("Error updating business information");
      return false;
    } finally {
      setUpdatingSection(prev => ({ ...prev, businessInfo: false }));
    }
  };

  const updateIndividualInformation = async () => {
    setUpdatingSection(prev => ({ ...prev, individualInfo: true }));
    try {
      const sellerToken = JSON.parse(localStorage.getItem('sellerToken')).data;
      
      // Validate phone number before updating
      if (formData.phoneNumber && !isValidNigerianNumber(formData.phoneNumber)) {
        toast.error("Please enter a valid Nigerian phone number");
        return false;
      }
      
      // Only include fields that have been modified
      const updateData = {
        ...(formData.firstName && { firstName: formData.firstName }),
        ...(formData.lastName && { lastName: formData.lastName }),
        ...(formData.phoneNumber && { phoneNumber: formData.phoneNumber }),
        ...(formData.address && { sellerAddress: formData.address })
      };

      if (Object.keys(updateData).length === 0) return true; // Skip if no changes

      const response = await fetch(`${BASE_URL}/seller/individual-information`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sellerToken}`,
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) throw new Error("Failed to update individual information");
      return true;
    } catch (error) {
      toast.error("Error updating individual information");
      return false;
    } finally {
      setUpdatingSection(prev => ({ ...prev, individualInfo: false }));
    }
  };

  const updateStoreProfile = async () => {
    setUpdatingSection(prev => ({ ...prev, storeProfile: true }));
    try {
      const sellerToken = JSON.parse(localStorage.getItem('sellerToken')).data;
      const response = await fetch(`${BASE_URL}/seller/store-profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sellerToken}`,
        },
        body: JSON.stringify({
          storeName: formData.storeName,
          aboutStore: formData.description
        }),
      });

      if (!response.ok) throw new Error("Failed to update store profile");
      return true;
    } catch (error) {
      toast.error("Error updating store profile");
      return false;
    } finally {
      setUpdatingSection(prev => ({ ...prev, storeProfile: false }));
    }
  };

  const updateOperatingHours = async () => {
    setUpdatingSection(prev => ({ ...prev, operatingHours: true }));
    try {
      const sellerToken = JSON.parse(localStorage.getItem('sellerToken')).data;
      const response = await fetch(`${BASE_URL}/seller/operating-hours`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sellerToken}`,
        },
        body: JSON.stringify({
          operatingHours: formData.operatingHours,
          timezone: formData.timezone
        }),
      });

      if (!response.ok) throw new Error("Failed to update operating hours");
      return true;
    } catch (error) {
      toast.error("Error updating operating hours");
      return false;
    } finally {
      setUpdatingSection(prev => ({ ...prev, operatingHours: false }));
    }
  };

  const updateSpecialDates = async () => {
    try {
      const sellerToken = JSON.parse(localStorage.getItem('sellerToken')).data;
      const response = await fetch(`${BASE_URL}/seller/special-dates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sellerToken}`,
        },
        body: JSON.stringify({
          specialDates: formData.specialDates
        }),
      });

      if (!response.ok) throw new Error("Failed to update special dates");
      return true;
    } catch (error) {
      toast.error("Error updating special dates");
      return false;
    }
  };

  const updateStorePolicy = async () => {
    setUpdatingSection(prev => ({ ...prev, storePolicy: true }));
    try {
      const sellerToken = JSON.parse(localStorage.getItem('sellerToken')).data;
      const response = await fetch(`${BASE_URL}/seller/store-policy`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sellerToken}`,
        },
        body: JSON.stringify(formData.storePolicy),
      });

      if (!response.ok) throw new Error("Failed to update store policy");
      return true;
    } catch (error) {
      toast.error("Error updating store policy");
      return false;
    } finally {
      setUpdatingSection(prev => ({ ...prev, storePolicy: false }));
    }
  };

  const updateSocialMedia = async () => {
    setUpdatingSection(prev => ({ ...prev, socialMedia: true }));
    try {
      const sellerToken = JSON.parse(localStorage.getItem('sellerToken')).data;
      const response = await fetch(`${BASE_URL}/seller/social-media`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sellerToken}`,
        },
        body: JSON.stringify(formData.socialMedia),
      });

      if (!response.ok) throw new Error("Failed to update social media");
      return true;
    } catch (error) {
      toast.error("Error updating social media");
      return false;
    } finally {
      setUpdatingSection(prev => ({ ...prev, socialMedia: false }));
    }
  };

  // Update the main handleSubmit function
  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // First update account type
      const accountTypeSuccess = await updateAccountType();
      if (!accountTypeSuccess) return;

      // Update based on account type
      if (formData.accountType === 'business') {
        const businessDetailsSuccess = await updateBusinessDetails();
        if (!businessDetailsSuccess) return;

        // Update business information
        const businessInfoSuccess = await updateBusinessInformation();
        if (!businessInfoSuccess) return;
      } else {
        // Update individual information
        const individualInfoSuccess = await updateIndividualInformation();
        if (!individualInfoSuccess) return;
      }

      // Update store profile
      const storeProfileSuccess = await updateStoreProfile();
      if (!storeProfileSuccess) return;

      // Update operating hours
      const operatingHoursSuccess = await updateOperatingHours();
      if (!operatingHoursSuccess) return;

      // Update special dates
      const specialDatesSuccess = await updateSpecialDates();
      if (!specialDatesSuccess) return;

      // Update store policy
      const storePolicySuccess = await updateStorePolicy();
      if (!storePolicySuccess) return;

      // Update social media
      const socialMediaSuccess = await updateSocialMedia();
      if (!socialMediaSuccess) return;

      toast.success("All settings updated successfully");
    } catch (error) {
      toast.error("An error occurred while updating settings");
    } finally {
      setIsLoading(false);
    }
  };

  // Generate time options for select
  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        times.push(timeString);
      }
    }
    return times;
  };

  const timeOptions = generateTimeOptions();

  return (
    <div className="space-y-8">
      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-8">
          {/* Store Info Card */}
          <Card className="shadow-sm">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl">Store Info</CardTitle>
              <p className="text-sm text-muted-foreground">
                These details will appear in your profile
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="storeName">Store Name *</Label>
                <Input 
                  id="storeName" 
                  name="storeName"
                  value={formData.storeName}
                  onChange={handleInputChange}
                  placeholder="Enter store name" 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input 
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="+234 00000 00000" 
                />
              </div>

              <div className="space-y-2">
                <Label>Store Logo</Label>
                <div className="flex items-center gap-4">
                  {storeAvatar && (
                    <img 
                      src={storeAvatar} 
                      alt="Store Logo" 
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  )}
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleAvatarUpload(e.target.files[0])}
                    className="cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Store Banner</Label>
                <div className="space-y-2">
                  {storeBanner && (
                    <img 
                      src={storeBanner} 
                      alt="Store Banner" 
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  )}
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleBannerUpload(e.target.files[0])}
                    className="cursor-pointer"
                  />
                </div>
              </div>

              {/* <div className="space-y-2">
                <Label htmlFor="addressLine1">Address *</Label>
                <Input
                  id="addressLine1"
                  name="addressLine1"
                  value={formData.address.addressLine1}
                  onChange={handleAddressChange}
                  placeholder="Enter address"
                />
              </div> */}

              <div className="grid grid-cols-2 gap-4">
                {/* <div className="space-y-2">
                  <Label htmlFor="country">Country *</Label>
                  <Select 
                    value={formData.address.country}
                    onValueChange={(value) => handleAddressChange({ target: { name: 'country', value } })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Nigeria">Nigeria</SelectItem>
                    </SelectContent>
                  </Select>
                </div> */}

                {/* <div className="space-y-2">
                  <Label htmlFor="state">State *</Label>
                  <Select
                    value={formData.address.state}
                    onValueChange={(value) => handleAddressChange({ target: { name: 'state', value } })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose state" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Lagos">Lagos</SelectItem>
                    
                    </SelectContent>
                  </Select>
                </div> */}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email" 
                  name="email"
                  value={formData.email}
                  readOnly
                  disabled
                  className="bg-gray-100 cursor-not-allowed"
                />
              </div>

              {formData.accountType === "business" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business Name</Label>
                    <Input 
                      id="businessName"
                      name="businessName"
                      value={formData.businessName}
                      onChange={handleInputChange}
                      placeholder="Enter business name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="businessType">Business Type</Label>
                    <Input 
                      id="businessType"
                      name="businessType"
                      value={formData.businessType}
                      onChange={handleInputChange}
                      placeholder="Enter business type"
                    />
                  </div>
                </>
              )}

              {/* <div className="space-y-2">
                <Label htmlFor="cac">CAC</Label>
                <Input id="cac" placeholder="e.g.,1234567890" />
              </div> */}

              <div className="space-y-2">
                <Label htmlFor="description">Store Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Tell customers about your store..."
                  rows={4}
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Social Media Links</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="instagram">Instagram</Label>
                    <Input 
                      id="instagram"
                      value={formData.socialMedia.instagram}
                      onChange={(e) => handleSocialMediaChange('instagram', e.target.value)}
                      placeholder="https://instagram.com/yourstorename"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="facebook">Facebook</Label>
                    <Input 
                      id="facebook"
                      value={formData.socialMedia.facebook}
                      onChange={(e) => handleSocialMediaChange('facebook', e.target.value)}
                      placeholder="https://facebook.com/yourstorename"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="tiktok">TikTok</Label>
                    <Input 
                      id="tiktok"
                      value={formData.socialMedia.tiktok}
                      onChange={(e) => handleSocialMediaChange('tiktok', e.target.value)}
                      placeholder="https://tiktok.com/@yourstorename"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Operating Hours Card */}
          <Card className="shadow-sm">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl">Operating Hours</CardTitle>
              <p className="text-sm text-muted-foreground">
                Set your store's regular operating hours
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(formData.operatingHours).map(([day, hours]) => (
                <div key={day} className="mb-4 grid grid-cols-4 gap-4 items-center">
                  <div className="capitalize">{day}</div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={hours.isOpen}
                      onCheckedChange={(checked) => 
                        handleOperatingHoursChange(day, 'isOpen', checked)
                      }
                    />
                    <span>{hours.isOpen ? 'Open' : 'Closed'}</span>
                  </div>
                  {hours.isOpen && (
                    <>
                      <Select
                        value={hours.openTime}
                        onValueChange={(time) => handleOperatingHoursChange(day, 'openTime', time)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Open Time" />
                        </SelectTrigger>
                        <SelectContent>
                          {timeOptions.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={hours.closeTime}
                        onValueChange={(time) => handleOperatingHoursChange(day, 'closeTime', time)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Close Time" />
                        </SelectTrigger>
                        <SelectContent>
                          {timeOptions.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* Store Policy Card */}
          <Card className="shadow-sm">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl">Store Policy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {/* Shipping Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Shipping</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Delivery Time</Label>
                      <Select
                        value={formData.storePolicy.deliveryTimes}
                        onValueChange={(value) => handleStorePolicyChange('deliveryTimes', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose time" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1-3">1-3 days</SelectItem>
                          <SelectItem value="3-5">3-5 days</SelectItem>
                          <SelectItem value="5-7">5-7 days</SelectItem>
                          <SelectItem value="7-14">7-14 days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Free Shipping Policy</Label>
                      <Select
                        value={formData.storePolicy.freeShippingPolicy}
                        onValueChange={(value) => handleStorePolicyChange('freeShippingPolicy', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose policy" />
                        </SelectTrigger>
                        <SelectContent>
                          {DELIVERY_POLICIES.FREE_SHIPPING.map((policy) => (
                            <SelectItem key={policy.value} value={policy.value}>
                              {policy.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {/* Update Cash on Delivery to use Select */}
                  <div className="space-y-2">
                    <Label>Cash on Delivery</Label>
                    <Select
                      value={formData.storePolicy.allowsCod ? "true" : "false"}
                      onValueChange={(value) => handleStorePolicyChange('allowsCod', value === 'true')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Yes</SelectItem>
                        <SelectItem value="false">No</SelectItem> 
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Update Lost or Damaged Policy */}
                  <div className="space-y-2">
                    <Label>Lost or Damaged Items Policy</Label>
                    <Select
                      value={formData.storePolicy.lostOrDamagedPolicy}
                      onValueChange={(value) => handleStorePolicyChange('lostOrDamagedPolicy', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select policy" />
                      </SelectTrigger>
                      <SelectContent>
                        {DELIVERY_POLICIES.LOST_DAMAGED.map((policy) => (
                          <SelectItem key={policy.value} value={policy.value}>
                            {policy.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Refund Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Refund</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Refund Window</Label>
                      <Select
                        value={formData.storePolicy.refundPolicy}
                        onValueChange={(value) => handleStorePolicyChange('refundPolicy', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select refund window" />
                        </SelectTrigger>
                        <SelectContent>
                          {DELIVERY_POLICIES.REFUND_WINDOWS.map((window) => (
                            <SelectItem key={window.value} value={window.value}>
                              {window.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Refund Method</Label>
                      <Select
                        value={formData.storePolicy.refundMethod}
                        onValueChange={(value) => handleStorePolicyChange('refundMethod', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select refund method" />
                        </SelectTrigger>
                        <SelectContent>
                          {DELIVERY_POLICIES.REFUND_METHODS.map((method) => (
                            <SelectItem key={method.value} value={method.value}>
                              {method.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Processing Time</Label>
                      <Select
                        value={formData.storePolicy.processingTime}
                        onValueChange={(value) => handleStorePolicyChange('processingTime', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select processing time" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="24h">Within 24 hours</SelectItem>
                          <SelectItem value="48h">Within 48 hours</SelectItem>
                          <SelectItem value="72h">Within 72 hours</SelectItem>
                          <SelectItem value="7d">Within 7 days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Return Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Return</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Return Window</Label>
                      <Select
                        value={formData.storePolicy.returnWindow.toString()}
                        onValueChange={(value) => handleStorePolicyChange('returnWindow', parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select return window" />
                        </SelectTrigger>
                        <SelectContent>
                          {DELIVERY_POLICIES.RETURN_WINDOWS.map((window) => (
                            <SelectItem key={window.value} value={window.value}>
                              {window.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Return Condition</Label>
                      <Select
                        value={formData.storePolicy.returnCondition}
                        onValueChange={(value) => handleStorePolicyChange('returnCondition', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select return condition" />
                        </SelectTrigger>
                        <SelectContent>
                          {DELIVERY_POLICIES.RETURN_CONDITIONS.map((condition) => (
                            <SelectItem key={condition.value} value={condition.value}>
                              {condition.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Return Shipping</Label>
                      <Select
                        value={formData.storePolicy.returnShipping}
                        onValueChange={(value) => handleStorePolicyChange('returnShipping', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select who pays return shipping" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="buyer">Buyer pays</SelectItem>
                          <SelectItem value="seller">Seller pays</SelectItem>
                          <SelectItem value="case_by_case">Case by case basis</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Special Dates Card */}
          <Card className="shadow-sm">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl">Special Dates</CardTitle>
              <p className="text-sm text-muted-foreground">
                Add holidays or special operating hours
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Add New Special Date Section */}
              <div className="space-y-4 border-b pb-6">
                <h4 className="font-medium">Add New Date</h4>
                <div className="space-y-4">
                  <div className="space-y-4">
                    <Label>Date</Label>
                    <div className="relative">
                      <DatePicker
                        selected={newSpecialDate.date}
                        onChange={(date) => 
                          setNewSpecialDate(prev => ({ ...prev, date }))
                        }
                        dateFormat="MMMM d, yyyy"
                        minDate={new Date()}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <Label>Status</Label>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={newSpecialDate.isOpen}
                        onCheckedChange={(checked) =>
                          setNewSpecialDate(prev => ({ ...prev, isOpen: checked }))
                        }
                      />
                      <span>{newSpecialDate.isOpen ? 'Open' : 'Closed'}</span>
                    </div>
                  </div>
                </div>

                {newSpecialDate.isOpen && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Open Time</Label>
                      <Select
                        value={newSpecialDate.openTime}
                        onValueChange={(time) =>
                          setNewSpecialDate(prev => ({ ...prev, openTime: time }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Open Time" />
                        </SelectTrigger>
                        <SelectContent>
                          {timeOptions.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Close Time</Label>
                      <Select
                        value={newSpecialDate.closeTime}
                        onValueChange={(time) =>
                          setNewSpecialDate(prev => ({ ...prev, closeTime: time }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Close Time" />
                        </SelectTrigger>
                        <SelectContent>
                          {timeOptions.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                <div>
                  <Label>Note</Label>
                  <Input
                    value={newSpecialDate.note}
                    onChange={(e) =>
                      setNewSpecialDate(prev => ({ ...prev, note: e.target.value }))
                    }
                    placeholder="e.g., Holiday, Special Event"
                  />
                </div>

                <Button onClick={handleAddSpecialDate}>Add Special Date</Button>
              </div>

              {/* Special Dates List Section */}
              {formData.specialDates.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium">Special Dates List</h4>
                  <div className="space-y-3">
                    {formData.specialDates.map((date, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{new Date(date.date).toLocaleDateString()}</p>
                          <p className="text-sm text-muted-foreground">
                            {date.isOpen 
                              ? `Open: ${date.openTime} - ${date.closeTime}`
                              : 'Closed'
                            }
                          </p>
                          {date.note && <p className="text-sm">{date.note}</p>}
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveSpecialDate(index)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <Button 
          onClick={handleSubmit} 
          disabled={isLoading}
          className="px-6"
        >
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  )
}

