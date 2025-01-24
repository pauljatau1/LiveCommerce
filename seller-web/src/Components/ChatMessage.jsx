import { Avatar, AvatarFallback, AvatarImage } from "@/Components/ui/avatar";
import { formatDistanceToNow } from "date-fns";

const ChatMessage = ({ message, isOwn }) => {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex ${isOwn ? 'flex-row-reverse' : 'flex-row'} items-end gap-2 max-w-[70%]`}>
        <Avatar className="w-8 h-8">
          <AvatarImage src={message?.sender?.avatar} />
          <AvatarFallback>{message?.sender?.name?.[0] || 'U'}</AvatarFallback>
        </Avatar>
        <div className={`${isOwn ? 'bg-blue-500 text-white' : 'bg-gray-100'} rounded-lg px-4 py-2`}>
          <p className="text-sm">{message.content}</p>
          <span className={`text-xs ${isOwn ? 'text-blue-100' : 'text-gray-500'} mt-1 block`}>
            {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage; 