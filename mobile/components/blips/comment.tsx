import { View, Text, Pressable } from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import { Image } from "expo-image";
import { timeFromNow } from "@/helpers/helpers";
import { getToken } from "@/store/features/auth/utils";
import axios from "axios";
import { Fontisto, MaterialIcons } from "@expo/vector-icons";
import { isLoading } from "expo-font";
import LottieView from "lottie-react-native";
import Reply from "./reply";

const Comment = ({
  item,
  handleRequestReply,
  newReply,
}: {
  item: any;
  handleRequestReply: any;
  newReply: any;
}) => {
  const [page, setPage] = useState<number>(1);
  const [hasReachedEnd, setHasReachedEnd] = useState<boolean>(false);
  const [showReplies, setShowReplies] = useState<boolean>(false);
  const [replies, setReplies] = useState<any[]>(item?.replies?.slice(0, 5));
  const [liked, setLiked] = useState<boolean>(item?.isLiked || false);
  const [likes, setLikes] = useState<number>(item?.likesCount);
  const [loading, setLoading] = useState<boolean>(false);

  const handleGetReplies = async () => {
    setLoading(true);
    const token = await getToken();
    try {
      const config = {
        method: "GET",
        url:
          process.env.EXPO_PUBLIC_API_URL +
          `api/products/${item.productId}/blips/${item.blipId}/comments/${item._id}/replies?page=${page}&limit=5`,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: null,
      };
      const response = await axios(config);
      if (response.data.replies?.length > 0) {
        if (page == 1) {
          setReplies(
            response.data.replies?.filter((cm: any) => cm?.user?.name),
          );
        } else {
          setReplies((prevReplies) => [
            ...prevReplies,
            ...response.data.replies?.filter((cm: any) => cm?.user?.name),
          ]);
        }

        setPage(page + 1);
      }
      if (
        response.data?.pagination?.currentPage ==
          response.data?.pagination?.totalPages ||
        response.data?.pagination?.totalPages < 1
      ) {
        setHasReachedEnd(true);
      }
      setLoading(false);
    } catch (e: any) {
      console.log("error retrieving comment replies", e.response.data);
      setLoading(false);
    }
  };

  const handleLikeComment = useCallback(async () => {
    try {
      const token = await getToken();
      const config = {
        method: "POST",
        url:
          process.env.EXPO_PUBLIC_API_URL +
          `api/products/${item.productId}/blips/${item.blipId}/comments/${item._id}/like`,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: {},
      };
      const result = await axios(config);

      console.log("like comment result ", result.data);
      setLiked(result?.data?.liked);
      setLikes((prevState) =>
        result?.data?.liked ? prevState + 1 : prevState - 1,
      );
    } catch (e) {
      console.log("error liking comment");
    }
  }, []);

  const handleShowReplies = useCallback(() => {
    if (!showReplies) {
      setShowReplies(true);
    }
    handleGetReplies();
  }, [page, showReplies]);

  const handleHideReplies = useCallback(() => {
    setShowReplies(false);
    setPage(1);
    setHasReachedEnd(false);
  }, [page, showReplies]);

  useEffect(() => {
    if (newReply?.id) {
      setReplies([newReply, ...replies]);
    }
  }, [newReply]);
  return (
    <View className="flex-row gap-2 mb-[16px] items-start">
      <View className="rounded-[50%] bg-[#16783a] justify-center items-center w-[30px] h-[30px]">
        {item.buyer?.profileImage?.url ? (
          <Image
            source={{ uri: item.buyer?.profileImage?.url }}
            className="w-[30px] h-[30px] rounded-[50%]"
          />
        ) : (
          <Text className="text-white text-[10px] font-LexendDeca">
            {item?.buyer?.firstName?.charAt(0)?.toUpperCase() +
              item?.buyer?.lastName?.charAt(0)?.toUpperCase()}
          </Text>
        )}
      </View>
      <View className="w-[100%] shrink">
        <Text className="text-[#ccc] mb-[4px] font-LexendDeca">
          {item?.buyer?.firstName + " " + item?.buyer?.lastName}
        </Text>
        <Text className="text-white leading-20 font-[400] mb-[12px] font-LexendDecaMedium">
          {item?.comment}
        </Text>
        <View className="flex-row items-center justify-between gap-[12px] mb-[12px]">
          <View className="flex-row items-center justify-between gap-[12px]">
            <Text className="text-[#f2f2f2] text-[12px] opacity-50 font-LexendDeca">
              {timeFromNow(item?.createdAt)}
            </Text>
            <Pressable
              onPress={() =>
                handleRequestReply(
                  item?._id,
                  item?.buyer?.firstName + " " + item?.buyer?.lastName,
                )
              }
            >
              <Text className="text-[#ccc] text-[13px] font-LexendDeca">
                Reply
              </Text>
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
            <Text className="text-[#ccc] text-[13px] font-LexendDeca">
              {likes}
            </Text>
          </Pressable>
        </View>

        {replies?.length > 0 && (
          <View>
            {showReplies && (
              <View className="mt-[10px]">
                {replies?.map((reply: any) => (
                  <Reply
                    key={reply._id}
                    item={{
                      ...reply,
                      productId: item?.productId,
                      blipId: item?.blipId,
                      commentId: item?._id,
                    }}
                  />
                ))}
              </View>
            )}

            {loading && (
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

            <View
              className="flex-row items-center gap-[20px]"
              style={{ marginBottom: 5 }}
            >
              <View className="h-[1.5px] w-[20px] bg-[#2e2e2e]"></View>
              {!hasReachedEnd ? (
                <Pressable
                  className="flex-row items-center gap-[8px]"
                  onPress={handleShowReplies}
                >
                  <View className="flex-row items-center">
                    <Text className="text-[#ccc] text-[13px] font-LexendDeca">
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
                    <Text className="text-[#ccc] text-[13px] font-LexendDeca">
                      Hide
                    </Text>
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
};

export default Comment;
