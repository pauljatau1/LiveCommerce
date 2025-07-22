import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Check, X, Eye, Loader2, PlayCircle, AlertCircle, Building2 } from "lucide-react";
import { api } from "@/api/axios";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Link } from "react-router-dom";

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
  };
  bankDetails: {
    bankName: string;
    accountNumber: string;
    accountName: string;
    bankCode: string;
    bankIdentifierCode?: string;
  };
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  notes: WithdrawalNote[];
  requestDate: string;
  processedDate?: string;
  reference: string;
  paymentInfo?: {
    transferReference?: string;
    transferRecipientCode?: string;
    paystackStatus?: string;
  };
}

function Withdrawals() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusNote, setStatusNote] = useState("");
  const [pendingAction, setPendingAction] = useState<'processing' | 'completed' | 'rejected' | null>(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferStatus, setTransferStatus] = useState({ loading: false, error: null });
  const [transferPolling, setTransferPolling] = useState<NodeJS.Timeout | null>(null);
  const [requiresOTP, setRequiresOTP] = useState(false);
  const [transferCode, setTransferCode] = useState(null);
  const [otpValue, setOtpValue] = useState('');

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
      // Cleanup polling on unmount
      if (transferPolling) {
        clearInterval(transferPolling);
      }
    };
  }, []);

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
    } catch (error) {
      toast.error("Failed to update withdrawal status");
    } finally {
      setProcessingId(null);
    }
  };

  const handleTransfer = async (withdrawal:any) => {
    setSelectedWithdrawal(withdrawal);
    setTransferStatus({ loading: false, error: null });
    setIsTransferModalOpen(true);
  };

  const confirmTransfer = async () => {
    setTransferStatus({ loading: true, error: null });
    try {
      // Use bankIdentifierCode from withdrawal request
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
      
      toast.success("Transfer initiated successfully");
      
      // Store the Paystack transfer reference
      const paystackReference = response.data.data.transfer.reference;
      setSelectedWithdrawal(prev=> ({
        ...prev,
        paymentInfo: {
          ...prev.paymentInfo,
          transferReference: paystackReference
        }
      }));
      
      // Start polling for transfer status
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await api.get(
            `/api/admin/transfers/${response.data.data.transfer.reference}/verify`
          );
          
          const { status, requiresAction, message } = statusResponse.data.data;
          
          console.log('Transfer status check:', {
            reference: response.data.data.transfer.reference,
            status,
            requiresAction,
            message
          });

          if (requiresAction) {
            // Stop polling and show OTP verification UI
            clearInterval(pollInterval);
            setTransferPolling(null);
            setRequiresOTP(true);
            setTransferCode(statusResponse.data.data.transfer_code);
            toast.info("Transfer requires verification");
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
          // Continue polling for 'processing' status
        } catch (error) {
          console.error("Error polling transfer status:", error);
          if (error.response?.status === 404) {
            clearInterval(pollInterval);
            setTransferPolling(null);
            toast.error("Transfer reference not found");
          }
        }
      }, 5000);

      setTransferPolling(pollInterval);
    } catch (error) {
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
    } catch (error) {
      const errorMessage = error.response?.data?.error || "Failed to finalize transfer";
      toast.error(errorMessage);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  const getTotalAmount = (status: Withdrawal['status']) => {
    return withdrawals
      .filter(w => w.status === status)
      .reduce((acc, curr) => acc + curr.amount, 0);
  };

  const getStatusColor = (status: Withdrawal['status']) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return colors[status];
  };

  const renderActions = (withdrawal:any) => (
    <div className="flex space-x-2">
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => {
          setSelectedWithdrawal(withdrawal);
          setIsDetailsModalOpen(true);
        }}
      >
        <Eye className="h-4 w-4" />
      </Button>
      {withdrawal.status === 'pending' && (
        <>
          {/* <Button 
            variant="outline" 
            size="sm" 
            className="text-blue-500"
            onClick={() => {
              setSelectedWithdrawal(withdrawal);
              setPendingAction('processing');
              setIsStatusModalOpen(true);
            }}
            disabled={processingId === withdrawal._id}
          >
            <PlayCircle className="h-4 w-4" />
          </Button> */}
          <Button 
            variant="outline" 
            size="sm" 
            className="text-red-500"
            onClick={() => {
              setSelectedWithdrawal(withdrawal);
              setPendingAction('rejected');
              setIsStatusModalOpen(true);
            }}
            disabled={processingId === withdrawal._id}
          >
            Reject
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-green-500"
            onClick={() => handleTransfer(withdrawal)}
            disabled={transferStatus.loading}
          >
            {transferStatus.loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Transfer'
            )}
          </Button>
        </>
      )}
      {withdrawal.status === 'processing' && (
        <Button 
          variant="outline" 
          size="sm" 
          className="text-green-500"
          onClick={() => {
            setSelectedWithdrawal(withdrawal);
            setPendingAction('completed');
            setIsStatusModalOpen(true);
          }}
          disabled={processingId === withdrawal._id}
        >
         complete transfer 
        </Button>
      )}
    </div>
  );

  const renderTransferModal = () => (
    <Dialog open={isTransferModalOpen} onOpenChange={setIsTransferModalOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {requiresOTP ? 'Enter OTP to Complete Transfer' : 'Confirm Transfer'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {selectedWithdrawal && (
            <>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-semibold">Amount</p>
                  <p className="text-lg">{formatCurrency(selectedWithdrawal.amount)}</p>
                </div>
                <div>
                  <p className="font-semibold">Recipient</p>
                  <p>{selectedWithdrawal.seller.firstName} {selectedWithdrawal.seller.lastName}</p>
                </div>
              </div>

              <div className="border rounded p-3">
                <p className="font-semibold mb-2">Bank Details</p>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-gray-50">
                    <Building2 className="h-4 w-4 text-gray-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-700">
                      {selectedWithdrawal.bankDetails.bankName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {selectedWithdrawal.bankDetails.accountNumber}
                      {selectedWithdrawal.bankDetails.bankIdentifierCode && (
                        <span className="ml-2 text-gray-400">
                          (BIC: {selectedWithdrawal.bankDetails.bankIdentifierCode})
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {transferStatus.error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{transferStatus.error}</AlertDescription>
                </Alert>
              )}

              {requiresOTP && (
                <div className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>OTP Required</AlertTitle>
                    <AlertDescription>
                      Please enter the OTP sent to your phone to complete this transfer.
                    </AlertDescription>
                  </Alert>
                  <div className="space-y-2">
                    <label htmlFor="otp" className="text-sm font-medium">
                      Enter OTP
                    </label>
                    <input
                      id="otp"
                      type="text"
                      value={otpValue}
                      onChange={(e) => setOtpValue(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                      placeholder="Enter OTP"
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
            onClick={() => {
              setIsTransferModalOpen(false);
              setOtpValue('');
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
            >
              Submit OTP
            </Button>
          ) : (
            <Button
              onClick={confirmTransfer}
              disabled={transferStatus.loading || requiresOTP}
            >
              {transferStatus.loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing
                </>
              ) : (
                'Confirm Transfer'
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white">Withdrawals</h2>
        <p className="text-muted-foreground">Manage seller withdrawal requests</p>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="p-6">
          <div className="flex flex-col">
            <span className="text-muted-foreground text-sm">Pending Amount</span>
            <span className="text-2xl font-bold mt-2">
              {formatCurrency(getTotalAmount('pending'))}
            </span>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex flex-col">
            <span className="text-muted-foreground text-sm">Processing Amount</span>
            <span className="text-2xl font-bold mt-2">
              {formatCurrency(getTotalAmount('processing'))}
            </span>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex flex-col">
            <span className="text-muted-foreground text-sm">Completed Amount</span>
            <span className="text-2xl font-bold mt-2">
              {formatCurrency(getTotalAmount('completed'))}
            </span>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex flex-col">
            <span className="text-muted-foreground text-sm">Total Requests</span>
            <span className="text-2xl font-bold mt-2">{withdrawals.length}</span>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reference</TableHead>
              <TableHead>Seller</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Bank Details</TableHead>
              <TableHead>Request Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {withdrawals.map((withdrawal) => (
              <TableRow key={withdrawal._id}>
                <TableCell className="font-mono text-xs">
                  {withdrawal.reference}
                </TableCell>
                <TableCell>
                  {/* Seller name as a link to seller detail */}
                  <Link
                    to={`/dashboard/seller/${withdrawal.seller._id}`}
                    className="text-blue-500 hover:underline"
                  >
                    {withdrawal.seller.firstName} {withdrawal.seller.lastName}
                  </Link>
                </TableCell>
                <TableCell>{formatCurrency(withdrawal.amount)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-gray-50">
                      <Building2 className="h-4 w-4 text-gray-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-300">
                        {withdrawal.bankDetails.bankName}
                      </div>
                      <div className="text-xs text-gray-400">
                        {withdrawal.bankDetails.accountNumber}
                        {withdrawal.bankDetails.bankIdentifierCode && (
                          <span className="ml-2 text-gray-400">
                            (BIC: {withdrawal.bankDetails.bankIdentifierCode})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{formatDate(withdrawal.requestDate)}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(withdrawal.status)}`}>
                    {withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                  </span>
                </TableCell>
                <TableCell>
                  {renderActions(withdrawal)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {renderTransferModal()}

      {/* Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Withdrawal Details</DialogTitle>
          </DialogHeader>
          {selectedWithdrawal && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold">Seller Information</h4>
                  <p>{selectedWithdrawal.seller.firstName} {selectedWithdrawal.seller.lastName}</p>
                  <p className="text-sm text-muted-foreground">{selectedWithdrawal.seller.email}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Bank Details</h4>
                  <p>{selectedWithdrawal.bankDetails.bankName}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedWithdrawal.bankDetails.accountNumber} ({selectedWithdrawal.bankDetails.accountName})
                  </p>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Notes History</h4>
                <div className="space-y-2">
                  {selectedWithdrawal.notes.map((note) => (
                    <div key={note._id} className="bg-muted p-3 rounded-md">
                      <p className="text-sm">{note.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        By {note.addedBy} on {formatDate(note.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Status Update Modal */}
      <Dialog open={isStatusModalOpen} onOpenChange={setIsStatusModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Withdrawal Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="note">Add a note (optional)</label>
              <Textarea
                id="note"
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder="Enter a note about this status change..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleStatusUpdate}
              disabled={processingId === selectedWithdrawal?._id}
            >
              {processingId === selectedWithdrawal?._id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Confirm'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Withdrawals;