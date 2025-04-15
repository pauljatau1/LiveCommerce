import { View, Text, TouchableOpacity, FlatList, Animated } from "react-native";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { getToken } from "@/store/features/auth/utils";
import axios from "axios";
import { ActivityIndicator } from "react-native-paper";
import { FontAwesome6, Fontisto } from "@expo/vector-icons";
import CatalogCard from "../catalog/catalogCard";
import ProductSkeleton from "../skeleton/productSkeleton";
import { opacity } from "react-native-reanimated/lib/typescript/Colors";

interface Props {
  scrollY: any;
  headerHeight: number;
  index: number;
}

const Favorites = ({ scrollY, headerHeight, index }: Props | any) => {
  const flatListRef = useRef<FlatList>(null);

  const [wishList, setWishList] = useState<any[]>([]);
  const [wishListLoading, setWishListLoading] = useState<boolean>(true);
  const handleGetWishList = async () => {
    try {
      const token = await getToken();
      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL + "api/buyer/wishlist",
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        },
      );

      setWishList(response.data.map((wh: any) => wh.product));
    } catch (e) {
      console.log(e);
    } finally {
      setWishListLoading(false);
    }
  };

  useEffect(() => {
    handleGetWishList();
  }, [index]);

  const renderProducts = ({ item }: any) => {
    return (
      <View className="w-[100%] basis-[49%]">
        <CatalogCard
          key={item.id}
          id={item._id}
          title={item.name}
          price={item.price}
          category={item.category}
          sellerName={item.seller?.storeName}
          imageUrl={item.images}
          sellerRating={item.stats?.averageRating}
          moreDetails={item}
          profileImage={undefined}
          location={""}
          isTopSeller={false}
          isOnline={false}
          isLive={false}
          isVerified={false}
          showNike={false}
          onAddToCart={function (): void {
            throw new Error("Function not implemented.");
          }}
        />
      </View>
    );
  };

  const renderEmptyPlaceholder = useCallback(() => {
    return (
      <View
        style={{
          marginVertical: 40,
          width: "100%",
          alignItems: "center",
          gap: 10,
        }}
      >
        <Fontisto
          name="favorite"
          size={35}
          color="#ccc"
          style={{ opacity: 0.5, marginBottom: 20 }}
        />
        <Text className="text-[#ccc] font-LexendDecaMedium text-[16px] text-center">
          No Favorites
        </Text>
        <Text className="text-[#ccc] font-LexendDecaMedium text-[14px] text-center opacity-50">
          Items in your wishlist will appear here
        </Text>
      </View>
    );
  }, []);

  useEffect(() => {
    if (flatListRef.current) {
      flatListRef?.current?.scrollToOffset({ offset: 0, animated: false });
    }
  }, [index]);
  return (
    <View className="py-[12px] ">
      {wishListLoading ? (
        <View
          style={{
            paddingTop: headerHeight + 12,
          }}
        >
          <ProductSkeleton numOfLoaders={2} height={157} padding={16} />
        </View>
      ) : (
        <View className="px-[16px] ">
          <Animated.FlatList
            ref={flatListRef}
            data={wishList}
            renderItem={renderProducts}
            keyExtractor={(item, index) => index.toString()}
            numColumns={2}
            columnWrapperStyle={{
              justifyContent: "space-between",
              marginBottom: 8,
            }}
            contentContainerStyle={{
              paddingTop: headerHeight,
            }}
            showsVerticalScrollIndicator={false}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: true },
            )}
            ListEmptyComponent={renderEmptyPlaceholder}
          />
        </View>
      )}
    </View>
  );
};

export default memo(Favorites);
