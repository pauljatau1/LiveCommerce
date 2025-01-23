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
          alert(result.message);
          setWithdrawals([...withdrawals, result.withdrawal]);
          setWithdrawalAmount(0);
          setLoading(false);
          document.querySelector('[data-state="open"]').click(); // Close modal
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

  return (
    <div className="min-h-screen ">
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <h1 className="text-3xl font-bold mb-4 md:mb-0 text-gray-800">Earnings & Payouts</h1>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 -lg transition-all duration-200 ease-in-out">
                <ArrowDownToLine className="h-5 w-5" />
                Withdraw Funds
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl p-6">
              <DialogTitle className="text-2xl font-bold text-gray-800 mb-4">Withdraw Funds</DialogTitle>
              <DialogDescription className="text-gray-600 mb-6">
                Enter the amount you wish to withdraw and confirm your bank details.
              </DialogDescription>
              <div className="space-y-5">
                {error && <p className="text-red-500 bg-red-50 p-3 rounded-lg text-sm">{error}</p>}
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₦</span>
                  <input
                    type="number"
                    value={withdrawalAmount}
                    onChange={(e) => setWithdrawalAmount(Number(e.target.value))}
                    placeholder="Enter amount"
                    className="w-full p-3 pl-8 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  />
                </div>

                {/* Bank Details Fields */}
                <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={bankDetails.bankName}
                      onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                    <input
                      type="text"
                      value={bankDetails.accountNumber}
                      onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
                    <input
                      type="text"
                      value={bankDetails.accountName}
                      onChange={(e) => setBankDetails({ ...bankDetails, accountName: e.target.value })}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button onClick={handleWithdrawalRequest}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg -lg transition-all duration-200"
                  disabled={loading}>
                  {loading ? 'Processing...' : 'Submit'}
                </Button>
                <DialogClose asChild>
                  <Button variant="outline" className="border-2">Cancel</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Financial Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 bg-white -lg rounded-xl hover:-xl transition-all duration-200">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-full bg-blue-50">
                <Wallet className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-sm font-medium text-gray-600">Total Withdrawal</h3>
            </div>
            <p className="text-3xl font-semibold mb-4 text-gray-800">
              {formatCurrency(financialData.totalRevenue)}
            </p>
            {/* <Button variant="outline" size="sm" className="w-full border-2 hover:bg-gray-50">
              <FileText className="h-4 w-4 mr-2" />
              View Transactions
            </Button> */}
          </Card>

          <Card className="p-6 bg-white -lg rounded-xl hover:-xl transition-all duration-200">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-full bg-yellow-50">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="text-sm font-medium text-gray-600">Amount On Hold</h3>
            </div>
            <p className="text-3xl font-semibold mb-4 text-gray-800">
              {formatCurrency(financialData.amountOnHold)}
            </p>
            {/* <Button variant="outline" size="sm" className="w-full border-2 hover:bg-gray-50">
              <FileText className="h-4 w-4 mr-2" />
              View Details
            </Button> */}
          </Card>

          <Card className="p-6 bg-gray-800 -lg rounded-xl hover:-xl transition-all duration-200">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-full bg-green-50">
                <BanknoteIcon className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-sm font-medium text-white">Available For Withdrawal</h3>
            </div>
            <p className="text-3xl font-semibold mb-4 text-white">
              {formatCurrency(financialData.availableForWithdrawal)}
            </p>
            {/* <Button variant="outline" size="sm" className="w-full border-2 hover:bg-gray-50">
              <FileText className="h-4 w-4 mr-2" />
              View History
            </Button> */}
          </Card>
        </div>

        {/* Withdrawal Method */}
        <Card className="p-6 bg-white -lg rounded-xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-50">
                <CreditCard className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-medium text-gray-800">Withdrawal Method</h3>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-gray-50">
                <Building2 className="h-6 w-6 text-gray-600" />
              </div>
              <span className="font-medium text-gray-700">Bank: {bankDetails.bankName}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-gray-50">
                <span className="font-medium text-gray-700">Account No: {bankDetails.accountNumber}</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-gray-50">
                <span className="font-medium text-gray-700">Account Name: {bankDetails.accountName}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Income Information */}
        <Card className="p-6 bg-white -lg rounded-xl">
          <div className="flex items-start gap-4">
            <Info className="h-6 w-6 text-blue-600 mt-1" />
            <div>
              <h3 className="font-medium text-lg mb-2">Income Information</h3>
              <p className="text-gray-600 leading-relaxed">
                For more details on your income including fees, deductions or any dispute,
                please visit our help center for information, contact our support or
                reach out to your account manager.
              </p>
            </div>
          </div>
        </Card>

        {/* Withdrawal History */}
        <Card className="p-6 bg-white -lg rounded-xl">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <h3 className="text-xl font-bold flex items-center gap-3 text-gray-800">
              <div className="p-2 rounded-lg bg-purple-50">
                <Receipt className="h-6 w-6 text-purple-600" />
              </div>
              Withdrawal History
            </h3>
            <Button variant="outline" className="flex items-center gap-2 border-2">
              <Calendar className="h-5 w-5" />
              Month to date
            </Button>
          </div>

          {/* Table styling */}
          <div className="overflow-x-auto rounded-lg border">
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

          {/* Pagination controls with improved styling */}
          <div className="flex flex-col md:flex-row justify-between items-center mt-6 gap-4">
            <Select defaultValue="20">
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
            <div className="flex gap-2">
              <Button variant="outline" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
