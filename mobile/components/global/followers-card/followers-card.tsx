import { View, Text, Image } from "react-native";
import React from "react";
import { icons, images } from "@/constants";
import CustomButton from "@/components/global/button/CustomButton";

const FollowCard = ({ item, data }: { item: string; data: any }) => {
  return (
    <View className={`mt-[9px] w-full px-[4px] gap-x-3  `}>
      <View className="border border-[#CCCCCC1A] rounded-[10px] py-[4px] px-[12px] ">
        <View className="flex flex-col items-center justify-center">
          <Image
            source={{
              uri:
                data?.storePresence?.storeAvatar?.url ||
                "https://media.istockphoto.com/id/1315110986/vector/store-editable-stroke-outline-icon-isolated-on-white-background-flat-vector-illustration.jpg?s=612x612&w=0&k=20&c=mCrUUX3bWTZOvKrr3ontPWJKO_9HAOmboDxxd_XeIRI=",
            }}
            resizeMode="cover"
            className="relative rounded-full w-[60px] h-[60px] "
          />
          <Text className="text-[#CCCCCCCC] text-[12.28px] font-LexendDecaBold pt-1">
            {data.storeName || data.businessName}
          </Text>
          <Text className="text-[#CCCCCCCC] text-[7.67px] pt-1 font-LexendDecaLight">
            231k followers
          </Text>
          <View className="flex-row items-center pt-1">
            <Image source={icons.starIcon} />
            <Text className="text-white flex justify-center items-center px-[2.329px] py-[0.582px] text-[6px] font-LexendDeca font-bold">
              4.7
            </Text>
          </View>
          <Text className="text-[#CCCCCC] text-[8px] font-LexendDeca pt-1  font-light">
            Lagos, Nigeria
          </Text>
        </View>
        <CustomButton
          textStyle="!text-[8px] !font-semibold  !py-0"
          title="Follow"
          className="mt-[2px] bg-primary-200 !p-0 !px-[9.872px] !rounded-[2.962px] py-[5px]"
          IconLeft={() => <Image source={icons.basePlusIcon} />}
        />
      </View>
    </View>
  );
};

export default FollowCard;
