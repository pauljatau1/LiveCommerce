import { View, Text, Image, TouchableOpacity, Dimensions, SafeAreaView, StyleSheet, FlatList } from 'react-native';
import React, { useEffect, useState, useRef } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useLivestream } from '@/contexts/livestreamContext';
import { WebView } from 'react-native-webview';
import { AntDesign, Feather, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { FocusAwareStatusBar } from '@/components/ui/focus-aware-status-bar';
import BottomSheet from '@/components/global/bottom-sheet';
import { ActivityIndicator } from 'react-native';

const { width, height } = Dimensions.get('window');

const getHtmlContent = (appId: string, channel: string, token: string, uid: string) => `
<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
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

    useEffect(() => {
        setupLivestream();
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
                        avatar: streamDetails?.seller.storeAvatar?.url ? { uri: streamDetails?.seller.storeAvatar?.url } : require('@/assets/icons/animoji.png')
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
                    streamConfig && (
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

                {/* Right Side Actions */}
                {
                    streamConfig && (
                        <View className="absolute right-4 bottom-32 items-center gap-6">
                            <TouchableOpacity className="items-center" onPress={handleLike}>
                                <AntDesign name={liked ? "heart" : "hearto"} size={28} color="white" />
                                <Text className="text-white text-xs mt-1">{formatCount(likes)}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity className="items-center" onPress={() => setShowComments(true)}>
                                <Feather name="message-circle" size={28} color="white" />
                                <Text className="text-white text-xs mt-1">{formatCount(comments)}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity className="items-center" onPress={handleShare}>
                                <Ionicons name="share-outline" size={28} color="white" />
                                <Text className="text-white text-xs mt-1">Share</Text>
                            </TouchableOpacity>
                        </View>
                    )
                }

                {/* Bottom Product Card */}
                {currentProduct && (
                    <View className="absolute bottom-0 left-0 right-0 p-4">
                        <View className="flex-row justify-between items-center mb-2">
                            {streamProducts.length > 1 && (
                                <>
                                    <TouchableOpacity onPress={handlePrevProduct} className="bg-white/20 rounded-full p-1">
                                        <AntDesign name="left" size={16} color="white" />
                                    </TouchableOpacity>
                                    <Text className="text-white text-xs">
                                        {currentProductIndex + 1}/{streamProducts?.length}
                                    </Text>
                                    <TouchableOpacity onPress={handleNextProduct} className="bg-white/20 rounded-full p-1">
                                        <AntDesign name="right" size={16} color="white" />
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                        <TouchableOpacity className="bg-white/10 backdrop-blur-lg p-3 rounded-lg flex-row items-center">
                            <Image
                                source={{ uri: currentProduct.images[0]?.url }}
                                className="w-16 h-16 rounded-lg"
                                resizeMode="cover"
                            />
                            <View className="flex-1 ml-3">
                                <Text numberOfLines={2} className="text-white font-LexendDecaMedium w-[100px] ">
                                    {currentProduct.name}
                                </Text>
                                <Text className="text-white text-lg font-LexendDecaBold">
                                    ₦{currentProduct?.price?.toLocaleString()}
                                </Text>
                            </View>
                            <TouchableOpacity className="bg-[#16783A] px-4 py-2 rounded-lg">
                                <Text className="text-white font-LexendDecaMedium">Buy Now</Text>
                            </TouchableOpacity>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Loading Overlay */}
                {isLoading && streamConfig && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color="#fff" />
                        {/*<Text style={styles.statusText}>{status}</Text>*/}
                    </View>
                )}

                {/* Comments Bottom Sheet */}
                {showComments && (
                    <BottomSheet
                        show={showComments}
                        onRequestClose={() => setShowComments(false)}
                        snapPoints={['70%']}
                        keyboardBehavior="extend"
                        bgColor="#1A1A1A"
                        title="Comments"
                        titleColor="text-white"
                    >
                        <View style={{ flex: 1 }}>
                            <Text style={{ color: '#fff', marginBottom: 20 }}>Join the conversation</Text>

                            {/* Sample comments - replace with actual comments data */}
                            <View style={styles.commentItem}>
                                <Image
                                    source={require('@/assets/icons/animoji.png')}
                                    style={styles.commentAvatar}
                                />
                                <View style={styles.commentContent}>
                                    <Text style={styles.commentUsername}>@user123</Text>
                                    <Text style={styles.commentText}>This is an amazing product! I love it.</Text>
                                    <Text style={styles.commentTime}>2m ago</Text>
                                </View>
                            </View>

                            <View style={styles.commentItem}>
                                <Image
                                    source={require('@/assets/icons/animoji.png')}
                                    style={styles.commentAvatar}
                                />
                                <View style={styles.commentContent}>
                                    <Text style={styles.commentUsername}>@fashionlover</Text>
                                    <Text style={styles.commentText}>Do you have this in blue color?</Text>
                                    <Text style={styles.commentTime}>5m ago</Text>
                                </View>
                            </View>

                            {/* Comment input */}
                            <View style={styles.commentInputContainer}>
                                <Image
                                    source={require('@/assets/icons/animoji.png')}
                                    style={styles.inputAvatar}
                                />
                                <TouchableOpacity style={styles.commentInput}>
                                    <Text style={styles.commentInputText}>Add a comment...</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.sendButton}>
                                    <Ionicons name="send" size={20} color="#16783A" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </BottomSheet>
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
    commentItem: {
        flexDirection: 'row',
        marginBottom: 20,
        alignItems: 'flex-start',
    },
    commentAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        marginRight: 10,
    },
    commentContent: {
        flex: 1,
    },
    commentUsername: {
        color: '#fff',
        fontWeight: 'bold',
        marginBottom: 2,
    },
    commentText: {
        color: '#fff',
        marginBottom: 4,
    },
    commentTime: {
        color: '#999',
        fontSize: 12,
    },
    commentInputContainer: {
        position: 'absolute',
        bottom: 20,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
    },
    inputAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: 10,
    },
    commentInput: {
        flex: 1,
        backgroundColor: '#2E3038',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        marginRight: 10,
    },
    commentInputText: {
        color: '#999',
    },
    sendButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#2E3038',
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default LivestreamStudio;