import { View, Text, Image, TouchableOpacity } from "react-native";
import React from "react";
import { icons, images } from "@/constants";
import CustomButton from "../button/CustomButton";
import { AntDesign } from '@expo/vector-icons';
import { useLivestream } from "../../../contexts/livestreamContext";
import { Link } from "expo-router";

const LiveProductCard = ({ item, showBtn, showLive }: any) => {

  const { joinStream } = useLivestream();

  const handleJoinStream = async () => {
    await joinStream(item?._id);
  }



  return (
    <View className="bg-black border border-[#222] p-3 mr-2 w-[180px] rounded-lg">
      {/* Seller Info */}

      <View className="flex-row items-center mb-4 justify-between mt-3">
        <View className="flex-row items-center gap-2">

          <Image
            source={{ uri: item?.seller?.storeAvatar?.url }}
            className="w-6 h-6 rounded-full"
          />
          <Text className="text-gray-200 text-xs capitalize font-LexendDeca">
            {item?.seller?.storeName}
          </Text>
        </View>
        <View className="bg-[#E8C300] rounded px-1 mt-0.5">
          <Text className="text-black text-[10px] font-LexendDeca">
            Top Seller
          </Text>
        </View>
      </View>
      {/* Main Product Image */}
      <View className="relative">
        <Image
          source={require('../../../assets/images/young-woman-organizing-live-shop 1.png')}
          resizeMode="cover"
          className="h-[240px] w-full rounded-lg"
        />
        <View className="absolute top-2 left-2">
          <View className="bg-[#FE4C4C] flex-row items-center gap-2 px-2 animate-pulse py-1 rounded-full">
            <Text className="text-white text-[10px] font-LexendDeca">
              Live Now  • 
            </Text>
            <Text className="text-white text-[10px] font-LexendDeca">{item?.viewers?.length || 0}</Text>
          </View>
        </View>


        {/* Play Button Overlay */}
        <View className="absolute inset-0 flex items-center justify-center">
          <Link href={`/livestream/livestreamStudio?id=${item?._id}`} asChild>
            <TouchableOpacity onPress={handleJoinStream} className="bg-black/30 rounded-full p-4">
              <AntDesign name="playcircleo" size={42} color="white" />
            </TouchableOpacity>
          </Link>
        </View>


      </View>

      {/* Content Below Image */}
      <View className="mt-3">
        {/* Title */}
        <Text className="text-white text-sm capitaliza font-LexendDeca font-semibold">
          {item?.title}
        </Text>



        {/* Tags */}
        <View className="flex-row mt-1">
          <Text className="text-[#027CEC] text-xs font-LexendDeca">
            {item?.category} • {item?.tags?.join(', ')}
          </Text>
        </View>

        {/* Location */}
        <Text className="text-[#425466] text-xs font-LexendDeca mt-1">
          {item?.seller?.businessName || 'Missouri, USA'}
        </Text>
      </View>

      {/* Watch Now Button */}
      {showBtn && (
        <Link  href={`/livestream/livestreamStudio?id=${item?._id}`} asChild>
          <TouchableOpacity onPress={handleJoinStream} className="mt-3 bg-[#16783A] rounded-md py-2 px-4">
            <Text className="text-white text-sm font-semibold text-center font-LexendDeca">
              Watch Now

            </Text>
          </TouchableOpacity>
        </Link>
      )}
    </View>


  );
};

export default LiveProductCard;
