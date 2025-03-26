import React, { useEffect, useState } from "react";
import { View, Text, Image, TouchableOpacity, Pressable } from "react-native";
import { icons, images } from "@/constants";
import CustomButton from "../button/CustomButton";
import { formatTimeFromNow } from "@/helpers/helpers";
import { router } from "expo-router";

const AuctionCard = ({ item, closeSheet }: any) => {
  const [bidTime, setBidTime] = useState<any>();

  useEffect(() => {
    const timer = setInterval(
      () => setBidTime(formatTimeFromNow(item?.auction?.endDate)),
      1000,
    );

    return () => clearInterval(timer);
  }, []);
  return (
    <Pressable
      className=" bg-black rounded-lg p-[11.85px]  w-[173px] min-h-[299px]"
      onPress={() => {
        closeSheet();
        router.push(`/product/${item?._id}`);
      }}
    >
      {/* Product Image */}
      <Image
        source={{ uri: item?.images[0]?.url }}
        resizeMode="cover"
        className="w-[149px] h-[157px]"
      />
      {/* Product Details */}
      <View className="w-full">
        <Text
          className="text-white text-[10px] font-LexendDecaSemiBold  text-normal pt-3"
          numberOfLines={2}
          style={{
            height: 40,
          }}
        >
          {item?.name}
        </Text>
        <View className="relative flex-row items-center gap-x-2">
          <Text className="text-white font-LexendDecaSemiBold text-[12px]]">
            ₦
            {(
              item?.auction?.currentHighestBid?.amount || item?.auction?.minBid
            ).toLocaleString()}
          </Text>
          {/* <Text className="font-LexendDecaBold text-[#FFD700]  text-[8px]">
            ₦ +1.4K Shipping{" "}
          </Text> */}
        </View>
        <View className="relative flex-row items-center gap-x-2">
          <Text className="text-primary-200 font-LexendDeca  text-[10px]">
            {item?.auction?.bids?.length} Bids
          </Text>
          <View className="w-[6px] h-[6px] bg-white rounded-full" />
          <Text className="font-LexendDecaBold !text-[#FF6600E5]  text-[8px]">
            {bidTime || formatTimeFromNow(item?.auction?.endDate)}
          </Text>
        </View>
        <Text className="text-[#FFD700] text-[8px] pb-[12.47px] font-LexendDecaSemiBold mt-[2px]">
          {item?.auction?.currentHighestBid?.buyer?.firstName
            ? item?.auction?.currentHighestBid?.buyer?.firstName +
              " " +
              item?.auction?.currentHighestBid?.buyer?.lastName +
              " is winning"
            : "no current winner"}
        </Text>
      </View>
      {/* Seller Information */}
      <View className="relative flex-row gap-x-2">
        <View>
          <Image
            source={{ uri: item?.seller?.storeAvatar?.url }}
            className="w-[20px] h-[20px] rounded-[10px]"
            resizeMode="cover"
          />
        </View>
        <View>
          <Text className="text-gray-200 text-[8.5px] font-LexendDeca font-semibold">
            {item?.seller?.storeName}
          </Text>
          <View className="flex-row items-center gap-x-1">
            <View className="flex-row items-center gap-x-2">
              {/* <Text className="text-black bg-[#E8C300] rounded-[1.747px] flex justify-center items-center px-[2.329px] py-[0.582px] text-[2.912px] font-LexendDecaBold">
                Top seller
              </Text> */}
            </View>
            <View className="flex-row items-center">
              <Image source={icons.starIcon} />
              <Text className="text-white flex justify-center items-center px-[2.329px] py-[0.582px] text-[6px] font-LexendDecaBold">
                {item?.seller?.stats?.averageRating?.toFixed(1)}
              </Text>
            </View>
          </View>
        </View>
      </View>
      <Text className="text-[#425466] text-[8px] font-LexendDeca  font-semibold mt-[8px]">
        {item?.seller?.warehouseDetails?.address.state},{" "}
        {item?.seller?.warehouseDetails?.address.country}
      </Text>

      <CustomButton
        textStyle="!text-[8px] !font-semibold  !py-0"
        title="Bid"
        className="mt-[8px] bg-primary-200 !p-0 !px-[9.872px] !rounded-[2.962px] py-[5px]"
        onPress={() => {
          closeSheet();
          router.push(`/product/${item?._id}`);
        }}
      />
    </Pressable>
  );
};

export default AuctionCard;
