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
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
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

interface Announcement {
  _id: string;
  title: string;
  description: string;
  createdAt: string;
}

function Announcements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  });

  console.log(isLoading)

  // Fetch announcements
  const fetchAnnouncements = async () => {
    try {
      const response = await api.get("/api/admin/announcements");
      setAnnouncements(response.data);
    } catch (error) {
      toast.error("Failed to fetch announcements ", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedAnnouncement) {
        await api.put(`/api/admin/announcements/${selectedAnnouncement._id}`, formData);
        toast.success("Announcement updated successfully");
      } else {
        await api.post("/api/admin/announcements", formData);
        toast.success("Announcement created successfully");
      }
      setIsModalOpen(false);
      fetchAnnouncements();
      resetForm();
    } catch (error) {
      toast.error(selectedAnnouncement ? "Failed to update announcement" : "Failed to create announcement");
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    setIsDeleting(id);
    try {
      await api.delete(`/api/admin/announcements/${id}`);
      toast.success("Announcement deleted successfully");
      fetchAnnouncements();
    } catch (error) {
      toast.error("Failed to delete announcement");
    } finally {
      setIsDeleting(null);
    }
  };

  const handleEdit = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      description: announcement.description
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({ title: '', description: '' });
    setSelectedAnnouncement(null);
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl text-white font-bold">Announcements</h1>
        <Button onClick={() => {
          resetForm();
          setIsModalOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Announcement
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="p-6 bg-zinc-900">
          <div className="flex flex-col">
            <span className="text-muted-foreground text-sm">Total Announcements</span>
            <span className="text-2xl font-bold mt-2 text-white">
              {announcements.length}
            </span>
          </div>
        </Card>
      </div>

      <Card className="bg-zinc-900">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800">
              <TableHead className="text-white">Title</TableHead>
              <TableHead className="text-white">Description</TableHead>
              <TableHead className="text-white">Created At</TableHead>
              <TableHead className="text-white text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {announcements.map((announcement) => (
              <TableRow key={announcement._id} className="border-zinc-800">
                <TableCell className="font-medium text-white">{announcement.title}</TableCell>
                <TableCell className="text-muted-foreground">{announcement.description.slice(0, 50)}...</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(announcement.createdAt)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => handleEdit(announcement)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-600"
                      onClick={() => handleDelete(announcement._id)}
                      disabled={isDeleting === announcement._id}
                    >
                      {isDeleting === announcement._id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
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
                {selectedAnnouncement ? 'Edit Announcement' : 'Create Announcement'}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="title">Title</label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter announcement title"
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="description">Description</label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter announcement description"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">
                {selectedAnnouncement ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Announcements;