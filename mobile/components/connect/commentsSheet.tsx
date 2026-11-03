import {
  View,
  Text,
  FlatList,
  Pressable,
  Dimensions,
  TextInput,
} from "react-native";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { formatNumber, timeFromNow } from "@/helpers/helpers";
import { Image } from "expo-image";
import moment from "moment";
import { getToken, getUser } from "@/store/features/auth/utils";
import {
  useCommentPostMutation,
  useGetCommentsQuery,
  useGetRepliesQuery,
  useLikeCommentMutation,
  useLikeReplyMutation,
  useReplyCommentMutation,
} from "@/services/posts";
import { ActivityIndicator } from "react-native-paper";
import LottieView from "lottie-react-native";
import { Fontisto, MaterialIcons } from "@expo/vector-icons";
import { BottomSheetTextInputProps } from "@gorhom/bottom-sheet/lib/typescript/components/bottomSheetTextInput";
import Comment from "./comment";

const { width } = Dimensions.get("window");

const CommentsSheet = memo(
  ({
    handleIncreaseCommentCount,
    allComments,
    commentsCount,
    handleAddComment,
    id,
    handleCantComment,
  }: {
    handleIncreaseCommentCount: () => void;
    allComments: any;
    commentsCount: number;
    handleAddComment: any;
    id: string;
    handleCantComment: any;
  }) => {
    const {
      data: commentsQuery,
      isLoading: isCommentsLoading,
      isFetching,
      isError,
      refetch,
    } = useGetCommentsQuery({
      id,
      limit: 50,
    });
    const [commentPost, { isLoading }] = useCommentPostMutation({});
    const [replyComment, { isLoading: isLoadingReplyComment }] =
      useReplyCommentMutation({});
    const [comments, setComments] = useState<any[]>([]);
    const [comment, setComment] = useState<string>("");
    const [page, setPage] = useState<number>(1);
    const [loading, setLoading] = useState<boolean>(true);
    const [replyPlaceholder, setReplyPlaceholder] = useState<string>("");
    const [tempReplyId, setTempReplyId] = useState<string>("");
    const [replyId, setReplyId] = useState<string>("");
    const [newReply, setNewReply] = useState<any>();
    const handleCreateComment = async () => {
      const token = await getToken();
      if (!token) {
        return handleCantComment();
      }
      const user = await getUser();

      const constructComment = {
        author: {
          name: user.username || user.firstName + " " + user.lastName,
          id: user.id,
          image: user?.profileImage?.url,
        },
        content: comment,
        createdAt: moment().toISOString(),
      };
      try {
        if (replyId) {
          await handleReplyComment(replyId, comment);
          setComment("");
          return setNewReply({ ...constructComment, id: replyId + "-reply" });
        }
        setComments([...comments, constructComment]);
        setComment("");
        handleIncreaseCommentCount();
        handleAddComment(constructComment);

        const result = await commentPost({
          id,
          content: comment,
        }).unwrap();
        // setComments(response.data.comments);
        setPage(1);
        setLoading(false);
      } catch (e: any) {
        console.log("error creating comment ", e.response.data);
      }
    };

    const commentInputRef = useRef<TextInput | any>(null);

    const handleRequestReply = useCallback(
      (id: string, placeholder: string) => {
        setReplyId(id);
        setTempReplyId(id);
        setReplyPlaceholder(placeholder);
        commentInputRef?.current?.focus();
      },
      [],
    );

    const handleReplyComment = useCallback(
      async (replyId: string, comment: string) => {
        try {
          const result = await replyComment({
            id,
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
      console.log("got comments ", commentsQuery?.author);
      if (commentsQuery) {
        setComments(commentsQuery.comments);
      }
    }, [commentsQuery]);

    const renderComments = useCallback(
      ({ item }: { item: any }) => {
        return (
          <Comment
            item={{ ...item, postId: id }}
            handleRequestReply={handleRequestReply}
            newReply={
              newReply?.id?.split("-")?.[0] == item?.id ? newReply : null
            }
          />
        );
      },
      [newReply],
    );

    useEffect(() => {
      refetch();
    }, []);
    return (
      <View className="px-[10px] items-center h-full">
        {isCommentsLoading ? (
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
          <View className="h-full pb-[50px]">
            <Text className="text-white text-center mb-[30px]">
              {formatNumber(commentsCount) || "No"}{" "}
              {commentsCount > 1 ? "comments" : "comment"}
            </Text>
            <View
              style={{
                paddingBottom: 60,
              }}
            >
              <FlatList
                data={comments?.slice()?.reverse()}
                renderItem={renderComments}
                keyExtractor={(item, index) => item?.id || index}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{}}
              />
            </View>
          </View>
        )}
        <View className="w-[100%] rounded-[22px] py-[12px] px-[12px] bg-[#2e2e2e] absolute bottom-2 self-center">
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
              width: "100%",
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
  },
);

export default CommentsSheet;
