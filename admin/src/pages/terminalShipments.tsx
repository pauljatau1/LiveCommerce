import React, { useEffect, useState } from 'react';
import { api } from '@/api/axios';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from '@/components/layouts/LoadingSpinner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X, Loader2, Trash2, XCircle, Eye, Truck, Package2, Webhook, Plus, Settings, Power, PowerOff } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

// --- INTERFACES ---

interface Shipment {
  _id: string;
  shipment_id: string;
  tracking_number: string;
  status: 'cancelled' | 'confirmed' | 'delivered' | 'draft' | 'in-transit' | 'pending';
  carrier_slug: string | null;
  created_at: string;
  reference: string;
  tracking_url: string;
}

interface ApiShipmentSource extends Omit<Shipment, '_id'> {}

interface ApiShipment {
  _id: string;
  _source: ApiShipmentSource;
}

interface ShipmentsApiResponseData {
  shipments: ApiShipment[];
  currentPage: number;
  totalPages: number;
  total: number;
}

interface FullApiResponse {
    status: boolean;
    message: string;
    data: ShipmentsApiResponseData;
}

interface ShipmentsPageData {
  shipments: Shipment[];
  currentPage: number;
  totalPages: number;
  total: number;
}

interface Address {
    first_name: string;
    last_name: string;
    line1: string;
    city: string;
    state: string;
    country: string;
    email: string;
    phone: string;
}

interface ParcelItem {
    name: string;
    quantity: number;
    value: number;
    currency: string;
    weight: number;
}

interface Parcel {
    description: string;
    total_weight: number;
    weight_unit: string;
    items: ParcelItem[];
}

interface ShipmentEvent {
    status: string;
    created_at: string;
    description: string;
    location: string;
}

interface DetailedShipment {
  _id: string;
  shipment_id: string;
  reference: string;
  status: string;
  created_at: string;
  updated_at: string;
  tracking_number: string;
  tracking_url: string;
  shipment_cost: number;
  shipment_cost_currency: string;
  address_to: Address;
  address_from: Address;
  carrier: { name: string; logo: string; };
  parcel: Parcel;
  events: ShipmentEvent[];
}

interface GetShipmentApiResponse {
    status: boolean;
    message: string;
    data: DetailedShipment;
}

// --- WEBHOOK INTERFACES ---

interface Webhook {
  _id: string;
  webhook_id: string;
  name: string;
  active: boolean;
  events: string[];
  live: boolean;
  url: string;
  user: string;
  created_at: string;
  updated_at: string;
}

interface WebhookApiResponse {
  status: boolean;
  message: string;
  data: Webhook;
}

interface WebhookListResponse {
  status: boolean;
  message: string;
  data: {
    webhooks: Webhook[];
    pagination: {
      page: number;
      perPage: number;
      total: number;
      totalPages: number;
      currentPage: number;
    };
  };
}

interface CreateWebhookData {
  name: string;
  active: boolean;
  events: string[];
  live: boolean;
  url: string;
}


// --- COMPONENT ---

const TerminalShipments: React.FC = () => {
  const [shipmentsData, setShipmentsData] = useState<ShipmentsPageData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [detailedShipment, setDetailedShipment] = useState<DetailedShipment | null>(null);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);

  const [shipmentToDelete, setShipmentToDelete] = useState<Shipment | null>(null);
  const [shipmentToCancel, setShipmentToCancel] = useState<Shipment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    start_date: "",
    end_date: "",
  });
  const [searchInput, setSearchInput] = useState("");

  // Webhook state
  const [activeTab, setActiveTab] = useState("shipments");
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [webhookLoading, setWebhookLoading] = useState(false);
  const [webhookDialog, setWebhookDialog] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null);
  const [webhookToDelete, setWebhookToDelete] = useState<Webhook | null>(null);
  const [isWebhookSubmitting, setIsWebhookSubmitting] = useState(false);
  const [webhookForm, setWebhookForm] = useState<CreateWebhookData>({
    name: "",
    active: true,
    events: [],
    live: false,
    url: "",
  });
  const [webhookEvents, setWebhookEvents] = useState<string[]>([
    "shipment.created",
    "shipment.updated",
    "shipment.cancelled",
    "shipment.in-transit",
    "shipment.delivered",
    "packaging.created",
    "packaging.updated",
  ]);

  const fetchShipments = async (page: number, isNewSearch = false) => {
    if (isNewSearch) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        perPage: '15',
        orderBy: '-created_at'
      });

      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      const response = await api.get<FullApiResponse>(`/api/v2/admin/shipments`, { params });
      const apiData = response.data.data;
      
      const transformedShipments: Shipment[] = apiData.shipments
        .map(s => ({ ...s._source, _id: s._id }))
        .filter(s => s.status !== 'draft');
      
      if (isNewSearch || page === 1) {
        setShipmentsData({
          shipments: transformedShipments,
          currentPage: apiData.currentPage,
          totalPages: apiData.totalPages,
          total: apiData.total,
        });
      } else {
        setShipmentsData(prevData => ({
          shipments: [...(prevData?.shipments || []), ...transformedShipments],
          currentPage: apiData.currentPage,
          totalPages: apiData.totalPages,
          total: apiData.total,
        }));
      }

    } catch (error) {
      console.error("Failed to fetch shipments", error);
      toast.error("Failed to fetch shipments. Please try again.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const fetchShipmentDetails = async (shipmentId: string) => {
    setIsFetchingDetails(true);
    try {
      const response = await api.get<GetShipmentApiResponse>(`/api/v2/admin/shipments/${shipmentId}`);
      setDetailedShipment(response.data.data);
    } catch (error) {
      toast.error("Failed to fetch shipment details.");
      setSelectedShipment(null);
    } finally {
      setIsFetchingDetails(false);
    }
  };
  
  useEffect(() => {
    fetchShipments(currentPage, true);
  }, [filters]);

  useEffect(() => {
    if (currentPage > 1) {
      fetchShipments(currentPage);
    }
  }, [currentPage]);

  useEffect(() => {
    if (selectedShipment) {
      fetchShipmentDetails(selectedShipment.shipment_id);
    } else {
      setDetailedShipment(null);
    }
  }, [selectedShipment]);

  const handleDelete = async () => {
    if (!shipmentToDelete) return;
    setIsSubmitting(true);
    try {
      await api.delete('/api/v2/admin/shipments', { data: { shipment_id: shipmentToDelete.shipment_id } });
      toast.success("Shipment deleted successfully.");
      setShipmentToDelete(null);
      fetchShipments(1, true); // Refresh list
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete shipment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!shipmentToCancel) return;
    setIsSubmitting(true);
    try {
      await api.post('/api/v2/admin/shipments/cancel', { shipment_id: shipmentToCancel.shipment_id });
      toast.success("Shipment cancelled successfully.");
      setShipmentToCancel(null);
      fetchShipments(1, true); // Refresh list
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to cancel shipment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoadMore = () => {
    if (shipmentsData && shipmentsData.currentPage < shipmentsData.totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };
  
  const handleFilterChange = (key: string, value: string) => {
    setCurrentPage(1); // Reset to first page on filter change
    setFilters(prev => ({ ...prev, [key]: value === "all" ? "" : value }));
  };
  
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => setSearchInput(e.target.value);
  const handleSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') handleFilterChange('search', searchInput); };
  const handleApplySearch = () => handleFilterChange('search', searchInput);
  
  const clearFilters = () => {
    setFilters({ search: "", status: "", start_date: "", end_date: "" });
    setSearchInput("");
  };

  const hasActiveFilters = () => Object.values(filters).some(value => value !== "");

  const getStatusBadgeClass = (status: Shipment['status']) => {
    const statusClasses = {
      delivered: 'bg-green-500/20 text-green-400',
      'in-transit': 'bg-yellow-500/20 text-yellow-400',
      confirmed: 'bg-blue-500/20 text-blue-400',
      pending: 'bg-orange-500/20 text-orange-400',
      cancelled: 'bg-red-500/20 text-red-400',
      draft: 'bg-gray-500/20 text-gray-400',
    };
    return statusClasses[status] || 'bg-gray-500/20 text-gray-400';
  };

  // Webhook functions
  const fetchWebhooks = async () => {
    setWebhookLoading(true);
    try {
      const response = await api.get<WebhookListResponse>('/api/v2/admin/webhooks');
      setWebhooks(response.data.data.webhooks);
    } catch (error) {
      console.error('Failed to fetch webhooks:', error);
      toast.error('Failed to fetch webhooks. Please try again.');
    } finally {
      setWebhookLoading(false);
    }
  };

  const createWebhook = async () => {
    if (!webhookForm.name || !webhookForm.url || webhookForm.events.length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsWebhookSubmitting(true);
    try {
      await api.post('/api/v2/admin/webhooks', webhookForm);
      toast.success('Webhook created successfully');
      setWebhookDialog(false);
      setWebhookForm({
        name: "",
        active: true,
        events: [],
        live: false,
        url: "",
      });
      fetchWebhooks();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create webhook');
    } finally {
      setIsWebhookSubmitting(false);
    }
  };

  const toggleWebhook = async (webhook: Webhook) => {
    try {
      const endpoint = webhook.active ? 'disable' : 'enable';
      await api.post(`/api/v2/admin/webhooks/${endpoint}/${webhook.webhook_id}`);
      toast.success(`Webhook ${webhook.active ? 'disabled' : 'enabled'} successfully`);
      fetchWebhooks();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update webhook');
    }
  };

  const deleteWebhook = async () => {
    if (!webhookToDelete) return;
    
    setIsWebhookSubmitting(true);
    try {
      await api.delete(`/api/v2/admin/webhooks/${webhookToDelete.webhook_id}`);
      toast.success('Webhook deleted successfully');
      setWebhookToDelete(null);
      fetchWebhooks();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete webhook');
    } finally {
      setIsWebhookSubmitting(false);
    }
  };

  const handleEventToggle = (event: string) => {
    setWebhookForm(prev => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter(e => e !== event)
        : [...prev.events, event]
    }));
  };

  useEffect(() => {
    if (activeTab === "webhooks") {
      fetchWebhooks();
    }
  }, [activeTab]);

  if (loading && currentPage === 1) return <LoadingSpinner />;

  return (
    <div className="p-4 sm:p-6 lg:p-8 text-white">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Terminal Shipments</h1>
        <p className="text-muted-foreground mt-1">Manage and track all shipments and webhooks.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="shipments" className="flex items-center gap-2">
            <Package2 className="h-4 w-4" />
            Shipments
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="flex items-center gap-2">
            <Webhook className="h-4 w-4" />
            Webhooks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="shipments" className="space-y-6">

      <Card className="p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Input placeholder="Search by tracking, ID, reference..." value={searchInput} onChange={handleSearchInputChange} onKeyDown={handleSearchSubmit} className="pl-9 bg-background"/>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Button variant="default" size="sm" className="absolute right-0 top-0 h-full rounded-l-none" onClick={handleApplySearch}>Search</Button>
          </div>
          <Button variant="outline" size="icon" onClick={clearFilters} disabled={!hasActiveFilters()} title="Clear all filters"><X className="h-4 w-4" /></Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Status</label>
            <Select value={filters.status || "all"} onValueChange={(v) => handleFilterChange('status', v)}>
              <SelectTrigger className="h-8 text-xs bg-background"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="in-transit">In-Transit</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Start Date</label>
            <Input type="date" value={filters.start_date} onChange={(e) => handleFilterChange('start_date', e.target.value)} className="h-8 bg-background"/>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">End Date</label>
            <Input type="date" value={filters.end_date} onChange={(e) => handleFilterChange('end_date', e.target.value)} className="h-8 bg-background"/>
          </div>
        </div>
      </Card>

      <Card>
        <div className="w-full overflow-x-auto relative">
          {loading && currentPage === 1 && <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
          <Table>
            <TableHeader><TableRow><TableHead>Reference</TableHead><TableHead>Carrier</TableHead><TableHead>Tracking Number</TableHead><TableHead>Status</TableHead><TableHead>Created At</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {shipmentsData?.shipments?.length > 0 ? (
                shipmentsData.shipments.map((shipment) => (
                  <TableRow key={shipment._id}>
                    <TableCell className="font-medium">{shipment.reference}</TableCell>
                    <TableCell>{shipment.carrier_slug || 'N/A'}</TableCell>
                    <TableCell>{shipment.tracking_number}</TableCell>
                    <TableCell><Badge variant={'outline'} className={getStatusBadgeClass(shipment.status)}>{shipment.status}</Badge></TableCell>
                    <TableCell>{new Date(shipment.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" title="View Details" onClick={() => setSelectedShipment(shipment)}><Eye className="h-4 w-4" /></Button>
                        <a href={shipment.tracking_url} target="_blank" rel="noopener noreferrer" title="Track Shipment"><Button variant="ghost" size="icon"><Truck className="h-4 w-4" /></Button></a>
                        <Button variant="ghost" size="icon" title="Cancel Shipment" onClick={() => setShipmentToCancel(shipment)} className="hover:text-yellow-400"><XCircle className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" title="Delete Shipment" onClick={() => setShipmentToDelete(shipment)} className="hover:text-red-400"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                !loading && <TableRow><TableCell colSpan={6} className="h-24 text-center">No shipments found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
          
          {/* Loading spinner for initial load */}
          {loading && (!shipmentsData?.shipments || shipmentsData.shipments.length === 0) && (
            <div className="flex flex-col items-center justify-center my-8 py-10">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Loading shipments...</p>
            </div>
          )}

          {/* Load More Button */}
          {!loading && shipmentsData && shipmentsData.shipments && shipmentsData.currentPage < shipmentsData.totalPages && (
            <div className="flex justify-center py-6">
              <Button onClick={handleLoadMore} disabled={loadingMore}>
                {loadingMore ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                   <Package2 className="h-5 w-5 mr-2" />
                    Load More Shipments ({shipmentsData.total - shipmentsData.shipments.length} remaining)
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </Card>

      <Dialog open={!!selectedShipment} onOpenChange={(isOpen) => { if (!isOpen) setSelectedShipment(null); }}>
          <DialogContent className="sm:max-w-5xl text-white">
            <DialogHeader>
              <DialogTitle>Shipment Details</DialogTitle>
              {selectedShipment && <DialogDescription>Information for reference: {selectedShipment.reference}.</DialogDescription>}
            </DialogHeader>
            {isFetchingDetails || !detailedShipment ? (<div className="flex justify-center items-center h-96"><Loader2 className="h-8 w-8 animate-spin" /></div>) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4 max-h-[75vh] overflow-y-auto">
                <div className="md:col-span-1 space-y-4">
                  <Card><CardHeader><CardTitle>General</CardTitle></CardHeader><CardContent className="text-sm space-y-2">
                    <p><strong>ID:</strong> {detailedShipment.shipment_id}</p>
                    <p><strong>Status:</strong> <Badge variant="outline" className={getStatusBadgeClass(detailedShipment.status as Shipment['status'])}>{detailedShipment.status}</Badge></p>
                    <p><strong>Cost:</strong> {new Intl.NumberFormat().format(detailedShipment.shipment_cost)} {detailedShipment.shipment_cost_currency}</p>
                    <p><strong>Created:</strong> {new Date(detailedShipment.created_at).toLocaleString()}</p>
                    <p><strong>Updated:</strong> {new Date(detailedShipment.updated_at).toLocaleString()}</p>
                  </CardContent></Card>
                   <Card><CardHeader><CardTitle>Carrier</CardTitle></CardHeader><CardContent className="text-sm space-y-2">
                      <img src={detailedShipment.carrier?.logo} alt={detailedShipment.carrier?.name} className="h-8 mb-2"/>
                      <p><strong>Name:</strong> {detailedShipment.carrier?.name}</p>
                      <p><strong>Tracking:</strong> <a href={detailedShipment.tracking_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{detailedShipment.tracking_number}</a></p>
                  </CardContent></Card>
                   <Card><CardHeader><CardTitle>Parcel</CardTitle></CardHeader><CardContent className="text-sm space-y-2">
                      <p><strong>Description:</strong> {detailedShipment.parcel?.description}</p>
                      <p><strong>Weight:</strong> {detailedShipment.parcel?.total_weight} {detailedShipment.parcel?.weight_unit}</p>
                      <h4 className="font-semibold pt-2">Items:</h4>
                      {detailedShipment.parcel?.items.map((item, i) => <p key={i}>- {item.name} (Qty: {item.quantity})</p>)}
                  </CardContent></Card>
                </div>
                <div className="md:col-span-2 space-y-4">
                   <Card><CardHeader><CardTitle>Addresses</CardTitle></CardHeader><CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm">
                      <div><h4 className="font-semibold mb-1">From:</h4><p>{detailedShipment.address_from.first_name} {detailedShipment.address_from.last_name}<br/>{detailedShipment.address_from.line1}<br/>{detailedShipment.address_from.city}, {detailedShipment.address_from.state} {detailedShipment.address_from.country}<br/>{detailedShipment.address_from.email}<br/>{detailedShipment.address_from.phone}</p></div>
                      <div><h4 className="font-semibold mb-1">To:</h4><p>{detailedShipment.address_to.first_name} {detailedShipment.address_to.last_name}<br/>{detailedShipment.address_to.line1}<br/>{detailedShipment.address_to.city}, {detailedShipment.address_to.state} {detailedShipment.address_to.country}<br/>{detailedShipment.address_to.email}<br/>{detailedShipment.address_to.phone}</p></div>
                   </CardContent></Card>
                   <Card><CardHeader><CardTitle>Shipment History</CardTitle></CardHeader><CardContent>
                      <Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Status</TableHead><TableHead>Description</TableHead></TableRow></TableHeader>
                        <TableBody>
                          {detailedShipment.events.map((event, index) => (
                            <TableRow key={index}>
                              <TableCell className="text-xs">{new Date(event.created_at).toLocaleString()}</TableCell>
                              <TableCell><Badge variant="secondary">{event.status}</Badge></TableCell>
                              <TableCell className="text-xs">{event.description} at {event.location}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                   </CardContent></Card>
                </div>
              </div>
            )}
            <DialogFooter><Button variant="outline" className='text-black' onClick={() => setSelectedShipment(null)}>Close</Button></DialogFooter>
          </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!shipmentToDelete} onOpenChange={(isOpen) => {if(!isOpen) setShipmentToDelete(null)}}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the shipment with reference <span className="font-semibold">{shipmentToDelete?.reference}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isSubmitting} className='bg-red-600 hover:bg-red-700'>
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Deleting...</> : 'Yes, delete it'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={!!shipmentToCancel} onOpenChange={(isOpen) => {if(!isOpen) setShipmentToCancel(null)}}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to cancel?</AlertDialogTitle>
            <AlertDialogDescription>
              This will attempt to cancel the shipment with reference <span className="font-semibold">{shipmentToCancel?.reference}</span>. This may not be possible if the shipment is already in transit.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Back</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} disabled={isSubmitting} className='bg-yellow-600 hover:bg-yellow-700'>
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Cancelling...</> : 'Yes, cancel shipment'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

        </TabsContent>

        <TabsContent value="webhooks" className="space-y-6">
          <Card className="p-4 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Webhook Management</h2>
              <Button onClick={() => setWebhookDialog(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create Webhook
              </Button>
            </div>
          </Card>

          <Card>
            <div className="w-full overflow-x-auto relative">
              {webhookLoading && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>Events</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {webhooks.length > 0 ? (
                    webhooks.map((webhook) => (
                      <TableRow key={webhook._id}>
                        <TableCell className="font-medium">{webhook.name}</TableCell>
                        <TableCell className="max-w-xs truncate">{webhook.url}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {webhook.events.slice(0, 2).map((event) => (
                              <Badge key={event} variant="secondary" className="text-xs">
                                {event}
                              </Badge>
                            ))}
                            {webhook.events.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{webhook.events.length - 2} more
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={
                                webhook.active
                                  ? "bg-green-500/20 text-green-400"
                                  : "bg-red-500/20 text-red-400"
                              }
                            >
                              {webhook.active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={webhook.live ? "bg-blue-500/20 text-blue-400" : "bg-yellow-500/20 text-yellow-400"}>
                            {webhook.live ? "Live" : "Test"}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(webhook.created_at).toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              title={webhook.active ? "Disable Webhook" : "Enable Webhook"}
                              onClick={() => toggleWebhook(webhook)}
                              className={webhook.active ? "hover:text-red-400" : "hover:text-green-400"}
                            >
                              {webhook.active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Delete Webhook"
                              onClick={() => setWebhookToDelete(webhook)}
                              className="hover:text-red-400"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    !webhookLoading && (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          No webhooks found.
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Webhook Dialog */}
      <Dialog open={webhookDialog} onOpenChange={setWebhookDialog}>
        <DialogContent className="sm:max-w-2xl bg-gray-900 text-white">
          <DialogHeader>
            <DialogTitle>Create New Webhook</DialogTitle>
            <DialogDescription>
              Set up a new webhook to receive notifications about shipment events.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name *</label>
                <Input
                  placeholder="Enter webhook name"
                  value={webhookForm.name}
                  onChange={(e) => setWebhookForm(prev => ({ ...prev, name: e.target.value }))}
                 className='text-black'
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">URL *</label>
                <Input
                  placeholder="https://example.com/webhook"
                  value={webhookForm.url}
                  onChange={(e) => setWebhookForm(prev => ({ ...prev, url: e.target.value }))}
                 className='text-black'
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={webhookForm.active}
                    onCheckedChange={(checked) => setWebhookForm(prev => ({ ...prev, active: checked }))}
                  />
                  <span className="text-sm text-muted-foreground">
                    {webhookForm.active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Environment</label>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={webhookForm.live}
                    onCheckedChange={(checked) => setWebhookForm(prev => ({ ...prev, live: checked }))}
                  />
                  <span className="text-sm text-muted-foreground">
                    {webhookForm.live ? "Live" : "Test"}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Events * (Select at least one)</label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border rounded-md">
                {webhookEvents.map((event) => (
                  <div key={event} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={event}
                      checked={webhookForm.events.includes(event)}
                      onChange={() => handleEventToggle(event)}
                      className="rounded"
                    />
                    <label htmlFor={event} className="text-sm cursor-pointer">
                      {event}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWebhookDialog(false)}>
              Cancel
            </Button>
            <Button onClick={createWebhook} disabled={isWebhookSubmitting}>
              {isWebhookSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Webhook
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Webhook Dialog */}
      <AlertDialog open={!!webhookToDelete} onOpenChange={(isOpen) => {if(!isOpen) setWebhookToDelete(null)}}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the webhook "{webhookToDelete?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isWebhookSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={deleteWebhook} 
              disabled={isWebhookSubmitting} 
              className="bg-red-600 hover:bg-red-700"
            >
              {isWebhookSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Yes, delete it'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
};

export default TerminalShipments; 