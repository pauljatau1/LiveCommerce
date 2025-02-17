import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { MoreHorizontal, Globe, Lock, Pencil, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatMessageTime } from './utils/formatters';
import MediaGalleryModal from './MediaGalleryModal';
import PostActivity from './PostActivity';
import TaggedProducts from './TaggedProducts';

const PostCard = ({
  post,
  currentUser,
  onEdit,
  onDelete,
  onAddComment,
  onDeleteComment,
  onAddReaction,
  isSubmitting
}) => {
  const [showMediaGallery, setShowMediaGallery] = useState(false);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);

  const handleMediaClick = (index) => {
    setSelectedMediaIndex(index);
    setShowMediaGallery(true);
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700/50 overflow-hidden">
      {/* Post Header */}
      <div className="p-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link to={`/dashboard/sellers/${post.author._id}`}>
            <Avatar className="h-10 w-10">
              <img
                src={post.author.profileImage || '/placeholder-user.png'}
                alt={post.author.firstName}
                className="w-full h-full object-cover"
              />
            </Avatar>
          </Link>
          <div>
            <Link 
              to={`/dashboard/sellers/${post.author._id}`}
              className="font-medium text-gray-900 dark:text-gray-100 hover:underline"
            >
              {post.author.firstName} {post.author.lastName}
            </Link>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span>{formatMessageTime(post.createdAt)}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                {post.visibility === 'public' ? (
                  <Globe className="h-3 w-3" />
                ) : (
                  <Lock className="h-3 w-3" />
                )}
                {post.visibility.charAt(0).toUpperCase() + post.visibility.slice(1)}
              </span>
            </div>
          </div>
        </div>

        {currentUser?._id === post.author._id && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(post)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 dark:text-red-400"
                onClick={() => onDelete(post._id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Post Content */}
      <div className="px-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {post.title}
        </h2>
        <p className="text-gray-800 dark:text-gray-200 whitespace-pre-line">
          {post.body}
        </p>
      </div>

      {/* Media Grid */}
      {post.media && post.media.length > 0 && (
        <div className={`grid gap-1 mt-4 ${
          post.media.length === 1 ? 'grid-cols-1' :
          post.media.length === 2 ? 'grid-cols-2' :
          post.media.length === 3 ? 'grid-cols-2' :
          'grid-cols-2'
        }`}>
          {post.media.slice(0, 4).map((media, index) => {
            const isVideo = media.type === 'video' || media.url.includes('.mp4');
            const isLastItem = index === 3 && post.media.length > 4;

            return (
              <div
                key={index}
                className={`relative aspect-square cursor-pointer ${
                  post.media.length === 3 && index === 0 ? 'col-span-2' : ''
                }`}
                onClick={() => handleMediaClick(index)}
              >
                {isVideo ? (
                  <video
                    src={media.url}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={media.url}
                    alt={`Media ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                )}
                {isLastItem && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white text-xl font-medium">
                      +{post.media.length - 4}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Tagged Products */}
      <div className="px-4">
        <TaggedProducts products={post.products} />
      </div>

      {/* Post Activity */}
      <div className="px-4 pb-4">
        <PostActivity
          comments={post.comments}
          reactions={post.reactions}
          currentUser={currentUser}
          onAddComment={(content) => onAddComment(post._id, content)}
          onDeleteComment={(commentId) => onDeleteComment(post._id, commentId)}
          onAddReaction={() => onAddReaction(post._id)}
          isSubmitting={isSubmitting}
        />
      </div>

      {/* Media Gallery Modal */}
      <MediaGalleryModal
        isOpen={showMediaGallery}
        onClose={() => setShowMediaGallery(false)}
        media={post.media}
        initialIndex={selectedMediaIndex}
      />
    </div>
  );
};

export default PostCard; 