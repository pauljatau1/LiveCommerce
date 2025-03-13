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
  X,
  MapPin,
  Star,
  ShoppingBag,
  Banknote,
  Loader2,
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
import { EmojiPicker } from "@/Components/ui/emoji-picker";


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

// Move QuickReplyDialog outside of ChatInterface
const QuickReplyDialog = ({
  open,
  onOpenChange,
  title,
  setTitle,
  content,
  setContent,
  onCreateReply,
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Create Quick Reply</DialogTitle>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Title</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="E.g., Greeting, Thank you, etc."
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Message Content</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type your message template..."
            className="w-full min-h-[100px] p-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500/20"
          />
        </div>
      </div>
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => {
            onOpenChange(false);
            setTitle("");
            setContent("");
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={onCreateReply}
          className="bg-green-600 text-white hover:bg-green-700"
          disabled={!title.trim() || !content.trim()}
        >
          Create Reply
        </Button>
      </div>
    </DialogContent>
  </Dialog>
);

const OrderMessage = ({ order }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="flex flex-col space-y-3 bg-white rounded-lg border p-4 max-w-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-900">Order Details</h3>
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
        </span>
      </div>
      
      <div className="space-y-3">
        {order.items.map((item, index) => (
          <div key={index} className="flex items-center space-x-3 border-b pb-3 last:border-0">
            <div className="h-16 w-16 flex-shrink-0">
              <img 
                src={item.image} 
                alt={item.name}
                className="h-full w-full object-cover rounded-md"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
              <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
              <p className="text-sm font-medium text-gray-900">{formatCurrency(item.price)}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t pt-3 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Shipping Fee:</span>
          <span className="font-medium">{formatCurrency(order.shippingFee)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Total Amount:</span>
          <span className="font-medium">{formatCurrency(order.totalAmount)}</span>
        </div>
      </div>

      <div className="border-t pt-3">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Shipping Details</h4>
        {order.trackingNumber && (
          <div className="mb-3">
            <span className="text-sm text-gray-500">Tracking Number: </span>
            <span className="text-sm font-medium">{order.trackingNumber}</span>
          </div>
        )}
        <div className="text-sm text-gray-500 space-y-1">
          <p>{order.shippingAddress.addressLine1}</p>
          {order.shippingAddress.addressLine2 && (
            <p>{order.shippingAddress.addressLine2}</p>
          )}
          <p>{order.shippingAddress.city}, {order.shippingAddress.state}</p>
          <p>{order.shippingAddress.zipCode}</p>
          <p>{order.shippingAddress.country}</p>
        </div>
      </div>
    </div>
  );
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
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [buyerDetails, setBuyerDetails] = useState(null);
  const [initialLoad, setInitialLoad] = useState(true);
  const messagesContainerRef = useRef(null);
  const [quickReplies, setQuickReplies] = useState([]);
  const [newQuickReplyOpen, setNewQuickReplyOpen] = useState(false);
  const [quickReplyTitle, setQuickReplyTitle] = useState("");
  const [quickReplyContent, setQuickReplyContent] = useState("");

  useEffect(() => {
    setHeaderName('Messages')
    setNavName('')
  }, [])

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      setIsLoadingConversations(true);
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
        toast.error('Failed to load conversations');
      } finally {
        setIsLoadingConversations(false);
      }
    };
    fetchConversations();
  }, []);

  // Fetch messages when conversation changes
  useEffect(() => {
    if (!currentConversation) return;
    console.log('Conversation changed, fetching messages');
    setMessages([]); // Clear existing messages
    fetchMessages();
  }, [currentConversation]);

  const fetchMessages = async () => {
    if (!currentConversation) return;
    
    setIsLoadingMessages(true);
    console.log('Fetching messages for conversation:', currentConversation._id);

    try {
      const sellerToken = JSON.parse(localStorage.getItem('sellerToken')).data;
      const response = await fetch(
        `${BASE_URL}/messages/${currentConversation._id}?limit=99`,
        {
          headers: {
            'Authorization': `Bearer ${sellerToken}`
          }
        }
      );
      const data = await response.json();
      console.log('Received messages:', data.messages);

      // Reverse the messages array to show most recent at bottom
      const reversedMessages = [...data.messages].reverse();
      console.log('Reversed messages:', reversedMessages);

      // Set reversed messages
      setMessages(reversedMessages || []);
      
      // Scroll to bottom after loading messages
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
      }, 100); // Increased timeout to ensure content is loaded

    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setIsLoadingMessages(false);
      setInitialLoad(false);
    }
  };

  // Add new useEffect for automatic scrolling when messages change
  useEffect(() => {
    const scrollToBottom = () => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    };

    // Scroll when messages change
    scrollToBottom();

    // Also scroll after a short delay to handle any dynamic content
    const timeoutId = setTimeout(scrollToBottom, 100);

    return () => clearTimeout(timeoutId);
  }, [messages]);

  // Auto-scroll to bottom for new messages
  useEffect(() => {
    if (!messagesContainerRef.current || initialLoad) return;
    
    const scrollContainer = messagesContainerRef.current;
    scrollContainer.scrollTop = scrollContainer.scrollHeight;
  }, [messages.length]);

  // Add this effect to mark messages as read when opening a conversation
  useEffect(() => {
    const markConversationAsRead = async () => {
      if (!currentConversation) return;

      try {
        const sellerToken = JSON.parse(localStorage.getItem('sellerToken')).data;
        await fetch(`${BASE_URL}/conversations/${currentConversation._id}/read`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${sellerToken}`
          }
        });

        // Update local conversations list to remove unread count
        setConversations(prev =>
          prev.map(conv =>
            conv._id === currentConversation._id
              ? { ...conv, unreadCount: 0 }
              : conv
          )
        );
      } catch (error) {
        console.error('Error marking conversation as read:', error);
      }
    };

    markConversationAsRead();
  }, [currentConversation]);

  // Update the socket effect to properly handle unread counts
  useEffect(() => {
    if (!socket) return;

    socket.on('receive_message', (newMessage) => {
      console.log('Socket: Received new message:', newMessage);
      
      // Handle the message object if it's wrapped
      const messageData = newMessage.message || newMessage;

      // Update messages if the message belongs to current conversation
      if (messageData.conversation === currentConversation?._id) {
        setMessages(prev => [...prev, messageData]);
        
        // Scroll to bottom for new messages
        setTimeout(() => {
          if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
          }
        }, 0);
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
                // Only increment unread count if not currently viewing this conversation
                unreadCount: currentConversation?._id === conv._id 
                  ? 0 
                  : (conv.unreadCount || 0) + 1
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

  // Update handleSendMessage to add new messages at the end
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

    // Add temporary message at the end
    setMessages(prev => [...prev, tempMessage]);

    // Scroll to bottom immediately after adding temp message
    setTimeout(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    }, 0);

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

      // Update messages by replacing temp message
      setMessages(prev => prev.map(msg =>
        msg._id === tempId ? serverMessage : msg
      ));

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

      // Ensure scroll to bottom after server confirmation
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
      }, 100);

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

  // Update chat list rendering with new styling
  const renderChatList = () => (
    <ScrollArea className="h-full">
      {isLoadingConversations ? (
        <div className="flex flex-col items-center justify-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-green-600 mb-2" />
          <p className="text-sm text-gray-500">Loading conversations...</p>
        </div>
      ) : conversations && conversations.length > 0 ? (
        conversations.map((conv) => (
          <div
            key={conv._id}
            className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors border-b ${
              currentConversation?._id === conv._id ? 'bg-green-50' : ''
            }`}
            onClick={() => {
              navigate('/dashboard/messages', {
                state: {
                  conversationId: conv._id,
                  participantId: conv.participant.id,
                  participantName: conv.participant.name
                }
              });
            }}
          >
            <div className="flex items-start gap-3">
              <div className="relative">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={conv.participant.avatar || "/placeholder.svg"} />
                  <AvatarFallback>{conv.participant.name[0]}</AvatarFallback>
                </Avatar>
                {/* Online status indicator */}
                <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
                  conv.participant.isOnline ? 'bg-green-500' : 'bg-gray-300'
                }`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="text-sm font-semibold text-gray-900">
                    {conv.participant.name}
                  </h3>
                  <span className="text-xs text-gray-500">
                    {formatMessageTime(conv.lastMessage.createdAt)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-600 truncate">
                    {conv.lastMessage.content.slice(0, 27)}{conv.lastMessage.content.length > 27 ? '...' : ''}
                  </p>
                  {conv.unreadCount > 0 && (
                    <span className="ml-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
                {/* Last active status */}
                {!conv.participant.isOnline && conv.participant.lastActive && (
                  <p className="text-xs text-gray-400 mt-1">
                    Last active {formatLastActive(conv.participant.lastActive)}
                  </p>
                )}
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

  // Update messages rendering with new styling
  const renderMessages = () => (
    <ScrollArea 
      ref={messagesContainerRef}
      className="flex-1 p-4"
      scrollToBottom={true}
    >
      {isLoadingMessages ? (
        <div className="flex flex-col items-center justify-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-green-600 mb-2" />
          <p className="text-sm text-gray-500">Loading messages...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {messages && messages.length > 0 ? (
            messages.map((message) => {
              if (!message || !message.sender) return null;
              const isSeller = message.sender?.model === 'Seller';

              return (
                <div
                  key={message._id}
                  className={`flex ${isSeller ? 'justify-end' : 'justify-start'}`}
                >
                  {!isSeller && (
                    <Avatar className="h-8 w-8 mr-2 mt-1">
                      <AvatarImage src={currentConversation?.participant?.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{currentConversation?.participant?.name?.[0]}</AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                      isSeller
                        ? 'bg-green-100 text-gray-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {message.messageType === 'image' && message.media?.length > 0 && (
                      <img
                        src={message.media[0].url}
                        alt="Message attachment"
                        className="max-w-full rounded-lg mb-2"
                        onLoad={() => {
                          if (messagesContainerRef.current) {
                            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
                          }
                        }}
                      />
                    )}

                    {message.messageType === 'product' && message.product && (
                      <div className="bg-white rounded-lg p-3 mb-2 shadow-sm">
                        <img
                          src={message.product.image}
                          alt={message.product.name}
                          className="w-full h-24 object-cover rounded-md"
                          onLoad={() => {
                            if (messagesContainerRef.current) {
                              messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
                            }
                          }}
                        />
                        <h4 className="text-sm font-medium mt-2">{message.product.name}</h4>
                        <p className="text-sm font-medium text-green-600 mt-1">
                          ₦ {message.product.price.toLocaleString()}
                        </p>
                      </div>
                    )}

                    {message.messageType === 'order' && message.order && (
                      <OrderMessage order={message.order} />
                    )}

                    <p className="text-sm">{message.content}</p>

                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-[10px] text-gray-500">
                        {formatMessageTime(message.createdAt)}
                      </span>
                      {isSeller && (
                        <span className="text-gray-400">
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
              Start the conversation!
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}
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
          <QuickReplyDialog 
            open={newQuickReplyOpen}
            onOpenChange={setNewQuickReplyOpen}
            title={quickReplyTitle}
            setTitle={setQuickReplyTitle}
            content={quickReplyContent}
            setContent={setQuickReplyContent}
            onCreateReply={handleCreateQuickReply}
          />
          {quickReplies.length > 0 ? (
            <ScrollArea className="h-full">
              <div className="space-y-3">
                {quickReplies.map((reply) => (
                  <Card key={reply.id} className="p-3">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-sm font-medium">{reply.title}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => handleDeleteQuickReply(reply.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{reply.content}</p>
                    <Button
                      size="sm"
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={() => handleSendQuickReply(reply.content)}
                      disabled={!currentConversation}
                    >
                      Use Reply
                    </Button>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No quick replies available yet.</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4"
                onClick={() => setNewQuickReplyOpen(true)}
              >
                Create Quick Reply
              </Button>
            </div>
          )}
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

  // Add effect to fetch buyer details when conversation changes
  useEffect(() => {
    const fetchBuyerDetails = async () => {
      if (!currentConversation?.participant?.id) return;
      
      try {
        const sellerToken = JSON.parse(localStorage.getItem('sellerToken')).data;
        const response = await fetch(`${BASE_URL}/seller/buyer/${currentConversation.participant.id}`, {
          headers: {
            'Authorization': `Bearer ${sellerToken}`
          }
        });
        
        if (!response.ok) throw new Error('Failed to fetch buyer details');
        
        const data = await response.json();
        setBuyerDetails(data);
      } catch (error) {
        console.error('Error fetching buyer details:', error);
        toast.error('Failed to load buyer details');
      }
    };

    fetchBuyerDetails();
  }, [currentConversation?.participant?.id]);

  // Update UserDetailsHeader component
  const UserDetailsHeader = () => {
    if (!currentConversation?.participant) return null;
    
    // Format total spent
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN'
      }).format(amount);
    };

    // Get primary address
    const primaryAddress = buyerDetails?.shippingAddresses?.[0];
    
    return (
      <div className="bg-white border-b p-4">
        {/* Add mobile back button */}
        <div className="flex items-center gap-2 mb-4 md:hidden">
          <Button
            variant="ghost"
            size="sm"
            className="p-0 hover:bg-transparent"
            onClick={() => {
              setShowChatList(true);
              setCurrentConversation(null);
            }}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <span className="text-sm font-medium">Back to chats</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="h-16 w-16">
              <AvatarImage 
                src={buyerDetails?.buyerInfo?.profileImageUrl || currentConversation.participant.avatar || "/placeholder.svg"} 
                alt={currentConversation.participant.name}
              />
              <AvatarFallback>
                {buyerDetails?.buyerInfo?.firstName?.[0] || currentConversation.participant.name[0]}
              </AvatarFallback>
            </Avatar>
            {/* Online status indicator */}
            <span className={`absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-white ${
              currentConversation.participant.isOnline ? 'bg-green-500' : 'bg-gray-300'
            }`} />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">
                {buyerDetails ? 
                  `${buyerDetails.buyerInfo.firstName} ${buyerDetails.buyerInfo.lastName}` :
                  currentConversation.participant.name
                }
              </h2>
              {/* Online/Offline status text */}
              <span className={`text-sm ${
                currentConversation.participant.isOnline ? 'text-green-500' : 'text-gray-400'
              }`}>
                {currentConversation.participant.isOnline ? 'Online' : 
                  currentConversation.participant.lastActive ? 
                    `Last seen ${formatLastActive(currentConversation.participant.lastActive)}` : 
                    'Offline'
                }
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
              {primaryAddress && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{primaryAddress.state}, {primaryAddress.country}</span>
                </div>
              )}
              {buyerDetails?.orderStats?.withSeller && (
                <>
                  <div className="flex items-center gap-1">
                    <ShoppingBag className="h-4 w-4" />
                    <span>{buyerDetails.orderStats.withSeller.totalOrders} Orders</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Banknote className="h-4 w-4" />
                    <span>{formatCurrency(buyerDetails.orderStats.withSeller.totalSpent)}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Add emoji handler
  const handleEmojiSelect = (emoji) => {
    setMessageInput(prev => prev + emoji.native);
    setShowEmojiPicker(false);
  };

  // Update the message input area
  const renderMessageInput = () => (
    <div className="px-4 py-3 border-t bg-white relative">
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Input
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 text-sm rounded-full bg-gray-50 pr-24"
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <SmileIcon className="h-5 w-5 text-gray-500" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => document.getElementById('file-upload').click()}
            >
              <PaperclipIcon className="h-5 w-5 text-gray-500" />
            </Button>
          </div>
        </div>
        
        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept="image/*"
          onChange={(e) => handleFileUpload(e.target.files[0])}
        />
        
        <Button
          size="icon"
          className="h-10 w-10 rounded-full bg-green-600 hover:bg-green-700"
          onClick={handleSendMessage}
          disabled={isSending}
        >
          {isSending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <SendHorizontal className="h-5 w-5" />
          )}
        </Button>
      </div>

      {showEmojiPicker && (
        <EmojiPicker onEmojiSelect={handleEmojiSelect} />
      )}
    </div>
  );

  // Load quick replies from localStorage on component mount
  useEffect(() => {
    const savedReplies = localStorage.getItem('quickReplies');
    if (savedReplies) {
      setQuickReplies(JSON.parse(savedReplies));
    }
  }, []);

  // Save quick replies to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('quickReplies', JSON.stringify(quickReplies));
  }, [quickReplies]);

  const handleCreateQuickReply = () => {
    if (!quickReplyTitle.trim() || !quickReplyContent.trim()) {
      toast.error('Please fill in both title and content');
      return;
    }

    const newReply = {
      id: Date.now(),
      title: quickReplyTitle,
      content: quickReplyContent
    };

    setQuickReplies(prev => [...prev, newReply]);
    setNewQuickReplyOpen(false);
    setQuickReplyTitle("");
    setQuickReplyContent("");
    toast.success('Quick reply created successfully');
  };

  const handleDeleteQuickReply = (id) => {
    setQuickReplies(prev => prev.filter(reply => reply.id !== id));
    toast.success('Quick reply deleted');
  };

  const handleSendQuickReply = (content) => {
    setMessageInput(content);
    handleSendMessage();
  };

  // Add this after other socket event listeners in the useEffect
  useEffect(() => {
    if (!socket) return;

    // Listen for user status changes
    socket.on('user_status_change', (data) => {
      console.log('User status changed:', data);
      setConversations(prev => prev.map(conv => {
        if (conv.participant.id === data.userId) {
          return {
            ...conv,
            participant: {
              ...conv.participant,
              isOnline: data.isOnline,
              lastActive: data.lastActive
            }
          };
        }
        return conv;
      }));

      // Update current conversation if it's the same user
      if (currentConversation?.participant?.id === data.userId) {
        setCurrentConversation(prev => ({
          ...prev,
          participant: {
            ...prev.participant,
            isOnline: data.isOnline,
            lastActive: data.lastActive
          }
        }));
      }
    });

    // Emit user activity periodically
    const activityInterval = setInterval(() => {
      socket.emit('user_activity');
    }, 30000); // Every 30 seconds

    return () => {
      socket.off('user_status_change');
      clearInterval(activityInterval);
    };
  }, [socket, currentConversation]);

  // Add this helper function for formatting last active time
  const formatLastActive = (lastActive) => {
    if (!lastActive) return '';
    
    const date = new Date(lastActive);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'yesterday';
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col ">

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
              <UserDetailsHeader />
              {renderMessages()}
              {renderMessageInput()}
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
          <div className="px-4 border-b flex justify-between items-center">
            {/* <h2 className="text-sm font-semibold text-gray-900">Quick Tools</h2> */}
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
