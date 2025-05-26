import { View, Text, Linking } from "react-native";
import React, { useEffect } from "react";
import {
  router,
  useLocalSearchParams,
  useRootNavigationState,
} from "expo-router";
import { ActivityIndicator } from "react-native-paper";

const DeepLinkNavigation = () => {
  const { id, type } = useLocalSearchParams();
  const rootNavigationState = useRootNavigationState();
  const navigatorReady = rootNavigationState?.key != null;

  useEffect(() => {
    if (router && navigatorReady) {
      const suffix = id?.slice(-1);
      const mainId = id?.slice(0, id?.length - 1);
      console.log("testing shortened deep link ", {
        id: id,
        slicedId: mainId,
        suffix,
      });

      switch (suffix) {
        case "A":
          return router.replace(`/product/${mainId}?itmSource=share`);
        case "B":
          return router.replace(
            `/sellerProfile?sellerId=${mainId}&itmSource=share`,
          );
        case "S":
          return router.replace(
            `/livestream/feed?id=${mainId}&type=${type}&itmSource=share`,
          );
        default:
          return router.replace("/(root)/(tabs)/home/home");
      }
    }
  }, [id, type, router, navigatorReady]);

  return (
    <View className="h-full w-full bg-[#121212] items-center justify-center">
      <ActivityIndicator size={24} color="#16783A" />
    </View>
  );
};

export default DeepLinkNavigation;
