import { View, Text, Image, TouchableOpacity, Dimensions, SafeAreaView, StyleSheet, FlatList, TextInput, KeyboardAvoidingView, Animated, Platform, Keyboard, ScrollView, Alert, BackHandler } from 'react-native';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useLivestream } from '@/contexts/livestreamContext';
import { WebView } from 'react-native-webview';
import { AntDesign, Feather, MaterialIcons, Ionicons, Octicons, FontAwesome, Entypo, MaterialCommunityIcons, SimpleLineIcons } from '@expo/vector-icons';
import { FocusAwareStatusBar } from '@/components/ui/focus-aware-status-bar';
import BottomSheet from '@/components/global/bottom-sheet';
import { ActivityIndicator } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import { getToken, getUser } from '@/store/features/auth/utils';
import axios from 'axios';
import moment from 'moment';
import { timeFromNow } from '@/helpers/helpers';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { StreamConfig, ProductImage, Product, StreamProduct, StreamDetails, LivestreamContextType } from '@/types/streams/livestreamStudio';
import { streamEngine } from './streamEngine';
import { LiveShowProductCard } from './liveShowProductCard';
import { initializeSocket, disconnectSocket, getSocket, StreamNotification, BidTimerUpdate, BidTimerComplete, AuctionOrderCreated } from './socketHandler';
import { SOCKET_EVENTS } from '@/constants/api';
import { LinearGradient } from 'expo-linear-gradient';
import { useToast } from '@/contexts/ToastContext';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import ProductPreview from '@/components/blips/productPreview';
import CheckoutNow from '@/components/blips/checkoutNow';
import LiveAuctionProductCard from './liveAuctionProductCard';
import BidVariationSelector from '@/app/(root)/livestream/bidVariationSelector';
import StreamViewers from './streamViewers';
import StreamInfo from './StreamInfo';
import BidErrorMessage from './BidErrorMessage';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import OrderCreatedNotification from './OrderCreatedNotification';

const { width, height } = Dimensions.get('window');

const LiveAuctionStudio = () => {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { show } = useToast();
    const { id } = useLocalSearchParams();
    const { 
        activeStreamDetails, 
        joinStream, 
        fetchActiveStreamDetails, 
        leaveStream,
        followSellerThroughStream,
        unfollowSellerThroughStream,
        checkIfSellerIsFollowedFromSellerProfile 
    } = useLivestream() as LivestreamContextType;
    const [streamConfig, setStreamConfig] = useState<StreamConfig | null>(null);
    const [status, setStatus] = useState('Initializing...');
    const [isLoading, setIsLoading] = useState(true);
    const [isFollowingLoading, setIsFollowingLoading] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [sellerId, setSellerId] = useState<string>('');

    // UI interaction states
    const [likes, setLikes] = useState(23500);
    const [liked, setLiked] = useState(false);
    const [comments, setComments] = useState(1200);
    const [showComments, setShowComments] = useState(false);
    const [comment, setComment] = useState('');
    const [streamProducts, setStreamProducts] = useState<StreamProduct[]>([]);
    const [currentProductIndex, setCurrentProductIndex] = useState(0);
    const [activeAuctionProduct, setActiveAuctionProduct] = useState<any>(null);
    const [storeInfo, setStoreInfo] = useState({
        name: 'Store Name',
        username: '@username',
        avatar: require('@/assets/icons/animoji.png')
    });
    const [viewerCount, setViewerCount] = useState<number>(0);
    const [isMuted, setIsMuted] = useState<boolean>(false);
    const webViewRef = useRef<WebView>(null);

    // Bottom sheet state for product preview and checkout
    const [showProductPreview, setShowProductPreview] = useState(false);
    const [showCheckout, setShowCheckout] = useState(false);
    const [showBidVariation, setShowBidVariation] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [selectedBidProduct, setSelectedBidProduct] = useState<StreamProduct | null>(null);
    const [bidAmount, setBidAmount] = useState<number | null>(null);
    const [selectedBidIncrement, setSelectedBidIncrement] = useState<number>(500);

    // Array of live comments
    const [liveComments, setLiveComments] = useState<StreamNotification[]>([]);
    const [commentInput, setCommentInput] = useState('');
    const commentsListRef = useRef<FlatList>(null);
    // Add a new state to track if video is actually playing
    const [isVideoPlaying, setIsVideoPlaying] = useState(false);
    // Replace standard state with refs for instant updates
    const keyboardHeightRef = useRef(0);
    const keyboardVisibleRef = useRef(false);
    const [, forceUpdate] = useState({});
    const { width: screenWidth } = Dimensions.get('window');

    // Add new state for viewers bottom sheet
    const [showViewers, setShowViewers] = useState(false);
    // Add new state for stream info bottom sheet
    const [showStreamInfo, setShowStreamInfo] = useState(false);
    // Add state for menu popover
    const [showMenuPopover, setShowMenuPopover] = useState(false);
    // Add stream details state
    const [streamDetails, setStreamDetails] = useState({
        title: '',
        description: '',
        category: '',
        tags: [],
        viewerCount: 0,
        scheduledStartTime: '',
        actualStartTime: '',
        status: 'live',
        type: 'auction'
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
    const [bidErrorMessage, setBidErrorMessage] = useState('');
    const [isBidSending, setIsBidSending] = useState(false);

    // Add new state variables for timer
    const [bidTimerData, setBidTimerData] = useState<{ [key: string]: string }>({});
    const [activeOrderCreated, setActiveOrderCreated] = useState<AuctionOrderCreated | null>(null);
    const [showOrderCreatedNotification, setShowOrderCreatedNotification] = useState(false);

    // Add new state for detailed viewers
    const [detailedViewers, setDetailedViewers] = useState<any[]>([]);

    // Add state for host presence
    const [isHostPresent, setIsHostPresent] = useState(true);
    const [showNoHostAlert, setShowNoHostAlert] = useState(false);

    // Update detailedViewers when activeStreamDetails changes
    useEffect(() => {
        if (activeStreamDetails?.stream?.viewers) {
            setDetailedViewers(activeStreamDetails.stream.viewers);
            //console.log('Initialized detailedViewers with:', activeStreamDetails.stream.viewers);
        }
    }, [activeStreamDetails]);

    // Helper function to get initials from name
    const getInitials = (firstName?: string, lastName?: string): string => {
        let initials = '';
        if (firstName && firstName.length > 0) {
            initials += firstName[0].toUpperCase();
        }
        if (lastName && lastName.length > 0) {
            initials += lastName[0].toUpperCase();
        }
        return initials || '?';
    };

    useEffect(() => {
        setupLivestream();

        // Scroll to the end to show new comment
        if (commentsListRef.current) {
            commentsListRef.current.scrollToEnd({ animated: true });
        }

        return () => {
            disconnectSocket();
        };
    }, [id]);

    // Separate useEffect for keyboard event listeners
    useEffect(() => {
        // Enhanced keyboard listeners for zero-latency updates
        const keyboardWillShow = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            (e) => {
                keyboardVisibleRef.current = true;
                keyboardHeightRef.current = e.endCoordinates.height;
                // Force immediate re-render
                forceUpdate({});
            }
        );

        const keyboardWillHide = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            (e) => {
                keyboardVisibleRef.current = false;
                keyboardHeightRef.current = 0;
                // Force immediate re-render
                forceUpdate({});
            }
        );

        // Cleanup keyboard listeners
        return () => {
            keyboardWillShow.remove();
            keyboardWillHide.remove();
        };
    }, []); // Empty dependency array since we don't need any dependencies for keyboard events

    //console.log('keyboardHeightRef', keyboardHeightRef.current);
    //console.log('keyboardVisibleRef', keyboardVisibleRef.current);

    // Handle Android back button press
    {/*useEffect(() => {
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
    }, [id]);*/}

    const setupLivestream = async () => {
        if (!id) return;
        try {
            setStatus('Joining stream...');

            // Join the stream using the stream ID from route parameters
            const streamDetails = await joinStream(id as string);
            //console.log('Stream details:', streamDetails);
            //console.log('stream viewers', streamDetails?.stream?.viewers);

            // Set stream metadata if available from API
            if (streamDetails) {
                // Update likes and comments if available from API
                if (streamDetails.likes) setLikes(streamDetails.likes);
                if (streamDetails.comments) setComments(streamDetails.comments);

                // Set products from stream data
                if (streamDetails.products && streamDetails.products.length > 0) {
                    //console.log('Setting products from streamDetails.products:', streamDetails.products);
                    // Make sure each product has a bidStatus, defaulting to 'pending' if not specified
                    const productsWithStatus = streamDetails.products.map(product => ({
                        ...product,
                        bidStatus: product.bidStatus || 'pending'
                    }));
                    setStreamProducts(productsWithStatus);

                    // Find if there's an active product for bidding and set it as current
                    const activeProductIndex = productsWithStatus.findIndex(product =>
                        product.bidStatus === 'active' || product.bidStatus === 'ongoing'
                    );

                    //console.log('Active product index on join:', activeProductIndex);

                    if (activeProductIndex !== -1) {
                        setCurrentProductIndex(activeProductIndex);
                        //console.log('Setting current product to active bid product:', productsWithStatus[activeProductIndex]);
                    }
                } else if (streamDetails?.stream?.products && streamDetails?.stream?.products?.length > 0) {
                    //console.log('Setting products from streamDetails.stream.products:', streamDetails.stream.products);
                    // Make sure each product has a bidStatus, defaulting to 'pending' if not specified
                    const productsWithStatus = streamDetails.stream.products.map(product => ({
                        ...product,
                        bidStatus: product.bidStatus || 'pending'
                    }));

                    //console.log('productsWithStatus', productsWithStatus);
                    setStreamProducts(productsWithStatus);
                    //console.log('streamProductsFirstAllocation', streamProducts);

                    // Find if there's an active product for bidding and set it as current
                    const activeProductIndex = productsWithStatus.findIndex(product =>
                        product.bidStatus === 'active' || product.bidStatus === 'ongoing'
                    );

                    //console.log('Active product index on join:', activeProductIndex);

                    if (activeProductIndex !== -1) {
                        setCurrentProductIndex(activeProductIndex);
                        //console.log('Setting current product to active bid product:', productsWithStatus[activeProductIndex]);
                    }
                }

                // Debug seller information
                //console.log('Seller info from API:', streamDetails.seller);
                //console.log('Stream info:', streamDetails.stream);

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
                    //console.log('Using seller data from stream.seller:', sellerData);

                    const newStoreInfo = {
                        name: sellerData.storeName || sellerData.businessName || 'Store Name',
                        username: `@${(sellerData.storeName || sellerData.businessName || 'username').toLowerCase().replace(/\s+/g, '')}`,
                        avatar: sellerData.storeAvatar?.url
                            ? { uri: sellerData.storeAvatar.url }
                            : require('@/assets/icons/animoji.png')
                    };

                    //console.log('Setting store info to:', newStoreInfo);
                    setStoreInfo(newStoreInfo);
                    
                    // Set the seller ID and check if user is following the seller
                    if (sellerData._id) {
                        setSellerId(sellerData._id);
                        try {
                            const sellerProfileData = await checkIfSellerIsFollowedFromSellerProfile(sellerData._id);
                            console.log('Seller profile data:', sellerProfileData);
                            setIsFollowing(sellerProfileData?.storeInfo?.isFollowing || false);
                        } catch (error) {
                            console.error('Error checking if seller is followed:', error);
                        }
                    }
                }
                // If seller info is directly in streamDetails
                else if (streamDetails.seller) {
                    //console.log('Using seller data from streamDetails.seller');

                    const sellerData = streamDetails.seller;
                    const newStoreInfo = {
                        name: sellerData.storeName || sellerData.businessName || 'Store Name',
                        username: `@${(sellerData.storeName || sellerData.businessName || 'username').toLowerCase().replace(/\s+/g, '')}`,
                        avatar: sellerData.storeAvatar?.url
                            ? { uri: sellerData.storeAvatar.url }
                            : require('@/assets/icons/animoji.png')
                    };

                    //console.log('Setting store info to:', newStoreInfo);
                    setStoreInfo(newStoreInfo);
                    
                    // Set the seller ID and check if user is following the seller
                    if (sellerData._id) {
                        setSellerId(sellerData._id);
                        try {
                            const sellerProfileData = await checkIfSellerIsFollowedFromSellerProfile(sellerData._id);
                            console.log('Seller profile data:', sellerProfileData);
                            setIsFollowing(sellerProfileData?.storeInfo?.isFollowing || false);
                        } catch (error) {
                            console.error('Error checking if seller is followed:', error);
                        }
                    }
                }

                // Set stream details
                if (streamDetails.stream) {
                    const stream = streamDetails.stream as any;
                    setStreamDetails({
                        title: stream.title || 'Live Auction',
                        description: stream.description || 'Join our live auction and bid on exclusive items!',
                        category: stream.category || 'Shopping',
                        tags: stream.tags || ['auction', 'shopping', 'live'],
                        viewerCount: typeof stream.viewerCount === 'number' ? stream.viewerCount :
                            (Array.isArray(stream.viewers) ? stream.viewers.length : 0),
                        scheduledStartTime: stream.scheduledStartTime || new Date().toISOString(),
                        actualStartTime: stream.startTime || new Date().toISOString(),
                        status: stream.status || 'live',
                        type: 'auction'
                    });
                }
            }

            // Set initial viewer count if available
            if (streamDetails?.stream) {
                const streamData = streamDetails.stream as any;
                //console.log('Stream view count data:', streamData);
                if (typeof streamData.viewerCount === 'number') {
                    //console.log('Viewer count:', streamData.viewerCount);
                    setViewerCount(streamData.viewerCount);
                } else if (Array.isArray(streamData.viewers)) {
                    //console.log('Viewer count:', streamData.viewers.length);
                    setViewerCount(streamData.viewers.length);
                }
            }

            setStreamConfig({
                appId: process.env.EXPO_PUBLIC_AGORA_APP_ID || '',
                channel: streamDetails?.channelName || '',
                token: streamDetails?.token || '',
                uid: streamDetails?.uid || ''
            });

            // Initialize with chat interactions from the stream
            const chatInteractions = (streamDetails.stream as any)?.chatInteractions || [];

            // Get the current user's information
            const user = await getUser();

            // Create a join event for the current user
            const userJoinEvent = {
                id: Date.now().toString(),
                type: 'join' as const,
                user: user?.firstName || 'You',
                avatar: user?.profileImage?.url || require('@/assets/icons/animoji.png'),
                content: 'joined the stream',
                timestamp: new Date(),
                data: {
                    isCurrentUser: true // Add this flag to identify the current user's join event
                }
            };

            // Add the user's join event to the beginning of chat interactions
            const updatedChatInteractions = [...chatInteractions, userJoinEvent];

            // Set the live comments with the updated data
            setLiveComments(updatedChatInteractions);

            //console.log(`Loaded ${updatedChatInteractions.length} chat interactions from server`);

            // Use requestAnimationFrame and setTimeout for more reliable scrolling
            if (updatedChatInteractions.length > 0) {
                requestAnimationFrame(() => {
                    setTimeout(() => {
                        if (commentsListRef.current) {
                            commentsListRef.current.scrollToEnd({
                                animated: true
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
                    id as string, // Add streamId parameter
                    setIsBidSending,
                    handleBidTimerUpdate,
                    handleBidTimerComplete,
                    handleAuctionOrderCreated
                );
            }
        } catch (error) {
            console.error('Error setting up livestream:', error);
            setStatus('Error: ' + (error as Error).message);
        }
    };

    //console.log('streamProductsSecondAllocation', streamProducts);


    // Handler for WebSocket notifications (joins, comments, purchases, host left/rejoined)
    const handleStreamNotification = useCallback((notification: StreamNotification) => {
        //console.log('Stream notification received:', notification.type, notification);

        // Process notification based on type
        switch (notification.type) {
            case 'join':
                //console.log('User joined stream:', notification.user);
                // Update UI to show join event
                setLiveComments(prev => [...prev, notification]);

                // Update viewer count if available in notification data
                if (notification.data) {
                    if ('viewerCount' in notification.data) {
                        setViewerCount(notification.data.viewerCount as number);
                    }

                    // Add new viewer to detailedViewers array if not already present
                    if (notification.data.buyerId) {
                        const buyerId = notification.data.buyerId;
                        console.log('Checking buyerId:', buyerId, 'in viewers array length:', detailedViewers?.length || 0);

                        // Log the full viewers array for debugging
                        console.log('Current detailedViewers:', JSON.stringify(detailedViewers));

                        // Convert both to strings for safer comparison
                        const existingViewer = Array.isArray(detailedViewers) &&
                            detailedViewers.find(viewer =>
                                viewer && viewer._id && viewer._id.toString() === buyerId.toString() || viewer.firstName === notification?.data?.buyerName?.split(' ')[0] || viewer.lastName === notification?.data?.buyerName?.split(' ')[1]
                            );

                        console.log('existingViewer check result:', existingViewer ? `Found with id ${existingViewer._id}` : 'Not found');

                        if (!existingViewer) {
                            // Viewer does not exist, create and add new viewer object
                            const newViewer = {
                                _id: buyerId,
                                firstName: notification.data.buyerName?.split(' ')[0] || '',
                                lastName: notification.data.buyerName?.split(' ')[1] || '',
                                username: notification.data.buyerUsername || '',
                                profileImage: notification.data.buyerAvatar ? { url: notification.data.buyerAvatar } : undefined
                            };

                            setDetailedViewers(prev => [...prev, newViewer]);
                            console.log('Added new viewer:', newViewer._id);
                        } else {
                            console.log('Viewer already exists in detailed viewers array:', buyerId);
                        }
                    }
                }
                break;

            case 'comment':
                //console.log('New comment received:', notification.content);
                // Check if this is an error notification from bid_error event
                if (notification.data?.isError) {
                    //console.log('Displaying bid error message:', notification.content);
                    // Use the message field directly if available, otherwise extract from content
                    const errorMessage = notification.data.message || notification.content.replace('Bid error: ', '');
                    setBidErrorMessage(errorMessage);
                    setShowBidError(true);
                }
                // Update UI to show comment
                setLiveComments(prev => [...prev, notification]);
                // Increment comment count
                setComments(prev => prev + 1);
                break;

            case 'purchase':
                //console.log('New purchase made:', notification.content);
                // Update UI to show purchase
                setLiveComments(prev => [...prev, notification]);
                break;

            case 'hostLeft':
                //console.log('Host left stream:', notification.user);
                // Update UI to show host left event
                setLiveComments(prev => [...prev, notification]);
                break;

            case 'hostRejoin':
                //console.log('Host rejoined stream:', notification.user);
                // Update UI to show host rejoined event
                setLiveComments(prev => [...prev, notification]);
                break;

            case 'leave':
                //console.log('User left stream:', notification.user);
                // Update UI to show leave event
                setLiveComments(prev => [...prev, notification]);
                // Update viewer count and detailed viewers if available in notification data
                if (notification.data) {
                    if ('viewerCount' in notification.data) {
                        setViewerCount(notification.data.viewerCount as number);
                    }

                    // Remove viewer from detailedViewers array
                    if ('buyerId' in notification.data && notification.data.buyerId) {
                        const buyerId = notification.data.buyerId;
                        setDetailedViewers(prev => prev.filter(viewer => viewer._id !== buyerId));
                        //console.log('Removed viewer with ID:', buyerId);
                    }

                    // If the server provides a full viewers array, use it instead
                    {/*if ('viewers' in notification.data && Array.isArray(notification.data.viewers)) {
                        setDetailedViewers(notification.data.viewers);
                        console.log('Updated viewers from server data:', notification.data.viewers);
                    }*/}
                }
                break;

            case 'auction_start':
                //console.log('Auction started for product:', notification);
                // Update UI to show auction start event
                setLiveComments(prev => [...prev, notification]);

                // Update the active auction product from the notification data
                if (notification.data && notification.data.product) {
                    //console.log('Setting active auction product:', notification.data.product);
                    setActiveAuctionProduct(notification.data.product);

                    // Find the product in streamProducts and update it
                    const productId = notification.data.product.product?.productId;
                    //console.log('realtime bid productId:', productId);

                    if (productId) {
                        setStreamProducts(prevProducts => {
                            //console.log('prevProducts in functional update:', prevProducts);

                            // Find the index of the product in the current streamProducts array
                            const productIndex = prevProducts.findIndex(p =>
                                p.product.productId === productId
                            );
                            //console.log('realtime bid productIndex:', productIndex);

                            // If product found, set it as the current product
                            if (productIndex !== -1) {
                                setCurrentProductIndex(productIndex);
                                //console.log('Setting current product index to:', productIndex);
                            }

                            // Update the product status to active
                            return prevProducts.map(p => {
                                if (p.product.productId === productId) {
                                    return {
                                        ...p,
                                        bidStatus: 'active',
                                        currentBid: notification.data?.product.currentBid,
                                        minBid: notification.data?.product.minBid,
                                        maxBid: notification.data?.product.maxBid
                                    };
                                }
                                // Mark other products as 'ended' if they were 'active'
                                if (p.bidStatus === 'active') {
                                    return {
                                        ...p,
                                        bidStatus: 'ended'
                                    };
                                }
                                return p;
                            });
                        });
                    }

                    setCurrentBidWinner(null);
                }
                break;

            case 'new_bid':
                //console.log('New bid received:', notification);
                // Update UI to show new bid event
                setLiveComments(prev => [...prev, notification]);

                // Update the product with new bid amount
                if (notification.data && notification.data.product) {
                    //console.log('Updating product with new bid:', notification.data.product);

                    // Find the product in streamProducts and update it
                    const productId = notification.data.product.product?.productId;
                    //console.log('realtime bid productId:', productId);

                    if (productId) {
                        setStreamProducts(prevProducts => {
                            //console.log('prevProducts in functional update:', prevProducts);

                            // Find the index of the product in the current streamProducts array
                            const productIndex = prevProducts.findIndex(p =>
                                p.product.productId === productId
                            );
                            //console.log('realtime bid productIndex:', productIndex);

                            // If product found, don't change current product index since we're in an active bid
                            if (productIndex !== -1) {
                                //console.log('Updating product at index:', productIndex);
                            }

                            // Update the product
                            return prevProducts.map(p => {
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
                        const username = bidder.username || `${bidder.firstName} ${bidder.lastName}`.trim();
                        const avatar = bidder.profileImage?.url || undefined;
                        const initials = getInitials(bidder.firstName, bidder.lastName);

                        setCurrentBidWinner({
                            username,
                            avatar,
                            initials,
                            bidAmount: notification.data.bidAmount,
                            isWinner: false // This is just a bid, not a winner yet
                        });
                    }
                }
                break;

            case 'auction_winner':
                //console.log('Auction winner notification:', notification);
                // Update UI to show auction winner event
                setLiveComments(prev => [...prev, notification]);

                // Update the product with the winner and mark as ongoing
                if (notification.data && notification.data.product) {
                    //console.log('Updating product with winner:', notification.data.product);

                    // Find the product in streamProducts and update it
                    const productId = notification.data.product.product?.productId;
                    //console.log('auction winner productId:', productId);

                    if (productId) {
                        setStreamProducts(prevProducts => {
                            //console.log('prevProducts in functional update:', prevProducts);

                            // Find the index of the product in the current streamProducts array
                            const productIndex = prevProducts.findIndex(p =>
                                p.product.productId === productId
                            );
                            //console.log('auction winner productIndex:', productIndex);

                            // If product found, don't change current product index yet
                            if (productIndex !== -1) {
                                //console.log('Updating product at index to ongoing:', productIndex);
                            }

                            // Update the product status to ongoing
                            return prevProducts.map(p => {
                                if (p.product.productId === productId) {
                                    return {
                                        ...p,
                                        bidStatus: 'ongoing',
                                        currentBid: notification.data?.product.currentBid,
                                        // Keep other product properties intact
                                    };
                                }
                                return p;
                            });
                        });
                    }

                    // Update the winning notification with the winner
                    if (notification.data.bidWinner && notification.data.bidWinner.buyer) {
                        const winner = notification.data.bidWinner.buyer;
                        const username = winner.username || `${winner.firstName} ${winner.lastName}`.trim();
                        const avatar = winner.profileImage?.url || undefined;
                        const initials = getInitials(winner.firstName, winner.lastName);

                        setCurrentBidWinner({
                            username,
                            avatar,
                            initials,
                            bidAmount: notification.data.bidWinner.bidAmount,
                            isWinner: true // This is a winner
                        });
                    }
                }
                break;

            case 'auction_end':
                //console.log('Auction ended for product:', notification);
                // Update UI to show auction end event
                setLiveComments(prev => [...prev, notification]);

                // Update the product status in streamProducts
                if (notification.data && notification.data.product) {
                    const productId = notification.data.product.product?.productId;

                    if (productId) {
                        setStreamProducts(prevProducts => {
                            return prevProducts.map(p => {
                                if (p.product.productId === productId) {
                                    return {
                                        ...p,
                                        bidStatus: 'ongoing'
                                    };
                                }
                                return p;
                            });
                        });
                    }
                }
                break;

            default:
                //console.log('Unhandled notification type:', notification.type);
                // Add to comments for display
                setLiveComments(prev => [...prev, notification]);
                break;
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
    }, [liveComments, streamProducts, detailedViewers]);

    const handleWebViewMessage = (event: { nativeEvent: { data: string } }) => {
        const message = event.nativeEvent.data;
        console.log('WebView message:', message);

        if (message.startsWith('error:')) {
            setStatus(message.replace('error:', 'Error: '));
            setIsLoading(false);
            return;
        }

        if (message === 'joined_channel') {
            setStatus('Connected to channel');
            setIsLoading(false);
        } else if (message.startsWith('user_published:')) {
            const parts = message.split(':');
            if (parts.length >= 3) {
                const mediaType = parts[2]; // Format is "user_published:uid:mediaType"
                setStatus(`Host ${mediaType} stream playing`);
                setIsLoading(false);
            }
        } else if (message === 'no_host_present') {
            // Handle no host present message
            setIsHostPresent(false);
            setShowNoHostAlert(true);
            setStatus('No host present');
            setIsLoading(false);
        } else if (message === 'host_video_detected' || message === 'video_playing:') {
            // Host has joined with video
            setIsHostPresent(true);
            setShowNoHostAlert(false);
            setStatus('Host stream playing');
            setIsVideoPlaying(true);
            setIsLoading(false);
        } else if (message === 'host_left_video' || message === 'all_hosts_left') {
            // Host has left
            setIsHostPresent(false);
            setShowNoHostAlert(true);
            setStatus('Host left the stream');
        } else if (message.startsWith('user_unpublished:')) {
            const parts = message.split(':');
            if (parts.length >= 3) {
                const mediaType = parts[2]; // Format is "user_unpublished:uid:mediaType"

                // Only display notification when a video stream is unpublished
                if (mediaType === 'video') {
                    // Add a notification to the chat that host left
                    const hostLeftNotification = {
                        id: Date.now().toString(),
                        type: 'hostLeft' as const,
                        user: storeInfo.name,
                        avatar: storeInfo.avatar,
                        content: 'Host left room',
                        timestamp: new Date()
                    };

                    // Add notification to the comments
                    setLiveComments(prev => [...prev, hostLeftNotification]);

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
        } else if (message.startsWith('video_reconnected:') || message.startsWith('user_rejoined:')) {
            // This message is triggered when a previously disconnected user rejoins
            // Add notification that host has rejoined if we previously saw them leave
            const hasHostLeftPreviously = liveComments.some(comment => comment.type === 'hostLeft');

            if (hasHostLeftPreviously) {
                const hostRejoinedNotification = {
                    id: Date.now().toString(),
                    type: 'hostRejoin' as const,
                    user: storeInfo.name,
                    avatar: storeInfo.avatar,
                    content: 'rejoined room',
                    timestamp: new Date()
                };

                // Add notification to the comments
                setLiveComments(prev => [...prev, hostRejoinedNotification]);

                // Scroll to show the notification
                requestAnimationFrame(() => {
                    setTimeout(() => {
                        if (commentsListRef.current) {
                            commentsListRef.current.scrollToEnd({ animated: true });
                        }
                    }, 100);
                });

                setStatus('Host video reconnected');
                setIsVideoPlaying(true);
                setIsHostPresent(true);
                setShowNoHostAlert(false);
                setIsLoading(false);
            }
        } else if (message.startsWith('video_playing:')) {
            // Set video playing state to true when we get confirmation video is playing
            setIsVideoPlaying(true);
            setIsHostPresent(true);
            setShowNoHostAlert(false);
            setIsLoading(false);
        } else if (message.startsWith('connection:')) {
            const parts = message.split(':');
            if (parts.length >= 2) {
                const state = parts[1];
                setStatus(`Connection: ${state}`);
            }
        } else if (message === 'all_audio_muted') {
            //console.log('Audio muted successfully');
        } else if (message === 'all_audio_unmuted') {
            //console.log('Audio unmuted successfully');
        } else if (message.startsWith('audio_muted:') || message.startsWith('audio_unmuted:')) {
            //console.log(message);
        } else {
            setStatus(message);
        }
    };

    const handleShare = () => {
        // Implement share functionality
        //console.log('Share stream');
    };

    // Toggle audio mute/unmute
    const toggleMute = useCallback(() => {
        const newMuteState = !isMuted;
        setIsMuted(newMuteState);

        // Send message to WebView to handle audio muting
        if (webViewRef.current) {
            const message = newMuteState ? 'mute_audio' : 'unmute_audio';
            webViewRef.current.injectJavaScript(`
                if (window.toggleAudioMute) {
                    window.toggleAudioMute(${newMuteState});
                    true;
                }
            `);
        }

        show({
            text1: 'Audio ' + (newMuteState ? 'muted' : 'unmuted'),
            type: 'info',
            duration: 2000,
            topPosition: 10
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
        const hasValidAvatar = item.avatar &&
            (typeof item.avatar === 'string' || typeof item.avatar === 'number' || item.avatar.uri);

        // Generate a consistent color based on the user's name
        const getAvatarColor = (username: string) => {
            // Array of vibrant background colors for letter avatars
            const colors = [
                '#FF5733', // Red-Orange
                '#33A1FF', // Blue
                '#33FF57', // Green
                '#BD33FF', // Purple
                '#FFD133', // Yellow
                '#33FFBD', // Turquoise
                '#FF33BD', // Pink
                '#7D33FF', // Indigo
                '#FF7D33', // Orange
                '#33FF7D', // Mint
                '#FF3333', // Red
                '#33A8FF', // Light Blue
                "#000000"
            ];

            // Use the sum of character codes to select a color
            const charSum = username.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
            return colors[charSum % colors.length];
        };

        // Render avatar - either an image or a fallback letter avatar
        const renderAvatar = () => {
            if (hasValidAvatar) {
                // If avatar exists, format it correctly based on its type
                let avatarSource;
                if (typeof item.avatar === 'string') {
                    avatarSource = { uri: item.avatar };
                } else {
                    avatarSource = item.avatar; // It's already a require() or imported image
                }

                return (
                    <Image
                        source={avatarSource}
                        style={styles.commentAvatar}
                    />
                );
            } else {
                // Use first letter of username with a random background color
                const firstLetter = item.user && item.user.length > 0 ? item.user.charAt(0).toUpperCase() : '?';
                const backgroundColor = getAvatarColor(item.user || '');

                return (
                    <View style={[
                        styles.commentAvatar,
                        {
                            backgroundColor,
                            justifyContent: 'center',
                            alignItems: 'center'
                        }
                    ]}>
                        <Text style={{
                            color: '#FFFFFF',
                            fontWeight: 'bold',
                            fontSize: 16,
                        }}>
                            {firstLetter}
                        </Text>
                    </View>
                );
            }
        };

        if (item.type === 'join') {
            const isCurrentUser = item.data?.isCurrentUser;
            return (
                <View style={[
                    styles.joinCommentItem,
                    isCurrentUser && styles.currentUserJoinItem
                ]}>
                    {renderAvatar()}
                    <View style={styles.joinCommentContent}>
                        <Text style={[
                            styles.commentUser,
                            isCurrentUser && styles.currentUserText
                        ]}>
                            {isCurrentUser ? 'You' : item.user}
                        </Text>
                        <Text style={styles.joinCommentText}>
                            {item.content}
                            {isCurrentUser ? ' 👋 Welcome!' : ' 👋'}
                        </Text>
                    </View>
                </View>
            );
        } else if (item.type === 'leave') {
            // Handle viewer leave comments
            const isCurrentUser = item.data?.buyerId === (getUser() as any)?._id;
            return (
                <View style={styles.leaveCommentItem}>
                    {renderAvatar()}
                    <View style={styles.leaveCommentContent}>
                        <Text style={styles.commentUser}>{item.user}</Text>
                        <Text style={styles.leaveCommentText}>
                            {item.content}
                        </Text>
                    </View>
                </View>
            );
        } else if (item.type === 'purchase') {
            return (
                <View style={styles.purchaseCommentItem}>
                    {renderAvatar()}
                    <View style={styles.purchaseCommentContent}>
                        <Text style={styles.commentUser}>{item.user}</Text>
                        <Text style={styles.purchaseCommentText}>{item.content}</Text>
                    </View>
                </View>
            );
        } else if (item.type === 'hostLeft') {
            return (
                <View style={styles.hostLeftCommentItem}>
                    {renderAvatar()}
                    <View style={styles.hostLeftCommentContent}>
                        <Text style={styles.commentUser}>{item.user}</Text>
                        <Text style={styles.hostLeftCommentText}>{item.content}</Text>
                    </View>
                </View>
            );
        } else if (item.type === 'hostRejoin') {
            return (
                <View style={styles.hostRejoinedCommentItem}>
                    {renderAvatar()}
                    <View style={styles.hostRejoinedCommentContent}>
                        <Text style={styles.commentUser}>{item.user}</Text>
                        <Text style={styles.hostRejoinedCommentText}>{item.content}</Text>
                    </View>
                </View>
            );
        } else if (item.type === 'auction_start') {
            // Handle auction start notification
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
                //console.log('User not authenticated');
                return;
            }

            // Clear input immediately for better UX
            const commentContent = commentInput.trim();
            setCommentInput('');

            // Create a local comment for immediate display
            const localComment = {
                id: Date.now().toString(),
                type: 'comment' as const,
                user: user.firstName || 'User',
                avatar: user.profileImage?.url || require('@/assets/icons/animoji.png'),
                content: commentContent,
                timestamp: new Date()
            };

            // Add to local state for immediate feedback
            //setLiveComments(prev => [...prev, localComment]);

            // Increment comment count locally
            setComments(prev => prev + 1);

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
                socketInstance.emit('stream_comment', {
                    streamId,
                    content: commentContent
                });

                //console.log('Comment sent to server via WebSocket');
            } else {
                //console.error('Socket not connected, comment only saved locally');
            }
        } catch (error) {
            //console.error('Error sending comment:', error);
        }
    };

    // Create a single condition to check if UI should be shown
    const shouldShowUI = streamConfig && !isLoading && isVideoPlaying;


    const handleIncreaseCommentCount = () => {
        setComments(comments + 1);
    };

    const handleCantComment = () => {
        setShowComments(false);
        // Handle auth flow if needed
    };

    // Clean up socket connection when component unmounts
    useEffect(() => {
        return () => {
            //console.log('Disconnecting socket on component unmount');
            disconnectSocket();
        };
    }, []);

    // Format price correctly for Naira (₦)
    const formatPrice = (price: number) => {
        // The price is already in Naira, not cents
        return `₦${price.toLocaleString('en-NG', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        })}`;
    };

    // Function to handle bid submissions
    const handleSubmitBid = (bidAmount: number) => {
        // Get current product if not already selected
        const product = selectedBidProduct || (currentProductIndex !== null && streamProducts && streamProducts.length > 0 ? streamProducts[currentProductIndex] : null);
        console.log('current bid product', product?.product?.name)

        if (!product) {
            console.error('No product selected for bid');
            return;
        }

        try {
            // Validate the bid amount
            if (product.currentBid && bidAmount <= product.currentBid) {
                // Show error alert
                Alert.alert('Invalid Bid', `Your bid must be higher than the current bid of ${formatPrice(product.currentBid)}`);
                return;
            }

            getUser().then(user => {
                console.log('User:', user);
                if (!user) {
                    Alert.alert('Authentication Required', 'Please log in to place bids');
                    return;
                }

                // Create a local notification for the bid
                //console.log(`Submitting bid of ${bidAmount} for product:`, product);

                // Add to user's list of notifications
                const bidNotification: StreamNotification = {
                    id: Date.now().toString(),
                    type: 'new_bid',
                    user: 'System',  // Simplify to just "You" since we're showing user's own bids
                    content: `Your bid of ${formatPrice(bidAmount)} was submitted`,
                    data: {
                        streamId: id as string,
                        productId: product.product.productId,
                        productName: product.product.name,
                        bidAmount: bidAmount,
                    },
                    timestamp: new Date()
                };

                // Display notification in chat interactions
                setLiveComments(prev => [...prev, bidNotification]);

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
                    socketInstance.emit('stream_place_bid', {
                        streamId: id,
                        productId: product.product.productId,
                        bidAmount: bidAmount
                    });

                    //console.log('Bid sent to server:', {
                    //    streamId: id,
                    //    productId: product.product.productId,
                    //    bidAmount: bidAmount
                    //});
                } else {
                    console.error('Socket not connected, cannot submit bid');
                    Alert.alert('Connection Error', 'Unable to connect to bidding service. Please try again.');
                    setIsBidSending(false);
                }

                // Note: We no longer do optimistic updates here as we'll get real-time updates from the server
                // Actual product updates will happen when we receive the 'stream_notification' event

                // Clear bid state
                setBidAmount(null);
            });
        } catch (error) {
            console.error('Error submitting bid:', error);
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

    // Update handleLeaveStream function to actually leave the stream
    const handleLeaveStream = async (backButton: boolean) => {
        if (!id) return;

        try {
            setIsLeavingStream(true);
            //console.log('User requested to leave the stream');

            // Call the leaveStream API endpoint
            const result = await leaveStream(id as string);
            //console.log('Leave stream result:', result);

            // Disconnect the socket
            disconnectSocket();

            // Navigate back to previous screen
            if (!backButton) {
                router.back();
            }
        } catch (error) {
            //console.error('Error leaving stream:', error);
            // Show error message to user if needed
        } finally {
            setIsLeavingStream(false);
            setShowMenuPopover(false);
        }
    };

    // Add handler functions for bid timer events
    const handleBidTimerUpdate = useCallback((data: BidTimerUpdate) => {
        //console.log('Bid timer update received:', data);
        //console.log('Received formattedTime:', data.formattedTime, 'for product:', data.productId);

        // Convert format from "00.11" to "00:11" by replacing the period with a colon
        const formattedTime = data.formattedTime.replace('.', ':');
        //console.log('Converted formattedTime:', formattedTime);

        // Store the timer data using productId as key with the converted format
        setBidTimerData(prev => ({
            ...prev,
            [data.productId]: formattedTime
        }));

        // Log the contents of bidTimerData after update
        setTimeout(() => {
            //console.log('Current bidTimerData:', bidTimerData);
        }, 100);

        // Update streamProducts to ensure bidStatus is 'active' for this product
        setStreamProducts(prev => {
            return prev.map(product => {
                // Check if product ID matches using only productId property
                if (product.product.productId && product.product.productId.toString() === data.productId) {
                    // Only update if status isn't already active to avoid unnecessary rerenders
                    if (product.bidStatus !== 'active') {
                        return {
                            ...product,
                            bidStatus: 'active'
                        };
                    }
                }
                return product;
            });
        });

    }, [bidTimerData]);

    // Handle bid timer complete event
    const handleBidTimerComplete = useCallback((data: BidTimerComplete) => {
        //console.log('Bid timer complete received:', data);

        // Clear timer data for this product
        setBidTimerData(prev => {
            const newData = { ...prev };
            delete newData[data.productId];
            return newData;
        });

        // Update product status to 'ongoing' while waiting for winner determination
        setStreamProducts(prev => {
            return prev.map(product => {
                // Check if product ID matches using only productId property
                if (product.product.productId && product.product.productId.toString() === data.productId) {
                    return {
                        ...product,
                        bidStatus: 'ongoing'
                    };
                }
                return product;
            });
        });

    }, []);

    // Handle auction order created event
    const handleAuctionOrderCreated = useCallback((data: AuctionOrderCreated) => {
        //console.log('Auction order created received:', data);

        // Store the order data
        setActiveOrderCreated(data);

        // Show notification
        setShowOrderCreatedNotification(true);

        // Get first 3 words of product name
        const truncatedName = data.productName.split(' ').slice(0, 3).join(' ');

        // You can also show a toast notification
        show({
            text1: 'Order Created',
            text2: `Your order for ${truncatedName}... has been created`,
            type: 'success',
            duration: 5000,
            topPosition: 18
        });

    }, [show]);

    // Add follow/unfollow handler functions
    const handleFollowSeller = async () => {
        if (!sellerId) {
            console.error('No seller ID available');
            return;
        }

        try {
            setIsFollowingLoading(true);
            await followSellerThroughStream(sellerId, storeInfo.name);
            setIsFollowing(true);
        } catch (error) {
            console.error('Error following seller:', error);
            show({
                text1: "Error",
                text2: "Failed to follow seller. Please try again.",
                type: "error",
                topPosition: 18,
            });
        } finally {
            setIsFollowingLoading(false);
        }
    };

    const handleUnfollowSeller = async () => {
        if (!sellerId) {
            console.error('No seller ID available');
            return;
        }

        try {
            setIsFollowingLoading(true);
            await unfollowSellerThroughStream(sellerId, storeInfo.name);
            setIsFollowing(false);
        } catch (error) {
            console.error('Error unfollowing seller:', error);
            show({
                text1: "Error",
                text2: `Failed to unfollow ${storeInfo.name}. Please try again.`,
                type: "error",
                topPosition: 18,
            });
        } finally {
            setIsFollowingLoading(false);
        }
    };

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <FocusAwareStatusBar barStyle="light-content" backgroundColor="black" />
            <View
                style={{ flex: 1 }}
            >
                <View className="flex-1 bg-black">
                    {/* Agora Video Container */}
                    <View className="absolute w-full h-full">
                        {streamConfig ? (
                            <>
                                <WebView
                                    ref={webViewRef}
                                    source={{
                                        html: streamEngine(
                                            streamConfig?.appId || '',
                                            streamConfig?.channel || '',
                                            streamConfig?.token || '',
                                            streamConfig?.uid || ''
                                        ),
                                    }}
                                    style={styles.fullScreen}
                                    onMessage={handleWebViewMessage}
                                    javaScriptEnabled={true}
                                    allowsInlineMediaPlayback={true}
                                    mediaPlaybackRequiresUserAction={false}
                                    originWhitelist={['*']}
                                />

                                {/* Show play loader while video is loading, but not if we know there's no host */}
                                {(isLoading || (!isVideoPlaying && isHostPresent)) && (
                                    <View style={styles.playButtonOverlay}>
                                        <View style={styles.playButtonContainer}>
                                            <ActivityIndicator size="large" color="#fff" />
                                        </View>
                                    </View>
                                )}

                                {/* No Host Alert */}
                                {showNoHostAlert && !isLoading && (
                                    <View style={styles.noHostOverlay}>
                                        <View style={styles.noHostAlertContainer}>
                                            <View style={styles.noHostIconContainer}>
                                                <MaterialIcons name="videocam-off" size={36} color="#FFFFFF" />
                                            </View>
                                            <Text style={styles.noHostTitle}>Host Unavailable</Text>
                                            <Text style={styles.noHostMessage}>
                                                The host is not in the room at the moment. Please wait or check back later.
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
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>
                                )}
                            </>
                        ) : (
                            <View style={styles.fullScreen2}>
                                <Image
                                    source={require('@/assets/icons/auqli-logo.png')}
                                    className="w-20 h-14"
                                />
                            </View>
                        )}
                    </View>

                    {/* Content Container */}
                    <View style={styles.contentContainer}>
                        {/* Top Actions */}
                        {shouldShowUI && !keyboardVisibleRef.current && (
                            <SafeAreaView style={{ marginTop: insets.top + 15 }}>
                                <View className={`flex-row justify-between items-center px-4`}>
                                    <View className="flex-row items-center gap-4 ">
                                        <View className="flex-row items-center gap-2">
                                            <Image
                                                source={storeInfo.avatar}
                                                className="w-10 h-10 rounded-full"
                                            />
                                            <View>
                                                <Text className="text-white font-LexendDecaMedium text-base">{storeInfo.name}</Text>
                                                <Text className="text-gray-300 text-xs">{storeInfo.username}</Text>
                                            </View>
                                        </View>
                                        {isFollowingLoading ? (
                                            <TouchableOpacity className="bg-[#16783A] h-full px-4 py-1 rounded-full" disabled>
                                                <ActivityIndicator size="small" color="#FFFFFF" />
                                            </TouchableOpacity>
                                        ) : isFollowing ? (
                                            <TouchableOpacity 
                                                className="bg-[#444444] h-full px-4 py-1 rounded-full" 
                                                onPress={handleUnfollowSeller}
                                            >
                                                <Text className="text-white text-sm">Unfollow</Text>
                                            </TouchableOpacity>
                                        ) : (
                                            <TouchableOpacity 
                                                className="bg-[#16783A] h-full px-4 py-1 rounded-full"
                                                onPress={handleFollowSeller}
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
                                            <Entypo name="dots-three-horizontal" size={22} color="#FFF" />
                                        </TouchableOpacity>
                                        {showMenuPopover && (
                                            <View style={{
                                                position: 'absolute',
                                                right: 0,
                                                top: 40,
                                                backgroundColor: 'rgba(255,255,255,0.1)',
                                                borderRadius: 8,
                                                paddingVertical: 8,
                                                paddingHorizontal: 10,
                                                width: 160,
                                                shadowColor: '#000',
                                                shadowOffset: { width: 0, height: 2 },
                                                shadowOpacity: 0.25,
                                                shadowRadius: 3.84,
                                                zIndex: 1000,
                                            }}>
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        toggleMute();
                                                        setShowMenuPopover(false);
                                                    }}
                                                    style={{
                                                        flexDirection: 'row',
                                                        alignItems: 'center',
                                                        paddingVertical: 10,
                                                    }}
                                                >
                                                    {isMuted ? (
                                                        <Ionicons name="volume-mute-outline" size={20} color="#FFF" style={{ marginRight: 10 }} />
                                                    ) : (
                                                        <Ionicons name="volume-medium-outline" size={20} color="#FFF" style={{ marginRight: 10 }} />
                                                    )}
                                                    <Text style={{ color: '#FFF', fontSize: 14 }}>
                                                        {isMuted ? 'Unmute' : 'Mute'}
                                                    </Text>
                                                </TouchableOpacity>

                                                <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 5 }} />

                                                <TouchableOpacity
                                                    onPress={() => {
                                                        if (!isLeavingStream) {
                                                            const backButton = false;
                                                            handleLeaveStream(backButton);
                                                        }
                                                    }}
                                                    disabled={isLeavingStream}
                                                    style={{
                                                        flexDirection: 'row',
                                                        alignItems: 'center',
                                                        paddingVertical: 10,
                                                    }}
                                                >
                                                    {isLeavingStream ? (
                                                        <ActivityIndicator size="small" color="#FF5555" style={{ marginRight: 10 }} />
                                                    ) : (
                                                        <Ionicons name="exit-outline" size={20} color="#FF5555" style={{ marginRight: 10 }} />
                                                    )}
                                                    <Text style={{ color: '#FF5555', fontSize: 14 }}>
                                                        {isLeavingStream ? 'Leaving...' : 'Leave'}
                                                    </Text>
                                                </TouchableOpacity>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            </SafeAreaView>
                        )}

                        {/* Main Content Area */}
                        <View style={styles.mainContentArea}>
                            {/* Right Side Actions */}
                            {shouldShowUI && !keyboardVisibleRef.current && (
                                <ScrollView showsVerticalScrollIndicator={false} style={styles.rightActionsContainer}>
                                    <View style={styles.actionItem}>
                                        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                                            <SimpleLineIcons name="share-alt" size={22} color="white" />
                                        </TouchableOpacity>
                                        <Text style={styles.actionText}>Share</Text>
                                    </View>

                                    <View style={styles.actionItem}>
                                        <TouchableOpacity style={styles.actionButton} onPress={handleShowStreamInfo}>
                                            <Ionicons name="information-circle-outline" size={24} color="white" />
                                        </TouchableOpacity>
                                        <Text style={styles.actionText}>Info</Text>
                                    </View>

                                    {/*<View style={styles.actionItem}>
                                        <TouchableOpacity style={styles.actionButton}>
                                        <Ionicons name="card-outline" size={24} color="white" />
                                        </TouchableOpacity>
                                        <Text style={styles.actionText}>Pay</Text>
                                    </View>*/}

                                    <View style={styles.actionItem}>
                                        <TouchableOpacity style={styles.actionButton}>
                                            <MaterialCommunityIcons name="package-variant-closed" size={24} color="white" />
                                        </TouchableOpacity>
                                        <Text style={styles.actionText}>Orders</Text>
                                    </View>

                                    <View style={styles.actionItem}>
                                        <TouchableOpacity style={styles.actionButton}>
                                            <MaterialCommunityIcons name="storefront-outline" size={24} color="white" />
                                        </TouchableOpacity>
                                        <Text style={styles.actionText}>Shop</Text>
                                    </View>

                                    <View style={styles.actionItem}>
                                        <TouchableOpacity style={styles.actionButton}>
                                            <AntDesign name="like2" size={24} color="white" />
                                        </TouchableOpacity>
                                        <Text style={styles.actionText}>React</Text>
                                    </View>
                                </ScrollView>
                            )}

                            {/* Live Comments Section */}
                            {shouldShowUI && (
                                <View style={styles.commentsContainer}>
                                    <FlatList
                                        ref={commentsListRef}
                                        data={liveComments}
                                        renderItem={renderCommentItem}
                                        keyExtractor={item => item.id}
                                        showsVerticalScrollIndicator={false}
                                        contentContainerStyle={styles.commentsList}
                                        fadingEdgeLength={350}
                                        onLayout={() => {
                                            // Scroll to end on initial layout
                                            if (commentsListRef.current && liveComments.length > 0) {
                                                setTimeout(() => {
                                                    commentsListRef.current?.scrollToEnd({
                                                        animated: true
                                                    });
                                                }, 100);
                                            }
                                        }}
                                        onContentSizeChange={() => {
                                            // Scroll to end when content size changes
                                            if (commentsListRef.current && liveComments.length > 0) {
                                                setTimeout(() => {
                                                    commentsListRef.current?.scrollToEnd({
                                                        animated: true
                                                    });
                                                }, 100);
                                            }
                                        }}
                                        maintainVisibleContentPosition={{
                                            minIndexForVisible: 0,
                                            autoscrollToTopThreshold: 10
                                        }}
                                        removeClippedSubviews={false}
                                        initialNumToRender={20}
                                        maxToRenderPerBatch={20}
                                        windowSize={21}
                                    />
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
                                            <Ionicons name="send" size={22} color={commentInput.trim() ? "#16783A" : "#666"} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}

                            {/* Bottom Product Card */}
                            {shouldShowUI && streamProducts.length > 0 && (
                                <>
                                    {/* Winning Notification */}
                                    {
                                        !keyboardVisibleRef.current && currentBidWinner && (
                                            <View style={styles.winningNotificationContainer}>
                                                <View style={styles.winningNotificationAvatar}>
                                                    {currentBidWinner.avatar ? (
                                                        <Image
                                                            source={{ uri: currentBidWinner.avatar }}
                                                            style={styles.winningAvatarImage}
                                                        />
                                                    ) : (
                                                        <Text style={styles.avatarLetter}>
                                                            {currentBidWinner.initials || '?'}
                                                        </Text>
                                                    )}
                                                </View>
                                                <Text style={styles.winningUsername}>
                                                    {currentBidWinner.username}
                                                    <Text style={styles.winningText}> {currentBidWinner.isWinner ? 'won' : 'is'} </Text>
                                                    <Text style={styles.winningHighlight}>
                                                        {currentBidWinner.isWinner ? 'bid!' : 'winning!'}
                                                    </Text>
                                                </Text>
                                            </View>
                                        )
                                    }

                                    {/* Auction Product Card */}
                                    <View style={styles.auctionProductCardContainer}>
                                        {streamProducts.length > 0 && !keyboardVisibleRef.current && (
                                            <>
                                                <LiveAuctionProductCard
                                                    product={{
                                                        name: streamProducts[currentProductIndex].product.name,
                                                        description: streamProducts[currentProductIndex].product.description,
                                                        price: streamProducts[currentProductIndex].product.price,
                                                        currentBid: streamProducts[currentProductIndex].currentBid || streamProducts[currentProductIndex].minBid,
                                                        minBid: streamProducts[currentProductIndex].minBid,
                                                        maxBid: streamProducts[currentProductIndex].maxBid,
                                                        images: streamProducts[currentProductIndex].product.images || [],
                                                        productId: streamProducts[currentProductIndex].product.productId,
                                                        quantity: streamProducts[currentProductIndex].product.quantity,
                                                        bidStatus: streamProducts[currentProductIndex].bidStatus || 'pending'
                                                    }}
                                                    onBid={(amount) => {
                                                        // Set the selectedBidProduct to ensure future interactions work correctly
                                                        setSelectedBidProduct(streamProducts[currentProductIndex]);
                                                        handleSubmitBid(amount);
                                                    }}
                                                    onCustom={() => handleOpenBidVariation(streamProducts[currentProductIndex])}
                                                    formatPrice={formatPrice}
                                                    category={streamDetails.category}
                                                    tag={streamDetails.tags}
                                                    bidIncrement={selectedBidIncrement}
                                                    isBidSending={isBidSending}
                                                    bidTimeRemaining={
                                                        (() => {
                                                            const productId = streamProducts[currentProductIndex].product.productId;
                                                            const timeValue = productId && bidTimerData[productId]
                                                                ? bidTimerData[productId]
                                                                : "00:30";
                                                            //console.log(`Debug - Passing timer for product ${productId}:`, timeValue, 
                                                            //    'Status:', streamProducts[currentProductIndex].bidStatus,
                                                            //    'bidTimerData:', bidTimerData);
                                                            return timeValue;
                                                        })()
                                                    }
                                                />
                                            </>
                                        )}
                                    </View>
                                </>
                            )}
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
                        closeSheet={() => setShowCheckout(false)}
                        sellerId={(selectedProduct.seller as any)?._id ||
                            (activeStreamDetails?.stream?.seller?._id || '')}
                        channel="liveshow"
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
            >
                {selectedBidProduct && (
                    <BidVariationSelector
                        currentBid={selectedBidProduct.currentBid || selectedBidProduct.minBid || selectedBidProduct.product.price}
                        onSelectBidAmount={(amount) => {
                            setShowBidVariation(false);
                            // Calculate and save the selected increment
                            const currentBid = selectedBidProduct.currentBid || selectedBidProduct.minBid || selectedBidProduct.product.price;
                            const increment = amount - currentBid;
                            setSelectedBidIncrement(increment);
                            handleSubmitBid(amount);
                        }}
                        onCustomBid={(amount) => {
                            setShowBidVariation(false);
                            // Calculate and save the selected increment
                            const currentBid = selectedBidProduct.currentBid || selectedBidProduct.minBid || selectedBidProduct.product.price;
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
            >
                <StreamViewers
                    viewers={detailedViewers}
                    hostInfo={{
                        name: storeInfo.name,
                        avatar: storeInfo.avatar
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
            //enableContentPanningGesture={true}
            >
                <StreamInfo
                    storeInfo={storeInfo}
                    streamInfo={streamDetails}
                    isLoading={isLoading}
                    closeSheet={() => setShowStreamInfo(false)}
                />
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
            >
                {activeOrderCreated && (
                    <OrderCreatedNotification
                        order={activeOrderCreated}
                        closeSheet={() => setShowOrderCreatedNotification(false)}
                        onViewOrder={(orderId) => {
                            setShowOrderCreatedNotification(false);
                            router.push(`/orders/orders`);
                        }}
                        formatPrice={formatPrice}
                    />
                )}
            </BottomSheet>
        </GestureHandlerRootView>
    );
};

const styles = StyleSheet.create({
    fullScreen: {
        flex: 1,
        width: '100%',
        height: '100%',
        position: 'absolute',
    },
    fullScreen2: {
        flex: 1,
        width: '100%',
        height: '100%',
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#000000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    statusText: {
        color: '#fff',
        marginTop: 10,
    },
    contentContainer: {
        flex: 1,
        position: 'relative',
    },
    mainContentArea: {
        height: '51%',
        position: 'relative',
    },
    bottomArea: {
        position: 'relative',
        paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    },
    bottomProductCardContainer: {
        position: 'relative',
        padding: 16,
        marginTop: 10,
    },
    commentInputContainer: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        zIndex: 10,
    },
    rightActionsContainer: {
        position: 'absolute',
        right: 13,
        bottom: 30,
        maxHeight: 220,
        zIndex: 10,
    },
    commentsContainer: {
        position: 'absolute',
        bottom: 30,
        left: 0,
        width: '70%',
        maxHeight: 200,
        zIndex: 10,
    },
    commentsList: {
        paddingHorizontal: 8,
        paddingTop: 10,
        paddingBottom: 0,
        width: '100%',
    },
    commentAvatar: {
        width: 35,
        height: 35,
        borderRadius: 35,
        marginRight: 8,
    },
    commentUser: {
        color: '#fff',
        fontSize: 14,
        marginBottom: 2,
    },
    joinCommentItem: {
        flexDirection: 'row',
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 12,
        marginBottom: 0,
        maxWidth: '100%',
        alignSelf: 'flex-start',
        flex: 1,
    },
    joinCommentContent: {
        flexDirection: 'column',
        flex: 1,
    },
    joinCommentText: {
        color: '#FFEB3B', // Yellow text for "joined the stream"
        fontSize: 12,
        fontFamily: 'LexendDeca',
        fontWeight: 'bold',
        flexWrap: 'wrap',
    },
    purchaseCommentItem: {
        flexDirection: 'row',
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 12,
        marginBottom: 0,
        maxWidth: '100%',
        alignSelf: 'flex-start',
        flex: 1,
    },
    purchaseCommentContent: {
        flexDirection: 'column',
        flex: 1,
    },
    purchaseCommentText: {
        color: '#16783A',
        fontSize: 12,
        fontWeight: 'bold',
        flexWrap: 'wrap',
    },
    regularCommentItem: {
        flexDirection: 'row',
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 12,
        marginBottom: 0,
        maxWidth: '100%',
        alignSelf: 'flex-start',
        flex: 1,
    },
    regularCommentContent: {
        flexDirection: 'column',
        flex: 1,
    },
    regularCommentText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
        flexWrap: 'wrap',
    },
    commentInput: {
        color: '#fff',
        borderWidth: 0,
        paddingVertical: 15,
        paddingHorizontal: 15,
        fontSize: 14,
        flex: 1,
        backgroundColor: 'transparent',
    },
    inputWithButtonContainer: {
        height: 55,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ffffff',
        borderRadius: 30,
        backgroundColor: 'rgba(50, 50, 50, 0.2)',
    },
    sendButton: {
        padding: 12,
        marginRight: 5,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    playButtonOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#000000',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    playButtonContainer: {
        backgroundColor: '#000000',
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
        alignItems: 'center',
        marginBottom: 0,
    },
    actionButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionText: {
        color: 'white',
        fontSize: 12,
        marginTop: 4,
    },
    currentUserJoinItem: {
        backgroundColor: 'rgba(22, 120, 58, 0.2)', // Light green background for current user
    },
    currentUserText: {
        color: '#16783A', // Green text for current user
        fontWeight: 'bold',
    },
    winningNotificationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 16,
        paddingRight: 16,
    },
    winningNotificationAvatar: {
        width: 25,
        height: 25,
        borderRadius: 15,
        backgroundColor: '#6A5ACD', // Purple color for the avatar
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    avatarLetter: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    winningUsername: {
        color: '#fff',
        fontSize: 13,
        fontWeight: 'bold',
    },
    winningText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: 'normal',
    },
    winningHighlight: {
        color: '#16783A',
        fontWeight: 'bold',
        fontSize: 13,
    },
    auctionProductCardContainer: {
        paddingHorizontal: 16,
        marginBottom: 20,
    },
    hostLeftCommentItem: {
        flexDirection: 'row',
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 12,
        marginBottom: 0,
        maxWidth: '100%',
        alignSelf: 'flex-start',
        flex: 1,
    },
    hostLeftCommentContent: {
        flexDirection: 'column',
        flex: 1,
    },
    hostLeftCommentText: {
        color: '#ff5555', // Red text for "left room"
        fontSize: 12,
        fontFamily: 'LexendDeca',
        fontWeight: 'bold',
        flexWrap: 'wrap',
    },
    hostRejoinedCommentItem: {
        flexDirection: 'row',
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 12,
        marginBottom: 0,
        maxWidth: '100%',
        alignSelf: 'flex-start',
        flex: 1,
    },
    hostRejoinedCommentContent: {
        flexDirection: 'column',
        flex: 1,
    },
    hostRejoinedCommentText: {
        color: '#16783A', // Green text for "rejoined room"
        fontSize: 12,
        fontFamily: 'LexendDeca',
        fontWeight: 'bold',
        flexWrap: 'wrap',
    },
    productNavigationContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        paddingHorizontal: 10,
    },
    navButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    productCounter: {
        color: '#fff',
        fontSize: 14,
        fontFamily: 'LexendDeca',
    },
    leaveCommentItem: {
        flexDirection: 'row',
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 12,
        marginBottom: 0,
        maxWidth: '100%',
        alignSelf: 'flex-start',
        flex: 1,
    },
    leaveCommentContent: {
        flexDirection: 'column',
        flex: 1,
    },
    leaveCommentText: {
        color: '#ff5555', // Red text for "left room"
        fontSize: 12,
        fontFamily: 'LexendDeca',
        fontWeight: 'bold',
        flexWrap: 'wrap',
    },
    auctionStartCommentItem: {
        flexDirection: 'row',
        borderRadius: 20,
        paddingVertical: 4,
        paddingHorizontal: 12,
        marginVertical: 8,
        maxWidth: '100%',
        alignSelf: 'flex-start',
        flex: 1,
        backgroundColor: 'rgba(255, 235, 59, 0.2)', // Light Yellow background (#FFEB3B)
    },
    auctionStartCommentContent: {
        flexDirection: 'column',
        flex: 1,
    },
    auctionCommentUser: {
        color: '#FFEB3B',
        fontWeight: 'bold',
    },
    auctionStartCommentText: {
        color: '#fff',
        fontSize: 12,
        fontFamily: 'LexendDeca',
        fontWeight: 'semibold',
        flexWrap: 'wrap',
    },
    winningAvatarImage: {
        width: 25,
        height: 25,
        borderRadius: 15,
    },
    orderCreatedContainer: {
        position: 'absolute',
        bottom: 120, // Position above the LiveAuctionProductCard
        left: 16,
        right: 16,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderRadius: 12,
        padding: 16,
        zIndex: 1000,
    },
    orderCreatedContent: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    orderCreatedIcon: {
        marginRight: 12,
    },
    orderCreatedTextContainer: {
        flex: 1,
    },
    orderCreatedTitle: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 16,
        marginBottom: 4,
    },
    orderCreatedText: {
        color: '#DDD',
        fontSize: 14,
    },
    orderCreatedInfo: {
        color: '#16783A',
        fontWeight: 'bold',
        fontSize: 14,
        marginTop: 4,
    },
    orderCreatedCloseButton: {
        padding: 8,
    },
    orderCreatedViewButton: {
        backgroundColor: '#16783A',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    orderCreatedViewButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 14,
        marginRight: 8,
    },
    noHostOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 20,
    },
    noHostAlertContainer: {
        width: '80%',
        backgroundColor: '#1E1E1E',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 10,
        },
        shadowOpacity: 0.5,
        shadowRadius: 15,
        elevation: 20,
    },
    noHostIconContainer: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#FF5555',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    noHostTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 12,
        textAlign: 'center',
    },
    noHostMessage: {
        fontSize: 16,
        color: '#CCCCCC',
        marginBottom: 24,
        textAlign: 'center',
        lineHeight: 22,
    },
    buttonContainer: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
        gap: 10,
    },
    waitButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 30,
        flex: 1,
        alignItems: 'center',
    },
    waitButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    leaveButton: {
        backgroundColor: '#16783A',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 30,
        flex: 1,
        alignItems: 'center',
    },
    leaveButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
});

export default LiveAuctionStudio;