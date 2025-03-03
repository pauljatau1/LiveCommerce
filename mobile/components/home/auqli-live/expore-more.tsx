import { View, Text, FlatList } from "react-native";
import React from "react";
import SectionHeader from "@/components/global/section-header";
import LiveProductCardTemplate from "@/components/global/live-product-card/LiveProductCardTemplate";
import CustomButton from "@/components/global/button/CustomButton";
import { router } from "expo-router";

const ExploreMoreSection = () => {
  return (
    <View className="pt-[30px] w-[100%] pb-[50px]">
      <SectionHeader title="Explore More Shows" />
      <View
        style={{
          paddingLeft: 16,
        }}
      >
        <FlatList
          data={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
          renderItem={(item) => (
            <LiveProductCardTemplate {...item} showLive={true} showBtn={true} />
          )}
          keyExtractor={(item) => item.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          className="pt-[14px]"
        />
      </View>
      <View className="w-full relative px-[23px]">
        <Text className="text-center text-[#fff] text-[16px] font-LexendDecaBold pt-[40px]">
          Still Searching
        </Text>
        <View className="flex-row w-full space-x-3 gap-4 justify-center pt-[18px]">
          <CustomButton
            title="Explore Categories"
            textStyle="!font-LexendDecaSemiBold text-xs"
            className="border !w-[47%]  rounded-md border-[#EDF2F7] bg-transparent"
            onPress={() => {}}
          />
          <CustomButton
            title="Visit Community"
            textStyle="!font-LexendDecaSemiBold text-xs"
            className="!w-[47%] !bg-primary-200  rounded-md  "
            onPress={() => {}}
          />
        </View>
      </View>
    </View>
  );
};

export default ExploreMoreSection;
