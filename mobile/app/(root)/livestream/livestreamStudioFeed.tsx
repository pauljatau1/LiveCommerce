import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  StyleSheet,
  TextInput,
  Platform,
  Keyboard,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useLivestream } from "@/contexts/livestreamContext";
import { WebView } from "react-native-webview";
import {
  AntDesign,
  MaterialIcons,
  Ionicons,
  Octicons,
  Entypo,
  MaterialCommunityIcons,
  SimpleLineIcons,
} from "@expo/vector-icons";
import { FocusAwareStatusBar } from "@/components/ui/focus-aware-status-bar";
import BottomSheet from "@/components/global/bottom-sheet";
import CustomCarousel from "@/components/livestream/CustomCarousel";
import { getToken, getUser } from "@/store/features/auth/utils";
import {
  StreamConfig,
  Product,
  StreamProduct,
  LivestreamContextType,
} from "@/types/streams/livestreamStudio";
import { streamEngine } from "./streamEngine";
import { LiveShowProductCard } from "./liveShowProductCard";
import {
  initializeSocket,
  disconnectSocket,
  getSocket,
  StreamNotification,
} from "./socketHandler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ProductPreview from "@/components/blips/productPreview";
import CheckoutNow from "@/components/blips/checkoutNow";
import StreamViewers from "./streamViewers";
import StreamInfo from "./StreamInfo";
import StreamOrders from "./streamOrders";
import { useToast } from "@/contexts/ToastContext";
import ShopBottomSheet from "./shopBottomSheet";
import { FloatingHeartsAnimation } from "./components/FloatingHeartsAnimation";
import type { FloatingHeartsRef } from "./components/FloatingHeartsAnimation";
import { GlassImage } from "./components";
import { SkeletonLoader } from "./components/SkeletonLoader";
import { useShareAppLinks } from "@/hooks/useShareAppLinks";
import { LinearGradient } from "expo-linear-gradient";
import { GestureHandlerRootView } from "react-native-gesture-handler";

const { height } = Dimensions.get("window");

const LivestreamStudioFeed = ({
  id,
  isVisible,
  onInteractionStart,
  shared,
}: {
  id: any;
  isVisible: boolean;
  onInteractionStart?: () => void;
  shared: boolean;
}) => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { show } = useToast();
  // const { id } = useLocalSearchParams();
  const {
    activeStreamDetails,
    joinStream,
    fetchActiveStreamDetails,
    leaveStream,
    followSellerThroughStream,
    unfollowSellerThroughStream,
    checkIfSellerIsFollowedFromSellerProfile,
  } = useLivestream() as LivestreamContextType;
  const [streamConfig, setStreamConfig] = useState<StreamConfig | null>(null);
  const [status, setStatus] = useState("Initializing...");
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowingLoading, setIsFollowingLoading] = useState(false);
  const [isFollowingLoading2, setIsFollowingLoading2] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [sellerId, setSellerId] = useState<string>("");

  // UI interaction states
  const [likes, setLikes] = useState(23500);
  const [liked, setLiked] = useState(false);
  const [comments, setComments] = useState(1200);
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState("");
  const [streamProducts, setStreamProducts] = useState<StreamProduct[]>([]);
  const [currentProductIndex, setCurrentProductIndex] = useState(0);
  const [storeInfo, setStoreInfo] = useState({
    name: "Store Name",
    username: "@username",
    avatar: require("@/assets/icons/animoji.png"),
  });
  const [viewerCount, setViewerCount] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const webViewRef = useRef<WebView>(null);

  // Bottom sheet state for product preview and checkout
  const [showProductPreview, setShowProductPreview] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // New state for live comments and events
  const [liveComments, setLiveComments] = useState<
    Array<{
      id: string;
      type:
        | "comment"
        | "join"
        | "purchase"
        | "hostLeft"
        | "hostRejoin"
        | "leave"
        | "liveshow_order";
      user: string;
      avatar?: any;
      content: string;
      timestamp: Date;
      data?: any;
    }>
  >([]);
  const [commentInput, setCommentInput] = useState("");
  const commentsListRef = useRef<ScrollView>(null);
  // Add a new state to track if video is actually playing
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  // Replace standard state with refs for instant updates
  const keyboardHeightRef = useRef(0);
  const keyboardVisibleRef = useRef(false);
  const [, forceUpdate] = useState({});
  const { width: screenWidth } = Dimensions.get("window");

  // New state for viewers bottom sheet
  const [showViewers, setShowViewers] = useState(false);
  // New state for stream info bottom sheet
  const [showStreamInfo, setShowStreamInfo] = useState(false);
  // New state for orders bottom sheet
  const [showOrders, setShowOrders] = useState(false);
  // New state for shop bottom sheet
  const [showShop, setShowShop] = useState(false);
  // Add state for menu popover
  const [showMenuPopover, setShowMenuPopover] = useState(false);
  // Add stream details state
  const [streamDetails, setStreamDetails] = useState({
    title: "",
    description: "",
    category: "",
    tags: [],
    viewerCount: 0,
    scheduledStartTime: "",
    actualStartTime: "",
    status: "live",
    type: "regular",
    sellerFollowers: 0,
  });

  // Add state for leave stream loading
  const [isLeavingStream, setIsLeavingStream] = useState(false);

  // Add new state for detailed viewers
  const [detailedViewers, setDetailedViewers] = useState<any[]>([]);

  // Add state for host presence
  const [isHostPresent, setIsHostPresent] = useState(true);
  const [showNoHostAlert, setShowNoHostAlert] = useState(false);
  const [showNoHostAlert2, setShowNoHostAlert2] = useState(false);
  // Add state to manage heart animations
  const heartsRef = useRef<FloatingHeartsRef>(null);

  const { displayShareDialog } = useShareAppLinks();

  const shareLinkUrl = useMemo(
    () =>
      `https://app.auqli.live/livestream/feed?id=${id}&type=${activeStreamDetails?.stream?.type}&itmSource=share`,
    [id, activeStreamDetails],
  );

  // Update detailedViewers when activeStreamDetails changes
  useEffect(() => {
    if (activeStreamDetails?.stream?.viewers) {
      setDetailedViewers(activeStreamDetails.stream.viewers);
      console.log(
        "Initialized detailedViewers with:",
        activeStreamDetails.stream.viewers,
      );
    }
  }, [activeStreamDetails]);

  // Setup and cleanup effect
  useEffect(() => {
    // On mount or when isVisible changes to true, run setupLivestream
    if (isVisible) {
      setupLivestream();

      // Scroll to the end to show new comment
      if (commentsListRef.current) {
        commentsListRef.current.scrollToEnd({ animated: true });
      }

      // Cleanup function - will run when:
      // 1. Component unmounts
      // 2. isVisible changes from true to false
      // 3. id changes (which should disconnect and reconnect)
      return () => {
        // Since we only run the effect when isVisible is true,
        // this cleanup will only run when we're either unmounting
        // or isVisible is changing to false, both cases where we want to leave
        handleLeaveStream(true);
      };
    }
    // No cleanup needed if isVisible is false, as we didn't setup anything
  }, [id, isVisible]);

  // Separate useEffect for keyboard event listeners
  useEffect(() => {
    // Enhanced keyboard listeners for zero-latency updates
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        keyboardVisibleRef.current = true;
        keyboardHeightRef.current = e.endCoordinates.height;
        // Force immediate re-render
        forceUpdate({});
      },
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      (e) => {
        keyboardVisibleRef.current = false;
        keyboardHeightRef.current = 0;
        // Force immediate re-render
        forceUpdate({});
      },
    );

    // Cleanup keyboard listeners
    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []); // Empty dependency array since we don't need any dependencies for keyboard events

  console.log("keyboardHeightRef", keyboardHeightRef.current);
  console.log("keyboardVisibleRef", keyboardVisibleRef.current);

  // Handle Android back button press
  {
    /* useEffect(() => {
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            if (Platform.OS === 'android') {
                const backButton = true;
                handleLeaveStream(backButton);
                router.back();
                return true; // Prevent default behavior
            }
            return false;
        });

        return () => backHandler.remove();
    }, [id]);*/
  }

  const setupLivestream = async () => {
    if (!id) return;
    try {
      setStatus("Joining stream...");

      // Join the stream using the stream ID from route parameters
      const streamDetails = await joinStream(id as string);
      console.log("Stream details:", streamDetails);
      console.log("stream viewers", streamDetails?.stream?.viewers);

      // Set stream metadata if available from API
      if (streamDetails) {
        // Update likes and comments if available from API
        if (streamDetails.likes) setLikes(streamDetails.likes);
        if (streamDetails.comments) setComments(streamDetails.comments);

        // Set products from stream data
        if (streamDetails.products && streamDetails.products.length > 0) {
          setStreamProducts(streamDetails.products);
        } else if (
          streamDetails.stream?.products &&
          streamDetails.stream.products.length > 0
        ) {
          console.log(
            "New Stream products:",
            JSON.stringify(streamDetails.stream.products),
          );
          setStreamProducts(streamDetails.stream.products);
        }

        // Debug seller information
        console.log("Seller info from API:", streamDetails.seller);
        console.log("Stream info:", streamDetails.stream);

        // Based on the console log, we can see the seller info is in streamDetails.stream.seller
        if (streamDetails.stream && streamDetails.stream.seller) {
          // Get seller data from stream.seller with type assertion
          const sellerData = streamDetails.stream.seller as {
            _id: string;
            businessName: string;
            storeAvatar: {
              url: string;
            };
            storeName: string;
          };
          console.log("Using seller data from stream.seller:", sellerData);

          const newStoreInfo = {
            name:
              sellerData.storeName || sellerData.businessName || "Store Name",
            username: `@${(sellerData.storeName || sellerData.businessName || "username").toLowerCase().replace(/\s+/g, "")}`,
            avatar: sellerData.storeAvatar?.url
              ? { uri: sellerData.storeAvatar.url }
              : require("@/assets/icons/animoji.png"),
          };

          console.log("Setting store info to:", newStoreInfo);
          setStoreInfo(newStoreInfo);

          // Set the seller ID and check if user is following the seller
          if (sellerData._id) {
            setSellerId(sellerData._id);
            try {
              const sellerProfileData =
                await checkIfSellerIsFollowedFromSellerProfile(sellerData._id);
              console.log("Seller profile data:", sellerProfileData);
              setIsFollowing(
                sellerProfileData?.storeInfo?.isFollowing || false,
              );
            } catch (error) {
              console.error("Error checking if seller is followed:", error);
            }
          }
        }
        // If seller info is directly in streamDetails
        else if (streamDetails.seller) {
          console.log("Using seller data from streamDetails.seller");

          const sellerData = streamDetails.seller;
          const newStoreInfo = {
            name:
              sellerData.storeName || sellerData.businessName || "Store Name",
            username: `@${(sellerData.storeName || sellerData.businessName || "username").toLowerCase().replace(/\s+/g, "")}`,
            avatar: sellerData.storeAvatar?.url
              ? { uri: sellerData.storeAvatar.url }
              : require("@/assets/icons/animoji.png"),
          };

          console.log("Setting store info to:", newStoreInfo);
          setStoreInfo(newStoreInfo);

          // Set the seller ID and check if user is following the seller
          if (sellerData._id) {
            setSellerId(sellerData._id);
            try {
              const sellerProfileData =
                await checkIfSellerIsFollowedFromSellerProfile(sellerData._id);
              console.log("Seller profile data:", sellerProfileData);
              setIsFollowing(
                sellerProfileData?.storeInfo?.isFollowing || false,
              );
            } catch (error) {
              console.error("Error checking if seller is followed:", error);
            }
          }
        }

        // Set stream details
        if (streamDetails.stream) {
          const stream = streamDetails.stream as any;
          setStreamDetails({
            title: stream.title || "Live Stream",
            description:
              stream.description ||
              "Join our live stream and shop exclusive items!",
            category: stream.category || "Shopping",
            tags: stream.tags || ["shopping", "live", "exclusive"],
            viewerCount:
              typeof stream.viewerCount === "number"
                ? stream.viewerCount
                : Array.isArray(stream.viewers)
                  ? stream.viewers.length
                  : 0,
            scheduledStartTime:
              stream.scheduledStartTime || new Date().toISOString(),
            actualStartTime: stream.startTime || new Date().toISOString(),
            status: stream.status || "live",
            type: "regular",
            sellerFollowers: stream.sellerFollowers || 0,
          });
        }
      }

      // Set initial viewer count if available
      if (streamDetails?.stream) {
        const streamData = streamDetails.stream as any;
        console.log("Stream view count data:", streamData);
        if (typeof streamData.viewerCount === "number") {
          console.log("Viewer count:", streamData.viewerCount);
          setViewerCount(streamData.viewerCount);
        } else if (Array.isArray(streamData.viewers)) {
          setViewerCount(streamData.viewers.length);
        }
      }

      setStreamConfig({
        appId: process.env.EXPO_PUBLIC_AGORA_APP_ID || "",
        channel: streamDetails?.channelName || "",
        token: streamDetails?.token || "",
        uid: streamDetails?.uid || "",
      });

      // Initialize with chat interactions from the stream
      const chatInteractions =
        (streamDetails.stream as any)?.chatInteractions || [];

      // Get the current user's information
      const user = await getUser();

      // Create a join event for the current user
      const userJoinEvent = {
        id: Date.now().toString(),
        type: "join" as const,
        user: user?.firstName || "You",
        avatar:
          user?.profileImage?.url || require("@/assets/icons/animoji.png"),
        content: "joined the stream",
        timestamp: new Date(),
        data: {
          isCurrentUser: true, // Add this flag to identify the current user's join event
        },
      };

      // Add the user's join event to the beginning of chat interactions
      const updatedChatInteractions = [...chatInteractions, userJoinEvent];

      // Set the live comments with the updated data
      setLiveComments(updatedChatInteractions);

      console.log(
        `Loaded ${updatedChatInteractions.length} chat interactions from server`,
      );

      // Use requestAnimationFrame and setTimeout for more reliable scrolling
      if (updatedChatInteractions.length > 0) {
        requestAnimationFrame(() => {
          setTimeout(() => {
            if (commentsListRef.current) {
              commentsListRef.current.scrollToEnd({
                animated: true,
              });
            }
          }, 500); // Increased timeout to ensure layout is complete
        });
      }

      // Initialize socket connection for real-time chat
      const userToken = await getToken();
      if (userToken) {
        initializeSocket(userToken, handleStreamNotification, id as string);
      }
    } catch (error) {
      console.error("Error setting up livestream:", error);
      setStatus("Error: " + (error as Error).message);
    }
  };

  // Handler for WebSocket notifications (joins, comments, purchases, host left/rejoined)
  const handleStreamNotification = useCallback(
    (notification: StreamNotification) => {
      console.log("Received notification:", notification);

      // Process notification based on type
      switch (notification.type) {
        case "join":
          console.log("User joined stream:", notification.user);
          // Update UI to show join event
          setLiveComments((prev) => [...prev, notification as any]);

          // Update viewer count if available in notification data
          if (notification.data) {
            if ("viewerCount" in notification.data) {
              setViewerCount(notification.data.viewerCount as number);
            }

            // Add new viewer to detailedViewers array if not already present
            if (notification.data.buyerId) {
              const buyerId = notification.data.buyerId;
              console.log(
                "Checking buyerId:",
                buyerId,
                "in viewers array length:",
                detailedViewers?.length || 0,
              );

              // Log the full viewers array for debugging
              console.log(
                "Current detailedViewers:",
                JSON.stringify(detailedViewers),
              );

              // Convert both to strings for safer comparison
              const existingViewer =
                Array.isArray(detailedViewers) &&
                detailedViewers.find(
                  (viewer) =>
                    viewer &&
                    viewer._id &&
                    viewer._id.toString() === buyerId.toString() &&
                    viewer.firstName ===
                      notification?.data?.buyerName?.split(" ")[0] &&
                    viewer.lastName ===
                      notification?.data?.buyerName?.split(" ")[1],
                );

              console.log(
                "existingViewer check result:",
                existingViewer
                  ? `Found with id ${existingViewer._id}`
                  : "Not found",
              );

              if (!existingViewer) {
                // Viewer does not exist, create and add new viewer object
                const newViewer = {
                  _id: buyerId,
                  firstName: notification.data.buyerName?.split(" ")[0] || "",
                  lastName: notification.data.buyerName?.split(" ")[1] || "",
                  username: notification.data.buyerUsername || "",
                  profileImage: notification.data.buyerAvatar
                    ? { url: notification.data.buyerAvatar }
                    : undefined,
                };

                setDetailedViewers((prev) => [...prev, newViewer]);
                console.log("Added new viewer:", newViewer._id);
              } else {
                console.log(
                  "Viewer already exists in detailed viewers array:",
                  buyerId,
                );
              }
            }

            // If the server provides a full viewers array, use it instead
            {
              /*if ('viewers' in notification.data && Array.isArray(notification.data.viewers)) {
                        setDetailedViewers(notification.data.viewers);
                        console.log('Updated viewers from server data:', notification.data.viewers);
                    }*/
            }
          }
          break;

        case "comment":
          console.log("New comment received:", notification.content);
          // Update UI to show comment
          setLiveComments((prev) => [...prev, notification as any]);
          // Increment comment count
          setComments((prev) => prev + 1);
          break;

        case "purchase":
          console.log("New purchase made:", notification.content);
          // Update UI to show purchase
          setLiveComments((prev) => [...prev, notification as any]);
          break;

        case "hostLeft":
          console.log("Host left stream:", notification.user);
          // Update UI to show host left event
          setLiveComments((prev) => [...prev, notification as any]);
          break;

        case "hostRejoin":
          console.log("Host rejoined stream:", notification.user);
          // Update UI to show host rejoined event
          setLiveComments((prev) => [...prev, notification as any]);
          break;

        case "leave":
          console.log("User left stream:", notification.user);
          // Update UI to show leave event
          setLiveComments((prev) => [...prev, notification as any]);
          // Update viewer count if available in notification data
          if (notification.data) {
            if ("viewerCount" in notification.data) {
              setViewerCount(notification.data.viewerCount as number);
            }

            // Remove viewer from detailedViewers array
            if ("buyerId" in notification.data && notification.data.buyerId) {
              const buyerId = notification.data.buyerId as string;
              setDetailedViewers((prev) =>
                prev.filter((viewer) => viewer._id !== buyerId),
              );
              console.log("Removed viewer with ID:", buyerId);
            }

            // If the server provides a full viewers array, use it instead
            {
              /*if ('viewers' in notification.data && Array.isArray(notification.data.viewers)) {
                        setDetailedViewers(notification.data.viewers);
                        console.log('Updated viewers from server data:', notification.data.viewers);
                    }*/
            }
          }
          break;

        case "liveshow_order":
          console.log("New order received:", notification.content);

          // Show a brief toast notification with the order details
          if (notification.data?.orders) {
            const orderCount = Array.isArray(notification.data.orders)
              ? notification.data.orders.length
              : 1;

            {
              /*show({
              text1: "💰 New Order Placed!",
              text2: `${orderCount} item(s) ordered from this stream`,
              type: "success",
              duration: 3000,
              topPosition: 18,
            });*/
            }
          }

          // Update UI to show order event in chat
          setLiveComments((prev) => [...prev, notification as any]);
          break;

        default:
          console.warn("Unknown notification type:", notification.type);
      }

      // Use requestAnimationFrame to ensure UI has updated before scrolling
      requestAnimationFrame(() => {
        // Use setTimeout to give the FlatList a moment to update its layout
        setTimeout(() => {
          if (commentsListRef.current) {
            commentsListRef.current.scrollToEnd({ animated: true });
          }
        }, 100);
      });
    },
    [liveComments, detailedViewers],
  );

  const handleWebViewMessage = (event: { nativeEvent: { data: string } }) => {
    const message = event.nativeEvent.data;
    console.log("WebView message:", message);

    if (message.startsWith("error:")) {
      setStatus(message.replace("error:", "Error: "));
      setIsLoading(false);
      return;
    }

    if (message === "joined_channel") {
      setStatus("Connected to channel");
      setIsLoading(false);
    } else if (message.startsWith("user_published:")) {
      const parts = message.split(":");
      if (parts.length >= 3) {
        const mediaType = parts[2]; // Format is "user_published:uid:mediaType"
        setStatus(`Host ${mediaType} stream playing`);
        setIsLoading(false);
      }
    } else if (message === "no_host_present") {
      // Handle no host present message
      setIsHostPresent(false);
      setShowNoHostAlert(true);
      setShowNoHostAlert2(true);
      setStatus("No host present");
      setIsLoading(false);
    } else if (
      message === "host_video_detected" ||
      message === "video_playing:"
    ) {
      // Host has joined with video
      setIsHostPresent(true);
      setShowNoHostAlert(false);
      setShowNoHostAlert2(false);
      setStatus("Host stream playing");
      setIsVideoPlaying(true);
      setIsLoading(false);
    } else if (message === "host_left_video" || message === "all_hosts_left") {
      // Host has left
      setIsHostPresent(false);
      setShowNoHostAlert(true);
      setShowNoHostAlert2(false);
      setStatus("Host left the stream");
    } else if (message.startsWith("user_unpublished:")) {
      const parts = message.split(":");
      if (parts.length >= 3) {
        const mediaType = parts[2]; // Format is "user_unpublished:uid:mediaType"

        // Only display notification when a video stream is unpublished
        if (mediaType === "video") {
          // Add a notification to the chat that host left
          const hostLeftNotification = {
            id: Date.now().toString(),
            type: "hostLeft" as const,
            user: storeInfo.name,
            avatar: storeInfo.avatar,
            content: "Host left room",
            timestamp: new Date(),
          };

          // Add notification to the comments
          setLiveComments((prev) => [...prev, hostLeftNotification]);

          // Scroll to show the notification
          requestAnimationFrame(() => {
            setTimeout(() => {
              if (commentsListRef.current) {
                commentsListRef.current.scrollToEnd({ animated: true });
              }
            }, 100);
          });

          setStatus(`Host ${mediaType} stream ended`);
        }
      }
    } else if (
      message.startsWith("video_reconnected:") ||
      message.startsWith("user_rejoined:")
    ) {
      // This message is triggered when a previously disconnected user rejoins
      // Add notification that host has rejoined if we previously saw them leave
      const hasHostLeftPreviously = liveComments.some(
        (comment) => comment.type === "hostLeft",
      );

      if (hasHostLeftPreviously) {
        const hostRejoinedNotification = {
          id: Date.now().toString(),
          type: "hostRejoin" as const,
          user: storeInfo.name,
          avatar: storeInfo.avatar,
          content: "rejoined room",
          timestamp: new Date(),
        };

        // Add notification to the comments
        setLiveComments((prev) => [...prev, hostRejoinedNotification]);

        // Scroll to show the notification
        requestAnimationFrame(() => {
          setTimeout(() => {
            if (commentsListRef.current) {
              commentsListRef.current.scrollToEnd({ animated: true });
            }
          }, 100);
        });

        setStatus("Host video reconnected");
        setIsVideoPlaying(true);
        setIsHostPresent(true);
        setShowNoHostAlert(false);
        setShowNoHostAlert2(false);
        setIsLoading(false);
      }
    } else if (message.startsWith("video_playing:")) {
      // Set video playing state to true when we get confirmation video is playing
      setIsVideoPlaying(true);
      setIsHostPresent(true);
      setShowNoHostAlert(false);
      setShowNoHostAlert2(false);
      setIsLoading(false);
    } else if (message.startsWith("connection:")) {
      const parts = message.split(":");
      if (parts.length >= 2) {
        const state = parts[1];
        setStatus(`Connection: ${state}`);
      }
    } else if (message === "all_audio_muted") {
      console.log("Audio muted successfully");
    } else if (message === "all_audio_unmuted") {
      console.log("Audio unmuted successfully");
    } else if (
      message.startsWith("audio_muted:") ||
      message.startsWith("audio_unmuted:")
    ) {
      console.log(message);
    } else {
      setStatus(message);
    }
  };

  const handleShare = () => {
    // Implement share functionality
    console.log("Share stream");
    displayShareDialog(shareLinkUrl);
  };

  // Toggle audio mute/unmute
  const toggleMute = useCallback(() => {
    const newMuteState = !isMuted;
    setIsMuted(newMuteState);

    // Send message to WebView to handle audio muting
    if (webViewRef.current) {
      const message = newMuteState ? "mute_audio" : "unmute_audio";
      webViewRef.current.injectJavaScript(`
                if (window.toggleAudioMute) {
                    window.toggleAudioMute(${newMuteState});
                    true;
                }
            `);
    }

    show({
      text1: "Audio " + (newMuteState ? "muted" : "unmuted"),
      type: "info",
      duration: 2000,
      topPosition: insets.top + 10,
    });
  }, [isMuted]);

  // Product buy handler
  const handleBuyNow = (product: Product) => {
    // Set the selected product and show checkout
    setSelectedProduct(product);
    setShowCheckout(true);
    console.log("Buy product:", product.name);
  };

  // Product preview handler
  const handleProductPreview = (product: Product) => {
    // Set the selected product and show preview
    setSelectedProduct(product);
    setShowProductPreview(true);
    console.log("Preview product:", product.name);
  };

  // Render a comment or event item to match the reference image
  const renderCommentItem = ({ item }: { item: any }) => {
    // Check if avatar exists and is a valid source
    const hasValidAvatar =
      item.avatar &&
      (typeof item.avatar === "string" ||
        typeof item.avatar === "number" ||
        item.avatar.uri);

    // Generate a consistent color based on the user's name
    const getAvatarColor = (username: string) => {
      // Array of vibrant background colors for letter avatars
      const colors = [
        "#FF5733", // Red-Orange
        "#33A1FF", // Blue
        "#33FF57", // Green
        "#BD33FF", // Purple
        "#FFD133", // Yellow
        "#33FFBD", // Turquoise
        "#FF33BD", // Pink
        "#7D33FF", // Indigo
        "#FF7D33", // Orange
        "#33FF7D", // Mint
        "#FF3333", // Red
        "#33A8FF", // Light Blue
        "#000000",
      ];

      // Use the sum of character codes to select a color
      const charSum = username
        .split("")
        .reduce((sum, char) => sum + char.charCodeAt(0), 0);
      return colors[charSum % colors.length];
    };

    // Render avatar - either an image or a fallback letter avatar
    const renderAvatar = () => {
      if (hasValidAvatar) {
        // If avatar exists, format it correctly based on its type
        let avatarSource;
        if (typeof item.avatar === "string") {
          avatarSource = { uri: item.avatar };
        } else {
          avatarSource = item.avatar; // It's already a require() or imported image
        }

        return (
          <GlassImage
            source={avatarSource}
            imageStyle={styles.commentAvatar}
            glassStyle={styles.commentAvatar}
            placeholderColor="rgba(255, 255, 255, 0.1)"
            blurIntensity={20}
            tint="dark"
            showActivityIndicator={false}
          />
        );
      } else {
        // Use first letter of username with a random background color
        const firstLetter =
          item.user && item.user.length > 0
            ? item.user.charAt(0).toUpperCase()
            : "?";
        const backgroundColor = getAvatarColor(item.user || "");

        return (
          <View
            style={[
              styles.commentAvatar,
              {
                backgroundColor,
                justifyContent: "center",
                alignItems: "center",
              },
            ]}
          >
            <Text
              style={{
                color: "#FFFFFF",
                fontWeight: "bold",
                fontSize: 16,
              }}
            >
              {firstLetter}
            </Text>
          </View>
        );
      }
    };

    if (item.type === "join") {
      const isCurrentUser = item.data?.isCurrentUser;
      return (
        <View
          style={[
            styles.joinCommentItem,
            isCurrentUser && styles.currentUserJoinItem,
          ]}
        >
          {renderAvatar()}
          <View style={styles.joinCommentContent}>
            <Text
              style={[
                styles.commentUser,
                isCurrentUser && styles.currentUserText,
              ]}
            >
              {isCurrentUser ? "You" : item.user}
            </Text>
            <Text style={styles.joinCommentText}>
              {item.content}
              {isCurrentUser ? " 👋 Welcome!" : " 👋"}
            </Text>
          </View>
        </View>
      );
    } else if (item.type === "leave") {
      // Handle viewer leave comments
      const isCurrentUser = item.data?.buyerId === (getUser() as any)?._id;
      return (
        <View style={styles.leaveCommentItem}>
          {renderAvatar()}
          <View style={styles.leaveCommentContent}>
            <Text style={styles.commentUser}>{item.user}</Text>
            <Text style={styles.leaveCommentText}>{item.content}</Text>
          </View>
        </View>
      );
    } else if (item.type === "purchase") {
      return (
        <View style={styles.purchaseCommentItem}>
          {renderAvatar()}
          <View style={styles.purchaseCommentContent}>
            <Text style={styles.commentUser}>{item.user}</Text>
            <Text style={styles.purchaseCommentText}>{item.content}</Text>
          </View>
        </View>
      );
    } else if (item.type === "liveshow_order") {
      return (
        <View style={styles.liveshowOrderCommentItem}>
          {renderAvatar()}
          <View style={styles.liveshowOrderCommentContent}>
            <Text style={styles.liveshowCommentUser}>{item.user}</Text>
            <Text style={styles.liveshowOrderCommentText}>{item.content}</Text>
          </View>
        </View>
      );
    } else if (item.type === "hostLeft") {
      return (
        <View style={styles.hostLeftCommentItem}>
          {renderAvatar()}
          <View style={styles.hostLeftCommentContent}>
            <Text style={styles.commentUser}>{item.user}</Text>
            <Text style={styles.hostLeftCommentText}>{item.content}</Text>
          </View>
        </View>
      );
    } else if (item.type === "hostRejoin") {
      return (
        <View style={styles.hostRejoinedCommentItem}>
          {renderAvatar()}
          <View style={styles.hostRejoinedCommentContent}>
            <Text style={styles.commentUser}>{item.user}</Text>
            <Text style={styles.hostRejoinedCommentText}>{item.content}</Text>
          </View>
        </View>
      );
    } else {
      return (
        <View style={styles.regularCommentItem}>
          {renderAvatar()}
          <View style={styles.regularCommentContent}>
            <Text style={styles.commentUser}>{item.user}</Text>
            <Text style={styles.regularCommentText}>{item.content}</Text>
          </View>
        </View>
      );
    }
  };

  const handleSendComment = async () => {
    if (!commentInput.trim()) return;

    try {
      const token = await getToken();
      const user = await getUser();

      if (!token || !user) {
        console.log("User not authenticated");
        return;
      }

      // Clear input immediately for better UX
      const commentContent = commentInput.trim();
      setCommentInput("");

      // Create a local comment for immediate display
      const localComment = {
        id: Date.now().toString(),
        type: "comment" as const,
        user: user.firstName || "User",
        avatar: user.profileImage?.url || require("@/assets/icons/animoji.png"),
        content: commentContent,
        timestamp: new Date(),
      };

      // Add to local state for immediate feedback
      //setLiveComments(prev => [...prev, localComment]);

      // Increment comment count locally
      setComments((prev) => prev + 1);

      // Scroll to the end to show new comment
      if (commentsListRef.current) {
        commentsListRef.current.scrollToEnd({ animated: true });
      }

      // Send the comment to the server via WebSocket
      const socketInstance = getSocket();
      if (socketInstance) {
        // Get the stream ID from the route parameters
        const streamId = id as string;

        // Emit the stream_comment event to the server
        socketInstance.emit("stream_comment", {
          streamId,
          content: commentContent,
        });

        console.log("Comment sent to server via WebSocket");
      } else {
        console.error("Socket not connected, comment only saved locally");
      }
    } catch (error) {
      console.error("Error sending comment:", error);
    }
  };

  // Create a single condition to check if UI should be shown
  const shouldShowUI =
    streamConfig && !isLoading && isVideoPlaying && isVisible;

  const handleIncreaseCommentCount = () => {
    setComments(comments + 1);
  };

  const handleShowOrders = () => {
    setShowOrders(true);
  };

  const handleShowShop = () => {
    setShowShop(true);
  };

  const handleCantComment = () => {
    setShowComments(false);
    // Handle auth flow if needed
  };

  // Clean up socket connection when component unmounts
  // useEffect(() => {
  //   return () => {
  //     console.log("Disconnecting socket on component unmount");
  //     disconnectSocket();
  //   };
  // }, []);

  // Add handleShowViewers function
  const handleShowViewers = () => {
    setShowViewers(true);
  };

  // Add handleShowStreamInfo function
  const handleShowStreamInfo = () => {
    setShowStreamInfo(true);
  };

  // Update handleLeaveStream function to actually leave the stream
  const handleLeaveStream = async (backButton: boolean) => {
    if (!id) return;

    try {
      setIsLeavingStream(true);
      console.log("User requested to leave the stream");

      // First tell the WebView to leave the Agora channel
      if (webViewRef.current) {
        webViewRef.current.injectJavaScript(`
          if (window.leaveChannel) {
            window.leaveChannel();
            true;
          }
        `);
        // Give a small delay to allow the WebView to process the leave command
        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      // Call the leaveStream API endpoint
      const result = await leaveStream(id as string);
      console.log("Leave stream result:", result);

      // Disconnect the socket
      disconnectSocket();

      // Navigate back to previous screen
      if (!backButton) {
        shared ? router.push("/(root)/(tabs)/home/home") : router.back();
      }
    } catch (error) {
      console.error("Error leaving stream:", error);
      disconnectSocket();
      router.back();
      // Show error message to user if needed
    } finally {
      disconnectSocket();
      setIsLeavingStream(false);
      setShowMenuPopover(false);
    }
  };

  const handleCloseCheckout = useCallback(() => {
    setShowCheckout(false);
  }, []);

  // Add follow/unfollow handler functions
  const handleFollowSeller = async (isStreamInfo: boolean) => {
    if (!sellerId) {
      console.error("No seller ID available");
      return;
    }

    try {
      isStreamInfo ? setIsFollowingLoading2(true) : setIsFollowingLoading(true);
      const response = await followSellerThroughStream(
        sellerId,
        storeInfo.name,
      );
      setIsFollowing(true);

      // Update the follow count with the latest from API
      if (response && response.sellerFollowCount !== undefined) {
        setStreamDetails((prev) => ({
          ...prev,
          sellerFollowers: response.sellerFollowCount,
        }));
      }
    } catch (error) {
      console.error("Error following seller:", error);
      show({
        type: "error",
        text1: "Error",
        text2: "Failed to follow seller. Please try again.",
        topPosition: 18,
      });
    } finally {
      isStreamInfo
        ? setIsFollowingLoading2(false)
        : setIsFollowingLoading(false);
    }
  };

  const handleUnfollowSeller = async (isStreamInfo: boolean) => {
    if (!sellerId) {
      console.error("No seller ID available");
      return;
    }

    try {
      isStreamInfo ? setIsFollowingLoading2(true) : setIsFollowingLoading(true);
      const response = await unfollowSellerThroughStream(
        sellerId,
        storeInfo.name,
      );
      setIsFollowing(false);

      // Update the follow count with the latest from API
      if (response && response.sellerFollowCount !== undefined) {
        setStreamDetails((prev) => ({
          ...prev,
          sellerFollowers: response.sellerFollowCount,
        }));
      }
    } catch (error) {
      console.error("Error unfollowing seller:", error);
      show({
        text1: "Error",
        text2: `Failed to unfollow ${storeInfo.name}. Please try again.`,
        type: "error",
        topPosition: 18,
      });
    } finally {
      isStreamInfo
        ? setIsFollowingLoading2(false)
        : setIsFollowingLoading(false);
    }
  };

  // Handle sending heart reaction
  const handleReactWithHeart = useCallback(() => {
    // Trigger the heart animation
    if (heartsRef.current) {
      heartsRef.current.generateHearts();
    }

    // Send the reaction to the server via socket
    const socketInstance = getSocket();
    if (socketInstance) {
      socketInstance.emit("stream_reaction", {
        streamId: id,
        type: "heart",
      });
    }
  }, [id]);

  // Gesture handler for rapid heart taps with improved state management
  const tapCount = useRef(0);
  const lastTapTime = useRef(0);
  const isAnimating = useRef(false);
  const TAP_THRESHOLD = 150;
  const heartPressTimeout = useRef<NodeJS.Timeout | null>(null);
  const socketThrottleTimeout = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Debounced socket event emitter
  const debouncedSocketEmit = useCallback(
    (eventType: string) => {
      if (socketThrottleTimeout.current) {
        clearTimeout(socketThrottleTimeout.current);
      }

      socketThrottleTimeout.current = setTimeout(() => {
        const socketInstance = getSocket();
        if (socketInstance) {
          socketInstance.emit("stream_reaction", {
            type: eventType,
            streamId: id,
          });
        }
        socketThrottleTimeout.current = null;
      }, 1000);
    },
    [id],
  );

  // Improved heart press handler with better state management
  const handleHeartPress = useCallback(() => {
    const now = performance.now ? performance.now() : Date.now();
    const elapsed = now - lastTapTime.current;
    lastTapTime.current = now;

    // Clear any existing timeouts
    if (heartPressTimeout.current) {
      clearTimeout(heartPressTimeout.current);
      heartPressTimeout.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // If we're already animating, just queue up more hearts
    if (isAnimating.current) {
      if (heartsRef.current) {
        heartsRef.current.generateHearts();
      }
      return;
    }

    // Start new animation sequence
    animationFrameRef.current = requestAnimationFrame(() => {
      if (!heartsRef.current) return;

      // Check if this is a rapid tap
      if (elapsed < TAP_THRESHOLD) {
        tapCount.current++;

        // If we've detected rapid taps, start continuous animation
        if (tapCount.current >= 2) {
          isAnimating.current = true;
          heartsRef.current.startContinuousHearts();
          debouncedSocketEmit("heart_burst");

          // Set timeout to stop continuous animation
          heartPressTimeout.current = setTimeout(() => {
            if (heartsRef.current) {
              heartsRef.current.stopContinuousHearts();
            }
            isAnimating.current = false;
            tapCount.current = 0;
          }, 3000); // Reduced from 5000ms to 3000ms for better control
        } else {
          // Single rapid tap
          heartsRef.current.generateHearts();
          debouncedSocketEmit("heart");
        }
      } else {
        // Normal tap
        tapCount.current = 1;
        heartsRef.current.generateHearts();
        debouncedSocketEmit("heart");
      }

      animationFrameRef.current = null;
    });
  }, [debouncedSocketEmit]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (heartPressTimeout.current) {
        clearTimeout(heartPressTimeout.current);
      }
      if (socketThrottleTimeout.current) {
        clearTimeout(socketThrottleTimeout.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      isAnimating.current = false;
      tapCount.current = 0;
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ height }}>
      <FocusAwareStatusBar barStyle="light-content" backgroundColor="black" />
      <View style={{ height: height }}>
        <View className="h-full bg-black">
          {/* Agora Video Container */}
          <View className="absolute w-full h-full">
            {streamConfig && isVisible ? (
              <>
                <WebView
                  ref={webViewRef}
                  source={{
                    html: streamEngine(
                      streamConfig?.appId || "",
                      streamConfig?.channel || "",
                      streamConfig?.token || "",
                      streamConfig?.uid || "",
                    ),
                  }}
                  style={styles.fullScreen}
                  onMessage={handleWebViewMessage}
                  javaScriptEnabled={true}
                  allowsInlineMediaPlayback={true}
                  mediaPlaybackRequiresUserAction={false}
                  originWhitelist={["*"]}
                />

                {/* Gradient Overlay for better contrast */}
                <LinearGradient
                  colors={[
                    "rgba(0,0,0,0.1)", // Slight darkening at top
                    "rgba(0,0,0,0.45)", // Medium darkening in middle
                    "rgba(0,0,0,0.65)", // Darker toward bottom
                    "rgba(0,0,0,1)", // Darkest at bottom
                  ]}
                  locations={[0, 0.5, 0.85, 1]}
                  style={styles.gradientOverlay}
                  pointerEvents="none"
                />

                {/* Show play loader while video is loading, but not if we know there's no host */}
                {(isLoading ||
                  showNoHostAlert2 ||
                  (!isVideoPlaying && isHostPresent)) && (
                  <SkeletonLoader type="loading" />
                )}

                {/* No Host Alert */}
                {showNoHostAlert &&
                  !isLoading &&
                  !keyboardVisibleRef.current && (
                    <View style={styles.noHostOverlay}>
                      <View style={styles.noHostAlertContainer}>
                        <View style={styles.noHostIconContainer}>
                          <MaterialIcons
                            name="videocam-off"
                            size={36}
                            color="#FFFFFF"
                          />
                        </View>
                        <Text style={styles.noHostTitle}>Host Unavailable</Text>
                        <Text style={styles.noHostMessage}>
                          The host is not in the room at the moment. Please wait
                          or check back later.
                        </Text>
                        <View style={styles.buttonContainer}>
                          <TouchableOpacity
                            style={styles.waitButton}
                            onPress={() => setShowNoHostAlert(false)}
                          >
                            <Text style={styles.waitButtonText}>Wait</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.leaveButton}
                            onPress={() => {
                              const backButton = false;
                              handleLeaveStream(backButton);
                            }}
                          >
                            <Text style={styles.leaveButtonText}>Leave</Text>
                            {isLeavingStream && (
                              <ActivityIndicator
                                size={12}
                                color="white"
                                style={{ marginLeft: 5 }}
                              />
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  )}
              </>
            ) : (
              <SkeletonLoader type="loading" />
            )}
          </View>

          {/* Content Container */}
          <View style={styles.contentContainer}>
            {/* Top Actions */}
            {shouldShowUI && !keyboardVisibleRef.current && (
              <SafeAreaView style={{ marginTop: insets.top + 15 }}>
                <View className={`flex-row justify-between items-center px-4`}>
                  <View className="flex-row items-center gap-4 ">
                    <TouchableOpacity
                      className="flex-row items-center gap-2"
                      onPress={() => {
                        router.push({
                          pathname: "/sellerProfile",
                          params: {
                            sellerId: sellerId,
                            sellerAvatar: storeInfo?.avatar,
                          },
                        });
                      }}
                    >
                      <GlassImage
                        source={storeInfo?.avatar}
                        containerClassName="w-10 h-10 rounded-full"
                        imageClassName="w-full h-full rounded-full"
                        glassClassName="w-full h-full rounded-full"
                        placeholderColor="rgba(255, 255, 255, 0.1)"
                        blurIntensity={20}
                        tint="dark"
                        showActivityIndicator={false}
                      />
                      <View>
                        <Text className="text-white font-LexendDecaMedium text-base">
                          {storeInfo.name}
                        </Text>
                        <Text className="text-gray-300 text-xs">
                          {storeInfo.username}
                        </Text>
                      </View>
                    </TouchableOpacity>
                    {isFollowingLoading ? (
                      <TouchableOpacity
                        className="bg-[#16783A] h-full px-4 py-1 rounded-full"
                        disabled
                      >
                        <ActivityIndicator size={17} color="#FFFFFF" />
                      </TouchableOpacity>
                    ) : isFollowing ? (
                      <TouchableOpacity
                        className="bg-[#444444] h-full px-4 py-1 rounded-full"
                        onPress={() => handleUnfollowSeller(false)}
                      >
                        <Text className="text-white text-sm">Unfollow</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        className="bg-[#16783A] h-full px-4 py-1 rounded-full"
                        onPress={() => handleFollowSeller(false)}
                      >
                        <Text className="text-white text-sm">Follow</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <View className="flex-row items-center gap-2">
                    <TouchableOpacity
                      className="flex-row items-center px-3 py-2 rounded-full"
                      onPress={handleShowViewers}
                    >
                      <Octicons name="people" size={22} color="#FFF" />
                      <Text className="text-white ml-1 font-LexendDecaMedium ">
                        {viewerCount > 999
                          ? `${(viewerCount / 1000).toFixed(1)}K`
                          : viewerCount}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setShowMenuPopover(!showMenuPopover)}
                      className="p-2 rounded-full relative"
                    >
                      <Entypo
                        name="dots-three-horizontal"
                        size={22}
                        color="#FFF"
                      />
                    </TouchableOpacity>
                    {showMenuPopover && (
                      <View
                        style={{
                          position: "absolute",
                          right: 0,
                          top: 40,
                          backgroundColor: "rgba(0,0,0,0.2)",
                          borderRadius: 8,
                          paddingVertical: 8,
                          paddingHorizontal: 10,
                          width: 160,
                          shadowColor: "#000",
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.25,
                          shadowRadius: 3.84,
                          zIndex: 50,
                        }}
                      >
                        <TouchableOpacity
                          onPress={() => {
                            toggleMute();
                            setShowMenuPopover(false);
                          }}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            paddingVertical: 10,
                          }}
                        >
                          {isMuted ? (
                            <Ionicons
                              name="volume-mute-outline"
                              size={20}
                              color="#FFF"
                              style={{ marginRight: 10 }}
                            />
                          ) : (
                            <Ionicons
                              name="volume-medium-outline"
                              size={20}
                              color="#FFF"
                              style={{ marginRight: 10 }}
                            />
                          )}
                          <Text style={{ color: "#FFF", fontSize: 14 }}>
                            {isMuted ? "Unmute" : "Mute"}
                          </Text>
                        </TouchableOpacity>

                        <View
                          style={{
                            height: 1,
                            backgroundColor: "rgba(255,255,255,0.1)",
                            marginVertical: 5,
                          }}
                        />

                        <TouchableOpacity
                          onPress={() => {
                            if (!isLeavingStream) {
                              const backButton = false;
                              handleLeaveStream(backButton);
                            }
                          }}
                          disabled={isLeavingStream}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            paddingVertical: 10,
                          }}
                        >
                          {isLeavingStream ? (
                            <ActivityIndicator
                              size="small"
                              color="#FF5555"
                              style={{ marginRight: 10 }}
                            />
                          ) : (
                            <Ionicons
                              name="exit-outline"
                              size={20}
                              color="#FF5555"
                              style={{ marginRight: 10 }}
                            />
                          )}
                          <Text style={{ color: "#FF5555", fontSize: 14 }}>
                            {isLeavingStream ? "Leaving..." : "Leave"}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              </SafeAreaView>
            )}

            {/* Add the FloatingHeartsAnimation component */}
            <FloatingHeartsAnimation
              ref={heartsRef}
              count={15}
              color="#16783A"
            />

            <View
              style={{
                height: keyboardVisibleRef.current
                  ? "67%"
                  : height - (Platform.OS === "ios" ? insets.top + 25 : 25),
                justifyContent: "flex-end",
              }}
            >
              {/* Main Content Area */}

              <View
                style={[
                  styles.mainContentArea,
                  //{ height: keyboardVisibleRef.current ? "53%" : "69%"},
                ]}
              >
                {/* Right Side Actions */}
                {shouldShowUI && !keyboardVisibleRef.current && (
                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    style={styles.rightActionsContainer}
                    nestedScrollEnabled={true}
                    onTouchStart={(e) => {
                      // Prevent event from propagating to parent
                      e.stopPropagation();
                      // Notify parent to temporarily disable scrolling
                      onInteractionStart?.();
                    }}
                    onScrollBeginDrag={(e) => {
                      // Prevent scroll event from propagating to parent
                      e.stopPropagation();
                      // Notify parent to temporarily disable scrolling
                      onInteractionStart?.();
                    }}
                    scrollEventThrottle={16}
                    contentContainerStyle={{ paddingBottom: 20 }}
                  >
                    <View style={styles.actionItem}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={handleShare}
                      >
                        <SimpleLineIcons
                          name="share-alt"
                          size={22}
                          color="white"
                        />
                      </TouchableOpacity>
                      <Text style={styles.actionText}>Share</Text>
                    </View>

                    <View style={styles.actionItem}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={handleShowStreamInfo}
                      >
                        <Ionicons
                          name="information-circle-outline"
                          size={24}
                          color="white"
                        />
                      </TouchableOpacity>
                      <Text style={styles.actionText}>Info</Text>
                    </View>

                    <View style={styles.actionItem}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={handleShowOrders}
                      >
                        <MaterialCommunityIcons
                          name="package-variant-closed"
                          size={24}
                          color="white"
                        />
                      </TouchableOpacity>
                      <Text style={styles.actionText}>Orders</Text>
                    </View>

                    <View style={styles.actionItem}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={handleShowShop}
                      >
                        <MaterialCommunityIcons
                          name="storefront-outline"
                          size={24}
                          color="white"
                        />
                      </TouchableOpacity>
                      <Text style={styles.actionText}>Shop</Text>
                    </View>

                    {
                      <View style={styles.actionItem}>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={handleHeartPress}
                        >
                          <AntDesign name="hearto" size={24} color="#16783A" />
                        </TouchableOpacity>
                        <Text style={styles.actionText2}>Like</Text>
                      </View>
                    }
                  </ScrollView>
                )}

                {/* Live Comments Section */}
                {shouldShowUI && (
                  <ScrollView
                    ref={commentsListRef}
                    style={styles.commentsContainer}
                    nestedScrollEnabled={true}
                    onLayout={() => {
                      // Scroll to end on initial layout
                      if (commentsListRef.current && liveComments.length > 0) {
                        setTimeout(() => {
                          commentsListRef.current?.scrollToEnd({
                            animated: false,
                          });
                        }, 100);
                      }
                    }}
                    showsVerticalScrollIndicator={false}
                    fadingEdgeLength={350}
                    contentContainerStyle={styles.commentsList}
                    onContentSizeChange={() => {
                      // Scroll to end when content size changes
                      if (commentsListRef.current && liveComments.length > 0) {
                        setTimeout(() => {
                          commentsListRef.current?.scrollToEnd({
                            animated: false,
                          });
                        }, 100);
                      }
                    }}
                    maintainVisibleContentPosition={{
                      minIndexForVisible: 0,
                      autoscrollToTopThreshold: 10,
                    }}
                    removeClippedSubviews={false}
                  >
                    {liveComments?.map((item: any, index: number) => (
                      <View key={index}>{renderCommentItem({ item })}</View>
                    ))}
                  </ScrollView>
                )}
              </View>

              {/* Bottom Area */}
              <View style={styles.bottomArea}>
                {/* Comment Input */}
                {shouldShowUI && (
                  <View style={styles.commentInputContainer}>
                    <View style={styles.inputWithButtonContainer}>
                      <TextInput
                        style={styles.commentInput}
                        placeholder="Say something..."
                        placeholderTextColor="#999"
                        value={commentInput}
                        onChangeText={setCommentInput}
                        returnKeyType="send"
                        onSubmitEditing={handleSendComment}
                      />
                      <TouchableOpacity
                        style={styles.sendButton}
                        onPress={handleSendComment}
                        disabled={!commentInput.trim()}
                      >
                        <Ionicons
                          name="send"
                          size={22}
                          color={commentInput.trim() ? "#16783A" : "#666"}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Bottom Product Card */}
                {shouldShowUI &&
                  streamProducts.length > 0 &&
                  !keyboardVisibleRef.current && (
                    <View style={styles.bottomProductCardContainer}>
                      <CustomCarousel
                        loop={false}
                        autoPlay={false}
                        width={screenWidth - 32}
                        height={110}
                        data={streamProducts}
                        scrollAnimationDuration={500}
                        showPagination={false}
                        onSnapToItem={(index) => setCurrentProductIndex(index)}
                        renderItem={({ item, index }) => (
                          <LiveShowProductCard
                            item={item}
                            index={index}
                            onBuyNow={handleBuyNow}
                            onPreview={handleProductPreview}
                          />
                        )}
                        defaultIndex={currentProductIndex}
                      />
                    </View>
                  )}
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Bottom Sheets */}
      <BottomSheet
        bgColor="#121212"
        childrenStyle="!px-[11px]"
        showCloseIcon={false}
        title=""
        show={showProductPreview}
        snapPoints={["70%"]}
        titleColor="!text-white"
        onRequestClose={() => setShowProductPreview(false)}
        keyboardBehavior="interactive"
      >
        {selectedProduct && (
          <ProductPreview
            product={selectedProduct}
            closeSheet={() => setShowProductPreview(false)}
          />
        )}
      </BottomSheet>

      <BottomSheet
        bgColor="#121212"
        childrenStyle="!px-[11px]"
        showCloseIcon={false}
        title=""
        show={showCheckout}
        snapPoints={["70%"]}
        titleColor="!text-white"
        onRequestClose={() => setShowCheckout(false)}
        keyboardBehavior="interactive"
      >
        {selectedProduct && (
          <CheckoutNow
            productId={selectedProduct?.productId}
            closeSheet={handleCloseCheckout}
            sellerId={
              (selectedProduct.seller as any)?._id ||
              activeStreamDetails?.stream?.seller?._id ||
              ""
            }
            streamId={activeStreamDetails?.stream?._id}
            channel="liveshow"
          />
        )}
      </BottomSheet>

      {/* Viewers Bottom Sheet */}
      <BottomSheet
        bgColor="#121212"
        childrenStyle="!px-0"
        showCloseIcon={false}
        title=""
        show={showViewers}
        snapPoints={["40%"]}
        titleColor="!text-white"
        onRequestClose={() => setShowViewers(false)}
        keyboardBehavior="interactive"
      >
        <StreamViewers
          viewers={detailedViewers}
          hostInfo={{
            name: storeInfo.name,
            avatar: storeInfo.avatar,
          }}
          closeSheet={() => setShowViewers(false)}
        />
      </BottomSheet>

      {/* Add StreamInfo Bottom Sheet */}
      <BottomSheet
        bgColor="#121212"
        childrenStyle="!px-0"
        showCloseIcon={false}
        title=""
        show={showStreamInfo}
        snapPoints={["100%"]}
        titleColor="!text-white"
        onRequestClose={() => setShowStreamInfo(false)}
        keyboardBehavior="interactive"
        //enableContentPanningGesture={true}
      >
        <StreamInfo
          storeInfo={{
            ...storeInfo,
            following: isFollowing,
          }}
          streamInfo={streamDetails}
          isLoading={isLoading}
          closeSheet={() => setShowStreamInfo(false)}
          sellerId={sellerId}
          isFollowing={isFollowing}
          isFollowingLoading={isFollowingLoading2}
          onFollow={() => handleFollowSeller(true)}
          onUnfollow={() => handleUnfollowSeller(true)}
        />
      </BottomSheet>

      {/* Orders Bottom Sheet */}
      <BottomSheet
        bgColor="#121212"
        childrenStyle="!px-0"
        showCloseIcon={false}
        title=""
        show={showOrders}
        snapPoints={["70%"]}
        titleColor="!text-white"
        onRequestClose={() => setShowOrders(false)}
        keyboardBehavior="interactive"
      >
        <StreamOrders streamId={id} closeSheet={() => setShowOrders(false)} />
      </BottomSheet>

      {/* Shop Bottom Sheet */}
      <BottomSheet
        bgColor="#121212"
        childrenStyle="!px-0"
        showCloseIcon={false}
        title=""
        show={showShop}
        snapPoints={["70%"]}
        titleColor="!text-white"
        onRequestClose={() => setShowShop(false)}
        keyboardBehavior="interactive"
      >
        <ShopBottomSheet
          sellerId={sellerId}
          streamProducts={streamProducts}
          closeSheet={() => setShowShop(false)}
        />
      </BottomSheet>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    width: "100%",
    height: "100%",
    position: "absolute",
    backgroundColor: "#000",
  },
  gradientOverlay: {
    position: "absolute",
    width: "100%",
    height: "100%",
    zIndex: 5,
  },
  fullScreen2: {
    flex: 1,
    width: "100%",
    height: "100%",
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
  },
  statusText: {
    color: "#fff",
    marginTop: 10,
  },
  contentContainer: {
    height: height,
    position: "relative",
  },
  mainContentArea: {
    position: "relative",
  },
  bottomArea: {
    position: "relative",
    paddingBottom: Platform.OS === "ios" ? 20 : 10,
    zIndex: 15,
  },
  bottomProductCardContainer: {
    position: "relative",
    paddingHorizontal: 16,
    //marginTop: 10,
  },
  commentInputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    zIndex: 10,
  },
  rightActionsContainer: {
    position: "absolute",
    right: 13,
    bottom: 0,
    maxHeight: 300,
    zIndex: 10,
  },
  commentsContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: "70%",
    maxHeight: 250,
    zIndex: 10,
  },
  commentsList: {
    paddingHorizontal: 8,
    paddingTop: 10,
    paddingBottom: 0,
    width: "100%",
  },
  commentAvatar: {
    width: 35,
    height: 35,
    borderRadius: 35,
    marginRight: 8,
  },
  commentUser: {
    color: "#fff",
    fontSize: 14,
    marginBottom: 2,
  },
  joinCommentItem: {
    flexDirection: "row",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 0,
    maxWidth: "100%",
    alignSelf: "flex-start",
    flex: 1,
  },
  joinCommentContent: {
    flexDirection: "column",
    flex: 1,
  },
  joinCommentText: {
    color: "#FFEB3B", // Yellow text for "joined the stream"
    fontSize: 12,
    fontFamily: "LexendDeca",
    fontWeight: "bold",
    flexWrap: "wrap",
  },
  purchaseCommentItem: {
    flexDirection: "row",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 0,
    maxWidth: "100%",
    alignSelf: "flex-start",
    flex: 1,
  },
  purchaseCommentContent: {
    flexDirection: "column",
    flex: 1,
  },
  purchaseCommentText: {
    color: "#16783A",
    fontSize: 12,
    fontWeight: "bold",
    flexWrap: "wrap",
  },
  regularCommentItem: {
    flexDirection: "row",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 0,
    maxWidth: "100%",
    alignSelf: "flex-start",
    flex: 1,
  },
  regularCommentContent: {
    flexDirection: "column",
    flex: 1,
  },
  regularCommentText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
    flexWrap: "wrap",
  },
  commentInput: {
    color: "#fff",
    borderWidth: 0,
    paddingVertical: 15,
    paddingHorizontal: 15,
    fontSize: 14,
    flex: 1,
    backgroundColor: "transparent",
  },
  inputWithButtonContainer: {
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ffffff",
    borderRadius: 30,
    backgroundColor: "rgba(50, 50, 50, 0.2)",
  },
  sendButton: {
    padding: 12,
    marginRight: 5,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  playButtonOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  playButtonContainer: {
    backgroundColor: "#000000",
    borderRadius: 50,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  playButton: {
    opacity: 0.9,
  },
  actionItem: {
    alignItems: "center",
    marginBottom: 0,
  },
  actionButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  actionText: {
    color: "white",
    fontSize: 12,
    marginTop: 2,
  },
  actionText2: {
    color: "#16783A",
    fontSize: 12,
    marginTop: 4,
  },
  currentUserJoinItem: {
    backgroundColor: "rgba(22, 120, 58, 0.2)", // Light green background for current user
  },
  currentUserText: {
    color: "#16783A", // Green text for current user
    fontWeight: "bold",
  },
  auctionProductCardContainer: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  disclaimerContainer: {
    marginHorizontal: 16,
    marginTop: 88,
    marginBottom: 15,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3.84,
    elevation: 5,
    position: "relative",
  },
  disclaimerLeftAccent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: "#16783A",
  },
  disclaimerContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    paddingVertical: 16,
    backgroundColor: "rgba(25, 25, 25, 0.95)",
  },
  disclaimerIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#16783A",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  disclaimerTextContainer: {
    flex: 1,
  },
  disclaimerTitle: {
    color: "#FFCC00",
    fontWeight: "bold",
    fontSize: 15,
    marginBottom: 3,
  },
  disclaimerText: {
    color: "#FFFFFF",
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.9,
  },
  hostLeftCommentItem: {
    flexDirection: "row",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 0,
    maxWidth: "100%",
    alignSelf: "flex-start",
    flex: 1,
  },
  hostLeftCommentContent: {
    flexDirection: "column",
    flex: 1,
  },
  hostLeftCommentText: {
    color: "#ff5555", // Yellow text for "left room"
    fontSize: 12,
    fontFamily: "LexendDeca",
    fontWeight: "bold",
    flexWrap: "wrap",
  },
  hostRejoinedCommentItem: {
    flexDirection: "row",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 0,
    maxWidth: "100%",
    alignSelf: "flex-start",
    flex: 1,
  },
  hostRejoinedCommentContent: {
    flexDirection: "column",
    flex: 1,
  },
  hostRejoinedCommentText: {
    color: "#16783A", // Green text for "rejoined room"
    fontSize: 12,
    fontFamily: "LexendDeca",
    fontWeight: "bold",
    flexWrap: "wrap",
  },
  leaveCommentItem: {
    flexDirection: "row",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 0,
    maxWidth: "100%",
    alignSelf: "flex-start",
    flex: 1,
  },
  leaveCommentContent: {
    flexDirection: "column",
    flex: 1,
  },
  leaveCommentText: {
    color: "#ff5555", // Yellow text for "left room"
    fontSize: 12,
    fontFamily: "LexendDeca",
    fontWeight: "bold",
    flexWrap: "wrap",
  },
  noHostOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 20,
  },
  noHostAlertContainer: {
    backgroundColor: "#111111",
    borderRadius: 12,
    padding: 20,
    width: "80%",
    maxWidth: 300,
    alignItems: "center",
  },
  noHostIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#333333",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  noHostTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  noHostMessage: {
    color: "#CCCCCC",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  waitButton: {
    backgroundColor: "#333333",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginRight: 10,
    flex: 1,
    alignItems: "center",
  },
  waitButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  leaveButton: {
    backgroundColor: "#FF3B30",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flex: 1,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  leaveButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  liveshowOrderCommentItem: {
    flexDirection: "row",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginVertical: 8,
    maxWidth: "100%",
    alignSelf: "flex-start",
    flex: 1,
    backgroundColor: "rgba(160, 32, 240, 0.2)",
  },
  liveshowOrderCommentContent: {
    flexDirection: "column",
    flex: 1,
  },
  liveshowCommentUser: {
    color: "#A020F0",
    fontWeight: "bold",
  },
  liveshowOrderCommentText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "LexendDeca",
    fontWeight: "semibold",
    flexWrap: "wrap",
  },
});

export default LivestreamStudioFeed;
