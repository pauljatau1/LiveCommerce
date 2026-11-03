// import {
//   View,
//   Text,
//   FlatList,
//   TouchableOpacity,
//   Dimensions,
//   StyleSheet,
//   Pressable,
//   Platform,
// } from "react-native";
// import React, {
//   memo,
//   useCallback,
//   useEffect,
//   useMemo,
//   useRef,
//   useState,
// } from "react";
// import { Image } from "expo-image";
// import { AVPlaybackStatusSuccess, ResizeMode, Video } from "expo-av";
// import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
// import Entypo from "@expo/vector-icons/Entypo";
// import Octicons from "@expo/vector-icons/Octicons";
// import Ionicons from "@expo/vector-icons/Ionicons";
// import { formatNumber, timeFromNow } from "@/helpers/helpers";
// import { router } from "expo-router";
// import BottomSheet from "../global/bottom-sheet";
// import AntDesign from "@expo/vector-icons/AntDesign";
// import SimpleLineIcons from "@expo/vector-icons/SimpleLineIcons";
// import { getToken, getUser } from "@/store/features/auth/utils";
// import moment from "moment";
// import {
//   useCommentPostMutation,
//   useDeletePostMutation,
//   useReactPostMutation,
// } from "@/services/posts";
// import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
// import MultipleMediaItem from "./multipleMediaItem";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { ActivityIndicator } from "react-native-paper";
// import ReactionPicker from "./reactionPicker";
// import Animated, {
//   useAnimatedStyle,
//   useSharedValue,
//   withSpring,
//   withTiming,
// } from "react-native-reanimated";
// import { Gesture, GestureDetector } from "react-native-gesture-handler";
// import { black } from "react-native-paper/lib/typescript/styles/themes/v2/colors";
// import AuthSheet from "../auth/authSheet";
// import { toast } from "@/core/toast";
// import OptionsSheet from "./optionsSheet";
// import ReportPostSheet from "./reportPostSheet";
// import ReportUserSheet from "./reportUserSheet";
// import CommentsSheet from "./commentsSheet";

// const { width } = Dimensions.get("window");

// const reactionsList = [
//   { id: "like", emoji: "👍", label: "like" },
//   { id: "love", emoji: "❤️", label: "love" },
//   { id: "haha", emoji: "😂", label: "haha" },
//   { id: "wow", emoji: "😮", label: "wow" },
//   { id: "sad", emoji: "😢", label: "sad" },
//   { id: "angry", emoji: "😡", label: "angry" },
// ];

// const SingleMediaItem = memo(({ item }: { item: any }) => {
//   const videoRef = useRef<Video>(null);
//   const [aspectRatio, setAspectRatio] = useState(1);
//   const [playing, setPlaying] = useState<boolean>(false);
//   const [muted, setMuted] = useState<boolean>(false);
//   const [isBuffering, setIsBuffering] = useState<boolean>(true);

//   const isVideo = useMemo(
//     () => item?.public_id?.split("/")[1] === "videos",
//     [],
//   );

//   const playPauseVideo = () => {
//     if (videoRef.current) {
//       if (playing) {
//         videoRef.current.pauseAsync();
//         setPlaying(false);
//       } else {
//         videoRef.current?.playAsync();
//         setPlaying(true);
//       }
//     }
//   };

//   const muteUnmuteVideo = () => {
//     if (videoRef.current) {
//       if (muted) {
//         videoRef.current.setIsMutedAsync(false);
//         setMuted(false);
//       } else {
//         videoRef.current?.setIsMutedAsync(true);
//         setMuted(true);
//       }
//     }
//   };

//   const handlePlaybackStatusUpdate = useCallback(
//     (status: any) => {
//       if (status.didJustFinish) {
//         setPlaying(false);
//       }
//       if (!status.isLoaded) return;
//       setIsBuffering(
//         (!status.isPlaying && status.shouldPlay) || status.isBuffering,
//       );
//     },
//     [playing],
//   );

//   const videoReadyForDisplay = useCallback((event: any) => {
//     const { width, height } = event.naturalSize;
//     if (width && height) {
//       setAspectRatio(width / height);
//     }
//   }, []);

//   const imageReadyForDisplay = useCallback((source: any) => {
//     setAspectRatio(source.width / source.height);
//   }, []);

//   useEffect(() => {
//     return () => {
//       if (videoRef.current) {
//         videoRef.current.pauseAsync();
//         videoRef.current.unloadAsync();
//       }
//     };
//   }, []);

//   if (isVideo) {
//     return (
//       <Pressable onPress={() => playPauseVideo()}>
//         <Video
//           ref={videoRef}
//           source={{ uri: item.url }}
//           style={[styles.mediaItem, { aspectRatio }]}
//           resizeMode={ResizeMode.COVER}
//           onReadyForDisplay={videoReadyForDisplay}
//           onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
//           isLooping
//           shouldPlay={playing}
//         />

//         {/* {isBuffering && (
//           <View
//             style={[
//               StyleSheet.absoluteFillObject,
//               { justifyContent: "center", alignItems: "center" },
//             ]}
//           >
//             <ActivityIndicator size={"small"} color="#fff" />
//           </View>
//         )} */}

//         <Pressable style={styles.playVideo} onPress={() => playPauseVideo()}>
//           {playing ? (
//             <AntDesign name="pause" size={12} color="white" />
//           ) : (
//             <FontAwesome6 name="play" size={12} color="white" />
//           )}
//         </Pressable>

//         <Pressable
//           style={[styles.playVideo, { right: 8, left: "auto" }]}
//           onPress={() => muteUnmuteVideo()}
//         >
//           {muted ? (
//             <Octicons name="mute" size={12} color="white" />
//           ) : (
//             <Octicons name="unmute" size={12} color="white" />
//           )}
//         </Pressable>
//       </Pressable>
//     );
//   }

//   return (
//     <Image
//       source={{ uri: item?.url }}
//       contentFit="cover"
//       style={[styles.mediaItem, { aspectRatio }]}
//       onLoad={imageReadyForDisplay}
//       cachePolicy="memory-disk"
//     />
//   );
// });

// const ProductItem = memo(
//   ({ product, onPress }: { product: any; onPress: () => void }) => (
//     <TouchableOpacity style={styles.productContainer} onPress={onPress}>
//       <Image
//         source={{
//           uri:
//             product?.productId?.images?.[0]?.url ||
//             product?.images?.[0]?.url ||
//             "",
//         }}
//         contentFit="cover"
//         style={styles.productImage}
//         cachePolicy="memory-disk"
//       />
//       <View style={styles.productInfo}>
//         <Text style={styles.productName}>
//           {product?.productId?.name?.slice(0, 50) ||
//             product?.name?.slice(0, 50)}
//         </Text>
//       </View>
//     </TouchableOpacity>
//   ),
// );

// const ProductItemSingle = memo(
//   ({ product, onPress }: { product: any; onPress: () => void }) => (
//     <TouchableOpacity
//       style={styles.productContainerSingle}
//       onPress={onPress}
//       activeOpacity={0.7}
//     >
//       <Image
//         source={{
//           uri:
//             product?.productId?.images?.[0]?.url ||
//             product?.images?.[0]?.url ||
//             "",
//         }}
//         contentFit="cover"
//         style={styles.productImageSingle}
//         cachePolicy="memory-disk"
//       />
//       <View style={styles.productInfoSingle}>
//         <Text style={styles.productNameSingle}>
//           {product?.productId?.name?.slice(0, 50) ||
//             product?.name?.slice(0, 50)}
//         </Text>
//         <Text style={styles.productCategory}>
//           #{product?.productId?.category || product?.category}
//         </Text>
//         <Text style={styles.productPrice}>
//           N{(product?.productId?.price || product?.price)?.toLocaleString()}
//         </Text>
//       </View>
//     </TouchableOpacity>
//   ),
// );

// const PostItem2 = ({ item, deletePost }: { item: any; deletePost: any }) => {
//   const [reactPost, { isLoading }] = useReactPostMutation({});
//   const [state, setState] = useState({
//     media: [...(item?.images || []), ...(item?.videos || [])],
//     products: item?.products || [],
//     activeIndex: 0,
//   });
//   const [reactions, setReactions] = useState<any>(item?.reactions);
//   const [isReacted, setIsReacted] = useState<boolean>(false);
//   const [showComments, setShowComments] = useState<boolean>(false);
//   const [showOptionsSheet, setShowOptionsSheet] = useState<boolean>(false);
//   const [allComments, setAllComments] = useState<any[]>(item.comments);
//   const [comments, setComments] = useState<number>(item.comments?.length);
//   const [activeIndex, setActiveIndex] = useState<number>(0);

//   const [reactionStats, setReactionStats] = useState<Record<string, number>>(
//     item?.stats?.reactions,
//   );
//   const [token, setToken] = useState<string>("");
//   const [user, setUser] = useState<any>({});

//   const [showAuthSheet, setShowAuthSheet] = useState<boolean>(false);
//   const [showReportUser, setShowReportUser] = useState<boolean>(false);
//   const [showReportPost, setShowReportPost] = useState<boolean>(false);

//   const getAuthUser = useCallback(async () => {
//     const authToken = await getToken();
//     const userInfo = await getUser();
//     setToken(authToken);
//     setUser(userInfo);
//   }, []);

//   useEffect(() => {
//     getAuthUser();
//   }, []);

//   const handleCantComment = () => {
//     setShowComments(false);
//     setShowAuthSheet(true);
//   };

//   const bubbleVisible = useSharedValue(false);
//   const bubblePosition = useSharedValue(-100); // Start offscreen

//   // Animated styles for the bubble
//   const bubbleStyle = useAnimatedStyle(() => ({
//     transform: [{ translateY: bubblePosition.value - 30 }],
//     opacity: bubbleVisible.value ? withTiming(1) : withTiming(0),
//   }));

//   // Handle long press to show the bubble
//   const longPressGesture = Gesture.LongPress().onStart(() => {
//     bubbleVisible.value = true;
//     bubblePosition.value = withSpring(-120, { damping: 10, stiffness: 100 }); // Slide up
//   });

//   const handleIncreaseCommentCount = useCallback(() => {
//     setComments(comments + 1);
//   }, []);

//   const handleAddComment = useCallback((comment: any) => {
//     setAllComments([...allComments, comment]);
//   }, []);

//   const handleReact = useCallback(
//     async (reaction: any) => {
//       bubbleVisible.value = false;
//       bubblePosition.value = withTiming(-100);

//       if (!token) {
//         return setShowAuthSheet(true);
//       }
//       if (isReacted) {
//         // setReactions(reactions - 1);
//         return setIsReacted(false);
//       }
//       setReactions([
//         ...reactions,
//         {
//           id: item._id,
//           type: reaction.label,
//         },
//       ]);
//       setReactionStats({
//         ...reactionStats,
//         [reaction.label]: reactionStats[reaction.label] + 1,
//       });
//       setIsReacted(true);

//       try {
//         const result = await reactPost({
//           id: item._id,
//           type: reaction.label,
//         });

//         // console.log("successfully added reaction ", result);
//       } catch (e: any) {
//         console.log("cannot like post", e.message);
//       }
//     },
//     [reactions, token],
//   );

//   const handleReactionClose = (reaction: any) => {
//     bubbleVisible.value = false;
//     bubblePosition.value = withTiming(-100); // Slide down
//   };

//   const handleShowReportUser = () => {
//     setShowOptionsSheet(false);
//     setShowReportUser(true);
//   };

//   const handleShowReportPost = () => {
//     setShowOptionsSheet(false);
//     setShowReportPost(true);
//   };

//   const body = useMemo(() => {
//     const newBody = item.body.split(" ").map((word: any) => {
//       if (word.includes("#")) {
//         return (
//           <Text key={word} style={{ color: "#16783A" }}>
//             {word}
//           </Text>
//         );
//       }
//       return word + " ";
//     });
//     return newBody;
//   }, [item]);

//   const renderSingleMedia = useCallback(
//     ({ item: mediaItem }: { item: any }) => (
//       <SingleMediaItem item={mediaItem} />
//     ),
//     [],
//   );

//   const renderProduct = useCallback(
//     ({ item: product }: { item: any }) => (
//       <ProductItem
//         product={product}
//         onPress={() =>
//           router.push({
//             pathname: `../../../(root)/product/${product?.productId?._id || product?.id}`,
//           })
//         }
//       />
//     ),
//     [],
//   );

//   const showMorePost = useCallback(async () => {
//     await AsyncStorage.setItem("selectedPost", JSON.stringify(item));
//     router.push("/(root)/connectMore/MorePostInfo");
//   }, []);

//   const productKeyExtractor = useCallback((item: any) => item?._id, [item]);

//   const pickedReactions = useMemo(() => {
//     let st = [];
//     for (const [key, value] of Object.entries(reactionStats)) {
//       if (value > 0) {
//         st.push(
//           reactionsList.find(
//             (rl) => rl.label.toLowerCase() == key.toLowerCase(),
//           )?.emoji,
//         );
//       }
//     }
//     return st.slice(0, 4);
//   }, [reactionStats]);

//   return (
//     <Pressable style={styles.container} onPress={showMorePost}>
//       <View style={styles.header}>
//         <View style={styles.userInfo}>
//           <Image
//             source={
//               item?.author?.image
//                 ? { uri: item?.author?.image }
//                 : require("../../assets/icons/profile.jpg")
//             }
//             contentFit="cover"
//             style={styles.avatar}
//             cachePolicy="memory-disk"
//           />
//           <View style={styles.userMetadata}>
//             <Text style={styles.userName}>
//               {item?.author?.username || item?.author?.name}
//             </Text>
//             <Text style={styles.timestamp}>{timeFromNow(item?.createdAt)}</Text>
//           </View>
//         </View>
//         {token && (
//           <TouchableOpacity
//             onPress={() => setShowOptionsSheet(true)}
//             className="w-[22px] h-[22px] rounded-[11px] items-center justify-center"
//           >
//             <Entypo name="dots-three-vertical" size={12} color="#ccc" />
//           </TouchableOpacity>
//         )}
//       </View>

//       <Text style={styles.postBody}>{body.map((bd: any) => bd)}</Text>

//       {state.media.length > 0 && (
//         <View style={styles.mediaContainer}>
//           {state.media?.length == 1 ? (
//             renderSingleMedia({ item: state.media[0] })
//           ) : (
//             <MultipleMediaItem items={state.media} />
//           )}
//         </View>
//       )}

//       {state.products.length > 0 &&
//         (state.products.length == 1 ? (
//           <ProductItemSingle
//             product={state.products[0]}
//             onPress={() =>
//               router.push({
//                 pathname: `../../../(root)/product/${state.products[0]?.productId?._id || state.products[0]?.id}`,
//               })
//             }
//           />
//         ) : (
//           <FlatList
//             data={state.products}
//             renderItem={renderProduct}
//             keyExtractor={productKeyExtractor}
//             horizontal
//             showsHorizontalScrollIndicator={false}
//             removeClippedSubviews={true}
//             initialNumToRender={2}
//             maxToRenderPerBatch={3}
//             windowSize={3}
//             nestedScrollEnabled={true}
//           />
//         ))}

//       <View
//         style={{
//           marginTop: 12,
//           flexDirection: "row",
//           justifyContent: "center",
//           gap: 30,
//         }}
//       >
//         {/* Reaction Button */}
//         <GestureDetector gesture={longPressGesture}>
//           <TouchableOpacity
//             style={{
//               flexDirection: "row",
//               alignItems: "center",
//               gap: 4,
//             }}
//             onPress={handleReactionClose}
//           >
//             <View
//               style={{
//                 position: "relative",
//               }}
//             >
//               {pickedReactions.map((pr, index) => (
//                 <Text
//                   key={index}
//                   style={{
//                     position: "absolute",
//                     top: -10,
//                     right: index * 14,
//                     zIndex: index + 1,
//                   }}
//                 >
//                   {pr}
//                 </Text>
//               ))}
//             </View>

//             <Text
//               style={{
//                 color: "#ccc",
//                 fontSize: 12,
//                 fontFamily: "LexendDeca",
//               }}
//             >
//               {formatNumber(reactions?.length)} Reactions
//             </Text>
//           </TouchableOpacity>
//         </GestureDetector>

//         {/* Reaction Bubble */}
//         <Animated.View style={[styles.bubble, bubbleStyle]}>
//           {reactionsList.map((reaction) => (
//             <TouchableOpacity
//               key={reaction.id}
//               onPress={() => handleReact(reaction)}
//               style={styles.reactionItem}
//             >
//               <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
//             </TouchableOpacity>
//           ))}
//         </Animated.View>

//         <TouchableOpacity
//           style={{
//             flexDirection: "row",
//             alignItems: "center",
//             gap: 4,
//           }}
//           onPress={() => setShowComments(true)}
//         >
//           <Octicons name="comment" size={14} color="#ccc" />

//           <Text
//             style={{
//               color: "#ccc",
//               fontSize: 12,
//               fontFamily: "LexendDeca",
//             }}
//           >
//             {formatNumber(comments)} Comments
//           </Text>
//         </TouchableOpacity>
//         {/* <TouchableOpacity
//           style={{
//             flexDirection: "row",
//             alignItems: "center",
//             gap: 4,
//           }}
//         >
//           <Ionicons name="arrow-redo-sharp" size={14} color="#ccc" />

//           <Text
//             style={{
//               color: "#ccc",
//               fontSize: 12,
//               fontFamily: "LexendDeca",
//             }}
//           >
//             Share
//           </Text>
//         </TouchableOpacity> */}
//       </View>

//       <BottomSheet
//         bgColor="#121212"
//         childrenStyle="!px-[11px]"
//         showCloseIcon={false}
//         title=""
//         show={showComments}
//         titleColor="!text-white"
//         snapPoints={["70%"]}
//         enableDynamicSizing={false}
//         onRequestClose={() => setShowComments(false)}
//         keyboardBehavior="extend"
//       >
//         <CommentsSheet
//           handleIncreaseCommentCount={handleIncreaseCommentCount}
//           handleCantComment={handleCantComment}
//           allComments={allComments}
//           commentsCount={comments}
//           handleAddComment={handleAddComment}
//           id={item._id}
//         />
//       </BottomSheet>

//       <BottomSheet
//         bgColor="#3A3A3A"
//         childrenStyle="!px-[11px]"
//         showCloseIcon={false}
//         title=""
//         show={showOptionsSheet}
//         titleColor="!text-white"
//         onRequestClose={() => setShowOptionsSheet(false)}
//         keyboardBehavior={"interactive"}
//       >
//         <OptionsSheet
//           authorId={item?.author?.id}
//           userId={user?._id}
//           postId={item?._id}
//           closeSheet={() => setShowOptionsSheet(false)}
//           handleShowReportPost={handleShowReportPost}
//           handleShowReportUser={handleShowReportUser}
//           deletePost={deletePost}
//         />
//       </BottomSheet>

//       <BottomSheet
//         bgColor="#121212"
//         childrenStyle="!px-[11px]"
//         showCloseIcon={false}
//         title=""
//         show={showAuthSheet}
//         titleColor="!text-white"
//         snapPoints={["20%"]}
//         enableDynamicSizing={false}
//         onRequestClose={() => setShowAuthSheet(false)}
//         keyboardBehavior="interactive"
//       >
//         <AuthSheet closeSheet={() => setShowAuthSheet(false)} />
//       </BottomSheet>

//       <BottomSheet
//         bgColor="#3A3A3A"
//         childrenStyle="!px-[0px]"
//         showCloseIcon={false}
//         title=""
//         show={showReportPost}
//         titleColor="!text-white"
//         onRequestClose={() => setShowReportPost(false)}
//         keyboardBehavior={"interactive"}
//       >
//         <ReportPostSheet
//           postId={item._id}
//           closeSheet={() => setShowReportPost(false)}
//         />
//       </BottomSheet>

//       <BottomSheet
//         bgColor="#3A3A3A"
//         childrenStyle="!px-[0px]"
//         showCloseIcon={false}
//         title=""
//         show={showReportUser}
//         titleColor="!text-white"
//         onRequestClose={() => setShowReportUser(false)}
//         keyboardBehavior={"interactive"}
//       >
//         <ReportUserSheet
//           userId={item?.author?.id}
//           userType={item?.author?.type}
//           closeSheet={() => setShowReportUser(false)}
//         />
//       </BottomSheet>
//     </Pressable>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     paddingVertical: 14,
//     borderBottomColor: "#888787",
//     borderBottomWidth: StyleSheet.hairlineWidth,
//     paddingHorizontal: 16,
//   },
//   header: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     marginBottom: 10,
//     // paddingVertical: 10,
//   },
//   userInfo: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 12,
//   },
//   avatar: {
//     width: 40,
//     height: 40,
//     borderRadius: 32.5,
//   },
//   userMetadata: {
//     gap: 5,
//   },
//   userName: {
//     fontSize: 16,
//     color: "#ccc",
//     fontFamily: "LexendDeca-Medium",
//   },
//   timestamp: {
//     fontSize: 8,
//     color: "#ccc",
//     fontFamily: "LexendDeca-Light",
//   },
//   postBody: {
//     color: "#ccc",
//     fontFamily: "LexendDeca",
//     fontSize: 14,
//     marginBottom: 10,
//     lineHeight: 18,
//   },
//   mediaContainer: {
//     width: width - 32,
//     height: undefined,
//     maxHeight: 500,
//     position: "relative",
//     backgroundColor: "#111",
//     borderRadius: 4,
//   },
//   mediaItem: {
//     width: width - 32,
//     alignSelf: "center",
//     height: "100%",
//     // aspectRatio: 16 / 9,
//     // maxHeight: 600,
//   },
//   productContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     width: 200,
//     borderRadius: 4,
//     overflow: "hidden",
//     marginRight: 20,
//     marginVertical: 10,
//     padding: 1,
//     paddingHorizontal: 3,
//     backgroundColor: "#f2f2f2",
//   },
//   productContainerSingle: {
//     flexDirection: "row",
//     width: "100%",
//     flexShrink: 1,
//     borderRadius: 8,
//     overflow: "hidden",
//     marginVertical: 10,
//     padding: 12,
//     backgroundColor: "#f9f9f9",
//     // opacity: 0.8,
//     gap: 5,
//   },
//   productImage: {
//     width: 25,
//     height: 25,
//     borderRadius: 4,
//   },
//   productImageSingle: {
//     width: 120,
//     height: 120,
//     borderRadius: 8,
//   },
//   productInfo: {
//     backgroundColor: "#f2f2f2",
//     flex: 1,
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     paddingHorizontal: 5,
//     height: 30,
//   },
//   productInfoSingle: {
//     // backgroundColor: "#f2f2f2",
//     flex: 1,
//     padding: 5,
//     gap: 5,
//   },
//   productName: {
//     color: "#3A3A3A",
//     fontSize: 10,
//     fontFamily: "LexendDeca-Medium",
//   },
//   productCategory: {
//     color: "#027CEC",
//     fontSize: 12,
//     fontFamily: "LexendDeca-Medium",
//   },
//   productPrice: {
//     color: "#3A3A3A",
//     fontSize: 20,
//     fontFamily: "LexendDeca-Medium",
//   },
//   productNameSingle: {
//     color: "#3A3A3A",
//     fontSize: 14,
//     fontFamily: "LexendDeca-Medium",
//   },
//   playVideo: {
//     position: "absolute",
//     bottom: 8,
//     left: 8,
//     width: 30,
//     height: 30,
//     borderRadius: 30,
//     backgroundColor: "#121212",
//     alignItems: "center",
//     justifyContent: "center",
//     ...Platform.select({
//       ios: {
//         shadowColor: "#000",
//         shadowOffset: { width: 0, height: 0 },
//         shadowOpacity: 0.4,
//         shadowRadius: 4,
//       },
//       android: {
//         elevation: 5,
//       },
//     }),
//   },
//   reactionButton: {
//     padding: 10,
//     backgroundColor: "#e0e0e0",
//     borderRadius: 20,
//   },
//   reactionButtonText: {
//     fontSize: 16,
//   },
//   bubble: {
//     position: "absolute",
//     flexDirection: "row",
//     backgroundColor: "#121212",
//     flexGrow: 1,
//     borderRadius: 25,
//     padding: 10,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.25,
//     shadowRadius: 3.84,
//     elevation: 5,
//     bottom: -120, // Start below the button
//   },
//   reactionItem: {
//     marginHorizontal: 5,
//   },
//   reactionEmoji: {
//     fontSize: 24,
//   },
//   // pauseVideo:{}
// });

// export default memo(PostItem2);
