import { View, Text, Image, TouchableOpacity } from "react-native";
import React from "react";
import { icons, images } from "@/constants";
import CustomButton from "../button/CustomButton";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { useLivestream } from "../../../contexts/livestreamContext";
import { Link, useRouter } from "expo-router";

const LiveProductCard = ({ item, showBtn, showLive }: any) => {
  const router = useRouter();
  const { joinStream } = useLivestream();

  return (
    <TouchableOpacity
      onPress={() =>
        router.push(`/livestream/livestreamStudio?id=${item?._id}`)
      }
      className="mr-2 w-[170px] rounded-lg"
    >
      {/* Seller Info */}

      <View className="flex-row items-center mb-2 justify-between ">
        <View className="flex-row items-center gap-2">
          <Image
            source={{ uri: item?.seller?.storeAvatar?.url }}
            className="w-8 h-8 rounded-full"
          />
          <Text
            numberOfLines={1}
            className="text-gray-200 text-sm font-medium capitalize font-LexendDeca"
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
          className="h-[240px] w-[160px] rounded-lg"
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
          <Link href={`/livestream/livestreamStudio?id=${item?._id}`} asChild>
            <TouchableOpacity className="bg-black/30 rounded-full p-4">
              <Ionicons name="play" size={25} color="white" />
            </TouchableOpacity>
          </Link>
        </View>
      </View>

      {/* Content Below Image */}
      <View className="mt-2">
        {/* Title */}
        <Text className="text-white text-base capitaliza font-LexendDeca font-semibold">
          {item?.title}
        </Text>

        {/* Tags */}
        <View className="flex-row">
          <Text
            numberOfLines={2}
            className="text-[#027CEC] text-xs font-LexendDeca"
          >
            {item?.category} • {item?.tags?.join(", ")}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default LiveProductCard;
