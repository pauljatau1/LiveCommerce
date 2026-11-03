import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Loader2, Link as LinkIcon } from 'lucide-react';
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

interface Banner {
  _id: string;
  title: string;
  description: string;
  category: string;
  callToActionLink: string;
  mainImage: {
    url: string;
    public_id: string;
  };
  createdAt: string;
}

function Banners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    callToActionLink: '',
    mainImage: null as File | null,
  });

  const fetchBanners = async () => {
    try {
      const response = await api.get("/api/admin/banners");
      setBanners(response.data);
    } catch (error) {
      toast.error("Failed to fetch banners");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formDataToSend = new FormData();
    formDataToSend.append('title', formData.title);
    formDataToSend.append('description', formData.description);
    formDataToSend.append('category', formData.category);
    formDataToSend.append('callToActionLink', formData.callToActionLink);
    if (formData.mainImage) {
      formDataToSend.append('mainImage', formData.mainImage);
    }

    try {
      await api.post("/api/admin/banners", formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success("Banner created successfully");
      setIsModalOpen(false);
      fetchBanners();
      resetForm();
    } catch (error) {
      toast.error("Failed to create banner");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(id);
    try {
      await api.delete(`/api/admin/banners/${id}`);
      toast.success("Banner deleted successfully");
      fetchBanners();
    } catch (error) {
      toast.error("Failed to delete banner");
    } finally {
      setIsDeleting(null);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: '',
      callToActionLink: '',
      mainImage: null,
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
          <h2 className="text-3xl font-bold text-white">Banners</h2>
          <p className="text-muted-foreground">Manage promotional banners</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Banner
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {banners.map((banner) => (
          <Card key={banner._id} className="overflow-hidden">
            <img 
              src={banner.mainImage.url} 
              alt={banner.title}
              className="w-full h-48 object-cover"
            />
            <div className="p-6">
              <h3 className="font-semibold text-lg mb-2">{banner.title}</h3>
              <p className="text-muted-foreground text-sm mb-2">
                {banner.description}
              </p>
              <p className="text-sm text-primary mb-4">
                Category: {banner.category}
              </p>
              <div className="flex items-center justify-between">
                <Button variant="outline" size="sm" asChild>
                  <a href={banner.callToActionLink} target="_blank" rel="noopener noreferrer">
                    <LinkIcon className="h-4 w-4 mr-2" />
                    View Link
                  </a>
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => handleDelete(banner._id)}
                  disabled={isDeleting === banner._id}
                >
                  {isDeleting === banner._id ? (
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
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Add New Banner</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="title">Title</label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter banner title"
                  required
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="description">Description</label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter banner description"
                  required
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="category">Category</label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="Enter banner category"
                  required
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="callToActionLink">Call to Action Link</label>
                <Input
                  id="callToActionLink"
                  value={formData.callToActionLink}
                  onChange={(e) => setFormData(prev => ({ ...prev, callToActionLink: e.target.value }))}
                  placeholder="Enter call to action link"
                  required
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="mainImage">Banner Image</label>
                <Input
                  id="mainImage"
                  type="file"
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    mainImage: e.target.files ? e.target.files[0] : null 
                  }))}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  'Create Banner'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Banners; 