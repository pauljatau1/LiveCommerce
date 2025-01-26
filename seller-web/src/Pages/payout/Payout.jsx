import { useState, useEffect } from 'react';
import { Building2, CreditCard, Info, ArrowRight, ArrowLeft, Receipt, Calendar, ArrowDownToLine, Wallet, BanknoteIcon, Clock, FileText } from 'lucide-react'
import { Card } from "@/Components/ui/card"
import { Button } from "@/Components/ui/button"
import Header from '@/Components/ui/Header/Header';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/Components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select"
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/Components/ui/dialog";
import { Toaster } from "@/Components/ui/sonner";
import { BASE_URL } from "@/Constants/Server";
import jsPDF from 'jspdf';

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
  }).format(amount)
}

export default function Payout() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [financialData, setFinancialData] = useState({
    totalRevenue: 0,
    amountOnHold: 0,
    availableForWithdrawal: 0,
  });
  const [bankDetails, setBankDetails] = useState({
    bankName: '',
    accountNumber: '',
    accountName: ''
  });
  const [withdrawalAmount, setWithdrawalAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [updatingBank, setUpdatingBank] = useState(false);
  const [newBankDetails, setNewBankDetails] = useState({
    bankCountry: '',
    bankName: '',
    bankAccountType: '',
    accountCurrency: '',
    accountNumber: '',
    accountName: '',
    swiftCode: '',
    bankIdentifierCode: ''
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchFinancialData = async () => {
      try {
        const sellerToken = localStorage.getItem('sellerToken');
        if (sellerToken) {
          const tokenData = JSON.parse(sellerToken);
          const token = tokenData.data;

          // Fetch withdrawals
          const withdrawalsResponse = await fetch(`${BASE_URL}/seller/withdrawals`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          const withdrawalsData = await withdrawalsResponse.json();
          setWithdrawals(withdrawalsData);

          // Calculate totalRevenue and amountOnHold
          const totalRevenue = withdrawalsData
            .filter(w => w.status === 'completed')
            .reduce((sum, w) => sum + w.amount, 0);
          const amountOnHold = withdrawalsData
            .filter(w => w.status === 'pending')
            .reduce((sum, w) => sum + w.amount, 0);

          // Fetch seller profile
          const profileResponse = await fetch(`${BASE_URL}/seller/profile`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          const profileData = await profileResponse.json();
          const availableForWithdrawal = profileData.walletBalance;

          // Set bank details
          setBankDetails(profileData.bankDetails);

          setFinancialData({
            totalRevenue,
            amountOnHold,
            availableForWithdrawal,
          });
        }
      } catch (error) {
        console.error('Error fetching financial data:', error);
      }
    };

    fetchFinancialData();
  }, []);

  useEffect(() => {
    // When bankDetails changes, update newBankDetails
    setNewBankDetails({
      bankCountry: bankDetails.bankCountry || '',
      bankName: bankDetails.bankName || '',
      bankAccountType: bankDetails.bankAccountType || '',
      accountCurrency: bankDetails.accountCurrency || '',
      accountNumber: bankDetails.accountNumber || '',
      accountName: bankDetails.accountName || '',
      swiftCode: bankDetails.swiftCode || '',
      bankIdentifierCode: bankDetails.bankIdentifierCode || ''
    });
  }, [bankDetails]);

  const handleWithdrawalRequest = async () => {
    if (withdrawalAmount < 1000) {
      setError('Minimum withdrawal amount is ₦1,000');
      return;
    }
    if (withdrawalAmount > financialData.availableForWithdrawal) {
      setError('Withdrawal amount exceeds available balance');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const sellerToken = localStorage.getItem('sellerToken');
      if (sellerToken) {
        const tokenData = JSON.parse(sellerToken);
        const token = tokenData.data;

        const response = await fetch(`${BASE_URL}/seller/withdrawals`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            amount: withdrawalAmount,
            bankDetails
          })
        });

        const result = await response.json();
        if (response.ok) {
          setWithdrawals([...withdrawals, result.withdrawal]);
          setWithdrawalAmount(0);
          setLoading(false);
          document.querySelector('[data-state="open"]').click(); // Close withdrawal modal
          document.getElementById('withdrawalSuccessDialog').click(); // Open success dialog
        } else {
          setError('Error: ' + result.message);
        }
      }
    } catch (error) {
      console.error('Error creating withdrawal request:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewReceipt = (withdrawal) => {
    if (withdrawal.status === 'completed') {
      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.text('Auqli Receipt', 14, 22);
      doc.setFontSize(12);
      doc.text(`Reference: ${withdrawal.reference}`, 14, 30);
      doc.text(`Amount: ${formatCurrency(withdrawal.amount)}`, 14, 38);
      doc.text(`Bank: ${withdrawal.bankDetails.bankName}`, 14, 46);
      doc.text(`Account Number: ${withdrawal.bankDetails.accountNumber}`, 14, 54);
      doc.text(`Account Name: ${withdrawal.bankDetails.accountName}`, 14, 62);
      doc.text(`Date: ${new Date(withdrawal.requestDate).toLocaleDateString()}`, 14, 70);
      doc.save(`receipt_${withdrawal.reference}.pdf`);
    } else {
      alert('Receipt is only available for completed withdrawals.');
    }
  };

  const handleUpdateBankDetails = async () => {
    setUpdatingBank(true);
    try {
      const sellerToken = localStorage.getItem('sellerToken');
      if (sellerToken) {
        const tokenData = JSON.parse(sellerToken);
        const token = tokenData.data;

        const response = await fetch(`${BASE_URL}/seller/profile/bank-details`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            bankDetails: newBankDetails
          })
        });

        if (response.ok) {
          setBankDetails(newBankDetails);
          // Show success dialog
          document.querySelector('[data-state="open"]').click(); // Close update modal
          document.getElementById('successDialog').click(); // Open success dialog
        } else {
          throw new Error('Failed to update bank details');
        }
      }
    } catch (error) {
      console.error('Error updating bank details:', error);
      // Show error dialog
      document.getElementById('errorDialog').click();
    } finally {
      setUpdatingBank(false);
    }
  };

  return (
    <>
      <Header 
        isSidebarOpen={isSidebarOpen} 
        setIsSidebarOpen={setIsSidebarOpen} 
        name="Earnings & Payouts" 
      />
      <div className="min-h-screen bg-gray-50/30">
        <div className="container mx-auto px-4 py-6 space-y-4">
          {/* Financial Cards - Updated for better mobile responsiveness */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="p-4 bg-white shadow-sm hover:shadow-md transition-all duration-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-blue-50">
                  <Wallet className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-sm font-medium text-gray-600">Total Withdrawal</h3>
              </div>
              <p className="text-2xl font-semibold text-gray-800">
                {formatCurrency(financialData.totalRevenue)}
              </p>
              <p className="text-xs text-gray-500 mt-1">+2.5% from last month</p>
            </Card>

            <Card className="p-4 bg-white shadow-sm hover:shadow-md transition-all duration-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-yellow-50">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <h3 className="text-sm font-medium text-gray-600">Amount On Hold</h3>
              </div>
              <p className="text-2xl font-semibold text-gray-800">
                {formatCurrency(financialData.amountOnHold)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Pending clearance</p>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-gray-800 to-gray-900 text-white shadow-sm hover:shadow-md transition-all duration-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-white/10">
                  <BanknoteIcon className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-sm font-medium">Available For Withdrawal</h3>
              </div>
              <p className="text-2xl font-semibold">
                {formatCurrency(financialData.availableForWithdrawal)}
              </p>
              <p className="text-xs text-gray-300 mt-1">Ready to withdraw</p>
            </Card>
          </div>

          {/* Withdrawal Method - Updated for mobile */}
          <Card className="p-4 bg-white shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-50">
                  <CreditCard className="h-5 w-5 text-green-600" />
                </div>
                <h3 className="font-medium text-gray-800">Withdrawal Method</h3>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="border-2 w-full sm:w-auto">
                    Update Bank Information
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-xl p-6 w-[95%] max-h-[90vh] overflow-y-auto">
                  <DialogTitle className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">Update Bank Details</DialogTitle>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bank Country</label>
                        <input
                          type="text"
                          value={newBankDetails.bankCountry}
                          onChange={(e) => setNewBankDetails({ ...newBankDetails, bankCountry: e.target.value })}
                          className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                        <input
                          type="text"
                          value={newBankDetails.bankName}
                          onChange={(e) => setNewBankDetails({ ...newBankDetails, bankName: e.target.value })}
                          className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
                        <input
                          type="text"
                          value={newBankDetails.bankAccountType}
                          onChange={(e) => setNewBankDetails({ ...newBankDetails, bankAccountType: e.target.value })}
                          className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                        <input
                          type="text"
                          value={newBankDetails.accountCurrency}
                          onChange={(e) => setNewBankDetails({ ...newBankDetails, accountCurrency: e.target.value })}
                          className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                        <input
                          type="text"
                          value={newBankDetails.accountNumber}
                          onChange={(e) => setNewBankDetails({ ...newBankDetails, accountNumber: e.target.value })}
                          className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
                        <input
                          type="text"
                          value={newBankDetails.accountName}
                          onChange={(e) => setNewBankDetails({ ...newBankDetails, accountName: e.target.value })}
                          className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Swift Code</label>
                        <input
                          type="text"
                          value={newBankDetails.swiftCode}
                          onChange={(e) => setNewBankDetails({ ...newBankDetails, swiftCode: e.target.value })}
                          className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bank Identifier Code</label>
                        <input
                          type="text"
                          value={newBankDetails.bankIdentifierCode}
                          onChange={(e) => setNewBankDetails({ ...newBankDetails, bankIdentifierCode: e.target.value })}
                          className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter className="mt-6 flex flex-col sm:flex-row gap-2">
                    <Button 
                      onClick={handleUpdateBankDetails}
                      className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
                      disabled={updatingBank}
                    >
                      {updatingBank ? 'Updating...' : 'Update Bank Details'}
                    </Button>
                    <DialogClose asChild>
                      <Button variant="outline" className="border-2 w-full sm:w-auto">Cancel</Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <Building2 className="h-5 w-5 text-gray-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Bank Name</p>
                  <p className="font-medium">{bankDetails.bankName}</p>
                </div>
              </div>
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <span className="h-5 w-5 flex items-center justify-center text-gray-500 mr-3">#</span>
                <div>
                  <p className="text-sm text-gray-500">Account Number</p>
                  <p className="font-medium">{bankDetails.accountNumber}</p>
                </div>
              </div>
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <span className="h-5 w-5 flex items-center justify-center text-gray-500 mr-3">@</span>
                <div>
                  <p className="text-sm text-gray-500">Account Name</p>
                  <p className="font-medium">{bankDetails.accountName}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Withdrawal History - Updated for mobile */}
          <Card className="p-4 bg-white shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-50">
                  <Receipt className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Withdrawal History</h3>
                  <p className="text-sm text-gray-500">Track all your withdrawal transactions</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                <Select defaultValue="30" className="w-full sm:w-[130px]">
                  <SelectTrigger className="w-[130px] text-sm">
                    <SelectValue placeholder="Time period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" className="border shadow-sm w-full sm:w-auto">
                  <Calendar className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>
            </div>

            {/* Table with horizontal scroll for mobile */}
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="min-w-[800px] sm:min-w-full p-4 sm:p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold text-gray-600">Date</TableHead>
                      <TableHead className="font-semibold text-gray-600">Transaction Type</TableHead>
                      <TableHead className="font-semibold text-gray-600">Amount</TableHead>
                      <TableHead className="font-semibold text-gray-600">Account</TableHead>
                      <TableHead className="font-semibold text-gray-600">Status</TableHead>
                      <TableHead className="font-semibold text-gray-600">Time</TableHead>
                      <TableHead className="font-semibold text-gray-600">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {withdrawals.map((withdrawal) => (
                      <TableRow key={withdrawal._id} className="hover:bg-gray-50">
                        <TableCell>{new Date(withdrawal.requestDate).toLocaleDateString()}</TableCell>
                        <TableCell>Bank Withdrawal</TableCell>
                        <TableCell>{formatCurrency(withdrawal.amount)}</TableCell>
                        <TableCell className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full" />
                          {withdrawal.bankDetails.bankName}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                            withdrawal.status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : withdrawal.status === 'processing'
                              ? 'bg-blue-100 text-blue-700'
                              : withdrawal.status === 'rejected'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'
                          } font-medium`}>
                            {withdrawal.status}
                          </span>
                        </TableCell>
                        <TableCell>{new Date(withdrawal.requestDate).toLocaleTimeString()}</TableCell>
                        <TableCell>
                          {withdrawal.status === 'completed' && (
                            <Button
                              variant="secondary"
                              size="sm"
                              className="bg-[#0a0a29] text-white hover:bg-[#1a1a4a] flex items-center gap-2"
                              onClick={() => handleViewReceipt(withdrawal)}
                            >
                              <FileText className="h-4 w-4" />
                              Receipt
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Pagination - Made responsive */}
            <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
              <Select defaultValue="20" className="w-full sm:w-[180px]">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Rows per page" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 PER PAGE</SelectItem>
                  <SelectItem value="20">20 PER PAGE</SelectItem>
                  <SelectItem value="30">30 PER PAGE</SelectItem>
                  <SelectItem value="40">40 PER PAGE</SelectItem>
                  <SelectItem value="50">50 PER PAGE</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button variant="outline" className="flex-1 sm:flex-none flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button variant="outline" className="flex-1 sm:flex-none flex items-center gap-2">
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>

          {/* Success Dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <button id="successDialog" className="hidden">Success</button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogTitle className="text-green-600">Success!</DialogTitle>
              <DialogDescription className="py-4">
                Your bank details have been successfully updated.
              </DialogDescription>
              <DialogFooter>
                <DialogClose asChild>
                  <Button className="bg-green-600 hover:bg-green-700 text-white">
                    Close
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Error Dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <button id="errorDialog" className="hidden">Error</button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogTitle className="text-red-600">Error</DialogTitle>
              <DialogDescription className="py-4">
                Failed to update bank details. Please try again.
              </DialogDescription>
              <DialogFooter>
                <DialogClose asChild>
                  <Button className="bg-red-600 hover:bg-red-700 text-white">
                    Close
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Withdrawal Success Dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <button id="withdrawalSuccessDialog" className="hidden">Withdrawal Success</button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogTitle className="text-green-600">Success!</DialogTitle>
              <DialogDescription className="py-4">
                Your withdrawal request has been created successfully.
              </DialogDescription>
              <DialogFooter>
                <DialogClose asChild>
                  <Button className="bg-green-600 hover:bg-green-700 text-white">
                    Close
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </>
  )
}
