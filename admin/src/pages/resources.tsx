import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Loader2, FileText, Link as LinkIcon, File, Youtube } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/api/axios";
import { toast } from "sonner";

interface Resource {
  _id: string;
  title: string;
  description: string;
  resourceType: 'youtube' | 'file';
  category: 'auqli_university' | 'other';
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
  updatedAt: string;
}

type ResourceFormData = {
  title: string;
  description: string;
  resourceType: 'youtube' | 'file';
  category: 'auqli_university' | 'other';
  link: string;
  media: File | null;
  banner: File | null;
};

function Resources() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [activeResourceType, setActiveResourceType] = useState<'youtube' | 'file'>('youtube');
  const [filter, setFilter] = useState<{
    resourceType?: 'youtube' | 'file',
    category?: 'auqli_university' | 'other'
  }>({});
  
  const [formData, setFormData] = useState<ResourceFormData>({
    title: '',
    description: '',
    resourceType: 'youtube',
    category: 'auqli_university',
    link: '',
    media: null,
    banner: null,
  });

  const fetchResources = async () => {
    try {
      // Add filters to the API call if they exist
      const params = new URLSearchParams();
      if (filter.resourceType) params.append('resourceType', filter.resourceType);
      if (filter.category) params.append('category', filter.category);
      
      const queryString = params.toString();
      const endpoint = queryString 
        ? `/api/admin/resources?${queryString}` 
        : "/api/admin/resources";
      
      const response = await api.get(endpoint);
      setResources(response.data);
    } catch (error) {
      toast.error("Failed to fetch resources");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [filter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data based on resource type
    if (formData.resourceType === 'youtube' && !formData.link) {
      toast.error("YouTube link is required for YouTube resources");
      return;
    }
    
    if (formData.resourceType === 'file' && !formData.media && !isEditMode) {
      toast.error("File upload is required for file resources");
      return;
    }
    
    if (formData.resourceType === 'file' && !formData.banner && !isEditMode) {
      toast.error("Banner image is required for file resources");
      return;
    }
    
    const formDataToSend = new FormData();
    
    formDataToSend.append('title', formData.title);
    formDataToSend.append('description', formData.description);
    formDataToSend.append('resourceType', formData.resourceType);
    formDataToSend.append('category', formData.category);
    
    // Only append link for YouTube resources
    if (formData.resourceType === 'youtube' && formData.link) {
      formDataToSend.append('link', formData.link);
    }
    
    // Only append media for File resources
    if (formData.resourceType === 'file' && formData.media) {
      formDataToSend.append('media', formData.media);
    }
    
    if (formData.banner) {
      formDataToSend.append('banner', formData.banner);
    }

    try {
      if (isEditMode && editId) {
        await api.put(`/api/admin/resources/${editId}`, formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        toast.success("Resource updated successfully");
      } else {
        await api.post("/api/admin/resources", formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        toast.success("Resource created successfully");
      }
      
      setIsModalOpen(false);
      fetchResources();
      resetForm();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Operation failed";
      toast.error(errorMessage);
    }
  };

  const handleEdit = (resource: Resource) => {
    setIsEditMode(true);
    setEditId(resource._id);
    setFormData({
      title: resource.title,
      description: resource.description,
      resourceType: resource.resourceType,
      category: resource.category,
      link: resource.link || '',
      media: null, // Can't prefill file inputs for security reasons
      banner: null, // Can't prefill file inputs for security reasons
    });
    setActiveResourceType(resource.resourceType);
    setIsModalOpen(true);
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
      resourceType: 'youtube',
      category: 'auqli_university',
      link: '',
      media: null,
      banner: null,
    });
    setIsEditMode(false);
    setEditId(null);
    setActiveResourceType('youtube');
  };

  const handleResourceTypeChange = (value: string) => {
    const resourceType = value as 'youtube' | 'file';
    setFormData(prev => ({ ...prev, resourceType }));
    setActiveResourceType(resourceType);
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

  const handleFilterChange = (type: 'resourceType' | 'category', value: string | undefined) => {
    setFilter(prev => ({
      ...prev,
      [type]: value === 'all' ? undefined : value
    }));
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

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Label htmlFor="typeFilter">Type:</Label>
          <Select 
            value={filter.resourceType || 'all'} 
            onValueChange={(v) => handleFilterChange('resourceType', v || undefined)}
          >
            <SelectTrigger id="typeFilter" className="w-[180px]">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="youtube">YouTube Videos</SelectItem>
              <SelectItem value="file">Files</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="categoryFilter">Category:</Label>
          <Select 
            value={filter.category || 'all'} 
            onValueChange={(v) => handleFilterChange('category', v || undefined)}
          >
            <SelectTrigger id="categoryFilter" className="w-[180px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="auqli_university">Auqli University</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {resources.length > 0 ? (
          resources.map((resource) => (
            <Card key={resource._id} className="overflow-hidden">
              <img 
                src={resource.banner.url} 
                alt={resource.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg">{resource.title}</h3>
                  <div className="flex items-center gap-1">
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                      {resource.resourceType === 'youtube' ? 'YouTube' : 'File'}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
                      {resource.category === 'auqli_university' ? 'Auqli University' : 'Other'}
                    </span>
                  </div>
                </div>
                <p className="text-muted-foreground text-sm mb-4">
                  {resource.description}
                </p>
                <div className="text-xs text-muted-foreground mb-4">
                  Created: {formatDate(resource.createdAt)}
                </div>
                <div className="flex items-center gap-2">
                  {resource.resourceType === 'file' && resource.media && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={resource.media.url} target="_blank" rel="noopener noreferrer">
                        <File className="h-4 w-4 mr-2" />
                        View File
                      </a>
                    </Button>
                  )}
                  {resource.resourceType === 'youtube' && resource.link && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={resource.link} target="_blank" rel="noopener noreferrer">
                        <Youtube className="h-4 w-4 mr-2" />
                        Watch Video
                      </a>
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEdit(resource)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
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
          ))
        ) : (
          <div className="col-span-3 text-center py-12">
            <p className="text-muted-foreground">No resources found. Try changing your filters or add a new resource.</p>
          </div>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={(open) => {
        if (!open) resetForm();
        setIsModalOpen(open);
      }}>
        <DialogContent className="sm:max-w-2xl">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{isEditMode ? 'Edit Resource' : 'Add New Resource'}</DialogTitle>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="title">Title</label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter resource title"
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <label htmlFor="description">Description</label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter resource description"
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <label htmlFor="category">Category</label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => setFormData(prev => ({ 
                    ...prev, 
                    category: value as 'auqli_university' | 'other'
                  }))}
                  required
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auqli_university">Auqli University</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <label>Resource Type</label>
                <Tabs value={activeResourceType} onValueChange={handleResourceTypeChange}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="youtube">YouTube Video</TabsTrigger>
                    <TabsTrigger value="file">File Upload</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="youtube">
                    <div className="grid gap-2 pt-2">
                      <label htmlFor="link">YouTube Link</label>
                      <Input
                        id="link"
                        value={formData.link}
                        onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
                        placeholder="Enter YouTube video URL"
                        required={activeResourceType === 'youtube'}
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="file">
                    <div className="grid gap-2 pt-2">
                      <label htmlFor="media">
                        File Upload
                        {isEditMode && <span className="text-xs text-muted-foreground ml-2">(Leave empty to keep current file)</span>}
                      </label>
                      <Input
                        id="media"
                        type="file"
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          media: e.target.files ? e.target.files[0] : null 
                        }))}
                        required={activeResourceType === 'file' && !isEditMode}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
              
              <div className="grid gap-2">
                <label htmlFor="banner">
                  Banner Image
                  {isEditMode && <span className="text-xs text-muted-foreground ml-2">(Leave empty to keep current banner)</span>}
                </label>
                <Input
                  id="banner"
                  type="file"
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    banner: e.target.files ? e.target.files[0] : null 
                  }))}
                  required={!isEditMode && formData.resourceType === 'file'}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {isEditMode ? 'Update Resource' : 'Create Resource'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Resources; 