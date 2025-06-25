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
import { Check, X, Eye, Loader2, PlayCircle, AlertCircle, Building2, ArrowUpFromLine } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";

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
    transferCompleted?: boolean;
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
  const [transferStatus, setTransferStatus] = useState<{ loading: boolean; error: string | null }>({ loading: false, error: null });
  const [transferPolling, setTransferPolling] = useState<NodeJS.Timeout | null>(null);
  const [requiresOTP, setRequiresOTP] = useState(false);
  const [transferCode, setTransferCode] = useState<string | null>(null);
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
      toast.success(`Withdrawal status updated to ${pendingAction}`);
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

  const handleTransfer = async (withdrawal: Withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setTransferStatus({ loading: false, error: null });
    setIsTransferModalOpen(true);
  };

  const confirmTransfer = async () => {
    if (!selectedWithdrawal) return;
    
    setTransferStatus({ loading: true, error: null });
    try {
      // Use bankIdentifierCode from withdrawal request
      const transferData = {
        bankCode: selectedWithdrawal.bankDetails?.bankIdentifierCode,
        accountNumber: selectedWithdrawal.bankDetails?.accountNumber,
        accountName: selectedWithdrawal.bankDetails?.accountName,
        bankName: selectedWithdrawal.bankDetails?.bankName,
        amount: selectedWithdrawal.amount
      };

      const response = await api.post(
        `/api/admin/withdrawals/${selectedWithdrawal._id}/transfer`,
        transferData
      );
      
      toast.success("Transfer initiated successfully");
      
      // Store the Paystack transfer reference
      const paystackReference = response.data.data.transfer.reference;
      
      if (selectedWithdrawal) {
        setSelectedWithdrawal({
          ...selectedWithdrawal,
          paymentInfo: {
            ...selectedWithdrawal.paymentInfo,
            transferReference: paystackReference
          }
        });
      }
      
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
            
            // Update the withdrawal with transfer completed flag
            if (selectedWithdrawal) {
              setSelectedWithdrawal({
                ...selectedWithdrawal,
                paymentInfo: {
                  ...selectedWithdrawal.paymentInfo,
                  transferCompleted: true,
                  paystackStatus: 'completed'
                }
              });
            }
            
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
        // Update the withdrawal with transfer completed flag
        if (selectedWithdrawal) {
          setSelectedWithdrawal({
            ...selectedWithdrawal,
            paymentInfo: {
              ...selectedWithdrawal.paymentInfo,
              transferCompleted: true,
              paystackStatus: 'completed'
            }
          });
        }
        
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

  // Fixed type for badge variants
  type BadgeVariant = "default" | "secondary" | "destructive" | "outline";
  
  const getStatusBadgeVariant = (status: Withdrawal['status']): BadgeVariant => {
    const variants: Record<Withdrawal['status'], BadgeVariant> = {
      pending: "default",
      processing: "secondary",
      completed: "default",
      rejected: "destructive"
    };
    return variants[status];
  };

  // Check if transfer is completed for a withdrawal
  const isTransferCompleted = (withdrawal: Withdrawal): boolean => {
    return !!withdrawal.paymentInfo?.transferCompleted;
  };

  const renderActions = (withdrawal: Withdrawal) => (
    <div className="flex flex-col space-y-2">
      <Button 
        variant="outline" 
        size="sm"
        className="w-full justify-start"
        onClick={() => {
          setSelectedWithdrawal(withdrawal);
          setIsDetailsModalOpen(true);
        }}
      >
        <Eye className="h-4 w-4 mr-2" />
        <span>View Details</span>
      </Button>
      
      {withdrawal.status === 'pending' && (
        <>
          <Button 
            variant="default" 
            size="sm" 
            className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => {
              setSelectedWithdrawal(withdrawal);
              setPendingAction('processing');
              setIsStatusModalOpen(true);
            }}
            disabled={processingId === withdrawal._id}
          >
            <PlayCircle className="h-4 w-4 mr-2" />
            <span>Start Processing</span>
          </Button>
          <Button 
            variant="destructive" 
            size="sm" 
            className="w-full justify-start"
            onClick={() => {
              setSelectedWithdrawal(withdrawal);
              setPendingAction('rejected');
              setIsStatusModalOpen(true);
            }}
            disabled={processingId === withdrawal._id}
          >
            <X className="h-4 w-4 mr-2" />
            <span>Reject Request</span>
          </Button>
        </>
      )}
      
      {withdrawal.status === 'processing' && (
        <>
          {isTransferCompleted(withdrawal) ? (
            <Button 
              variant="default" 
              size="sm" 
              className="w-full justify-start bg-green-600 hover:bg-green-700 text-white"
              onClick={() => {
                setSelectedWithdrawal(withdrawal);
                setPendingAction('completed');
                setIsStatusModalOpen(true);
              }}
              disabled={processingId === withdrawal._id}
            >
              <Check className="h-4 w-4 mr-2" />
              <span>Mark as Completed</span>
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              className="w-full justify-start"
              onClick={() => handleTransfer(withdrawal)}
              disabled={transferStatus.loading}
            >
              {transferStatus.loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <ArrowUpFromLine className="h-4 w-4 mr-2" />
                  <span>Initiate Transfer</span>
                </>
              )}
            </Button>
          )}
        </>
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
          <DialogDescription>
            {requiresOTP 
              ? 'Enter the one-time password sent to your phone to verify this transfer'
              : 'Review the transfer details before confirming the transaction'}
          </DialogDescription>
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
                  <p>{selectedWithdrawal.seller?.firstName || 'N/A'} {selectedWithdrawal.seller?.lastName || ''}</p>
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
                      {selectedWithdrawal.bankDetails?.bankName || 'N/A'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {selectedWithdrawal.bankDetails?.accountNumber || 'N/A'}
                      {selectedWithdrawal.bankDetails?.bankIdentifierCode && (
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

  // Function to get custom styling for status badges
  const getStatusBadgeClass = (status: Withdrawal['status']): string => {
    const classes = {
      pending: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
      processing: "bg-blue-100 text-blue-800 hover:bg-blue-200",
      completed: "bg-green-100 text-green-800 hover:bg-green-200",
      rejected: "bg-red-100 text-red-800 hover:bg-red-200"
    };
    return classes[status];
  };

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

      {isLoading ? (
        <Card className="p-6 flex justify-center items-center h-64">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p>Loading withdrawal requests...</p>
          </div>
        </Card>
      ) : withdrawals.length === 0 ? (
        <Card className="p-6 flex justify-center items-center h-64">
          <div className="text-center">
            <p className="text-lg font-medium">No withdrawal requests found</p>
            <p className="text-muted-foreground">Withdrawal requests will appear here when sellers make them</p>
          </div>
        </Card>
      ) : (
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
                <TableHead className="w-[200px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {withdrawals.map((withdrawal) => (
                <TableRow key={withdrawal._id}>
                  <TableCell className="font-mono text-xs">
                    {withdrawal.reference}
                  </TableCell>
                  <TableCell>
                    {withdrawal.seller?.firstName || 'N/A'} {withdrawal.seller?.lastName || ''}
                  </TableCell>
                  <TableCell>{formatCurrency(withdrawal.amount)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-md bg-gray-50">
                        <Building2 className="h-4 w-4 text-gray-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-700">
                          {withdrawal.bankDetails?.bankName || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {withdrawal.bankDetails?.accountNumber || 'N/A'}
                          {withdrawal.bankDetails?.bankIdentifierCode && (
                            <span className="ml-2 text-gray-400">
                              (BIC: {withdrawal.bankDetails.bankIdentifierCode})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{withdrawal.requestDate ? formatDate(withdrawal.requestDate) : 'N/A'}</TableCell>
                  <TableCell>
                    <div className={`px-2 py-1 rounded-full text-xs inline-block ${getStatusBadgeClass(withdrawal.status)}`}>
                      {withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                      {withdrawal.status === 'processing' && isTransferCompleted(withdrawal) && (
                        <span className="ml-1 text-xs">(Transfer Complete)</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {renderActions(withdrawal)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {renderTransferModal()}

      {/* Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Withdrawal Details</DialogTitle>
            <DialogDescription>
              Review all information related to this withdrawal request
            </DialogDescription>
          </DialogHeader>
          {selectedWithdrawal && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold">Seller Information</h4>
                  <p>{selectedWithdrawal.seller?.firstName || 'N/A'} {selectedWithdrawal.seller?.lastName || ''}</p>
                  <p className="text-sm text-muted-foreground">{selectedWithdrawal.seller?.email || 'N/A'}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Bank Details</h4>
                  <p>{selectedWithdrawal.bankDetails?.bankName || 'N/A'}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedWithdrawal.bankDetails?.accountNumber || 'N/A'} ({selectedWithdrawal.bankDetails?.accountName || 'N/A'})
                  </p>
                </div>
              </div>
              
              {selectedWithdrawal.paymentInfo?.transferReference && (
                <div className="bg-blue-50 p-3 rounded-md">
                  <h4 className="font-semibold mb-1">Transfer Information</h4>
                  <p className="text-sm">Reference: {selectedWithdrawal.paymentInfo.transferReference}</p>
                  {selectedWithdrawal.paymentInfo.transferCompleted && (
                    <p className="text-sm text-green-600 font-medium mt-1">
                      Transfer has been completed
                    </p>
                  )}
                </div>
              )}
              
              <div>
                <h4 className="font-semibold mb-2">Notes History</h4>
                {selectedWithdrawal.notes && selectedWithdrawal.notes.length > 0 ? (
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
                ) : (
                  <p className="text-sm text-muted-foreground">No notes have been added to this withdrawal request.</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Status Update Modal */}
      <Dialog open={isStatusModalOpen} onOpenChange={setIsStatusModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingAction === 'processing' && 'Start Processing Withdrawal'}
              {pendingAction === 'completed' && 'Mark Withdrawal as Completed'}
              {pendingAction === 'rejected' && 'Reject Withdrawal Request'}
            </DialogTitle>
            <DialogDescription>
              {pendingAction === 'processing' && 'This will mark the withdrawal as being processed'}
              {pendingAction === 'completed' && 'This will mark the withdrawal as successfully completed'}
              {pendingAction === 'rejected' && 'This will reject the withdrawal request'}
            </DialogDescription>
          </DialogHeader>
          
          {pendingAction === 'completed' && selectedWithdrawal && !isTransferCompleted(selectedWithdrawal) && (
            <Alert className="mt-2">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Transfer Not Completed</AlertTitle>
              <AlertDescription>
                You need to complete the transfer process before marking this withdrawal as completed.
              </AlertDescription>
            </Alert>
          )}
          
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
              variant="outline"
              onClick={() => {
                setIsStatusModalOpen(false);
                setStatusNote("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant={pendingAction === 'rejected' ? 'destructive' : 'default'}
              onClick={handleStatusUpdate}
              disabled={Boolean(processingId === selectedWithdrawal?._id) || 
                Boolean(pendingAction === 'completed' && selectedWithdrawal && !isTransferCompleted(selectedWithdrawal))}
            >
              {processingId === selectedWithdrawal?._id ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {pendingAction === 'processing' && 'Start Processing'}
                  {pendingAction === 'completed' && 'Mark as Completed'}
                  {pendingAction === 'rejected' && 'Reject Request'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Withdrawals;
