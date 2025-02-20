import { View, Text } from "react-native";
import { ActivityIndicator } from "react-native-paper";
import React, { useEffect, useState } from "react";
import Carousel from "./carousel";
import ForYouSection from "./forYou";
import ForYouCatetorySection from "./category-section";
import ForYouTrendingSection from "./trending-section";
import ForYouNewAuqliSection from "./new-auqli-section";
import ForYouFeaturedShopsSection from "./featured-shops-section";
import ForYouAuctionSection from "./auction-section";
import KeepShowingSection from "../keep-showing-section";
import axios from "axios";

const ForYou = () => {
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const handleGetBanners = async () => {
    try {
      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL + "api/public/banners",
      );
      setBanners(response.data);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const setPageLoading = (value: boolean) => {
    setLoading(false);
  };

  useEffect(() => {
    handleGetBanners();
  }, []);
  return (
    <View className="w-full">
      {loading ? (
        <ActivityIndicator size={"small"} color={"#16783A"} />
      ) : (
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
          <ForYouCatetorySection />
          <ForYouTrendingSection />
          <Carousel banners={banners} />
          <ForYouNewAuqliSection />
          <ForYouFeaturedShopsSection />
          <ForYouAuctionSection />
          <KeepShowingSection />
        </View>
      )}
    </View>
  );
};

export default ForYou;
