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
import { cn } from "@/lib/utils";

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
    expoPushToken?: string;
    followersCount?: number;
    shippingAddresses?: Array<{
      addressType?: string;
      country: string;
      state: string;
      city: string;
      addressLine1: string;
      addressLine2?: string;
      zipCode: string;
      _id?: string;
      firstName?: string;
      lastName?: string;
      phoneNumber?: string;
    }>;
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

  // Profile Edit states
  const [showEditProfileDialog, setShowEditProfileDialog] = useState(false);
  const [editFormData, setEditFormData] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    emailVerified: false,
    phoneVerified: false,
    isDisabled: false,
    isIdentityVerified: false
  });
  const [updatingProfile, setUpdatingProfile] = useState(false);

  useEffect(() => {
    if (buyerDetails?.buyer) {
      setEditFormData({
        firstName: buyerDetails.buyer.firstName || "",
        lastName: buyerDetails.buyer.lastName || "",
        phoneNumber: buyerDetails.buyer.phoneNumber || "",
        emailVerified: buyerDetails.buyer.emailVerified,
        phoneVerified: buyerDetails.buyer.phoneVerified,
        isDisabled: buyerDetails.buyer.isDisabled,
        isIdentityVerified: buyerDetails.buyer.isIdentityVerified
      });
    }
  }, [buyerDetails]);

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

  const handleUpdateProfile = async () => {
    try {
      setUpdatingProfile(true);
      await api.put(`/api/admin/buyers/${id}`, editFormData);
      toast({
        description: "Buyer profile updated successfully",
      });
      setShowEditProfileDialog(false);
      fetchBuyerDetails();
    } catch (err: any) {
      console.error("Error updating profile:", err);
      toast({
        variant: "destructive",
        description: err.response?.data?.message || "Failed to update profile",
      });
    } finally {
      setUpdatingProfile(false);
    }
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
        <h2 className="text-2xl text-white font-black tracking-tight">Buyer Profile</h2>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            className="border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900 rounded-xl"
            onClick={() => setShowEditProfileDialog(true)}
          >
            Edit
          </Button>
          <Button
            variant="destructive"
            className="bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500/20 rounded-xl"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" /> Delete
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
                <h3 className="text-xl font-black text-white tracking-tight">{buyer.firstName} {buyer.lastName}</h3>
                <p className="text-xs font-medium text-slate-500 tracking-wide uppercase mt-0.5">@{buyer.username}</p>
                <div className="mt-3 space-y-1">
                  <p className="text-sm text-slate-400">{buyer.email}</p>
                  <p className="text-sm text-slate-400">{buyer.phoneNumber}</p>
                </div>

                <div className="flex flex-wrap gap-1.5 mt-4">
                  <Badge className={cn(
                    "text-[10px] font-black uppercase tracking-wider rounded-full px-2.5 py-0.5",
                    buyer.isDisabled ? "bg-rose-500/10 text-rose-500 border-rose-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  )}>
                    {buyer.isDisabled ? "Disabled" : "Active"}
                  </Badge>
                  {buyer.emailVerified && (
                    <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-[10px] font-black uppercase tracking-wider rounded-full px-2.5 py-0.5">
                      Verified
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <Separator orientation="vertical" className="hidden md:block" />

            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-4 bg-slate-950/40 border-slate-800/60 rounded-2xl backdrop-blur-md">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Spent</span>
                  <div className="mt-2 flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-indigo-500" />
                    <span className="text-2xl font-black text-white tracking-tight">₦{metrics.totalSpent?.toLocaleString() || 0}</span>
                  </div>
                  <div className="mt-1 text-[10px] font-bold text-emerald-500/80 uppercase">
                    Balance: ₦{metrics.walletBalance?.toLocaleString() || 0}
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-slate-950/40 border-slate-800/60 rounded-2xl backdrop-blur-md">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Wishlist</span>
                  <div className="mt-2 flex items-center gap-2">
                    <Heart className="h-5 w-5 text-rose-500" />
                    <span className="text-2xl font-black text-white tracking-tight">{metrics.wishlistCount}</span>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-slate-950/40 border-slate-800/60 rounded-2xl backdrop-blur-md">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Chats</span>
                  <div className="mt-2 flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-blue-500" />
                    <span className="text-2xl font-black text-white tracking-tight">{metrics.conversationsCount}</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-4 text-xs font-black text-slate-500 uppercase tracking-widest">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/40 rounded-full border border-slate-800">
              Joined {formatDate(buyer.createdAt)}
            </div>
            {buyer.country && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/40 rounded-full border border-slate-800">
                {buyer.country}
              </div>
            )}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/40 rounded-full border border-slate-800">
              {metrics.walletTransactions.totalTransactions} Transactions
            </div>
          </div>

          {buyer.expoPushToken && (
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/50 col-span-2 md:col-span-4">
              <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded truncate max-w-[200px]" title={buyer.expoPushToken}>
                Push Token: {buyer.expoPushToken?.substring(0, 15)}...
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Information */}
      <Tabs defaultValue="orders" className="w-full">
        <TabsList className="grid grid-cols-5 mb-4">
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="addresses">Addresses</TabsTrigger>
          <TabsTrigger value="wishlist">Wishlist</TabsTrigger>
          <TabsTrigger value="wallet">Wallet</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Order History</CardTitle>
            </CardHeader>
            <CardContent>
              <OrdersList buyerId={id} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="addresses" className="space-y-4">
          <AddressList buyer={buyer} onUpdate={fetchBuyerDetails} />
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
              <div className="grid grid-cols-2 gap-6 mb-8 mt-2">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Balance</span>
                  <div className="text-2xl font-black text-white tracking-tight mt-1">{formatCurrency(metrics.walletBalance)}</div>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Activity</span>
                  <div className="text-2xl font-black text-white tracking-tight mt-1">{metrics.walletTransactions.totalTransactions}</div>
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
      </Tabs >

      {/* Wallet Operation Dialog */}
      < Dialog open={showWalletDialog} onOpenChange={setShowWalletDialog} >
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
      </Dialog >

      {/* Delete Buyer Dialog */}
      < Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog} >
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

      {/* Edit Profile Dialog */}
      <Dialog open={showEditProfileDialog} onOpenChange={setShowEditProfileDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Buyer Profile</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={editFormData.firstName}
                  onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={editFormData.lastName}
                  onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                value={editFormData.phoneNumber}
                onChange={(e) => setEditFormData({ ...editFormData, phoneNumber: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="emailVerified"
                  checked={editFormData.emailVerified}
                  onCheckedChange={(checked) => setEditFormData({ ...editFormData, emailVerified: checked })}
                />
                <Label htmlFor="emailVerified">Email Verified</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="phoneVerified"
                  checked={editFormData.phoneVerified}
                  onCheckedChange={(checked) => setEditFormData({ ...editFormData, phoneVerified: checked })}
                />
                <Label htmlFor="phoneVerified">Phone Verified</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isDisabled"
                  checked={editFormData.isDisabled}
                  onCheckedChange={(checked) => setEditFormData({ ...editFormData, isDisabled: checked })}
                />
                <Label htmlFor="isDisabled">Disabled</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isIdentityVerified"
                  checked={editFormData.isIdentityVerified}
                  onCheckedChange={(checked) => setEditFormData({ ...editFormData, isIdentityVerified: checked })}
                />
                <Label htmlFor="isIdentityVerified">ID Verified</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditProfileDialog(false)}>Cancel</Button>
            <Button onClick={handleUpdateProfile} disabled={updatingProfile}>
              {updatingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div >
  );
}

function OrdersList({ buyerId }: { buyerId: string | undefined }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const navigate = useNavigate();
  const limit = 10;

  useEffect(() => {
    if (buyerId) {
      fetchOrders();
    }
  }, [buyerId, page]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/admin/buyers/${buyerId}/orders`, {
        params: {
          page,
          limit,
        },
      });

      const { orders, totalPages, totalOrders } = response.data;
      setOrders(orders || []);
      setTotalPages(totalPages || 1);
      setTotalOrders(totalOrders || 0);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (e) {
      return dateString;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'delivered':
        return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
      case 'processing':
      case 'shipped':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400';
      case 'cancelled':
      case 'returned':
        return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400';
    }
  };

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : orders.length > 0 ? (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Seller</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order._id}>
                    <TableCell className="font-medium text-xs sm:text-sm">
                      #{order.order_id || order._id.substring(0, 8)}
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm">{formatDate(order.createdAt)}</TableCell>
                    <TableCell className="text-xs sm:text-sm">
                      {order.seller?.businessName || order.seller?.storeName || 'Unknown Seller'}
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm">
                      {order.items?.length || 0} items
                    </TableCell>
                    <TableCell className="font-medium text-xs sm:text-sm">
                      {formatCurrency(order.totalAmount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] sm:text-xs border-0 ${getStatusColor(order.status)}`}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/dashboard/orders/${order._id}`)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">
                Showing {orders.length} of {totalOrders} orders
              </p>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {page} of {totalPages}
                </span>
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
        <div className="text-center py-12 text-muted-foreground border rounded-md border-dashed">
          <p>No orders found for this buyer</p>
        </div>
      )}
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
      <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-6 mb-3">Transactions</h3>

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


function AddressList({ buyer, onUpdate }: { buyer: any; onUpdate: () => void }) {
  const [showDialog, setShowDialog] = useState(false);
  const [currentAddress, setCurrentAddress] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    country: "",
    zipCode: "",
    isDefault: false
  });
  const { toast } = useToast();
  const params = useParams();

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      phoneNumber: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      country: "",
      zipCode: "",
      isDefault: false
    });
    setCurrentAddress(null);
  };

  const handleEdit = (address: any) => {
    setCurrentAddress(address);
    setFormData({
      firstName: address.firstName || "",
      lastName: address.lastName || "",
      phoneNumber: address.phoneNumber || "",
      addressLine1: address.addressLine1 || "",
      addressLine2: address.addressLine2 || "",
      city: address.city || "",
      state: address.state || "",
      country: address.country || "",
      zipCode: address.zipCode || "",
      isDefault: address.isDefault || false
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!formData.addressLine1 || !formData.city || !formData.country) {
      toast({ variant: "destructive", description: "Please fill in required fields" });
      return;
    }

    setLoading(true);
    try {
      let updatedAddresses = [...(buyer?.shippingAddresses || [])];

      if (currentAddress) {
        // Update existing
        updatedAddresses = updatedAddresses.map(addr =>
          addr._id === currentAddress._id ? { ...addr, ...formData } : addr
        );
      } else {
        // Add new
        updatedAddresses.push(formData);
      }

      await api.put(`/api/admin/buyers/${params.id}`, { shippingAddresses: updatedAddresses });
      toast({ description: "Address saved successfully" });
      setShowDialog(false);
      resetForm();
      onUpdate();
    } catch (error: any) {
      toast({ variant: "destructive", description: error.response?.data?.message || "Failed to save address" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (addressId: string) => {
    if (!confirm("Are you sure you want to delete this address?")) return;

    try {
      const updatedAddresses = buyer?.shippingAddresses?.filter((a: any) => a._id !== addressId) || [];
      await api.put(`/api/admin/buyers/${params.id}`, { shippingAddresses: updatedAddresses });
      toast({ description: "Address deleted successfully" });
      onUpdate();
    } catch (error: any) {
      toast({ variant: "destructive", description: error.response?.data?.message || "Failed to delete address" });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-medium">Shipping Addresses</CardTitle>
        <Button size="sm" onClick={() => { resetForm(); setShowDialog(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Add Address
        </Button>
      </CardHeader>
      <CardContent>
        {buyer?.shippingAddresses && buyer.shippingAddresses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {buyer.shippingAddresses.map((address: any, index: number) => (
              <div key={index} className="border rounded-lg p-4 relative">
                <div className="absolute top-2 right-2 flex gap-1">
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEdit(address)}>
                    <CreditCard className="h-3 w-3" /> {/* Edit Icon placeholder, using CreditCard for now or change to Edit2 if imported */}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleDelete(address._id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                <div className="text-sm font-medium mb-1">{address.firstName} {address.lastName}</div>
                <div className="text-xs text-muted-foreground space-y-0.5">
                  <p>{address.addressLine1}</p>
                  {address.addressLine2 && <p>{address.addressLine2}</p>}
                  <p>{address.city}, {address.state} {address.zipCode}</p>
                  <p>{address.country}</p>
                  {address.phoneNumber && <p className="mt-1">{address.phoneNumber}</p>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground text-sm border-dashed border rounded-md">
            No addresses found
          </div>
        )}

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{currentAddress ? 'Edit Address' : 'Add New Address'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Address Line 1</Label>
                <Input value={formData.addressLine1} onChange={e => setFormData({ ...formData, addressLine1: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Address Line 2</Label>
                <Input value={formData.addressLine2} onChange={e => setFormData({ ...formData, addressLine2: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>State</Label>
                  <Input value={formData.state} onChange={e => setFormData({ ...formData, state: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Input value={formData.country} onChange={e => setFormData({ ...formData, country: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Zip Code</Label>
                  <Input value={formData.zipCode} onChange={e => setFormData({ ...formData, zipCode: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input value={formData.phoneNumber} onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Address
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}


export default BuyerDetail;
