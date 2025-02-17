import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Dimensions,
  FlatList,
  TextInput,
  ScrollView,
  Keyboard,
} from "react-native";
import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import { FocusAwareStatusBar } from "@/components/ui/focus-aware-status-bar";
import { router } from "expo-router";
import Entypo from "@expo/vector-icons/Entypo";
import { Image } from "expo-image";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { timeFromNow } from "@/helpers/helpers";
import AntDesign from "@expo/vector-icons/AntDesign";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import Octicons from "@expo/vector-icons/Octicons";
import { ResizeMode, Video } from "expo-av";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { getUser } from "@/store/features/auth/utils";
import moment from "moment";
import { useCommentPostMutation, useReactPostMutation } from "@/services/posts";
import Ionicons from "@expo/vector-icons/Ionicons";

const { width } = Dimensions.get("window");
const offset = 20;

const MorePostInfo = () => {
  const [commentPost, { isLoading }] = useCommentPostMutation({});
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

  useEffect(() => {
    const showSubscription = Keyboard.addListener("keyboardDidShow", () => {
      setKeyboardOffset(offset);
    });

    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardOffset(0);
    });
  }, []);

  const handleReact = async () => {
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
    console.log("more post info");
    const parsedPost = JSON.parse(localPost!);
    setPost(parsedPost);
    setMedia([...(parsedPost?.images || []), ...(parsedPost?.videos || [])]);
    setReactions(parsedPost?.reactions);
    setComments(parsedPost?.comments);
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
    const user = await getUser();

    const constructComment = {
      author: {
        firstName: user.firstName,
        lastName: user.lastName,
      },
      content: newComment,
      createdAt: moment().toISOString(),
    };
    setComments([...comments, constructComment]);
    setNewComment("");
    try {
      const result = await commentPost({
        id: post._id,
        content: newComment,
      }).unwrap();
      // setComments(response.data.comments);
    } catch (e: any) {
      console.log("error creating comment ", e.response.data);
    }
  };

  useEffect(() => {
    getPost();
  }, []);
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.select({
        ios: 0,
        android: keyboardOffset,
      })}
      style={{ flex: 1, backgroundColor: "#121212" }}
    >
      <FocusAwareStatusBar barStyle="light-content" backgroundColor="#121212" />
      <SafeAreaView className="flex-1 h-full">
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
                  : require("../../../assets/icons/animoji.png")
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
            ? media?.map((med) => <SingleMediaItem item={med} key={med._id} />)
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
                {reactionCount} Reactions
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
                {comments?.length} Comments
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
                  ?.map((comment) => (
                    <SingleComment item={comment} key={comment._id} />
                  ))
              : null}
          </View>
        </ScrollView>

        <View className="gap-[12px] flex-col items-center  bg-[#121212]">
          <View className="flex-row items-center gap-[12px] pt-[12px] pb-[12px] border-t-[0.5px] border-t-[#888787] px-[17px]">
            <View className="flex-row justify-between gap-[4px] px-[12px] py-[8px] rounded-[24px] items-center w-full shrink border-[1px] border-[#ccc]">
              <TextInput
                placeholder="Add a comment..."
                placeholderTextColor={"rgba(204,204,204,0.25)"}
                className="text-[15px] text-[#f2f2f2] font-LexendDeca w-full shrink p-0"
                value={newComment}
                multiline
                onChangeText={(text) => setNewComment(text)}
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
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
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
  console.log(item);

  return (
    <View className="flex-row gap-2 mb-[16px]">
      <View className="rounded-[50%] bg-[#16783a] justify-center items-center w-[24px] h-[24px]">
        <Text className="text-white text-[10px]">
          {item.author.firstName.charAt(0).toUpperCase() +
            item.author.lastName.charAt(0).toUpperCase()}
        </Text>
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
