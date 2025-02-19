import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { icons, images } from "@/constants";
import CustomButton from "../button/CustomButton";

const AuctionCard = ({ ...props }) => {
  return (
    <View className=" bg-black rounded-lg p-[11.85px]  w-[173px] min-h-[299px]">
      {/* Product Image */}
      <Image
        source={images.diamondsImage}
        resizeMode="cover"
        className="w-[149px] h-[157px]"
      />
      {/* Product Details */}
      <View className="w-full">
        <Text className="text-white text-[10px] font-LexendDecaSemiBold  text-normal pt-3">
          Original Polo Suit Used Fairly
        </Text>
        <View className="relative flex-row items-center gap-x-2">
          <Text className="text-white font-LexendDecaSemiBold text-[12px]]">
            ₦529
          </Text>
          <Text className="font-LexendDecaBold text-[#FFD700]  text-[8px]">
            ₦ +1.4K Shipping{" "}
          </Text>
        </View>
        <View className="relative flex-row items-center gap-x-2">
          <Text className="text-primary-200 font-LexendDeca  text-[10px]">
            8 Bids
          </Text>
          <View className="w-[6px] h-[6px] bg-white rounded-full" />
          <Text className="font-LexendDecaBold !text-[#FF6600E5]  text-[8px]">
            5d : 1h
          </Text>
        </View>
        <Text className="text-[#FFD700] text-[8px] pb-[12.47px] font-LexendDecaSemiBold mt-[2px]">
          Odera Joseph is winning
        </Text>
      </View>
      {/* Seller Information */}
      <View className="relative flex-row gap-x-2">
        <View>
          <Image source={images.manImage} className="relative" />
          <Text className="text-white text-[3px] font-LexendDeca font-normal text-center absolute bottom-[0px] left-3 flex-row  bg-[#FF0A0A] flex justify-center items-center p-[2px] pr-[3px] rounded-full ">
            Live
          </Text>
          <Image
            source={icons.indicatorSmallIcon}
            resizeMode="contain"
            className="absolute bottom-[17px] right-[-2.5px] z-50 "
          />
        </View>
        <View>
          <Text className="text-gray-200 text-[8.5px] font-LexendDeca font-semibold">
            Amos Kito
          </Text>
          <View className="flex-row items-center gap-x-1">
            <View className="flex-row items-center gap-x-2">
              <Text className="text-black bg-[#E8C300] rounded-[1.747px] flex justify-center items-center px-[2.329px] py-[0.582px] text-[2.912px] font-LexendDecaBold">
                Top seller
              </Text>
            </View>
            <View className="flex-row items-center">
              <Image source={icons.starIcon} />
              <Text className="text-white flex justify-center items-center px-[2.329px] py-[0.582px] text-[6px] font-LexendDecaBold">
                4.7
              </Text>
            </View>
          </View>
        </View>
      </View>
      <Text className="text-[#425466] text-[8px] font-LexendDeca  font-semibold mt-[8px]">
        Lagos, Nigeria
      </Text>

      <CustomButton
        textStyle="!text-[8px] !font-semibold  !py-0"
        title="Bid"
        className="mt-[8px] bg-primary-200 !p-0 !px-[9.872px] !rounded-[2.962px] py-[5px]"
      />
    </View>
  );
};

export default AuctionCard;
