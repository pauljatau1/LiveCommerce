import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Eye,
  Loader2,
  AlertCircle,
  Building2,
  Search,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowDownToLine,
  Copy,
  Banknote,
  TrendingDown,
  ExternalLink,
} from "lucide-react";
import { api } from "@/api/axios";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { format } from "date-fns";

interface WithdrawalNote {
  content: string;
  addedBy: string;
  _id: string;
  createdAt: string;
}

interface Withdrawal {
  _id: string;
  seller: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    storeName?: string;
  };
  bankDetails: {
    bankName: string;
    accountNumber: string;
    accountName: string;
    bankCode?: string;
    bankIdentifierCode?: string;
  };
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'rejected' | 'failed' | 'reversed';
  notes: WithdrawalNote[];
  requestDate: string;
  processedDate?: string;
  reference: string;
  paymentInfo?: {
    transferReference?: string;
    transferRecipientCode?: string;
    paystackStatus?: string;
    initiatedAt?: string;
    completedAt?: string;
    failureReason?: string;
    amount?: number;
    amountInKobo?: number;
    reference?: string;
  };
}

type StatusFilter = 'all' | Withdrawal['status'];

const getStatusColor = (status: string) => {
  const s = status?.toLowerCase();
  if (['completed'].includes(s)) return 'bg-green-600/20 text-green-400 border-green-800';
  if (['processing'].includes(s)) return 'bg-blue-600/20 text-blue-400 border-blue-800';
  if (['pending'].includes(s)) return 'bg-yellow-600/20 text-yellow-400 border-yellow-800';
  if (['rejected', 'failed'].includes(s)) return 'bg-red-600/20 text-red-400 border-red-800';
  if (['reversed'].includes(s)) return 'bg-orange-600/20 text-orange-400 border-orange-800';
  return 'bg-gray-600/20 text-gray-400 border-gray-700';
};

function Withdrawals() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusNote, setStatusNote] = useState("");
  const [pendingAction, setPendingAction] = useState<'processing' | 'rejected' | null>(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferStatus, setTransferStatus] = useState<{ loading: boolean; error: string | null }>({ loading: false, error: null });
  const [transferPolling, setTransferPolling] = useState<NodeJS.Timeout | null>(null);
  const [requiresOTP, setRequiresOTP] = useState(false);
  const [transferCode, setTransferCode] = useState<string | null>(null);
  const [otpValue, setOtpValue] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isManualCompleteOpen, setIsManualCompleteOpen] = useState(false);
  const [manualCompleteId, setManualCompleteId] = useState<string | null>(null);

  const fetchWithdrawals = async () => {
    try {
      const response = await api.get("/api/admin/withdrawals");
      setWithdrawals(response.data);
    } catch (error) {
      toast.error("Failed to fetch withdrawals");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
    return () => {
      if (transferPolling) {
        clearInterval(transferPolling);
      }
    };
  }, []);

  const filteredWithdrawals = useMemo(() => {
    let result = withdrawals;
    if (statusFilter !== 'all') {
      result = result.filter(w => w.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(w =>
        w.reference?.toLowerCase().includes(q) ||
        `${w.seller.firstName} ${w.seller.lastName}`.toLowerCase().includes(q) ||
        w.seller.email?.toLowerCase().includes(q) ||
        w.seller.storeName?.toLowerCase().includes(q) ||
        w.bankDetails.accountNumber?.includes(q)
      );
    }
    return result;
  }, [withdrawals, statusFilter, searchQuery]);

  const handleStatusUpdate = async () => {
    if (!selectedWithdrawal || !pendingAction) return;

    setProcessingId(selectedWithdrawal._id);
    try {
      await api.put(`/api/admin/withdrawals/${selectedWithdrawal._id}/status`, {
        status: pendingAction,
        note: statusNote.trim() || undefined
      });
      toast.success(`Withdrawal ${pendingAction}`);
      fetchWithdrawals();
      setIsStatusModalOpen(false);
      setStatusNote("");
      setPendingAction(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update withdrawal status");
    } finally {
      setProcessingId(null);
    }
  };

  const handleTransfer = async (withdrawal: Withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setTransferStatus({ loading: false, error: null });
    setRequiresOTP(false);
    setOtpValue('');
    setIsTransferModalOpen(true);
  };

  const confirmTransfer = async () => {
    setTransferStatus({ loading: true, error: null });
    try {
      const transferData = {
        bankCode: selectedWithdrawal?.bankDetails?.bankIdentifierCode,
        accountNumber: selectedWithdrawal?.bankDetails?.accountNumber,
        accountName: selectedWithdrawal?.bankDetails?.accountName,
        bankName: selectedWithdrawal?.bankDetails?.bankName,
        amount: selectedWithdrawal?.amount
      };

      const response = await api.post(
        `/api/admin/withdrawals/${selectedWithdrawal?._id}/transfer`,
        transferData
      );

      toast.success("Transfer initiated successfully. Waiting for Paystack confirmation...");

      const paystackReference = response.data.data.transfer.reference;
      setSelectedWithdrawal(prev => prev ? ({
        ...prev,
        status: 'processing' as const,
        paymentInfo: {
          ...prev.paymentInfo,
          transferReference: paystackReference
        }
      }) : null);

      // Start polling for transfer status
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await api.get(
            `/api/admin/transfers/${response.data.data.transfer.reference}/verify`
          );

          const { status, requiresAction, message } = statusResponse.data.data;

          if (requiresAction) {
            clearInterval(pollInterval);
            setTransferPolling(null);
            setRequiresOTP(true);
            setTransferCode(statusResponse.data.data.transfer_code);
            toast.info("Transfer requires OTP verification");
            return;
          }

          if (status === 'completed') {
            clearInterval(pollInterval);
            setTransferPolling(null);
            toast.success("Transfer completed successfully");
            await fetchWithdrawals();
            setIsTransferModalOpen(false);
          } else if (status === 'failed') {
            clearInterval(pollInterval);
            setTransferPolling(null);
            toast.error(message || "Transfer failed");
            await fetchWithdrawals();
            setIsTransferModalOpen(false);
          }
        } catch (error: any) {
          console.error("Error polling transfer status:", error);
          if (error.response?.status === 404) {
            clearInterval(pollInterval);
            setTransferPolling(null);
            toast.error("Transfer reference not found");
          }
        }
      }, 5000);

      setTransferPolling(pollInterval);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || "Failed to initiate transfer";
      setTransferStatus({
        loading: false,
        error: errorMessage
      });
      toast.error(errorMessage);
    }
  };

  const handleOTPSubmit = async () => {
    if (!selectedWithdrawal?.paymentInfo?.transferReference || !otpValue) return;

    try {
      const response = await api.post(
        `/api/admin/transfers/${selectedWithdrawal.paymentInfo.transferReference}/finalize`,
        { otp: otpValue }
      );

      if (response.data.success) {
        toast.success("Transfer finalized successfully");
        setRequiresOTP(false);
        setOtpValue('');
        await fetchWithdrawals();
        setIsTransferModalOpen(false);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || "Failed to finalize transfer";
      toast.error(errorMessage);
    }
  };

  const handleManualComplete = async () => {
    if (!manualCompleteId) return;

    try {
      setIsLoading(true);
      await api.post(`/api/admin/withdrawals/${manualCompleteId}/manual-complete`);
      toast.success("Withdrawal manually marked as completed");
      await fetchWithdrawals();
      setIsManualCompleteOpen(false);
      setManualCompleteId(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to mark as completed");
    } finally {
      setIsLoading(false);
    }
  };

  const openManualComplete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setManualCompleteId(id);
    setIsManualCompleteOpen(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  const getTotalAmount = (status?: Withdrawal['status']) => {
    const items = status ? withdrawals.filter(w => w.status === status) : withdrawals;
    return items.reduce((acc, curr) => acc + curr.amount, 0);
  };

  const getCount = (status?: Withdrawal['status']) => {
    return status ? withdrawals.filter(w => w.status === status).length : withdrawals.length;
  };

  const statusTabs: { label: string; value: StatusFilter; count: number }[] = [
    { label: 'All', value: 'all', count: withdrawals.length },
    { label: 'Pending', value: 'pending', count: getCount('pending') },
    { label: 'Processing', value: 'processing', count: getCount('processing') },
    { label: 'Completed', value: 'completed', count: getCount('completed') },
    { label: 'Failed', value: 'failed', count: getCount('failed') },
    { label: 'Rejected', value: 'rejected', count: getCount('rejected') },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Withdrawals</h2>
          <p className="text-muted-foreground">Manage seller payout requests and transfers</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchWithdrawals} className="gap-2">
          <ArrowDownToLine className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-yellow-500/5 border-yellow-500/20">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Clock className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-[11px] uppercase font-semibold text-yellow-400/70 tracking-wider">Pending</p>
                <p className="text-xl font-bold text-yellow-400 mt-0.5">{formatCurrency(getTotalAmount('pending'))}</p>
                <p className="text-[10px] text-muted-foreground">{getCount('pending')} requests</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/5 border-blue-500/20">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Loader2 className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-[11px] uppercase font-semibold text-blue-400/70 tracking-wider">Processing</p>
                <p className="text-xl font-bold text-blue-400 mt-0.5">{formatCurrency(getTotalAmount('processing'))}</p>
                <p className="text-[10px] text-muted-foreground">{getCount('processing')} transfers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-500/5 border-green-500/20">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle2 className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-[11px] uppercase font-semibold text-green-400/70 tracking-wider">Completed</p>
                <p className="text-xl font-bold text-green-400 mt-0.5">{formatCurrency(getTotalAmount('completed'))}</p>
                <p className="text-[10px] text-muted-foreground">{getCount('completed')} paid out</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-muted/10 border-border/30">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted/20">
                <Banknote className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-[11px] uppercase font-semibold text-muted-foreground tracking-wider">Total Volume</p>
                <p className="text-xl font-bold text-white mt-0.5">{formatCurrency(getTotalAmount())}</p>
                <p className="text-[10px] text-muted-foreground">{withdrawals.length} total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        {/* Status Tabs */}
        <div className="flex gap-1 bg-muted/10 p-1 rounded-lg border border-border/30 overflow-x-auto">
          {statusTabs.map(tab => (
            <Button
              key={tab.value}
              variant={statusFilter === tab.value ? "secondary" : "ghost"}
              size="sm"
              className={`text-xs h-8 whitespace-nowrap ${statusFilter === tab.value ? 'bg-white/10' : ''}`}
              onClick={() => setStatusFilter(tab.value)}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-1.5 text-[10px] bg-white/10 px-1.5 py-0.5 rounded-full">{tab.count}</span>
              )}
            </Button>
          ))}
        </div>
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by reference, seller, or account..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-9 text-sm bg-muted/10 border-border/30"
          />
        </div>
      </div>

      {/* Table */}
      <Card className="border-none shadow-sm overflow-hidden bg-gray-900 border-gray-800">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-gray-800">
                <TableHead className="text-gray-400 text-xs">Reference</TableHead>
                <TableHead className="text-gray-400 text-xs">Seller</TableHead>
                <TableHead className="text-gray-400 text-xs">Amount</TableHead>
                <TableHead className="text-gray-400 text-xs">Bank</TableHead>
                <TableHead className="text-gray-400 text-xs">Date</TableHead>
                <TableHead className="text-gray-400 text-xs">Status</TableHead>
                <TableHead className="text-gray-400 text-xs text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWithdrawals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <TrendingDown className="h-8 w-8 opacity-20" />
                      <p className="text-sm">No withdrawals found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredWithdrawals.map((withdrawal) => (
                  <TableRow key={withdrawal._id} className="border-gray-800 group hover:bg-white/5">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-blue-400">{withdrawal.reference}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => {
                            navigator.clipboard.writeText(withdrawal.reference);
                            toast.success("Reference copied");
                          }}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Link
                        to={`/dashboard/seller/${withdrawal.seller._id}`}
                        className="text-sm font-medium text-white hover:text-blue-400 transition-colors"
                      >
                        {withdrawal.seller.firstName} {withdrawal.seller.lastName}
                      </Link>
                      <p className="text-[10px] text-muted-foreground">{withdrawal.seller.email}</p>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-white text-sm">{formatCurrency(withdrawal.amount)}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded bg-white/5">
                          <Building2 className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-300">{withdrawal.bankDetails.bankName}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">{withdrawal.bankDetails.accountNumber}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-300">{format(new Date(withdrawal.requestDate), "MMM d, yyyy")}</span>
                        <span className="text-[10px] text-muted-foreground">{format(new Date(withdrawal.requestDate), "h:mm a")}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] ${getStatusColor(withdrawal.status)}`}>
                        {withdrawal.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => {
                            setSelectedWithdrawal(withdrawal);
                            setIsDetailsModalOpen(true);
                          }}
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" /> View
                        </Button>
                        {withdrawal.status === 'pending' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2.5 text-xs text-green-400 border-green-500/20 hover:bg-green-500/10"
                              onClick={() => handleTransfer(withdrawal)}
                              disabled={transferStatus.loading}
                            >
                              {transferStatus.loading ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <>
                                  <DollarSign className="h-3.5 w-3.5 mr-1" />
                                  Transfer
                                </>
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2.5 text-xs text-red-400 border-red-500/20 hover:bg-red-500/10"
                              onClick={() => {
                                setSelectedWithdrawal(withdrawal);
                                setPendingAction('rejected');
                                setIsStatusModalOpen(true);
                              }}
                              disabled={processingId === withdrawal._id}
                            >
                              <XCircle className="h-3.5 w-3.5 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                        {withdrawal.status === 'processing' && (
                          <div className="flex gap-2">
                            <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-400 border-blue-800 animate-pulse">
                              Awaiting Paystack...
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2.5 text-xs text-green-400 border-green-500/20 hover:bg-green-500/10"
                              onClick={(e) => openManualComplete(withdrawal._id, e)}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                              Mark Done
                            </Button>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Transfer Modal */}
      <Dialog open={isTransferModalOpen} onOpenChange={setIsTransferModalOpen}>
        <DialogContent className="sm:max-w-[500px] bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">
              {requiresOTP ? 'OTP Verification Required' : 'Confirm Paystack Transfer'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {selectedWithdrawal && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider">Amount</p>
                    <p className="text-lg font-bold text-green-400 mt-1">{formatCurrency(selectedWithdrawal.amount)}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider">Recipient</p>
                    <p className="text-sm font-medium text-white mt-1">{selectedWithdrawal.seller.firstName} {selectedWithdrawal.seller.lastName}</p>
                    <p className="text-[10px] text-muted-foreground">{selectedWithdrawal.seller.email}</p>
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider mb-2">Bank Details</p>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-white/5">
                      <Building2 className="h-4 w-4 text-gray-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white text-sm">{selectedWithdrawal.bankDetails.bankName}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {selectedWithdrawal.bankDetails.accountNumber}
                        {" · "}
                        {selectedWithdrawal.bankDetails.accountName}
                      </p>
                      {selectedWithdrawal.bankDetails.bankIdentifierCode && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Bank Code: {selectedWithdrawal.bankDetails.bankIdentifierCode}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {transferStatus.error && (
                  <Alert variant="destructive" className="bg-red-500/10 border-red-500/30">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Transfer Error</AlertTitle>
                    <AlertDescription className="text-xs">{transferStatus.error}</AlertDescription>
                  </Alert>
                )}

                {requiresOTP && (
                  <div className="space-y-3">
                    <Alert className="bg-blue-500/10 border-blue-500/30">
                      <AlertCircle className="h-4 w-4 text-blue-400" />
                      <AlertTitle className="text-blue-400">OTP Required</AlertTitle>
                      <AlertDescription className="text-xs text-blue-300/80">
                        Enter the OTP sent to your registered phone number.
                      </AlertDescription>
                    </Alert>
                    <div>
                      <label htmlFor="otp" className="text-xs font-medium text-muted-foreground">Enter OTP</label>
                      <Input
                        id="otp"
                        type="text"
                        value={otpValue}
                        onChange={(e) => setOtpValue(e.target.value)}
                        className="mt-1 bg-white/5 border-white/10 text-center text-lg font-mono tracking-[0.3em]"
                        placeholder="• • • • • •"
                        maxLength={6}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              className="border-gray-700"
              onClick={() => {
                setIsTransferModalOpen(false);
                setOtpValue('');
                setRequiresOTP(false);
                if (transferPolling) {
                  clearInterval(transferPolling);
                  setTransferPolling(null);
                }
              }}
              disabled={transferStatus.loading}
            >
              Cancel
            </Button>
            {requiresOTP ? (
              <Button
                onClick={handleOTPSubmit}
                disabled={!otpValue || otpValue.length < 6}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Submit OTP
              </Button>
            ) : (
              <Button
                onClick={confirmTransfer}
                disabled={transferStatus.loading || requiresOTP}
                className="bg-green-600 hover:bg-green-700"
              >
                {transferStatus.loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Initiating...
                  </>
                ) : (
                  <>
                    <DollarSign className="mr-1 h-4 w-4" />
                    Confirm Transfer
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Complete Confirmation Modal */}
      <Dialog open={isManualCompleteOpen} onOpenChange={setIsManualCompleteOpen}>
        <DialogContent className="sm:max-w-[425px] bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">Confirm Manual Completion</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to manually mark this withdrawal as completed?
              This will update the status to 'completed' without waiting for Paystack confirmation.
              Use this only if you are sure the funds have been transferred.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              className="border-gray-700"
              onClick={() => setIsManualCompleteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={handleManualComplete}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Confirm Completion'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="sm:max-w-[650px] bg-gray-900 border-gray-800 max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-3">
              Withdrawal Details
              {selectedWithdrawal && (
                <Badge variant="outline" className={`text-[10px] ${getStatusColor(selectedWithdrawal.status)}`}>
                  {selectedWithdrawal.status.toUpperCase()}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedWithdrawal && (
            <div className="space-y-5">
              {/* Amount & Reference */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-[10px] uppercase text-muted-foreground font-semibold">Amount</p>
                  <p className="text-xl font-bold text-green-400 mt-1">{formatCurrency(selectedWithdrawal.amount)}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-[10px] uppercase text-muted-foreground font-semibold">Reference</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="font-mono text-sm text-blue-400">{selectedWithdrawal.reference}</p>
                    <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => {
                      navigator.clipboard.writeText(selectedWithdrawal.reference);
                      toast.success("Reference copied");
                    }}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Seller Info */}
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider mb-2">Seller</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">{selectedWithdrawal.seller.firstName} {selectedWithdrawal.seller.lastName}</p>
                    <p className="text-xs text-muted-foreground">{selectedWithdrawal.seller.email}</p>
                    {selectedWithdrawal.seller.storeName && (
                      <p className="text-xs text-muted-foreground">{selectedWithdrawal.seller.storeName}</p>
                    )}
                  </div>
                  <Link to={`/dashboard/seller/${selectedWithdrawal.seller._id}`}>
                    <Button variant="outline" size="sm" className="h-7 text-xs border-gray-700 gap-1">
                      <ExternalLink className="h-3 w-3" /> View
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Bank Details */}
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider mb-2">Bank Details</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-[10px] text-muted-foreground">Bank</p>
                    <p className="text-white font-medium">{selectedWithdrawal.bankDetails.bankName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Account Number</p>
                    <p className="text-white font-mono">{selectedWithdrawal.bankDetails.accountNumber}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Account Name</p>
                    <p className="text-white">{selectedWithdrawal.bankDetails.accountName}</p>
                  </div>
                  {selectedWithdrawal.bankDetails.bankIdentifierCode && (
                    <div>
                      <p className="text-[10px] text-muted-foreground">Bank Code</p>
                      <p className="text-white font-mono">{selectedWithdrawal.bankDetails.bankIdentifierCode}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Info (Paystack) */}
              {selectedWithdrawal.paymentInfo?.transferReference && (
                <div className="bg-blue-500/5 rounded-lg p-3 border border-blue-500/20">
                  <p className="text-[10px] uppercase text-blue-400 font-bold tracking-wider mb-2">Paystack Transfer</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-[10px] text-muted-foreground">Transfer Ref</p>
                      <p className="text-blue-400 font-mono text-xs">{selectedWithdrawal.paymentInfo.transferReference}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Paystack Status</p>
                      <p className="text-white">{selectedWithdrawal.paymentInfo.paystackStatus || 'N/A'}</p>
                    </div>
                    {selectedWithdrawal.paymentInfo.initiatedAt && (
                      <div>
                        <p className="text-[10px] text-muted-foreground">Initiated</p>
                        <p className="text-white text-xs">{format(new Date(selectedWithdrawal.paymentInfo.initiatedAt), "MMM d, yyyy h:mm a")}</p>
                      </div>
                    )}
                    {selectedWithdrawal.paymentInfo.completedAt && (
                      <div>
                        <p className="text-[10px] text-muted-foreground">Completed</p>
                        <p className="text-green-400 text-xs">{format(new Date(selectedWithdrawal.paymentInfo.completedAt), "MMM d, yyyy h:mm a")}</p>
                      </div>
                    )}
                    {selectedWithdrawal.paymentInfo.failureReason && (
                      <div className="col-span-2 bg-red-500/10 p-2 rounded border border-red-500/20">
                        <p className="text-[10px] text-red-400 font-bold mb-1">Failure Reason</p>
                        <p className="text-red-300 text-xs">{selectedWithdrawal.paymentInfo.failureReason}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Manual Complete Action */}
              {selectedWithdrawal.status === 'processing' && (
                <div className="flex justify-end pt-4 border-t border-white/10">
                  <Button
                    variant="outline"
                    className="text-green-400 border-green-500/20 hover:bg-green-500/10"
                    onClick={(e) => openManualComplete(selectedWithdrawal._id, e)}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Manually Mark as Completed
                  </Button>
                </div>
              )}

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-[10px] text-muted-foreground">Requested</p>
                  <p className="text-white text-sm">{format(new Date(selectedWithdrawal.requestDate), "MMM d, yyyy h:mm a")}</p>
                </div>
                {selectedWithdrawal.processedDate && (
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-[10px] text-muted-foreground">Processed</p>
                    <p className="text-white text-sm">{format(new Date(selectedWithdrawal.processedDate), "MMM d, yyyy h:mm a")}</p>
                  </div>
                )}
              </div>

              {/* Notes */}
              {selectedWithdrawal.notes.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider mb-2">Activity Log</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedWithdrawal.notes.map((note) => (
                      <div key={note._id} className="bg-white/5 p-2.5 rounded-md border border-white/5">
                        <p className="text-xs text-gray-300">{note.content}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          <span className="capitalize">{note.addedBy}</span> · {format(new Date(note.createdAt), "MMM d, h:mm a")}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog >

      {/* Status Update (Reject) Modal */}
      < Dialog open={isStatusModalOpen} onOpenChange={setIsStatusModalOpen} >
        <DialogContent className="bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">
              {pendingAction === 'rejected' ? 'Reject Withdrawal' : 'Update Status'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {pendingAction === 'rejected' && (
              <Alert variant="destructive" className="bg-red-500/10 border-red-500/30">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  This will reject the withdrawal request. The seller will be notified.
                </AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <label htmlFor="note" className="text-xs font-medium text-muted-foreground">Reason / Note</label>
              <Textarea
                id="note"
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder="Provide a reason for this action..."
                className="bg-white/5 border-white/10"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="border-gray-700" onClick={() => setIsStatusModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleStatusUpdate}
              disabled={processingId === selectedWithdrawal?._id}
              variant={pendingAction === 'rejected' ? 'destructive' : 'default'}
            >
              {processingId === selectedWithdrawal?._id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                pendingAction === 'rejected' ? 'Reject Withdrawal' : 'Confirm'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog >
    </div >
  );
}

export default Withdrawals;