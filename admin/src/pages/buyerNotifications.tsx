import { useState, useEffect } from 'react';
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
import { Plus, Pencil, Trash2, Loader2, Bell } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/api/axios";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PlatformNotification {
  _id: string;
  title: string;
  content: string;
  type: string;
  isActive: boolean;
  startDate: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

function PlatformNotifications() {
  const [notifications, setNotifications] = useState<PlatformNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<PlatformNotification | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'info',
    isActive: true,
    startDate: new Date().toISOString().substring(0, 10),
    endDate: ''
  });

  // Fetch notifications
  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/api/admin/platform-notifications");
      if (response.data && response.data.success) {
        setNotifications(response.data.data.notifications);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      toast.error("Failed to fetch notifications");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedNotification) {
        // Update existing notification
        const response = await api.put(`/api/admin/platform-notifications/${selectedNotification._id}`, formData);
        if (response.data && response.data.success) {
          toast.success("Notification updated successfully");
          fetchNotifications();
        }
      } else {
        // Create new notification
        const response = await api.post("/api/admin/platform-notifications", formData);
        if (response.data && response.data.success) {
          toast.success("Notification created successfully");
          fetchNotifications();
        }
      }
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error submitting notification:", error);
      toast.error(selectedNotification ? "Failed to update notification" : "Failed to create notification");
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    setIsDeleting(id);
    try {
      const response = await api.delete(`/api/admin/platform-notifications/${id}`);
      if (response.data && response.data.success) {
        toast.success("Notification deleted successfully");
        fetchNotifications();
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error("Failed to delete notification");
    } finally {
      setIsDeleting(null);
    }
  };

  // Toggle notification status
  const toggleNotificationStatus = async (notification: PlatformNotification) => {
    try {
      const response = await api.put(`/api/admin/platform-notifications/${notification._id}`, {
        isActive: !notification.isActive
      });
      if (response.data && response.data.success) {
        toast.success(`Notification ${notification.isActive ? "deactivated" : "activated"} successfully`);
        fetchNotifications();
      }
    } catch (error) {
      console.error("Error toggling notification status:", error);
      toast.error("Failed to update notification status");
    }
  };

  const handleEdit = (notification: PlatformNotification) => {
    setSelectedNotification(notification);
    setFormData({
      title: notification.title,
      content: notification.content,
      type: notification.type,
      isActive: notification.isActive,
      startDate: notification.startDate ? new Date(notification.startDate).toISOString().substring(0, 10) : new Date().toISOString().substring(0, 10),
      endDate: notification.endDate ? new Date(notification.endDate).toISOString().substring(0, 10) : ''
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      type: 'info',
      isActive: true,
      startDate: new Date().toISOString().substring(0, 10),
      endDate: ''
    });
    setSelectedNotification(null);
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

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'info':
        return 'text-blue-500';
      case 'warning':
        return 'text-yellow-500';
      case 'announcement':
        return 'text-green-500';
      case 'update':
        return 'text-purple-500';
      case 'promotional':
        return 'text-orange-500';
      case 'maintenance':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'text-green-500' : 'text-red-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl text-white font-bold">Platform Notifications</h1>
        <Button onClick={() => {
          resetForm();
          setIsModalOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Create Notification
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="p-6 bg-zinc-900">
          <div className="flex flex-col">
            <span className="text-muted-foreground text-sm">Total Notifications</span>
            <span className="text-2xl font-bold mt-2 text-white">
              {notifications.length}
            </span>
          </div>
        </Card>
        
        <Card className="p-6 bg-zinc-900">
          <div className="flex flex-col">
            <span className="text-muted-foreground text-sm">Active Notifications</span>
            <span className="text-2xl font-bold mt-2 text-white">
              {notifications.filter(n => n.isActive).length}
            </span>
          </div>
        </Card>
        
        <Card className="p-6 bg-zinc-900">
          <div className="flex flex-col">
            <span className="text-muted-foreground text-sm">Inactive Notifications</span>
            <span className="text-2xl font-bold mt-2 text-white">
              {notifications.filter(n => !n.isActive).length}
            </span>
          </div>
        </Card>
      </div>

      <Card className="bg-black border-gray-800">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Content</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center h-32">
                  <div className="flex justify-center items-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="ml-2">Loading notifications...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : notifications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center h-32">
                  <div className="flex flex-col justify-center items-center h-full">
                    <Bell className="h-8 w-8 text-gray-500 mb-2" />
                    <p className="text-gray-500">No notifications found</p>
                    <Button 
                      variant="link" 
                      onClick={() => {
                        resetForm();
                        setIsModalOpen(true);
                      }}
                      className="mt-2"
                    >
                      Create your first notification
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              notifications.map((notification) => (
                <TableRow key={notification._id}>
                  <TableCell className="font-medium">{notification.title}</TableCell>
                  <TableCell className="max-w-xs truncate">{notification.content}</TableCell>
                  <TableCell className={getTypeColor(notification.type)}>
                    {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
                  </TableCell>
                  <TableCell className={getStatusColor(notification.isActive)}>
                    {notification.isActive ? 'Active' : 'Inactive'}
                  </TableCell>
                  <TableCell>{formatDate(notification.startDate)}</TableCell>
                  <TableCell>{notification.endDate ? formatDate(notification.endDate) : '-'}</TableCell>
                  <TableCell>{formatDate(notification.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleEdit(notification)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        className={notification.isActive ? "text-red-500 border-red-500 hover:bg-red-900 hover:text-red-300" : "text-green-500 border-green-500 hover:bg-green-900 hover:text-green-300"}
                        onClick={() => toggleNotificationStatus(notification)}
                      >
                        {notification.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-red-500 border-red-500 hover:bg-red-900 hover:text-red-300"
                        onClick={() => handleDelete(notification._id)}
                        disabled={isDeleting === notification._id}
                      >
                        {isDeleting === notification._id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={(open) => {
        if (!open) resetForm();
        setIsModalOpen(open);
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {selectedNotification ? 'Edit Notification' : 'Create Notification'}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="title">Title</label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter notification title"
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <label htmlFor="content">Content</label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Enter notification content"
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <label htmlFor="type">Type</label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select notification type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="announcement">Announcement</SelectItem>
                    <SelectItem value="update">Update</SelectItem>
                    <SelectItem value="promotional">Promotional</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <label htmlFor="isActive">Status</label>
                <Select 
                  value={formData.isActive ? "true" : "false"} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, isActive: value === "true" }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <label htmlFor="startDate">Start Date</label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <label htmlFor="endDate">End Date (Optional)</label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">
                {selectedNotification ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default PlatformNotifications; 