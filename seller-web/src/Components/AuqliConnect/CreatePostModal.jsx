import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { toast } from "sonner";
import { BASE_URL } from "@/Constants/Server";
import { Dialog, DialogContent, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { PenSquare, Type, AlignLeft, Image, Info, Hash, Globe, Lock, Send, Loader2, X, Check, ChevronDown } from 'lucide-react';
import { cn } from "@/lib/utils";

const CreatePostModal = ({ isOpen, onClose, onSubmit, isSubmitting, postForm, setPostForm }) => {
  const { setHeaderName, setNavName } = useOutletContext();
  const [previews, setPreviews] = useState([]);
  const [sellerProducts, setSellerProducts] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);

  const handleMediaChange = (e) => {
    const files = Array.from(e.target.files);
    setPostForm(prev => ({
      ...prev,
      media: files
    }));

    const newPreviews = files.map(file => ({
      url: URL.createObjectURL(file),
      type: file.type.startsWith('image/') ? 'image' : 'video'
    }));
    
    previews.forEach(preview => URL.revokeObjectURL(preview.url));
    setPreviews(newPreviews);
  };

  useEffect(() => {
    return () => {
      previews.forEach(preview => URL.revokeObjectURL(preview.url));
    };
  }, []);
 
  useEffect(() => {
    setHeaderName('Auqli Connect');
    setNavName('');
  }, []);

  useEffect(() => {
    const fetchSellerProducts = async () => {
      try {
        const sellerToken = JSON.parse(localStorage.getItem('sellerToken')).data;
        const response = await fetch(`${BASE_URL}/seller/profile`, {
          headers: {
            'Authorization': `Bearer ${sellerToken}`
          }
        });
        const profileData = await response.json();
        
        const productsResponse = await fetch(`${BASE_URL}/products/seller/${profileData._id}`, {
          headers: {
            'Authorization': `Bearer ${sellerToken}`
          }
        });
        const productsData = await productsResponse.json();
        setSellerProducts(productsData.products);
      } catch (error) {
        console.error('Error fetching products:', error);
        toast.error('Failed to load products');
      }
    };

    if (isOpen) {
      fetchSellerProducts();
    }
  }, [isOpen]);

  useEffect(() => {
    setPostForm(prev => ({
      ...prev,
      productIds: selectedProducts.map(p => p._id).filter(Boolean)
    }));
  }, [selectedProducts, setPostForm]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-0 bg-white dark:bg-gray-900 rounded-xl overflow-hidden">
        <div className="flex flex-col h-[85vh]">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <PenSquare className="w-6 h-6 text-green-600" />
              Create New Post
            </DialogTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Share your products, thoughts, and updates with your audience
            </p>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <form onSubmit={onSubmit} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-base font-medium flex items-center gap-2">
                  <Type className="w-4 h-4 text-green-600" />
                  Title
                </Label>
                <Input
                  id="title"
                  value={postForm.title}
                  onChange={(e) => setPostForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Give your post a catchy title"
                  className="h-12"
                  required
                />
              </div>

              {/* Content */}
              <div className="space-y-2">
                <Label htmlFor="body" className="text-base font-medium flex items-center gap-2">
                  <AlignLeft className="w-4 h-4 text-green-600" />
                  Content
                </Label>
                <Textarea
                  id="body"
                  value={postForm.body}
                  onChange={(e) => setPostForm(prev => ({ ...prev, body: e.target.value }))}
                  placeholder="Share your story, updates, or product information..."
                  className="min-h-[120px] resize-y"
                  required
                />
              </div>

              {/* Media Upload */}
              <div className="space-y-2">
                <Label htmlFor="media" className="text-base font-medium flex items-center gap-2">
                  <Image className="w-4 h-4 text-green-600" />
                  Media
                </Label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-4 hover:border-green-500 transition-colors">
                  <Input
                    id="media"
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleMediaChange}
                    className="cursor-pointer"
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    You can select multiple images and videos
                  </p>
                </div>
              </div>

              {/* Media Previews */}
              {previews.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {previews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-[16/9] rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                        {preview.type === 'image' ? (
                          <img
                            src={preview.url}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <video
                            src={preview.url}
                            className="w-full h-full object-cover"
                            controls
                          />
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          URL.revokeObjectURL(preview.url);
                          setPreviews(prev => prev.filter((_, i) => i !== index));
                          setPostForm(prev => ({
                            ...prev,
                            media: prev.media.filter((_, i) => i !== index)
                          }));
                        }}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-black/50 text-white text-xs">
                        {preview.type === 'image' ? 'Image' : 'Video'} {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Product Tagging */}
              <div className="space-y-2">
                <Label className="text-base font-medium flex items-center gap-2">
                  <Hash className="w-4 h-4 text-green-600" />
                  Tag Products
                </Label>
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className="w-full justify-between h-12"
                    >
                      {selectedProducts.length > 0
                        ? `${selectedProducts.length} products selected`
                        : "Select products to tag"}
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search your products..." />
                      <CommandEmpty>No products found.</CommandEmpty>
                      <CommandGroup className="max-h-64 overflow-auto">
                        {sellerProducts.map((product) => (
                          <CommandItem
                            key={product._id}
                            onSelect={() => {
                              setSelectedProducts(prev => {
                                const isSelected = prev.some(p => p._id === product._id);
                                if (isSelected) {
                                  return prev.filter(p => p._id !== product._id);
                                }
                                return [...prev, product];
                              });
                            }}
                          >
                            <div className="flex items-center gap-2 w-full">
                              <img
                                src={product.images[0]?.url}
                                alt={product.name}
                                className="w-8 h-8 object-cover rounded"
                              />
                              <span>{product.name}</span>
                              <Check
                                className={cn(
                                  "ml-auto h-4 w-4",
                                  selectedProducts.some(p => p._id === product._id)
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Selected Products */}
              {selectedProducts.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedProducts.map((product) => (
                    <div
                      key={product._id}
                      className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-2"
                    >
                      <img
                        src={product.images[0]?.url}
                        alt={product.name}
                        className="w-6 h-6 object-cover rounded"
                      />
                      <span className="text-sm">{product.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-1"
                        onClick={() => setSelectedProducts(prev => 
                          prev.filter(p => p._id !== product._id)
                        )}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Tags */}
              <div className="space-y-2">
                <Label htmlFor="tags" className="text-base font-medium flex items-center gap-2">
                  <Hash className="w-4 h-4 text-green-600" />
                  Tags
                </Label>
                <Input
                  id="tags"
                  value={postForm.tags}
                  onChange={(e) => setPostForm(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="Add tags separated by commas (e.g., fashion, summer, sale)"
                  className="h-12"
                />
              </div>

              {/* Visibility */}
              <div className="space-y-2">
                <Label htmlFor="visibility" className="text-base font-medium flex items-center gap-2">
                  <Globe className="w-4 h-4 text-green-600" />
                  Visibility
                </Label>
                <Select
                  value={postForm.visibility}
                  onValueChange={(value) => setPostForm(prev => ({ ...prev, visibility: value }))}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select visibility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public" className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Public
                    </SelectItem>
                    <SelectItem value="private" className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Private
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex justify-between items-center">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={onSubmit}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700 text-white px-8"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    Create Post
                  </div>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePostModal; 