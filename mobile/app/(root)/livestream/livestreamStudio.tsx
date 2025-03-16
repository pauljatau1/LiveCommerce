import { View, Text, Image, TouchableOpacity, Dimensions, SafeAreaView, StyleSheet, FlatList, TextInput, KeyboardAvoidingView, Animated, Platform, Keyboard, ScrollView } from 'react-native';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useLocalSearchParams } from 'expo-router';
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
import { initializeSocket, disconnectSocket, getSocket, StreamNotification } from './socketHandler';
import { SOCKET_EVENTS } from '@/constants/api';
import { LinearGradient } from 'expo-linear-gradient';
import ProductPreview from '@/components/blips/productPreview';
import CheckoutNow from '@/components/blips/checkoutNow';

const { width, height } = Dimensions.get('window');

const LivestreamStudio = () => {
    const { id } = useLocalSearchParams();
    const { activeStreamDetails, joinStream, fetchActiveStreamDetails } = useLivestream() as LivestreamContextType;
    const [streamConfig, setStreamConfig] = useState<StreamConfig | null>(null);
    const [status, setStatus] = useState('Initializing...');
    const [isLoading, setIsLoading] = useState(true);

    // UI interaction states
    const [likes, setLikes] = useState(23500);
    const [liked, setLiked] = useState(false);
    const [comments, setComments] = useState(1200);
    const [showComments, setShowComments] = useState(false);
    const [comment, setComment] = useState('');
    const [streamProducts, setStreamProducts] = useState<StreamProduct[]>([]);
    const [currentProductIndex, setCurrentProductIndex] = useState(0);
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
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    // New state for live comments and events
    const [liveComments, setLiveComments] = useState<Array<{
        id: string;
        type: 'comment' | 'join' | 'purchase';
        user: string;
        avatar?: any;
        content: string;
        timestamp: Date;
    }>>([]);
    const [commentInput, setCommentInput] = useState('');
    const commentsListRef = useRef<FlatList>(null);
    // Add a new state to track if video is actually playing
    const [isVideoPlaying, setIsVideoPlaying] = useState(false);
    // Replace standard state with refs for instant updates
    const keyboardHeightRef = useRef(0);
    const keyboardVisibleRef = useRef(false);
    const [, forceUpdate] = useState({});
    const { width: screenWidth } = Dimensions.get('window');

    useEffect(() => {
        setupLivestream();

        // Add sample comments and events for demonstration that match the reference image
        const sampleEvents = [
            {
                id: '1',
                type: 'join' as const,
                user: 'Ahmed',
                avatar: null, // Test fallback avatar
                content: 'joined the stream',
                timestamp: new Date(Date.now() - 5000)
            },
            {
                id: '2',
                type: 'comment' as const,
                user: 'Jessica',
                avatar: require('@/assets/icons/animoji.png'), // With image
                content: 'This blue shirt looks amazing!',
                timestamp: new Date(Date.now() - 15000)
            },
            {
                id: '3',
                type: 'purchase' as const,
                user: 'Michael',
                avatar: null, // Test fallback avatar
                content: 'purchased Blue Polo Shirt',
                timestamp: new Date(Date.now() - 30000)
            },
            {
                id: '4',
                type: 'join' as const,
                user: 'User1638',
                avatar: null, // Test fallback avatar
                content: 'joined the stream',
                timestamp: new Date(Date.now() - 2000)
            },
            {
                id: '5',
                type: 'comment' as const,
                user: 'User1638',
                avatar: null, // Test fallback avatar
                content: 'This blue shirt looks amazing!',
                timestamp: new Date(Date.now() - 10000)
            },
            {
                id: '6',
                type: 'comment' as const,
                user: 'User1638',
                avatar: null, // Test fallback avatar
                content: 'This blue shirt looks amazing!',
                timestamp: new Date(Date.now() - 10000)
            },
        ];

        // Initialize with sample data
        //setLiveComments(sampleEvents);

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

    console.log('keyboardHeightRef', keyboardHeightRef.current);
    console.log('keyboardVisibleRef', keyboardVisibleRef.current);
    const setupLivestream = async () => {
        if (!id) return;
        try {
            setStatus('Joining stream...');

            // Join the stream using the stream ID from route parameters
            const streamDetails = await joinStream(id as string);
            console.log('Stream details:', streamDetails);

            // Set stream metadata if available from API
            if (streamDetails) {
                // Update likes and comments if available from API
                if (streamDetails.likes) setLikes(streamDetails.likes);
                if (streamDetails.comments) setComments(streamDetails.comments);

                // Set products from stream data
                if (streamDetails.products && streamDetails.products.length > 0) {
                    setStreamProducts(streamDetails.products);
                } else if (streamDetails.stream?.products && streamDetails.stream.products.length > 0) {
                    console.log('New Stream products:', streamDetails.stream.products);
                    setStreamProducts(streamDetails.stream.products);
                }

                // Debug seller information
                console.log('Seller info from API:', streamDetails.seller);
                console.log('Stream info:', streamDetails.stream);

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
                    console.log('Using seller data from stream.seller:', sellerData);

                    const newStoreInfo = {
                        name: sellerData.storeName || sellerData.businessName || 'Store Name',
                        username: `@${(sellerData.storeName || sellerData.businessName || 'username').toLowerCase().replace(/\s+/g, '')}`,
                        avatar: sellerData.storeAvatar?.url
                            ? { uri: sellerData.storeAvatar.url }
                            : require('@/assets/icons/animoji.png')
                    };

                    console.log('Setting store info to:', newStoreInfo);
                    setStoreInfo(newStoreInfo);
                }
                // If seller info is directly in streamDetails
                else if (streamDetails.seller) {
                    console.log('Using seller data from streamDetails.seller');

                    const sellerData = streamDetails.seller;
                    const newStoreInfo = {
                        name: sellerData.storeName || sellerData.businessName || 'Store Name',
                        username: `@${(sellerData.storeName || sellerData.businessName || 'username').toLowerCase().replace(/\s+/g, '')}`,
                        avatar: sellerData.storeAvatar?.url
                            ? { uri: sellerData.storeAvatar.url }
                            : require('@/assets/icons/animoji.png')
                    };

                    console.log('Setting store info to:', newStoreInfo);
                    setStoreInfo(newStoreInfo);
                }
            }

            // Set initial viewer count if available
            if (streamDetails?.stream) {
                const streamData = streamDetails.stream as any;
                if (typeof streamData.viewerCount === 'number') {
                    setViewerCount(streamData.viewerCount);
                } else if (Array.isArray(streamData.viewers)) {
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

            // Directly use the chat interactions from the server
            const chatInteractions = (streamDetails.stream as any).chatInteractions || [];

            // Set the live comments with the server data
            setLiveComments(chatInteractions);

            console.log(`Loaded ${chatInteractions.length} chat interactions from server`);
            // Use requestAnimationFrame to ensure UI has updated before scrolling
            if (chatInteractions.length > 0) {
                requestAnimationFrame(() => {

                    if (commentsListRef.current) {
                        commentsListRef.current.scrollToEnd({ animated: false });
                    }
                });
            }


            // Initialize socket connection for real-time chat
            const userToken = await getToken();
            if (userToken) {
                initializeSocket(userToken, handleStreamNotification);
            }
        } catch (error) {
            console.error('Error setting up livestream:', error);
            setStatus('Error: ' + (error as Error).message);
        }
    };

    // Handler for WebSocket notifications (joins, comments, purchases)
    const handleStreamNotification = useCallback((notification: StreamNotification) => {
        console.log('Received notification:', notification);

        // Check if this is our own comment coming back (avoid duplicates)
        const isDuplicate = liveComments.some(comment =>
            comment.type === notification.type &&
            comment.content === notification.content &&
            Math.abs(new Date(comment.timestamp).getTime() - new Date(notification.timestamp).getTime()) < 5000
        );

        if (isDuplicate) {
            console.log('Ignoring duplicate notification');
            return;
        }

        // Process notification based on type
        switch (notification.type) {
            case 'join':
                console.log('User joined stream:', notification.user);
                // Update UI to show join event
                setLiveComments(prev => [...prev, notification]);
                // Update viewer count if available in notification data
                if (notification.data && 'viewerCount' in notification.data) {
                    setViewerCount(notification.data.viewerCount as number);
                }
                break;

            case 'comment':
                console.log('New comment received:', notification.content);
                // Update UI to show comment
                setLiveComments(prev => [...prev, notification]);
                // Increment comment count
                setComments(prev => prev + 1);
                break;

            case 'purchase':
                console.log('New purchase made:', notification.content);
                // Update UI to show purchase
                setLiveComments(prev => [...prev, notification]);
                break;

            default:
                console.warn('Unknown notification type:', notification.type);
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
    }, []);

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
        } else if (message.startsWith('video_playing:')) {
            // Set video playing state to true when we get confirmation video is playing
            setIsVideoPlaying(true);
            setIsLoading(false);
        } else if (message.startsWith('connection:')) {
            const parts = message.split(':');
            if (parts.length >= 2) {
                const state = parts[1];
                setStatus(`Connection: ${state}`);
            }
        } else if (message === 'all_audio_muted') {
            console.log('Audio muted successfully');
        } else if (message === 'all_audio_unmuted') {
            console.log('Audio unmuted successfully');
        } else if (message.startsWith('audio_muted:') || message.startsWith('audio_unmuted:')) {
            console.log(message);
        } else {
            setStatus(message);
        }
    };

    const handleShare = () => {
        // Implement share functionality
        console.log('Share stream');
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
    }, [isMuted]);

    // Product buy handler
    const handleBuyNow = (product: Product) => {
        // Set the selected product and show checkout
        setSelectedProduct(product);
        setShowCheckout(true);
        console.log('Buy product:', product.name);
    };

    // Product preview handler
    const handleProductPreview = (product: Product) => {
        // Set the selected product and show preview
        setSelectedProduct(product);
        setShowProductPreview(true);
        console.log('Preview product:', product.name);
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
            return (
                <View style={styles.joinCommentItem}>
                    {renderAvatar()}
                    <View style={styles.joinCommentContent}>
                        <Text style={styles.commentUser}>{item.user}</Text>
                        <Text style={styles.joinCommentText}>{item.content}👋</Text>
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
                console.log('User not authenticated');
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

                console.log('Comment sent to server via WebSocket');
            } else {
                console.error('Socket not connected, comment only saved locally');
            }
        } catch (error) {
            console.error('Error sending comment:', error);
        }
    };

    // Create a single condition to check if UI should be shown
    const shouldShowUI = streamConfig && !isLoading && isVideoPlaying;

    // Update the animated style functions to use the ref directly
    const getCommentContainerStyle = useCallback(() => {
        const DEFAULT_BOTTOM = 230;
        const KEYBOARD_OFFSET = 60;

        return {
            ...styles.commentsContainer,
            bottom: keyboardVisibleRef.current
                ? keyboardHeightRef.current + KEYBOARD_OFFSET
                : DEFAULT_BOTTOM
        };
    }, []);

    const getRightActionsStyle = useCallback(() => {
        const DEFAULT_BOTTOM = 230;
        const KEYBOARD_OFFSET = 200;

        return {
            ...styles.rightActionsContainer,
            bottom: keyboardVisibleRef.current
                ? keyboardHeightRef.current + KEYBOARD_OFFSET
                : DEFAULT_BOTTOM
        };
    }, []);

    const getCommentInputStyle = useCallback(() => {
        const DEFAULT_BOTTOM = 130;
        const GAP_SIZE = 15;

        return {
            ...styles.commentInputContainer,
            bottom: keyboardVisibleRef.current
                ? keyboardHeightRef.current - 15
                : DEFAULT_BOTTOM
        };
    }, []);

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
            console.log('Disconnecting socket on component unmount');
            disconnectSocket();
        };
    }, []);

    return (
        <>
            <FocusAwareStatusBar barStyle="light-content" backgroundColor="black" />
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

                            {/* Show play loader while video is loading */}
                            {(isLoading || !isVideoPlaying) && (
                                <View style={styles.playButtonOverlay}>
                                    <View style={styles.playButtonContainer}>
                                        <ActivityIndicator size="large" color="#fff" />
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

                {/* Top Actions - Only show when video is playing */}
                {shouldShowUI && (
                    <SafeAreaView style={{ flex: 1, marginTop: Platform.OS === 'ios' ? 16 : 14 }}>
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
                                <TouchableOpacity className="bg-[#16783A] h-full px-4 py-1 rounded-md">
                                    <Text className="text-white text-sm">Follow</Text>
                                </TouchableOpacity>
                            </View>
                            <View className="flex-row items-center gap-2">
                                <View className="flex-row items-center px-3 py-2 rounded-full">
                                    <Octicons name="people" size={22} color="#FFF" />
                                    <Text className="text-white ml-1 font-LexendDecaMedium ">
                                        {viewerCount > 999
                                            ? `${(viewerCount / 1000).toFixed(1)}K`
                                            : viewerCount}
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    onPress={toggleMute}
                                    className=" p-2 rounded-full"
                                >
                                    {isMuted ? (
                                        <Ionicons name="volume-mute-outline" size={22} color="#FFF" />
                                    ) : (
                                        <Ionicons name="volume-medium-outline" size={22} color="#FFF" />
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </SafeAreaView>
                )}

                <View>
                    {/* Right Side Actions - Only show when video is playing */}
                    {shouldShowUI && !keyboardVisibleRef.current && (
                        <ScrollView showsVerticalScrollIndicator={false} style={getRightActionsStyle()}>
                            <View style={styles.actionItem}>
                                <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                                    <SimpleLineIcons name="share-alt" size={22} color="white" />
                                </TouchableOpacity>
                                <Text style={styles.actionText}>Share</Text>
                            </View>

                            <View style={styles.actionItem}>
                                <TouchableOpacity style={styles.actionButton}>
                                    <Ionicons name="information-circle-outline" size={24} color="white" />
                                </TouchableOpacity>
                                <Text style={styles.actionText}>Info</Text>
                            </View>

                            <View style={styles.actionItem}>
                                <TouchableOpacity style={styles.actionButton}>
                                <Ionicons name="card-outline" size={24} color="white" />
                                </TouchableOpacity>
                                <Text style={styles.actionText}>Pay</Text>
                            </View>

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
                        <View style={getCommentContainerStyle()}>
                            <FlatList
                                ref={commentsListRef}
                                data={liveComments}
                                renderItem={renderCommentItem}
                                keyExtractor={item => item.id}
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={styles.commentsList}
                                fadingEdgeLength={350}
                                onContentSizeChange={() => {
                                    if (commentsListRef.current && liveComments.length > 0) {
                                        commentsListRef.current.scrollToEnd({ animated: false });
                                    }
                                }}
                            />
                        </View>
                    )}

                    {/* Comment Input */}
                    {shouldShowUI && (
                        <View style={getCommentInputStyle()}>
                            <TextInput
                                style={styles.commentInput}
                                placeholder="Say something..."
                                placeholderTextColor="#999"
                                value={commentInput}
                                onChangeText={setCommentInput}
                                returnKeyType="send"
                                onSubmitEditing={handleSendComment}
                            />
                        </View>
                    )}
                </View>

                {/* Bottom Product Card - Only show when video is playing */}
                {shouldShowUI && streamProducts.length > 0 && (
                    <View className="absolute bottom-0 left-0 right-0 p-4">
                        <Carousel
                            loop
                            autoPlay={true}
                            autoPlayInterval={9000}
                            width={screenWidth - 32} // Account for padding
                            height={90} // Adjust based on your card height
                            data={streamProducts}
                            scrollAnimationDuration={500}
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

            {/* Bottom Sheets for Product Preview and Checkout */}
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
                        productId={selectedProduct._id}
                        closeSheet={() => setShowCheckout(false)}
                        sellerId={(selectedProduct.seller as any)?._id ||
                            (activeStreamDetails?.stream?.seller?._id || '')}
                        channel="liveshow"
                    />
                )}
            </BottomSheet>
        </>
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
    // Right side actions styling to match reference image
    rightActionsContainer: {
        position: 'absolute',
        right: 13,
        bottom: 200, // Position higher to avoid overlap with product card
        maxHeight: 300,
        zIndex: 10,
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
    // Comments styling to match reference image exactly
    commentsContainer: {
        position: 'absolute',
        bottom: 210, // Position higher to avoid overlap with product card
        left: 0,
        width: '70%',
        maxHeight: 200,
        zIndex: 10,
    },
    commentsList: {
        paddingHorizontal: 8,
        paddingTop: 10, // More padding at top to account for the fade effect
        paddingBottom: 0,
    },
    // Base comment item styles
    commentAvatar: {
        width: 35,
        height: 35,
        borderRadius: 35,
        marginRight: 8,
    },
    commentUser: {
        color: '#fff',
        fontSize: 14,
    },
    // Join comment specific styles (green background)
    joinCommentItem: {
        flexDirection: 'row',

        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 12,
        marginBottom: 0,
        maxWidth: '100%',
        alignSelf: 'flex-start',
    },
    joinCommentContent: {
        flexDirection: 'column',
    },
    joinCommentText: {
        color: '#FFEB3B', // Yellow text for "joined the stream"
        fontSize: 12,
        fontFamily: 'LexendDeca',
        fontWeight: 'bold',
    },
    // Purchase comment specific styles (red background)
    purchaseCommentItem: {
        flexDirection: 'row',
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 12,
        marginBottom: 0,
        maxWidth: '100%',
        alignSelf: 'flex-start',
    },
    purchaseCommentContent: {
        flexDirection: 'column',
    },
    purchaseCommentText: {
        color: '#16783A',
        fontSize: 12,
        fontWeight: 'bold',
    },
    // Regular comment specific styles (dark background)
    regularCommentItem: {
        flexDirection: 'row',
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 12,
        marginBottom: 0,
        maxWidth: '100%',
        alignSelf: 'flex-start',
    },
    regularCommentContent: {
        flexDirection: 'column',
    },
    regularCommentText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    // Comment input styling to match reference image
    commentInputContainer: {
        position: 'absolute',
        left: 16,
        right: 18,
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 10,
    },
    commentInput: {
        flex: 1,
        color: '#fff',
        borderWidth: 1,
        borderColor: '#ffffff',
        paddingVertical: 15,
        paddingHorizontal: 15,
        fontSize: 14,
        borderRadius: 10,
        backgroundColor: 'rgba(50, 50, 50, 0.2)', // Semi-transparent background
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
});

export default LivestreamStudio;