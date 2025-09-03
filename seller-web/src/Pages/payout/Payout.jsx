import { useState, useEffect } from 'react';
import { Building2, CreditCard, Info, ArrowRight, ArrowLeft, Receipt, Calendar, ArrowDownToLine, Wallet, BanknoteIcon, Clock, FileText, ArrowUpDown, CircleDollarSign, ArrowDownUp, ArrowUpRight } from 'lucide-react'
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
import { BASE_URL, BASE_URL_V2 } from "@/Constants/Server";
import { useOutletContext, Link } from 'react-router-dom';
import jsPDF from 'jspdf';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Components/ui/tabs"
import { formatCurrency } from "@/Utilities/currencyFormater";



export default function Payout() {
  const { setHeaderName, setNavName } = useOutletContext()
  const [withdrawals, setWithdrawals] = useState([]);
  const [financialData, setFinancialData] = useState({
    totalRevenue: 0,
    amountOnHold: 0,
    availableForWithdrawal: 0,
  });
  const [bankDetails, setBankDetails] = useState({
    bankName: '',
    accountNumber: '',
    accountName: '',
    bankIdentifierCode: ''
  });
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [transactionSummary, setTransactionSummary] = useState({
    totalEarnings: 0,
    totalPlatformFees: 0,
    totalWithdrawals: 0,
    currentBalance: 0
  });
  const [transactionPagination, setTransactionPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalTransactions: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("withdrawals");

  useEffect(() => {
    setHeaderName('Earnings & Payouts')
    setNavName('')
  }, [])

  useEffect(() => {
    const fetchFinancialData = async () => {
      setIsLoading(true);
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
          setWithdrawals(withdrawalsData || []); // Ensure array even if null/undefined

          // Calculate totalRevenue and amountOnHold
          const totalRevenue = (withdrawalsData || [])
            .filter(w => w.status === 'completed')
            .reduce((sum, w) => sum + w.amount, 0);
          const amountOnHold = (withdrawalsData || [])
            .filter(w => w.status === 'pending')
            .reduce((sum, w) => sum + w.amount, 0);

          // Fetch seller profile
          const profileResponse = await fetch(`${BASE_URL_V2}/sellers/profile`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          const profileData = await profileResponse.json();
          const availableForWithdrawal = profileData?.data?.walletBalance || 0;

          // Set bank details with default values
          setBankDetails({
            bankName: profileData?.data?.bankDetails?.bankName || '',
            accountNumber: profileData?.data?.bankDetails?.accountNumber || '',
            accountName: profileData?.data?.bankDetails?.accountName || '',
            bankIdentifierCode: profileData?.data?.bankDetails?.bankIdentifierCode || ''
          });

          setFinancialData({
            totalRevenue,
            amountOnHold,
            availableForWithdrawal,
          });
        }
      } catch (error) {
        console.error('Error fetching financial data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFinancialData();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const sellerToken = localStorage.getItem('sellerToken');
        if (sellerToken) {
          const tokenData = JSON.parse(sellerToken);
          const token = tokenData.data;

          // Fetch transactions
          const transactionsResponse = await fetch(`${BASE_URL}/seller/transactions?page=1&limit=10`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          const transactionsData = await transactionsResponse.json();
          setTransactions(transactionsData.transactions);
          setTransactionSummary(transactionsData.summary);
          setTransactionPagination(transactionsData.pagination);
        }
      } catch (error) {
        console.error('Error fetching transactions:', error);
      }
    };

    fetchData();
  }, []);

  const handleWithdrawalRequest = async () => {
    // Check if bank details are missing
    if (!bankDetails.bankName || !bankDetails.accountNumber || !bankDetails.accountName) {
      setError('Please add your bank account information in Settings before requesting a withdrawal.');
      return;
    }

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
            bankDetails: {
              bankName: bankDetails.bankName,
              accountNumber: bankDetails.accountNumber,
              accountName: bankDetails.accountName,
              bankIdentifierCode: bankDetails.bankIdentifierCode
            }
          })
        });

        const result = await response.json();
        if (response.ok) {
          setWithdrawals([...withdrawals, result.withdrawal]);
          setWithdrawalAmount(0);
          setLoading(false);
          
          // Track withdrawal request with Customer.io
          try {
            const seller = JSON.parse(localStorage.getItem('seller')) || {};
            
            if (window.cioanalytics) {
              // First re-identify the user to ensure the connection is active
              window.cioanalytics.identify(seller._id, {
                seller_id: seller._id,
                email: seller.email,
                first_name: seller.firstName,
                last_name: seller.lastName
              });
              
              // Track withdrawal request after a small delay
              setTimeout(async () => {
                // Get IP address if possible
                let ipAddress = 'unknown';
                try {
                  const ipResponse = await fetch('https://api.ipify.org?format=json');
                  if (ipResponse.ok) {
                    const ipData = await ipResponse.json();
                    ipAddress = ipData.ip;
                  }
                } catch (ipError) {
                  console.error('Failed to get IP address:', ipError);
                }
                
                window.cioanalytics.track('withdrawal_requested', {
                  seller_id: seller._id,
                  amount: withdrawalAmount,
                  payout_method: 'bank_transfer',
                  bank_name: bankDetails.bankName,
                  account_name: bankDetails.accountName,
                  account_number_last4: bankDetails.accountNumber.slice(-4),
                  store_name: seller.storeName,
                  ip_address: ipAddress,
                  withdrawal_id: result.withdrawal._id,
                  withdrawal_reference: result.withdrawal.reference
                });
              }, 500);
            }
          } catch (trackingError) {
            console.error('Failed to track withdrawal request:', trackingError);
          }
          
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

  const getTransactionStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'failed':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getTransactionTypeIcon = (type) => {
    switch (type) {
      case 'order_payment':
        return <ArrowUpRight className="h-4 w-4 text-green-600" />;
      case 'platform_fee':
        return <Building2 className="h-4 w-4 text-orange-600" />;
      case 'processing_fee':
        return <CreditCard className="h-4 w-4 text-red-600" />;
      case 'withdrawal':
        return <ArrowDownToLine className="h-4 w-4 text-blue-600" />;
      default:
        return <CircleDollarSign className="h-4 w-4" />;
    }
  };

  const getTransactionColor = (type, netAmount) => {
    if (type === 'order_payment') return 'text-green-600';
    if (netAmount < 0) return 'text-red-600';
    return 'text-gray-900';
  };

  const getTransactionLabel = (type) => {
    switch (type) {
      case 'order_payment':
        return 'Sale';
      case 'platform_fee':
        return 'Platform Fee';
      case 'processing_fee':
        return 'Processing Fee';
      case 'withdrawal':
        return 'Withdrawal';
      default:
        return type.replace(/_/g, ' ');
    }
  };

  // Add empty state components
  const EmptyTransactions = () => (
    <div className="text-center py-8 sm:py-12">
      <FileText className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
      <h3 className="text-base sm:text-lg font-medium text-gray-900">No transactions yet</h3>
      <p className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2 max-w-xs mx-auto">Your transactions will appear here once you start making sales.</p>
    </div>
  );

  const EmptyWithdrawals = () => (
    <div className="text-center py-8 sm:py-12">
      <ArrowDownToLine className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
      <h3 className="text-base sm:text-lg font-medium text-gray-900">No withdrawals yet</h3>
      <p className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2 max-w-xs mx-auto">Your withdrawal history will appear here once you make your first withdrawal.</p>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50/30 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-sm sm:text-base">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50/30">
        <div className="container mx-auto sm:px-4 py-4 sm:py-6 space-y-4">
          {/* Financial Cards */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            
            {/* Available Balance Card - Now first and full-width on smaller screens */}
            <Card className="relative p-5 sm:p-6 overflow-hidden rounded-xl border border-green-200 col-span-1  order-first">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500 via-green-600 to-green-700"></div>
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxwYXR0ZXJuIGlkPSJwYXR0ZXJuIiB4PSIwIiB5PSIwIiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHBhdHRlcm5UcmFuc2Zvcm09InJvdGF0ZSgxMCkiPjxjaXJjbGUgY3g9IjEwIiBjeT0iMTAiIHI9IjEuNSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNwYXR0ZXJuKSIvPjwvc3ZnPg==')]"></div>
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-white/10 to-transparent rounded-tl-full"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 rounded-full bg-white/15 backdrop-blur-sm">
                    <Wallet className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-100">Available Balance</p>
                    <h3 className="text-xl sm:text-3xl font-bold text-white">
                      {formatCurrency(transactionSummary.currentBalance)}
                    </h3>
                  </div>
                </div>
                <div className="flex items-center text-sm text-green-100 mb-4 space-x-1">
                  <ArrowUpRight className="h-4 w-4" />
                  <span>Available for immediate withdrawal</span>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="w-full mt-1 bg-white hover:bg-gray-50 text-green-700 font-semibold border-0 text-sm py-2.5 rounded-lg">
                      <ArrowDownToLine className="h-4 w-4 mr-2" />
                      Process Withdrawal
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-[95%] sm:max-w-md rounded-xl border border-gray-200">
                    <DialogTitle className="text-base sm:text-lg">Create Withdrawal Request</DialogTitle>
                    <DialogDescription className="py-3 sm:py-4">
                      <div className="space-y-3 sm:space-y-4">
                        <div className="p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-100">
                          <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Current Bank Details</h4>
                          
                          {!bankDetails.bankName || !bankDetails.accountNumber || !bankDetails.accountName ? (
                            <div className="space-y-2">
                              <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                                <div className="flex items-start gap-2">
                                  <Info className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <p className="text-xs sm:text-sm text-yellow-700 font-medium">Bank details not completed</p>
                                    <p className="text-xs text-yellow-600 mt-1">
                                      You need to add your bank account information before you can make a withdrawal.
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                className="mt-1 sm:mt-2 w-full text-green-600 text-xs sm:text-sm border-green-200 hover:bg-green-50"
                                onClick={() => {
                                  document.querySelector('[data-state="open"]').click(); // Close withdrawal modal
                                  window.location.href = "/dashboard/settings?tab=payment";
                                }}
                              >
                                <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                Add Bank Details
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-1 sm:space-y-2">
                              <div className="flex justify-between text-xs sm:text-sm">
                                <span className="text-gray-600">Bank:</span>
                                <span className="font-medium">{bankDetails.bankName}</span>
                              </div>
                              <div className="flex justify-between text-xs sm:text-sm">
                                <span className="text-gray-600">Account:</span>
                                <span className="font-medium">{bankDetails.accountNumber}</span>
                              </div>
                              <div className="flex justify-between text-xs sm:text-sm">
                                <span className="text-gray-600">Name:</span>
                                <span className="font-medium">{bankDetails.accountName}</span>
                              </div>
                              <Button
                                variant="link"
                                className="mt-1 sm:mt-2 h-auto p-0 text-green-600 text-xs sm:text-sm"
                                onClick={() => {
                                  document.querySelector('[data-state="open"]').click(); // Close withdrawal modal
                                  window.location.href = "/dashboard/settings?tab=payment";
                                }}
                              >
                                Change Bank Details
                              </Button>
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                            Available Balance: {formatCurrency(financialData.availableForWithdrawal)}
                          </label>
                          <input
                            type="number"
                            value={withdrawalAmount || ''}
                            onChange={(e) => setWithdrawalAmount(Number(e.target.value))}
                            className="w-full p-2 sm:p-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-sm"
                            placeholder="Enter amount"
                            min="1000"
                            max={financialData.availableForWithdrawal}
                          />
                        </div>
                        {error && (
                          <p className="text-red-500 text-xs sm:text-sm">{error}</p>
                        )}
                        <div className="text-xs sm:text-sm text-gray-500 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                          <Info className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1 text-yellow-600" />
                          Minimum withdrawal amount is ₦1,000
                        </div>
                      </div>
                    </DialogDescription>
                    <DialogFooter className="flex-col space-y-2 sm:space-y-0 sm:flex-row sm:justify-end">
                      <Button
                        onClick={handleWithdrawalRequest}
                        disabled={loading || !withdrawalAmount || !bankDetails.bankName || !bankDetails.accountNumber || !bankDetails.accountName}
                        className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto text-sm rounded-lg"
                      >
                        {loading ? 'Processing...' : 'Withdraw'}
                      </Button>
                      <DialogClose asChild>
                        <Button variant="outline" className="w-full sm:w-auto text-sm rounded-lg">Cancel</Button>
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </Card>

            <Card className="relative p-5 sm:p-6 bg-white rounded-xl border border-gray-100 col-span-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-full bg-gradient-to-br from-amber-50 to-amber-100">
                  <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-500">Pending Payouts</p>
                  <h3 className="text-lg sm:text-2xl font-bold text-gray-900">
                    {formatCurrency(financialData.amountOnHold)}
                  </h3>
                </div>
              </div>
              <div className="flex items-center text-xs sm:text-sm text-gray-600 space-x-1">
                <BanknoteIcon className="h-3 w-3 sm:h-4 sm:w-4 text-amber-500" />
                <span className="text-amber-600 font-medium">
                  {withdrawals.filter(w => w.status === 'pending').length} pending requests
                </span>
              </div>
              <div className="absolute top-0 right-0 h-20 w-20 bg-gradient-to-bl from-amber-50 to-transparent opacity-40 rounded-bl-full"></div>
            </Card>

            <Card className="relative p-5 sm:p-6 bg-white rounded-xl border border-gray-100 col-span-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-full bg-gradient-to-br from-purple-50 to-purple-100">
                  <ArrowDownToLine className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-500">Total Withdrawals</p>
                  <h3 className="text-lg sm:text-2xl font-bold text-gray-900">
                    {formatCurrency(transactionSummary.totalWithdrawals)}
                  </h3>
                </div>
              </div>
              <div className="flex items-center text-xs sm:text-sm text-gray-600 space-x-1">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500" />
                <span className="text-purple-600 font-medium">Processed withdrawals</span>
              </div>
              <div className="absolute top-0 right-0 h-20 w-20 bg-gradient-to-bl from-purple-50 to-transparent opacity-40 rounded-bl-full"></div>
            </Card>
          </div>

          {/* Withdrawal Method - Updated for mobile */}
          <Card className="p-5 bg-white rounded-xl border border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-50">
                  <CreditCard className="h-5 w-5 text-green-600" />
                </div>
                <h3 className="font-medium text-gray-800">Withdrawal Method</h3>
              </div>
              <Link to="/dashboard/settings?tab=payment">
                <Button variant="outline" className="border-gray-200 hover:bg-gray-50 hover:border-gray-300 w-full sm:w-auto text-xs sm:text-sm py-1.5 sm:py-2 rounded-lg transition-all duration-200">
                  Go To Bank Settings
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-200 transition-all duration-200">
                <Building2 className="h-5 w-5 text-gray-500 mr-3" />
                <div>
                  <p className="text-xs sm:text-sm text-gray-500">Bank Name</p>
                  <p className="font-medium text-sm sm:text-base">{bankDetails.bankName}</p>
                </div>
              </div>
              <div className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-200 transition-all duration-200">
                <span className="h-5 w-5 flex items-center justify-center text-gray-500 mr-3">#</span>
                <div>
                  <p className="text-xs sm:text-sm text-gray-500">Account Number</p>
                  <p className="font-medium text-sm sm:text-base">{bankDetails.accountNumber}</p>
                </div>
              </div>
              <div className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-200 transition-all duration-200">
                <span className="h-5 w-5 flex items-center justify-center text-gray-500 mr-3">@</span>
                <div>
                  <p className="text-xs sm:text-sm text-gray-500">Account Name</p>
                  <p className="font-medium text-sm sm:text-base">{bankDetails.accountName}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Replace the Withdrawal History section with Tabs */}
          <Card className="p-4 bg-white shadow-sm">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-50">
                    <Receipt className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-800">Financial History</h3>
                    <p className="text-xs sm:text-sm text-gray-500">Track all your financial activities</p>
                  </div>
                </div>
                <TabsList className="grid w-full sm:w-[400px] grid-cols-2">
                  <TabsTrigger value="withdrawals" className="text-xs sm:text-sm">Withdrawals</TabsTrigger>
                  <TabsTrigger value="transactions" className="text-xs sm:text-sm">Transactions</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="transactions" className="mt-4">
                <div className="bg-white rounded-lg shadow-sm border">
                  <div className="p-4 border-b">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 sm:p-2.5 rounded-lg bg-blue-50">
                          <ArrowDownUp className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-base sm:text-lg font-semibold text-gray-800">Transaction History</h3>
                          <p className="text-xs sm:text-sm text-gray-500">View all your financial transactions</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Select defaultValue="all">
                          <SelectTrigger className="w-full sm:w-[180px] text-xs sm:text-sm">
                            <SelectValue placeholder="Filter by type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Transactions</SelectItem>
                            <SelectItem value="order_payment">Order Payments</SelectItem>
                            <SelectItem value="withdrawal">Withdrawals</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button variant="outline" className="gap-2 text-xs sm:text-sm w-full sm:w-auto">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                          Date Range
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Desktop Transaction Table */}
                  <div className="hidden sm:block overflow-x-auto">
                    {transactions && transactions.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50/60">
                            <TableHead className="font-semibold text-gray-600">Date & Time</TableHead>
                            <TableHead className="font-semibold text-gray-600">Type</TableHead>
                            <TableHead className="font-semibold text-gray-600">Order ID</TableHead>
                            <TableHead className="font-semibold text-gray-600">Details</TableHead>
                            <TableHead className="font-semibold text-gray-600 text-right">Amount</TableHead>
                            <TableHead className="font-semibold text-gray-600 text-right">Net Amount</TableHead>
                            <TableHead className="font-semibold text-gray-600">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {transactions.map((transaction) => (
                            <TableRow key={transaction._id} className="hover:bg-gray-50/50 group">
                              <TableCell className="whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-700">
                                  {new Date(transaction.createdAt).toLocaleDateString()}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {new Date(transaction.createdAt).toLocaleTimeString()}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className={`p-1.5 rounded-md ${
                                    transaction.type === 'order_payment' ? 'bg-green-50' :
                                    transaction.type === 'platform_fee' ? 'bg-orange-50' :
                                    transaction.type === 'processing_fee' ? 'bg-red-50' :
                                    'bg-gray-50'
                                  }`}>
                                    {getTransactionTypeIcon(transaction.type)}
                                  </div>
                                  <span className="font-medium">
                                    {getTransactionLabel(transaction.type)}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="font-medium text-gray-700">
                                  #{transaction.orderId}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="max-w-xs">
                                  <div className="font-medium text-gray-700 truncate">
                                    {transaction.description}
                                  </div>
                                  {transaction.orderDetails && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      {transaction.orderDetails.items.map((item, index) => (
                                        <div key={index} className="flex items-center gap-1">
                                          <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs">
                                            {item.quantity}x
                                          </span>
                                          <span className="truncate">{item.productName}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  {transaction.metadata && transaction.type === 'platform_fee' && (
                                    <div className="text-xs text-orange-600 mt-1">
                                      {transaction.metadata.categoryFee}% fee for {transaction.metadata.categoryName}
                                    </div>
                                  )}
                                  {transaction.metadata && transaction.type === 'processing_fee' && (
                                    <div className="text-xs text-red-600 mt-1">
                                      {transaction.metadata.processingFeePercent}% processing fee
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className={`font-medium ${getTransactionColor(transaction.type, transaction.amount)}`}>
                                  {formatCurrency(Math.abs(transaction.amount))}
                                </div>
                                {transaction.deductions > 0 && (
                                  <div className="text-xs text-red-600">
                                    -{formatCurrency(transaction.deductions)} fees
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className={`font-medium ${getTransactionColor(transaction.type, transaction.netAmount)}`}>
                                  {transaction.netAmount >= 0 ? '+' : '-'}{formatCurrency(Math.abs(transaction.netAmount))}
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className={`inline-flex items-center px-2.5 py-0.5 mb-[9px] rounded-full text-xs font-medium ${
                                  transaction.status === 'completed' ? 'bg-green-50 text-green-700' :
                                  transaction.status === 'pending' ? 'bg-yellow-50 text-yellow-700' :
                                  transaction.status === 'failed' ? 'bg-red-50 text-red-700' :
                                  'bg-gray-50 text-gray-700'
                                }`}>
                                  {transaction.status}
                                </span>
                                {transaction.breakdown && (
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button variant="ghost" size="sm" className="text-xs text-gray-500 border-[1px] border-solid border-gray-300 hover:text-gray-700">
                                        <Info className="h-3 w-3 mr-1" />
                                        View Breakdown
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogTitle>Transaction Breakdown</DialogTitle>
                                      <div className="space-y-2 py-4">
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">Gross Amount</span>
                                          <span className="font-medium">{formatCurrency(transaction.breakdown.grossAmount)}</span>
                                        </div>
                                        <div className="flex justify-between text-red-600">
                                          <span>Platform Fee</span>
                                          <span>-{formatCurrency(transaction.breakdown.platformFee)}</span>
                                        </div>
                                        <div className="flex justify-between text-red-600">
                                          <span>Processing Fee</span>
                                          <span>-{formatCurrency(transaction.breakdown.processingFee)}</span>
                                        </div>
                                        <div className="border-t pt-2 flex justify-between font-medium">
                                          <span>Net Amount</span>
                                          <span className="text-green-600">{formatCurrency(transaction.breakdown.netAmount)}</span>
                                        </div>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <EmptyTransactions />
                    )}
                  </div>
                  
                  {/* Mobile Transaction Cards */}
                  <div className="sm:hidden">
                    {transactions && transactions.length > 0 ? (
                      <div className="divide-y">
                        {transactions.map((transaction) => (
                          <div key={transaction._id} className="p-4 hover:bg-gray-50">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-2">
                                <div className={`p-1.5 rounded-md ${
                                  transaction.type === 'order_payment' ? 'bg-green-50' :
                                  transaction.type === 'platform_fee' ? 'bg-orange-50' :
                                  transaction.type === 'processing_fee' ? 'bg-red-50' :
                                  'bg-gray-50'
                                }`}>
                                  {getTransactionTypeIcon(transaction.type)}
                                </div>
                                <div>
                                  <span className="font-medium text-sm">
                                    {getTransactionLabel(transaction.type)}
                                  </span>
                                  <div className="text-xs text-gray-500">
                                    {new Date(transaction.createdAt).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                transaction.status === 'completed' ? 'bg-green-50 text-green-700' :
                                transaction.status === 'pending' ? 'bg-yellow-50 text-yellow-700' :
                                transaction.status === 'failed' ? 'bg-red-50 text-red-700' :
                                'bg-gray-50 text-gray-700'
                              }`}>
                                {transaction.status}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 mb-2 text-sm">
                              <div>
                                <p className="text-xs text-gray-500">Order ID</p>
                                <p className="font-medium">#{transaction.orderId}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Net Amount</p>
                                <p className={`font-medium ${getTransactionColor(transaction.type, transaction.netAmount)}`}>
                                  {transaction.netAmount >= 0 ? '+' : '-'}{formatCurrency(Math.abs(transaction.netAmount))}
                                </p>
                              </div>
                            </div>
                            
                            <div className="text-xs text-gray-600 mt-1">
                              {transaction.description}
                            </div>
                            
                            {transaction.breakdown && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className=" mt-2 py-2 px-3 border-[1px] border-solid border-gray-300 text-xs text-gray-500 hover:text-gray-700 justify-start">
                                    <Info className="h-3 w-3 mr-1" />
                                    View Breakdown
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="w-[90%] rounded-lg">
                                  <DialogTitle className="text-sm">Transaction Breakdown</DialogTitle>
                                  <div className="space-y-2 py-4">
                                    <div className="flex justify-between text-sm">
                                      <span className="text-gray-600">Gross Amount</span>
                                      <span className="font-medium">{formatCurrency(transaction.breakdown.grossAmount)}</span>
                                    </div>
                                    <div className="flex justify-between text-red-600 text-sm">
                                      <span>Platform Fee</span>
                                      <span>-{formatCurrency(transaction.breakdown.platformFee)}</span>
                                    </div>
                                    <div className="flex justify-between text-red-600 text-sm">
                                      <span>Processing Fee</span>
                                      <span>-{formatCurrency(transaction.breakdown.processingFee)}</span>
                                    </div>
                                    <div className="border-t pt-2 flex justify-between font-medium text-sm">
                                      <span>Net Amount</span>
                                      <span className="text-green-600">{formatCurrency(transaction.breakdown.netAmount)}</span>
                                    </div>
                                  </div>
                                  <Button size="sm" className="w-full mt-2 bg-gray-100 text-gray-700">Close</Button>
                                </DialogContent>
                              </Dialog>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4">
                        <EmptyTransactions />
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="withdrawals" className="mt-4">
                <div className="bg-white rounded-lg shadow-sm border">
                  <div className="p-4 border-b">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 sm:p-2.5 rounded-lg bg-green-50">
                          <ArrowDownToLine className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                        </div>
                        <div>
                          <h3 className="text-base sm:text-lg font-semibold text-gray-800">Withdrawal History</h3>
                          <p className="text-xs sm:text-sm text-gray-500">Track all your withdrawal requests</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Select defaultValue="all">
                          <SelectTrigger className="w-full sm:w-[180px] text-xs sm:text-sm">
                            <SelectValue placeholder="Filter by status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Withdrawals</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="failed">Failed</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button variant="outline" className="gap-2 text-xs sm:text-sm w-full sm:w-auto">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                          Date Range
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Desktop Withdrawals Table */}
                  <div className="hidden sm:block overflow-x-auto">
                    {withdrawals && withdrawals.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50/60">
                            <TableHead className="font-semibold text-gray-600">Date & Time</TableHead>
                            <TableHead className="font-semibold text-gray-600">Reference</TableHead>
                            <TableHead className="font-semibold text-gray-600">Amount</TableHead>
                            <TableHead className="font-semibold text-gray-600">Bank Details</TableHead>
                            <TableHead className="font-semibold text-gray-600">Status</TableHead>
                            <TableHead className="font-semibold text-gray-600">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {withdrawals.map((withdrawal) => (
                            <TableRow key={withdrawal._id} className="hover:bg-gray-50/50">
                              <TableCell className="whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-700">
                                  {new Date(withdrawal.requestDate).toLocaleDateString()}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {new Date(withdrawal.requestDate).toLocaleTimeString()}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="font-medium text-gray-700">{withdrawal.reference}</div>
                              </TableCell>
                              <TableCell>
                                <div className="font-medium text-green-600">{formatCurrency(withdrawal.amount)}</div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="p-1.5 rounded-md bg-gray-50">
                                    <Building2 className="h-4 w-4 text-gray-600" />
                                  </div>
                                  <div>
                                    <div className="font-medium text-gray-700">
                                      {withdrawal.bankDetails.bankName}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {withdrawal.bankDetails.accountNumber}
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getTransactionStatusColor(withdrawal.status)}`}>
                                  {withdrawal.status}
                                </span>
                              </TableCell>
                              <TableCell>
                                {withdrawal.status === 'completed' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleViewReceipt(withdrawal)}
                                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  >
                                    <FileText className="h-4 w-4" />
                                    Download Receipt
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <EmptyWithdrawals />
                    )}
                  </div>
                  
                  {/* Mobile Withdrawals Cards */}
                  <div className="sm:hidden">
                    {withdrawals && withdrawals.length > 0 ? (
                      <div className="divide-y">
                        {withdrawals.map((withdrawal) => (
                          <div key={withdrawal._id} className="p-4 hover:bg-gray-50">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <div className="font-medium text-sm">{withdrawal.reference}</div>
                                <div className="text-xs text-gray-500">
                                  {new Date(withdrawal.requestDate).toLocaleDateString()}
                                </div>
                              </div>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getTransactionStatusColor(withdrawal.status)}`}>
                                {withdrawal.status}
                              </span>
                            </div>
                            
                            <div className="mt-3 flex justify-between items-center">
                              <div className="text-sm font-medium text-green-600">
                                {formatCurrency(withdrawal.amount)}
                              </div>
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Building2 className="h-3 w-3 text-gray-500" />
                                <span>{withdrawal.bankDetails.bankName} • {withdrawal.bankDetails.accountNumber.slice(-4)}</span>
                              </div>
                            </div>
                            
                            {withdrawal.status === 'completed' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewReceipt(withdrawal)}
                                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 mt-2 w-full justify-center"
                              >
                                <FileText className="h-3 w-3" />
                                Download Receipt
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4">
                        <EmptyWithdrawals />
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </Card>

          {/* Withdrawal Success Dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <button id="withdrawalSuccessDialog" className="hidden">Withdrawal Success</button>
            </DialogTrigger>
            <DialogContent className="w-[90%] sm:max-w-md rounded-lg">
              <DialogTitle className="text-green-600 text-base sm:text-lg">Success!</DialogTitle>
              <DialogDescription className="py-3 sm:py-4 text-sm sm:text-base">
                Your withdrawal request has been created successfully.
              </DialogDescription>
              <DialogFooter>
                <DialogClose asChild>
                  <Button className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto text-sm">
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
