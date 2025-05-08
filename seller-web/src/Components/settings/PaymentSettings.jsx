import { useState, useEffect } from 'react'
import { Building2, CreditCard, User, Briefcase, Calculator, Globe, DollarSign, Hash, Upload, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card"
import { Button } from "@/Components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/Components/ui/dialog"
import { Input } from "@/Components/ui/input"
import { Label } from "@/Components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/select"
import { BASE_URL } from "@/Constants/Server"
import { toast } from "sonner"

const NIGERIAN_BANKS = [
  { name: 'Access Bank Nigeria Plc', code: '044' },
  { name: 'Ecobank Nigeria', code: '050' },
  { name: 'Enterprise Bank Plc', code: '084' },
  { name: 'Fidelity Bank Plc', code: '070' },
  { name: 'First Bank of Nigeria Plc', code: '011' },
  { name: 'First City Monument Bank', code: '214' },
  { name: 'Guaranty Trust Bank Plc', code: '058' },
  { name: 'Jaiz Bank', code: '301' },
  { name: 'Keystone Bank Ltd', code: '082' },
  { name: 'Mainstreet Bank Plc', code: '014' },
  { name: 'Skye Bank Plc', code: '076' },
  { name: 'Stanbic IBTC Plc', code: '039' },
  { name: 'Sterling Bank Plc', code: '232' },
  { name: 'Union Bank Nigeria Plc', code: '032' },
  { name: 'United Bank for Africa Plc', code: '033' },
  { name: 'Unity Bank Plc', code: '215' },
  { name: 'WEMA Bank Plc', code: '035' },
  { name: 'Zenith Bank International', code: '057' },
  { name: 'Providus Bank', code: '101' },
  { name: 'PARALLEX BANK LIMITED', code: '104' },
  { name: 'LOTUS BANK LIMITED', code: '303' },
  { name: 'PREMIUM TRUST BANK LTD', code: '105' },
  { name: 'SIGNATURE BANK LTD', code: '106' },
  { name: 'GLOBUS BANK', code: '103' },
  { name: 'TITAN TRUST BANK', code: '102' },
  { name: 'Polaris Bank', code: '067' },
  { name: 'OPTIMUS BANK LTD', code: '107' },
  { name: 'Standard Chartered Bank', code: '068' },
  { name: 'Suntrust Bank', code: '100' }
];

export default function PaymentSettings() {
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
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [proofDocument, setProofDocument] = useState(null);
  const [pendingRequest, setPendingRequest] = useState(null);

  useEffect(() => {
    fetchProfileData();
    fetchPendingRequest();
  }, []);

  const fetchProfileData = async () => {
    try {
      const sellerToken = JSON.parse(localStorage.getItem('sellerToken')).data;
      const response = await fetch(`${BASE_URL}/seller/profile`, {
        headers: {
          Authorization: `Bearer ${sellerToken}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setBankDetails(data.bankDetails || {});
      }
    } catch (error) {
      toast.error("Failed to fetch bank details");
    }
  };

  const fetchPendingRequest = async () => {
    try {
      const sellerToken = JSON.parse(localStorage.getItem('sellerToken')).data;
      const response = await fetch(`${BASE_URL}/seller/bank-change-request/status`, {
        headers: {
          Authorization: `Bearer ${sellerToken}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.pendingRequest) {
          setPendingRequest(data.pendingRequest);
        }
      }
    } catch (error) {
      console.error("Failed to fetch pending request status");
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error("File size should not exceed 5MB");
        return;
      }
      setProofDocument(file);
    }
  };

  const handleUpdateBankDetails = async () => {
    setIsLoading(true);
    try {
      const sellerToken = JSON.parse(localStorage.getItem('sellerToken')).data;

      if (!bankDetails.accountNumber) {
        // Direct update for first-time bank details
        const response = await fetch(`${BASE_URL}/seller/profile/bank-details`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sellerToken}`,
          },
          body: JSON.stringify({ bankDetails: editForm }),
        });

        if (response.ok) {
          toast.success("Bank details added successfully");
          fetchProfileData();
          setIsEditing(false);
        } else {
          throw new Error("Failed to add bank details");
        }
      } else {
        // Submit change request for existing bank details
        if (!proofDocument) {
          toast.error("Please upload proof document");
          return;
        }

        const formData = new FormData();
        formData.append('proofDocument', proofDocument);
        
        // Properly format the bank details
        const newBankDetails = {
          bankCountry: editForm.bankCountry,
          bankName: editForm.bankName,
          bankAccountType: editForm.bankAccountType,
          accountCurrency: "NGN",
          accountNumber: editForm.accountNumber,
          accountName: editForm.accountName,
          swiftCode: editForm.swiftCode,
          bankIdentifierCode: editForm.bankIdentifierCode
        };

        // Append the entire newBankDetails object as a single JSON string
        formData.append('newBankDetails', JSON.stringify(newBankDetails));

        const response = await fetch(`${BASE_URL}/seller/bank-change-request`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${sellerToken}`,
          },
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to submit bank change request");
        }

        toast.success("Bank change request submitted successfully");
        fetchPendingRequest();
        setIsEditing(false);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const BankDetailsDialog = () => (
    <Dialog open={isEditing} onOpenChange={setIsEditing}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {bankDetails.accountNumber ? "Request Bank Details Change" : "Add Bank Details"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Bank Country</Label>
              <Input 
                defaultValue={bankDetails.bankCountry}
                onChange={(e) => setEditForm({...editForm, bankCountry: e.target.value})}
              />
            </div>

            <div className="grid gap-2">
              <Label>Bank Name</Label>
              <Select 
                defaultValue={bankDetails.bankName}
                onValueChange={(value) => {
                  const selectedBank = NIGERIAN_BANKS.find(bank => bank.name === value);
                  setEditForm({
                    ...editForm, 
                    bankName: value,
                    bankIdentifierCode: selectedBank.code
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select bank" />
                </SelectTrigger>
                <SelectContent>
                  {NIGERIAN_BANKS.map((bank) => (
                    <SelectItem key={bank.code} value={bank.name}>
                      {bank.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Bank Account Type</Label>
              <Select 
                defaultValue={bankDetails.bankAccountType}
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
            </div>

            <div className="grid gap-2">
              <Label>Account Currency</Label>
              <Input 
                value="NGN"
                disabled
                className="bg-gray-100"
                onChange={(e) => setEditForm({...editForm, accountCurrency: "NGN"})}
              />
              <p className="text-xs text-muted-foreground">Nigerian Naira (NGN) is the only supported currency</p>
            </div>

            <div className="grid gap-2">
              <Label>Account Number</Label>
              <Input 
                defaultValue={bankDetails.accountNumber}
                onChange={(e) => setEditForm({...editForm, accountNumber: e.target.value})}
                maxLength={10}
                type="number"
              />
            </div>

            <div className="grid gap-2">
              <Label>Account Name</Label>
              <Input 
                defaultValue={bankDetails.accountName}
                onChange={(e) => setEditForm({...editForm, accountName: e.target.value})}
              />
            </div>

            <div className="grid gap-2">
              <Label>Swift Code</Label>
              <Input 
                defaultValue={bankDetails.swiftCode}
                onChange={(e) => setEditForm({...editForm, swiftCode: e.target.value})}
              />
            </div>

            <div className="grid gap-2">
              <Label>Bank Identifier Code (CBN Code)</Label>
              <Input 
                value={editForm.bankIdentifierCode || ''}
                disabled
                className="bg-gray-100"
              />
            </div>

            {bankDetails.accountNumber && (
              <div className="grid gap-2">
                <Label>Proof Document</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="flex-1"
                  />
                  <Upload className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Please upload a document to verify your bank account change request (bank statement, void check, or other official document).
                  Maximum file size: 5MB. Supported formats: PDF, JPG, PNG.
                </p>
              </div>
            )}
          </div>
          
          <Button 
            className="w-full bg-green-500 hover:bg-green-600" 
            onClick={handleUpdateBankDetails}
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : bankDetails.accountNumber ? "Submit Change Request" : "Add Bank Details"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  const PendingRequestBanner = () => {
    if (!pendingRequest) return null;

    return (
      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
          <div>
            <h3 className="font-medium text-yellow-800">Pending Bank Change Request</h3>
            <p className="text-sm text-yellow-700 mt-1">
              You have a pending request to change your bank details. New details:
            </p>
            <div className="mt-2 space-y-1 text-sm text-yellow-700">
              <p>Bank: {pendingRequest.newBankDetails.bankName}</p>
              <p>Account Number: {pendingRequest.newBankDetails.accountNumber}</p>
              <p>Account Name: {pendingRequest.newBankDetails.accountName}</p>
              <p className="text-xs text-yellow-600 mt-2">
                Submitted on: {new Date(pendingRequest.requestDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <PendingRequestBanner />
      <div className="grid gap-6 md:grid-cols-2">
        {/* Payout Details */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Payout Details</CardTitle>
            <Button 
              variant="default" 
              className="bg-green-500 hover:bg-green-600"
              onClick={() => {
                setEditForm({...bankDetails, accountCurrency: "NGN"});
                setIsEditing(true);
              }}
              disabled={pendingRequest}
            >
              {pendingRequest ? "Change Pending" : "Update"}
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
            </div>
          </CardContent>
        </Card>

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
        <CardContent className="flex items-center justify-between p-6">
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
