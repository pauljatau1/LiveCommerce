import { View, Text, TouchableOpacity, Image } from "react-native";
import React from "react";
import { router } from "expo-router";
import { icons } from "@/constants";

interface Props {
  name: string;
  price: string;
  category: string;
  seller: any;
  image_url: string;
  rating: any;
}

const ConnectProductCard = ({
  name,
  price,
  category,
  seller,
  image_url,
  rating,
}: Props) => {
  return (
    <View className=" bg-black rounded-lg p-[11.85px]  w-[100%] h-[299px]">
      <Image
        source={{
          uri: image_url,
        }}
        resizeMode="cover"
        className="w-[100%] h-[157px]"
      />

      {/* Product Details */}
      <View>
        <Text className="text-white text-[10px] capitalize font-LexendDecaBold  text-normal pt-3">
          {name?.slice(0, 25)}
        </Text>
        <Text className="text-white font-LexendDecaBold  text-[10px]">
          ₦{price?.toLocaleString()}
        </Text>
        <Text className="text-[#027CEC] text-[8px] pb-[4px] font-LexendDecaSemiBold mt-[2px]">
          #{category}
        </Text>
      </View>
      {/* Seller Information */}
      <View className="relative flex-row gap-x-2">
        <View>
          <Text className="text-gray-200 text-[8.5px] font-LexendDeca font-semibold">
            {seller?.sellerName}
          </Text>
          {rating > 0 && (
            <View className="flex-row items-center">
              <Text className="text-white text-[8px] font-LexendDecaMedium">
                Rating:{"  "}
              </Text>
              <Image source={icons.starIcon} />
              <Text className="text-white flex justify-center items-center px-[2.329px] py-[0.582px] text-[8px] font-LexendDecaMedium">
                {rating}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

export default ConnectProductCard;
