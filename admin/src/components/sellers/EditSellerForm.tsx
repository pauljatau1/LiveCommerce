import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  AlertCircle, 
  Check, 
  Loader2,
  X,
  User,
  Building,
  MapPin,
  Store,
  CreditCard,
  Globe,
  Settings 
} from "lucide-react";
import { SellerService, UpdateSellerData } from "@/services/sellerService";

interface EditSellerFormProps {
  sellerId: string;
  initialData: UpdateSellerData;
  onSuccess: (updatedData: any) => void;
  onCancel: () => void;
}

export default function EditSellerForm({ sellerId, initialData, onSuccess, onCancel }: EditSellerFormProps) {
  const [formData, setFormData] = useState<UpdateSellerData>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("personal");

  const handleInputChange = (section: string, field: string, value: any) => {
    if (section === "root" && field === "accountType") {
      // If changing from business to individual and currently on business tab, switch to personal tab
      if (value === "individual" && activeTab === "business") {
        setActiveTab("personal");
      }
    }
    
    if (section === "root") {
      setFormData({
        ...formData,
        [field]: value
      });
    } else {
      setFormData({
        ...formData,
        [section]: {
          ...(formData[section as keyof UpdateSellerData] as object || {}),
          [field]: value
        }
      });
    }
  };

  const handleAddressChange = (section: string, field: string, value: any) => {
    setFormData({
      ...formData,
      [section]: {
        ...(formData[section as keyof UpdateSellerData] as Record<string, any> || {}),
        [field]: value
      }
    });
  };

  const handleSocialMediaChange = (platform: string, value: string) => {
    setFormData({
      ...formData,
      socialMedia: {
        ...(formData.socialMedia || {}),
        [platform]: value
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await SellerService.updateSellerInfo(sellerId, formData);
      setSuccessMessage("Seller information updated successfully");
      onSuccess(response.data.seller);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update seller information");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 mx-auto max-w-4xl">
      {error && (
        <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/30 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/30 flex items-start gap-3">
          <Check className="h-5 w-5 text-green-500 mt-0.5" />
          <p className="text-sm text-green-500">{successMessage}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6 w-full overflow-x-auto flex-wrap justify-start gap-1 bg-zinc-800/50 p-1 rounded-lg">
            <TabsTrigger value="personal" className="flex items-center gap-2 text-white">
              <User className="h-4 w-4" />
              Personal Info
            </TabsTrigger>
            {formData.accountType !== "individual" && (
              <TabsTrigger value="business" className="flex items-center gap-2 text-white">
                <Building className="h-4 w-4" />
                Business Info
              </TabsTrigger>
            )}
            <TabsTrigger value="address" className="flex items-center gap-2 text-white">
              <MapPin className="h-4 w-4" />
              Addresses
            </TabsTrigger>
            <TabsTrigger value="store" className="flex items-center gap-2 text-white">
              <Store className="h-4 w-4" />
              Store Details
            </TabsTrigger>
            <TabsTrigger value="bank" className="flex items-center gap-2 text-white">
              <CreditCard className="h-4 w-4" />
              Bank Details
            </TabsTrigger>
            <TabsTrigger value="status" className="flex items-center gap-2 text-white">
              <Settings className="h-4 w-4" />
              Status
            </TabsTrigger>
          </TabsList>

          {/* Personal Information */}
          <TabsContent value="personal" className="space-y-6">
            <Card className="p-6 bg-zinc-900/70 border-zinc-700 shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-white border-b border-zinc-800 pb-2">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-zinc-200">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName || ""}
                    onChange={(e) => handleInputChange("root", "firstName", e.target.value)}
                    className="bg-zinc-800/80 border-zinc-700 text-white placeholder:text-zinc-400 focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-zinc-200">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName || ""}
                    onChange={(e) => handleInputChange("root", "lastName", e.target.value)}
                    className="bg-zinc-800/80 border-zinc-700 text-white placeholder:text-zinc-400 focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-zinc-200">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) => handleInputChange("root", "email", e.target.value)}
                    className="bg-zinc-800/80 border-zinc-700 text-white placeholder:text-zinc-400 focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber" className="text-zinc-200">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    value={formData.phoneNumber || ""}
                    onChange={(e) => handleInputChange("root", "phoneNumber", e.target.value)}
                    className="bg-zinc-800/80 border-zinc-700 text-white placeholder:text-zinc-400 focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="accountType" className="text-zinc-200">Account Type</Label>
                  <Select 
                    value={formData.accountType || "individual"}
                    onValueChange={(value) => handleInputChange("root", "accountType", value)}
                  >
                    <SelectTrigger className="bg-zinc-800/80 border-zinc-700 text-white focus:border-indigo-500">
                      <SelectValue placeholder="Select account type" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                      <SelectItem value="individual">Individual</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Business Information */}
          <TabsContent value="business" className="space-y-6">
            <Card className="p-6 bg-zinc-900 border-zinc-800">
              <h3 className="text-lg font-semibold mb-4 text-white">Business Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-white">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    value={formData.businessName || ""}
                    onChange={(e) => handleInputChange("root", "businessName", e.target.value)}
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessType">Business Type</Label>
                  <Input
                    id="businessType"
                    value={formData.businessType || ""}
                    onChange={(e) => handleInputChange("root", "businessType", e.target.value)}
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessEmail">Business Email</Label>
                  <Input
                    id="businessEmail"
                    type="email"
                    value={formData.businessEmail || ""}
                    onChange={(e) => handleInputChange("root", "businessEmail", e.target.value)}
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessNumber">Business Phone</Label>
                  <Input
                    id="businessNumber"
                    value={formData.businessNumber || ""}
                    onChange={(e) => handleInputChange("root", "businessNumber", e.target.value)}
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="taxInformation">Tax Information</Label>
                  <Input
                    id="taxInformation"
                    value={formData.taxInformation || ""}
                    onChange={(e) => handleInputChange("root", "taxInformation", e.target.value)}
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Addresses */}
          <TabsContent value="address" className="space-y-6">
            {/* Business Address */}
            {formData.accountType !== "individual" && (
              <Card className="p-6 bg-zinc-900/70 border-zinc-700 shadow-sm">
                <h3 className="text-lg font-semibold mb-4 text-white border-b border-zinc-800 pb-2">Business Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="businessAddressLine1" className="text-zinc-200">Address Line 1</Label>
                    <Input
                      id="businessAddressLine1"
                      value={formData.businessAddress?.addressLine1 || ""}
                      onChange={(e) => handleAddressChange("businessAddress", "addressLine1", e.target.value)}
                      className="bg-zinc-800/80 border-zinc-700 text-white placeholder:text-zinc-400 focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessAddressLine2" className="text-zinc-200">Address Line 2</Label>
                    <Input
                      id="businessAddressLine2"
                      value={formData.businessAddress?.addressLine2 || ""}
                      onChange={(e) => handleAddressChange("businessAddress", "addressLine2", e.target.value)}
                      className="bg-zinc-800/80 border-zinc-700 text-white placeholder:text-zinc-400 focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessCity" className="text-zinc-200">City</Label>
                    <Input
                      id="businessCity"
                      value={formData.businessAddress?.city || ""}
                      onChange={(e) => handleAddressChange("businessAddress", "city", e.target.value)}
                      className="bg-zinc-800/80 border-zinc-700 text-white placeholder:text-zinc-400 focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessState" className="text-zinc-200">State/Province</Label>
                    <Input
                      id="businessState"
                      value={formData.businessAddress?.state || ""}
                      onChange={(e) => handleAddressChange("businessAddress", "state", e.target.value)}
                      className="bg-zinc-800/80 border-zinc-700 text-white placeholder:text-zinc-400 focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessZipCode" className="text-zinc-200">Zip/Postal Code</Label>
                    <Input
                      id="businessZipCode"
                      value={formData.businessAddress?.zipCode || ""}
                      onChange={(e) => handleAddressChange("businessAddress", "zipCode", e.target.value)}
                      className="bg-zinc-800/80 border-zinc-700 text-white placeholder:text-zinc-400 focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessCountry" className="text-zinc-200">Country</Label>
                    <Input
                      id="businessCountry"
                      value={formData.businessAddress?.country || ""}
                      onChange={(e) => handleAddressChange("businessAddress", "country", e.target.value)}
                      className="bg-zinc-800/80 border-zinc-700 text-white placeholder:text-zinc-400 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </Card>
            )}

            {/* Seller Address (for individual accounts) */}
            <Card className="p-6 bg-zinc-900/70 border-zinc-700 shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-white border-b border-zinc-800 pb-2">Personal Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sellerAddressLine1" className="text-zinc-200">Address Line 1</Label>
                  <Input
                    id="sellerAddressLine1"
                    value={formData.sellerAddress?.addressLine1 || ""}
                    onChange={(e) => handleAddressChange("sellerAddress", "addressLine1", e.target.value)}
                    className="bg-zinc-800/80 border-zinc-700 text-white placeholder:text-zinc-400 focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sellerAddressLine2" className="text-zinc-200">Address Line 2</Label>
                  <Input
                    id="sellerAddressLine2"
                    value={formData.sellerAddress?.addressLine2 || ""}
                    onChange={(e) => handleAddressChange("sellerAddress", "addressLine2", e.target.value)}
                    className="bg-zinc-800/80 border-zinc-700 text-white placeholder:text-zinc-400 focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sellerCity" className="text-zinc-200">City</Label>
                  <Input
                    id="sellerCity"
                    value={formData.sellerAddress?.city || ""}
                    onChange={(e) => handleAddressChange("sellerAddress", "city", e.target.value)}
                    className="bg-zinc-800/80 border-zinc-700 text-white placeholder:text-zinc-400 focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sellerState" className="text-zinc-200">State/Province</Label>
                  <Input
                    id="sellerState"
                    value={formData.sellerAddress?.state || ""}
                    onChange={(e) => handleAddressChange("sellerAddress", "state", e.target.value)}
                    className="bg-zinc-800/80 border-zinc-700 text-white placeholder:text-zinc-400 focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sellerZipCode" className="text-zinc-200">Zip/Postal Code</Label>
                  <Input
                    id="sellerZipCode"
                    value={formData.sellerAddress?.zipCode || ""}
                    onChange={(e) => handleAddressChange("sellerAddress", "zipCode", e.target.value)}
                    className="bg-zinc-800/80 border-zinc-700 text-white placeholder:text-zinc-400 focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sellerCountry" className="text-zinc-200">Country</Label>
                  <Input
                    id="sellerCountry"
                    value={formData.sellerAddress?.country || ""}
                    onChange={(e) => handleAddressChange("sellerAddress", "country", e.target.value)}
                    className="bg-zinc-800/80 border-zinc-700 text-white placeholder:text-zinc-400 focus:border-indigo-500"
                  />
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Store Details */}
          <TabsContent value="store" className="space-y-6">
            <Card className="p-6 bg-zinc-900 border-zinc-800">
              <h3 className="text-lg font-semibold mb-4 text-white">Store Information</h3>
              <div className="grid grid-cols-1 text-white gap-4">
                <div className="space-y-2">
                  <Label htmlFor="storeName">Store Name</Label>
                  <Input
                    id="storeName"
                    value={formData.storeName || ""}
                    onChange={(e) => handleInputChange("root", "storeName", e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aboutStore">About Store</Label>
                  <Textarea
                    id="aboutStore"
                    value={formData.aboutStore || ""}
                    onChange={(e) => handleInputChange("root", "aboutStore", e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white"
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Store Timezone</Label>
                  <Input
                    id="timezone"
                    value={formData.timezone || ""}
                    onChange={(e) => handleInputChange("root", "timezone", e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-zinc-900 border-zinc-800">
              <h3 className="text-lg font-semibold mb-4 text-white">Social Media</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-white">
                <div className="space-y-2">
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input
                    id="instagram"
                    value={formData.socialMedia?.instagram || ""}
                    onChange={(e) => handleSocialMediaChange("instagram", e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="facebook">Facebook</Label>
                  <Input
                    id="facebook"
                    value={formData.socialMedia?.facebook || ""}
                    onChange={(e) => handleSocialMediaChange("facebook", e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="twitter">Twitter</Label>
                  <Input
                    id="twitter"
                    value={formData.socialMedia?.twitter || ""}
                    onChange={(e) => handleSocialMediaChange("twitter", e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tiktok">TikTok</Label>
                  <Input
                    id="tiktok"
                    value={formData.socialMedia?.tiktok || ""}
                    onChange={(e) => handleSocialMediaChange("tiktok", e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Bank Details */}
          <TabsContent value="bank" className="space-y-6">
            <Card className="p-6 bg-zinc-900 border-zinc-800">
              <h3 className="text-lg font-semibold mb-4 text-white">Bank Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-white">
                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input
                    id="bankName"
                    value={formData.bankDetails?.bankName || ""}
                    onChange={(e) => handleInputChange("bankDetails", "bankName", e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankCountry">Bank Country</Label>
                  <Input
                    id="bankCountry"
                    value={formData.bankDetails?.bankCountry || ""}
                    onChange={(e) => handleInputChange("bankDetails", "bankCountry", e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountName">Account Holder Name</Label>
                  <Input
                    id="accountName"
                    value={formData.bankDetails?.accountName || ""}
                    onChange={(e) => handleInputChange("bankDetails", "accountName", e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input
                    id="accountNumber"
                    value={formData.bankDetails?.accountNumber || ""}
                    onChange={(e) => handleInputChange("bankDetails", "accountNumber", e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankAccountType">Account Type</Label>
                  <Input
                    id="bankAccountType"
                    value={formData.bankDetails?.bankAccountType || ""}
                    onChange={(e) => handleInputChange("bankDetails", "bankAccountType", e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountCurrency">Currency</Label>
                  <Input
                    id="accountCurrency"
                    value={formData.bankDetails?.accountCurrency || ""}
                    onChange={(e) => handleInputChange("bankDetails", "accountCurrency", e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="swiftCode">SWIFT Code</Label>
                  <Input
                    id="swiftCode"
                    value={formData.bankDetails?.swiftCode || ""}
                    onChange={(e) => handleInputChange("bankDetails", "swiftCode", e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankIdentifierCode">Bank Identifier Code</Label>
                  <Input
                    id="bankIdentifierCode"
                    value={formData.bankDetails?.bankIdentifierCode || ""}
                    onChange={(e) => handleInputChange("bankDetails", "bankIdentifierCode", e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Status Section */}
          <TabsContent value="status" className="space-y-6">
            <Card className="p-6 bg-zinc-900/70 border-zinc-700 shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-white border-b border-zinc-800 pb-2">Account Status</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-3 border border-zinc-800 rounded-lg hover:bg-zinc-800/50 transition-colors">
                  <div>
                    <Label htmlFor="isVerified" className="text-base text-white font-medium">Verification Status</Label>
                    <p className="text-sm text-zinc-300 mt-1">Whether the seller account is verified</p>
                  </div>
                  <Switch
                    id="isVerified"
                    checked={formData.isVerified || false}
                    onCheckedChange={(checked: boolean) => handleInputChange("root", "isVerified", checked)}
                    className="data-[state=checked]:bg-green-500"
                  />
                </div>
                <div className="flex items-center justify-between p-3 border border-zinc-800 rounded-lg hover:bg-zinc-800/50 transition-colors">
                  <div>
                    <Label htmlFor="isFeatured" className="text-base text-white font-medium">Featured Seller</Label>
                    <p className="text-sm text-zinc-300 mt-1">Display seller prominently on the platform</p>
                  </div>
                  <Switch
                    id="isFeatured"
                    checked={formData.isFeatured || false}
                    onCheckedChange={(checked: boolean) => handleInputChange("root", "isFeatured", checked)}
                    className="data-[state=checked]:bg-indigo-500"
                  />
                </div>
                <div className="flex items-center justify-between p-3 border border-zinc-800 rounded-lg hover:bg-zinc-800/50 transition-colors">
                  <div>
                    <Label htmlFor="isDisabled" className="text-base text-white font-medium">Disable Account</Label>
                    <p className="text-sm text-zinc-300 mt-1">Temporarily disable seller account</p>
                  </div>
                  <Switch
                    id="isDisabled"
                    checked={formData.isDisabled || false}
                    onCheckedChange={(checked: boolean) => handleInputChange("root", "isDisabled", checked)}
                    className="data-[state=checked]:bg-red-500"
                  />
                </div>
                <div className="flex items-center justify-between p-3 border border-zinc-800 rounded-lg hover:bg-zinc-800/50 transition-colors">
                  <div>
                    <Label htmlFor="accountPending" className="text-base text-white font-medium">Account Pending</Label>
                    <p className="text-sm text-zinc-300 mt-1">Mark account as pending approval</p>
                  </div>
                  <Switch
                    id="accountPending"
                    checked={formData.accountPending || false}
                    onCheckedChange={(checked: boolean) => handleInputChange("root", "accountPending", checked)}
                    className="data-[state=checked]:bg-amber-500"
                  />
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end gap-3 mt-8">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={loading}
            className="border-zinc-600 bg-gray-600 text-white hover:bg-zinc-800 hover:text-white"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
} 