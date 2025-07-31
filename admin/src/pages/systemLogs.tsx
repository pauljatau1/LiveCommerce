import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Clock, FileText, RefreshCw, Eye, Calendar, Server, CheckCircle, XCircle } from 'lucide-react';
import { api } from '@/api/axios';
import { useToast } from '@/hooks/use-toast';

interface ErrorLog {
  _id: string;
  orderId: string;
  step: string;
  error: {
    message: string;
    stack: string;
    config: {
      url: string;
      method: string;
      headers: Record<string, string>;
      data: string;
    };
    response: {
      status: number;
      statusText: string;
      data: {
        status: boolean;
        message: string;
        data: any;
      };
    };
  };
  createdAt: string;
  __v: number;
}

interface ErrorLogsResponse {
  errors: ErrorLog[];
}

interface WebhookLog {
  _id: string;
  endpoint: string;
  method: string;
  headers: Record<string, any>;
  body: Record<string, any>;
  ip: string;
  userAgent: string;
  response: {
    statusCode: number;
    headers: Record<string, any>;
    body: Record<string, any>;
    responseTime: number;
  };
  error: Record<string, any> | null;
  success: boolean;
  createdAt: string;
}

interface WebhookLogsResponse {
  data: {
    logs: WebhookLog[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalCount: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

function SystemLogs() {
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingWebhooks, setLoadingWebhooks] = useState(true);
  const [selectedError, setSelectedError] = useState<ErrorLog | null>(null);
  const [selectedWebhook, setSelectedWebhook] = useState<WebhookLog | null>(null);
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);
  const [isWebhookDialogOpen, setIsWebhookDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchErrorLogs = async () => {
    try {
      setLoading(true);
      const response = await api.get<ErrorLogsResponse>('/api/v2/admin/errors');
      setErrorLogs(response.data.errors);
    } catch (error) {
      console.error('Error fetching error logs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch error logs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchWebhookLogs = async () => {
    try {
      setLoadingWebhooks(true);
      const response = await api.get<WebhookLogsResponse>('/api/notifications/webhook-logs?endpoint=simulate-terminal-webhook&page=1&limit=20');
      setWebhookLogs(response.data.data.logs);
    } catch (error) {
      console.error('Error fetching webhook logs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch webhook logs",
        variant: "destructive",
      });
    } finally {
      setLoadingWebhooks(false);
    }
  };

  useEffect(() => {
    fetchErrorLogs();
    fetchWebhookLogs();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStepBadgeVariant = (step: string) => {
    switch (step) {
      case 'create_order':
        return 'default';
      case 'create_shipment':
        return 'secondary';
      case 'payment_processing':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusBadgeVariant = (status: number) => {
    if (status >= 500) return 'destructive';
    if (status >= 400) return 'secondary';
    if (status >= 300) return 'default';
    return 'outline';
  };

  const handleViewError = (error: ErrorLog) => {
    setSelectedError(error);
    setIsErrorDialogOpen(true);
  };

  const handleViewWebhook = (webhook: WebhookLog) => {
    setSelectedWebhook(webhook);
    setIsWebhookDialogOpen(true);
  };

  const renderJsonObject = (obj: any, title: string) => {
    if (!obj) return null;
    
    return (
      <div className="space-y-2">
        <h4 className="font-medium text-sm text-gray-700">{title}</h4>
        <ScrollArea className="h-32 w-full rounded-md border p-2">
          <pre className="text-xs text-gray-600 whitespace-pre-wrap">
            {JSON.stringify(obj, null, 2)}
          </pre>
        </ScrollArea>
      </div>
    );
  };

  const renderErrorLogsTab = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading error logs...</span>
          </div>
        </div>
      );
    }

    return (
      <>
        {errorLogs.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center h-32">
              <div className="text-center">
                <AlertTriangle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No error logs found</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Recent Errors</CardTitle>
              <CardDescription>
                {errorLogs.length} error{errorLogs.length !== 1 ? 's' : ''} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Step</TableHead>
                    <TableHead>Error Message</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {errorLogs.map((error) => (
                    <TableRow key={error._id}>
                      <TableCell className="font-mono text-sm">
                        {error.orderId}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStepBadgeVariant(error.step)}>
                          {error.step.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate">
                          {error.error.message}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(error.error.response?.status || 0)}>
                          {error.error.response?.status || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span className="text-sm">
                            {formatDate(error.createdAt)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewError(error)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </>
    );
  };
  
  const renderWebhookLogsTab = () => {
    if (loadingWebhooks) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading webhook logs...</span>
          </div>
        </div>
      );
    }

    return (
      <>
        {webhookLogs.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center h-32">
              <div className="text-center">
                <Server className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No webhook logs found</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Recent Webhook Deliveries</CardTitle>
              <CardDescription>
                {webhookLogs.length} log{webhookLogs.length !== 1 ? 's' : ''} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Endpoint</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {webhookLogs.map((log) => (
                    <TableRow key={log._id}>
                      <TableCell>
                        {log.success ? (
                          <Badge variant="default" className="bg-green-500">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Success
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <XCircle className="h-3 w-3 mr-1" />
                            Failed
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={log.method === 'POST' ? 'default' : 'secondary'}>
                          {log.method}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm max-w-xs truncate">
                        {log.endpoint}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {log.ip}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span className="text-sm">
                            {formatDate(log.createdAt)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewWebhook(log)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </>
    );
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">System Logs</h1>
          <p className="text-muted-foreground">
            Monitor and analyze system errors, webhook deliveries, and other events.
          </p>
        </div>
        <Button onClick={() => { fetchErrorLogs(); fetchWebhookLogs(); }} disabled={loading || loadingWebhooks}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh All
        </Button>
      </div>

      <Tabs defaultValue="error-logs">
        <TabsList>
          <TabsTrigger value="error-logs">Error Logs</TabsTrigger>
          <TabsTrigger value="webhook-logs">Webhook Logs</TabsTrigger>
        </TabsList>
        <TabsContent value="error-logs">
          {renderErrorLogsTab()}
        </TabsContent>
        <TabsContent value="webhook-logs">
          {renderWebhookLogsTab()}
        </TabsContent>
      </Tabs>

      {/* Error Detail Dialog */}
      <Dialog open={isErrorDialogOpen} onOpenChange={setIsErrorDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Error Details</DialogTitle>
            <DialogDescription>
              Detailed information about the selected error
            </DialogDescription>
          </DialogHeader>
          
          {selectedError && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm text-gray-700">Order ID</h4>
                  <p className="font-mono text-sm">{selectedError.orderId}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-gray-700">Step</h4>
                  <Badge variant={getStepBadgeVariant(selectedError.step)}>
                    {selectedError.step.replace('_', ' ')}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-gray-700">Created At</h4>
                  <p className="text-sm">{formatDate(selectedError.createdAt)}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-gray-700">Status Code</h4>
                  <Badge variant={getStatusBadgeVariant(selectedError.error.response?.status || 0)}>
                    {selectedError.error.response?.status || 'N/A'}
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* Error Message */}
              <div>
                <h4 className="font-medium text-sm text-gray-700 mb-2">Error Message</h4>
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {selectedError.error.message}
                  </AlertDescription>
                </Alert>
              </div>

              {/* Stack Trace */}
              <div>
                <h4 className="font-medium text-sm text-gray-700 mb-2">Stack Trace</h4>
                <ScrollArea className="h-48 w-full rounded-md border p-2">
                  <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                    {selectedError.error.stack}
                  </pre>
                </ScrollArea>
              </div>

              {/* Request Config */}
              {renderJsonObject(selectedError.error.config, 'Request Configuration')}

              {/* Response Data */}
              {renderJsonObject(selectedError.error.response?.data, 'Response Data')}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Webhook Detail Dialog */}
      <Dialog open={isWebhookDialogOpen} onOpenChange={setIsWebhookDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Webhook Log Details</DialogTitle>
            <DialogDescription>
              Detailed information about the selected webhook log
            </DialogDescription>
          </DialogHeader>
          
          {selectedWebhook && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm text-gray-700">Status</h4>
                  {selectedWebhook.success ? (
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Success
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <XCircle className="h-3 w-3 mr-1" />
                      Failed
                    </Badge>
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-sm text-gray-700">Method</h4>
                  <Badge variant={selectedWebhook.method === 'POST' ? 'default' : 'secondary'}>
                    {selectedWebhook.method}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-gray-700">Endpoint</h4>
                  <p className="font-mono text-sm">{selectedWebhook.endpoint}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-gray-700">IP Address</h4>
                  <p className="font-mono text-sm">{selectedWebhook.ip}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-gray-700">Date</h4>
                  <p className="text-sm">{formatDate(selectedWebhook.createdAt)}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-gray-700">Response Time</h4>
                  <p className="text-sm">{selectedWebhook.response?.responseTime}ms</p>
                </div>
              </div>

              <Separator />

              {renderJsonObject(selectedWebhook.headers, 'Request Headers')}
              {renderJsonObject(selectedWebhook.body, 'Request Body')}
              {renderJsonObject(selectedWebhook.response, 'Response')}
              {selectedWebhook.error && renderJsonObject(selectedWebhook.error, 'Error')}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default SystemLogs; 