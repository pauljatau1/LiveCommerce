import { View, Text, Image, Pressable } from "react-native";
import React from "react";
import moment from "moment";
import AntDesign from "@expo/vector-icons/AntDesign";
import { router } from "expo-router";

interface imageDimensions {
  width: any;
  height: number;
}

const ReviewCard = ({
  name,
  date,
  rating,
  comment,
  imageUrl,
  imageDimensions,
  reviewId,
  productId,
}: any) => {
  const formatDate = (date: string) => {
    let rawDate = moment(date);
    const formattedDate = rawDate.format("DD MMMM YYYY");
    return formattedDate;
  };

  return (
    <Pressable
      className="p-[4px] mr-2 gap-[4px]"
      style={{ maxWidth: imageDimensions.width }}
      onPress={() =>
        router.push({
          pathname: "/reviews/details",
          params: { reviewId, productId },
        })
      }
    >
      <View className="flex-row item-center gap-[6px]">
        <View className="w-[23px] h-[23px] rounded-full bg-[#B190B6] flex-row items-center justify-center">
          <Text className="text-white text-[9px]">{name?.split("")[0]}</Text>
          <Text className="text-white text-[9px]">
            {name?.split(" ")[1]?.split("")[0]}
          </Text>
        </View>
        <View className="gap-[2px]">
          <Text className="text-white text-[8px]">{name}</Text>
          <Text className="text-white text-[7px] opacity-60">
            {formatDate(date)}
          </Text>
        </View>
      </View>

      <View className="flex-row gap-[2px] items-center">
        {Array(5)
          .fill(0)
          .map((_, index) =>
            parseInt(rating) < index + 1 ? (
              <AntDesign
                key={index}
                name="star"
                size={8}
                color="#rgba(255, 255, 255, 0.62)"
              />
            ) : (
              <AntDesign name="star" size={8} color="#FFD700" key={index} />
            ),
          )}
      </View>
      <Text className="text-white text-[8px] leading-[10px] ">
        {imageDimensions?.width <= 190
          ? comment?.slice(0, 40) + "..."
          : comment}
      </Text>
      <Image
        source={{ uri: imageUrl }}
        style={{
          resizeMode: "cover",
          width: imageDimensions.width,
          //   maxWidth: imageDimensions.width,
          height: imageDimensions.height,
          borderRadius: 4,
        }}
      />
    </Pressable>
  );
};

export default ReviewCard;
