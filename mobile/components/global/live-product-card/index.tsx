import { View, Text, Image, TouchableOpacity, Dimensions } from "react-native";
import React from "react";
import { icons, images } from "@/constants";
import CustomButton from "../button/CustomButton";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { useLivestream } from "../../../contexts/livestreamContext";
import { Link, useRouter } from "expo-router";

const { width } = Dimensions.get("window");

const LiveProductCard = ({ item, showBtn, showLive }: any) => {
  const router = useRouter();
  const { joinStream } = useLivestream();

  return (
    <TouchableOpacity
      onPress={() =>
        item.type !== "auction" ? router.push(`/livestream/liveAuctionStudio?id=${item?._id}`) : router.push(`/livestream/livestreamStudio?id=${item?._id}`)
      }
      className=" rounded-lg"
      style={{
        width: "100%",
        maxWidth: (width - 32) / 2 - 6,
        // maxWidth: 240,
      }}
    >
      {/* Seller Info */}

      <View className="flex-row items-center mb-2 justify-between ">
        <View className="flex-row items-center gap-2">
          <Image
            source={{ uri: item?.seller?.storeAvatar?.url }}
            className="w-8 h-8 rounded-full"
            resizeMode="cover"
          />
          <Text
            numberOfLines={1}
            className="text-gray-200 text-sm font-medium capitalize font-LexendDecaMedium"
          >
            {item?.seller?.storeName}
          </Text>
        </View>
      </View>
      {/* Main Product Image */}
      <View className="relative">
        <Image
          source={{ uri: item?.coverImage?.url }}
          resizeMode="cover"
          className="h-[240px] w-[100%] rounded-lg"
        />
        <View className="absolute top-2 left-2">
          <View className="bg-[#FE4C4C] flex-row items-center gap-2 px-2 animate-pulse py-1 rounded-md">
            <Text className="text-white text-[10px] font-LexendDeca">
              Live •
            </Text>
            <Text className="text-white text-[10px] font-LexendDeca">
              {item?.viewers?.length || 0}
            </Text>
          </View>
        </View>

        {/* Play Button Overlay */}
        <View className="absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center">
          <Link href={`${item.type === "auction" ? "/livestream/liveAuctionStudio" : "/livestream/livestreamStudio"}?id=${item?._id}`} asChild>
            <TouchableOpacity className="bg-black/30 rounded-full p-4">
              <Ionicons name="play" size={25} color="white" />
            </TouchableOpacity>
          </Link>
        </View>
      </View>

      {/* Content Below Image */}
      <View className="mt-2">
        {/* Title */}
        <Text
          numberOfLines={1}
          className="text-white text-base capitalize max-w-[150px] font-LexendDeca font-semibold"
        >
          {item?.title}
        </Text>

        {/* Tags */}
        <View className="flex-row">
          <Text
            numberOfLines={2}
            className="text-[#027CEC] max-w-[150px] text-xs font-LexendDeca"
          >
            {item?.category} • {item?.tags?.join(", ")}
          </Text>
        </View>

        <Text className="text-[#425466] text-[8px] font-LexendDeca mt-1">
          Lagos, Nigeria
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default LiveProductCard;
