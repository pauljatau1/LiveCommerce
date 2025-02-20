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
import { Check, X, Eye, Loader2, PlayCircle, AlertCircle } from "lucide-react";
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
  };
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  notes: WithdrawalNote[];
  requestDate: string;
  processedDate?: string;
  reference: string;
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

  const handleTransfer = async (withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setTransferStatus({ loading: false, error: null });
    setIsTransferModalOpen(true);
  };

  const confirmTransfer = async () => {
    setTransferStatus({ loading: true, error: null });
    try {
      const response = await api.post(`/api/admin/withdrawals/${selectedWithdrawal._id}/transfer`);
      toast.success("Transfer initiated successfully");
      
      // Start polling for transfer status
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await api.get(
            `/api/admin/transfers/${response.data.data.transfer.reference}/verify`
          );
          
          const status = statusResponse.data.data.withdrawal.status;
          
          if (status === 'completed') {
            toast.success("Transfer completed successfully");
            clearInterval(pollInterval);
            setTransferPolling(null);
            await fetchWithdrawals();
            setIsTransferModalOpen(false);
          } else if (status === 'failed') {
            toast.error("Transfer failed");
            clearInterval(pollInterval);
            setTransferPolling(null);
            await fetchWithdrawals();
            setIsTransferModalOpen(false);
          }
        } catch (error) {
          console.error("Error polling transfer status:", error);
        }
      }, 5000);

      setTransferPolling(pollInterval);
    } catch (error) {
      setTransferStatus({
        loading: false,
        error: error.response?.data?.message || "Failed to initiate transfer"
      });
      toast.error("Failed to initiate transfer");
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

  const renderActions = (withdrawal) => (
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
          <Button 
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
          </Button>
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
            <X className="h-4 w-4" />
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
          <Check className="h-4 w-4" />
        </Button>
      )}
    </div>
  );

  const renderTransferModal = () => (
    <Dialog open={isTransferModalOpen} onOpenChange={setIsTransferModalOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Confirm Transfer</DialogTitle>
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
                <p>{selectedWithdrawal.bankDetails.bankName}</p>
                <p>{selectedWithdrawal.bankDetails.accountNumber}</p>
                <p>{selectedWithdrawal.bankDetails.accountName}</p>
              </div>

              {transferStatus.error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{transferStatus.error}</AlertDescription>
                </Alert>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsTransferModalOpen(false)}
            disabled={transferStatus.loading}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmTransfer}
            disabled={transferStatus.loading}
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
                  {withdrawal.seller.firstName} {withdrawal.seller.lastName}
                </TableCell>
                <TableCell>{formatCurrency(withdrawal.amount)}</TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>{withdrawal.bankDetails.bankName}</div>
                    <div className="text-muted-foreground">{withdrawal.bankDetails.accountNumber}</div>
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
