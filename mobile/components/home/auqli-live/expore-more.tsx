import { View, Text, FlatList } from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import SectionHeader from "@/components/global/section-header";
import LiveProductCardTemplate from "@/components/global/live-product-card/LiveProductCardTemplate";
import CustomButton from "@/components/global/button/CustomButton";
import { router } from "expo-router";
import axios from "axios";
import LiveProductCard from "@/components/global/live-product-card";
import HomepageSkeleton from "@/components/skeleton/homepageSkeleton";

const ExploreMoreSection = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [moreStreams, setMoreStreams] = useState<any[]>([]);
  const fetchMoreStreams = async () => {
    try {
      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL + `api/streams?status=live`,
      );
      if (response.status === 200) {
        console.log("spotlight streams", response.data?.streams?.length);
        setMoreStreams(response.data?.streams);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const renderEmptyStreams = useCallback(() => {
    return (
      <View
        style={{
          marginVertical: 40,
          width: "100%",
        }}
      >
        <Text className="font-LexendDecaMedium text-[14px] text-[#ccc] text-center">
          No Streams
        </Text>
      </View>
    );
  }, [moreStreams]);

  useEffect(() => {
    fetchMoreStreams();
  }, []);
  return (
    <View className="pt-[30px] w-[100%]">
      <SectionHeader title="Explore More Shows" />

      {loading ? (
        <HomepageSkeleton numOfLoaders={2} height={220} padding={16} />
      ) : moreStreams.length > 0 ? (
        <View
          style={{
            paddingLeft: 16,
          }}
        >
          <FlatList
            data={moreStreams}
            renderItem={({ item }) => <LiveProductCard item={item} />}
            keyExtractor={(item, index) => item?._id || index.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              gap: 14,
            }}
            className="pt-[14px]"
          />
        </View>
      ) : (
        renderEmptyStreams()
      )}
      <View className="w-full relative px-[23px]">
        <Text className="text-center text-[#fff] text-[16px] font-LexendDecaBold pt-[40px]">
          Still Searching
        </Text>
        <View className="flex-row w-full space-x-3 gap-4 justify-center pt-[18px]">
          <CustomButton
            title="Explore Categories"
            textStyle="!font-LexendDecaSemiBold text-xs"
            className="border !w-[47%]  rounded-md border-[#EDF2F7] bg-transparent"
            onPress={() => {
              router.push("/(root)/(tabs)/explore/explore");
            }}
          />
          <CustomButton
            title="Visit Community"
            textStyle="!font-LexendDecaSemiBold text-xs"
            className="!w-[47%] !bg-primary-200  rounded-md  "
            onPress={() => {
              router.push("/(root)/(tabs)/connect");
            }}
          />
        </View>
      </View>
    </View>
  );
};

export default ExploreMoreSection;
