import { useState, useEffect, useRef } from "react";
import { CalendarIcon, Clock, HelpCircle, Upload, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { settingsService } from '@/services/settingsService';
import { toast } from "sonner";
import { BASE_URL } from '@/Constants/Server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Header from "@/Components/ui/Header/Header";
import { useOutletContext } from 'react-router-dom'

const TABS = [
  "Store",
  "Profile",
  "Notifications",
  "Warehouse",
  "Payment",
  "Security",
];

const BUSINESS_TYPES = [
  "Individual",
  "Business"
];

export default function SettingsDashboard() {
  const { setHeaderName, setNavName } = useOutletContext()
  const [activeTab, setActiveTab] = useState("Store");
  const [loading, setLoading] = useState(false);
  const avatarInputRef = useRef(null);
  const bannerInputRef = useRef(null);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    businessName: '',
    businessType: '',
    businessEmail: '',
    businessNumber: '',
    taxInformation: '',
    accountType: '',
    storeAvatar: { url: '' },
    storeBanner: { url: '' }
  });

  const [businessAddress, setBusinessAddress] = useState({
    country: '',
    state: '',
    city: '',
    addressLine1: '',
    addressLine2: '',
    zipCode: ''
  });

  const [storeData, setStoreData] = useState({
    storeName: '',
    phone: '',
    address: '',
    country: '',
    state: '',
    email: '',
    description: '',
    openTime: '',
    closeTime: ''
  });

  const [warehouseData, setWarehouseData] = useState({
    name: '',
    contactNumber: '',
    address: {
      country: '',
      state: '',
      city: '',
      addressLine1: '',
      addressLine2: '',
      zipCode: ''
    }
  });

  const [notificationPreferences, setNotificationPreferences] = useState({
    emailNotifications: true,
    pushNotifications: true,
    notificationTypes: {
      orderUpdates: true,
      lowStock: true,
      newReviews: true,
      promotions: true
    }
  });

  const [statistics, setStatistics] = useState({
    totalStoreVisits: 0,
    totalSales: 0,
    totalOrders: 0,
    uniqueCustomers: 0,
    conversionRate: "",
    walletBalance: 0,
    currentMonth: { orders: 0, sales: 0 }
  });

  const [followers, setFollowers] = useState({ followers: [], pagination: {} });

  useEffect(() => {
    setHeaderName('Settings')
    setNavName('')
  }, [])

  // Fetch initial data
  useEffect(() => {
    const fetchSellerProfile = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("sellerToken");
        if (token) {
          const { data: authToken } = JSON.parse(token);
          const response = await fetch(`${BASE_URL}/seller/profile`, {
            headers: { Authorization: `Bearer ${authToken}` },
          });
          const data = await response.json();
          
          setProfileData({
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phoneNumber: data.phoneNumber,
            businessName: data.businessName,
            businessType: data.businessType,
            businessEmail: data.businessEmail,
            businessNumber: data.businessNumber,
            taxInformation: data.taxInformation,
            accountType: data.accountType,
            storeAvatar: data.storeAvatar,
            storeBanner: data.storeBanner
          });

          setBusinessAddress(data.businessAddress);
          setNotificationPreferences(data.notificationPreferences);
          setWarehouseData(data.warehouseDetails);
          
          // Update store data with the correct fields from the response
          setStoreData({
            storeName: data.storeName || '',
            phone: data.businessNumber || '',
            address: data.businessAddress?.addressLine1 || '',
            country: data.businessAddress?.country || '',
            state: data.businessAddress?.state || '',
            email: data.businessEmail || '',
            description: data.aboutStore || ''
          });
        }
      } catch (error) {
        toast.error("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };

    fetchSellerProfile();
  }, []);

  // Fetch statistics
  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const data = await settingsService.getStatistics();
        setStatistics(data);
      } catch (error) {
        toast.error("Failed to load statistics");
      }
    };

    fetchStatistics();
  }, []);

  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        setLoading(true);
        const formData = new FormData();
        formData.append('avatar', file);
        
        const token = localStorage.getItem("sellerToken");
        const { data: authToken } = JSON.parse(token);
        
        const response = await fetch(`${BASE_URL}/seller/profile/avatar`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${authToken}` },
          body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
          // Update the store avatar in the local state immediately
          setProfileData(prev => ({
            ...prev,
            storeAvatar: {
              url: data.storeAvatar?.url || data.url,
              public_id: data.storeAvatar?.public_id || data.public_id
            }
          }));
          toast.success("Store avatar updated successfully");
        } else {
          throw new Error(data.message || "Failed to upload avatar");
        }
      } catch (error) {
        toast.error(error.message || "Failed to upload avatar");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBannerUpload = async (event) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        setLoading(true);
        const formData = new FormData();
        formData.append('banner', file);
        
        const token = localStorage.getItem("sellerToken");
        const { data: authToken } = JSON.parse(token);
        
        const response = await fetch(`${BASE_URL}/seller/profile/banner`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${authToken}` },
          body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
          // Create a temporary URL for immediate display
          const tempUrl = URL.createObjectURL(file);
          
          // Update the store banner in the local state immediately with temp URL
          setProfileData(prev => ({
            ...prev,
            storeBanner: {
              url: tempUrl, // Use temp URL for immediate display
              public_id: data.storeBanner?.public_id || data.public_id
            }
          }));

          // After a brief delay, update with the actual URL from the server
          setTimeout(() => {
            setProfileData(prev => ({
              ...prev,
              storeBanner: {
                url: data.storeBanner?.url || data.url,
                public_id: data.storeBanner?.public_id || data.public_id
              }
            }));
            // Clean up the temporary URL
            URL.revokeObjectURL(tempUrl);
          }, 1000);

          toast.success("Store banner updated successfully");
        } else {
          throw new Error(data.message || "Failed to upload banner");
        }
      } catch (error) {
        toast.error(error.message || "Failed to upload banner");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      // Update profile information
      await settingsService.updateStoreProfile({
        storeName: profileData.businessName,
        aboutStore: profileData.taxInformation,
        businessType: profileData.businessType,
        // ... other fields
      });
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleStoreUpdate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      // Simplified payload to match API requirements
      const storeProfileData = {
        storeName: storeData.storeName,
        aboutStore: storeData.description
      };

      await settingsService.updateStoreProfile(storeProfileData);
      toast.success("Store information updated successfully");
    } catch (error) {
      toast.error("Failed to update store information");
    } finally {
      setLoading(false);
    }
  };

  const handleWarehouseUpdate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await settingsService.updateWarehouseDetails(warehouseData);
      toast.success("Warehouse details updated successfully");
    } catch (error) {
      toast.error("Failed to update warehouse details");
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationUpdate = async (type, checked) => {
    try {
      setLoading(true);
      const updatedPreferences = {
        ...notificationPreferences,
        notificationTypes: {
          ...notificationPreferences.notificationTypes,
          [type]: checked
        }
      };
      
      await settingsService.updateNotificationPreferences(updatedPreferences);
      setNotificationPreferences(updatedPreferences);
      toast.success("Notification preferences updated");
    } catch (error) {
      toast.error("Failed to update notification preferences");
    } finally {
      setLoading(false);
    }
  };

  // Handle business details update
  const handleBusinessUpdate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await settingsService.updateBusinessDetails({
        businessName: profileData.businessName,
        businessType: profileData.businessType,
        taxInformation: profileData.taxInformation
      });
      toast.success("Business details updated successfully");
    } catch (error) {
      toast.error("Failed to update business details");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await settingsService.forgotPassword(profileData.email);
      toast.success("Password reset instructions sent to your email");
    } catch (error) {
      toast.error("Failed to initiate password reset");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await settingsService.resetPassword(profileData.email, resetToken, newPassword);
      toast.success("Password reset successfully");
      setResetToken('');
      setNewPassword('');
    } catch (error) {
      toast.error("Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "Store":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Store Information</CardTitle>
              <CardDescription>Update your store details and business information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6 mb-6">
                <div className="space-y-4">
                  <Label>Store Avatar</Label>
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={profileData.storeAvatar?.url} />
                      <AvatarFallback>ST</AvatarFallback>
                    </Avatar>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => avatarInputRef.current?.click()}
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Change Avatar
                    </Button>
                    <input
                      type="file"
                      ref={avatarInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Store Banner</Label>
                  <div className={`relative h-48 w-full rounded-lg ${!profileData.storeBanner?.url ? 'border-2 border-dashed border-gray-300' : ''}`}>
                    {profileData.storeBanner?.url ? (
                      <img
                        src={profileData.storeBanner.url}
                        alt="Store Banner"
                        className="h-full w-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500">No banner uploaded</p>
                      </div>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      className="absolute bottom-4 right-4"
                      onClick={() => bannerInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Change Banner
                    </Button>
                    <input
                      type="file"
                      ref={bannerInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleBannerUpload}
                    />
                  </div>
                </div>
              </div>

              <form onSubmit={handleStoreUpdate} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="storeName">Store Name</Label>
                    <Input
                      id="storeName"
                      value={storeData.storeName}
                      onChange={(e) => setStoreData(prev => ({ ...prev, storeName: e.target.value }))}
                      placeholder="Enter store name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={storeData.phone}
                      onChange={(e) => setStoreData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Business Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={storeData.email}
                      onChange={(e) => setStoreData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter business email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={storeData.country}
                      onChange={(e) => setStoreData(prev => ({ ...prev, country: e.target.value }))}
                      placeholder="Enter country"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={storeData.state}
                      onChange={(e) => setStoreData(prev => ({ ...prev, state: e.target.value }))}
                      placeholder="Enter state"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={storeData.address}
                      onChange={(e) => setStoreData(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="Enter address"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Store Description</Label>
                  <Textarea
                    id="description"
                    value={storeData.description}
                    onChange={(e) => setStoreData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter store description"
                    rows={4}
                  />
                </div>
                <Button type="submit" disabled={loading}>
                  {loading ? "Updating..." : "Update Store Information"}
                </Button>
              </form>
            </CardContent>
          </Card>
        );

      case "Profile":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Manage your personal and business information</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileUpdate} className="space-y-6">
                <div className="space-y-4">
                  {/* Personal Information */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={profileData.firstName}
                        onChange={(e) => setProfileData(prev => ({
                          ...prev,
                          firstName: e.target.value
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={profileData.lastName}
                        onChange={(e) => setProfileData(prev => ({
                          ...prev,
                          lastName: e.target.value
                        }))}
                      />
                    </div>
                  </div>

                  {/* Business Information */}
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business Name</Label>
                    <Input
                      id="businessName"
                      value={profileData.businessName}
                      onChange={(e) => setProfileData(prev => ({
                        ...prev,
                        businessName: e.target.value
                      }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="businessType">Business Type</Label>
                    <Select
                      value={profileData.businessType}
                      onValueChange={(value) => setProfileData(prev => ({
                        ...prev,
                        businessType: value
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select business type" />
                      </SelectTrigger>
                      <SelectContent>
                        {BUSINESS_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Contact Information */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="businessEmail">Business Email</Label>
                      <Input
                        id="businessEmail"
                        type="email"
                        value={profileData.businessEmail}
                        onChange={(e) => setProfileData(prev => ({
                          ...prev,
                          businessEmail: e.target.value
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="businessPhone">Business Phone</Label>
                      <Input
                        id="businessPhone"
                        value={profileData.businessNumber}
                        onChange={(e) => setProfileData(prev => ({
                          ...prev,
                          businessNumber: e.target.value
                        }))}
                      />
                    </div>
                  </div>

                  {/* Business Address */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        value={businessAddress.country}
                        onChange={(e) => setBusinessAddress(prev => ({
                          ...prev,
                          country: e.target.value
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={businessAddress.state}
                        onChange={(e) => setBusinessAddress(prev => ({
                          ...prev,
                          state: e.target.value
                        }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={businessAddress.city}
                        onChange={(e) => setBusinessAddress(prev => ({
                          ...prev,
                          city: e.target.value
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zipCode">ZIP Code</Label>
                      <Input
                        id="zipCode"
                        value={businessAddress.zipCode}
                        onChange={(e) => setBusinessAddress(prev => ({
                          ...prev,
                          zipCode: e.target.value
                        }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="addressLine1">Address Line 1</Label>
                    <Input
                      id="addressLine1"
                      value={businessAddress.addressLine1}
                      onChange={(e) => setBusinessAddress(prev => ({
                        ...prev,
                        addressLine1: e.target.value
                      }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
                    <Input
                      id="addressLine2"
                      value={businessAddress.addressLine2}
                      onChange={(e) => setBusinessAddress(prev => ({
                        ...prev,
                        addressLine2: e.target.value
                      }))}
                    />
                  </div>
                </div>

                <Button type="submit" disabled={loading}>
                  {loading ? "Updating..." : "Update Profile"}
                </Button>
              </form>
            </CardContent>
          </Card>
        );

      case "Notifications":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Manage your notification settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                  </div>
                  <Switch
                    checked={notificationPreferences.emailNotifications}
                    onCheckedChange={(checked) => handleNotificationUpdate('emailNotifications', checked)}
                    disabled={loading}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Order Updates</Label>
                    <p className="text-sm text-muted-foreground">Get notified about order status changes</p>
                  </div>
                  <Switch
                    checked={notificationPreferences.notificationTypes.orderUpdates}
                    onCheckedChange={(checked) => handleNotificationUpdate('orderUpdates', checked)}
                    disabled={loading}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Low Stock Alerts</Label>
                    <p className="text-sm text-muted-foreground">Receive alerts when products are running low</p>
                  </div>
                  <Switch
                    checked={notificationPreferences.notificationTypes.lowStock}
                    onCheckedChange={(checked) => handleNotificationUpdate('lowStock', checked)}
                    disabled={loading}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>New Reviews</Label>
                    <p className="text-sm text-muted-foreground">Get notified about new product reviews</p>
                  </div>
                  <Switch
                    checked={notificationPreferences.notificationTypes.newReviews}
                    onCheckedChange={(checked) => handleNotificationUpdate('newReviews', checked)}
                    disabled={loading}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case "Warehouse":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Warehouse Details</CardTitle>
              <CardDescription>Manage your warehouse information</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleWarehouseUpdate} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="warehouseName">Warehouse Name</Label>
                    <Input
                      id="warehouseName"
                      value={warehouseData.name}
                      onChange={(e) => setWarehouseData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter warehouse name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactNumber">Contact Number</Label>
                    <Input
                      id="contactNumber"
                      value={warehouseData.contactNumber}
                      onChange={(e) => setWarehouseData(prev => ({ ...prev, contactNumber: e.target.value }))}
                      placeholder="Enter contact number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="warehouseCountry">Country</Label>
                    <Input
                      id="warehouseCountry"
                      value={warehouseData.address.country}
                      onChange={(e) => setWarehouseData(prev => ({
                        ...prev,
                        address: { ...prev.address, country: e.target.value }
                      }))}
                      placeholder="Enter country"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="warehouseState">State</Label>
                    <Input
                      id="warehouseState"
                      value={warehouseData.address.state}
                      onChange={(e) => setWarehouseData(prev => ({
                        ...prev,
                        address: { ...prev.address, state: e.target.value }
                      }))}
                      placeholder="Enter state"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="warehouseCity">City</Label>
                    <Input
                      id="warehouseCity"
                      value={warehouseData.address.city}
                      onChange={(e) => setWarehouseData(prev => ({
                        ...prev,
                        address: { ...prev.address, city: e.target.value }
                      }))}
                      placeholder="Enter city"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="warehouseZip">ZIP Code</Label>
                    <Input
                      id="warehouseZip"
                      value={warehouseData.address.zipCode}
                      onChange={(e) => setWarehouseData(prev => ({
                        ...prev,
                        address: { ...prev.address, zipCode: e.target.value }
                      }))}
                      placeholder="Enter ZIP code"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="warehouseAddress">Address Line 1</Label>
                  <Input
                    id="warehouseAddress"
                    value={warehouseData.address.addressLine1}
                    onChange={(e) => setWarehouseData(prev => ({
                      ...prev,
                      address: { ...prev.address, addressLine1: e.target.value }
                    }))}
                    placeholder="Enter address line 1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="warehouseAddress2">Address Line 2 (Optional)</Label>
                  <Input
                    id="warehouseAddress2"
                    value={warehouseData.address.addressLine2}
                    onChange={(e) => setWarehouseData(prev => ({
                      ...prev,
                      address: { ...prev.address, addressLine2: e.target.value }
                    }))}
                    placeholder="Enter address line 2"
                  />
                </div>
                <Button type="submit" disabled={loading}>
                  {loading ? "Updating..." : "Update Warehouse Information"}
                </Button>
              </form>
            </CardContent>
          </Card>
        );

      case "Security":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your account security</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Forgot Password</h3>
                  <p className="text-sm text-muted-foreground">
                    Request a password reset link to be sent to your email.
                  </p>
                  <Button
                    onClick={handleForgotPassword}
                    disabled={loading}
                  >
                    {loading ? "Sending..." : "Request Password Reset"}
                  </Button>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Reset Password</h3>
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="resetToken">Reset Token</Label>
                      <Input
                        id="resetToken"
                        value={resetToken}
                        onChange={(e) => setResetToken(e.target.value)}
                        placeholder="Enter reset token from email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                      />
                    </div>
                    <Button type="submit" disabled={loading}>
                      {loading ? "Resetting..." : "Reset Password"}
                    </Button>
                  </form>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      // Add other tab content here
      default:
        return null;
    }
  };

  const renderStatisticsCard = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Store Statistics</CardTitle>
        <CardDescription>Overview of your store performance</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-secondary rounded-lg">
            <p className="text-sm text-muted-foreground">Total Visits</p>
            <h3 className="text-2xl font-bold">{statistics.totalStoreVisits}</h3>
          </div>
          <div className="p-4 bg-secondary rounded-lg">
            <p className="text-sm text-muted-foreground">Total Sales</p>
            <h3 className="text-2xl font-bold">${statistics.totalSales}</h3>
          </div>
          {/* Add more statistics cards */}
        </div>
      </CardContent>
    </Card>
  );

  const renderImagePreview = () => (
    <div className="flex gap-4 mb-6">
      <div className="space-y-2">
        <Label>Store Avatar</Label>
        <div className="relative w-24 h-24">
          <Avatar className="w-24 h-24">
            <AvatarImage src={profileData.storeAvatar?.url} />
            <AvatarFallback>ST</AvatarFallback>
          </Avatar>
          <Button
            size="sm"
            className="absolute bottom-0 right-0"
            onClick={() => avatarInputRef.current?.click()}
          >
            <Camera className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {/* Add banner preview */}
    </div>
  );

  return (
    <div className="container mx-auto px-4 pb-8">
      <div className="flex flex-col pt-5 space-y-8">
        <div className="flex space-x-4">
          {TABS.map((tab) => (
            <Button
              key={tab}
              variant={activeTab === tab ? "default" : "outline"}
              onClick={() => setActiveTab(tab)}
              className="px-4 py-2"
            >
              {tab}
            </Button>
          ))}
        </div>

        <div className="mt-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}
