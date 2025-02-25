"use client"

import { useState, useEffect } from 'react'
import { Building2, CreditCard, User, Briefcase, Calculator, Globe, DollarSign, Hash } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BASE_URL } from "@/Constants/Server"
import { toast } from "sonner"

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

  useEffect(() => {
    fetchProfileData();
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

  const handleUpdateBankDetails = async () => {
    setIsLoading(true);
    try {
      const sellerToken = JSON.parse(localStorage.getItem('sellerToken')).data;
      const response = await fetch(`${BASE_URL}/seller/profile/bank-details`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sellerToken}`,
        },
        body: JSON.stringify({ bankDetails: editForm }),
      });

      if (response.ok) {
        toast.success("Bank details updated successfully");
        fetchProfileData();
        setIsEditing(false);
      } else {
        throw new Error("Failed to update bank details");
      }
    } catch (error) {
      toast.error("Error updating bank details");
    } finally {
      setIsLoading(false);
    }
  };

  const BankDetailsDialog = () => (
    <Dialog open={isEditing} onOpenChange={setIsEditing}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Update Bank Details</DialogTitle>
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
              <Input 
                defaultValue={bankDetails.bankName}
                onChange={(e) => setEditForm({...editForm, bankName: e.target.value})}
              />
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
              <Select 
                defaultValue={bankDetails.accountCurrency}
                onValueChange={(value) => setEditForm({...editForm, accountCurrency: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NGN">NGN (Nigerian Naira)</SelectItem>
                  <SelectItem value="USD">USD (US Dollar)</SelectItem>
                  <SelectItem value="EUR">EUR (Euro)</SelectItem>
                  <SelectItem value="GBP">GBP (British Pound)</SelectItem>
                </SelectContent>
              </Select>
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
              <Label>Bank Identifier Code</Label>
              <Input 
                defaultValue={bankDetails.bankIdentifierCode}
                onChange={(e) => setEditForm({...editForm, bankIdentifierCode: e.target.value})}
              />
            </div>
          </div>
          
          <Button 
            className="w-full bg-green-500 hover:bg-green-600" 
            onClick={handleUpdateBankDetails}
            disabled={isLoading}
          >
            {isLoading ? "Updating..." : "Update Bank Details"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Payout Details */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Payout Details</CardTitle>
            <Button 
              variant="default" 
              className="bg-green-500 hover:bg-green-600"
              onClick={() => {
                setEditForm(bankDetails);
                setIsEditing(true);
              }}
            >
              Edit
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
