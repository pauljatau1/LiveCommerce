import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/Components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/Components/ui/avatar";
import { Button } from "@/Components/ui/button";
import { Badge } from "@/Components/ui/badge";
import { format } from "date-fns";
import { Heart, MessageCircle, Share2, MoreVertical, Pencil, Trash2, FileText } from "lucide-react";
import { BASE_URL } from "@/Constants/Server";
import { Skeleton } from "@/Components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/Components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";
import { Input } from "@/Components/ui/form/input";
import { Textarea } from "@/Components/ui/textarea";
import { useNotification } from '@/Hooks/useNotification';
import PropTypes from "prop-types";
export default function PostsTab({ sellerId }) {
  const [posts, setPosts] = useState([]);
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [updateFormData, setUpdateFormData] = useState({
    title: "",
    body: "",
    tags: "",
    visibility: "public"
  });

  useEffect(() => {
    if (sellerId) {
      fetchPosts();
    }
  }, [sellerId]);

  const fetchPosts = async () => {
    try {
      const sellerToken = localStorage.getItem("sellerToken");
      if (!sellerToken) throw new Error("Not authenticated");

      const tokenData = JSON.parse(sellerToken);
      const token = tokenData.data;

      const response = await fetch(`${BASE_URL}/posts/user/Seller/${sellerId}?page=1&limit=10&visibility=public`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch posts");
      }

      const data = await response.json();
      setPosts(data.posts || []);
    } catch (error) {
      console.error("Error fetching posts:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSlideChange = (postId, newIndex) => {
    setSlideIndices((prev) => ({
      ...prev,
      [postId]: newIndex,
    }));
  };

  const handleUpdatePost = async () => {
    try {
      const sellerToken = localStorage.getItem("sellerToken");
      if (!sellerToken) throw new Error("Not authenticated");

      const tokenData = JSON.parse(sellerToken);
      const token = tokenData.data;

      const response = await fetch(`${BASE_URL}/posts/user/Seller/${sellerId}/batch`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          updates: [{
            postId: selectedPost._id,
            title: updateFormData.title,
            body: updateFormData.body,
            tags: updateFormData.tags.split(',').map(tag => tag.trim()),
            visibility: updateFormData.visibility
          }]
        })
      });

      if (!response.ok) throw new Error("Failed to update post");

      showNotification("Post updated successfully", 'information', 'dismissible');
      setIsUpdateModalOpen(false);
      fetchPosts(); // Refresh posts
    } catch (error) {
      console.error("Update post error:", error);
      showNotification(error.message, 'error', 'dismissible');
    }
  };

  const handleDeletePost = async () => {
    try {
      const sellerToken = localStorage.getItem("sellerToken");
      if (!sellerToken) throw new Error("Not authenticated");

      const tokenData = JSON.parse(sellerToken);
      const token = tokenData.data;

      const response = await fetch(`${BASE_URL}/posts/user/Seller/${sellerId}/batch`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          postIds: [selectedPost._id]
        })
      });

      if (!response.ok) throw new Error("Failed to delete post");

      showNotification("Post deleted successfully", 'information', 'dismissible');
      setIsDeleteModalOpen(false);
      fetchPosts(); // Refresh posts
    } catch (error) {
      console.error("Delete post error:", error);
      showNotification(error.message, 'error', 'dismissible');
    }
  };

  const openUpdateModal = (post) => {
    setSelectedPost(post);
    setUpdateFormData({
      title: post.title,
      body: post.body,
      tags: post.tags?.join(', ') || '',
      visibility: post.visibility
    });
    setIsUpdateModalOpen(true);
  };

  const openDeleteModal = (post) => {
    setSelectedPost(post);
    setIsDeleteModalOpen(true);
  };

  const renderMediaGallery = (post) => {
    const postImages = post.images || [];
    const postVideos = post.videos || [];
    const allMedia = [
      ...postImages.map((img) => ({ type: "image", url: img.url })),
      ...postVideos.map((vid) => ({ type: "video", url: vid.url })),
    ];
    const totalMediaCount = allMedia.length;

    if (totalMediaCount === 0) return null;

    const MediaItem = ({ item, className }) => (
      <div className={`relative overflow-hidden rounded-lg bg-gray-200 ${className}`}>
        {item.type === "image" ? (
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

    MediaItem.propTypes = {
      item: PropTypes.object.isRequired,
      className: PropTypes.string,
    };

    if (totalMediaCount === 1) {
      return (
        <div className="relative rounded-xl overflow-hidden px-4 max-h-[450px]">
          <div className="aspect-[16/10]">
            <MediaItem item={allMedia[0]} className="h-full" />
          </div>
        </div>
      );
    }

    if (totalMediaCount === 2) {
      return (
        <div className="grid grid-cols-2 gap-1 px-4 max-h-[450px]">
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
        <div className="px-4 max-h-[450px]">
          <div className="grid grid-cols-12 gap-1 h-full">
            {/* Left side - larger image (spans 7 columns and full height) */}
            <div className="col-span-7 h-[450px]">
              <MediaItem item={allMedia[0]} className="h-full" />
            </div>

            {/* Right side - two images stacked (spans 5 columns) */}
            <div className="col-span-5 grid grid-rows-2 gap-1 h-[450px]">
              <div className="h-[224px]">
                {/* (450px - 1px gap) / 2 = 224.5px */}
                <MediaItem item={allMedia[1]} className="h-full" />
              </div>
              <div className="relative h-[224px]">
                <MediaItem item={allMedia[2]} className="h-full" />
                {totalMediaCount > 3 && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
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

  const PostSkeleton = () => (
    <Card className="overflow-hidden animate-pulse">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div>
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <Skeleton className="h-8 w-8 rounded-md" />
      </CardHeader>

      <CardContent className="pb-4 space-y-4">
        <div className="px-4">
          <Skeleton className="h-5 w-3/4 mb-2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full mt-1" />
        </div>

        <Skeleton className="h-64 w-full rounded-md mx-4" />

        <div className="flex gap-2 overflow-x-auto py-2 px-4">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>

        <div className="flex items-center gap-4 pt-2 px-4">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <PostSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="text-red-500 bg-red-50 p-4 rounded-lg border border-red-200 mb-4">
          <p className="font-medium">Error: {error}</p>
        </div>
        <Button 
          onClick={() => { setLoading(true); fetchPosts(); }}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-16 px-4 bg-zinc-50 rounded-lg border border-zinc-200">
        <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-xl font-medium mb-2">No Posts Yet</h3>
        <p className="text-muted-foreground max-w-md mx-auto mb-6">
          Share updates about your products, business, or promotions to engage with your customers!
        </p>
        <Button className="bg-green-600 hover:bg-green-700">
          Create Your First Post
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <Card key={post._id} className="overflow-hidden hover:shadow-md transition-all duration-200 border border-zinc-200 hover:border-zinc-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 bg-white border-b border-zinc-100">
            <div className="flex items-center space-x-4">
              <Avatar className="ring-2 ring-zinc-100 border border-zinc-200">
                <AvatarImage src={post.author?.image || "/placeholder.svg"} />
                <AvatarFallback className="bg-gradient-to-br from-green-100 to-green-200 text-green-800">
                  {post.author?.name?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">{post.author?.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(post.createdAt), "MMM d, yyyy")}
                </p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-zinc-100">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => openUpdateModal(post)} className="cursor-pointer">
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Post
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => openDeleteModal(post)}
                  className="text-red-600 focus:text-red-700 cursor-pointer"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Post
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>

          <CardContent className="pb-4 space-y-4 pt-3">
            <div className="px-4">
              <h4 className="font-semibold mb-2 text-lg">{post.title}</h4>
              <p className="text-muted-foreground leading-relaxed">{post.body}</p>
            </div>

            {renderMediaGallery(post)}

            {/* Tagged Products */}
            {post.products && post.products.length > 0 && (
              <div className="flex gap-2 overflow-x-auto py-2 px-4 no-scrollbar">
                {post.products.filter((p) => p.id).map((product) => (
                  <Badge
                    key={product.id}
                    variant="secondary"
                    className="flex items-center gap-2 px-3 py-1.5 bg-green-50 hover:bg-green-100 transition-colors border border-green-200 whitespace-nowrap"
                  >
                    <img
                      src={product.images[0]?.url}
                      alt={product.name}
                      className="w-4 h-4 rounded-full object-cover"
                    />
                    {product.name}
                  </Badge>
                ))}
              </div>
            )}

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 px-4">
                {post.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-zinc-600 hover:text-zinc-900 transition-colors">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Interaction Buttons */}
            <div className="flex items-center gap-4 pt-2 px-4 border-t border-zinc-100 mt-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-zinc-600 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <Heart className="h-4 w-4 mr-2" />
                {post.stats?.likeCount || 0}
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                className="text-zinc-600 hover:text-blue-500 hover:bg-blue-50 transition-colors"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                {post.comments?.length || 0}
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                className="text-zinc-600 hover:text-green-500 hover:bg-green-50 transition-colors"
              >
                <Share2 className="h-4 w-4 mr-2" />
                {post.stats?.shareCount || 0}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Update Post Modal */}
      <Dialog open={isUpdateModalOpen} onOpenChange={setIsUpdateModalOpen} size="lg">
        <DialogContent className="sm:max-w-[605px]">
          <DialogHeader>
            <DialogTitle>Edit Post</DialogTitle>
            <DialogDescription>
              Make changes to your post here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="title">Title</label>
              <Input
                id="title"
                value={updateFormData.title}
                onChange={(e) => setUpdateFormData(prev => ({
                  ...prev,
                  title: e.target.value
                }))}
                className="focus-visible:ring-green-500"
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="body">Content</label>
              <Textarea
                id="body"
                value={updateFormData.body}
                onChange={(e) => setUpdateFormData(prev => ({
                  ...prev,
                  body: e.target.value
                }))}
                className="focus-visible:ring-green-500 min-h-[100px]"
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="tags">Tags (comma-separated)</label>
              <Input
                id="tags"
                value={updateFormData.tags}
                onChange={(e) => setUpdateFormData(prev => ({
                  ...prev,
                  tags: e.target.value
                }))}
                className="focus-visible:ring-green-500"
                placeholder="e.g. sale, announcement, fashion"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUpdateModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdatePost}
              className="bg-green-600 hover:bg-green-700"
            >
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Post Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Post</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeletePost}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

PostsTab.propTypes = {
  sellerId: PropTypes.string.isRequired,
};
