import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { MoreHorizontal, Globe, Lock, Pencil, Trash2, MessageSquare } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatMessageTime } from './utils/formatters';
import MediaGalleryModal from './MediaGalleryModal';

const BlipCard = ({
  blip,
  currentUser,
  onEdit,
  onDelete,
  onReply,
  className = ""
}) => {
  const [showMediaGallery, setShowMediaGallery] = useState(false);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);

  const handleMediaClick = (index) => {
    setSelectedMediaIndex(index);
    setShowMediaGallery(true);
  };

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700/50 overflow-hidden ${className}`}>
      {/* Blip Header */}
      <div className="p-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link to={`/dashboard/sellers/${blip.author._id}`}>
            <Avatar className="h-10 w-10">
              <img
                src={blip.author.profileImage || '/placeholder-user.png'}
                alt={blip.author.firstName}
                className="w-full h-full object-cover"
              />
            </Avatar>
          </Link>
          <div>
            <Link 
              to={`/dashboard/sellers/${blip.author._id}`}
              className="font-medium text-gray-900 dark:text-gray-100 hover:underline"
            >
              {blip.author.firstName} {blip.author.lastName}
            </Link>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span>{formatMessageTime(blip.createdAt)}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                {blip.visibility === 'public' ? (
                  <Globe className="h-3 w-3" />
                ) : (
                  <Lock className="h-3 w-3" />
                )}
                {blip.visibility.charAt(0).toUpperCase() + blip.visibility.slice(1)}
              </span>
            </div>
          </div>
        </div>

        {currentUser?._id === blip.author._id && (
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
              <DropdownMenuItem onClick={() => onEdit(blip)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 dark:text-red-400"
                onClick={() => onDelete(blip._id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Blip Content */}
      <div className="px-4">
        <p className="text-gray-800 dark:text-gray-200 whitespace-pre-line">
          {blip.content}
        </p>
      </div>

      {/* Media Grid */}
      {blip.media && blip.media.length > 0 && (
        <div className={`grid gap-1 mt-4 ${
          blip.media.length === 1 ? 'grid-cols-1' :
          blip.media.length === 2 ? 'grid-cols-2' :
          blip.media.length === 3 ? 'grid-cols-2' :
          'grid-cols-2'
        }`}>
          {blip.media.slice(0, 4).map((media, index) => {
            const isVideo = media.type === 'video' || media.url.includes('.mp4');
            const isLastItem = index === 3 && blip.media.length > 4;

            return (
              <div
                key={index}
                className={`relative aspect-square cursor-pointer ${
                  blip.media.length === 3 && index === 0 ? 'col-span-2' : ''
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
                      +{blip.media.length - 4}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Reply Button */}
      <div className="px-4 py-3 mt-2 border-t border-gray-100 dark:border-gray-800">
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          onClick={() => onReply(blip)}
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Reply
        </Button>
      </div>

      {/* Media Gallery Modal */}
      <MediaGalleryModal
        isOpen={showMediaGallery}
        onClose={() => setShowMediaGallery(false)}
        media={blip.media}
        initialIndex={selectedMediaIndex}
      />
    </div>
  );
};

export default BlipCard; 