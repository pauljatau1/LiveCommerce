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
import Reply from "./reply";

const { width } = Dimensions.get("window");

const Comment = memo(
  ({
    item,
    handleRequestReply,
    newReply,
  }: {
    item: any;
    handleRequestReply: any;
    newReply: any;
  }) => {
    const [likeComment, { isLoading: isLoadingLikeComment }] =
      useLikeCommentMutation();
    const [page, setPage] = useState<number>(1);
    const [hasReachedEnd, setHasReachedEnd] = useState<boolean>(false);
    const [showReplies, setShowReplies] = useState<boolean>(false);
    const { data, isLoading, isFetching, isError } = useGetRepliesQuery({
      id: item?.postId,
      commentId: item?.id,
      page,
      limit: 5,
    });

    const [replies, setReplies] = useState<any[]>([]);
    const [liked, setLiked] = useState<boolean>(false);
    const [likes, setLikes] = useState<number>(item?.likes);

    const handleLikeComment = useCallback(async () => {
      try {
        const result = await likeComment({
          id: item?.postId,
          commentId: item?.id,
        });

        console.log("like comment result ", result.data);
        setLiked(result?.data?.liked);
        setLikes((prevState) =>
          result?.data?.liked ? prevState + 1 : prevState - 1,
        );
      } catch (e) {
        console.log("error liking comment");
      }
    }, []);

    const getMoreReplies = useCallback(() => {
      if (hasReachedEnd || isFetching) {
        return;
      }
      setPage((prevPage) => prevPage + 1);
    }, [page, showReplies]);

    const handleShowReplies = useCallback(() => {
      if (!showReplies) {
        return setShowReplies(true);
      }
      getMoreReplies();
    }, [page, showReplies]);

    const handleHideReplies = useCallback(() => {
      setShowReplies(false);
      setPage(1);
      setHasReachedEnd(false);
    }, [page, showReplies]);

    useEffect(() => {
      if (data?.replies?.length > 0) {
        if (page == 1) {
          return setReplies(data.replies);
        }
        setReplies([...replies, ...data.replies]);

        if (data?.currentPage == data?.totalPages || data?.totalPages < 1) {
          setHasReachedEnd(true);
        }
      }
    }, [data]);

    useEffect(() => {
      if (replies?.length == 1) {
        setShowReplies(true);
      }
    }, [replies]);

    useEffect(() => {
      if (newReply?.id) {
        setReplies([newReply, ...replies]);
      }
    }, [newReply]);
    return (
      <View className="flex-row items-start gap-2 mb-[24px]">
        <View className="rounded-[50%] bg-[#16783a] justify-center items-center w-[28px] h-[28px]">
          {item?.author?.image ? (
            <Image
              source={{ uri: item?.author?.image }}
              className="w-[28px] h-[28px] rounded-[50%]"
              contentFit="cover"
            />
          ) : (
            <Text className="text-white text-[10px]">
              {item?.author?.name?.charAt(0)?.toUpperCase()}
            </Text>
          )}
        </View>
        <View className=" w-[100%] shrink">
          <Text className="text-[#ccc] mb-[4px] py-[0px]">
            {item?.author?.name}
          </Text>
          <Text className="text-white leading-20 font-[400] mb-[8px]">
            {item?.content}
          </Text>
          <View className="flex-row items-center justify-between gap-[12px] mb-[12px]">
            <View className="flex-row items-center justify-between gap-[12px]">
              <Text className="text-[#f2f2f2] text-[12px] opacity-50">
                {timeFromNow(item?.createdAt)}
              </Text>
              <Pressable
                onPress={() => handleRequestReply(item?.id, item?.author?.name)}
              >
                <Text className="text-[#ccc] text-[13px]">Reply</Text>
              </Pressable>
            </View>
            <Pressable
              className="flex-row items-center gap-[8px]"
              onPress={() => handleLikeComment()}
            >
              {liked ? (
                <Fontisto name="heart" size={14} color="#FF0A0A" />
              ) : (
                <Fontisto name="heart-alt" size={14} color="#ccc" />
              )}
              <Text className="text-[#ccc] text-[13px]">{likes}</Text>
            </Pressable>
          </View>

          {replies?.length > 0 && (
            <View>
              {showReplies && (
                <View className="mt-[10px]">
                  {replies?.map((reply: any) => (
                    <Reply
                      key={reply.id}
                      item={{
                        ...reply,
                        postId: item.postId,
                        commentId: item.id,
                      }}
                    />
                  ))}
                </View>
              )}

              {isFetching && (
                <LottieView
                  source={require("../../assets/lottie/dots-loading.json")}
                  autoPlay
                  loop
                  style={{
                    width: 50,
                    height: 30,
                  }}
                />
              )}

              <View className="flex-row items-center gap-[20px]">
                <View className="h-[1.5px] w-[20px] bg-[#2e2e2e]"></View>
                {!hasReachedEnd ? (
                  <Pressable
                    className="flex-row items-center gap-[8px]"
                    onPress={handleShowReplies}
                  >
                    <View className="flex-row items-center">
                      <Text className="text-[#ccc] text-[13px]">
                        View Replies
                      </Text>
                      <MaterialIcons
                        name="keyboard-arrow-down"
                        size={14}
                        color="#ccc"
                      />
                    </View>
                  </Pressable>
                ) : null}

                {showReplies ? (
                  <Pressable
                    className="flex-row items-center gap-[8px]"
                    onPress={handleHideReplies}
                  >
                    <View className="flex-row items-center">
                      <Text className="text-[#ccc] text-[13px]">Hide</Text>
                      <MaterialIcons
                        name="keyboard-arrow-up"
                        size={14}
                        color="#ccc"
                      />
                    </View>
                  </Pressable>
                ) : null}
              </View>
            </View>
          )}
        </View>
      </View>
    );
  },
);

export default Comment;
