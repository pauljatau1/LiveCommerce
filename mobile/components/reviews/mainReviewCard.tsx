import { View, Text, Image, Pressable } from "react-native";
import React, { useCallback, memo } from "react";
import moment from "moment";
import AntDesign from "@expo/vector-icons/AntDesign";
import { router } from "expo-router";

interface imageDimensions {
  width: any;
  height: number;
}

const MainReviewCard = ({
  name,
  date,
  rating,
  comment,
  images,
  buyerImage,
  reviewId,
  productId,
}: any) => {
  const formatDate = (date: string) => {
    let rawDate = moment(date);
    const formattedDate = rawDate.format("DD MMMM YYYY");
    return formattedDate;
  };

  const renderImages = useCallback((images: any[]) => {
    return (
      <View>
        {images?.length == 1 ? (
          <View>
            <Image
              source={{ uri: images[0]?.url }}
              style={{
                resizeMode: "cover",
                width: "100%",
                height: 190,
                borderRadius: 4,
                backgroundColor: "#111",
              }}
            />
          </View>
        ) : images?.length == 2 ? (
          <View className="flex-row gap-[8px] items-center">
            {images.map((image, index) => (
              <Image
                key={index}
                source={{ uri: image?.url }}
                style={{
                  resizeMode: "cover",
                  width: "50%",
                  flexShrink: 1,
                  height: 190,
                  borderRadius: 4,
                  backgroundColor: "#111",
                }}
              />
            ))}
          </View>
        ) : (
          <View className="flex-row gap-[8px] items-center">
            <Image
              source={{ uri: images[0]?.url }}
              style={{
                resizeMode: "cover",
                width: "90%",
                flexShrink: 1,
                height: 190,
                borderRadius: 4,
                backgroundColor: "#111",
              }}
            />
            <View
              className="flex-col h-[190px] w-[50%] shrink gap-[8px] items-center"
              style={{ flexShrink: 1 }}
            >
              {images?.slice(1)?.map((image, index) => (
                <Image
                  key={index}
                  source={{ uri: image?.url }}
                  style={{
                    resizeMode: "cover",
                    width: "100%",
                    flexShrink: 1,
                    height: "50%",
                    borderRadius: 4,
                    backgroundColor: "#111",
                  }}
                />
              ))}
            </View>
          </View>
        )}
      </View>
    );
  }, []);

  return (
    <Pressable
      className=" gap-[4px]"
      onPress={() =>
        router.push({
          pathname: "/reviews/details",
          params: { reviewId, productId },
        })
      }
    >
      <View className="flex-row item-center gap-[6px]">
        <View
          className=" bg-[#B190B6] flex-row items-center justify-center"
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
          }}
        >
          {buyerImage ? (
            <Image
              source={{ uri: buyerImage }}
              resizeMode="cover"
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
              }}
            />
          ) : (
            <>
              <Text className="text-white text-[11px] font-LexendDecaMedium">
                {name?.split("")[0]}
              </Text>
              <Text className="text-white text-[11px] font-LexendDecaMedium">
                {name?.split(" ")[1]?.split("")[0]}
              </Text>
            </>
          )}
        </View>
        <View className="gap-[2px]">
          <Text className="text-white text-[13px] font-LexendDecaMedium">
            {name}
          </Text>
          <Text className="text-white text-[11px] opacity-60 font-LexendDecaLight">
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
                size={11}
                color="#rgba(255, 255, 255, 0.62)"
              />
            ) : (
              <AntDesign name="star" size={11} color="#FFD700" key={index} />
            ),
          )}
      </View>
      <Text className="text-white text-[14px] leading-[18px] font-LexendDeca mb-[12px]">
        {comment}
      </Text>
      {images?.length > 0 ? renderImages(images) : null}
      {/* <Image
        source={{ uri: imageUrl }}
        style={{
          resizeMode: "cover",
          width: imageDimensions.width,
          height: imageDimensions.height,
          borderRadius: 4,
        }}
      /> */}
    </Pressable>
  );
};

export default memo(MainReviewCard);
