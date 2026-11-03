import { View, Text, RefreshControl } from "react-native";
import { ActivityIndicator } from "react-native-paper";
import React, { memo, useCallback, useEffect, useState } from "react";
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
// import { ScrollView } from "react-native-virtualized-view";
import { ScrollView } from "@/components/global/virtualized-view";
import MarketsSuggestedBlips from "./markets-suggested-blips";
import { useDispatch, useSelector } from "react-redux";
import { products } from "@/services/products";
import Flashsales from "./flashsales";
import { RootState } from "@/store";

const ForYou = () => {
  const dispatch = useDispatch();
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const token = useSelector((state: RootState) => state.authState.token);
  const handleGetBanners = useCallback(async () => {
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
  }, []);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(() => {
    setRefreshing(true);

    dispatch(
      products.util.invalidateTags([
        "foryouProducts",
        "newProducts",
        "trendingProducts",
        "discountedProducts",
        "allProducts",
      ]),
    );

    setRefreshing(false);
  }, [dispatch]);

  useEffect(() => {
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
              marginTop: 20,
              // marginBottom: 24,
            }}
          />
          <Flashsales />
          {token && <ForYouSection />}

          {/* <ForYouCatetorySection /> */}
          <ForYouTrendingSection />
          {/* <Carousel banners={banners} /> */}
          <ForYouNewAuqliSection />
          <ForYouFeaturedShopsSection />
          <MarketsSuggestedBlips />
          {/* <ForYouAuctionSection /> */}
        </View>
        <KeepShowingSection />
      </View>
    </ScrollView>
  );
};

export default memo(ForYou);
