import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Heart, MessageCircle, Send, Loader2, MoreHorizontal, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatMessageTime } from './utils/formatters';

const PostActivity = ({ 
  comments, 
  reactions, 
  currentUser, 
  onAddComment, 
  onAddReaction, 
  onDeleteComment,
  isSubmitting 
}) => {
  const [newComment, setNewComment] = useState('');

  const handleSubmitComment = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    onAddComment(newComment);
    setNewComment('');
  };

  const hasReacted = reactions?.some(
    reaction => reaction.user._id === currentUser?._id
  );

  return (
    <div className="mt-4 space-y-4">
      {/* Reaction and Comment Buttons */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          className={`flex items-center gap-2 ${
            hasReacted ? 'text-red-500 dark:text-red-400' : ''
          }`}
          onClick={onAddReaction}
        >
          <Heart className={`h-5 w-5 ${hasReacted ? 'fill-current' : ''}`} />
          {reactions?.length > 0 && (
            <span className="font-medium">{reactions.length}</span>
          )}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-2"
        >
          <MessageCircle className="h-5 w-5" />
          {comments?.length > 0 && (
            <span className="font-medium">{comments.length}</span>
          )}
        </Button>
      </div>

      {/* Comments Section */}
      {comments?.length > 0 && (
        <div className="space-y-4">
          <Separator />
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment._id} className="flex gap-3">
                <Avatar>
                  <img
                    src={comment.author.profileImage || '/placeholder-user.png'}
                    alt={comment.author.firstName}
                    className="w-full h-full object-cover"
                  />
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="inline-block bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-2">
                        <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
                          {comment.author.firstName} {comment.author.lastName}
                        </p>
                        <p className="text-gray-800 dark:text-gray-200">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                    {(currentUser?._id === comment.author._id) && (
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
                          <DropdownMenuItem
                            className="text-red-600 dark:text-red-400"
                            onClick={() => onDeleteComment(comment._id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 ml-4">
                    {formatMessageTime(comment.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Comment Form */}
      <form onSubmit={handleSubmitComment} className="flex items-center gap-3">
        <Avatar>
          <img
            src={currentUser?.profileImage || '/placeholder-user.png'}
            alt={currentUser?.firstName}
            className="w-full h-full object-cover"
          />
        </Avatar>
        <div className="flex-1 relative">
          <Input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="pr-12"
          />
          <Button
            type="submit"
            size="icon"
            variant="ghost"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
            disabled={!newComment.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PostActivity; 