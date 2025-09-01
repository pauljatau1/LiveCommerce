import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  StyleSheet,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Animated,
  Platform,
  Keyboard,
  ScrollView,
  Alert,
  BackHandler,
} from "react-native";
import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
  memo,
} from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useLivestream } from "@/contexts/livestreamContext";
import { WebView } from "react-native-webview";
import {
  AntDesign,
  Feather,
  MaterialIcons,
  Ionicons,
  Octicons,
  FontAwesome,
  Entypo,
  MaterialCommunityIcons,
  SimpleLineIcons,
} from "@expo/vector-icons";
import { FocusAwareStatusBar } from "@/components/ui/focus-aware-status-bar";
import BottomSheet from "@/components/global/bottom-sheet";
import { ActivityIndicator } from "react-native";
// Replace the original import
// import Carousel from "react-native-reanimated-carousel";
import CustomCarousel from "@/components/livestream/CustomCarousel";
import { getToken, getUser } from "@/store/features/auth/utils";
import axios from "axios";
import moment from "moment";
import { timeFromNow } from "@/helpers/helpers";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import {
  StreamConfig,
  ProductImage,
  Product,
  StreamProduct,
  StreamDetails,
  LivestreamContextType,
} from "@/types/streams/livestreamStudio";
import { streamEngine } from "./streamEngine";
import { LiveShowProductCard } from "./liveShowProductCard";
import {
  initializeSocket,
  disconnectSocket,
  getSocket,
  StreamNotification,
  BidTimerUpdate,
  BidTimerComplete,
  AuctionOrderCreated,
} from "./socketHandler";
import { SOCKET_EVENTS } from "@/constants/api";
import { LinearGradient } from "expo-linear-gradient";
import { useToast } from "@/contexts/ToastContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import ProductPreview from "@/components/blips/productPreview";
import CheckoutNow from "@/components/blips/checkoutNow";
import LiveAuctionProductCard from "./liveAuctionProductCard";
import BidVariationSelector from "@/app/(root)/livestream/bidVariationSelector";
import StreamViewers from "./streamViewers";
import StreamInfo from "./StreamInfo";
import StreamOrders from "./streamOrders";
import BidErrorMessage from "./BidErrorMessage";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import OrderCreatedNotification from "./OrderCreatedNotification";
import { FloatingHeartsAnimation } from "./components/FloatingHeartsAnimation";
import type { FloatingHeartsRef } from "./components/FloatingHeartsAnimation";
import AuctionShopBottomSheet from "./auctionShopBottomSheet";
import GlassImage from "./components/GlassImage";
// Import the AuctionSkeletonLoader component
import { SkeletonLoader } from "./components/SkeletonLoader";
import { useShareAppLinks } from "@/hooks/useShareAppLinks";
import StreamEndedAlert from "./components/StreamEndedAlert";
import RsvpSheet from "@/components/livestream/rsvpSheet";
// Add import for AnnouncementView component
import AnnouncementView from "@/components/livestream/AnnouncementView";

// Extract dimensions outside component to avoid recreation on each render
const { width, height } = Dimensions.get("screen");

// Extend the StreamNotification type to include isCurrentUser property
interface ExtendedStreamNotificationData {
  isCurrentUser?: boolean;
  isHost?: boolean;
  message?: string;
  sellerId?: string;
  sellerName?: string;
  buyerId?: string;
  buyerName?: string;
  buyerUsername?: string;
  buyerAvatar?: string;
  viewerCount?: number;
  isError?: boolean;
  streamId?: string;
  productId?: string;
  productName?: string;
  bidAmount?: number;
  product?: any;
  currentBidder?: any;
  bidWinner?: any;
  viewers?: any[];
}

interface CommentItemProps {
  item: {
    type: string;
    user: string;
    content: string;
    data?: ExtendedStreamNotificationData;
    [key: string]: any;
  };
  renderAvatar: () => React.ReactNode;
  styles: any;
}

interface ActionButtonProps {
  icon: React.ReactNode;
  text: string;
  onPress: () => void;
  textStyle?: any;
}

// Create reusable styled components for better performance
const CommentItem = memo(({ item, renderAvatar, styles }: CommentItemProps) => {
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
  } else if (item.type === "auction_start") {
    return (
      <View style={styles.auctionStartCommentItem}>
        {renderAvatar()}
        <View style={styles.auctionStartCommentContent}>
          <Text style={styles.auctionCommentUser}>{item.user}</Text>
          <Text style={styles.auctionStartCommentText}>{item.content}</Text>
        </View>
      </View>
    );
  } else {
    const isHost = item.data?.isHost === true;
    return (
      <View style={styles.regularCommentItem}>
        {renderAvatar()}
        <View style={styles.regularCommentContent}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 2,
            }}
          >
            <Text style={styles.commentUser}>{item.user}</Text>
            {isHost && (
              <View
                style={{
                  marginLeft: 8,
                  backgroundColor: "#16783A",
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 4,
                }}
              >
                <Text
                  style={{ color: "#FFFFFF", fontSize: 10, fontWeight: "bold" }}
                >
                  Host
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.regularCommentText}>{item.content}</Text>
        </View>
      </View>
    );
  }
});

// Create reusable styled components for better performance
const ActionButton = memo(
  ({ icon, text, onPress, textStyle }: ActionButtonProps) => (
    <View style={styles.actionItem}>
      <TouchableOpacity style={styles.actionButton} onPress={onPress}>
        {icon}
      </TouchableOpacity>
      <Text style={textStyle || styles.actionText}>{text}</Text>
    </View>
  ),
);

// Extract helper functions outside component for better performance
const getInitials = (firstName?: string, lastName?: string): string => {
  let initials = "";
  if (firstName && firstName.length > 0) {
    initials += firstName[0].toUpperCase();
  }
  if (lastName && lastName.length > 0) {
    initials += lastName[0].toUpperCase();
  }
  return initials || "?";
};

// Generate a consistent color based on the username
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

// Format price correctly for Naira (₦)
const formatPrice = (price: number) => {
  // The price is already in Naira, not cents
  return `₦${price.toLocaleString("en-NG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

// Create a memo-wrapped component for LiveAuctionStudio
const LiveAuctionStudio = memo(
  ({
    id,
    isVisible,
    onInteractionStart,
    shared,
    onRegisterCleanup,
  }: {
    id: any;
    isVisible: boolean;
    onInteractionStart?: () => void;
    shared: boolean;
    onRegisterCleanup?: (cleanupFn: () => Promise<void>) => void;
  }) => {
    // These are all the declaration that should be early in the component
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { show } = useToast();
    const {
      activeStreamDetails,
      joinStream,
      fetchActiveStreamDetails,
      leaveStream,
      followSellerThroughStream,
      unfollowSellerThroughStream,
      checkIfSellerIsFollowedFromSellerProfile,
      isStreamEnded,
      isStreamScheduled,
      scheduledStreamDetails,
    } = useLivestream() as LivestreamContextType;

    // Initialize all state
    const [streamConfig, setStreamConfig] = useState<any>(null);
    const [streamData, setStreamData] = useState<any>(null);
    const [currentProduct, setCurrentProduct] = useState<any>(null);
    const [isVideoReady, setIsVideoReady] = useState(false);
    const [showProducts, setShowProducts] = useState(false);
    const [showViewers, setShowViewers] = useState(false);
    const [showStreamInfo, setShowStreamInfo] = useState(false);
    const [showOrders, setShowOrders] = useState(false);
    const [showShop, setShowShop] = useState(false);
    const [status, setStatus] = useState("Initializing...");
    const [isLoading, setIsLoading] = useState(true);
    const [isFollowingLoading, setIsFollowingLoading] = useState(false);
    const [isFollowingLoading2, setIsFollowingLoading2] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [sellerId, setSellerId] = useState<string>("");

    // Add state for stream ended alert
    // const [showStreamEndedAlert, setShowStreamEndedAlert] = useState(false);

    // UI interaction states
    const [likes, setLikes] = useState(23500);
    const [liked, setLiked] = useState(false);
    const [comments, setComments] = useState(1200);
    const [showComments, setShowComments] = useState(false);
    const [comment, setComment] = useState("");
    const [streamProducts, setStreamProducts] = useState<StreamProduct[]>([]);
    const [currentProductIndex, setCurrentProductIndex] = useState(0);
    const [activeAuctionProduct, setActiveAuctionProduct] = useState<any>(null);
    const [storeInfo, setStoreInfo] = useState({
      name: "Store Name",
      username: "@username",
      avatar: require("@/assets/icons/animoji.png"),
    });
    const [viewerCount, setViewerCount] = useState<number>(0);
    const [isMuted, setIsMuted] = useState<boolean>(false);

    // Bottom sheet state for product preview and checkout
    const [showProductPreview, setShowProductPreview] = useState(false);
    const [showCheckout, setShowCheckout] = useState(false);
    const [showBidVariation, setShowBidVariation] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(
      null,
    );
    const [selectedBidProduct, setSelectedBidProduct] =
      useState<StreamProduct | null>(null);
    const [bidAmount, setBidAmount] = useState<number | null>(null);
    const [selectedBidIncrement, setSelectedBidIncrement] =
      useState<number>(500);

    // Array of live comments
    const [liveComments, setLiveComments] = useState<StreamNotification[]>([]);
    const [commentInput, setCommentInput] = useState("");
    const commentsListRef = useRef<ScrollView>(null);
    // Add a new state to track if video is actually playing
    const [isVideoPlaying, setIsVideoPlaying] = useState(false);
    // Replace standard state with refs for instant updates
    const keyboardHeightRef = useRef(0);
    const keyboardVisibleRef = useRef(false);
    const [, forceUpdate] = useState({});
    const { width: screenWidth } = Dimensions.get("window");

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
      type: "auction",
      sellerFollowers: 0,
    });

    // Add state for leave stream loading
    const [isLeavingStream, setIsLeavingStream] = useState(false);

    // Add state for the current bid winner info
    const [currentBidWinner, setCurrentBidWinner] = useState<{
      username: string;
      avatar?: string;
      initials?: string;
      bidAmount?: number;
      isWinner: boolean;
    } | null>(null);

    // Add state for bid error bottom sheet
    const [showBidError, setShowBidError] = useState(false);
    const [bidErrorMessage, setBidErrorMessage] = useState("");
    const [isBidSending, setIsBidSending] = useState(false);

    // Add new state variables for timer
    const [bidTimerData, setBidTimerData] = useState<{ [key: string]: string }>(
      {},
    );
    const [activeOrderCreated, setActiveOrderCreated] =
      useState<AuctionOrderCreated | null>(null);
    const [showOrderCreatedNotification, setShowOrderCreatedNotification] =
      useState(false);

    // Add new state for detailed viewers
    const [detailedViewers, setDetailedViewers] = useState<any[]>([]);

    // Add state for host presence
    const [isHostPresent, setIsHostPresent] = useState(true);
    const [showNoHostAlert, setShowNoHostAlert] = useState(false);
    const [showNoHostAlert2, setShowNoHostAlert2] = useState(false);
    const [rsvpSheet, showRsvpSheet] = useState<boolean>(isStreamScheduled);

    // Add state for announcements
    const [liveAnnouncements, setLiveAnnouncements] = useState<
      Array<{
        id: string;
        type: "announcement";
        user: string;
        avatar?: any;
        content: string;
        timestamp: Date;
        data?: any;
      }>
    >([]);

    // Add state for announcement bottom sheet
    const [showAnnouncementSheet, setShowAnnouncementSheet] = useState(false);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<any>(null);

    // Add ref for heart animation
    const heartsRef = useRef<FloatingHeartsRef>(null);

    const { displayShareDialog } = useShareAppLinks();

    // Initialize all refs
    const webViewRef = useRef<WebView>(null);
    const tapCount = useRef(0);
    const lastTapTime = useRef(0);
    const isAnimating = useRef(false);
    const heartPressTimeout = useRef<NodeJS.Timeout | null>(null);
    const socketThrottleTimeout = useRef<NodeJS.Timeout | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    // Constants
    const TAP_THRESHOLD = 150;

    // Memoize the shared link URL
    const shareLinkUrl = useMemo(
      () =>
        `https://app.auqli.live/livestream/feed?id=${id}&type=${activeStreamDetails?.stream?.type}&itmSource=share`,
      [id, activeStreamDetails],
    );

    // Update detailedViewers when activeStreamDetails changes
    useEffect(() => {
      if (activeStreamDetails?.stream?.viewers) {
        setDetailedViewers(activeStreamDetails.stream.viewers);
        //console.log('Initialized detailedViewers with:', activeStreamDetails.stream.viewers);
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

        // Cleanup will be handled proactively by the parent component
        // when scrolling away, so we only need to handle unmounting here
        return () => {
          // Only cleanup if component is unmounting completely (not just scrolling away)
          // The parent will handle scrolling cleanup proactively
          console.log(
            `🔧 [Auction] Component unmounting cleanup for stream ${id}`,
          );
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
          if (showShop || showCheckout) {
            return;
          }
          // Force immediate re-render
          forceUpdate({});
        },
      );

      const keyboardWillHide = Keyboard.addListener(
        Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
        (e) => {
          keyboardVisibleRef.current = false;
          keyboardHeightRef.current = 0;
          if (showShop || showCheckout) {
            return;
          }
          // Force immediate re-render
          forceUpdate({});
        },
      );

      // Cleanup keyboard listeners
      return () => {
        keyboardWillShow.remove();
        keyboardWillHide.remove();
      };
    }, [showShop, showCheckout]); // Empty dependency array since we don't need any dependencies for keyboard events

    //console.log('keyboardHeightRef', keyboardHeightRef.current);
    //console.log('keyboardVisibleRef', keyboardVisibleRef.current);

    // Handle Android back button press
    {
      /*useEffect(() => {
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

    // Define timer update, bid completion, etc. handlers first
    const handleBidTimerUpdate = useCallback(
      (data: BidTimerUpdate) => {
        // Convert format from "00.11" to "00:11" by replacing the period with a colon
        const formattedTime = data.formattedTime.replace(".", ":");

        // Store the timer data using productId as key with the converted format
        setBidTimerData((prev) => ({
          ...prev,
          [data.productId]: formattedTime,
        }));

        // Update streamProducts to ensure bidStatus is 'active' for this product
        setStreamProducts((prev) => {
          return prev.map((product) => {
            // Check if product ID matches using only productId property
            if (
              product.product.productId &&
              product.product.productId.toString() === data.productId
            ) {
              // Only update if status isn't already active to avoid unnecessary rerenders
              if (product.bidStatus !== "active") {
                return {
                  ...product,
                  bidStatus: "active",
                };
              }
            }
            return product;
          });
        });
      },
      [setBidTimerData, setStreamProducts],
    );

    const handleBidTimerComplete = useCallback(
      (data: BidTimerComplete) => {
        // Clear timer data for this product
        setBidTimerData((prev) => {
          const newData = { ...prev };
          delete newData[data.productId];
          return newData;
        });

        // Update product status to 'ongoing' while waiting for winner determination
        setStreamProducts((prev) => {
          return prev.map((product) => {
            // Check if product ID matches using only productId property
            if (
              product.product.productId &&
              product.product.productId.toString() === data.productId
            ) {
              return {
                ...product,
                bidStatus: "ongoing",
              };
            }
            return product;
          });
        });
      },
      [setBidTimerData, setStreamProducts],
    );

    const handleAuctionOrderCreated = useCallback(
      (data: AuctionOrderCreated) => {
        // Store the order data
        setActiveOrderCreated(data);

        // Show notification
        setShowOrderCreatedNotification(true);

        // Get first 3 words of product name
        const truncatedName = data.productName.split(" ").slice(0, 3).join(" ");

        // You can also show a toast notification
        show({
          text1: "Order Created",
          text2: `Your order for ${truncatedName}... has been created`,
          type: "success",
          duration: 5000,
          topPosition: 18,
        });
      },
      [show, setActiveOrderCreated, setShowOrderCreatedNotification],
    );

    // Define stream notification handler
    const handleStreamNotification = useCallback(
      (notification: StreamNotification) => {
        // Process notification based on type
        switch (notification.type) {
          case "join": {
            // Update UI to show join event
            setLiveComments((prev) => [...prev, notification]);

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
                      (viewer &&
                        viewer._id &&
                        viewer._id.toString() === buyerId.toString()) ||
                      viewer.firstName ===
                        notification?.data?.buyerName?.split(" ")[0] ||
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
            }
            break;
          }

          case "comment": {
            // Check if this is an error notification from bid_error event
            if (notification.data?.isError) {
              // Use the message field directly if available, otherwise extract from content
              const errorMessage =
                notification.data.message ||
                notification.content.replace("Bid error: ", "");
              setBidErrorMessage(errorMessage);
              setShowBidError(true);
            }
            // Update UI to show comment
            setLiveComments((prev) => [...prev, notification]);
            // Increment comment count
            setComments((prev) => prev + 1);
            break;
          }

          case "purchase":
          case "hostLeft":
          case "hostRejoin": {
            // Update UI to show event
            setLiveComments((prev) => [...prev, notification]);
            break;
          }

          case "leave": {
            // Update UI to show leave event
            setLiveComments((prev) => [...prev, notification]);
            // Update viewer count if available in notification data
            if (notification.data) {
              if ("viewerCount" in notification.data) {
                setViewerCount(notification.data.viewerCount as number);
              }

              // Remove viewer from detailedViewers array
              if ("buyerId" in notification.data && notification.data.buyerId) {
                const buyerId = notification.data.buyerId;
                setDetailedViewers((prev) =>
                  prev.filter((viewer) => viewer._id !== buyerId),
                );
              }
            }
            break;
          }

          case "announcement": {
            console.log("Announcement received:", notification.content);
            // Add announcement to the announcements array instead of liveComments
            setLiveAnnouncements((prev: Array<any>) => [
              ...prev,
              notification as any,
            ]);
            break;
          }

          case "auction_start": {
            console.log("Auction started for product:", notification);
            // Update UI to show auction start event
            setLiveComments((prev) => [...prev, notification]);

            // Update the active auction product from the notification data
            if (notification.data && notification.data.product) {
              setActiveAuctionProduct(notification.data.product);

              // Find the product in streamProducts and update it
              const productId = notification.data.product.product?.productId;
              console.log("realtime bid productId:", productId);

              if (productId) {
                setStreamProducts((prevProducts) => {
                  // Find the index of the product in the current streamProducts array
                  const productIndex = prevProducts.findIndex(
                    (p) => p.product.productId === productId,
                  );
                  console.log("realtime bid productIndex:", productIndex);

                  // If product found, set it as the current product
                  if (productIndex !== -1) {
                    setCurrentProductIndex(productIndex);
                    console.log(
                      "Setting current product index to:",
                      productIndex,
                    );

                    // IMPORTANT: Also update the selectedBidProduct to prevent race condition
                    // when user clicks bid before the UI fully updates
                    setTimeout(() => {
                      const updatedProduct = {
                        ...prevProducts[productIndex],
                        bidStatus: "active" as const,
                        currentBid: notification.data?.product.currentBid,
                        minBid: notification.data?.product.minBid,
                        maxBid: notification.data?.product.maxBid,
                      };
                      setSelectedBidProduct(updatedProduct);
                    }, 0);
                  }

                  // Update the product status to active
                  return prevProducts.map((p) => {
                    if (p.product.productId === productId) {
                      return {
                        ...p,
                        bidStatus: "active",
                        currentBid: notification.data?.product.currentBid,
                        minBid: notification.data?.product.minBid,
                        maxBid: notification.data?.product.maxBid,
                      };
                    }
                    // Mark other products as 'ended' if they were 'active'
                    if (p.bidStatus === "active" || p.bidStatus === "ongoing") {
                      return {
                        ...p,
                        bidStatus: "ended",
                      };
                    }
                    return p;
                  });
                });
              }

              // Clear any previous bid winner and selected product
              setCurrentBidWinner(null);
            }
            break;
          }

          case "new_bid": {
            // Update UI to show new bid event
            setLiveComments((prev) => [...prev, notification]);

            // Update the product with new bid amount
            if (notification.data && notification.data.product) {
              // Find the product in streamProducts and update it
              const productId = notification.data.product.product?.productId;

              if (productId) {
                setStreamProducts((prevProducts) => {
                  // Update the product
                  return prevProducts.map((p) => {
                    if (p.product.productId === productId) {
                      return {
                        ...p,
                        currentBid: notification.data?.product.currentBid,
                        // Keep other product properties intact
                      };
                    }
                    return p;
                  });
                });
              }

              // Update the winning notification with the current bidder
              if (notification.data.currentBidder) {
                const bidder = notification.data.currentBidder;
                const username =
                  bidder.username ||
                  `${bidder.firstName} ${bidder.lastName}`.trim();
                const avatar = bidder.profileImage?.url || undefined;
                const initials = getInitials(bidder.firstName, bidder.lastName);

                setCurrentBidWinner({
                  username,
                  avatar,
                  initials,
                  bidAmount: notification.data.bidAmount,
                  isWinner: false, // This is just a bid, not a winner yet
                });
              }
            }
            break;
          }

          case "auction_winner": {
            // Update UI to show auction winner event
            setLiveComments((prev) => [...prev, notification]);

            // Update the product with the winner and mark as ongoing
            if (notification.data && notification.data.product) {
              // Find the product in streamProducts and update it
              const productId = notification.data.product.product?.productId;

              if (productId) {
                setStreamProducts((prevProducts) => {
                  // Update the product status to ongoing
                  return prevProducts.map((p) => {
                    if (p.product.productId === productId) {
                      return {
                        ...p,
                        bidStatus: "ongoing",
                        currentBid: notification.data?.product.currentBid,
                        // Keep other product properties intact
                      };
                    }
                    return p;
                  });
                });
              }

              // Update the winning notification with the winner
              if (
                notification.data.bidWinner &&
                notification.data.bidWinner.buyer
              ) {
                const winner = notification.data.bidWinner.buyer;
                const username =
                  winner.username ||
                  `${winner.firstName} ${winner.lastName}`.trim();
                const avatar = winner.profileImage?.url || undefined;
                const initials = getInitials(winner.firstName, winner.lastName);

                setCurrentBidWinner({
                  username,
                  avatar,
                  initials,
                  bidAmount: notification.data.bidWinner.bidAmount,
                  isWinner: true, // This is a winner
                });
              }
            }
            break;
          }

          case "auction_end": {
            // Update UI to show auction end event
            setLiveComments((prev) => [...prev, notification]);

            // Update the product status in streamProducts
            if (notification.data && notification.data.product) {
              const productId = notification.data.product.product?.productId;

              if (productId) {
                setStreamProducts((prevProducts) => {
                  return prevProducts.map((p) => {
                    if (p.product.productId === productId) {
                      return {
                        ...p,
                        bidStatus: "ongoing",
                      };
                    }
                    return p;
                  });
                });
              }
            }
            break;
          }

          default: {
            // Add to comments for display
            setLiveComments((prev) => [...prev, notification]);
            break;
          }
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
      [
        detailedViewers,
        setLiveComments,
        setViewerCount,
        setDetailedViewers,
        setBidErrorMessage,
        setShowBidError,
        setComments,
        setActiveAuctionProduct,
        setStreamProducts,
        setCurrentProductIndex,
        setSelectedBidProduct,
        setCurrentBidWinner,
        commentsListRef,
        getInitials,
        setLiveAnnouncements,
      ],
    );

    // Optimize WebView message handler with useCallback
    const handleWebViewMessage = useCallback(
      (event: { nativeEvent: { data: string } }) => {
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
        } else if (
          message === "host_left_video" ||
          message === "all_hosts_left"
        ) {
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
          //console.log('Audio muted successfully');
        } else if (message === "all_audio_unmuted") {
          //console.log('Audio unmuted successfully');
        } else if (
          message.startsWith("audio_muted:") ||
          message.startsWith("audio_unmuted:")
        ) {
          //console.log(message);
        } else if (message === "leaving_channel_start") {
          console.log("Starting channel cleanup process");
          setStatus("Leaving stream...");
        } else if (message.startsWith("stopped_video_track:")) {
          console.log("Stopped video track:", message);
        } else if (message.startsWith("stopped_audio_track:")) {
          console.log("Stopped audio track:", message);
        } else if (message.startsWith("unsubscribed_video:")) {
          console.log("Unsubscribed from video:", message);
        } else if (message.startsWith("unsubscribed_audio:")) {
          console.log("Unsubscribed from audio:", message);
        } else if (message === "cleanup_complete") {
          console.log("Channel cleanup completed successfully");
          setStatus("Stream left successfully");
        } else if (message.startsWith("debug:")) {
          console.log("Debug:", message);
        } else if (message.startsWith("force_stopped_")) {
          console.log("Force stopped track:", message);
        } else if (message === "js_injection_called_leaveChannel") {
          console.log(
            "🎯 [Auction] JavaScript injection successfully called leaveChannel",
          );
        } else if (message === "js_injection_leaveChannel_not_found") {
          console.log(
            "❌ [Auction] JavaScript injection: leaveChannel function not found!",
          );
        } else {
          setStatus(message);
        }
      },
      [
        setStatus,
        setIsLoading,
        setIsHostPresent,
        setShowNoHostAlert,
        setShowNoHostAlert2,
        setIsVideoPlaying,
        storeInfo.name,
        storeInfo.avatar,
        liveComments,
        commentsListRef,
        setLiveComments,
      ],
    );

    const handleShare = () => {
      // Implement share functionality
      //console.log('Share stream');
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
        topPosition: 10,
      });
    }, [isMuted]);

    // Product buy handler
    const handleBuyNow = (product: Product) => {
      // Set the selected product and show checkout
      setSelectedProduct(product);
      setShowCheckout(true);
      //console.log('Buy product:', product.name);
    };

    // Product preview handler
    const handleProductPreview = (product: Product) => {
      // Set the selected product and show preview
      setSelectedProduct(product);
      setShowProductPreview(true);
      //console.log('Preview product:', product.name);
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

      return (
        <CommentItem item={item} renderAvatar={renderAvatar} styles={styles} />
      );
    };

    // Optimize with useCallback
    const handleSendComment = useCallback(async () => {
      if (!commentInput.trim()) return;

      try {
        const token = await getToken();
        const user = await getUser();

        if (!token || !user) {
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
          avatar:
            user.profileImage?.url || require("@/assets/icons/animoji.png"),
          content: commentContent,
          timestamp: new Date(),
        };

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
        }
      } catch (error) {
        console.error("Error sending comment:", error);
      }
    }, [commentInput, id, commentsListRef, setCommentInput, setComments]);

    const handleIncreaseCommentCount = () => {
      setComments(comments + 1);
    };

    const handleCantComment = () => {
      setShowComments(false);
      // Handle auth flow if needed
    };

    // Clean up socket connection when component unmounts
    // useEffect(() => {
    //   return () => {
    //     disconnectSocket();
    //   };
    // }, []);

    // Function to handle bid submissions
    const handleSubmitBid = (bidAmount: number) => {
      if (!id) return;

      // Get the most current product information - using currentProductIndex to ensure
      // we always use the latest product data even if selectedBidProduct hasn't updated yet
      const product = streamProducts[currentProductIndex] || selectedBidProduct;
      console.log("current bid product", JSON.stringify(product));

      if (!product) {
        console.error("No product selected for bidding");
        return;
      }

      // Ensure this is an active auction and not already closed
      if (product.bidStatus !== "active") {
        setBidErrorMessage("Bidding is now closed for this product");
        setShowBidError(true);
        return;
      }

      try {
        // Validate the bid amount
        if (product.currentBid && bidAmount <= product.currentBid) {
          // Show error alert
          Alert.alert(
            "Invalid Bid",
            `Your bid must be higher than the current bid of ${formatPrice(product.currentBid)}`,
          );
          return;
        }

        getUser().then((user) => {
          console.log("User:", user);
          if (!user) {
            Alert.alert(
              "Authentication Required",
              "Please log in to place bids",
            );
            return;
          }

          // Create a local notification for the bid
          //console.log(`Submitting bid of ${bidAmount} for product:`, product);

          // Add to user's list of notifications
          const bidNotification: StreamNotification = {
            id: Date.now().toString(),
            type: "new_bid",
            user: "System", // Simplify to just "You" since we're showing user's own bids
            content: `Your bid of ${formatPrice(bidAmount)} was submitted`,
            data: {
              streamId: id as string,
              productId: product.product.productId,
              productName: product.product.name,
              bidAmount: bidAmount,
            },
            timestamp: new Date(),
          };

          // Display notification in chat interactions
          setLiveComments((prev) => [...prev, bidNotification]);

          // Get the WebView ready to refresh if needed
          webViewRef.current?.injectJavaScript(`
                // Add code here to refresh or update the UI with the new bid
                true;
            `);

          // Set bid sending state to true
          setIsBidSending(true);

          // Send the bid to the server via WebSocket
          const socketInstance = getSocket();
          if (socketInstance) {
            // Send to the correct socket event 'stream_place_bid' as defined in backend
            socketInstance.emit("stream_place_bid", {
              streamId: id,
              productId: product.product.productId,
              bidAmount: bidAmount,
            });

            //console.log('Bid sent to server:', {
            //    streamId: id,
            //    productId: product.product.productId,
            //    bidAmount: bidAmount
            //});
          } else {
            console.error("Socket not connected, cannot submit bid");
            Alert.alert(
              "Connection Error",
              "Unable to connect to bidding service. Please try again.",
            );
            setIsBidSending(false);
          }

          // Note: We no longer do optimistic updates here as we'll get real-time updates from the server
          // Actual product updates will happen when we receive the 'stream_notification' event

          // Clear bid state
          setBidAmount(null);
        });
      } catch (error) {
        console.error("Error submitting bid:", error);
        setIsBidSending(false);
      }
    };

    // Handle opening the custom bid bottom sheet
    const handleOpenBidVariation = (product: StreamProduct) => {
      setSelectedBidProduct(product);
      setShowBidVariation(true);
    };

    // Add handleShowViewers function
    const handleShowViewers = () => {
      setShowViewers(true);
    };

    // Handle opening the stream info bottom sheet
    const handleShowStreamInfo = () => {
      setShowStreamInfo(true);
    };

    const handleShowOrders = () => {
      setShowOrders(true);
    };

    const handleShowShop = () => {
      setShowShop(true);
    };

    // Optimize with useCallback
    const handleLeaveStream = useCallback(
      async (leaveButton: boolean = false) => {
        if (!id) return;

        try {
          setIsLeavingStream(true);

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

          // Disconnect the socket
          disconnectSocket();

          // Navigate back to previous screen
          if (leaveButton) {
            router.push("/(root)/(tabs)/home/home");
          }
        } catch (error) {
          console.error("Error leaving stream:", error);
          // Show error message to user if needed
          disconnectSocket();
          if (leaveButton) {
            router.push("/(root)/(tabs)/home/home");
          }
        } finally {
          disconnectSocket();
          setIsLeavingStream(false);
          setShowMenuPopover(false);
        }
      },
      [
        id,
        webViewRef,
        leaveStream,
        router,
        shared,
        setIsLeavingStream,
        setShowMenuPopover,
      ],
    );

    // Optimize with useCallback
    const handleAutoLeaveStream = useCallback(async () => {
      if (!id) return;

      try {
        setIsLeavingStream(true);

        // First tell the WebView to leave the Agora channel
        console.log("🔄 [Auction] About to call WebView leaveChannel...");
        if (webViewRef.current) {
          console.log(
            "✅ [Auction] WebView ref exists, injecting JavaScript...",
          );
          webViewRef.current.injectJavaScript(`
              console.log("📱 [Auction] JavaScript injection received");
              if (typeof window.leaveChannel === 'function') {
                console.log("📱 [Auction] leaveChannel function found, calling it...");
                window.leaveChannel();
                window.ReactNativeWebView.postMessage("js_injection_called_leaveChannel");
              } else {
                console.log("📱 [Auction] leaveChannel function not found!");
                window.ReactNativeWebView.postMessage("js_injection_leaveChannel_not_found");
              }
              true;
            `);
          console.log("⏱️ [Auction] Waiting for WebView to process...");
          // Give a small delay to allow the WebView to process the leave command
          await new Promise((resolve) => setTimeout(resolve, 500));
          console.log("✅ [Auction] WebView processing delay completed");
        } else {
          console.log("❌ [Auction] WebView ref is null!");
        }

        // Call the leaveStream API endpoint
        const result = await leaveStream(id as string);

        // Disconnect the socket
        disconnectSocket();
      } catch (error) {
        console.error("Error leaving stream:", error);
        // Show error message to user if needed
        disconnectSocket();
      } finally {
        disconnectSocket();
        setIsLeavingStream(false);
        setShowMenuPopover(false);
      }
    }, [id, webViewRef, leaveStream, setIsLeavingStream, setShowMenuPopover]);

    // Register cleanup function with parent when component is ready
    useEffect(() => {
      if (isVisible && streamConfig && onRegisterCleanup) {
        console.log(
          `📋 [Auction] Registering cleanup function for stream ${id}`,
        );
        onRegisterCleanup(handleAutoLeaveStream);
      }
    }, [isVisible, streamConfig, onRegisterCleanup, handleAutoLeaveStream, id]);

    // Optimize with useCallback
    const handleFollowSeller = useCallback(
      async (isStreamInfo: boolean) => {
        if (!sellerId) {
          console.error("No seller ID available");
          return;
        }

        try {
          isStreamInfo
            ? setIsFollowingLoading2(true)
            : setIsFollowingLoading(true);
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
            text1: "Error",
            text2: "Failed to follow seller. Please try again.",
            type: "error",
            topPosition: 18,
          });
        } finally {
          isStreamInfo
            ? setIsFollowingLoading2(false)
            : setIsFollowingLoading(false);
        }
      },
      [
        sellerId,
        storeInfo.name,
        followSellerThroughStream,
        setIsFollowingLoading,
        setIsFollowingLoading2,
        setIsFollowing,
        setStreamDetails,
        show,
      ],
    );

    const handleUnfollowSeller = useCallback(
      async (isStreamInfo: boolean) => {
        if (!sellerId) {
          console.error("No seller ID available");
          return;
        }

        try {
          isStreamInfo
            ? setIsFollowingLoading2(true)
            : setIsFollowingLoading(true);
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
      },
      [
        sellerId,
        storeInfo.name,
        unfollowSellerThroughStream,
        setIsFollowingLoading,
        setIsFollowingLoading2,
        setIsFollowing,
        setStreamDetails,
        show,
      ],
    );

    // Optimize heart reaction handling with better state management

    // Debounced socket event emitter with useCallback
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

    // Handle sending heart reaction with useCallback
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

    // Improved heart press handler with useCallback and better state management
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

    // Define setupLivestream function
    const setupLivestream = useCallback(async () => {
      if (!id) return;
      try {
        setStatus("Joining stream...");

        // Join the stream using the stream ID from route parameters
        const streamDetails = await joinStream(id as string);

        // Set stream metadata if available from API
        if (streamDetails) {
          // Update likes and comments if available from API
          if (streamDetails.likes) setLikes(streamDetails.likes);
          if (streamDetails.comments) setComments(streamDetails.comments);

          // Set products from stream data
          if (streamDetails.products && streamDetails.products.length > 0) {
            console.log(
              "Setting products from streamDetails.products:",
              JSON.stringify(streamDetails.products),
            );

            // Make sure each product has a bidStatus, defaulting to 'pending' if not specified
            const productsWithStatus = streamDetails.products.map(
              (product) => ({
                ...product,
                bidStatus: product.bidStatus || "pending",
              }),
            );
            setStreamProducts(productsWithStatus);

            // Find if there's an active product for bidding and set it as current
            const activeProductIndex = productsWithStatus.findIndex(
              (product) =>
                product.bidStatus === "active" ||
                product.bidStatus === "ongoing",
            );

            if (activeProductIndex !== -1) {
              setCurrentProductIndex(activeProductIndex);
            }
          } else if (
            streamDetails?.stream?.products &&
            streamDetails?.stream?.products?.length > 0
          ) {
            // Make sure each product has a bidStatus, defaulting to 'pending' if not specified
            const productsWithStatus = streamDetails.stream.products.map(
              (product) => ({
                ...product,
                bidStatus: product.bidStatus || "pending",
              }),
            );

            setStreamProducts(productsWithStatus);
            console.log("streamProductsFirstAllocation", streamProducts);

            // Find if there's an active product for bidding and set it as current
            const activeProductIndex = productsWithStatus.findIndex(
              (product) =>
                product.bidStatus === "active" ||
                product.bidStatus === "ongoing",
            );

            if (activeProductIndex !== -1) {
              setCurrentProductIndex(activeProductIndex);
            }
          }

          // Get seller information from stream details
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

            const newStoreInfo = {
              name:
                sellerData.storeName || sellerData.businessName || "Store Name",
              username: `@${(sellerData.storeName || sellerData.businessName || "username").toLowerCase().replace(/\s+/g, "")}`,
              avatar: sellerData.storeAvatar?.url
                ? { uri: sellerData.storeAvatar.url }
                : require("@/assets/icons/animoji.png"),
            };

            setStoreInfo(newStoreInfo);

            // Set the seller ID and check if user is following the seller
            if (sellerData._id) {
              setSellerId(sellerData._id);
              try {
                const sellerProfileData =
                  await checkIfSellerIsFollowedFromSellerProfile(
                    sellerData._id,
                  );
                // console.log("Seller profile data:", sellerProfileData);
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
            const sellerData = streamDetails.seller;
            const newStoreInfo = {
              name:
                sellerData.storeName || sellerData.businessName || "Store Name",
              username: `@${(sellerData.storeName || sellerData.businessName || "username").toLowerCase().replace(/\s+/g, "")}`,
              avatar: sellerData.storeAvatar?.url
                ? { uri: sellerData.storeAvatar.url }
                : require("@/assets/icons/animoji.png"),
            };

            setStoreInfo(newStoreInfo);

            // Set the seller ID and check if user is following the seller
            if (sellerData._id) {
              setSellerId(sellerData._id);
              try {
                const sellerProfileData =
                  await checkIfSellerIsFollowedFromSellerProfile(
                    sellerData._id,
                  );
                // console.log("Seller profile data:", sellerProfileData);
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
              title: stream.title || "Live Auction",
              description:
                stream.description ||
                "Join our live auction and bid on exclusive items!",
              category: stream.category || "Shopping",
              tags: stream.tags || ["auction", "shopping", "live"],
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
              type: "auction",
              sellerFollowers: stream.sellerFollowers || 0,
            });
          }
        }

        // Set initial viewer count if available
        if (streamDetails?.stream) {
          const streamData = streamDetails.stream as any;
          if (typeof streamData.viewerCount === "number") {
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

        // Initialize socket connection for real-time chat with bid timer handlers
        const userToken = await getToken();
        if (userToken) {
          initializeSocket(
            userToken,
            handleStreamNotification,
            id as string, // Add streamId parameter as the third argument
            setIsBidSending,
            handleBidTimerUpdate,
            handleBidTimerComplete,
            handleAuctionOrderCreated,
          );
        }

        // Check for announcements in stream data
        const streamAnnouncements =
          (streamDetails.stream as any)?.liveAnnouncements ||
          (streamDetails.stream as any)?.announcements ||
          [];

        if (
          Array.isArray(streamAnnouncements) &&
          streamAnnouncements.length > 0
        ) {
          console.log(
            "Found announcements in stream data:",
            streamAnnouncements,
          );
          setLiveAnnouncements(streamAnnouncements);
        }

        // Filter out announcement types as they will be displayed separately
        const filteredChatInteractions = chatInteractions.filter(
          (interaction: any) => interaction.type !== "announcement",
        );

        // ... rest of existing setupLivestream function ...
      } catch (error: any) {
        console.error("Error setting up livestream:", error);
        setStatus("Error: " + (error as Error).message);
      }
    }, [
      id,
      joinStream,
      handleStreamNotification,
      handleBidTimerUpdate,
      handleBidTimerComplete,
      handleAuctionOrderCreated,
      setStatus,
      setLikes,
      setComments,
      setStreamProducts,
      setCurrentProductIndex,
      setStreamConfig,
      setStreamData,
      setStreamDetails,
      setStoreInfo,
      setLiveAnnouncements, // Add this dependency
      getSocket,
    ]);

    // Create a single condition to check if UI should be shown
    // Now create the derived value from state
    const shouldShowUI = useMemo(
      () => streamConfig && !isLoading && isVideoPlaying && isVisible,
      [streamConfig, isLoading, isVideoPlaying, isVisible],
    );

    return (
      <View
        style={{
          height:
            Platform.OS == "ios"
              ? height - insets.bottom
              : height - insets.bottom - insets.top,
          backgroundColor: "blue",
          position: "relative",
          // paddingBottom: insets.bottom,
        }}
      >
        <FocusAwareStatusBar barStyle="light-content" backgroundColor="black" />
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
                  "rgba(0,0,0,0.75)", // Darkest at bottom
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
              {showNoHostAlert && !isLoading && !keyboardVisibleRef.current && (
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
                      The host is not in the room at the moment. Please wait or
                      check back later.
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
                          const leaveButton = true;
                          handleLeaveStream(leaveButton);
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
          ) : isStreamEnded ? (
            <StreamEndedAlert
              onLeave={handleLeaveStream}
              isLeavingStream={isLeavingStream}
            />
          ) : (
            <SkeletonLoader type="loading" />
          )}
        </View>

        {/* Content Container */}
        <View style={styles.contentContainer}>
          {/* Top Actions */}
          {shouldShowUI && !keyboardVisibleRef.current && (
            <View
              style={{
                marginTop: (Platform.OS == "ios" ? insets.top : 0) + 15,
              }}
            >
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
                      <Text
                        numberOfLines={1}
                        className="text-white max-w-[100px] font-LexendDecaMedium text-base"
                      >
                        {storeInfo.name}
                      </Text>
                      <Text
                        numberOfLines={1}
                        className="text-gray-300 max-w-[100px] text-xs"
                      >
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
                        zIndex: 1000,
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
                            const leaveButton = true;
                            handleLeaveStream(leaveButton);
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
            </View>
          )}

          {/* Main Content Area */}
          <View
            style={{
              height: keyboardVisibleRef.current
                ? height -
                  keyboardHeightRef?.current -
                  insets.bottom -
                  (Platform.OS == "android" ? insets.top : 0)
                : undefined,
              justifyContent: "flex-end",
            }}
          >
            <View style={styles.mainContentArea}>
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
                  <ActionButton
                    icon={
                      <SimpleLineIcons
                        name="share-alt"
                        size={22}
                        color="white"
                      />
                    }
                    text="Share"
                    onPress={handleShare}
                  />

                  <ActionButton
                    icon={
                      <Ionicons
                        name="information-circle-outline"
                        size={24}
                        color="white"
                      />
                    }
                    text="Info"
                    onPress={handleShowStreamInfo}
                  />

                  <ActionButton
                    icon={
                      <MaterialCommunityIcons
                        name="package-variant-closed"
                        size={24}
                        color="white"
                      />
                    }
                    text="Orders"
                    onPress={handleShowOrders}
                  />

                  <ActionButton
                    icon={
                      <MaterialCommunityIcons
                        name="storefront-outline"
                        size={24}
                        color="white"
                      />
                    }
                    text="Shop"
                    onPress={handleShowShop}
                  />

                  <ActionButton
                    icon={<AntDesign name="hearto" size={24} color="#16783A" />}
                    text="Like"
                    onPress={handleHeartPress}
                  />
                </ScrollView>
              )}

              {/* Live Comments Section */}
              {shouldShowUI && (
                <View className="absolute bottom-0 left-0 w-[70%] z-10">
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

                  {/* Announcements Section - Displayed prominently */}
                  {shouldShowUI &&
                    liveAnnouncements?.some(
                      (item: any) =>
                        item.type === "announcement" &&
                        item.data?.current === true,
                    ) && (
                      <View style={styles.featuredAnnouncementContainer}>
                        {liveAnnouncements
                          .filter(
                            (item) =>
                              item.type === "announcement" &&
                              item.data?.current === true,
                          )
                          .slice(-1)
                          .map((announcement, index) => (
                            <TouchableOpacity
                              key={index}
                              style={styles.featuredAnnouncement}
                              onPress={() => {
                                setSelectedAnnouncement(announcement);
                                setShowAnnouncementSheet(true);
                              }}
                              activeOpacity={0.8}
                            >
                              <View style={styles.featuredAnnouncementLeft}>
                                {announcement.avatar ? (
                                  <GlassImage
                                    source={
                                      typeof announcement.avatar === "string"
                                        ? { uri: announcement.avatar }
                                        : announcement.avatar
                                    }
                                    imageStyle={styles.announcementAvatar}
                                    glassStyle={styles.announcementAvatar}
                                    placeholderColor="rgba(255, 255, 255, 0.1)"
                                    blurIntensity={20}
                                    tint="dark"
                                    showActivityIndicator={false}
                                  />
                                ) : (
                                  <View
                                    style={styles.announcementAvatarFallback}
                                  >
                                    <Text style={styles.announcementAvatarText}>
                                      {announcement.user
                                        ?.charAt(0)
                                        ?.toUpperCase() || "?"}
                                    </Text>
                                  </View>
                                )}
                              </View>
                              <View style={styles.featuredAnnouncementRight}>
                                <View style={styles.featuredAnnouncementHeader}>
                                  <Text
                                    numberOfLines={1}
                                    style={styles.featuredAnnouncementUser}
                                  >
                                    {announcement.user}
                                  </Text>
                                  <View style={styles.featuredModTag}>
                                    <Text style={styles.featuredModTagText}>
                                      Host
                                    </Text>
                                  </View>
                                </View>
                                <Text
                                  numberOfLines={2}
                                  style={[
                                    styles.featuredAnnouncementText,
                                    { flex: 1, marginRight: 8 },
                                  ]}
                                >
                                  {announcement.content}
                                </Text>
                              </View>
                            </TouchableOpacity>
                          ))}
                      </View>
                    )}
                </View>
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
              {shouldShowUI && streamProducts.length > 0 && (
                <>
                  {/* Winning Notification */}
                  {!keyboardVisibleRef.current && currentBidWinner && (
                    <View style={styles.winningNotificationContainer}>
                      <View style={styles.winningNotificationAvatar}>
                        {currentBidWinner.avatar ? (
                          <GlassImage
                            source={{ uri: currentBidWinner.avatar }}
                            imageStyle={styles.winningAvatarImage}
                            glassStyle={styles.winningAvatarImage}
                            placeholderColor="rgba(255, 255, 255, 0.1)"
                            blurIntensity={20}
                            tint="dark"
                            showActivityIndicator={false}
                          />
                        ) : (
                          <Text style={styles.avatarLetter}>
                            {currentBidWinner.initials || "?"}
                          </Text>
                        )}
                      </View>
                      <Text style={styles.winningUsername}>
                        {currentBidWinner.username}
                        <Text style={styles.winningText}>
                          {" "}
                          {currentBidWinner.isWinner ? "won" : "is"}{" "}
                        </Text>
                        <Text style={styles.winningHighlight}>
                          {currentBidWinner.isWinner ? "bid!" : "winning!"}
                        </Text>
                      </Text>
                    </View>
                  )}

                  {/* Auction Product Card */}
                  <View style={styles.auctionProductCardContainer}>
                    {streamProducts.length > 0 &&
                      !keyboardVisibleRef.current && (
                        <>
                          <LiveAuctionProductCard
                            product={{
                              name: streamProducts[currentProductIndex].product
                                .name,
                              description:
                                streamProducts[currentProductIndex].product
                                  .description,
                              price:
                                streamProducts[currentProductIndex].product
                                  .price,
                              currentBid:
                                streamProducts[currentProductIndex]
                                  .currentBid ||
                                streamProducts[currentProductIndex].minBid,
                              minBid:
                                streamProducts[currentProductIndex].minBid,
                              maxBid:
                                streamProducts[currentProductIndex].maxBid,
                              images:
                                streamProducts[currentProductIndex].product
                                  .images || [],
                              productId:
                                streamProducts[currentProductIndex].product
                                  .productId,
                              quantity:
                                streamProducts[currentProductIndex].product
                                  .quantity,
                              bidStatus:
                                streamProducts[currentProductIndex].bidStatus ||
                                "pending",
                            }}
                            onBid={(amount) => {
                              // Set the selectedBidProduct to ensure future interactions work correctly
                              setSelectedBidProduct(
                                streamProducts[currentProductIndex],
                              );
                              handleSubmitBid(amount);
                            }}
                            onCustom={() =>
                              handleOpenBidVariation(
                                streamProducts[currentProductIndex],
                              )
                            }
                            formatPrice={formatPrice}
                            category={streamDetails.category}
                            tag={streamDetails.tags}
                            bidIncrement={selectedBidIncrement}
                            isBidSending={isBidSending}
                            bidTimeRemaining={(() => {
                              const productId =
                                streamProducts[currentProductIndex].product
                                  .productId;
                              const timeValue =
                                productId && bidTimerData[productId]
                                  ? bidTimerData[productId]
                                  : "00:30";
                              //console.log(`Debug - Passing timer for product ${productId}:`, timeValue,
                              //    'Status:', streamProducts[currentProductIndex].bidStatus,
                              //    'bidTimerData:', bidTimerData);
                              return timeValue;
                            })()}
                          />
                        </>
                      )}
                  </View>
                </>
              )}
            </View>
          </View>
        </View>

        {/* Bottom Sheets */}
        <BottomSheet
          bgColor="#121212"
          childrenStyle="!px-[11px]"
          showCloseIcon={false}
          show={rsvpSheet}
          onRequestClose={() => showRsvpSheet(false)}
          snapPoints={["45%"]}
          enableDynamicSizing={false}
          keyboardBehavior={"interactive"}
          enablePanDownToClose={true}
          enableContentPanningGesture={true}
        >
          {scheduledStreamDetails && (
            <RsvpSheet
              streamDetails={scheduledStreamDetails}
              closeSheet={() => showRsvpSheet(false)}
            />
          )}
        </BottomSheet>

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
          enablePanDownToClose={true}
          enableContentPanningGesture={true}
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
          snapPoints={["85%"]}
          titleColor="!text-white"
          onRequestClose={() => setShowCheckout(false)}
          keyboardBehavior="interactive"
          enablePanDownToClose={true}
          enableDynamicSizing={false}
        >
          {selectedProduct && (
            <CheckoutNow
              productId={selectedProduct?.productId}
              closeSheet={() => setShowCheckout(false)}
              sellerId={
                (selectedProduct.seller as any)?._id ||
                activeStreamDetails?.stream?.seller?._id ||
                ""
              }
              channel="liveshow"
              blipId=""
              streamId={activeStreamDetails?.stream?._id}
            />
          )}
        </BottomSheet>

        {/* Bid Variation Selector Bottom Sheet */}
        <BottomSheet
          bgColor="#121212"
          childrenStyle="!px-[11px]"
          showCloseIcon={false}
          title=""
          show={showBidVariation}
          snapPoints={["80%"]}
          titleColor="!text-white"
          onRequestClose={() => setShowBidVariation(false)}
          keyboardBehavior="fillParent"
          enableContentPanningGesture={true}
          enablePanDownToClose={true}
        >
          {selectedBidProduct && (
            <BidVariationSelector
              currentBid={
                selectedBidProduct.currentBid ||
                selectedBidProduct.minBid ||
                selectedBidProduct.product.price
              }
              onSelectBidAmount={(amount) => {
                setShowBidVariation(false);
                // Calculate and save the selected increment
                const currentBid =
                  selectedBidProduct.currentBid ||
                  selectedBidProduct.minBid ||
                  selectedBidProduct.product.price;
                const increment = amount - currentBid;
                setSelectedBidIncrement(increment);
                handleSubmitBid(amount);
              }}
              onCustomBid={(amount) => {
                setShowBidVariation(false);
                // Calculate and save the selected increment
                const currentBid =
                  selectedBidProduct.currentBid ||
                  selectedBidProduct.minBid ||
                  selectedBidProduct.product.price;
                const increment = amount - currentBid;
                //setSelectedBidIncrement(increment);
                handleSubmitBid(amount);
              }}
              formatPrice={formatPrice}
              closeSheet={() => setShowBidVariation(false)}
            />
          )}
        </BottomSheet>

        {/* Add Viewers Bottom Sheet */}
        <BottomSheet
          bgColor="#121212"
          childrenStyle="!px-[11px]"
          showCloseIcon={false}
          title=""
          show={showViewers}
          snapPoints={["40%"]}
          titleColor="!text-white"
          onRequestClose={() => setShowViewers(false)}
          keyboardBehavior="interactive"
          enablePanDownToClose={true}
          enableContentPanningGesture={true}
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
          snapPoints={["60%"]}
          titleColor="!text-white"
          onRequestClose={() => setShowStreamInfo(false)}
          keyboardBehavior="interactive"
          enablePanDownToClose={true}
          enableContentPanningGesture={true}
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
          snapPoints={["100%"]}
          titleColor="!text-white"
          onRequestClose={() => setShowOrders(false)}
          keyboardBehavior="interactive"
          enablePanDownToClose={true}
          enableContentPanningGesture={true}
        >
          <StreamOrders streamId={id} closeSheet={() => setShowOrders(false)} />
        </BottomSheet>

        {/* Add Bid Error Bottom Sheet */}
        <BottomSheet
          bgColor="#121212"
          childrenStyle="!px-0"
          showCloseIcon={false}
          title=""
          show={showBidError}
          snapPoints={["40%"]}
          titleColor="!text-white"
          onRequestClose={() => setShowBidError(false)}
          keyboardBehavior="interactive"
          enablePanDownToClose={true}
          enableContentPanningGesture={true}
        >
          <BidErrorMessage
            errorMessage={bidErrorMessage}
            closeSheet={() => setShowBidError(false)}
          />
        </BottomSheet>

        {/* Order Created Notification */}
        <BottomSheet
          bgColor="#121212"
          childrenStyle="!px-0"
          showCloseIcon={false}
          title=""
          show={showOrderCreatedNotification}
          snapPoints={["70%"]}
          titleColor="!text-white"
          onRequestClose={() => setShowOrderCreatedNotification(false)}
          keyboardBehavior="interactive"
          enablePanDownToClose={true}
          enableContentPanningGesture={true}
        >
          {activeOrderCreated && (
            <OrderCreatedNotification
              order={activeOrderCreated}
              closeSheet={() => setShowOrderCreatedNotification(false)}
              onViewOrder={() => {
                setShowOrderCreatedNotification(false);
                router.push(`/orders/orders`);
              }}
              formatPrice={formatPrice}
            />
          )}
        </BottomSheet>

        {/* Shop Bottom Sheet */}
        <BottomSheet
          bgColor="#121212"
          childrenStyle="!px-0"
          showCloseIcon={false}
          title=""
          show={showShop}
          snapPoints={["80%"]}
          titleColor="!text-white"
          onRequestClose={() => setShowShop(false)}
          keyboardBehavior="interactive"
          enablePanDownToClose={true}
          enableContentPanningGesture={true}
        >
          <AuctionShopBottomSheet
            streamProducts={streamProducts}
            closeSheet={() => setShowShop(false)}
            isLoading={isLoading}
          />
        </BottomSheet>

        {/* Announcement Bottom Sheet */}
        <BottomSheet
          bgColor="#121212"
          childrenStyle="!px-[11px]"
          showCloseIcon={false}
          title=""
          show={showAnnouncementSheet}
          snapPoints={["55%"]}
          titleColor="!text-white"
          onRequestClose={() => setShowAnnouncementSheet(false)}
          enablePanDownToClose={true}
          enableContentPanningGesture={true}
        >
          <AnnouncementView
            announcement={selectedAnnouncement}
            closeSheet={() => setShowAnnouncementSheet(false)}
          />
        </BottomSheet>

        {/* Add the FloatingHeartsAnimation component */}
        <FloatingHeartsAnimation ref={heartsRef} count={15} color="#16783A" />
      </View>
    );
  },
);

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
    // height: height,
    flex: 1,
    position: "relative",
    justifyContent: "space-between",
  },
  mainContentArea: {
    //height: "53%",
    position: "relative",
  },
  bottomArea: {
    position: "relative",
    paddingBottom: Platform.OS === "ios" ? 20 : 10,
    zIndex: 15,
  },
  bottomProductCardContainer: {
    position: "relative",
    padding: 16,
    marginTop: 10,
  },
  commentInputContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
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
    maxHeight: 200,
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
    height: 55,
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
    marginTop: 4,
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
  winningNotificationContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 5,
    paddingLeft: 16,
    paddingRight: 16,
  },
  winningNotificationAvatar: {
    width: 25,
    height: 25,
    borderRadius: 15,
    backgroundColor: "#6A5ACD", // Purple color for the avatar
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  avatarLetter: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  winningUsername: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "bold",
  },
  winningText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "normal",
  },
  winningHighlight: {
    color: "#16783A",
    fontWeight: "bold",
    fontSize: 13,
  },
  auctionProductCardContainer: {
    paddingHorizontal: 16,
    // marginBottom: 20,
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
    color: "#ff5555", // Red text for "left room"
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
  productNavigationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  productCounter: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "LexendDeca",
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
    color: "#ff5555", // Red text for "left room"
    fontSize: 12,
    fontFamily: "LexendDeca",
    fontWeight: "bold",
    flexWrap: "wrap",
  },
  auctionStartCommentItem: {
    flexDirection: "row",
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginVertical: 8,
    maxWidth: "100%",
    alignSelf: "flex-start",
    flex: 1,
    backgroundColor: "rgba(255, 235, 59, 0.2)", // Light Yellow background (#FFEB3B)
  },
  auctionStartCommentContent: {
    flexDirection: "column",
    flex: 1,
  },
  auctionCommentUser: {
    color: "#FFEB3B",
    fontWeight: "bold",
  },
  auctionStartCommentText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "LexendDeca",
    fontWeight: "semibold",
    flexWrap: "wrap",
  },
  winningAvatarImage: {
    width: 25,
    height: 25,
    borderRadius: 15,
  },
  orderCreatedContainer: {
    position: "absolute",
    bottom: 120, // Position above the LiveAuctionProductCard
    left: 16,
    right: 16,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    borderRadius: 12,
    padding: 16,
    zIndex: 1000,
  },
  orderCreatedContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  orderCreatedIcon: {
    marginRight: 12,
  },
  orderCreatedTextContainer: {
    flex: 1,
  },
  orderCreatedTitle: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 4,
  },
  orderCreatedText: {
    color: "#DDD",
    fontSize: 14,
  },
  orderCreatedInfo: {
    color: "#16783A",
    fontWeight: "bold",
    fontSize: 14,
    marginTop: 4,
  },
  orderCreatedCloseButton: {
    padding: 8,
  },
  orderCreatedViewButton: {
    backgroundColor: "#16783A",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  orderCreatedViewButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 14,
    marginRight: 8,
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
  // Announcement styles
  featuredAnnouncementContainer: {
    marginTop: 10,
    marginBottom: 10,
    marginLeft: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    backdropFilter: "blur(10px)",
    opacity: 0.6,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#16783A",
    maxWidth: "90%",
  },
  featuredAnnouncement: {
    flexDirection: "row",
    alignItems: "center",
  },
  featuredAnnouncementLeft: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  announcementAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  announcementAvatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  announcementAvatarText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  featuredAnnouncementRight: {
    flex: 1,
  },
  featuredAnnouncementHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    width: 120,
  },
  featuredAnnouncementUser: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  featuredModTag: {
    backgroundColor: "#16783A",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  featuredModTagText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  featuredAnnouncementText: {
    color: "#FFFFFF",
    fontSize: 12,
    marginTop: 2,
    textTransform: "capitalize",
  },
  announcementItem: {
    flexDirection: "row",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 0,
    maxWidth: "100%",
    alignSelf: "flex-start",
    flex: 1,
  },
  announcementContent: {
    flexDirection: "column",
    flex: 1,
  },
  announcementHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  announcementUser: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  modTag: {
    backgroundColor: "#16783A",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  modTagText: {
    color: "#000",
    fontSize: 12,
    fontWeight: "bold",
  },
  announcementText: {
    color: "#FFFFFF",
    fontSize: 12,
    lineHeight: 16,
  },
});

export default LiveAuctionStudio;
