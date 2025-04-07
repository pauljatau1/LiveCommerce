import { View, Text, FlatList, TextInput, BackHandler } from "react-native";
import React, { useCallback, useEffect, useRef, useState, memo } from "react";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { formatNumber } from "@/helpers/helpers";
import { ActivityIndicator } from "react-native-paper";
import Comment from "./comment";
import axios from "axios";
import moment from "moment";
import { getToken, getUser } from "@/store/features/auth/utils";
import LottieView from "lottie-react-native";

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

  const commentInputRef = useRef<TextInput | any>(null);

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
    const token = await getToken();
    try {
      const config = {
        method: "GET",
        url:
          process.env.EXPO_PUBLIC_API_URL +
          `api/products/${product.id}/blips/${id}/comments?page=${page}&limit=20`,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: null,
      };
      const response = await axios(config);
      setComments(
        response.data.comments?.filter((cm: any) => cm?.buyer?.firstName),
      );
      setPage(page + 1);
      setLoading(false);
    } catch (e: any) {
      console.log("error retrieving comment ", e.response.data);
    }
  };

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
      setComments([...comments, constructComment]);
      setComment("");
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
      // setComments(response.data.comments);
      setPage(1);
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

      BackHandler.addEventListener("hardwareBackPress", onBackPress);

      return () => {
        BackHandler.removeEventListener("hardwareBackPress", onBackPress);
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
        <View className="h-full pb-[50px] ">
          <Text className="text-white text-center mb-[30px] font-LexendDecaMedium">
            {formatNumber(commentCount) || "No"}{" "}
            {commentCount > 1 || commentCount == 0 ? "comments" : "comment"}
          </Text>
          <FlatList
            data={comments.slice().reverse()}
            renderItem={renderComments}
            keyExtractor={(item, index) => item._id || index.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              gap: 0,
            }}
          />
        </View>
      )}
      <View className="w-[100%] rounded-[22px] py-[12px] px-[12px] bg-[#2e2e2e] absolute bottom-2 self-center ">
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
