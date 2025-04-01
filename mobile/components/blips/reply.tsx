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
import axios from "axios";

const { width } = Dimensions.get("window");

const Reply = memo(({ item }: { item: any }) => {
  const [liked, setLiked] = useState<boolean>(false);
  const [likes, setLikes] = useState<number>(item?.likesCount);

  const handleLikeReply = useCallback(async () => {
    try {
      const token = await getToken();

      const config = {
        method: "POST",
        url:
          process.env.EXPO_PUBLIC_API_URL +
          `api/products/${item.productId}/blips/${item.blipId}/comments/${item?.commentId}/replies/${item?._id}/like`,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: {},
      };
      const result = await axios(config);

      console.log("like comment result ", result.data);
      if (result?.data?.liked) {
        setLiked(result?.data?.liked);
        setLikes((prevState) =>
          result?.data?.liked ? prevState + 1 : prevState - 1 || 0,
        );
      }
    } catch (e) {
      console.log("error liking reply");
    }
  }, []);
  return (
    <View className="flex-row items-start gap-2 ">
      <View className="rounded-[50%] bg-[#16783a] justify-center items-center w-[28px] h-[28px]">
        {item?.user?.avatar ? (
          <Image
            source={{ uri: item?.user?.avatar }}
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
            }}
            contentFit="cover"
          />
        ) : (
          <Text className="text-white text-[10px] font-LexendDeca">
            {item?.user?.name?.charAt(0)?.toUpperCase()}
          </Text>
        )}
      </View>
      <View className=" w-[100%] shrink">
        <Text className="text-[#ccc] mb-[4px] py-[0px] font-LexendDeca">
          {item?.user?.name ||
            item?.user?.firstName + " " + item?.user?.lastName}
        </Text>
        <Text className="text-white leading-20 font-[400] mb-[8px] font-LexendDecaMedium">
          {item?.comment}
        </Text>
        <View className="flex-row items-center justify-between gap-[12px] mb-[12px]">
          <View className="flex-row items-center justify-between gap-[12px]">
            <Text className="text-[#f2f2f2] text-[12px] opacity-50 font-LexendDeca">
              {timeFromNow(item?.createdAt)}
            </Text>
          </View>
          <Pressable
            className="flex-row items-center gap-[8px]"
            onPress={() => handleLikeReply()}
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
      </View>
    </View>
  );
});

export default Reply;
