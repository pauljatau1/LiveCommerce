import { View, Text, Image, TouchableOpacity } from "react-native";
import React from "react";
import { icons, images } from "@/constants";
import CustomButton from "../button/CustomButton";

const LiveProductCard = ({ item, showBtn, showLive, lastSeller }: any) => {
  return (
    <View
      className={`bg-black p-[11.847px] mr-[4px] mb-[5.54px]  gap-x-3 w-[172.922px] rounded-[7.898px] `}
    >
      <View className="flex-row justify-between items-center">
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
                <Text className="text-black bg-[#E8C300] rounded-[1.747px] flex justify-center items-center px-[2.329px] py-[0.582px] text-[2.912px] font-LexendDeca font-bold">
                  Top seller
                </Text>
              </View>
              <View className="flex-row items-center">
                <Image source={icons.starIcon} />
                <Text className="text-white flex justify-center items-center px-[2.329px] py-[0.582px] text-[6px] font-LexendDeca font-bold">
                  4.7
                </Text>
              </View>
            </View>
          </View>
        </View>
        <TouchableOpacity className="flex-row justify-center items-center bg-primary-200 rounded-[2.333px] py-[2.67px] px-[4.67px]">
          <Image source={icons.basePlusIcon} />
          <Text className="text-white text-[5.833px] font-LexendDeca font-semibold">
            Follow
          </Text>
        </TouchableOpacity>
      </View>

      <View className="mt-[8px]">
        <View>
          <Image
            source={images.youngWomanImage}
            // resizeMethod="scale"
            resizeMode="cover"
            className="h-[180px] w-[150px] relative"
          />
          {showLive ? (
            <Text className="bg-[#FE4C4C] rounded-[1.949px] px-[3.69px] py-[2.15px] text-white text-[4.924px] flex justify-center items-center absolute font-LexendDeca mt-[7.5px] ml-[6.59px] ">
              Live Now . 121
            </Text>
          ) : (
            <Text className="bg-[#fff] rounded-[1.949px] px-[3.69px] py-[2.15px] text-[#2F2E41] text-[4.924px] flex justify-center items-center absolute font-LexendDeca mt-[7.5px] ml-[6.59px] ">
              9/11, 5:00 PM{" "}
            </Text>
          )}
        </View>
        <Text className="text-white text-[10px] font-LexendDeca font-semibold mt-[8px]">
          Luxury Jackets
        </Text>
        <Text className="text-[#027CEC] text-[8px] font-LexendDeca  font-semibold mt-[2px]">
          Jackets. #Sweatshirts
        </Text>
        <Text className="text-[#425466] text-[8px] font-LexendDeca  font-semibold mt-[8px]">
          Lagos, Nigeria
        </Text>
      </View>
      {showBtn && (
        <CustomButton
          textStyle="!text-[8px] !font-semibold  !py-0"
          title="Watch  now"
          className="mt-[8px] bg-primary-200 !p-0 !px-[9.872px] !rounded-[2.962px] py-[5px]"
        />
      )}
    </View>
  );
};

export default LiveProductCard;
