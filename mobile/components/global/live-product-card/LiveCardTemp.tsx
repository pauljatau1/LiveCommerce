import { View, Text, Image, TouchableOpacity } from "react-native";
import React from "react";
import { icons, images } from "@/constants";
import CustomButton from "../button/CustomButton";
import { AntDesign } from "@expo/vector-icons";
import { useLivestream } from "../../../contexts/livestreamContext";
import { Link } from "expo-router";

const LiveCardTemp = ({ item, showBtn, showLive }: any) => {
  const { joinStream } = useLivestream();

  const handleJoinStream = async () => {
    await joinStream(item?._id);
  };

  return (
    <TouchableOpacity className="  w-[100%] rounded-lg" activeOpacity={0.7}>
      {/* Seller Info */}

      <View className="flex-row items-center mb-2 justify-between flex-wrap gap-2 mt-1">
        <View className="flex-row items-center gap-2">
          <Image source={images.manImage} className="w-8 h-8 rounded-full" />
          <Text className="text-gray-200 w-[50px] text-sm font-medium capitalize font-LexendDeca">
            Batman
          </Text>
        </View>
      </View>
      {/* Main Product Image */}
      <View className="relative bg-black h-[240px] w-[160px] rounded-lg ">
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
        {/*<View className="absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center">
          <TouchableOpacity className="bg-black/30 rounded-full p-4">
            <AntDesign name="playcircleo" size={42} color="white" />
          </TouchableOpacity>
        </View>*/}

        <View className="absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center">
          <Image
            source={require("../../../assets/icons/auqli-logo.png")}
            className="w-8 h-8 "
          />
        </View>
      </View>

      {/* Content Below Image */}
      <View className="mt-2">
        {/* Title */}
        <Text className="text-white text-sm capitaliza font-LexendDeca font-semibold">
          Auqli Livestream
        </Text>

        {/* Tags */}
        <View className="flex-row">
          <Text className="text-[#027CEC] text-xs font-LexendDeca">
            Computers • shopping
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default LiveCardTemp;
