import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, Clock, FileText, RefreshCw, Eye, Calendar } from 'lucide-react';
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

function ErrorLogs() {
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedError, setSelectedError] = useState<ErrorLog | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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

  useEffect(() => {
    fetchErrorLogs();
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
    setIsDialogOpen(true);
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Error Logs</h1>
          <p className="text-muted-foreground">
            Monitor and analyze system errors and failures
          </p>
        </div>
        <Button onClick={fetchErrorLogs} disabled={loading}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

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

      {/* Error Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
    </div>
  );
}

export default ErrorLogs; 