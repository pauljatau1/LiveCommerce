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
      const receiptContent = `
        <h1>Auqli Receipt</h1>
        <p>Reference: ${withdrawal.reference}</p>
        <p>Amount: ${formatCurrency(withdrawal.amount)}</p>
        <p>Bank: ${withdrawal.bankDetails.bankName}</p>
        <p>Account Number: ${withdrawal.bankDetails.accountNumber}</p>
        <p>Account Name: ${withdrawal.bankDetails.accountName}</p>
        <p>Date: ${new Date(withdrawal.requestDate).toLocaleDateString()}</p>
      `;
      const newWindow = window.open('', '_blank');
      newWindow.document.write(receiptContent);
      newWindow.document.close();
    } else {
      alert('Receipt is only available for completed withdrawals.');
    }
  };

  return (
    <>
    {/* <Header title="Earnings & Payouts" /> */}
    <div className="container mx-auto px-4 py-8 space-y-8">
      <Toaster />
      <div className="flex flex-col md:flex-row justify-between items-center mb-8">
        <h1 className='text-3xl font-bold mb-4 md:mb-0'>Earnings & Payouts</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2">
              <ArrowDownToLine className="h-5 w-5" />
              Withdraw Funds
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>Withdraw Funds</DialogTitle>
            <DialogDescription>
              Enter the amount you wish to withdraw and confirm your bank details.
            </DialogDescription>
            <div className="space-y-4">
              {error && <p className="text-red-500">{error}</p>}
              <input
                type="number"
                value={withdrawalAmount}
                onChange={(e) => setWithdrawalAmount(Number(e.target.value))}
                placeholder="Enter amount"
                className="w-full p-2 border rounded"
              />
              <div>
                <label className="block text-sm font-medium">Bank Name</label>
                <input
                  type="text"
                  value={bankDetails.bankName}
                  onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Account Number</label>
                <input
                  type="text"
                  value={bankDetails.accountNumber}
                  onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Account Name</label>
                <input
                  type="text"
                  value={bankDetails.accountName}
                  onChange={(e) => setBankDetails({ ...bankDetails, accountName: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleWithdrawalRequest} className="bg-green-600 hover:bg-green-700 text-white" disabled={loading}>
                {loading ? 'Processing...' : 'Submit'}
              </Button>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Financial Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-gradient-to-br from-[#0a0a29] to-[#1a1a4a] text-white -lg hover:-xl transition-all">
          <div className="flex items-center gap-3 mb-3">
            <Wallet className="h-6 w-6" />
            <h3 className="text-sm font-medium">Total Revenue</h3>
          </div>
          <p className="text-3xl font-bold mb-4">
            {formatCurrency(financialData.totalRevenue)}
          </p>
          <Button variant="secondary" size="sm" className="w-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm">
            <FileText className="h-4 w-4 mr-2" />
            View Transactions
          </Button>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-[#0a0a29] to-[#1a1a4a] text-white -lg hover:-xl transition-all">
          <div className="flex items-center gap-3 mb-3">
            <Clock className="h-6 w-6" />
            <h3 className="text-sm font-medium">Amount On Hold</h3>
          </div>
          <p className="text-3xl font-bold mb-4">
            {formatCurrency(financialData.amountOnHold)}
          </p>
          <Button variant="secondary" size="sm" className="w-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm">
            <FileText className="h-4 w-4 mr-2" />
            View Details
          </Button>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-[#0a0a29] to-[#1a1a4a] text-white -lg hover:-xl transition-all">
          <div className="flex items-center gap-3 mb-3">
            <BanknoteIcon className="h-6 w-6" />
            <h3 className="text-sm font-medium">Available For Withdrawal</h3>
          </div>
          <p className="text-3xl font-bold mb-4">
            {formatCurrency(financialData.availableForWithdrawal)}
          </p>
          <Button variant="secondary" size="sm" className="w-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm">
            <FileText className="h-4 w-4 mr-2" />
            View History
          </Button>
        </Card>
      </div>

      {/* Withdrawal Method */}
      <Card className="p-6 bg-gradient-to-r from-[#f0f9f0] to-[#e8f5e8] -md hover:-lg transition-all">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <CreditCard className="h-6 w-6 text-green-600" />
            <h3 className="font-medium">Withdrawal Method</h3>
          </div>
          <div className="flex items-center gap-3">
            <Building2 className="h-6 w-6 text-green-600" />
            <span className="font-medium">Bank: {bankDetails.bankName}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-medium">Account No: {bankDetails.accountNumber}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-medium">Account Name: {bankDetails.accountName}</span>
          </div>
        </div>
       
      </Card>
      <div className="flex justify-end mt-6">
          <Button variant="default" className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2">
            Bank Settings
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>

      {/* Income Information */}
      <Card className="p-6 bg-gradient-to-r from-[#f8f9f8] to-[#f0f1f0] -md hover:-lg transition-all">
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
      <Card className="p-6 -md hover:-lg transition-all">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Receipt className="h-6 w-6 text-gray-600" />
            Withdrawal History
          </h3>
          <Button variant="outline" className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Month to date
          </Button>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Date</TableHead>
                <TableHead>Transaction Type</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {withdrawals.map((withdrawal) => (
                <TableRow key={withdrawal._id} className="hover:bg-gray-50">
                  <TableCell>{new Date(withdrawal.requestDate).toLocaleDateString()}</TableCell>
                  <TableCell>Bank Withdrawal</TableCell>
                  <TableCell className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full" />
                    {withdrawal.bankDetails.bankName}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${withdrawal.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'} font-medium`}>
                      {withdrawal.status}
                    </span>
                  </TableCell>
                  <TableCell>{new Date(withdrawal.requestDate).toLocaleTimeString()}</TableCell>
                  <TableCell>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="bg-[#0a0a29] text-white hover:bg-[#1a1a4a] flex items-center gap-2"
                      onClick={() => handleViewReceipt(withdrawal)}
                    >
                      <FileText className="h-4 w-4" />
                      Receipt
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
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
    </>
  )
}
