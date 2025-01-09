import { useState, useEffect, useRef } from 'react'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  MapPin, 
  Star, 
  Package, 
  CircleDollarSign, 
  PaperclipIcon, 
  SmileIcon, 
  SendHorizontal, 
  MessageSquare, 
  Clock, 
  Check, 
  CheckCheck,
  Loader2,
  Eye 
} from 'lucide-react'
import { toast } from "sonner"
import { BASE_URL } from "@/Constants/Server"
import { io } from "socket.io-client";
import { useSocket } from "@/contexts/SocketContext";

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

export default function ChatInterface() {
  const [conversations, setConversations] = useState([])
  const [currentConversation, setCurrentConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [messageInput, setMessageInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [sellerProducts, setSellerProducts] = useState([])
  const [sellerId, setSellerId] = useState(null)
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef(null)
  const socket = useSocket();

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const sellerToken = JSON.parse(localStorage.getItem('sellerToken')).data
        const response = await fetch(`${BASE_URL}/conversations`, {
          headers: {
            'Authorization': `Bearer ${sellerToken}`
          }
        })
        const data = await response.json()
        setConversations(data.conversations)
      } catch (error) {
        console.error('Error fetching conversations:', error)
      }
    }
    fetchConversations()
  }, [])

  // Fetch messages when conversation changes
  useEffect(() => {
    const fetchMessages = async () => {
      if (!currentConversation) return
      try {
        const sellerToken = JSON.parse(localStorage.getItem('sellerToken')).data
        const response = await fetch(`${BASE_URL}/messages/${currentConversation._id}`, {
          headers: {
            'Authorization': `Bearer ${sellerToken}`
          }
        })
        const data = await response.json()
        setMessages(data)
      } catch (error) {
        console.error('Error fetching messages:', error)
      }
    }
    fetchMessages()
  }, [currentConversation])

  // Scroll to bottom helper
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Add this effect to handle incoming messages
  useEffect(() => {
    if (!socket) return;

    socket.on('receive_message', (newMessage) => {
      // Update messages if the message belongs to current conversation
      if (newMessage.conversation === currentConversation?._id) {
        setMessages(prev => [...prev, newMessage]);
      }
      
      // Update conversations list with new last message
      setConversations(prev =>
        prev.map(conv =>
          conv._id === newMessage.conversation
            ? {
                ...conv,
                lastMessage: {
                  content: newMessage.content,
                  createdAt: newMessage.createdAt
                },
                unreadCount: conv.unreadCount + 1
              }
            : conv
        )
      );
    });

    return () => {
      socket.off('receive_message');
    };
  }, [socket, currentConversation]);

  // Enhanced handleSendMessage with immediate UI update
  const handleSendMessage = async () => {
    if (!messageInput.trim()) {
      toast.error("Please enter a message");
      return;
    }
    if (!currentConversation?.participant?.id) {
      toast.error("Please select a conversation first");
      return;
    }

    setIsSending(true);
    const tempId = Date.now().toString(); // Temporary ID for optimistic update
    const newMessageContent = messageInput;
    setMessageInput(""); // Clear input immediately

    // Create temporary message for immediate display
    const tempMessage = {
      _id: tempId,
      sender: {
        model: 'Seller',
        // Add other sender details from your auth context if needed
      },
      content: newMessageContent,
      messageType: 'text',
      createdAt: new Date().toISOString(),
      isRead: false,
      isDelivered: false,
    };

    // Add message to UI immediately
    setMessages(prev => [...(prev || []), tempMessage]);

    try {
      const sellerToken = JSON.parse(localStorage.getItem('sellerToken'))?.data;
      if (!sellerToken) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(`${BASE_URL}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sellerToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipientId: currentConversation.participant.id,
          recipientModel: currentConversation.participant.model,
          content: newMessageContent
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const serverMessage = await response.json();
      
      // Emit socket event for real-time delivery
      socket.emit('new_message', {
        conversationId: currentConversation._id,
        message: serverMessage
      });

      // Replace temporary message with server response
      setMessages(prev => 
        prev.map(msg => 
          msg._id === tempId ? serverMessage : msg
        )
      );

      // Update last message in conversations list
      setConversations(prev =>
        prev.map(conv =>
          conv._id === currentConversation._id
            ? {
                ...conv,
                lastMessage: {
                  content: newMessageContent,
                  createdAt: new Date().toISOString()
                }
              }
            : conv
        )
      );

    } catch (error) {
      // Remove temporary message if send failed
      setMessages(prev => 
        prev.filter(msg => msg._id !== tempId)
      );
      setMessageInput(newMessageContent); // Restore message input
      console.error('Error sending message:', error);
      toast.error(error.message || "Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  // Enhanced file upload with immediate UI update
  const handleFileUpload = async (file) => {
    if (!file || !currentConversation) return;

    if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
      toast.error("Please select a valid image file (JPEG, PNG, or GIF)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size should be less than 5MB");
      return;
    }

    const tempId = Date.now().toString();
    const tempUrl = URL.createObjectURL(file);

    // Create temporary message for immediate display
    const tempMessage = {
      _id: tempId,
      sender: {
        model: 'Seller',
      },
      content: 'Sending image...',
      messageType: 'image',
      media: [{ url: tempUrl }],
      createdAt: new Date().toISOString(),
      isRead: false,
      isDelivered: false,
    };

    // Add message to UI immediately
    setMessages(prev => [...(prev || []), tempMessage]);

    const formData = new FormData();
    formData.append('recipientId', currentConversation.participant.id);
    formData.append('recipientModel', currentConversation.participant.model);
    formData.append('messageType', 'image');
    formData.append('content', 'Image message');
    formData.append('media', file);

    try {
      const sellerToken = JSON.parse(localStorage.getItem('sellerToken')).data;
      const response = await fetch(`${BASE_URL}/messages/media`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sellerToken}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const serverMessage = await response.json();
      
      // Replace temporary message with server response
      setMessages(prev => 
        prev.map(msg => 
          msg._id === tempId ? serverMessage : msg
        )
      );

      toast.success("Image sent successfully");
    } catch (error) {
      // Remove temporary message if upload failed
      setMessages(prev => 
        prev.filter(msg => msg._id !== tempId)
      );
      console.error('Error uploading image:', error);
      toast.error("Failed to send image. Please try again.");
    }
  };

  // Fetch seller profile and products
  useEffect(() => {
    const fetchSellerProfile = async () => {
      try {
        const sellerToken = JSON.parse(localStorage.getItem('sellerToken')).data
        const response = await fetch(`${BASE_URL}/seller/profile`, {
          headers: {
            'Authorization': `Bearer ${sellerToken}`
          }
        })
        const profileData = await response.json()
        setSellerId(profileData._id)

        // Fetch products once we have the seller ID
        const productsResponse = await fetch(`${BASE_URL}/products/seller/${profileData._id}`, {
          headers: {
            'Authorization': `Bearer ${sellerToken}`
          }
        })
        const productsData = await productsResponse.json()
        setSellerProducts(productsData.products)
      } catch (error) {
        console.error('Error fetching seller profile and products:', error)
      }
    }
    fetchSellerProfile()
  }, [])

  // Handle sending product message
  const handleSendProduct = async (product) => {
    if (!currentConversation) return

    try {
      const sellerToken = JSON.parse(localStorage.getItem('sellerToken')).data
      const response = await fetch(`${BASE_URL}/messages/product`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sellerToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipientId: currentConversation.participant.id,
          recipientModel: currentConversation.participant.model,
          productId: product._id,
          content: `Check out this product: ${product.name}`
        })
      })
      const newMessage = await response.json()
      setMessages(prev => [...prev, newMessage])
    } catch (error) {
      console.error('Error sending product message:', error)
    }
  }

  // Update chat list rendering
  const renderChatList = () => (
    <ScrollArea className="flex-1">
      {conversations.map((conv) => (
        <div
          key={conv._id}
          className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
            currentConversation?._id === conv._id ? 'bg-green-50 border-l-4 border-green-600' : ''
          }`}
          onClick={() => setCurrentConversation(conv)}
        >
          <div className="flex gap-3">
            <div className="relative flex-shrink-0">
              <Avatar>
                <AvatarImage src={conv.participant.avatar || "/placeholder.svg"} />
                <AvatarFallback>{conv.participant.name[0]}</AvatarFallback>
              </Avatar>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <h3 className="font-semibold text-gray-900 truncate">{conv.participant.name}</h3>
                <span className="text-xs text-gray-500">
                  {new Date(conv.lastMessage.createdAt).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-sm text-gray-600 truncate">
                {conv.lastMessage.content}
              </p>
              {conv.unreadCount > 0 && (
                <span className="bg-green-600 text-white text-xs rounded-full px-2 py-0.5 mt-1">
                  {conv.unreadCount}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </ScrollArea>
  )

  // Empty state component
  const EmptyState = () => (
    <div className="flex-1 flex flex-col items-center justify-center bg-white">
      <MessageSquare className="h-16 w-16 text-gray-300 mb-4" />
      <h3 className="text-xl font-semibold text-gray-900 mb-2">No Conversation Selected</h3>
      <p className="text-gray-500">Select a conversation from the list to start messaging</p>
    </div>
  )

  // Update chat header to show current conversation
  const ChatHeader = () => {
    if (!currentConversation) return null;
    
    const participant = currentConversation.participant;
    
    return (
      <div className="p-6 border-b bg-white">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={participant.avatar || "/placeholder.svg"} />
            <AvatarFallback>{participant.name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{participant.name}</h2>
                <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                  <span className="flex items-center gap-1">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    Online
                  </span>
                  <span>Last seen recently</span>
                </div>
              </div>
              <Button variant="outline" size="sm">View Profile</Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Update messages rendering with proper checks
  const renderMessages = () => (
    <ScrollArea className="flex-1 px-6 py-4">
      <div className="space-y-4">
        {messages && messages.length > 0 ? (
          messages.map((message) => {
            if (!message || !message.sender) return null;
            
            return (
              <div
                key={message._id}
                className={`flex ${message.sender?.model === 'Seller' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-2xl p-4 ${
                    message.sender?.model === 'Seller'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {/* Image message */}
                  {message.messageType === 'image' && message.media?.length > 0 && (
                    <img 
                      src={message.media[0].url} 
                      alt="Message attachment" 
                      className="max-w-full rounded-lg mb-2"
                    />
                  )}
                  
                  {/* Product message */}
                  {message.messageType === 'product' && message.product && (
                    <div className="bg-white rounded-lg p-2 mb-2">
                      <img 
                        src={message.product.image} 
                        alt={message.product.name} 
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <h4 className="font-medium mt-2 text-gray-900">{message.product.name}</h4>
                      <p className="text-sm text-gray-700">
                        {new Intl.NumberFormat('en-NG', {
                          style: 'currency',
                          currency: 'NGN'
                        }).format(message.product.price)}
                      </p>
                    </div>
                  )}
                  
                  {/* Message content */}
                  <p className="text-sm">{message.content}</p>
                  
                  {/* Message metadata */}
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs ${
                      message.sender?.model === 'Seller' ? 'text-green-100' : 'text-gray-500'
                    }`}>
                      {formatMessageTime(message.createdAt)}
                    </span>
                    {message.sender?.model === 'Seller' && (
                      <span className="text-green-100">
                        {message.isRead ? <CheckCheck className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            No messages yet. Start the conversation!
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );

  // Update the Quick Tools section
  const renderQuickTools = () => (
    <div className="w-[320px] border-l bg-white flex flex-col overflow-hidden">
      <div className="bg-green-50 p-4 border-b">
        <h2 className="text-lg font-bold text-gray-900">Quick Tools</h2>
      </div>
      <Tabs defaultValue="products" className="flex-1 flex flex-col">
        <TabsList className="w-full border-b p-0">
          <TabsTrigger value="products" className="flex-1 rounded-none">
            Products
          </TabsTrigger>
          <TabsTrigger value="replies" className="flex-1 rounded-none">
            Quick Replies
          </TabsTrigger>
        </TabsList>
        <TabsContent value="products" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              {sellerProducts.map((product) => (
                <Card key={product._id} className="p-3 hover:shadow-md transition-shadow">
                  <div className="flex gap-2">
                    <img
                      src={product.images[0]?.url}
                      alt={product.name}
                      className="w-10 h-10 object-cover rounded-lg"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-xs text-gray-900 truncate">{product.name}</h4>
                      <div className="text-xs text-gray-600">
                        {new Intl.NumberFormat('en-NG', {
                          style: 'currency',
                          currency: 'NGN'
                        }).format(product.price)}
                      </div>
                      <div className="flex flex-wrap items-center gap-1 mt-1">
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-700">
                          {product.category}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 mt-2">
                    <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button 
                      size="sm" 
                      className="h-7 px-2 text-xs bg-green-600 hover:bg-green-700"
                      onClick={() => handleSendProduct(product)}
                      disabled={!currentConversation}
                    >
                      <SendHorizontal className="h-3 w-3 mr-1" />
                      Send
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
        <TabsContent value="replies" className="flex-1 p-4 m-0">
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No quick replies available yet.</p>
            <Button variant="outline" size="sm" className="mt-4">
              Create Quick Reply
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-gray-50">
      {/* Header */}
      <div className="px-8 py-6 bg-white shadow-sm z-10">
        <h1 className='text-2xl font-bold text-gray-900'>Messages</h1>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat List */}
        <div className="w-[320px] border-r bg-white flex flex-col">
          <div className="p-4 border-b">
            <Input 
              placeholder="Search messages..."
              className="bg-gray-50"
              prefix={<MessageSquare className="h-4 w-4 text-gray-400" />}
            />
          </div>
          {renderChatList()}
        </div>

        {/* Chat Area */}
        {currentConversation ? (
          <div className="flex-1 flex flex-col bg-white">
            <ChatHeader />
            {renderMessages()}
            
            {/* Message Input */}
            <div className="px-6 py-4 border-t bg-white">
              <div className="flex gap-3">
                <Input
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSendMessage();
                    }
                  }}
                />
                <div className="flex gap-2">
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e.target.files[0])}
                  />
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="text-gray-500 hover:text-gray-700"
                    onClick={() => document.getElementById('file-upload').click()}
                  >
                    <PaperclipIcon className="h-5 w-5" />
                  </Button>
                  <Button variant="outline" size="icon" className="text-gray-500 hover:text-gray-700">
                    <SmileIcon className="h-5 w-5" />
                  </Button>
                  <Button 
                    size="icon" 
                    className="bg-green-600 hover:bg-green-700"
                    onClick={handleSendMessage}
                  >
                    <SendHorizontal className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <EmptyState />
        )}

        {/* Quick Tools */}
        {renderQuickTools()}
      </div>
    </div>
  )
}