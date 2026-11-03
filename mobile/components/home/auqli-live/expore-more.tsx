import { View, Text, FlatList, Image, Pressable } from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import SectionHeader from "@/components/global/section-header";
import LiveProductCardTemplate from "@/components/global/live-product-card/LiveProductCardTemplate";
import CustomButton from "@/components/global/button/CustomButton";
import { router } from "expo-router";
import axios from "axios";
import LiveProductCard from "@/components/global/live-product-card";
import HomepageSkeleton from "@/components/skeleton/homepageSkeleton";
import { Ionicons } from "@expo/vector-icons";
import { icons } from "@/constants";

const ExploreMoreSection = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [moreStreams, setMoreStreams] = useState<any[]>([]);
  const fetchMoreStreams = async () => {
    try {
      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL +
          `api/streams?status=live_upcoming&limit=30`,
      );
      if (response.status === 200) {
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
      // <View
      //   style={{
      //     marginVertical: 40,
      //     width: "100%",
      //     alignItems: "center",
      //     gap: 10,
      //   }}
      // >
      //   <Ionicons
      //     name="videocam-outline"
      //     size={35}
      //     color="#ccc"
      //     style={{ opacity: 0.5 }}
      //   />
      //   <Text className="font-LexendDecaMedium text-[14px] text-[#ccc] text-center">
      //     No Streams
      //   </Text>
      // </View>
      <View
        style={{
          paddingHorizontal: 16,
          alignItems: "center",
        }}
      >
        <View
          style={{
            marginVertical: 24,
            padding: 24,
            paddingHorizontal: 32,
            alignItems: "center",
            // backgroundColor: "#000",
            borderRadius: 8,
            flexShrink: 1,
            // paddingBottom: 40,
          }}
        >
          <View
            style={{
              width: 102,
              height: 102,
              borderRadius: "50%",
              backgroundColor: "#DDF9E7",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <Image
              source={icons.sadEmoji}
              resizeMode="contain"
              className="w-[40px] h-[40px]"
            />
          </View>

          <Text
            className="mb-[4px] text-center text-[16px] font-LexendDecaSemiBold text-white"
            style={{
              lineHeight: 22,
            }}
          >
            No Live Shows Right Now
          </Text>
          <Text
            className="font-LexendDeca text-[14px] text-[#8F9099] text-center"
            style={{
              lineHeight: 22,
            }}
          >
            But don't worry - Browse the marketplace and shop your favorite
            items
          </Text>

          <Pressable
            className="px-[16px] py-[8px] items-center justify-center rounded-[16px] bg-[#16783A] mt-[16px]"
            onPress={() => router.push("/(root)/(tabs)/home/marketplace")}
          >
            <Text className="text-white text-[10px] font-LexendDecaSemiBold">
              Browse Marketplace
            </Text>
          </Pressable>
        </View>
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
      ) : moreStreams?.length > 0 ? (
        <View
          style={{
            paddingHorizontal: 16,
          }}
        >
          <FlatList
            data={moreStreams}
            renderItem={({ item }) => (
              <View className="w-1/2 py-2 shrink">
                <LiveProductCard item={item} />
              </View>
            )}
            keyExtractor={(item, index) => item?._id || index.toString()}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: "space-between", gap: 12 }}
            showsVerticalScrollIndicator={false}
            className="pt-[14px]"
          />
        </View>
      ) : (
        renderEmptyStreams()
      )}
      {/* <View className="w-full relative px-[23px]">
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
      </View> */}
    </View>
  );
};

export default ExploreMoreSection;
