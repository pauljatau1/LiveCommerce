import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Heart, MessageCircle, Share2, MoreVertical, ChevronLeft, ChevronRight } from "lucide-react";
import { BASE_URL } from "@/Constants/Server";
import LinearProgress from "@mui/material/LinearProgress";

export default function PostsTab({ sellerId }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [slideIndices, setSlideIndices] = useState({});

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

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <LinearProgress color="success" className="w-1/3" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 text-red-500">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <Card key={post._id} className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
            <div className="flex items-center space-x-4">
              <Avatar>
                <AvatarImage src={post.author?.image || "/placeholder.svg"} />
                <AvatarFallback>{post.author?.name?.[0]}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">{post.author?.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(post.createdAt), "MMM d, yyyy")}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </CardHeader>

          <CardContent className="pb-4 space-y-4">
            <div className="px-4">
              <h4 className="font-semibold mb-2">{post.title}</h4>
              <p className="text-muted-foreground">{post.body}</p>
            </div>

            {renderMediaGallery(post)}

            {/* Tagged Products */}
            {post.products && post.products.length > 0 && (
              <div className="flex gap-2 overflow-x-auto py-2 px-4">
                {post.products.filter((p) => p.id).map((product) => (
                  <Badge
                    key={product.id}
                    variant="secondary"
                    className="flex items-center gap-2 px-3 py-1.5"
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
                  <Badge key={tag} variant="outline">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Interaction Buttons */}
            <div className="flex items-center gap-4 pt-2 px-4">
              <Button variant="ghost" size="sm" className="text-red-500">
                <Heart className="h-4 w-4 mr-2" />
                {post.stats?.likeCount || 0}
              </Button>
              <Button variant="ghost" size="sm">
                <MessageCircle className="h-4 w-4 mr-2" />
                {post.comments?.length || 0}
              </Button>
              <Button variant="ghost" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                {post.stats?.shareCount || 0}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
