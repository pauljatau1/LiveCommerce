import { View, Text, Image, TouchableOpacity, Dimensions, SafeAreaView, StyleSheet, FlatList, TextInput, KeyboardAvoidingView, Animated } from 'react-native';
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

const { width, height } = Dimensions.get('window');

const getHtmlContent = (appId: string, channel: string, token: string, uid: string) => `
<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <script src="https://download.agora.io/sdk/release/AgoraRTC_N-4.21.0.js"></script>
    <style>
      body { margin: 0; padding: 0; background: black; }
      #video-container { width: 100vw; height: 100vh; position: relative; }
      #host-video { width: 100%; height: 100%; }
    </style>
  </head>
  <body>
    <div id="video-container">
      <div id="host-video"></div>
    </div>
    <script>
      // Global references to important objects
      let client;
      let remoteUsers = {};
      
      async function joinAsAudience() {
        try {
          // Create Agora client
          client = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
          
          // Set role to audience
          await client.setClientRole("audience");
          
          window.ReactNativeWebView.postMessage('initializing');
          
          // Register all user events BEFORE joining
          registerEvents();
          
          // Join the channel with token
          await client.join("${appId}", "${channel}", "${token}", ${uid});
          window.ReactNativeWebView.postMessage('joined_channel');
          
          // After joining, log all users currently in the channel
          window.ReactNativeWebView.postMessage('users_in_channel:' + client.remoteUsers.length);
          client.remoteUsers.forEach(user => {
            window.ReactNativeWebView.postMessage('remote_user:' + user.uid);
            
            // Auto-subscribe to existing users
            subscribeToUser(user);
          });
        } catch (error) {
          console.error("Error joining:", error);
          window.ReactNativeWebView.postMessage("error:" + error.message);
        }
      }
      
      function registerEvents() {
        // When remote user publishes a stream
        client.on("user-published", async (user, mediaType) => {
          window.ReactNativeWebView.postMessage("user_published:" + user.uid + ":" + mediaType);
          
          // Save remote user to our object
          remoteUsers[user.uid] = user;
          
          // Subscribe to the remote user
          await subscribeToUser(user);
        });
        
        // When remote user stops publishing
        client.on("user-unpublished", (user, mediaType) => {
          window.ReactNativeWebView.postMessage("user_unpublished:" + user.uid + ":" + mediaType);
        });
        
        // When remote user joins
        client.on("user-joined", (user) => {
          window.ReactNativeWebView.postMessage("user_joined:" + user.uid);
          remoteUsers[user.uid] = user;
        });
        
        // When remote user leaves
        client.on("user-left", (user) => {
          window.ReactNativeWebView.postMessage("user_left:" + user.uid);
          delete remoteUsers[user.uid];
        });
        
        // Connection state changes
        client.on("connection-state-change", (newState) => {
          window.ReactNativeWebView.postMessage("connection:" + newState);
        });
      }
      
      async function subscribeToUser(user) {
        try {
          // Subscribe to the video/audio tracks
          await client.subscribe(user, "video");
          window.ReactNativeWebView.postMessage("subscribed_video:" + user.uid);
          
          await client.subscribe(user, "audio");
          window.ReactNativeWebView.postMessage("subscribed_audio:" + user.uid);
          
          // Play audio immediately
          if (user.audioTrack) {
            user.audioTrack.play();
            window.ReactNativeWebView.postMessage("audio_playing:" + user.uid);
          }
          
          // Play video onto the host-video div
          if (user.videoTrack) {
            // Create a guaranteed unique ID
            const playerDiv = document.getElementById("host-video");
            if (playerDiv) {
              // Play the video - use cover to fill container
              user.videoTrack.play(playerDiv, { fit: "cover" });
              window.ReactNativeWebView.postMessage("video_playing:" + user.uid);
            } else {
              window.ReactNativeWebView.postMessage("error:video_container_missing");
            }
          }
        } catch (err) {
          window.ReactNativeWebView.postMessage("error:subscribe:" + err.message);
        }
      }
      
      // Start everything
      joinAsAudience();
    </script>
  </body>
</html>
`;

interface StreamConfig {
    appId: string;
    channel: string;
    token: string;
    uid: string;
}

interface ProductImage {
    url: string;
    _id: string;
    id: string;
}

interface Product {
    _id: string;
    name: string;
    description: string;
    price: number;
    discountedPrice: number;
    images: ProductImage[];
    seller: {
        storeName: string;
        businessName: string;
        storeAvatar: {
            url: string;
        };
    };
    id: string;
}

interface StreamProduct {
    product: Product;
    currentBid: number;
    _id: string;
}

interface StreamDetails {
    channelName: string;
    token: string;
    uid: string;
    title?: string;
    category?: string;
    viewers?: Array<any>;
    likes?: number;
    comments?: number;
    products?: StreamProduct[];
    seller?: {
        storeName: string;
        businessName: string;
        storeAvatar: {
            url: string;
        };
    };
    stream?: {
        title: string;
        products: StreamProduct[];
        seller: string;
    };
}

interface LivestreamContextType {
    activeStreamDetails: StreamDetails | null;
    joinStream: (streamId: string) => Promise<StreamDetails>;
    fetchActiveStreamDetails: (streamId: string) => Promise<StreamDetails>;
    // Add other properties as needed
}

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
    const [streamProducts, setStreamProducts] = useState<StreamProduct[]>([]);
    const [currentProductIndex, setCurrentProductIndex] = useState(0);
    const [storeInfo, setStoreInfo] = useState({
        name: 'Store Name',
        username: '@username',
        avatar: require('@/assets/icons/animoji.png')
    });

    const { width: screenWidth } = Dimensions.get('window');

    const [comment, setComment] = useState('');

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

    useEffect(() => {
        setupLivestream();
        
        // Add sample comments and events for demonstration that match the reference image
        const sampleEvents = [
            {
                id: '1',
                type: 'join' as const,
                user: 'Ahmed',
                avatar: require('@/assets/icons/animoji.png'),
                content: 'joined the stream',
                timestamp: new Date(Date.now() - 5000)
            },
            {
                id: '2',
                type: 'comment' as const,
                user: 'Jessica',
                avatar: require('@/assets/icons/animoji.png'),
                content: 'This blue shirt looks amazing!',
                timestamp: new Date(Date.now() - 15000)
            },
            {
                id: '3',
                type: 'purchase' as const,
                user: 'Michael',
                avatar: require('@/assets/icons/animoji.png'),
                content: 'purchased Blue Polo Shirt',
                timestamp: new Date(Date.now() - 30000)
            },
            {
                id: '4',
                type: 'join' as const,
                user: 'User1638',
                avatar: require('@/assets/icons/animoji.png'),
                content: 'joined the stream',
                timestamp: new Date(Date.now() - 2000)
            }
        ];
        setLiveComments(sampleEvents);
        
        // Simulate new comments/events coming in
        const interval = setInterval(() => {
            const randomEvents = [
                {
                    id: Date.now().toString(),
                    type: 'comment' as const,
                    user: 'User' + Math.floor(Math.random() * 100),
                    avatar: require('@/assets/icons/animoji.png'),
                    content: 'I love this product! Do you ship internationally?',
                    timestamp: new Date()
                },
                {
                    id: Date.now().toString(),
                    type: 'join' as const,
                    user: 'User' + Math.floor(Math.random() * 100),
                    avatar: require('@/assets/icons/animoji.png'),
                    content: 'joined the stream',
                    timestamp: new Date()
                }
            ];
            
            const newEvent = randomEvents[Math.floor(Math.random() * randomEvents.length)];
            
            setLiveComments(prev => {
                // Keep only the last 10 comments to avoid cluttering the UI
                const updated = [...prev, newEvent];
                if (updated.length > 10) {
                    return updated.slice(updated.length - 10);
                }
                return updated;
            });
            
            // Scroll to the end to show new comments
            if (commentsListRef.current) {
                commentsListRef.current.scrollToEnd({ animated: true });
            }
        }, 15000); // Add a new comment every 15 seconds
        
        return () => clearInterval(interval);
    }, [id]);

    const setupLivestream = async () => {
        if (!id) return;
        try {
            setStatus('Joining stream...');
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
                    setStreamProducts(streamDetails.stream.products);
                }

                // Set store info
                if (streamDetails.seller) {
                    setStoreInfo({
                        name: streamDetails?.seller?.storeName || streamDetails?.seller?.businessName || 'Store Name',
                        username: `@${streamDetails?.seller?.storeName?.toLowerCase().replace(/\s+/g, '') || 'username'}`,
                        avatar: streamDetails?.seller?.storeAvatar?.url ? { uri: streamDetails?.seller.storeAvatar?.url } : require('@/assets/icons/animoji.png')
                    });
                }
            }

            setStreamConfig({
                appId: process.env.EXPO_PUBLIC_AGORA_APP_ID || '',
                channel: streamDetails?.channelName || '',
                token: streamDetails?.token || '',
                uid: streamDetails?.uid || ''
            });
        } catch (error) {
            console.error('Error setting up livestream:', error);
            setStatus('Error: ' + (error as Error).message);
        }
    };

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
        } else if (message.startsWith('connection:')) {
            const parts = message.split(':');
            if (parts.length >= 2) {
                const state = parts[1];
                setStatus(`Connection: ${state}`);
            }
        } else {
            setStatus(message);
        }
    };

    const handleLike = () => {
        if (!liked) {
            setLikes(likes + 1);
            setLiked(true);
            // Here you would typically call an API to update the like count
        } else {
            setLikes(likes - 1);
            setLiked(false);
            // Here you would typically call an API to update the like count
        }
    };

    const handleShare = () => {
        // Implement share functionality
        console.log('Share stream');
    };

    const formatCount = (count: number): string => {
        if (count >= 1000) {
            return (count / 1000).toFixed(1) + 'k';
        }
        return count.toString();
    };

    const formatPrice = (price: number): string => {
        return `$${(price / 100).toFixed(2)}`;
    };

    const handleNextProduct = () => {
        if (streamProducts.length > 0) {
            setCurrentProductIndex((prevIndex) =>
                prevIndex === streamProducts.length - 1 ? 0 : prevIndex + 1
            );
        }
    };

    const handlePrevProduct = () => {
        if (streamProducts.length > 0) {
            setCurrentProductIndex((prevIndex) =>
                prevIndex === 0 ? streamProducts.length - 1 : prevIndex - 1
            );
        }
    };

    const getCurrentProduct = () => {
        if (streamProducts.length === 0) return null;
        return streamProducts[currentProductIndex].product;
    };

    const currentProduct = getCurrentProduct();

    const renderProductCard = useCallback(({ item, index }) => {
        const product = item.product;

        return (
            <TouchableOpacity className="bg-white/10 backdrop-blur-lg p-3 rounded-lg flex-row items-center mx-1">
                <Image
                    source={{ uri: product.images[0]?.url }}
                    className="w-16 h-16 rounded-lg"
                    resizeMode="cover"
                />
                <View className="flex-1 ml-3">
                    <Text numberOfLines={2} className="text-white capitalize font-LexendDecaMedium w-[100px] ">
                        {product.name}
                    </Text>
                    <Text className="text-white text-lg font-LexendDecaBold">
                        ₦{product?.price?.toLocaleString()}
                    </Text>
                </View>
                <TouchableOpacity className="bg-[#16783A] px-4 py-2 rounded-lg">
                    <Text className="text-white font-LexendDecaMedium">Buy Now</Text>
                </TouchableOpacity>
            </TouchableOpacity>
        );
    }, []);

    const handleIncreaseCommentCount = () => {
        setComments(comments + 1);
    };

    const handleCantComment = () => {
        setShowComments(false);
        // Handle auth flow if needed
    };

    // Render a comment or event item to match the reference image
    const renderCommentItem = ({ item }: { item: any }) => {
        if (item.type === 'join') {
            return (
                <View style={styles.joinCommentItem}>
                    <Image 
                        source={item.avatar} 
                        style={styles.commentAvatar} 
                    />
                    <View style={styles.joinCommentContent}>
                        <Text style={styles.commentUser}>{item.user}</Text>
                        <Text style={styles.joinCommentText}>{item.content}</Text>
                    </View>
                </View>
            );
        } else if (item.type === 'purchase') {
            return (
                <View style={styles.purchaseCommentItem}>
                    <Image 
                        source={item.avatar} 
                        style={styles.commentAvatar} 
                    />
                    <View style={styles.purchaseCommentContent}>
                        <Text style={styles.commentUser}>{item.user}</Text>
                        <Text style={styles.purchaseCommentText}>{item.content}</Text>
                    </View>
                </View>
            );
        } else {
            return (
                <View style={styles.regularCommentItem}>
                    <Image 
                        source={item.avatar} 
                        style={styles.commentAvatar} 
                    />
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
            
            // Create a new comment
            const newComment = {
                id: Date.now().toString(),
                type: 'comment' as const,
                user: user.firstName || 'User',
                avatar: require('@/assets/icons/animoji.png'),
                content: commentInput.trim(),
                timestamp: new Date()
            };
            
            // Add to local state
            setLiveComments(prev => {
                const updated = [...prev, newComment];
                if (updated.length > 10) {
                    return updated.slice(updated.length - 10);
                }
                return updated;
            });
            
            // Clear input
            setCommentInput('');
            
            // Increment comment count
            setComments(prev => prev + 1);
            
            // Scroll to the end to show new comment
            if (commentsListRef.current) {
                commentsListRef.current.scrollToEnd({ animated: true });
            }
            
            // Here you would typically call an API to save the comment
            // const response = await axios.post(...);
        } catch (error) {
            console.error('Error sending comment:', error);
        }
    };

    return (
        <>
            <FocusAwareStatusBar barStyle="light-content" backgroundColor="black" />
            <View className="flex-1 bg-black">
                {/* Agora Video Container */}
                <View className="absolute w-full h-full">
                    {streamConfig ? (
                        <WebView
                            source={{
                                html: getHtmlContent(
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
                            debuggingEnabled={true}
                        />
                    ) : (
                        <View style={styles.fullScreen2}>
                            <Image
                                source={require('@/assets/icons/auqli-logo.png')}
                                className="w-20 h-14"
                            />
                        </View>
                    )}
                </View>

                {/* Top Actions */}
                {
                    streamConfig && !isLoading && (
                        <SafeAreaView>
                            <View className="flex-row justify-between items-center px-4 pt-2">
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
                                <TouchableOpacity className="bg-[#FF3B3B] px-4 py-1 rounded-full">
                                    <Text className="text-white text-sm">LIVE</Text>
                                </TouchableOpacity>
                            </View>
                        </SafeAreaView>
                    )
                }

                {/* Right Side Actions - Updated to match reference image */}
                {
                    streamConfig && !isLoading && (
                        <View style={styles.rightActionsContainer}>
                            <View style={styles.actionItem}>
                                <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                                    <SimpleLineIcons name="share-alt" size={24} color="white" />
                                </TouchableOpacity>
                                <Text style={styles.actionText}>Share</Text>
                            </View>
                            
                            <View style={styles.actionItem}>
                                <TouchableOpacity style={styles.actionButton}>
                                    <Ionicons name="information-circle-outline" size={28} color="white" />
                                </TouchableOpacity>
                                <Text style={styles.actionText}>Info</Text>
                            </View>
                            
                            <View style={styles.actionItem}>
                                <TouchableOpacity style={styles.actionButton}>
                                    <FontAwesome name="credit-card" size={24} color="white" />
                                </TouchableOpacity>
                                <Text style={styles.actionText}>Pay</Text>
                            </View>
                            
                            <View style={styles.actionItem}>
                                <TouchableOpacity style={styles.actionButton}>
                                    <Entypo name="box" size={24} color="white" />
                                </TouchableOpacity>
                                <Text style={styles.actionText}>Orders</Text>
                            </View>
                            
                            <View style={styles.actionItem}>
                                <TouchableOpacity style={styles.actionButton}>
                                    <Feather name="shopping-bag" size={24} color="white" />
                                </TouchableOpacity>
                                <Text style={styles.actionText}>Shop</Text>
                            </View>
                            
                            <View style={styles.actionItem}>
                                <TouchableOpacity style={styles.actionButton}>
                                    <AntDesign name="like2" size={24} color="white" />
                                </TouchableOpacity>
                                <Text style={styles.actionText}>React</Text>
                            </View>
                        </View>
                    )
                }
                
                {/* Live Comments Section - Updated to match reference image */}
                {streamConfig && !isLoading && (
                    <View style={styles.commentsContainer}>
                        <FlatList
                            ref={commentsListRef}
                            data={liveComments}
                            renderItem={renderCommentItem}
                            keyExtractor={item => item.id}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.commentsList}
                        />
                    </View>
                )}
                
                {/* Comment Input - Updated to match reference image */}
                {streamConfig && !isLoading && (
                    <View style={styles.commentInputContainer}>
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

                {/* Bottom Product Card - KEEPING ORIGINAL CAROUSEL IMPLEMENTATION */}
                {streamProducts.length > 0 && !isLoading && (
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
                            renderItem={renderProductCard}
                            defaultIndex={currentProductIndex}
                        />
                    </View>
                )}

                {/* Loading Overlay */}
                {isLoading && streamConfig && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color="#fff" />
                    </View>
                )}
            </View>
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
        right: 15,
        bottom: 200, // Position higher to avoid overlap with product card
        alignItems: 'center',
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
        left: 10,
        width: '70%',
        maxHeight: 200,
        zIndex: 10,
    },
    commentsList: {
        paddingVertical: 5,
    },
    // Base comment item styles
    commentAvatar: {
        width: 30,
        height: 30,
        borderRadius: 15,
        marginRight: 8,
    },
    commentUser: {
        color: '#fff',
        fontWeight: 'bold',
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
    },
    // Comment input styling to match reference image
    commentInputContainer: {
        position: 'absolute',
        bottom: 120, // Position above the product card
        left: 16,
        right: 18,
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 10,
    },
    commentInput: {
        flex: 1,
        color: '#fff',
        backgroundColor: 'rgba(50, 50, 50, 0.5)',
        paddingVertical: 10,
        paddingHorizontal: 15,
        fontSize: 14,
        borderRadius: 10,
    },
});

export default LivestreamStudio;