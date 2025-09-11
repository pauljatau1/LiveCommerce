import {
  View,
  Text,
  FlatList,
  TextInput,
  BackHandler,
  Pressable,
  Platform,
} from "react-native";
import React, { useCallback, useEffect, useRef, useState, memo } from "react";
import {
  BottomSheetFlatList,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import { formatNumber } from "@/helpers/helpers";
import { ActivityIndicator } from "react-native-paper";
import Comment from "./comment";
import axios from "axios";
import moment from "moment";
import { getToken, getUser } from "@/store/features/auth/utils";
import LottieView from "lottie-react-native";
import { AntDesign } from "@expo/vector-icons";
import { trackEvent } from "@/utils/analytics";
import AsyncStorage from "@react-native-async-storage/async-storage";

const CommentsSheet = ({
  handleIncreaseCommentCount,
  product,
  id,
  commentCount,
  handleCantComment,
  closeCommentsSheet,
}: {
  handleIncreaseCommentCount: () => void;
  product: any;
  id: string;
  commentCount: number;
  handleCantComment: any;
  closeCommentsSheet: any;
}) => {
  const [comments, setComments] = useState<any[]>([]);
  const [comment, setComment] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [replyPlaceholder, setReplyPlaceholder] = useState<string>("");
  const [replyId, setReplyId] = useState<string>("");
  const [newReply, setNewReply] = useState<any>();
  const [hasReachedEnd, setHasReachedEnd] = useState<boolean>(false);
  const [isFetching, setIsFetching] = useState<boolean>(false);

  const commentInputRef = useRef<TextInput | any>(null);
  const commentsListRef = useRef<FlatList | any>(null);

  const handleRequestReply = useCallback((id: string, placeholder: string) => {
    setReplyId(id);
    setReplyPlaceholder(placeholder);
    commentInputRef?.current?.focus();
  }, []);

  const handleReplyComment = useCallback(
    async (replyId: string, comment: string) => {
      try {
        const token = await getToken();
        const result = await axios.post(
          process.env.EXPO_PUBLIC_API_URL +
            `api/products/${product.id}/blips/${id}/comments/${replyId}/replies`,
          {
            comment,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        console.log("reply result", result.data);
      } catch (e) {
        console.log("could not reply comment ", e);
      }
    },
    [replyId],
  );

  const handleGetComments = async () => {
    console.log("fetching comments", {
      page,
    });

    if (isFetching || hasReachedEnd) return;

    if (page == 1) {
      setLoading(true);
    } else {
      setIsFetching(true);
    }
    const token = await getToken();
    try {
      const config = {
        method: "GET",
        url:
          process.env.EXPO_PUBLIC_API_URL +
          `api/products/${product.id}/blips/${id}/comments?page=${page}&limit=10`,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: null,
      };
      const response = await axios(config);
      setComments([
        ...comments,
        ...response.data.comments?.filter((cm: any) => cm?.buyer?.firstName),
      ]);
      setPage(page + 1);
      if (!response.data?.pagination?.hasMore) {
        setHasReachedEnd(true);
      }
      setLoading(false);
    } catch (e: any) {
      console.log("error retrieving comment ", e.response.data);
    } finally {
      setIsFetching(false);
      setLoading(false);
    }
  };

  // const fetchMoreComments = async() => {
  //   if (isFetching || hasReachedEnd) return;

  //   return
  // }

  const handleCreateComment = async () => {
    const token = await getToken();
    const user = await getUser();
    if (!token) {
      return handleCantComment();
    }
    const constructComment = {
      buyer: {
        firstName: user?.firstName,
        lastName: user?.lastName,
        profileImage: {
          url: user?.profileImage?.url,
        },
      },
      comment: comment,
      createdAt: moment().toISOString(),
    };

    try {
      if (replyId) {
        const constructReply = {
          user: {
            firstName: user?.firstName,
            lastName: user?.lastName,
            avatar: user?.profileImage?.url,
          },
          comment: comment,
          createdAt: moment().toISOString(),
        };
        setComment("");
        setNewReply({ ...constructReply, id: replyId + "-reply" });
        return await handleReplyComment(replyId, comment);
      }
      if (hasReachedEnd) {
        setComments([constructComment, ...comments]);
      } else {
        setComments([
          constructComment,
          ...comments.slice(0, comments?.length - 1),
        ]);
      }

      setComment("");
      commentsListRef?.current?.scrollToOffset({ offset: 0, animated: false });
      handleIncreaseCommentCount();
      const config = {
        method: "POST",
        url:
          process.env.EXPO_PUBLIC_API_URL +
          `api/products/${product.id}/blips/${id}/comments`,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: {
          comment,
        },
      };
      const response = await axios(config);

      if (response.status == 201) {
        try {
          const userData = await AsyncStorage.getItem("user");
          const user = JSON.parse(userData || "{}");
          trackEvent("blip_commented", {
            blipId: id,
            userId: user?._id,
            email: user?.email,
            firstName: user?.firstName,
            lastName: user?.lastName,
            username: user?.username,
            timestamp: new Date().toISOString(),
          });
        } catch (error) {
          console.error("Error tracking blip commented:", error);
        }
      }
      // setComments(response.data.comments);
      // setPage(1);
      setLoading(false);
    } catch (e: any) {
      console.log("error creating comment ", e.response.data);
    }
  };

  const renderComments = useCallback(
    ({ item }: { item: any }) => {
      return (
        <Comment
          item={{ ...item, productId: product.id, blipId: id }}
          handleRequestReply={handleRequestReply}
          newReply={
            newReply?.id?.split("-")?.[0] == item?._id ? newReply : null
          }
        />
      );
    },
    [newReply, comments],
  );

  useEffect(
    useCallback(() => {
      const onBackPress = () => {
        closeCommentsSheet();
        return true;
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );

      return () => {
        subscription.remove();
      };
    }, []),
  );

  useEffect(() => {
    handleGetComments();
  }, [id, product]);

  return (
    <View className="px-[12px] h-full items-center">
      {loading ? (
        <LottieView
          source={require("../../assets/lottie/dots-loading.json")}
          autoPlay
          loop
          style={{
            width: 50,
            height: 30,
          }}
        />
      ) : (
        <View className="h-full pb-[50px] w-full">
          <View className="mb-[30px] flex-row items-center justify-center">
            <Text className="text-white text-center  font-LexendDecaMedium self-center">
              {formatNumber(commentCount) || "No"}{" "}
              {commentCount > 1 || commentCount == 0 ? "comments" : "comment"}
            </Text>
            <Pressable
              onPress={closeCommentsSheet}
              className="flex-end self-end absolute right-[0px]"
            >
              <AntDesign name="close" size={20} color="white" />
            </Pressable>
          </View>

          <BottomSheetFlatList
            ref={commentsListRef}
            data={comments}
            renderItem={renderComments}
            keyExtractor={(item, index) => item._id || index.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              gap: 0,
            }}
            onEndReached={handleGetComments}
          />
        </View>
      )}
      <View
        className="w-[100%] rounded-[22px] py-[12px] px-[12px] bg-[#2e2e2e] absolute bottom-2 self-center "
        style={{
          bottom: Platform.OS == "ios" ? -12 : 8,
        }}
      >
        <BottomSheetTextInput
          ref={commentInputRef}
          placeholder={
            replyId ? `replying to ${replyPlaceholder}` : "Add comment..."
          }
          placeholderTextColor={"#ccc"}
          style={{
            fontSize: 15,
            color: "#fff",
            padding: 0,
            fontFamily: "LexendDeca",
          }}
          returnKeyType="send"
          value={comment}
          onChangeText={(text) => setComment(text)}
          onBlur={() => setReplyId("")}
          onSubmitEditing={handleCreateComment}
        />
      </View>
    </View>
  );
};

export default memo(CommentsSheet);
