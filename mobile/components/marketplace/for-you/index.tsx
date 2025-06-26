import { View, Text, RefreshControl } from "react-native";
import { ActivityIndicator } from "react-native-paper";
import React, { memo, useEffect, useState } from "react";
import Carousel from "./carousel";
import ForYouSection from "./forYou";
import ForYouCatetorySection from "./category-section";
import ForYouTrendingSection from "./trending-section";
import ForYouNewAuqliSection from "./new-auqli-section";
import ForYouFeaturedShopsSection from "./featured-shops-section";
import ForYouAuctionSection from "./auction-section";
import KeepShowingSection from "../keep-showing-section";
import axios from "axios";
import BannerSkeleton from "@/components/skeleton/bannerSkeleton";
import { ScrollView } from "react-native-virtualized-view";
import MarketsSuggestedBlips from "./markets-suggested-blips";
import { useDispatch } from "react-redux";
import { products } from "@/services/products";

const ForYou = () => {
  const dispatch = useDispatch();
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const handleGetBanners = async () => {
    try {
      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL + "api/public/banners",
      );
      if (response.data) {
        setBanners(response.data);
      }
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = () => {
    setRefreshing(true);

    dispatch(
      products.util.invalidateTags([
        "foryouProducts",
        "newProducts",
        "trendingProducts",
      ]),
    );

    setRefreshing(false);
  };

  useEffect(() => {
    console.log("rendering");

    handleGetBanners();
  }, []);
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      nestedScrollEnabled={true}
      contentContainerStyle={{
        paddingTop: 20,
        paddingBottom: 80,
        // flex: 1,
      }}
    >
      <View className="w-full flex-1">
        <View>
          <Carousel banners={banners} />
          <View
            style={{
              borderBottomColor: "rgba(255, 255, 255, 0.38)",
              borderBottomWidth: 1,
              marginLeft: 0,
              marginRight: 0,
              marginTop: 12,
              marginBottom: 24,
            }}
          />
          <ForYouSection />
          {/* <ForYouCatetorySection /> */}
          <ForYouTrendingSection />
          {/* <Carousel banners={banners} /> */}
          <ForYouNewAuqliSection />
          <ForYouFeaturedShopsSection />
          <MarketsSuggestedBlips />
          <ForYouAuctionSection />
        </View>
        <KeepShowingSection />
      </View>
    </ScrollView>
  );
};

export default memo(ForYou);
