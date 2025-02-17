import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, MessageSquare } from 'lucide-react';
import { formatMessageTime } from './utils/formatters';

const ChatList = ({ 
  chats, 
  selectedChat, 
  onSelectChat, 
  currentUser,
  onlineUsers = [] 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredChats, setFilteredChats] = useState(chats);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredChats(chats);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = chats.filter(chat => {
      const participant = chat.participants.find(p => p._id !== currentUser?._id);
      const name = `${participant?.firstName} ${participant?.lastName}`.toLowerCase();
      const lastMessage = chat.lastMessage?.content.toLowerCase();
      
      return name.includes(query) || (lastMessage && lastMessage.includes(query));
    });

    setFilteredChats(filtered);
  }, [searchQuery, chats, currentUser]);

  if (!chats?.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
          <MessageSquare className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
          No Conversations Yet
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Start connecting with other sellers to begin chatting
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="pl-9"
          />
        </div>
      </div>

      {/* Chat List */}
      <ScrollArea className="flex-1">
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {filteredChats.map((chat) => {
            const participant = chat.participants.find(
              p => p._id !== currentUser?._id
            );
            const isOnline = onlineUsers.includes(participant?._id);
            const isSelected = selectedChat?._id === chat._id;

            return (
              <Button
                key={chat._id}
                variant="ghost"
                className={`w-full flex items-start gap-3 p-4 hover:bg-gray-100 dark:hover:bg-gray-800 ${
                  isSelected ? 'bg-gray-100 dark:bg-gray-800' : ''
                }`}
                onClick={() => onSelectChat(chat)}
              >
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <img
                      src={participant?.profileImage || '/placeholder-user.png'}
                      alt={participant?.firstName}
                      className="w-full h-full object-cover"
                    />
                  </Avatar>
                  {isOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full" />
                  )}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                      {participant?.firstName} {participant?.lastName}
                    </h4>
                    {chat.lastMessage && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                        {formatMessageTime(chat.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                  {chat.lastMessage ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {chat.lastMessage.content}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-400 dark:text-gray-500 italic">
                      No messages yet
                    </p>
                  )}
                </div>
              </Button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ChatList; 