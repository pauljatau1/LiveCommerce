import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Dimensions,
  FlatList,
  TextInput,
  ScrollView,
  Keyboard,
} from "react-native";
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { FocusAwareStatusBar } from "@/components/ui/focus-aware-status-bar";
import { router } from "expo-router";
import Entypo from "@expo/vector-icons/Entypo";
import { Image } from "expo-image";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { formatNumber, timeFromNow } from "@/helpers/helpers";
import AntDesign from "@expo/vector-icons/AntDesign";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import Octicons from "@expo/vector-icons/Octicons";
import { ResizeMode, Video } from "expo-av";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { getToken, getUser } from "@/store/features/auth/utils";
import moment from "moment";
import {
  useCommentPostMutation,
  useGetCommentsQuery,
  useReactPostMutation,
  useReplyCommentMutation,
} from "@/services/posts";
import Ionicons from "@expo/vector-icons/Ionicons";
import BottomSheet from "@/components/global/bottom-sheet";
import AuthSheet from "@/components/auth/authSheet";
import { ActivityIndicator } from "react-native-paper";
import Comment from "@/components/connect/comment";
import { useIsFocused } from "@react-navigation/native";

const { width } = Dimensions.get("window");
const offset = 20;

const MorePostInfo = () => {
  const isFocused = useIsFocused();

  const insets = Platform.OS == "ios" ? useSafeAreaInsets() : { top: 0 };
  const [commentPost, { isLoading }] = useCommentPostMutation({});
  const [replyComment, { isLoading: isLoadingReplyComment }] =
    useReplyCommentMutation({});
  const [reactPost, { isLoading: isLoadingReactions }] = useReactPostMutation(
    {},
  );

  const [post, setPost] = useState<any>(null);
  const [media, setMedia] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [reactions, setReactions] = useState<any[]>([]);
  const [reactionCount, setReactionCount] = useState<number>(0);
  const [isReacted, setIsReacted] = useState<boolean>(false);
  const [newComment, setNewComment] = useState<string>("");

  const [keyboardOffset, setKeyboardOffset] = useState(0);

  const [token, setToken] = useState<string>("");

  const [showAuthSheet, setShowAuthSheet] = useState<boolean>(false);

  const [replyPlaceholder, setReplyPlaceholder] = useState<string>("");
  const [replyId, setReplyId] = useState<string>("");
  const [tempReplyId, setTempReplyId] = useState<string>("");
  const [newReply, setNewReply] = useState<any>();

  const commentInputRef = useRef<TextInput>(null);

  const {
    data: commentsQuery,
    isLoading: isCommentsLoading,
    isFetching,
    isError,
    refetch,
  } = useGetCommentsQuery({
    id: post?._id,
    limit: 50,
  });

  const getAuthUser = useCallback(async () => {
    const authToken = await getToken();
    setToken(authToken);
  }, []);

  useEffect(() => {
    getAuthUser();

    const showSubscription = Keyboard.addListener("keyboardDidShow", () => {
      setKeyboardOffset(offset);
    });

    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardOffset(0);
    });
  }, []);

  useEffect(() => {
    console.log("got comments ", commentsQuery?.author);
    if (commentsQuery) {
      setComments(commentsQuery.comments);
    }
  }, [commentsQuery]);

  const handleReact = async () => {
    if (!token) {
      return setShowAuthSheet(true);
    }
    if (isReacted) {
      setReactionCount(reactionCount - 1);
      return setIsReacted(false);
    }
    setReactionCount(reactionCount + 1);
    setIsReacted(true);
    try {
      const result = await reactPost({
        id: post._id,
        type: "like",
      });

      console.log("successfully added reaction ", result.data);
    } catch (e: any) {
      console.log("cannot like post", e.message);
    }
  };

  const getPost = async () => {
    const localPost = await AsyncStorage.getItem("selectedPost");
    const parsedPost = JSON.parse(localPost!);
    setPost(parsedPost);
    setMedia([...(parsedPost?.images || []), ...(parsedPost?.videos || [])]);
    setReactions(parsedPost?.reactions);
    // setComments(parsedPost?.comments);
    setReactionCount(parsedPost?.reactions?.length);
  };

  const body = useMemo(() => {
    if (!post) return;
    const newBody = post?.body?.split(" ").map((word: any) => {
      if (word.includes("#")) {
        return (
          <Text key={word} style={{ color: "#16783A" }}>
            {word}
          </Text>
        );
      }
      return word + " ";
    });
    return newBody;
  }, [post]);

  const handleSendComment = async () => {
    if (!newComment) {
      return;
    }
    const user = await getUser();

    const constructComment = {
      author: {
        name: user.username || user.firstName + " " + user.lastName,
        id: user.id,
        image: user?.profileImage?.url,
      },
      content: newComment,
      createdAt: moment().toISOString(),
    };

    try {
      if (replyId) {
        await handleReplyComment(replyId, newComment);
        setNewComment("");
        setNewReply({ ...constructComment, id: replyId + "-reply" });
        return setReplyId("");
      }
      setComments([...comments, constructComment]);
      setNewComment("");
      const result = await commentPost({
        id: post._id,
        content: newComment,
      }).unwrap();
      // setComments(response.data.comments);
    } catch (e: any) {
      console.log("error creating comment ", e.response.data);
    }
  };

  const handleRequestReply = useCallback((id: string, placeholder: string) => {
    setReplyId(id);
    setReplyPlaceholder(placeholder);
    commentInputRef?.current?.focus();
  }, []);

  const handleReplyComment = useCallback(
    async (replyId: string, comment: string) => {
      try {
        const result = await replyComment({
          id: post._id,
          commentId: replyId,
          content: comment,
        }).unwrap;
        console.log("reply result", result);
      } catch (e) {
        console.log("could not reply comment ", e);
      }
    },
    [replyId],
  );

  useEffect(() => {
    if (isFocused) {
      getPost();
      refetch();
    }
  }, [isFocused]);

  if (!post?._id) {
    return (
      <View style={{ paddingTop: 50, flex: 1, backgroundColor: "#121212" }}>
        <ActivityIndicator
          size={"small"}
          color={"#16783A"}
          style={{ marginTop: 30, marginHorizontal: "auto" }}
        />
      </View>
    );
  } else {
    return (
      <View
        className="flex-1 h-full bg-[#121212]"
        style={{ paddingTop: insets.top }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.select({
            ios: 0,
            android: keyboardOffset,
          })}
          style={{ flex: 1, backgroundColor: "#121212" }}
        >
          <FocusAwareStatusBar
            barStyle="light-content"
            backgroundColor="#121212"
          />
          <View className="flex-row items-center justify-between gap-[12px] px-[17px] pt-[30px] pb-[12px]">
            <View className="flex-row items-center gap-[12px]">
              <TouchableOpacity className="" onPress={() => router.back()}>
                <Entypo
                  name="chevron-left"
                  size={24}
                  color="rgba(204, 204, 204, 0.8)"
                />
              </TouchableOpacity>
              <Image
                source={
                  post?.author?.image
                    ? { uri: post?.author?.image }
                    : require("../../../assets/icons/profile.jpg")
                }
                contentFit="cover"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 40,
                }}
              />
              <View style={styles.userMetadata}>
                <Text style={styles.userName}>{post?.author?.name}</Text>
                <Text style={styles.timestamp}>
                  {timeFromNow(post?.createdAt)}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => null}>
              <Entypo name="dots-three-vertical" size={16} color="#ccc" />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
            <View style={{ paddingHorizontal: 16, paddingVertical: 5 }}>
              <Text style={styles.postBody}>{body?.map((bd: any) => bd)}</Text>
            </View>

            {media?.length > 0
              ? media?.map((med) => (
                  <SingleMediaItem item={med} key={med._id} />
                ))
              : null}

            <View
              style={{
                marginVertical: 20,

                flexDirection: "row",
                justifyContent: "center",
                gap: 30,
              }}
            >
              <TouchableOpacity
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                }}
                onPress={handleReact}
              >
                <Text>❤️</Text>
                <Text
                  style={{
                    color: "#ccc",
                    fontSize: 12,
                    fontFamily: "LexendDeca",
                  }}
                >
                  {formatNumber(reactionCount)} Reactions
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Octicons name="comment" size={14} color="#ccc" />

                <Text
                  style={{
                    color: "#ccc",
                    fontSize: 12,
                    fontFamily: "LexendDeca",
                  }}
                >
                  {formatNumber(comments?.length)} Comments
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Ionicons name="arrow-redo-sharp" size={14} color="#ccc" />

                <Text
                  style={{
                    color: "#ccc",
                    fontSize: 12,
                    fontFamily: "LexendDeca",
                  }}
                >
                  Share
                </Text>
              </TouchableOpacity>
            </View>

            <View className="p-[16px]">
              {comments?.length > 0
                ? comments
                    ?.slice()
                    ?.reverse()
                    ?.map((comment, index) => (
                      <Comment
                        item={{ ...comment, postId: post?._id }}
                        key={comment.id || index}
                        handleRequestReply={handleRequestReply}
                        newReply={
                          newReply?.id?.split("-")?.[0] == comment?.id
                            ? newReply
                            : null
                        }
                      />
                    ))
                : null}
            </View>
          </ScrollView>

          <View
            className="flex-row items-center gap-[12px] py-[12px] pb-[12px] border-t-[0.5px] border-t-[#888787] px-[17px]"
            style={{ marginBottom: 12 }}
          >
            <View className="flex-row justify-between gap-[4px] px-[12px] py-[8px] rounded-[24px] items-center w-full shrink border-[1px] border-[#ccc]">
              <TextInput
                ref={commentInputRef}
                placeholder={
                  replyId ? `replying to ${replyPlaceholder}` : "Add comment..."
                }
                placeholderTextColor={"rgba(204,204,204,0.25)"}
                className="text-[15px] text-[#f2f2f2] font-LexendDeca w-full shrink p-0"
                value={newComment}
                multiline
                onChangeText={(text) => setNewComment(text)}
                onBlur={() => setReplyId("")}
              />
              <Pressable onPress={handleSendComment}>
                <MaterialCommunityIcons
                  name="send-circle"
                  size={30}
                  color="#16783A"
                />
              </Pressable>
            </View>
          </View>

          <BottomSheet
            bgColor="#121212"
            childrenStyle="!px-[11px]"
            showCloseIcon={false}
            title=""
            show={showAuthSheet}
            titleColor="!text-white"
            snapPoints={["20%"]}
            enableDynamicSizing={false}
            onRequestClose={() => setShowAuthSheet(false)}
            keyboardBehavior="interactive"
          >
            <AuthSheet closeSheet={() => setShowAuthSheet(false)} />
          </BottomSheet>
        </KeyboardAvoidingView>
      </View>
    );
  }
};

const SingleMediaItem = memo(({ item }: { item: any }) => {
  const videoRef = useRef<Video>(null);
  const [aspectRatio, setAspectRatio] = useState(1);
  const [playing, setPlaying] = useState<boolean>(false);
  const [muted, setMuted] = useState<boolean>(false);

  const isVideo = useMemo(
    () => item?.public_id?.split("/")[1] === "videos",
    [],
  );

  const playPauseVideo = () => {
    if (videoRef.current) {
      if (playing) {
        videoRef.current.pauseAsync();
        setPlaying(false);
      } else {
        videoRef.current?.playAsync();
        setPlaying(true);
      }
    }
  };

  const muteUnmuteVideo = () => {
    if (videoRef.current) {
      if (muted) {
        videoRef.current.setIsMutedAsync(false);
        setMuted(false);
      } else {
        videoRef.current?.setIsMutedAsync(true);
        setMuted(true);
      }
    }
  };

  const handlePlaybackStatusUpdate = (status: any) => {
    if (status.didJustFinish) {
      setPlaying(false);
    }
  };

  if (isVideo) {
    return (
      <Pressable onPress={() => playPauseVideo()}>
        <Video
          ref={videoRef}
          source={{ uri: item.url }}
          style={[styles.mediaItem, { aspectRatio }]}
          resizeMode={ResizeMode.COVER}
          onReadyForDisplay={(event) => {
            const { width, height } = event.naturalSize; // Get dimensions
            if (width && height) {
              setAspectRatio(width / height); // Dynamically set aspect ratio
            }
          }}
          onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
          isLooping
          shouldPlay={playing}
        />

        <Pressable style={styles.playVideo} onPress={() => playPauseVideo()}>
          {playing ? (
            <AntDesign name="pause" size={12} color="white" />
          ) : (
            <FontAwesome6 name="play" size={12} color="white" />
          )}
        </Pressable>

        <Pressable
          style={[styles.playVideo, { right: 8, left: "auto" }]}
          onPress={() => muteUnmuteVideo()}
        >
          {muted ? (
            <Octicons name="mute" size={12} color="white" />
          ) : (
            <Octicons name="unmute" size={12} color="white" />
          )}
        </Pressable>
      </Pressable>
    );
  }

  return (
    <Image
      source={{ uri: item?.url }}
      contentFit="cover"
      // transition={300}
      style={[styles.mediaItem, { aspectRatio }]}
      onLoad={({ source }) => {
        setAspectRatio(source.width / source.height);
      }}
      cachePolicy="memory-disk"
    />
  );
});

const SingleComment = memo(({ item }: { item: any }) => {
  return (
    <View className="flex-row gap-2 mb-[16px]">
      <View className="rounded-[50%] bg-[#16783a] justify-center items-center w-[24px] h-[24px] overflow-hidden">
        {item?.author?.profileImage?.url ? (
          <Image
            source={{ uri: item?.author?.profileImage?.url }}
            className="w-full h-full"
            contentFit="cover"
          />
        ) : (
          <Text className="text-white text-[10px]">
            {item.author.firstName.charAt(0).toUpperCase() +
              item.author.lastName.charAt(0).toUpperCase()}
          </Text>
        )}
      </View>
      <View className="shrink">
        <Text className="text-[#ccc] mb-[4px]">
          {item.author.firstName + " " + item.author.lastName}
        </Text>
        <Text className="text-white leading-20 font-[400] mb-[12px]">
          {item?.content}
        </Text>
        <Text className="text-[#f2f2f2] text-[12px] opacity-50">
          {timeFromNow(item.createdAt)}
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  userMetadata: {
    gap: 5,
  },
  userName: {
    fontSize: 16,
    color: "#ccc",
    fontFamily: "LexendDeca-Medium",
  },
  timestamp: {
    fontSize: 8,
    color: "#ccc",
    fontFamily: "LexendDeca-Light",
  },
  postBody: {
    color: "#ccc",
    fontFamily: "LexendDeca",
    fontSize: 14,
    marginBottom: 10,
  },
  playVideo: {
    position: "absolute",
    bottom: 8,
    left: 8,
    width: 30,
    height: 30,
    borderRadius: 30,
    backgroundColor: "#121212",
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  mediaContainer: {
    width: width,
    height: undefined,
    // maxHeight: 600,
    position: "relative",
    backgroundColor: "#111",
    borderRadius: 4,
    flex: 1,
  },
  mediaItem: {
    width: width,
    height: undefined,
    maxHeight: "100%",
    alignSelf: "center",
    // aspectRatio: 1,
  },
  contentContainer: {
    paddingVertical: 10,
    // flexGrow: 1,
    justifyContent: "flex-end",
  },
  messageContainer: {
    maxWidth: "80%",
    flex: 1,
    marginVertical: 4,
    marginHorizontal: 17,
    flexDirection: "row",
    alignItems: "flex-end",
  },
  myMessageContainer: {
    alignSelf: "flex-end",
  },
  otherMessageContainer: {
    alignSelf: "flex-start",
  },
  myMessage: {
    backgroundColor: "#F2F2F2",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderTopRightRadius: 12,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 0,
  },
  otherMessage: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderTopRightRadius: 8,
    borderTopLeftRadius: 8,
    borderBottomRightRadius: 8,
    backgroundColor: "rgba(204, 204, 204, 0.25)",
  },
  messageText: {
    fontSize: 15,
    fontFamily: "LexendDeca",
    marginRight: 6,
  },
  otherMessageText: {
    fontSize: 15,
    color: "#fff",
    marginRight: 6,
    fontFamily: "LexendDeca",
  },
  emptyList: {
    flex: 1,
    justifyContent: "flex-end",
  },
});

export default MorePostInfo;
