import React, { memo, useCallback } from "react";
import { FlatList, View, Text, Dimensions, Image } from "react-native";
import useCarousel from "@/hooks/useCarousel";
import CustomButton from "@/components/global/button/CustomButton";
import { data } from "@/constants";
import BannerSkeleton from "@/components/skeleton/bannerSkeleton";

const Carousel = ({ banners }: any) => {
  const screenWidth = Dimensions.get("window").width;
  const { activeIndex, flatlistRef, handleScroll } = useCarousel({
    dataLength: banners?.length,
    // autoScroll: banners?.length > 0 ? true : false,
    // autoScrollInterval: 2000,
  });

  const renderItem = useCallback(({ item }: any) => {
    const margin = 16;
    return (
      <View
        style={{
          marginHorizontal: margin,
          borderRadius: 10,
          overflow: "hidden",
          height: 200,
          width: screenWidth - margin * 2,
        }}
      >
        <Image
          source={{ uri: item.mainImage.url || null }}
          style={{
            height: "100%",
            width: "100%",
            alignSelf: "center",
            backgroundColor: "#2e2e2e20",
          }}
          resizeMode="cover"
          resizeMethod="resize"
        />
      </View>
    );
  }, []);

  const renderDotIndicators = useCallback(() => {
    return banners?.map((_: any, index: number) => (
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
  }, [banners, activeIndex]);

  return (
    <View>
      {banners?.length < 1 ? (
        <BannerSkeleton />
      ) : (
        <>
          <FlatList
            data={banners}
            ref={flatlistRef}
            renderItem={renderItem}
            keyExtractor={(item, index) => item._id || index?.toString()}
            horizontal
            pagingEnabled
            onScroll={handleScroll}
            showsHorizontalScrollIndicator={false}
            onScrollToIndexFailed={() => console.log("scroll failed")}
          />
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              marginTop: 12,
            }}
          >
            {renderDotIndicators()}
          </View>
        </>
      )}
    </View>
  );
};

export default memo(Carousel);
