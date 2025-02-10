import { useState, useEffect, useRef } from 'react';
import { Card } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/Components/ui/avatar";
import { Menu } from 'lucide-react';
import {
  PaperclipIcon,
  SmileIcon,
  SendHorizontal,
  MessageSquare,
  Check,
  CheckCheck,
  Eye,
  MessageSquarePlus,
  Search,
  MoreVertical,
  ArrowLeft,
 
  X
} from 'lucide-react';
import { toast } from "sonner";
import { BASE_URL } from "@/Constants/Server";
import { io } from "socket.io-client";
import { useSocket } from "@/Contexts/SocketContext";
import { useNavigate, useLocation, useOutletContext } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/Components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";


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
  const { setHeaderName, setNavName } = useOutletContext()
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sellerProducts, setSellerProducts] = useState([]);
  const [sellerId, setSellerId] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const socket = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [newMessageOpen, setNewMessageOpen] = useState(false);
  const [initialMessage, setInitialMessage] = useState("");
  const [showChatList, setShowChatList] = useState(true);
  const [showQuickTools, setShowQuickTools] = useState(false);

  useEffect(() => {
    setHeaderName('Messages')
    setNavName('')
  }, [])

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const sellerToken = JSON.parse(localStorage.getItem('sellerToken')).data;
        const response = await fetch(`${BASE_URL}/conversations`, {
          headers: {
            'Authorization': `Bearer ${sellerToken}`
          }
        });
        const data = await response.json();
        setConversations(data.conversations);
      } catch (error) {
        console.error('Error fetching conversations:', error);
      }
    };
    fetchConversations();
  }, []);

  // Fetch messages when conversation changes
  useEffect(() => {
    const fetchMessages = async () => {
      if (!currentConversation) return;
      try {
        const sellerToken = JSON.parse(localStorage.getItem('sellerToken')).data;
        const response = await fetch(`${BASE_URL}/messages/${currentConversation._id}`, {
          headers: {
            'Authorization': `Bearer ${sellerToken}`
          }
        });
        const data = await response.json();
        console.log('Fetched messages:', data);
        setMessages(data);
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };
    fetchMessages();
  }, [currentConversation]);

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
      console.log('Socket: Received new message:', newMessage);
      console.log('Current conversation:', currentConversation);

      // Handle the message object if it's wrapped
      const messageData = newMessage.message || newMessage;

      // Update messages if the message belongs to current conversation
      if (messageData.conversation === currentConversation?._id) {
        console.log('Adding message to current conversation');
        setMessages(prev => {
          console.log('Previous messages:', prev);
          const updated = [...prev, messageData];
          console.log('Updated messages:', updated);
          return updated;
        });
      }

      // Update conversations list
      setConversations(prev =>
        prev.map(conv =>
          conv._id === messageData.conversation
            ? {
                ...conv,
                lastMessage: {
                  content: messageData.content,
                  createdAt: messageData.createdAt
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

  // Add effect to handle direct messaging when navigating from customer details
  useEffect(() => {
    const initializeDirectMessage = async () => {
      if (!location.state?.customerId) return;

      try {
        const sellerToken = JSON.parse(localStorage.getItem('sellerToken')).data;
        
        // First try to find existing conversation
        const response = await fetch(`${BASE_URL}/conversations`, {
          headers: {
            'Authorization': `Bearer ${sellerToken}`
          }
        });
        const data = await response.json();
        
        // Find conversation with this customer
        const existingConversation = data.conversations.find(conv => 
          conv.participant.id === location.state.customerId
        );

        if (existingConversation) {
          setCurrentConversation(existingConversation);
        } else {
          // If no conversation exists, create one by sending first message
          const response = await fetch(`${BASE_URL}/messages`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${sellerToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              recipientId: location.state.customerId,
              recipientModel: 'Buyer',
              content: 'Hello! How can I help you today?'
            })
          });

          if (!response.ok) {
            throw new Error('Failed to create conversation');
          }

          const newMessageData = await response.json();
          
          // Create new conversation object
          const newConversation = {
            _id: newMessageData.message.conversation,
            participant: {
              id: location.state.customerId,
              name: location.state.customerName,
              model: 'Buyer'
            },
            lastMessage: {
              content: 'Hello! How can I help you today?',
              createdAt: new Date().toISOString()
            },
            unreadCount: 0
          };

          // Update conversations list and set current
          setConversations(prev => [newConversation, ...prev]);
          setCurrentConversation(newConversation);
          
          // Add message to messages list
          setMessages([newMessageData.message]);
        }

      } catch (error) {
        console.error('Error initializing direct message:', error);
        toast.error('Failed to start conversation');
      }
    };

    initializeDirectMessage();
  }, [location.state]);

  // Update the effect to properly handle the conversation data
  useEffect(() => {
    const handleNavigatedConversation = async () => {
      if (!location.state?.conversationId) return;

      try {
        const sellerToken = JSON.parse(localStorage.getItem('sellerToken')).data;
        
        // Fetch conversation details
        const response = await fetch(`${BASE_URL}/conversations/${location.state.conversationId}`, {
          headers: {
            'Authorization': `Bearer ${sellerToken}`
          }
        });
        
        if (!response.ok) throw new Error('Failed to fetch conversation');
        
        const data = await response.json();
        
        // Ensure we have a properly structured conversation object
        const conversation = {
          ...data.conversation,
          participant: {
            id: location.state.participantId,
            name: location.state.participantName,
            avatar: data.conversation?.participant?.avatar || null,
            isOnline: data.conversation?.participant?.isOnline || false
          }
        };
        
        setCurrentConversation(conversation);
        
        // Fetch messages
        const messagesResponse = await fetch(`${BASE_URL}/messages/${location.state.conversationId}`, {
          headers: {
            'Authorization': `Bearer ${sellerToken}`
          }
        });
        
        if (!messagesResponse.ok) throw new Error('Failed to fetch messages');
        
        const messagesData = await messagesResponse.json();
        setMessages(messagesData.messages || []);

      } catch (error) {
        console.error('Error loading conversation:', error);
        toast.error('Failed to load conversation');
      }
    };

    handleNavigatedConversation();
  }, [location.state?.conversationId]);

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
    const tempId = Date.now().toString();
    const newMessageContent = messageInput;
    setMessageInput("");

    // Create temporary message for immediate display
    const tempMessage = {
      _id: tempId,
      sender: {
        model: 'Seller',
        id: sellerId,
      },
      content: newMessageContent,
      messageType: 'text',
      createdAt: new Date().toISOString(),
      isRead: false,
      isDelivered: false,
      conversation: currentConversation._id,
    };

    console.log('Adding temporary message:', tempMessage);

    // Add message to UI immediately
    setMessages(prev => {
      console.log('Previous messages before adding temp:', prev);
      const updated = [...(prev || []), tempMessage];
      console.log('Messages after adding temp:', updated);
      return updated;
    });

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
          recipientModel: currentConversation.participant.model || 'Buyer',
          content: newMessageContent
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const serverResponse = await response.json();
      console.log('Received server message:', serverResponse);

      // Extract the actual message from the response
      const serverMessage = serverResponse.message;

      // Update messages by replacing temp message with server message
      setMessages(prev => {
        console.log('Previous messages before server update:', prev);
        const updated = prev.map(msg =>
          msg._id === tempId
            ? {
                ...serverMessage,
                conversation: currentConversation._id,
                sender: {
                  model: 'Seller',
                  id: sellerId,
                }
              }
            : msg
        );
        console.log('Messages after server update:', updated);
        return updated;
      });

      // Update conversations list
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

      console.log('Emitting socket event for new message');
      // Emit socket event for real-time delivery
      socket.emit('new_message', {
        conversationId: currentConversation._id,
        message: serverMessage
      });

    } catch (error) {
      console.error('Error in handleSendMessage:', error);
      // Remove temporary message if send failed
      setMessages(prev =>
        prev.filter(msg => msg._id !== tempId)
      );
      setMessageInput(newMessageContent); // Restore message input
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
        id: sellerId,
      },
      content: 'Sending image...',
      messageType: 'image',
      media: [{ url: tempUrl }],
      createdAt: new Date().toISOString(),
      isRead: false,
      isDelivered: false,
      conversation: currentConversation._id,
    };

    // Add message to UI immediately
    setMessages(prev => [...(prev || []), tempMessage]);

    const formData = new FormData();
    formData.append('recipientId', currentConversation.participant.id);
    formData.append('recipientModel', currentConversation.participant.model || 'Buyer');
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

      const serverResponse = await response.json();
      const serverMessage = serverResponse.message || serverResponse;

      // Replace temporary message with server response
      setMessages(prev =>
        prev.map(msg =>
          msg._id === tempId
            ? {
                ...serverMessage,
                conversation: currentConversation._id,
                sender: {
                  model: 'Seller',
                  id: sellerId,
                }
              }
            : msg
        )
      );

      // Update conversations list
      setConversations(prev =>
        prev.map(conv =>
          conv._id === currentConversation._id
            ? {
                ...conv,
                lastMessage: {
                  content: 'Image message',
                  createdAt: new Date().toISOString()
                }
              }
            : conv
        )
      );

      // Emit socket event for real-time delivery
      socket.emit('new_message', {
        conversationId: currentConversation._id,
        message: serverMessage
      });

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
        const sellerToken = JSON.parse(localStorage.getItem('sellerToken')).data;
        const response = await fetch(`${BASE_URL}/seller/profile`, {
          headers: {
            'Authorization': `Bearer ${sellerToken}`
          }
        });
        const profileData = await response.json();
        setSellerId(profileData._id);

        // Fetch products once we have the seller ID
        const productsResponse = await fetch(`${BASE_URL}/products/seller/${profileData._id}`, {
          headers: {
            'Authorization': `Bearer ${sellerToken}`
          }
        });
        const productsData = await productsResponse.json();
        setSellerProducts(productsData.products);
      } catch (error) {
        console.error('Error fetching seller profile and products:', error);
      }
    };
    fetchSellerProfile();
  }, []);

  // Handle sending product message
  const handleSendProduct = async (product) => {
    if (!currentConversation) return;

    const tempId = Date.now().toString();

    // Create temporary message for immediate display
    const tempMessage = {
      _id: tempId,
      sender: {
        model: 'Seller',
        id: sellerId,
      },
      content: `Product: ${product.name} - ${product.price}`,
      messageType: 'product',
      product: product,
      createdAt: new Date().toISOString(),
      isRead: false,
      isDelivered: false,
      conversation: currentConversation._id,
    };

    // Add message to UI immediately
    setMessages(prev => [...(prev || []), tempMessage]);

    try {
      const sellerToken = JSON.parse(localStorage.getItem('sellerToken')).data;
      const response = await fetch(`${BASE_URL}/messages/product`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sellerToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipientId: currentConversation.participant.id,
          recipientModel: currentConversation.participant.model || 'Buyer',
          productId: product._id,
          content: `Check out this product: ${product.name}`
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send product message');
      }

      const serverResponse = await response.json();
      const serverMessage = serverResponse.message || serverResponse;

      // Replace temporary message with server response
      setMessages(prev =>
        prev.map(msg =>
          msg._id === tempId
            ? {
                ...serverMessage,
                conversation: currentConversation._id,
                sender: {
                  model: 'Seller',
                  id: sellerId,
                }
              }
            : msg
        )
      );

      // Update conversations list
      setConversations(prev =>
        prev.map(conv =>
          conv._id === currentConversation._id
            ? {
                ...conv,
                lastMessage: {
                  content: `Check out this product: ${product.name}`,
                  createdAt: new Date().toISOString()
                }
              }
            : conv
        )
      );

      // Emit socket event for real-time delivery
      socket.emit('new_message', {
        conversationId: currentConversation._id,
        message: serverMessage
      });

      toast.success("Product shared successfully");
    } catch (error) {
      // Remove temporary message if send failed
      setMessages(prev =>
        prev.filter(msg => msg._id !== tempId)
      );
      console.error('Error sending product message:', error);
      toast.error("Failed to share product. Please try again.");
    }
  };

  // Update chat list rendering with improved styling
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
              // Navigate to messages with conversation context
              navigate('/dashboard/messages', {
                state: {
                  conversationId: conv._id,
                  participantId: conv.participant.id,
                  participantName: conv.participant.name
                }
              });
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

  // Empty state component
  const EmptyState = () => (
    <div className="flex-1 flex flex-col items-center justify-center bg-white">
      <MessageSquare className="h-16 w-16 text-gray-300 mb-4" />
      <h3 className="text-xl font-semibold text-gray-900 mb-2">No Conversation Selected</h3>
      <p className="text-gray-500">Select a conversation from the list to start messaging</p>
    </div>
  );

  // Add helper to determine if mobile view
  const isMobileView = () => window.innerWidth < 768;

  // Update useEffect to handle mobile navigation
  useEffect(() => {
    if (currentConversation && isMobileView()) {
      setShowChatList(false);
    }
  }, [currentConversation]);

  // Add back button component for mobile
  const BackButton = () => (
    <Button
      variant="ghost"
      size="sm"
      className="md:hidden"
      onClick={() => {
        setShowChatList(true);
        setCurrentConversation(null);
      }}
    >
      <ArrowLeft className="h-4 w-4 mr-2" />
      Back
    </Button>
  );

  // Update ChatHeader with mobile controls
  const ChatHeader = () => {
    const participant = currentConversation?.participant || {};
    
    return (
      <div className="px-4 py-3 border-b bg-white">
        <div className="flex items-center gap-3">
          <BackButton />
          <Avatar className="h-9 w-9">
            {participant.avatar ? (
              <AvatarImage src={participant.avatar} alt={participant.name || 'User'} />
            ) : (
              <AvatarFallback>
                {participant.name ? participant.name[0].toUpperCase() : 'U'}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-900">
              {participant.name || 'Unknown User'}
            </h3>
            <p className="text-xs text-gray-500">
              {participant.isOnline ? 'Online' : 'Offline'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 md:hidden"
              onClick={() => setShowQuickTools(!showQuickTools)}
            >
              <Menu className="h-4 w-4 text-gray-500" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 hidden md:block w-8 p-0">
              <Search className="h-4 w-4 text-gray-500" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8  hidden md:block w-8 p-0">
              <MoreVertical className="h-4 w-4 text-gray-500" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Update messages rendering with improved styling
  const renderMessages = () => (
    <ScrollArea className="flex-1 p-4">
      <div className="space-y-3">
        {messages && messages.length > 0 ? (
          messages.map((message) => {
            if (!message || !message.sender) return null;
            const isSeller = message.sender?.model === 'Seller';

            return (
              <div
                key={message._id}
                className={`flex ${isSeller ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-lg p-3 ${
                    isSeller
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {message.messageType === 'image' && message.media?.length > 0 && (
                    <img
                      src={message.media[0].url}
                      alt="Message attachment"
                      className="max-w-full rounded-md mb-2"
                    />
                  )}

                  {message.messageType === 'product' && message.product && (
                    <div className="bg-white rounded-md p-2 mb-2">
                      <img
                        src={message.product.image}
                        alt={message.product.name}
                        className="w-full h-24 object-cover rounded-md"
                      />
                      <h4 className="text-sm font-medium mt-1.5 text-gray-900">{message.product.name}</h4>
                      <p className="text-xs text-gray-700">
                        {new Intl.NumberFormat('en-NG', {
                          style: 'currency',
                          currency: 'NGN'
                        }).format(message.product.price)}
                      </p>
                    </div>
                  )}

                  <p className="text-sm">{message.content}</p>

                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`text-[10px] ${
                      isSeller ? 'text-green-100' : 'text-gray-500'
                    }`}>
                      {formatMessageTime(message.createdAt)}
                    </span>
                    {isSeller && (
                      <span className="text-green-100">
                        {message.isRead ? 
                          <CheckCheck className="h-3 w-3" /> : 
                          <Check className="h-3 w-3" />
                        }
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex items-center justify-center h-full text-sm text-gray-500">
            No messages yet. Start the conversation!
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );

  // Update Quick Tools with improved styling
  const renderQuickTools = () => (
    <div className={`
      ${showQuickTools ? 'translate-x-0' : 'translate-x-full'}
      md:translate-x-0
      transition-transform
      fixed md:relative
      right-0 top-0 bottom-0
      md:right-auto md:top-auto md:bottom-auto
      w-[280px]
      border-l bg-white
      z-50
      md:flex
      flex-col
    `}>
      {/* <div className="px-4 py-3 border-b flex justify-between items-center">
        <h2 className="text-sm font-semibold text-gray-900">Quick Tools</h2>
        <Button 
          variant="ghost" 
          size="sm" 
          className="md:hidden"
          onClick={() => setShowQuickTools(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div> */}
      <Tabs defaultValue="products" className="flex-1 flex flex-col">
        <TabsList className="w-full border-b p-0">
          <TabsTrigger value="products" className="flex-1 rounded-none text-sm">
            Products
          </TabsTrigger>
          <TabsTrigger value="replies" className="flex-1 rounded-none text-sm">
            Quick Replies
          </TabsTrigger>
        </TabsList>
        <TabsContent value="products" className="flex-1 m-0 p-0">
          <ScrollArea className="h-full">
            <div className="p-3 space-y-2">
              {sellerProducts.map((product) => (
                <Card key={product._id} className="p-2 hover:shadow-sm transition-shadow border rounded-md">
                  <div className="flex gap-2">
                    <img
                      src={product.images[0]?.url}
                      alt={product.name}
                      className="w-12 h-12 object-cover rounded-md"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-medium text-gray-900 truncate">{product.name}</h4>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {new Intl.NumberFormat('en-NG', {
                          style: 'currency',
                          currency: 'NGN'
                        }).format(product.price)}
                      </p>
                      <div className="flex gap-1 mt-1">
                        {/* <Button
                          size="sm"
                          variant="outline"
                          className="h-6 px-2 text-xs"
                          onClick={() => navigate(`/products/${product._id}`)}
                        >
                          View
                        </Button> */}
                        <Button
                          size="sm"
                          className="h-6 px-2 text-xs bg-green-600 hover:bg-green-700"
                          onClick={() => handleSendProduct(product)}
                          disabled={!currentConversation}
                        >
                          Send
                        </Button>
                      </div>
                    </div>
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
  );

  // Update customer fetching to match Customers.jsx pattern
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const sellerToken = localStorage.getItem('sellerToken');
        if (sellerToken) {
          const tokenData = JSON.parse(sellerToken);
          const token = tokenData.data;
          
          const response = await fetch(`${BASE_URL}/seller/followers?page=1&limit=20`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          const data = await response.json();
          if (data && Array.isArray(data.followers)) {
            setCustomers(data.followers);
          } else {
            console.error('Followers data is missing or invalid');
          }
        } else {
          console.error('Seller token not found in localStorage');
        }
      } catch (error) {
        console.error('Error fetching customers:', error);
        toast.error('Failed to load customers');
      }
    };

    fetchCustomers();
  }, []);

  // Memoize the dialog component to prevent unnecessary re-renders
  const NewMessageDialog = () => (
    <Dialog open={newMessageOpen} onOpenChange={setNewMessageOpen}>
      {/* <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full mb-3 flex items-center gap-2 bg-white hover:bg-gray-50"
        >
          <MessageSquarePlus className="h-4 w-4" />
          New Message
        </Button>
      </DialogTrigger> */}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Start New Conversation</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Customer</label>
            <Select
              value={selectedCustomer}
              onValueChange={setSelectedCustomer}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a customer" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer) => (
                  <SelectItem 
                    key={customer._id} 
                    value={customer._id || customer.buyerId}
                  >
                    {customer.firstName 
                      ? `${customer.firstName} ${customer.lastName}`
                      : customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Initial Message</label>
            <textarea
              value={initialMessage}
              onChange={(e) => setInitialMessage(e.target.value)}
              placeholder="Type your message..."
              className="w-full min-h-[100px] p-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500/20"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => {
              setNewMessageOpen(false);
              setSelectedCustomer(null);
              setInitialMessage("");
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleStartNewConversation}
            className="bg-green-600 text-white hover:bg-green-700"
            disabled={!selectedCustomer || !initialMessage.trim()}
          >
            Start Conversation
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  // Update handleStartNewConversation to use correct customer ID
  const handleStartNewConversation = async () => {
    if (!selectedCustomer || !initialMessage.trim()) {
      toast.error('Please select a customer and enter a message');
      return;
    }

    try {
      const sellerToken = JSON.parse(localStorage.getItem('sellerToken')).data;
      const response = await fetch(`${BASE_URL}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sellerToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipientId: selectedCustomer,
          recipientModel: 'Buyer',
          content: initialMessage
        })
      });

      if (!response.ok) {
        throw new Error('Failed to start conversation');
      }

      const newMessageData = await response.json();
      
      // Find customer details from our customers list
      const customerDetails = customers.find(c => (c._id === selectedCustomer || c.buyerId === selectedCustomer));
      
      // Create new conversation object
      const newConversation = {
        _id: newMessageData.message.conversation,
        participant: {
          id: selectedCustomer,
          name: customerDetails.firstName 
            ? `${customerDetails.firstName} ${customerDetails.lastName}`
            : customerDetails.name,
          model: 'Buyer'
        },
        lastMessage: {
          content: initialMessage,
          createdAt: new Date().toISOString()
        },
        unreadCount: 0
      };

      // Update conversations list and set current
      setConversations(prev => [newConversation, ...prev]);
      setCurrentConversation(newConversation);
      setMessages([newMessageData.message]);
      
      // Reset and close dialog
      setSelectedCustomer(null);
      setInitialMessage("");
      setNewMessageOpen(false);
      
      toast.success('Conversation started successfully');
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast.error('Failed to start conversation');
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] mt-10 flex flex-col bg-gray-100">

      <div className="flex-1 flex overflow-hidden">
        {/* Chat list - hidden on mobile when conversation is open */}
        <div className={`
          ${showChatList ? 'flex' : 'hidden'} 
          md:flex
          w-full md:w-[300px] 
          bg-white border-r 
          flex-col
        `}>
          <div className="p-3 border-b space-y-3">
            <NewMessageDialog />
            <Input
              placeholder="Search messages..."
              className="bg-gray-50 text-sm h-9"
              prefix={<MessageSquare className="h-4 w-4 text-gray-400" />}
            />
          </div>
          {renderChatList()}
        </div>

        {/* Main chat area - shown on mobile when conversation is selected */}
        <div className={`
          ${(!showChatList || !isMobileView()) ? 'flex' : 'hidden'}
          md:flex
          flex-1 flex-col 
          bg-white
        `}>
          {currentConversation ? (
            <>
              <ChatHeader />
              {renderMessages()}
              <div className="px-4 py-3 border-t bg-white">
                <div className="flex gap-2">
                  <Input
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 text-sm h-9"
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e.target.files[0])}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 px-3"
                    onClick={() => document.getElementById('file-upload').click()}
                  >
                    <PaperclipIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    className="h-9 px-3 bg-green-600 hover:bg-green-700"
                    onClick={handleSendMessage}
                  >
                    <SendHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <EmptyState />
          )}
        </div>

        {/* Quick tools panel - slides in from right on mobile */}
        <div className={`
          ${showQuickTools ? 'translate-x-0' : 'translate-x-full'}
          md:translate-x-0
          transition-transform
          fixed md:relative
          right-0 top-0 bottom-0
          md:right-auto md:top-auto md:bottom-auto
          w-[280px]
          border-l bg-white
          block sm:hidden
          z-50
          md:flex
          flex-col
        `}>
          <div className="px-4 py-3 border-b flex justify-between items-center">
            <h2 className="text-sm font-semibold text-gray-900">Quick Tools</h2>
            <Button 
              variant="ghost" 
              size="sm" 
              className="md:hidden"
              onClick={() => setShowQuickTools(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {renderQuickTools()}
        </div>
      </div>
    </div>
  );
}
