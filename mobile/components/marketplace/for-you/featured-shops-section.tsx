import React, { useCallback, useEffect, useState } from "react";
import { FlatList, View, Text } from "react-native";
import useCarousel from "@/hooks/useCarousel";
import SectionHeader from "@/components/global/section-header";
import FollowCard from "@/components/global/followers-card/followers-card";
import { data } from "@/constants";
import axios from "axios";
import { getToken } from "@/store/features/auth/utils";
import { Entypo } from "@expo/vector-icons";

const ForYouFeaturedShopsSection = () => {
  const [shops, setShops] = useState<any[]>([]);
  const handleGetShops = async () => {
    try {
      const token = await getToken();
      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL +
          "api/buyer/sellers?page=1&limit=10&sort=rating",
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        },
      );

      if (response.status == 200) {
        setShops(
          response.data?.sellers
            .filter((seller: any) => seller?.isFeatured)
            .slice(0, 10),
        );
      }
    } catch (e) {
      console.log(e);
    }
  };
  const { activeIndex, flatlistRef, handleScroll } = useCarousel({
    dataLength: data.productsData.length,
    autoScroll: false, // Disable auto-scroll here
  });

  const renderDotIndicators = () => {
    return [1, 2].map((_, index) => (
      <View
        key={index}
        style={{
          backgroundColor: activeIndex === index ? "#CCCCCC" : "#F2F2F2",
          height: 6,
          width: activeIndex === index ? 40 : 6,
          borderRadius: 3,
          marginHorizontal: 3,
        }}
      />
    ));
  };

  const renderEmptySellers = useCallback(() => {
    return (
      <View
        style={{
          marginVertical: 40,
          width: "100%",
          alignItems: "center",
          gap: 10,
        }}
      >
        <Entypo name="shop" size={35} color="#ccc" style={{ opacity: 0.5 }} />
        <Text className="font-LexendDecaMedium text-[14px] text-[#ccc] text-center">
          No Sellers to Follow
        </Text>
      </View>
    );
  }, [shops]);

  useEffect(() => {
    handleGetShops();
  }, []);

  return (
    <View className="w-[100%] pb-[9.5px]">
      <View className="flex-row items-center justify-between">
        <SectionHeader title="Featured Shops" />
        <View style={{ marginRight: 16 }}>
          <View className="flex-row">{renderDotIndicators()}</View>
        </View>
      </View>
      <View
        style={{
          // paddingLeft: 16,
          paddingHorizontal: 16,
          width: "100%",
        }}
      >
        <FlatList
          data={shops}
          renderItem={({ item: row }) => (
            <View
              className=" mb-[5.54px] w-[50%] shrink"
              style={{
                flexShrink: 1,
              }}
            >
              <FollowCard item={row?._id} data={row} />
            </View>
          )}
          ref={flatlistRef}
          keyExtractor={(_, index) => `page-${index}`}
          // horizontal
          showsHorizontalScrollIndicator={false}
          className="pt-[10px]"
          // pagingEnabled
          onScroll={handleScroll}
          ListEmptyComponent={renderEmptySellers}
          numColumns={2}
          contentContainerStyle={{
            justifyContent: "space-between",
          }}
        />
      </View>
    </View>
  );
};

export default ForYouFeaturedShopsSection;
