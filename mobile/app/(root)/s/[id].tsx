import { View, Text, Linking } from "react-native";
import React, { useEffect } from "react";
import { router, useLocalSearchParams } from "expo-router";

const DeepLinkNavigation = () => {
  const { id, type } = useLocalSearchParams();

  useEffect(() => {
    const suffix = id.slice(-1);
    const mainId = id.slice(0, id?.length - 1);
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
  }, []);

  return <View className="h-full w-full bg-[#121212]" />;
};

export default DeepLinkNavigation;
