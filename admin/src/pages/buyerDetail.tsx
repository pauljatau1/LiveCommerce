import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/api/axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Loader2, CreditCard, MessageSquare, Heart, AlertTriangle, Plus, Minus, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
// import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
// import { Checkbox } from "@/components/ui/checkbox";

interface BuyerDetails {
  buyer: {
    _id: string;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    country: string;
    phoneNumber: string;
    emailVerified: boolean;
    phoneVerified: boolean;
    isDisabled: boolean;
    createdAt: string;
    selectedCategories: Array<{
      name: string;
      subCategories: Array<{
        name: string;
        _id: string;
      }>;
    }>;
    identityDocument?: {
      url?: string;
      status: 'pending' | 'verified' | 'rejected';
      uploadedAt?: string;
    };
    isIdentityVerified: boolean;
    profilePhoto?: string;
  };
  metrics: {
    ordersCount: number;
    totalSpent: number;
    pendingOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    postsCount: number;
    wishlistCount: number;
    conversationsCount: number;
    walletBalance: number;
    walletTransactions: {
      totalTransactions: number;
      creditTransactions: number;
      debitTransactions: number;
      totalCredit: number;
      totalDebit: number;
    };
  };
  recentActivity: {
    orders: Array<{
      _id: string;
      orderNumber: string;
      order_id: string;
      totalAmount: number;
      status: string;
      createdAt: string;
      items: number;
    }>;
    wishlist: Array<{
      _id: string;
      name: string;
      price: number;
      image: string;
      addedAt: string;
    }>;
    conversations: Array<{
      _id: string;
      seller: {
        _id: string;
        name: string;
      };
      lastMessageAt: string;
    }>;
  };
}

function BuyerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [buyerDetails, setBuyerDetails] = useState<BuyerDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // Delete account states
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [hardDelete, setHardDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Wallet operation states
  const [showWalletDialog, setShowWalletDialog] = useState(false);
  const [walletOperation, setWalletOperation] = useState<'add' | 'deduct'>('add');
  const [walletAmount, setWalletAmount] = useState("");
  const [walletReason, setWalletReason] = useState("");
  const [processingWallet, setProcessingWallet] = useState(false);

  useEffect(() => {
    fetchBuyerDetails();
  }, [id]);

  const fetchBuyerDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/admin/buyers/${id}/details`);
      setBuyerDetails(response.data.data);
    } catch (err) {
      console.error("Error fetching buyer details:", err);
      setError("Failed to load buyer details");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "NGN",
    }).format(amount);
  };

  // Handle buyer deletion (soft by default, hard if toggled)
  const handleDeleteBuyer = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await api.delete(`/api/admin/buyers/${id}`, { params: { hard: hardDelete } });
      toast({ description: hardDelete ? "Buyer hard-deleted successfully" : "Buyer deleted successfully" });
      setShowDeleteDialog(false);
      navigate(-1);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || "Failed to delete buyer";
      toast({ variant: "destructive", description: errorMessage });
    } finally {
      setDeleting(false);
    }
  };

  const handleWalletOperation = (operation: 'add' | 'deduct') => {
    setWalletOperation(operation);
    setWalletAmount("");
    setWalletReason("");
    setShowWalletDialog(true);
  };

  const executeWalletOperation = async () => {
    if (!id || !walletAmount || isNaN(parseFloat(walletAmount)) || parseFloat(walletAmount) <= 0) {
      toast({
        variant: "destructive",
        description: "Please enter a valid amount",
      });
      return;
    }

    setProcessingWallet(true);
    try {
      const endpoint = walletOperation === 'add' 
        ? `/api/admin/buyers/${id}/wallet/add`
        : `/api/admin/buyers/${id}/wallet/deduct`;
      
      await api.post(endpoint, {
        amount: parseFloat(walletAmount),
        reason: walletReason || `Admin ${walletOperation === 'add' ? 'added' : 'deducted'} funds`,
      });

      toast({
        description: `Successfully ${walletOperation === 'add' ? 'added to' : 'deducted from'} wallet`,
      });

      // Refresh buyer details
      await fetchBuyerDetails();
      setShowWalletDialog(false);
    } catch (err: any) {
      console.error(`Error ${walletOperation}ing wallet funds:`, err);
      const errorMessage = err.response?.data?.message || `Failed to ${walletOperation} funds`;
      toast({
        variant: "destructive",
        description: errorMessage,
      });
    } finally {
      setProcessingWallet(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !buyerDetails) {
    return (
      <div className="text-center text-destructive p-4">
        <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
        <p>{error || "Failed to load buyer details"}</p>
        <Button
          className="mt-4"
          variant="outline"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Go Back
        </Button>
      </div>
    );
  }

  const { buyer, metrics, recentActivity } = buyerDetails;
  const getInitials = (firstName: string, lastName: string) => {
    return (firstName?.[0] || "") + (lastName?.[0] || "");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="h-9 w-9 text-white"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-2xl text-white font-medium">Buyer Profile</h2>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" /> Delete Buyer
          </Button>
        </div>
      </div>

      {/* Buyer Overview Card */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Profile Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex flex-row md:flex-col gap-4 items-center md:items-start md:w-64">
              <Avatar className="h-16 w-16">
                {buyer.profilePhoto ? (
                  <AvatarImage src={buyer.profilePhoto} alt={`${buyer.firstName} ${buyer.lastName}`} />
                ) : (
                  <AvatarFallback className="text-base">
                    {getInitials(buyer.firstName, buyer.lastName)}
                  </AvatarFallback>
                )}
              </Avatar>
              
              <div>
                <h3 className="text-lg font-medium">{buyer.firstName} {buyer.lastName}</h3>
                <p className="text-sm text-muted-foreground">@{buyer.username}</p>
                <p className="text-sm">{buyer.email}</p>
                <p className="text-sm">{buyer.phoneNumber}</p>
                
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <Badge variant={buyer.isDisabled ? "destructive" : "outline"} className="text-xs">
                    {buyer.isDisabled ? "Disabled" : "Active"}
                  </Badge>
                  <Badge variant={buyer.emailVerified ? "secondary" : "outline"} className="text-xs">
                    {buyer.emailVerified ? "Email Verified" : "Email Unverified"}
                  </Badge>
                  <Badge variant={buyer.isIdentityVerified ? "secondary" : "outline"} className="text-xs">
                    {buyer.isIdentityVerified ? "ID Verified" : "ID Unverified"}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator orientation="vertical" className="hidden md:block" />

            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                {/* <div className="flex items-center text-sm text-muted-foreground gap-1.5">
                  <ShoppingBag className="h-3.5 w-3.5" />
                  <span>Orders</span>
                </div>
                <div className="text-xl font-medium">{metrics.ordersCount}</div> */}
                {/* <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Completed</span>
                    <span>{metrics.completedOrders}/{metrics.ordersCount}</span>
                  </div>
                  <Progress value={(metrics.completedOrders / metrics.ordersCount) * 100 || 0} className="h-1.5" />
                </div> */}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center text-sm text-muted-foreground gap-1.5">
                  <CreditCard className="h-3.5 w-3.5" />
                  <span>Spent</span>
                </div>
                <div className="text-xl font-medium">{formatCurrency(metrics.totalSpent)}</div>
                <div className="text-xs text-muted-foreground">
                  Balance: {formatCurrency(metrics.walletBalance)}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center text-sm text-muted-foreground gap-1.5">
                  <Heart className="h-3.5 w-3.5" />
                  <span>Wishlist</span>
                </div>
                <div className="text-xl font-medium">{metrics.wishlistCount}</div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center text-sm text-muted-foreground gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>Conversations</span>
                </div>
                <div className="text-xl font-medium">{metrics.conversationsCount}</div>
              </div>

              <div className="col-span-2 md:col-span-4 text-xs text-muted-foreground">
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  <p>Joined {formatDate(buyer.createdAt)}</p>
                  <p>Country: {buyer.country || "Not specified"}</p>
                  <p>Transactions: {metrics.walletTransactions.totalTransactions}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Information */}
      <Tabs defaultValue="orders" className="w-full">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="wishlist">Wishlist</TabsTrigger>
          <TabsTrigger value="wallet">Wallet</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {/* <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-lg font-medium text-green-600 dark:text-green-400">{metrics.completedOrders}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-lg font-medium text-amber-600 dark:text-amber-400">{metrics.pendingOrders}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Cancelled</p>
                  <p className="text-lg font-medium text-red-600 dark:text-red-400">{metrics.cancelledOrders}</p>
                </div>
              </div> */}

              <h3 className="text-sm font-medium mb-3">Recent Orders</h3>
              {recentActivity.orders.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order #</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Amount</TableHead>
                       
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentActivity.orders.map((order) => (
                        <TableRow key={order._id}>
                          <TableCell className="font-medium">{order.order_id}</TableCell>
                          <TableCell>{formatDate(order.createdAt)}</TableCell>
                          <TableCell>{order.items}</TableCell>
                          <TableCell>{formatCurrency(order.totalAmount)}</TableCell>
                          
                          <TableCell>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => navigate(`/dashboard/order-detail/${order._id}`)}
                            >
                              View Order
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  No orders found for this buyer
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wishlist" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Wishlist Items ({metrics.wishlistCount})</CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivity.wishlist.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {recentActivity.wishlist.map((item) => (
                    <div key={item._id} className="border rounded-md overflow-hidden">
                      <div className="aspect-square bg-muted">
                        {item.image && (
                          <img 
                            src={item.image} 
                            alt={item.name} 
                            className="w-full h-full object-cover" 
                          />
                        )}
                      </div>
                      <div className="p-2">
                        <h4 className="font-medium text-xs line-clamp-1">{item.name}</h4>
                        <p className="text-xs text-muted-foreground">{formatDate(item.addedAt)}</p>
                        <p className="font-medium text-sm mt-0.5">{formatCurrency(item.price)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  No wishlist items found for this buyer
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wallet" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Wallet Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Current Balance</p>
                  <p className="text-lg font-medium">{formatCurrency(metrics.walletBalance)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Transactions</p>
                  <p className="text-lg font-medium">{metrics.walletTransactions.totalTransactions}</p>
                </div>
              </div>

              <div className="flex gap-2 mb-6">
                <Button 
                  variant="outline" 
                  onClick={() => handleWalletOperation('add')}
                  className="flex-1"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Funds
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleWalletOperation('deduct')}
                  className="flex-1"
                >
                  <Minus className="h-4 w-4 mr-2" />
                  Deduct Funds
                </Button>
              </div>

              <h3 className="text-sm font-medium mb-3">Transaction Summary</h3>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="border rounded-md p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-muted-foreground">Credits</p>
                      <p className="text-lg font-medium text-green-600 dark:text-green-400">
                        {metrics.walletTransactions.creditTransactions}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="text-sm font-medium text-green-600 dark:text-green-400">
                        {formatCurrency(metrics.walletTransactions.totalCredit)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="border rounded-md p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-muted-foreground">Debits</p>
                      <p className="text-lg font-medium text-red-600 dark:text-red-400">
                        {metrics.walletTransactions.debitTransactions}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="text-sm font-medium text-red-600 dark:text-red-400">
                        {formatCurrency(metrics.walletTransactions.totalDebit)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Transactions List */}
              <TransactionsList buyerId={id} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Selected Categories</CardTitle>
            </CardHeader>
            <CardContent>
              {buyer.selectedCategories && buyer.selectedCategories.length > 0 ? (
                <div className="space-y-4">
                  {buyer.selectedCategories.map((category, index) => (
                    <div key={index} className="space-y-2">
                      <h4 className="text-sm font-medium">{category.name}</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {category.subCategories.map((subCategory) => (
                          <Badge key={subCategory._id} variant="outline" className="text-xs">
                            {subCategory.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  No categories selected by this buyer
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Wallet Operation Dialog */}
      <Dialog open={showWalletDialog} onOpenChange={setShowWalletDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {walletOperation === 'add' ? 'Add Funds to Wallet' : 'Deduct Funds from Wallet'}
            </DialogTitle>
            <DialogDescription>
              {walletOperation === 'add' 
                ? 'Enter the amount to add to the buyer\'s wallet.'
                : 'Enter the amount to deduct from the buyer\'s wallet.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={walletAmount}
                onChange={(e) => setWalletAmount(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reason">Reason (Optional)</Label>
              <Textarea
                id="reason"
                placeholder={`Reason for ${walletOperation === 'add' ? 'adding' : 'deducting'} funds...`}
                value={walletReason}
                onChange={(e) => setWalletReason(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWalletDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant={walletOperation === 'add' ? 'default' : 'destructive'}
              onClick={executeWalletOperation}
              disabled={processingWallet || !walletAmount || isNaN(parseFloat(walletAmount)) || parseFloat(walletAmount) <= 0}
            >
              {processingWallet && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {walletOperation === 'add' ? 'Add Funds' : 'Deduct Funds'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Buyer Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Buyer Account</DialogTitle>
            <DialogDescription>
              This action will {hardDelete ? "permanently remove the buyer from the database" : "disable the buyer and anonymize their data"}. This cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="flex items-center gap-3">
              <Switch id="hard-delete" checked={hardDelete} onCheckedChange={setHardDelete} />
              <Label htmlFor="hard-delete">Hard delete (permanent)</Label>
            </div>
            <p className="text-xs text-muted-foreground">
              {hardDelete
                ? "Hard delete will remove the buyer record and purge basic references from sellers. Orders/messages remain for historical integrity."
                : "Soft delete will disable the account and anonymize PII. You can reuse their email/username."}
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteBuyer} disabled={deleting}>
              {deleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />} 
              {hardDelete ? "Hard Delete" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TransactionsList({ buyerId }: { buyerId: string | undefined }) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const limit = 10;

  useEffect(() => {
    if (buyerId) {
      fetchTransactions();
    }
  }, [buyerId, page]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/admin/buyers/${buyerId}/transactions`, {
        params: {
          page,
          limit,
        },
      });
      
      const { data, pagination } = response.data;
      setTransactions(data.transactions || []);
      setTotalPages(pagination.pages || 1);
      setTotalTransactions(pagination.total || 0);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "NGN",
    }).format(amount);
  };

  const getTransactionStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="secondary">Completed</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTransactionTypeBadge = (type: string) => {
    switch (type) {
      case 'credit':
        return <Badge className="bg-green-600">Credit</Badge>;
      case 'debit':
        return <Badge className="bg-red-600">Debit</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium mt-6 mb-3">Transaction History</h3>
      
      {loading ? (
        <div className="flex justify-center p-4">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : transactions.length > 0 ? (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction._id}>
                    <TableCell>{formatDate(transaction.createdAt)}</TableCell>
                    <TableCell>{getTransactionTypeBadge(transaction.type)}</TableCell>
                    <TableCell className={transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}>
                      {formatCurrency(transaction.amount)}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {transaction.description}
                    </TableCell>
                    <TableCell>{getTransactionStatusBadge(transaction.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {transactions.length} of {totalTransactions} transactions
              </p>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-6 text-muted-foreground text-sm border rounded-md">
          No transactions found for this buyer
        </div>
      )}
    </div>
  );
}

export default BuyerDetail; 