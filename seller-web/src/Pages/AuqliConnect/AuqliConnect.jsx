import { useState, useEffect, useRef } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, MoreVertical, X, ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react';
import { Search } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
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
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

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

// Create a new separate component for the create post modal
const CreatePostModal = ({ isOpen, onClose, onSubmit, isSubmitting, postForm, setPostForm }) => {
  const { setHeaderName, setNavName } = useOutletContext();
  const [previews, setPreviews] = useState([])
  const [sellerProducts, setSellerProducts] = useState([])
  const [open, setOpen] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState([])

  const handleMediaChange = (e) => {
    const files = Array.from(e.target.files)
    setPostForm(prev => ({
      ...prev,
      media: files
    }))

    // Generate previews
    const newPreviews = files.map(file => ({
      url: URL.createObjectURL(file),
      type: file.type.startsWith('image/') ? 'image' : 'video'
    }))
    
    // Clean up previous preview URLs
    previews.forEach(preview => URL.revokeObjectURL(preview.url))
    setPreviews(newPreviews)
  }

  // Cleanup preview URLs when modal closes
  useEffect(() => {
    return () => {
      previews.forEach(preview => URL.revokeObjectURL(preview.url))
    }
  }, [])
 
  useEffect(() => {
    setHeaderName('Customers');
    setNavName('');
  }, [setHeaderName, setNavName])

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

  // Update postForm when products are selected
  useEffect(() => {
    setPostForm(prev => ({
      ...prev,
      productIds: selectedProducts.map(p => p._id).filter(Boolean)
    }));
  }, [selectedProducts, setPostForm]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Post</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={postForm.title}
              onChange={(e) => setPostForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter post title"
              required
            />
          </div>

          <div>
            <Label htmlFor="body">Content</Label>
            <Textarea
              id="body"
              value={postForm.body}
              onChange={(e) => setPostForm(prev => ({ ...prev, body: e.target.value }))}
              placeholder="What's on your mind?"
              required
            />
          </div>

          <div>
            <Label htmlFor="media">Media</Label>
            <Input
              id="media"
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleMediaChange}
              className="cursor-pointer"
            />
            <p className="text-sm text-gray-500 mt-1">
              You can select multiple images and videos
            </p>
          </div>

          {/* Media Previews */}
          {previews.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
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
                      URL.revokeObjectURL(preview.url)
                      setPreviews(prev => prev.filter((_, i) => i !== index))
                      setPostForm(prev => ({
                        ...prev,
                        media: prev.media.filter((_, i) => i !== index)
                      }))
                    }}
                    className="absolute top-2 right-2 p-1 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
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

          {/* Add product selection before the tags field */}
          <div className="space-y-2">
            <Label>Tag Products</Label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between"
                >
                  {selectedProducts.length > 0
                    ? `${selectedProducts.length} products selected`
                    : "Select products..."}
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Search products..." />
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
            
            {/* Display selected products */}
            {selectedProducts.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedProducts.map((product) => (
                  <div
                    key={product._id}
                    className="flex items-center gap-2 bg-gray-100 rounded-md p-2"
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
          </div>

          <div>
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              value={postForm.tags}
              onChange={(e) => setPostForm(prev => ({ ...prev, tags: e.target.value }))}
              placeholder="Enter tags separated by commas"
            />
          </div>

          <div>
            <Label htmlFor="visibility">Visibility</Label>
            <Select
              value={postForm.visibility}
              onValueChange={(value) => setPostForm(prev => ({ ...prev, visibility: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isSubmitting ? 'Creating...' : 'Create Post'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

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
    <div className="mt-4 border-t pt-4">
      <h4 className="text-sm font-medium text-gray-500 mb-3">Tagged Products</h4>
      <div className="grid grid-cols-2 gap-2">
        {products.map((product) => (
          <div
            key={product.productId._id}
            className="flex items-center gap-3 p-2 rounded-lg border bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
            onClick={() => window.open(`/dashboard/products/${product.productId._id}`, '_blank')}
          >
            <img
              src={product.productId.images[0]?.url}
              alt={product.productId.name}
              className="w-12 h-12 object-cover rounded-md"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {product.productId.name}
              </p>
              <p className="text-sm text-gray-500">
                ₦{product.productId.price.toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function SocialFeed() {
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

  const handleAddComment = async (postId) => {
    if (!newComment.trim()) return;

    setIsLoading(true);
    try {
      const sellerToken = localStorage.getItem('sellerToken');
      if (!sellerToken) throw new Error('Not authenticated');

      const tokenData = JSON.parse(sellerToken);
      const token = tokenData.data;

      // Submit the comment
      const response = await fetch(`${BASE_URL}/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: newComment })
      });

      if (!response.ok) throw new Error('Failed to add comment');

      // Fetch updated post data
      const updatedPost = await fetchPostData(postId);

      // Update all post lists with the new data
      const updatePostInArray = (posts) =>
        posts.map(post => post._id === postId ? updatedPost : post);

      setPosts(prev => updatePostInArray(prev));
      setTrendingPosts(prev => updatePostInArray(prev));
      setNewPosts(prev => updatePostInArray(prev));
      setMyPosts(prev => updatePostInArray(prev));

      // Update active post
      setActivePost(updatedPost);

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

  const handleReact = async (postId) => {
    try {
      const sellerToken = localStorage.getItem('sellerToken');
      if (!sellerToken) throw new Error('Not authenticated');

      const tokenData = JSON.parse(sellerToken);
      const token = tokenData.data;

      const response = await fetch(`${BASE_URL}/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to react to post');

      // Fetch updated post data
      const updatedPost = await fetchPostData(postId);
      
      // Update all post lists
      const updatePostInArray = (posts) =>
        posts.map(post => post._id === postId ? updatedPost : post);

      setPosts(prev => updatePostInArray(prev));
      setTrendingPosts(prev => updatePostInArray(prev));
      setNewPosts(prev => updatePostInArray(prev));
      setMyPosts(prev => updatePostInArray(prev));

      // If the active post is the one being reacted to, update it as well
      if (activePost?._id === postId) {
        setActivePost(updatedPost);
      }

      toast.success('Reaction updated successfully');

    } catch (error) {
      toast.error('Failed to react to post: ' + error.message);
    }
  };

  const renderPosts = () => {
    let postsToRender = []
    switch (selectedTab) {
      case 'all':
        postsToRender = posts
        break
      case 'trending':
        postsToRender = trendingPosts
        break
      case 'new':
        postsToRender = newPosts
        break
      case 'my-posts':
        postsToRender = myPosts
        break
      default:
        postsToRender = posts
    }

    if (!postsToRender || postsToRender.length === 0) {
      return (
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold text-gray-600">No posts available</h3>
          <p className="text-gray-500 mt-2">Check back later for new content</p>
        </div>
      )
    }

    return postsToRender.map((post) => {
      if (!post || !post._id) return null

      const authorName = post.author?.name || post.author?.businessName || 'Anonymous'
      const authorImage = post.author?.image
      const postDate = post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'Unknown date'
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
        <Card key={post._id} className="overflow-hidden hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center space-y-0 p-4">
            <div className="flex items-center gap-3 flex-1">
              <Avatar className="h-10 w-10 uppercase ring-2 ring-green/10">
                <AvatarImage src={authorImage} />
                <AvatarFallback>{authorName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold u hover:underline cursor-pointer">
                  {authorName}
                </p>
                <p className="text-sm text-gray-500">{postDate}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="rounded-full">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </CardHeader>

          <CardContent className="p-4 pt-0 space-y-4">
            <p className="text-base md:text-lg">{postBody}</p>
            {postTags.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 md:flex-wrap custom-scrollbar">
                {postTags.map((tag, index) => (
                  <Badge
                    key={`${tag}-${index}`}
                    variant="secondary"
                    className="hover:bg-green/10 cursor-pointer"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
            {postImages.length > 0 && (
              <div className="relative rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-900">
                <div className="flex flex-col md:flex-row gap-4 p-4">
                  <div className="flex-1">
                    <div className="relative aspect-[16/9] rounded-xl overflow-hidden">
                      <img
                        src={postImages[currentSlideIndex]?.url}
                        alt={`Main image ${currentSlideIndex + 1}`}
                        className="w-full h-full object-contain"
                      />
                      {postImages.length > 1 && (
                        <>
                          <button
                            onClick={() => handleSlideChange(
                              post._id,
                              currentSlideIndex > 0 ? currentSlideIndex - 1 : postImages.length - 1
                            )}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full"
                          >
                            <ChevronLeft className="h-6 w-6" />
                          </button>
                          <button
                            onClick={() => handleSlideChange(
                              post._id,
                              currentSlideIndex < postImages.length - 1 ? currentSlideIndex + 1 : 0
                            )}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full"
                          >
                            <ChevronRight className="h-6 w-6" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {postImages.length > 1 && (
                    <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto md:w-32 md:max-h-[400px] custom-scrollbar">
                      {postImages.map((img, index) => (
                        <button
                          key={index}
                          onClick={() => handleSlideChange(post._id, index)}
                          className={`
                            relative w-full aspect-[16/9] rounded-lg overflow-hidden
                            transition-all duration-200
                            ${currentSlideIndex === index 
                              ? 'ring-2 ring-green-500 scale-105' 
                              : 'ring-1 ring-gray-200 dark:ring-gray-700 hover:ring-green-500'
                            }
                          `}
                        >
                          <img
                            src={img.url}
                            alt={`Thumbnail ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <div className={`
                            absolute inset-0 bg-black/20
                            ${currentSlideIndex === index ? 'opacity-0' : 'hover:opacity-0'}
                            transition-opacity duration-200
                          `} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Updated analytics section */}
                <div className="border-t border-gray-200 dark:border-gray-700 mt-4 pt-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex flex-col items-center p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                      <div className="flex items-center gap-2 text-gray-600">
                        <IoEyeOutline className="h-5 w-5" />
                        <span className="font-semibold">{post.stats?.viewCount || 0}</span>
                      </div>
                      <span className="text-gray-500 mt-1">Views</span>
                    </div>
                    <div className="flex flex-col items-center p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                      <div className="flex items-center gap-2 text-red-500">
                        <AiFillHeart className="h-5 w-5" />
                        <span className="font-semibold">{post.stats?.likeCount || 0}</span>
                      </div>
                      <span className="text-gray-500 mt-1">Likes</span>
                    </div>
                    <div className="flex flex-col items-center p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                      <div className="flex items-center gap-2 text-blue-500">
                        <FaRegCommentDots className="h-5 w-5" />
                        <span className="font-semibold">{post.comments?.length || 0}</span>
                      </div>
                      <span className="text-gray-500 mt-1">Comments</span>
                    </div>
                    <div className="flex flex-col items-center p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                      <div className="flex items-center gap-2 text-purple-500">
                        <FaShareSquare className="h-5 w-5" />
                        <span className="font-semibold">{post.stats?.shareCount || 0}</span>
                      </div>
                      <span className="text-gray-500 mt-1">Shares</span>
                    </div>
                  </div>

                  {/* Reaction and Comment Previews */}
                  <div className="mt-4 space-y-2 text-sm">
                    {reactionPreview && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <AiFillHeart className="h-4 w-4 text-red-500" />
                        <span>{reactionPreview}</span>
                      </div>
                    )}
                    {commentPreview && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <FaRegCommentDots className="h-4 w-4 text-blue-500" />
                        <span>{commentPreview}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Add the tagged products section */}
            <TaggedProducts products={post.products} />
          </CardContent>

          <CardFooter className="p-4 flex flex-col gap-4">
            <div className="flex justify-between items-center w-full">
              <div className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="gap-2" 
                  onClick={() => handleReact(post._id)}
                >
                  {hasUserReacted ? (
                    <AiFillHeart className="h-5 w-5 text-red-500" />
                  ) : (
                    <AiOutlineHeart className="h-5 w-5" />
                  )}
                  <span>{post.stats?.likeCount || 0}</span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="gap-2" 
                  onClick={() => handleOpenPostActivity(post)}
                >
                  <FaRegCommentDots className="h-5 w-5" />
                  <span>{post.comments?.length || 0}</span>
                </Button>
                <Button variant="ghost" size="sm" className="gap-2">
                  <FaShareSquare className="h-5 w-5" />
                  <span>Share</span>
                </Button>
              </div>
              <Button variant="ghost" size="sm" className="gap-2">
                <FaBookmark className={`h-5 w-5 ${post.bookmarked ? 'fill-current' : ''}`} />
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
              <div className="flex gap-2 flex-wrap">
                {activePost.reactions?.map((reaction, index) => (
                  <div key={index} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-full px-3 py-1">
                    <AiFillHeart className="h-4 w-4 text-red-500" />
                    <span className="text-sm">{getAuthorName(reaction.user)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Comments</h3>
              <ScrollArea className="h-[400px] pr-4">
                {activePost.comments?.map((comment, index) => (
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
                ))}
              </ScrollArea>

              <div className="flex items-start gap-3 mt-4 pt-4 border-t">
                <Avatar>
                  <AvatarFallback className="bg-green-500 text-white">
                    {localStorage.getItem('sellerToken') ? 
                      JSON.parse(localStorage.getItem('sellerToken')).user?.firstName?.[0] : 'U'}
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
                    onClick={() => handleAddComment(activePost._id)}
                    disabled={!newComment.trim() || isLoading}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isLoading ? 'Posting...' : 'Post Comment'}
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
    <div className='min-h-screen dark:bg-gray-900'>
     
      
      <div className='py-4 px-4 md:py-8 md:px-6'>
        <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 md:mb-8'>
          <div className='flex items-center justify-between md:justify-start gap-4'>
            <Input
              placeholder="Search posts, people, or tags..."
              className="flex-1 md:w-64 bg-white dark:bg-gray-800"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              prefix={<Search className="w-4 h-4 text-gray-400" />}
            />
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="md:hidden">
                <Bell className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => setIsCreatePostOpen(true)}
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white md:hidden"
              >
                +
              </Button>
            </div>
          </div>
          
          <div className='hidden md:flex items-center gap-4'>
            <Button variant="outline" className="gap-2">
              <Bell className="w-4 h-4" />
              <Badge variant="secondary" className="ml-1">3</Badge>
            </Button>
            <Button
              onClick={() => setIsCreatePostOpen(true)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Create Post
            </Button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <Tabs value={selectedTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="grid w-full grid-cols-3 md:grid-cols-5 mb-6 md:mb-8 p-1 rounded-xl">
                <TabsTrigger value="all">ALL</TabsTrigger>
                <TabsTrigger value="new">NEW</TabsTrigger>
                <TabsTrigger value="trending">TRENDING</TabsTrigger>
                <TabsTrigger value="my-posts" className="hidden md:block">MY POSTS</TabsTrigger>
                <TabsTrigger value="blips" className="hidden md:block">BLIPS</TabsTrigger>
              </TabsList>

              <TabsList className="grid w-full grid-cols-2 mb-6 p-1 rounded-xl md:hidden">
                <TabsTrigger value="my-posts">MY POSTS</TabsTrigger>
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
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-green-600 hover:bg-green-700 text-white lg:hidden"
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
    </div>
  )
}
