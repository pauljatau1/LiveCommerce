import { Input } from "@/Components/ui/form/input"
import { Label } from "@/Components/ui/label"
import { toast } from "sonner"
import { Button } from "@/Components/ui/button"
import { useAuthContext } from "@/Hooks/useAuthContextV2"
import { useState, useEffect } from 'react'
import { BASE_URL, BASE_URL_V2 } from "@/Constants/Server"
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle} from "@/Components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/select"
import { SearchableSelect } from "@/Components/ui/searchable-select"
import { Building2, CreditCard, User, Briefcase, Calculator, Globe, AlertCircle, CheckCircle2, XCircle, RefreshCw, Lock, Unlock } from 'lucide-react'
import { cn } from "@/lib/utils";
import { Skeleton } from "@/Components/ui/skeleton";

export default function PaymentSettings() {
  const { token } = useAuthContext();
  const [bankDetails, setBankDetails] = useState({
    bankCountry: "",
    bankName: "",
    bankAccountType: "",
    accountCurrency: "",
    accountNumber: "",
    accountName: "",
    swiftCode: "",
    bankIdentifierCode: ""
  });
  const [banks, setBanks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingBankDetails, setIsLoadingBankDetails] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [isBankVerified, setIsBankVerified] = useState(false);
  
  // Verification states
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null); // 'success', 'error', null
  const [verificationMessage, setVerificationMessage] = useState('');
  const [isFieldsLocked, setIsFieldsLocked] = useState(false);
  const [verifiedAccountName, setVerifiedAccountName] = useState('');

  useEffect(() => {
    fetchProfileData();
    fetchBanks();
  }, []);

  const fetchProfileData = async () => {
    setIsLoadingBankDetails(true);
    try {
      const sellerToken = token?.data;
      const response = await fetch(`${BASE_URL_V2}/sellers/profile`, {
        headers: {
          Authorization: `Bearer ${sellerToken}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setBankDetails(data.data.bankDetails || {});
        setIsBankVerified(data.data.isBankVerified || false);
      }
    } catch (error) {
      console.error("Failed to fetch bank details", error);
      toast.error("Failed to fetch bank details");
    } finally {
      setIsLoadingBankDetails(false);
    }
  };


  /**
   * Fetch list of Nigerian banks from Paystack via backend API
   */
  const fetchBanks = async () => {
    try {
      const sellerToken = token?.data;
      const response = await fetch(`${BASE_URL_V2}/sellers/banks`, {
        headers: {
          Authorization: `Bearer ${sellerToken}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setBanks(data.data || []);
      } else {
        throw new Error('Failed to fetch banks');
      }
    } catch (error) {
      console.error("Failed to fetch banks", error);
      toast.error("Failed to fetch bank list. Using cached list.");
      // Fallback to a basic list if API fails
      setBanks([
        { name: 'Access Bank Nigeria Plc', code: '044' },
        { name: 'Guaranty Trust Bank Plc', code: '058' },
        { name: 'United Bank for Africa Plc', code: '033' },
        { name: 'Zenith Bank International', code: '057' },
        { name: 'First Bank of Nigeria Plc', code: '011' },
      ]);
    }
  };

  /**
   * Verify bank account with Paystack when user enters 10th digit
   * This function is called automatically after the account number reaches 10 digits
   */
  const verifyBankAccount = async (accountNumber, bankCode) => {
    // Only verify if we have both account number and bank code
    if (!accountNumber || !bankCode || accountNumber.length !== 10) {
      return;
    }

    setIsVerifying(true);
    setVerificationStatus(null);
    setVerificationMessage('');

    try {
      const sellerToken = token?.data;
      const response = await fetch(`${BASE_URL_V2}/sellers/banks/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sellerToken}`,
        },
        body: JSON.stringify({
          accountNumber: accountNumber,
          bankCode: bankCode
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Verification successful
        setVerificationStatus('success');
        setVerificationMessage(`Account verified: ${data.data.accountName}`);
        setVerifiedAccountName(data.data.accountName);
        setIsFieldsLocked(true);
        
        // Update the form with verified account name
        setEditForm({
          ...editForm,
          accountName: data.data.accountName
        });
        
        toast.success(`Account verified: ${data.data.accountName}`);
      } else {
        const errorData = await response.json();
        
        // Verification failed
        setVerificationStatus('error');
        setVerificationMessage(errorData.message || 'Account verification failed');
        setIsFieldsLocked(false);
        
        toast.error(errorData.message || 'Could not verify account. Please check the details.');
      }
    } catch (error) {
      console.error("Bank verification error:", error);
      setVerificationStatus('error');
      setVerificationMessage('Network error. Please try again.');
      setIsFieldsLocked(false);
      toast.error("Network error during verification");
    } finally {
      setIsVerifying(false);
    }
  };

  /**
   * Reset the verification form
   * Clears all fields and unlocks them for new input
   */
  const handleResetForm = () => {
    setEditForm({
      bankCountry: "Nigeria",
      bankName: "",
      bankAccountType: "",
      accountCurrency: "NGN",
      accountNumber: "",
      accountName: "",
      swiftCode: "",
      bankIdentifierCode: ""
    });
    setVerificationStatus(null);
    setVerificationMessage('');
    setIsFieldsLocked(false);
    setVerifiedAccountName('');
    toast.info("Form reset. Please enter new bank details.");
  };


  /**
   * Handle account number input
   */
  const handleAccountNumberChange = (value) => {
    setEditForm({...editForm, accountNumber: value});
    
    // Reset verification if user modifies account number after verification
    if (verificationStatus === 'success') {
      setVerificationStatus(null);
      setVerificationMessage('');
      setIsFieldsLocked(false);
    }
  };

  /**
   * Check if all required fields are filled and ready for verification
   */
  const canVerify = () => {
    return editForm.bankName && 
           editForm.bankAccountType && 
           editForm.bankIdentifierCode && 
           editForm.accountNumber?.length === 10 &&
           !isFieldsLocked;
  };

  /**
   * Handle manual verification button click
   */
  const handleManualVerification = () => {
    if (canVerify()) {
      verifyBankAccount(editForm.accountNumber, editForm.bankIdentifierCode);
    }
  };

  const handleUpdateBankDetails = async () => {
    // Check if verification is required but not completed
    if (verificationStatus !== 'success') {
      toast.error("Please verify your bank account before submitting");
      return;
    }

    setIsLoading(true);
    try {
      const sellerToken = token?.data;
      const verifiedStatus = verificationStatus === 'success';
      
      // Debug log to confirm what we're sending
      console.log('🔐 Submitting bank details:', {
        verificationStatus,
        isVerified: verifiedStatus,
        bankName: editForm.bankName,
        accountNumber: editForm.accountNumber,
        accountName: editForm.accountName,
        isUpdate: !!bankDetails.accountNumber
      });
      
      // Direct update for all bank details (new or existing)
      const response = await fetch(`${BASE_URL_V2}/sellers/profile/bank-details`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sellerToken}`,
        },
        body: JSON.stringify({ 
          bankDetails: editForm,
          isVerified: verifiedStatus // Pass verification status
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Bank details response:', data);
        
        const message = bankDetails.accountNumber 
          ? "Bank details updated and verified successfully!" 
          : "Bank details added and verified successfully!";
        toast.success(message);
        
        await fetchProfileData(); // Wait for profile to refresh
        setIsEditing(false);
        // Reset form states
        setVerificationStatus(null);
        setVerificationMessage('');
        setIsFieldsLocked(false);
      } else {
        const errorData = await response.json();
        console.error('❌ Bank details error:', errorData);
        throw new Error(errorData.message || "Failed to save bank details");
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const BankDetailsDialog = () => (
    <Dialog open={isEditing} onOpenChange={setIsEditing}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {bankDetails.accountNumber ? "Request Bank Details Change" : "Add Bank Details"}
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Fill in your bank details below, then click <strong>"Verify Account"</strong> to confirm your account details with Paystack before submitting.
          </p>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Verification Status Banner */}
          {verificationStatus && (
            <div className={`p-4 rounded-lg border ${
              verificationStatus === 'success' 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start space-x-3">
                {verificationStatus === 'success' ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <h4 className={`font-medium ${
                    verificationStatus === 'success' ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {verificationStatus === 'success' ? 'Account Verified!' : 'Verification Failed'}
                  </h4>
                  <p className={`text-sm mt-1 ${
                    verificationStatus === 'success' ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {verificationMessage}
                  </p>
                </div>
                {verificationStatus === 'success' && (
                  <Lock className="h-5 w-5 text-green-600" />
                )}
              </div>
            </div>
          )}

          {/* Verifying Indicator */}
          {isVerifying && (
            <div className="p-4 rounded-lg border bg-blue-50 border-blue-200">
              <div className="flex items-center space-x-3">
                <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />
                <p className="text-sm text-blue-700">Verifying account details with Paystack...</p>
              </div>
            </div>
          )}

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Bank Country</Label>
              <Input 
                value="Nigeria"
                disabled
                className="bg-gray-100"
              />
            </div>

            <div className="grid gap-2">
              <Label>Bank Name *</Label>
              <SearchableSelect
                options={banks.map(bank => ({
                  value: bank.name,
                  label: bank.name
                }))}
                value={editForm.bankName || ''}
                onValueChange={(value) => {
                  const selectedBank = banks.find(bank => bank.name === value);
                  setEditForm({
                    ...editForm, 
                    bankName: value,
                    bankIdentifierCode: selectedBank?.code || '',
                    bankCountry: 'Nigeria'
                  });
                  // Reset verification when bank changes
                  setVerificationStatus(null);
                  setVerificationMessage('');
                  setIsFieldsLocked(false);
                }}
                placeholder="Select bank"
                searchPlaceholder="Search for your bank..."
                emptyText="No banks found. Try a different search."
                disabled={isFieldsLocked}
              />
              {isFieldsLocked && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Lock className="h-3 w-3" /> Locked after verification
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label>Bank Account Type *</Label>
              <Select 
                value={editForm.bankAccountType || ''}
                onValueChange={(value) => setEditForm({...editForm, bankAccountType: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Savings">Savings</SelectItem>
                  <SelectItem value="Current">Current</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Please select your account type before verification
              </p>
            </div>

            <div className="grid gap-2">
              <Label>Account Currency</Label>
              <Input 
                value="NGN"
                disabled
                className="bg-gray-100"
              />
              <p className="text-xs text-muted-foreground">Nigerian Naira (NGN) is the only supported currency</p>
            </div>

            <div className="grid gap-2">
              <Label>Account Number * (10 digits)</Label>
              <div className="flex gap-2">
                <Input 
                  value={editForm.accountNumber || ''}
                  onChange={(e) => handleAccountNumberChange(e.target.value)}
                  maxLength={10}
                  type="number"
                  placeholder="Enter 10-digit account number"
                  disabled={isFieldsLocked}
                  className={isFieldsLocked ? 'bg-gray-100 flex-1' : 'flex-1'}
                />
                {!isFieldsLocked && (
                  <Button
                    type="button"
                    onClick={handleManualVerification}
                    disabled={!canVerify() || isVerifying}
                    className={cn(
                      "whitespace-nowrap",
                      canVerify() ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-300"
                    )}
                  >
                    {isVerifying ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Verify Account
                      </>
                    )}
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {editForm.accountNumber?.length || 0}/10 digits
                {!isFieldsLocked && editForm.accountNumber?.length === 10 && canVerify() && 
                  " - Click 'Verify Account' to confirm your details"
                }
              </p>
              {isFieldsLocked && (
                <p className="text-xs text-green-600 flex items-center gap-1 font-medium">
                  <Lock className="h-3 w-3" /> Verified and locked
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label>Account Name</Label>
              <Input 
                value={editForm.accountName || verifiedAccountName}
                onChange={(e) => setEditForm({...editForm, accountName: e.target.value})}
                placeholder="Will be auto-filled after verification"
                disabled={true}
                className="bg-gray-100"
              />
              <p className="text-xs text-muted-foreground">
                This field will be automatically filled after successful verification
              </p>
            </div>

            <div className="grid gap-2">
              <Label>Bank Identifier Code (Auto-filled)</Label>
              <Input 
                value={editForm.bankIdentifierCode || ''}
                disabled
                className="bg-gray-100"
              />
              <p className="text-xs text-muted-foreground">
                Automatically filled when you select a bank
              </p>
            </div>

          </div>
          
          <div className="flex gap-2 pt-4">
            {/* Reset Button - Only show when fields are locked */}
            {isFieldsLocked && (
              <Button 
                variant="outline"
                onClick={handleResetForm}
                className="flex-1"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset & Start Over
              </Button>
            )}
            
            {/* Submit Button */}
            <Button 
              className={`${isFieldsLocked ? 'flex-1' : 'w-full'} bg-green-500 hover:bg-green-600`}
              onClick={handleUpdateBankDetails}
              disabled={isLoading || verificationStatus !== 'success'}
            >
              {isLoading ? "Processing..." : bankDetails.accountNumber ? "Update Bank Details" : "Add Bank Details"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  // Skeleton loader for bank details card
  const BankDetailsSkeleton = () => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-9 w-20" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="flex items-center justify-between py-2 border-b">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      
      {/* Bank Verification Status Banner */}
      {!isLoadingBankDetails && bankDetails.accountNumber && (
        <div className={`p-4 rounded-lg border ${
          isBankVerified 
            ? 'bg-green-50 border-green-200' 
            : 'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="flex items-start space-x-3">
            {isBankVerified ? (
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            )}
            <div>
              <h3 className={`font-medium ${
                isBankVerified ? 'text-green-800' : 'text-yellow-800'
              }`}>
                {isBankVerified ? 'Bank Account Verified ✓' : 'Bank Account Not Verified'}
              </h3>
              <p className={`text-sm mt-1 ${
                isBankVerified ? 'text-green-700' : 'text-yellow-700'
              }`}>
                {isBankVerified 
                  ? 'Your bank account has been verified with Paystack. You can process withdrawals.'
                  : 'Please verify your bank account to enable withdrawals. Update your bank details to verify.'
                }
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Payout Details */}
        {isLoadingBankDetails ? (
          <BankDetailsSkeleton />
        ) : (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Payout Details</CardTitle>
              <Button 
                variant="default" 
                className="bg-green-500 hover:bg-green-600"
                onClick={() => {
                  setEditForm({
                    ...bankDetails, 
                    accountCurrency: "NGN",
                    bankCountry: "Nigeria"
                  });
                  setIsEditing(true);
                  // Reset verification states when opening dialog
                  setVerificationStatus(null);
                  setVerificationMessage('');
                  setIsFieldsLocked(false);
                }}
              >
                Update
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b">
                  <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm font-medium">Bank Country</span>
                  </div>
                  <span className="text-sm">{bankDetails.bankCountry || 'Not set'}</span>
                </div>

                <div className="flex items-center justify-between py-2 border-b">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm font-medium">Bank Name</span>
                  </div>
                  <span className="text-sm">{bankDetails.bankName || 'Not set'}</span>
                </div>

                <div className="flex items-center justify-between py-2 border-b">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm font-medium">Account Name</span>
                  </div>
                  <span className="text-sm">{bankDetails.accountName || 'Not set'}</span>
                </div>

                <div className="flex items-center justify-between py-2 border-b">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm font-medium">Account Type</span>
                  </div>
                  <span className="text-sm">{bankDetails.bankAccountType || 'Not set'}</span>
                </div>

                <div className="flex items-center justify-between py-2 border-b">
                  <div className="flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm font-medium">Account Number</span>
                  </div>
                  <span className="text-sm">{bankDetails.accountNumber || 'Not set'}</span>
                </div>

                <div className="flex items-center justify-between py-2 border-b">
                  <div className="flex items-center gap-2">
                    {isBankVerified ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span className="text-sm font-medium">Verification Status</span>
                  </div>
                  <span className={`text-sm font-semibold ${
                    isBankVerified ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {isBankVerified ? 'Verified' : 'Not Verified'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Card Payment Method - Coming Soon */}
        <Card>
          <CardHeader>
            <CardTitle>Card Payment Method</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center h-[300px] text-center">
            <CreditCard className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
            <p className="text-sm text-muted-foreground">
              Card payment functionality will be available soon.
            </p>
          </CardContent>
        </Card>
      </div>

      {BankDetailsDialog()}

      {/* Purchase Label Card */}
      <Card>
        <CardContent className="flex flex-col md:flex-row items-start gap-4 md:items-center justify-between p-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Purchase Label</h3>
            <p className="text-sm text-muted-foreground">
              If an item is missing or incomplete and you want to send a replacement, you can purchase labels via Auqli through terminal and print.
            </p>
          </div>
          <Button variant="outline" className="text-green-500 border-green-500 hover:bg-green-50">
            Set up
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
