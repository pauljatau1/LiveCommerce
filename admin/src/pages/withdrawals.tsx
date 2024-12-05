import { useState } from "react";
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
import { Check, X, Eye, Loader2 } from "lucide-react";

interface Withdrawal {
  id: string;
  seller: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  requestDate: string;
  processedDate?: string;
  paymentMethod: string;
  accountDetails: string;
}

const sampleWithdrawals: Withdrawal[] = [
  {
    id: "WTH001",
    seller: "TechStore",
    amount: 1500.00,
    status: 'pending',
    requestDate: "2024-03-20T10:30:00",
    paymentMethod: "Bank Transfer",
    accountDetails: "****4589"
  },
  {
    id: "WTH002",
    seller: "FashionHub",
    amount: 2750.50,
    status: 'approved',
    requestDate: "2024-03-19T15:45:00",
    processedDate: "2024-03-20T09:15:00",
    paymentMethod: "PayPal",
    accountDetails: "fashion@email.com"
  },
  {
    id: "WTH003",
    seller: "HomeGoods",
    amount: 950.25,
    status: 'rejected',
    requestDate: "2024-03-18T12:20:00",
    processedDate: "2024-03-19T14:30:00",
    paymentMethod: "Bank Transfer",
    accountDetails: "****7823"
  },
  {
    id: "WTH004",
    seller: "ElectroMart",
    amount: 3200.75,
    status: 'pending',
    requestDate: "2024-03-20T08:45:00",
    paymentMethod: "Bank Transfer",
    accountDetails: "****1234"
  }
];

function Withdrawals() {
  const [withdrawals] = useState<Withdrawal[]>(sampleWithdrawals);
  const [processingId, setProcessingId] = useState<string | null>(null);

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
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const handleProcess = async (id: string, status: 'approve' | 'reject') => {
    setProcessingId(id);
    console.log(status)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setProcessingId(null);
  };

  const getTotalAmount = (status: 'pending' | 'approved' | 'rejected') => {
    return withdrawals
      .filter(w => w.status === status)
      .reduce((acc, curr) => acc + curr.amount, 0);
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
            <span className="text-muted-foreground text-sm">Approved Today</span>
            <span className="text-2xl font-bold mt-2">
              {formatCurrency(getTotalAmount('approved'))}
            </span>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex flex-col">
            <span className="text-muted-foreground text-sm">Total Requests</span>
            <span className="text-2xl font-bold mt-2">{withdrawals.length}</span>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex flex-col">
            <span className="text-muted-foreground text-sm">Pending Requests</span>
            <span className="text-2xl font-bold mt-2">
              {withdrawals.filter(w => w.status === 'pending').length}
            </span>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Seller</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Payment Method</TableHead>
              <TableHead>Account</TableHead>
              <TableHead>Request Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {withdrawals.map((withdrawal) => (
              <TableRow key={withdrawal.id}>
                <TableCell className="font-mono text-xs">
                  {withdrawal.id}
                </TableCell>
                <TableCell className="font-medium">{withdrawal.seller}</TableCell>
                <TableCell>{formatCurrency(withdrawal.amount)}</TableCell>
                <TableCell>{withdrawal.paymentMethod}</TableCell>
                <TableCell>{withdrawal.accountDetails}</TableCell>
                <TableCell>{formatDate(withdrawal.requestDate)}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    withdrawal.status === 'approved' 
                      ? 'bg-green-100 text-green-800'
                      : withdrawal.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    {withdrawal.status === 'pending' && (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-green-500"
                          onClick={() => handleProcess(withdrawal.id, 'approve')}
                          disabled={processingId === withdrawal.id}
                        >
                          {processingId === withdrawal.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-red-500"
                          onClick={() => handleProcess(withdrawal.id, 'reject')}
                          disabled={processingId === withdrawal.id}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

export default Withdrawals;
