import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Loader2, FileText, Link as LinkIcon, File } from 'lucide-react';
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

interface Resource {
  _id: string;
  title: string;
  description: string;
  link?: string;
  media?: {
    type: string;
    url: string;
    public_id: string;
  };
  banner: {
    url: string;
    public_id: string;
  };
  createdAt: string;
}

function Resources() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    link: '',
    media: null as File | null,
    banner: null as File | null,
  });

  const fetchResources = async () => {
    try {
      const response = await api.get("/api/admin/resources");
      setResources(response.data);
    } catch (error) {
      toast.error("Failed to fetch resources");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formDataToSend = new FormData();
    
    formDataToSend.append('title', formData.title);
    formDataToSend.append('description', formData.description);
    if (formData.link) formDataToSend.append('link', formData.link);
    if (formData.media) formDataToSend.append('media', formData.media);
    if (formData.banner) formDataToSend.append('banner', formData.banner);

    try {
      await api.post("/api/admin/resources", formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success("Resource created successfully");
      setIsModalOpen(false);
      fetchResources();
      resetForm();
    } catch (error) {
      toast.error("Failed to create resource");
    }
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(id);
    try {
      await api.delete(`/api/admin/resources/${id}`);
      toast.success("Resource deleted successfully");
      fetchResources();
    } catch (error) {
      toast.error("Failed to delete resource");
    } finally {
      setIsDeleting(null);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      link: '',
      media: null,
      banner: null,
    });
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white">Resources</h2>
          <p className="text-muted-foreground">Manage platform resources and guides</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Resource
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {resources.map((resource) => (
          <Card key={resource._id} className="overflow-hidden">
            <img 
              src={resource.banner.url} 
              alt={resource.title}
              className="w-full h-48 object-cover"
            />
            <div className="p-6">
              <h3 className="font-semibold text-lg mb-2">{resource.title}</h3>
              <p className="text-muted-foreground text-sm mb-4">
                {resource.description}
              </p>
              <div className="flex items-center gap-4">
                {resource.media && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={resource.media.url} target="_blank" rel="noopener noreferrer">
                      <File className="h-4 w-4 mr-2" />
                      View File
                    </a>
                  </Button>
                )}
                {resource.link && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={resource.link} target="_blank" rel="noopener noreferrer">
                      <LinkIcon className="h-4 w-4 mr-2" />
                      View Link
                    </a>
                  </Button>
                )}
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => handleDelete(resource._id)}
                  disabled={isDeleting === resource._id}
                >
                  {isDeleting === resource._id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Add New Resource</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="title">Title</label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter resource title"
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="description">Description</label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter resource description"
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="link">Link (Optional)</label>
                <Input
                  id="link"
                  value={formData.link}
                  onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
                  placeholder="Enter resource link"
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="media">File (Optional)</label>
                <Input
                  id="media"
                  type="file"
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    media: e.target.files ? e.target.files[0] : null 
                  }))}
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="banner">Banner Image (Required)</label>
                <Input
                  id="banner"
                  type="file"
                  required
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    banner: e.target.files ? e.target.files[0] : null 
                  }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Create Resource</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Resources; 