import { useState, useEffect, useRef } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from "@/Components/ui/avatar"
import { Button } from "@/Components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/Components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/Components/ui/dialog";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { ScrollArea } from "@/Components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Components/ui/tabs";
import { Textarea } from "@/Components/ui/textarea";
import { MessageCircle, MoreVertical, X, ChevronLeft, ChevronRight, MessageSquare, Heart, Plus } from 'lucide-react';
import { Search } from 'lucide-react';
import { Badge } from "@/Components/ui/badge";
import { Bell } from 'lucide-react';
import { BASE_URL } from "@/Constants/Server"
import LinearProgress from "@mui/material/LinearProgress"
import { toast } from "sonner"
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";
import { FaRegCommentDots, FaShareSquare, FaBookmark } from "react-icons/fa";
import { IoEyeOutline } from "react-icons/io5";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/Components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/Components/ui/popover"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"
import { PenSquare, Type, AlignLeft, Image, Info, Tags, Hash, Eye, Globe, Lock, Send, Loader2 } from "lucide-react";

// Add these reaction options at the top level
const REACTION_OPTIONS = [
  { type: 'like', emoji: '👍', label: 'Like' },
  { type: 'love', emoji: '❤️', label: 'Love' },
  { type: 'haha', emoji: '😄', label: 'Haha' },
  { type: 'wow', emoji: '😮', label: 'Wow' },
  { type: 'sad', emoji: '😢', label: 'Sad' },
  { type: 'angry', emoji: '😡', label: 'Angry' }
];

// Helper function to format message timestamps
const formatMessageTime = (timestamp) => {
  if (!timestamp) return '';

  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = (now - date) / (1000 * 60 * 60);

  // If message is from today, show time
  if (diffInHours < 24) {
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  }


  // If message is from yesterday, show "Yesterday"
  if (diffInHours < 48) {
    return 'Yesterday';
  }

  // If message is from this week, show day name
  if (diffInHours < 168) {
    return date.toLocaleDateString([], {
      weekday: 'long'
    });
  }

  // Otherwise show full date
  return date.toLocaleDateString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Helper function to format reaction preview text
const formatReactionPreview = (reactions) => {
  if (!reactions || reactions.length === 0) return '';
  
  const names = reactions.map(r => `${r.user.firstName} ${r.user.lastName}`);
  if (names.length === 1) return `${names[0]} liked this`;
  if (names.length === 2) return `${names[0]} and ${names[1]} liked this`;
  return `${names[0]} and ${names.length - 1} others liked this`;
};

// Helper function to format comment preview text
const formatCommentPreview = (comments) => {
  if (!comments || comments.length === 0) return '';
  
  const names = comments.map(c => `${c.author.firstName} ${c.author.lastName}`);
  if (names.length === 1) return `${names[0]} commented`;
  if (names.length === 2) return `${names[0]} and ${names[1]} commented`;
  return `${names[0]} and ${names.length - 1} others commented`;
};

// Add this helper function near the other helper functions at the top
const formatRelativeTime = (timestamp) => {
  if (!timestamp) return '';

  const now = new Date();
  const date = new Date(timestamp);
  const diffInSeconds = Math.floor((now - date) / 1000);

  // Define time intervals in seconds
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60
  };

  // Check each interval
  for (const [unit, seconds] of Object.entries(intervals)) {
    const diff = Math.floor(diffInSeconds / seconds);
    if (diff >= 1) {
      return `${diff} ${unit}${diff > 1 ? 's' : ''} ago`;
    }
  }

  return 'Just now';
};

// Create a new separate component for the create post modal
const CreatePostModal = ({ isOpen, onClose, onSubmit, isSubmitting, postForm, setPostForm }) => {
  const [previews, setPreviews] = useState([]);
  const [open, setOpen] = useState(false);
  const [sellerProducts, setSellerProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);

  const handleMediaChange = (e) => {
    const files = Array.from(e.target.files);
    setPostForm(prev => ({
      ...prev,
      media: files
    }));

    // Generate previews
    const newPreviews = files.map(file => ({
      url: URL.createObjectURL(file),
      type: file.type.startsWith('image/') ? 'image' : 'video'
    }));
    
    // Clean up previous preview URLs
    previews.forEach(preview => URL.revokeObjectURL(preview.url));
    setPreviews(newPreviews);
  };

  // Cleanup preview URLs when modal closes
  useEffect(() => {
    return () => {
      previews.forEach(preview => URL.revokeObjectURL(preview.url));
    };
  }, []);

  // Fetch seller products when modal opens
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
                  <Tags className="w-4 h-4 text-green-600" />
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
                  <Eye className="w-4 h-4 text-green-600" />
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

// Add a function to fetch a single post's updated data
const fetchPostData = async (postId) => {
  try {
    const response = await fetch(`${BASE_URL}/posts/${postId}`);
    if (!response.ok) throw new Error('Failed to fetch post');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching post:', error);
    throw error;
  }
};

// Add this component for displaying tagged products
const TaggedProducts = ({ products }) => {
  if (!products || products.length === 0) return null;

  return (
    <div className="mt-4 border-t border-gray-100 dark:border-gray-700/50 pt-4">
      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2">
        <span className="inline-block w-1 h-4 bg-green-500 rounded-full"></span>
        Tagged Products ({products.length})
      </h4>
      <div className="grid grid-cols-2 gap-3">
        {products.map((productItem) => {
          // Handle both direct product objects and nested productId structure
          const product = productItem.productId || productItem;
          
          // Destructure the product properties safely
          const {
            _id: id,
            name,
            price,
            images = [],
            category,
            brand,
            discountedPrice
          } = product;

          return (
            <div
              key={id}
              className="group relative flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-700/50 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors cursor-pointer overflow-hidden"
              onClick={() => window.open(`/dashboard/products/${id}`, '_blank')}
            >
              <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                <img
                  src={images[0]?.url || '/placeholder-product.png'}
                  alt={name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                {images.length > 1 && (
                  <div className="absolute bottom-1 right-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded-full">
                    +{images.length - 1}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                  {name}
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-green-600 dark:text-green-400 font-semibold">
                    ₦{(discountedPrice || price)?.toLocaleString()}
                  </p>
                  {discountedPrice && discountedPrice < price && (
                    <p className="text-xs text-gray-500 line-through">
                      ₦{price?.toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {category && (
                    <Badge variant="secondary" className="bg-green-100/50 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs">
                      {category}
                    </Badge>
                  )}
                  {brand && (
                    <Badge variant="secondary" className="bg-blue-100/50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs">
                      {brand}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-white dark:bg-gray-800 -sm">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Helper function to get reaction emoji
const getReactionEmoji = (type) => {
  const emojiMap = {
    like: '👍',
    love: '💖',
    haha: '😄',
    wow: '😮',
    sad: '😢',
    angry: '😡'
  };
  return emojiMap[type] || '';
};

// Helper function to format reaction counts
const formatReactions = (stats) => {
  if (!stats?.reactions) return [];
  
  return Object.entries(stats.reactions)
    .filter(([_, count]) => count > 0)
    .map(([type, count]) => ({
      type,
      count,
      emoji: getReactionEmoji(type)
    }));
};

export default function SocialFeed() {
  const { setHeaderName, setNavName } = useOutletContext()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [activePost, setActivePost] = useState(null)
  const [newComment, setNewComment] = useState('')
  const [selectedTab, setSelectedTab] = useState('all')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [postContent, setPostContent] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [posts, setPosts] = useState([])
  const [trendingPosts, setTrendingPosts] = useState([])
  const [newPosts, setNewPosts] = useState([])
  const [blips, setBlips] = useState([])
  const [myPosts, setMyPosts] = useState([])
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedBlip, setSelectedBlip] = useState(null)
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false)
  const [postForm, setPostForm] = useState({
    title: '',
    body: '',
    tags: '',
    visibility: 'public',
    media: [],
    productIds: []
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [slideIndices, setSlideIndices] = useState({})
  const carouselRef = useRef(null)
  const navigate = useNavigate()
  const [currentConversation, setCurrentConversation] = useState(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [currentUserId, setCurrentUserId] = useState(null);
  const [sellerProfile, setSellerProfile] = useState(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [activeGalleryPost, setActiveGalleryPost] = useState(null);
  const [savedPosts, setSavedPosts] = useState([]);

  useEffect(() => {
    setHeaderName('Auqli Connect')
    setNavName('')
  }, [])

  useEffect(() => {
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 1000)
  }, [selectedTab])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const sellerToken = localStorage.getItem('sellerToken')
        if (!sellerToken) return

        const tokenData = JSON.parse(sellerToken)
        const token = tokenData.data

        switch (selectedTab) {
          case 'all':
            const postsRes = await fetch(`${BASE_URL}/posts`)
            const postsData = await postsRes.json()
            setPosts(postsData.posts)
            break

          case 'trending':
            const trendingRes = await fetch(`${BASE_URL}/posts/trending?page=1&limit=10`)
            const trendingData = await trendingRes.json()
            setTrendingPosts(trendingData.posts)
            break

          case 'new':
            const newRes = await fetch(`${BASE_URL}/posts/new?page=1&limit=10`)
            const newData = await newRes.json()
            setNewPosts(newData.posts)
            break

          case 'blips':
            const blipsRes = await fetch(`${BASE_URL}/products/blips?page=1&limit=10`)
            const blipsData = await blipsRes.json()
            setBlips(blipsData.blips)
            break

          case 'my-posts':
            const profileRes = await fetch(`${BASE_URL}/seller/profile`, {
              headers: { 'Authorization': `Bearer ${token}` }
            })
            const profileData = await profileRes.json()
            const sellerId = profileData._id

            const myPostsRes = await fetch(`${BASE_URL}/posts/user/Seller/${sellerId}`)
            const myPostsData = await myPostsRes.json()
            setMyPosts(myPostsData.posts)
            break
        }

        const conversationsRes = await fetch(`${BASE_URL}/conversations`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const conversationsData = await conversationsRes.json()
        setConversations(conversationsData.conversations)

      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [selectedTab])

  useEffect(() => {
    const fetchSellerProfile = async () => {
      try {
        const sellerToken = JSON.parse(localStorage.getItem('sellerToken'))?.data;
        if (!sellerToken) return;

        const response = await fetch(`${BASE_URL}/seller/profile`, {
          headers: {
            'Authorization': `Bearer ${sellerToken}`
          }
        });
        const data = await response.json();
        setSellerProfile(data);
      } catch (error) {
        console.error('Error fetching seller profile:', error);
      }
    };

    fetchSellerProfile();
  }, []);

  useEffect(() => {
    const sellerToken = localStorage.getItem('sellerToken');
    if (sellerToken) {
      try {
        const tokenData = JSON.parse(sellerToken);
        const userData = tokenData.user || {};
        setCurrentUserId(userData._id);
      } catch (error) {
        console.error('Error parsing seller token:', error);
      }
    }
  }, []);

  const handleOpenPostActivity = (post) => {
    setActivePost(post)
  }

  const handleClosePostActivity = () => {
    setActivePost(null)
  }

  const handleReact = async (postId, reactionType) => {
    try {
      if (!sellerProfile) throw new Error('Seller profile not loaded');
      
      const sellerToken = localStorage.getItem('sellerToken');
      if (!sellerToken) throw new Error('Not authenticated');

      const tokenData = JSON.parse(sellerToken);
      const token = tokenData.data;

      const response = await fetch(`${BASE_URL}/posts/${postId}/reactions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type: reactionType })
      });

      if (!response.ok) throw new Error('Failed to react to post');
      
      const data = await response.json();

      // Update the post locally with new reaction counts
      const updatePostInArray = (posts) =>
        posts.map(post => {
          if (post._id !== postId) return post;
          
          return {
            ...post,
            stats: {
              ...post.stats,
              reactions: data.reactionCounts
            },
            reactions: post.reactions.filter(r => r.user?.userId !== currentUserId)
          };
        });

      setPosts(prev => updatePostInArray(prev));
      setTrendingPosts(prev => updatePostInArray(prev));
      setNewPosts(prev => updatePostInArray(prev));
      setMyPosts(prev => updatePostInArray(prev));

      toast.success('Reaction updated successfully');

    } catch (error) {
      toast.error('Failed to react to post: ' + error.message);
    }
  };

  const handleAddComment = async (postId, newComment) => {
    setIsLoading(true);
    try {
      if (!sellerProfile) throw new Error('Seller profile not loaded');

      const sellerToken = localStorage.getItem('sellerToken');
      if (!sellerToken) throw new Error('Not authenticated');

      const tokenData = JSON.parse(sellerToken);
      const token = tokenData.data;

      const response = await fetch(`${BASE_URL}/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: newComment })
      });

      if (!response.ok) throw new Error('Failed to add comment');

      // Update the post locally
      const updatePostInArray = (posts) =>
        posts.map(post => {
          if (post._id !== postId) return post;
          
          // Create updated post with new comment
          const updatedPost = { ...post };
          const newCommentObj = {
            author: {
              userId: currentUserId,
              userModel: 'Seller',
              firstName: sellerProfile.firstName,
              lastName: sellerProfile.lastName,
              storeName: sellerProfile.storeName
            },
            content: newComment,
            createdAt: new Date().toISOString(),
            _id: Date.now().toString(),
            likes: []
          };
          
          updatedPost.comments = [...(post.comments || []), newCommentObj];
          return updatedPost;
        });

      // Update all post lists
      setPosts(prev => updatePostInArray(prev));
      setTrendingPosts(prev => updatePostInArray(prev));
      setNewPosts(prev => updatePostInArray(prev));
      setMyPosts(prev => updatePostInArray(prev));

      // Update active post if it's the one being commented on
      if (activePost?._id === postId) {
        setActivePost(prev => updatePostInArray([prev])[0]);
      }

      // Clear comment input
      setNewComment('');
      toast.success('Comment added successfully');

    } catch (error) {
      console.error('Comment error:', error);
      toast.error('Failed to add comment: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSlideChange = (postId, newIndex) => {
    setSlideIndices(prev => ({
      ...prev,
      [postId]: newIndex
    }))
  }

  const renderPosts = () => {
    let postsToRender = [];
    switch (selectedTab) {
      case 'all':
        postsToRender = posts;
        break;
      case 'trending':
        postsToRender = trendingPosts;
        break;
      case 'new':
        postsToRender = newPosts;
        break;
      case 'my-posts':
        postsToRender = myPosts;
        break;
      case 'saved':
        postsToRender = savedPosts;
        break;
      default:
        postsToRender = posts;
    }

    if (!postsToRender || postsToRender.length === 0) {
      return (
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold text-gray-600">No posts available</h3>
          <p className="text-gray-500 mt-2">Check back later for new content</p>
        </div>
      );
    }

    return postsToRender.map((post) => {
      if (!post || !post._id) return null

      const authorName = post.author?.name || post.author?.businessName || 'Anonymous'
      const authorImage = post.author?.image
      const postDate = post.createdAt ? formatRelativeTime(post.createdAt) : 'Unknown date'
      const postBody = post.body || ''
      const postTags = Array.isArray(post.tags) ? post.tags : []
      const currentSlideIndex = slideIndices[post._id] || 0
      const postImages = Array.isArray(post.images) ? post.images : []
      const reactionCount = post.reactions?.reduce((sum, r) => sum + (r.count || 0), 0) || 0
      const commentCount = Array.isArray(post.comments) ? post.comments.length : 0

      const reactionPreview = formatReactionPreview(post.reactions);
      const commentPreview = formatCommentPreview(post.comments);

      const hasUserReacted = post.reactions?.some(r => r.user?.userId === currentUserId) || false;

      return (
        <Card key={post._id} className="mb-8 bg-white dark:bg-gray-800/90 border border-gray-100 dark:border-gray-700/50 -sm hover:-md transition-all rounded-xl overflow-hidden">
          {/* Author Header */}
          <CardHeader className="flex flex-row items-center space-y-0 p-6 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-800">
            <div className="flex items-center gap-4 flex-1">
              <Avatar className="h-12 w-12 ring-4 ring-white dark:ring-gray-800 -sm">
                <AvatarImage src={authorImage} className="object-cover" />
                <AvatarFallback className="bg-gradient-to-br from-green-400 to-green-600 text-white font-semibold">
                  {authorName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900 dark:text-gray-100 hover:text-green-600 cursor-pointer transition-colors">
                    {authorName}
                  </p>
                  <Badge variant="secondary" className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs">
                    {post.author.type || ''}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">{postDate}</p>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{post.visibility}</p>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
              <MoreVertical className="h-5 w-5 text-gray-500" />
            </Button>
          </CardHeader>

          {/* Post Content */}
          <CardContent className="p-6 space-y-4">
            {post.title && (
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 leading-tight">
                {post.title}
              </h3>
            )}
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
              {postBody.length > 50 ? `${postBody.slice(0, 50)}...` : postBody}
            </p>
            
            {/* Tags */}
            {postTags.length > 0 && !postTags.includes("[]") && (
              <div className="flex gap-2 flex-wrap pt-2">
                {postTags.map((tag, index) => (
                  <Badge
                    key={`${tag}-${index}`}
                    variant="secondary"
                    className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer transition-colors px-3 py-1 rounded-full text-sm"
                  >
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Media Gallery */}
            {renderMediaGallery(post, slideIndices[post._id] || 0, postImages)}
            
            {/* Tagged Products */}
            <TaggedProducts products={post.products} />
          </CardContent>

          {/* Engagement Stats & Actions */}
          <CardFooter className="p-6 bg-gray-50/50 dark:bg-gray-800/50">
            <div className="flex justify-between items-center w-full">
              {/* React Button with Reactions Count */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={`flex-1 gap-2 hover:bg-red-50 dark:hover:bg-red-900/20 ${
                      hasUserReacted ? 'text-red-500' : 'hover:text-red-500'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {/* Reaction Emoji Icons */}
                      <div className="flex -space-x-1">
                        {Object.entries(post.stats?.reactions || {})
                          .filter(([_, count]) => count > 0)
                          .slice(0, 3)
                          .map(([type, _], index) => (
                            <div 
                              key={type} 
                              className={`w-6 h-6 rounded-full flex items-center justify-center bg-white dark:bg-gray-700 border-2 border-white dark:border-gray-800 ${index === 0 ? 'z-30' : index === 1 ? 'z-20' : 'z-10'}`}
                            >
                              <span className="text-xs">{getReactionEmoji(type)}</span>
                            </div>
                          ))}
                        {Object.values(post.stats?.reactions || {}).reduce((a, b) => a + b, 0) === 0 && (
                          <div className="w-6 h-6 rounded-full flex items-center justify-center bg-white dark:bg-gray-700 border-2 border-white dark:border-gray-800">
                            {hasUserReacted ? <AiFillHeart className="h-3 w-3 text-red-500" /> : <AiOutlineHeart className="h-3 w-3" />}
                          </div>
                        )}
                      </div>
                      
                      {/* Reaction Count Text */}
                      <span className="text-sm">
                        {Object.values(post.stats?.reactions || {}).reduce((a, b) => a + b, 0) || ""} {Object.values(post.stats?.reactions || {}).reduce((a, b) => a + b, 0) > 0 ? "Reactions" : "React"}
                      </span>
                    </div>
                  </Button>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-auto p-2 bg-white dark:bg-gray-800 rounded-full border-none shadow-xl"
                  sideOffset={5}
                >
                  <div className="flex items-center gap-1">
                    {REACTION_OPTIONS.map(({ type, emoji, label }) => (
                      <button
                        key={type}
                        onClick={() => handleReact(post._id, type)}
                        className="group relative p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all duration-200 transform hover:scale-125"
                      >
                        <span className="text-2xl transition-transform duration-200 group-hover:scale-110">
                          {emoji}
                        </span>
                        <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {label}
                        </span>
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              
              {/* Comment Button with Count */}
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex-1 gap-2 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20" 
                onClick={() => handleOpenPostActivity(post)}
              >
                <FaRegCommentDots className="h-5 w-5" />
                <span>{post.comments?.length || 0} {post.comments?.length === 1 ? "Comment" : "Comments"}</span>
              </Button>
              
              {/* Save Button */}
              <Button 
                variant="ghost" 
                size="sm" 
                className={`flex-1 gap-2 hover:bg-purple-50 dark:hover:bg-purple-900/20 ${
                  savedPosts.some(savedPost => savedPost._id === post._id) 
                    ? 'text-purple-500' 
                    : 'hover:text-purple-500'
                }`}
                onClick={() => toggleSavePost(post)}
              >
                <FaBookmark className="h-5 w-5" />
                <span>Save</span>
              </Button>
            </div>
          </CardFooter>
        </Card>
      )
    })
  }

  const renderPostActivity = () => {
    if (!activePost) return null;

    const getAuthorName = (author) => {
      if (!author) return 'Anonymous';
      return `${author.firstName} ${author.lastName}`;
    };

    return (
      <Dialog open={!!activePost} onOpenChange={handleClosePostActivity}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Post Activity</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Reactions</h3>
              {activePost.reactions?.length > 0 ? (
                <div className="flex gap-2 flex-wrap">
                  {activePost.reactions?.map((reaction, index) => (
                    <div key={index} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-full px-3 py-1">
                      <span className="text-xl">{getReactionEmoji(reaction.type)}</span>
                      <span className="text-sm">{getAuthorName(reaction.user)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 dark:bg-gray-700/50 flex items-center justify-center">
                    <Heart className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400">No reactions yet</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                    Be the first to react to this post
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Comments</h3>
              <ScrollArea className="h-[400px] pr-4">
                {activePost.comments?.length > 0 ? (
                  activePost.comments?.map((comment, index) => (
                    <div
                      key={comment._id || index}
                      className="flex items-start gap-3 mb-6"
                    >
                      <Avatar>
                        <AvatarImage
                          src={comment.author?.image}
                          alt={getAuthorName(comment.author)}
                        />
                        <AvatarFallback className="bg-green-500 text-white">
                          {comment.author?.firstName?.[0]}
                          {comment.author?.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                          <p className="font-semibold">
                            {getAuthorName(comment.author)}
                          </p>
                          <p className="text-sm mt-1">{comment.content}</p>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span>{formatMessageTime(comment.createdAt)}</span>
                          <button className="hover:text-gray-700">Like</button>
                          <button className="hover:text-gray-700">Reply</button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-[300px] text-center">
                    <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 dark:bg-gray-700/50 flex items-center justify-center">
                      <MessageSquare className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                    </div>
                    <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      No comments yet
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                      Start the conversation! Be the first to share your thoughts on this post.
                    </p>
                  </div>
                )}
              </ScrollArea>

              <div className="flex items-start gap-3 mt-4 pt-4 border-t">
                <Avatar>
                  <AvatarImage
                    src={sellerProfile?.image}
                    alt={sellerProfile?.firstName}
                  />
                  <AvatarFallback className="bg-green-500 text-white">
                    {sellerProfile?.firstName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-3">
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="min-h-[100px] resize-none"
                  />
                  <Button
                    onClick={() => handleAddComment(activePost._id, newComment)}
                    disabled={!newComment.trim() || isLoading}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Posting...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Send className="h-4 w-4" />
                        Post Comment
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const handleTabChange = (value) => {
    setSelectedTab(value)
  }

  const renderBlips = () => {
    if (!blips || blips.length === 0) {
      return (
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold text-gray-600">No blips available</h3>
          <p className="text-gray-500 mt-2">Check back later for new content</p>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {blips.map(blip => (
          <div
            key={blip._id}
            className="relative group cursor-pointer"
            onClick={() => handleBlipClick(blip)}
          >
            <div className="relative aspect-[9/16] rounded-xl overflow-hidden">
              <img
                src={blip.images || "https://v0.dev/placeholder.svg"}
                alt={blip.productName}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="font-semibold text-white">{blip.productName}</h3>
                <p className="text-sm text-gray-200">₦{blip.price?.toLocaleString()}</p>
                <div className="flex justify-between text-xs text-gray-300 mt-2">
                  <span>{blip.reviewCount || 0} reviews</span>
                  <span>Rating: {blip.averageRating || 'N/A'}</span>
                </div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-12 h-12 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
                  <div className="w-0 h-0 border-t-8 border-t-transparent border-l-12 border-l-white border-b-8 border-b-transparent ml-1" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const handleBlipClick = (blip) => {
    setSelectedBlip(blip)
  }

  const handleCloseVideo = () => {
    setSelectedBlip(null)
  }

  const renderVideoPlayer = () => {
    if (!selectedBlip) return null

    return (
      <Dialog open={!!selectedBlip} onOpenChange={handleCloseVideo}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden bg-black">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-50 text-white hover:bg-white/20"
              onClick={handleCloseVideo}
            >
              <X className="h-6 w-6" />
            </Button>

            <video
              src={selectedBlip.blipUrl}
              className="w-full aspect-[9/16]"
              controls
              autoPlay
              playsInline
            >
              Your browser does not support the video tag.
            </video>

            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
              <h3 className="text-xl font-semibold text-white mb-2">
                {selectedBlip.productName}
              </h3>
              <div className="flex justify-between items-center">
                <p className="text-lg text-white">
                  ₦{selectedBlip.price?.toLocaleString()}
                </p>
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => {
                    console.log('View product:', selectedBlip.productId)
                  }}
                >
                  View Product
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const handleCreatePost = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const sellerToken = localStorage.getItem('sellerToken');
      if (!sellerToken) throw new Error('Not authenticated');

      const tokenData = JSON.parse(sellerToken);
      const token = tokenData.data;

      const formData = new FormData();
      formData.append('title', postForm.title);
      formData.append('body', postForm.body);
      
      // Handle tags
      if (postForm.tags) {
        formData.append('tags', postForm.tags);
      }
      
      formData.append('visibility', postForm.visibility);

      // Handle media files
      postForm.media.forEach(file => {
        formData.append('media', file);
      });

      // Handle product IDs - make sure to join with commas and no spaces
      if (postForm.productIds && postForm.productIds.length > 0) {
        formData.append('productIds', postForm.productIds.join(','));
      }

      const response = await fetch(`${BASE_URL}/posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) throw new Error('Failed to create post');

      toast.success('Post created successfully');
      setIsCreatePostOpen(false);
      setPostForm({
        title: '',
        body: '',
        tags: '',
        visibility: 'public',
        media: [],
        productIds: []
      });

      // Fetch posts after successful creation
      fetchPosts();

    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      const sellerToken = localStorage.getItem('sellerToken')
      if (!sellerToken) throw new Error('Not authenticated')

      const tokenData = JSON.parse(sellerToken)
      const token = tokenData.data

      const response = await fetch(`${BASE_URL}/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error('Failed to delete post')

      toast.success('Post deleted successfully')
      fetchPosts()

    } catch (error) {
      toast.error('Failed to delete post: ' + error.message)
    }
  }

  const renderChatList = () => (
    <ScrollArea className="h-full">
      {conversations && conversations.length > 0 ? (
        conversations.map((conv) => (
          <div
            key={conv._id}
            className={`p-3 hover:bg-gray-100 cursor-pointer transition-colors border-b border-gray-100 ${
              currentConversation?._id === conv._id ? 'bg-green-50' : ''
            }`}
            onClick={() => {
              setCurrentConversation(conv)
              navigate('/dashboard/messages', {
                state: {
                  conversationId: conv._id,
                  participantId: conv.participant.id,
                  participantName: conv.participant.name
                }
              })
            }}
          >
            <div className="flex items-center gap-2">
              <Avatar className="h-10 w-10">
                <AvatarImage src={conv.participant.avatar || "/placeholder.svg"} />
                <AvatarFallback>{conv.participant.name[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-0.5">
                  <h3 className="text-sm font-medium text-gray-900 truncate">
                    {conv.participant.name}
                  </h3>
                  <span className="text-xs text-gray-500">
                    {formatMessageTime(conv.lastMessage.createdAt)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-gray-600 truncate max-w-[180px]">
                    {conv.lastMessage.content.length > 50 
                      ? `${conv.lastMessage.content.substring(0, 50)}...` 
                      : conv.lastMessage.content}
                  </p>
                  {conv.unreadCount > 0 && (
                    <span className="inline-flex items-center justify-center bg-green-600 text-white text-xs rounded-full h-4 min-w-[16px] px-1">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="flex flex-col items-center justify-center h-full p-4 text-gray-500">
          <MessageSquare className="h-8 w-8 text-gray-300 mb-2" />
          <p className="text-sm">No conversations yet</p>
        </div>
      )}
    </ScrollArea>
  );

  // Add fetchPosts function
  const fetchPosts = async () => {
    try {
      const sellerToken = localStorage.getItem('sellerToken');
      if (!sellerToken) throw new Error('Not authenticated');

      const tokenData = JSON.parse(sellerToken);
      const token = tokenData.data;

      const response = await fetch(`${BASE_URL}/posts`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch posts');

      const data = await response.json();
      setPosts(data.posts);
      setTrendingPosts(data.posts.filter(post => post.stats?.likeCount > 0));
      setNewPosts(data.posts.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      setMyPosts(data.posts.filter(post => post.author?.id === tokenData.user?._id));
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Failed to fetch posts');
    }
  };

  // Add useEffect to fetch posts on component mount
  useEffect(() => {
    fetchPosts();
  }, []);

  const renderMediaGallery = (post, currentSlideIndex, postImages) => {
    const postVideos = post.videos || [];
    const allMedia = [
      ...(postImages || []).map(img => ({ type: 'image', url: img.url })),
      ...(postVideos || []).map(vid => ({ type: 'video', url: vid.url }))
    ];
    const totalMediaCount = allMedia.length;
    
    if (totalMediaCount === 0) return null;

    const MediaItem = ({ item, className, onClick }) => (
      <div
        className={`relative overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-800 ${className}`}
        onClick={onClick}
      >
        {item.type === 'image' ? (
          <img
            src={item.url}
            alt="Post media"
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <video
            src={item.url}
            className="w-full h-full object-cover"
            controls
            playsInline
          />
        )}
      </div>
    );

    if (totalMediaCount === 1) {
      return (
        <div className="mt-4 relative rounded-xl overflow-hidden px-4 max-h-[450px]">
          <div className="aspect-[16/10]">
            <MediaItem item={allMedia[0]} className="h-full" />
          </div>
        </div>
      );
    }

    if (totalMediaCount === 2) {
      return (
        <div className="mt-4 grid grid-cols-2 gap-1 px-4 max-h-[450px]">
          {allMedia.map((item, index) => (
            <div key={index} className="aspect-[4/3]">
              <MediaItem item={item} className="h-full" />
            </div>
          ))}
        </div>
      );
    }

    if (totalMediaCount >= 3) {
      return (
        <div className="mt-4 px-4 max-h-[450px]">
          <div className="grid grid-cols-12 gap-1 h-full">
            <div className="col-span-7 h-[450px]">
              <MediaItem 
                item={allMedia[0]} 
                className="h-full"
                onClick={() => {
                  setActiveGalleryPost(post);
                  setActiveMediaIndex(0);
                  setIsGalleryOpen(true);
                }}
              />
            </div>
            <div className="col-span-5 grid grid-rows-2 gap-1 h-[450px]">
              <div className="h-[224px]">
                <MediaItem 
                  item={allMedia[1]} 
                  className="h-full"
                  onClick={() => {
                    setActiveGalleryPost(post);
                    setActiveMediaIndex(1);
                    setIsGalleryOpen(true);
                  }}
                />
              </div>
              <div className="relative h-[224px] cursor-pointer" onClick={() => {
                setActiveGalleryPost(post);
                setActiveMediaIndex(2);
                setIsGalleryOpen(true);
              }}>
                <MediaItem item={allMedia[2]} className="h-full" />
                {totalMediaCount > 3 && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center hover:bg-black/70 transition-colors">
                    <span className="text-white text-lg font-medium">
                      +{totalMediaCount - 3}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  const MediaGalleryModal = ({ post, isOpen, onClose, initialIndex = 0 }) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const allMedia = [
      ...(post?.images || []).map(img => ({ type: 'image', url: img.url })),
      ...(post?.videos || []).map(vid => ({ type: 'video', url: vid.url }))
    ];

    const handlePrevious = () => {
      setCurrentIndex((prev) => (prev === 0 ? allMedia.length - 1 : prev - 1));
    };

    const handleNext = () => {
      setCurrentIndex((prev) => (prev === allMedia.length - 1 ? 0 : prev + 1));
    };

    if (!post) return null;

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none overflow-hidden sm:max-w-[85vw] sm:max-h-[85vh]">
          <div className="relative flex flex-col h-[calc(100vh-40px)] sm:h-[80vh]">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
              <div className="flex items-center gap-4 text-white">
                <span className="text-sm">
                  {currentIndex + 1} / {allMedia.length}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={onClose}
              >
                <X className="h-6 w-6" />
              </Button>
            </div>

            {/* Main Content */}
            <div className="relative flex-1 flex items-center justify-center p-4 overflow-hidden">
              {/* Navigation Buttons */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 z-10 rounded-full bg-black/50 text-white hover:bg-black/70"
                onClick={handlePrevious}
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 z-10 rounded-full bg-black/50 text-white hover:bg-black/70"
                onClick={handleNext}
              >
                <ChevronRight className="h-8 w-8" />
              </Button>

              {/* Media Display */}
              <div className="relative w-full h-full flex items-center justify-center">
                {allMedia[currentIndex]?.type === 'image' ? (
                  <img
                    src={allMedia[currentIndex].url}
                    alt={`Media ${currentIndex + 1}`}
                    className="max-w-full max-h-full w-auto h-auto object-contain"
                    style={{
                      maxHeight: 'calc(100vh - 200px)',
                      maxWidth: 'calc(100vw - 100px)'
                    }}
                  />
                ) : (
                  <video
                    src={allMedia[currentIndex].url}
                    controls
                    playsInline
                    className="max-w-full max-h-full w-auto h-auto object-contain"
                    style={{
                      maxHeight: 'calc(100vh - 200px)',
                      maxWidth: 'calc(100vw - 100px)'
                    }}
                  />
                )}
              </div>
            </div>

            {/* Thumbnails */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent">
              <div className="flex justify-center gap-2 p-4 overflow-x-auto">
                {allMedia.map((media, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden transition-all ${
                      currentIndex === index ? 'ring-2 ring-white ring-offset-2 ring-offset-black' : 'opacity-50'
                    }`}
                  >
                    {media.type === 'image' ? (
                      <img
                        src={media.url}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                        <video
                          src={media.url}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  // Add a new ReactionPopover component
  const ReactionPopover = ({ postId, hasUserReacted, onReact }) => {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className={`flex-1 gap-2 hover:bg-red-50 dark:hover:bg-red-900/20 ${
              hasUserReacted ? 'text-red-500' : 'hover:text-red-500'
            }`}
          >
            {hasUserReacted ? (
              <AiFillHeart className="h-5 w-5" />
            ) : (
              <AiOutlineHeart className="h-5 w-5" />
            )}
            <span>React</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-auto p-2 bg-white dark:bg-gray-800 rounded-full border-none shadow-xl"
          sideOffset={5}
        >
          <div className="flex items-center gap-1">
            {REACTION_OPTIONS.map(({ type, emoji, label }) => (
              <button
                key={type}
                onClick={() => onReact(postId, type)}
                className="group relative p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all duration-200 transform hover:scale-125"
              >
                <span className="text-2xl transition-transform duration-200 group-hover:scale-110">
                  {emoji}
                </span>
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {label}
                </span>
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    );
  };

  // Add searchPosts function
  const searchPosts = async (query) => {
    try {
      setIsLoading(true);
      const response = await fetch(`${BASE_URL}/posts/search?q=${encodeURIComponent(query)}&limit=10`);
      if (!response.ok) throw new Error('Failed to search posts');
      const data = await response.json();
      setPosts(data.posts);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search posts');
    } finally {
      setIsLoading(false);
    }
  };

  // Add debounce function to prevent too many API calls
  const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  // Create debounced search function
  const debouncedSearch = debounce(searchPosts, 500);

  // Modify the search input handler
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.trim()) {
      debouncedSearch(query);
    } else {
      // If search is cleared, revert to default posts
      fetchPosts();
    }
  };

  const toggleSavePost = (post) => {
    const savedPostsStr = localStorage.getItem('savedPosts') || '[]';
    const currentSavedPosts = JSON.parse(savedPostsStr);
    
    const isPostSaved = currentSavedPosts.some(savedPost => savedPost._id === post._id);
    let newSavedPosts;
    
    if (isPostSaved) {
      newSavedPosts = currentSavedPosts.filter(savedPost => savedPost._id !== post._id);
      toast.success('Post removed from saved items');
    } else {
      newSavedPosts = [...currentSavedPosts, post];
      toast.success('Post saved successfully');
    }
    
    localStorage.setItem('savedPosts', JSON.stringify(newSavedPosts));
    setSavedPosts(newSavedPosts);
  };

  // Add this component inside SocialFeed but before the return statement
  const CreatePostInput = () => {
    return (
      <Card className="mb-6 bg-white dark:bg-gray-800/90 border border-gray-100 dark:border-gray-700/50 -sm hover:-md transition-all rounded-xl overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 ring-2 ring-white dark:ring-gray-800">
              <AvatarImage 
                src={sellerProfile?.storeAvatar?.url} 
                alt={sellerProfile?.storeName}
                className="object-cover"
              />
              <AvatarFallback className="bg-green-500 text-white">
                {sellerProfile?.storeName?.[0] || 'S'}
              </AvatarFallback>
            </Avatar>
            <div 
              className="flex-1 bg-gray-100 dark:bg-gray-700/50 rounded-full px-4 py-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              onClick={() => setIsCreatePostOpen(true)}
            >
              <span className="text-gray-500 dark:text-gray-400">
                What's on your mind?
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => setIsCreatePostOpen(true)}
            >
              <PenSquare className="h-5 w-5 text-gray-500" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[80dvh]">
        <div className="w-1/4">
          <LinearProgress color="success" />
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
      <div className=' mx-auto py-6 px-4 sm:px-6 lg:px-8'>
        <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8'>
          {/* What's on your mind input - Now on the left and larger */}
          <div className='flex-1'>
            <div className="flex items-center gap-3 bg-white dark:bg-gray-800/90 rounded-xl px-4 py-3 border border-gray-200 dark:border-gray-700/50 hover:border-gray-300 dark:hover:border-gray-600 transition-colors -sm hover:-md">
              <Avatar className="h-10 w-10 ring-2 ring-white dark:ring-gray-800">
                <AvatarImage 
                  src={sellerProfile?.storeAvatar?.url} 
                  alt={sellerProfile?.storeName}
                  className="object-cover"
                />
                <AvatarFallback className="bg-green-500 text-white">
                  {sellerProfile?.storeName?.[0] || 'S'}
                </AvatarFallback>
              </Avatar>
              <div 
                className="flex-1 cursor-pointer bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-600/50 px-4 py-2.5 rounded-lg transition-colors"
                onClick={() => setIsCreatePostOpen(true)}
              >
                <span className="text-gray-500 dark:text-gray-400">
                  What's on your mind?
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full bg-green-500 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-600/50"
                onClick={() => setIsCreatePostOpen(true)}
              >
                <Plus className="h-5 w-5 text-white dark:text-gray-400" />
              </Button>
            </div>
          </div>

          {/* Improved Search Input - Now on the right */}
          <div className='md:w-72'>
            <div className="relative">
              <div className="relative flex items-center">
                <Input
                  placeholder="Search posts, people, or tags..."
                  className="pl-11 pr-4 h-12 bg-white dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700/50 rounded-xl hover:border-gray-300 dark:hover:border-gray-600 transition-colors -sm hover:-md"
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                  ) : (
                    <Search className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 h-8 w-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => {
                      setSearchQuery('');
                      fetchPosts();
                    }}
                  >
                    <X className="h-4 w-4 text-gray-500" />
                  </Button>
                )}
              </div>
              {isLoading && searchQuery && (
                <div className="absolute w-full mt-1 py-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 -lg">
                  <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                    Searching...
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <Tabs value={selectedTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 mb-6 md:mb-8 p-1 rounded-xl">
                <TabsTrigger value="all">ALL</TabsTrigger>
                <TabsTrigger value="new">NEW</TabsTrigger>
                <TabsTrigger value="trending">TRENDING</TabsTrigger>
                <TabsTrigger value="my-posts" className="hidden md:block">MY POSTS</TabsTrigger>
                <TabsTrigger value="saved" className="hidden md:block">SAVED</TabsTrigger>
                <TabsTrigger value="blips" className="hidden md:block">BLIPS</TabsTrigger>
              </TabsList>

              <TabsList className="grid w-full grid-cols-3 mb-6 p-1 rounded-xl md:hidden">
                <TabsTrigger value="my-posts">MY POSTS</TabsTrigger>
                <TabsTrigger value="saved">SAVED</TabsTrigger>
                <TabsTrigger value="blips">BLIPS</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-6">
                {renderPosts()}
              </TabsContent>

              <TabsContent value="new" className="space-y-6">
                {renderPosts()}
              </TabsContent>

              <TabsContent value="trending" className="space-y-6">
                {renderPosts()}
              </TabsContent>

              <TabsContent value="my-posts" className="space-y-6">
                {renderPosts()}
              </TabsContent>

              <TabsContent value="saved" className="space-y-6">
                {savedPosts.length > 0 ? (
                  renderPosts()
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <FaBookmark className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      No saved posts yet
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      Start saving posts to access them later
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="blips">
                {renderBlips()}
              </TabsContent>
            </Tabs>
          </div>

          <div className="w-80 hidden lg:block">
            <Card className="sticky top-8">
              <CardHeader className="p-4">
                <h2 className="text-xl font-bold">Messages</h2>
              </CardHeader>
              {renderChatList()}
            </Card>
          </div>
        </div>

        <Button
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full -lg bg-green-600 hover:bg-green-700 text-white lg:hidden"
          onClick={() => navigate('/dashboard/messages')}
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </div>

      {renderPostActivity()}
      {renderVideoPlayer()}
      <CreatePostModal
        isOpen={isCreatePostOpen}
        onClose={() => setIsCreatePostOpen(false)}
        onSubmit={handleCreatePost}
        isSubmitting={isSubmitting}
        postForm={postForm}
        setPostForm={setPostForm}
      />

      <MediaGalleryModal
        post={activeGalleryPost}
        isOpen={isGalleryOpen}
        onClose={() => {
          setIsGalleryOpen(false);
          setActiveGalleryPost(null);
          setActiveMediaIndex(0);
        }}
        initialIndex={activeMediaIndex}
      />

    
    </div>
  )
}
