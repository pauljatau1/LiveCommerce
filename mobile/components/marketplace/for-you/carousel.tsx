import React from "react";
import { FlatList, View, Image, Text, Dimensions } from "react-native";
import useCarousel from "@/hooks/useCarousel";
import CustomButton from "@/components/global/button/CustomButton";
import { data } from "@/constants";

const Carousel = ({ banners }: { banners: any[] }) => {
  const screenWidth = Dimensions.get("window").width;
  const { activeIndex, flatlistRef, handleScroll } = useCarousel({
    dataLength: banners?.length,
    // autoScroll: banners?.length > 0 ? true : false,
    // autoScrollInterval: 2000,
  });

  const renderItem = ({ item }: any) => {
    const margin = 16;
    return (
      <View
        style={{
          marginHorizontal: margin,
          borderRadius: 10,
          overflow: "hidden",
        }}
      >
        <Image
          source={{ uri: item.mainImage.url || null }}
          style={{
            height: 200,
            width: screenWidth - margin * 2,
            alignSelf: "center",
            opacity: 0.3,
            backgroundColor: "#000",
          }}
        />
        <View
          style={{
            position: "absolute",
            top: 70,
            left: 0,
            right: 0,
            alignItems: "center",
          }}
        >
          <Text className="font-LexendDecaExtraBold text-[#ccc] uppercase text-[15px]">
            {item.title}
          </Text>
          <Text className="font-LexendDecaExtraBold text-[#16783A] uppercase text-[15px] text-center bg-[#121212] p-2 rounded-[2px]">
            {item.description}
          </Text>
          <View className="flex items-center justify-center w-[120px]">
            <CustomButton
              title="Shop now"
              className="mb-4 mt-[18px] !rounded-[8.016px] !text-white text-sm font-LexendDecaBold"
            />
          </View>
        </View>
      </View>
    );
  };

  const renderDotIndicators = () => {
    return banners?.map((_, index) => (
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

  return (
    <View>
      <FlatList
        data={banners || data}
        ref={flatlistRef}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
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
    </View>
  );
};

export default Carousel;
