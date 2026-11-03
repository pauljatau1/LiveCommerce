import React, { useState, useEffect } from 'react'
import { Card } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DollarSign,
  ArrowUp,
  ArrowDown,
  ArrowUpRight,
  CreditCard,
  Wallet,
  Calendar,
  Filter,
  Download,
  Banknote,
  PiggyBank,
  Loader2,
  Search
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { api } from "@/api/axios"
import { useToast } from "@/hooks/use-toast"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { DateRange } from "react-day-picker"
import { format } from "date-fns"

// Transaction interface matching API response
interface Transaction {
  id: string;
  reference: string;
  type: 'inflow' | 'outflow';
  category: 'order' | 'withdrawal' | 'refund' | 'fee' | 'other';
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  sender: string;
  recipient: string;
  description: string;
  date: string;
  sellerId?: string;
}

// Financial summary interface
interface FinancialSummary {
  totalInflow: number;
  totalOutflow: number;
  netBalance: number;
  pendingAmount: number;
}

function Payments() {
  // States for transactions and loading
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<FinancialSummary>({
    totalInflow: 0,
    totalOutflow: 0,
    netBalance: 0,
    pendingAmount: 0
  });
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0
  });
  
  // States for filtering
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [reference, setReference] = useState('');
  
  const { toast } = useToast();

  // Fetch financial summary
  const fetchFinancialSummary = async () => {
    try {
      // Build query params for date range
      let queryParams = '';
      if (dateRange && dateRange.from) {
        queryParams += `startDate=${format(dateRange.from, 'yyyy-MM-dd')}`;
      }
      if (dateRange && dateRange.to) {
        queryParams += queryParams ? '&' : '';
        queryParams += `endDate=${format(dateRange.to, 'yyyy-MM-dd')}`;
      }
      
      const url = `/api/admin/financial/summary${queryParams ? `?${queryParams}` : ''}`;
      const response = await api.get(url);
      
      setSummary(response.data);
    } catch (error) {
      console.error("Error fetching financial summary:", error);
      toast({
        title: "Error",
        description: "Failed to fetch financial summary",
        variant: "destructive"
      });
    }
  };

  // Fetch transactions with filters
  const fetchTransactions = async () => {
    setLoading(true);
    try {
      // Build query parameters based on filters
      let queryParams = `page=${pagination.page}&limit=${pagination.limit}`;
      
      if (typeFilter && typeFilter !== 'all') {
        queryParams += `&type=${typeFilter}`;
      }
      
      if (statusFilter && statusFilter !== 'all') {
        queryParams += `&status=${statusFilter}`;
      }
      
      if (dateRange && dateRange.from) {
        queryParams += `&startDate=${format(dateRange.from, 'yyyy-MM-dd')}`;
      }
      
      if (dateRange && dateRange.to) {
        queryParams += `&endDate=${format(dateRange.to, 'yyyy-MM-dd')}`;
      }
      
      if (reference) {
        queryParams += `&reference=${reference}`;
      }
      
      const response = await api.get(`/api/admin/financial/transactions?${queryParams}`);
      
      // Ensure transactions is set to an empty array if response.data.transactions is undefined
      setTransactions(response.data.transactions || []);
      setPagination({
        ...pagination,
        total: response.data.total || 0
      });
    } catch (error) {
      console.error("Error fetching transactions:", error);
      // Set transactions to an empty array in case of error
      setTransactions([]);
      toast({
        title: "Error",
        description: "Failed to fetch transactions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Effect to fetch data when component mounts or filters change
  useEffect(() => {
    fetchFinancialSummary();
    fetchTransactions();
  }, [pagination.page, pagination.limit, typeFilter, statusFilter, dateRange, reference]);

  // Handler for date range changes
  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range || { from: undefined, to: undefined });
    // Reset to first page when filters change
    setPagination({
      ...pagination,
      page: 1
    });
  };

  // Handler for export
  const handleExport = async () => {
    try {
      toast({
        title: "Exporting data",
        description: "Preparing financial data for export...",
      });
      
      // Build query params similar to fetchTransactions
      let queryParams = `export=true`;
      
      if (typeFilter && typeFilter !== 'all') {
        queryParams += `&type=${typeFilter}`;
      }
      
      if (statusFilter && statusFilter !== 'all') {
        queryParams += `&status=${statusFilter}`;
      }
      
      if (dateRange && dateRange.from) {
        queryParams += `&startDate=${format(dateRange.from, 'yyyy-MM-dd')}`;
      }
      
      if (dateRange && dateRange.to) {
        queryParams += `&endDate=${format(dateRange.to, 'yyyy-MM-dd')}`;
      }
      
      if (reference) {
        queryParams += `&reference=${reference}`;
      }
      
      // Using axios directly to handle blob response
      const response = await api.get(`/api/admin/financial/transactions?${queryParams}`, {
        responseType: 'blob'
      });
      
      // Create a download link and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `financial-transactions-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Export complete",
        description: "Your financial data has been exported successfully",
      });
    } catch (error) {
      console.error("Error exporting transactions:", error);
      toast({
        title: "Export failed",
        description: "Failed to export financial data",
        variant: "destructive"
      });
    }
  };

  // Helper functions for formatting and display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: Transaction['status']) => {
    const colors = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800'
    };
    return colors[status];
  };

  const getTypeColor = (type: Transaction['type']) => {
    return type === 'inflow' 
      ? 'text-green-500' 
      : 'text-red-500';
  };

  const getTypeIcon = (type: Transaction['type']) => {
    return type === 'inflow' 
      ? <ArrowUpRight className="h-4 w-4 mr-1" /> 
      : <ArrowDown className="h-4 w-4 mr-1" />;
  };

  const getCategoryIcon = (category: Transaction['category']) => {
    const icons = {
      order: <CreditCard className="h-5 w-5" />,
      withdrawal: <Wallet className="h-5 w-5" />,
      refund: <ArrowDown className="h-5 w-5" />,
      fee: <DollarSign className="h-5 w-5" />,
      other: <Banknote className="h-5 w-5" />
    };
    return icons[category];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">Financial Transactions</h2>
          <p className="text-muted-foreground">Monitor all financial activities on the platform</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => {
            // Reset all filters
            setTypeFilter('all');
            setStatusFilter('all');
            setDateRange(undefined);
            setReference('');
            setPagination({ ...pagination, page: 1 });
          }}>
            <Filter className="h-4 w-4 mr-2" />
            Reset Filters
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-lg">
              <ArrowUpRight className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Total Inflow</p>
              <h3 className="text-2xl font-bold">{formatCurrency(summary.totalInflow)}</h3>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-lg">
              <ArrowDown className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Total Outflow</p>
              <h3 className="text-2xl font-bold">{formatCurrency(summary.totalOutflow)}</h3>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-lg">
              <PiggyBank className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Net Balance</p>
              <h3 className="text-2xl font-bold">{formatCurrency(summary.netBalance)}</h3>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-lg">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Pending Amount</p>
              <h3 className="text-2xl font-bold">{formatCurrency(summary.pendingAmount)}</h3>
            </div>
          </div>
        </Card>
      </div>

      {/* Advanced Filters */}
      <Card className="p-6">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Transaction Type</label>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Transactions</SelectItem>
                <SelectItem value="inflow">Inflows</SelectItem>
                <SelectItem value="outflow">Outflows</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">Date Range</label>
            <DateRangePicker
              value={dateRange}
              onChange={handleDateRangeChange}
            />
          </div>
          
          <div className="space-y-2 md:col-span-4">
            <label className="text-sm font-medium">Reference Search</label>
            <div className="flex gap-2">
              <Input
                placeholder="Search by reference..."
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
              <Button 
                variant="secondary"
                onClick={() => {
                  setPagination({ ...pagination, page: 1 });
                  fetchTransactions();
                }}
              >
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Transactions Table */}
      <Card className="p-6">
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : transactions && transactions.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Sender</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-mono text-xs">
                      {transaction.reference}
                    </TableCell>
                    <TableCell>
                      <div className={`flex items-center ${getTypeColor(transaction.type)}`}>
                        {getTypeIcon(transaction.type)}
                        <span className="capitalize">{transaction.type}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-gray-800">
                          {getCategoryIcon(transaction.category)}
                        </div>
                        <span className="capitalize">{transaction.category}</span>
                      </div>
                    </TableCell>
                    <TableCell className={getTypeColor(transaction.type)}>
                      {transaction.type === 'inflow' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </TableCell>
                    <TableCell>{transaction.sender}</TableCell>
                    <TableCell>{transaction.recipient}</TableCell>
                    <TableCell>{formatDate(transaction.date)}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(transaction.status)}`}>
                        {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {transaction.description}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                Showing {((pagination.page - 1) * pagination.limit) + 1}-
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} transactions
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={pagination.page * pagination.limit >= pagination.total}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="py-10 text-center">
            <p className="text-muted-foreground">No transactions found matching your filters.</p>
          </div>
        )}
      </Card>
    </div>
  )
}

export default Payments
