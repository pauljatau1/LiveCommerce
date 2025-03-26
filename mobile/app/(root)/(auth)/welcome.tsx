import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Image,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  Pressable,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Swiper from "react-native-swiper";
import { icons, onboarding } from "@/constants";
import CustomButton from "@/components/global/button/CustomButton";
import { FocusAwareStatusBar } from "@/components/ui/focus-aware-status-bar";
import { AntDesign } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

const Home = () => {
  const swiperRef = useRef<Swiper>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const isLastSlide = activeIndex === onboarding.length - 1;
  const dotSize = Math.min(width, height) * 0.02; // Adjust based on smaller dimension
  const activeDotWidth = Math.min(width, height) * 0.1; // Active dot width scales dynamically

  const renderDots = (index: number) => {
    return (
      <View
        key={index}
        style={
          index !== activeIndex
            ? {
                marginHorizontal: 4,
                height: dotSize,
                width: dotSize,
                borderRadius: dotSize / 2,
                backgroundColor: "#E8E8E8",
              }
            : {
                marginHorizontal: 4,
                height: dotSize,
                width: activeDotWidth,
                borderRadius: dotSize / 2,
                backgroundColor: "#16783A",
              }
        }
      />
    );
  };

  return (
    <>
      <FocusAwareStatusBar barStyle="light-content" backgroundColor="black" />
      <SafeAreaView style={{ flex: 1, backgroundColor: "black" }}>
        <TouchableOpacity
          onPress={() => router.replace("../../(root)/(tabs)/home")}
          style={{
            alignItems: "flex-end",
            padding: 20,
            opacity: isLastSlide ? 0 : 1, // Hide the button on the last slide
          }}
          disabled={isLastSlide} // Disable the button on the last slide to prevent interaction
        >
          <Text
            style={{
              color: "#ccc",
              fontSize: 14,
              fontFamily: "LexendDeca",
              fontWeight: "300",
            }}
          >
            Skip
          </Text>
        </TouchableOpacity>

        <Swiper
          ref={swiperRef}
          loop={false}
          showsPagination={false}
          dot={
            <View
              style={{
                marginHorizontal: 4,
                height: dotSize,
                width: dotSize,
                borderRadius: dotSize / 2,
                backgroundColor: "#E8E8E8",
              }}
            />
          }
          activeDot={
            <View
              style={{
                // position: "absolute",
                // bottom: 104,
                marginHorizontal: 4,
                height: dotSize,
                width: activeDotWidth,
                borderRadius: dotSize / 2,
                backgroundColor: "#16783A",
              }}
            />
          }
          onIndexChanged={(index) => setActiveIndex(index)}
        >
          {onboarding.map((item) => (
            <View
              key={item.id}
              style={{
                alignItems: "center",
                // padding: 20,
                flex: 1,
                // backgroundColor: "yellow",
              }}
            >
              <Image
                source={item.image}
                style={{
                  height: "100%", // Adjust based on screen height
                  width: "100%", // Adjust based on screen width
                  //   borderRadius: 10,
                  opacity: 0.5,
                }}
                resizeMode="cover"
              />
            </View>
          ))}
        </Swiper>

        <View
          className="items-center"
          style={{
            position: "absolute",
            bottom: 20,
            alignSelf: "center",
          }}
        >
          <View style={{ marginTop: 20, width: "100%", alignItems: "center" }}>
            <Text
              style={{
                color: "#fff",
                fontSize: 24,
                fontFamily: "LexendDeca-Medium",
                textAlign: "center",
                marginHorizontal: 20,
              }}
            >
              {onboarding[activeIndex].title}
            </Text>
          </View>
          <Text
            style={{
              fontSize: 14,
              fontFamily: "LexendDeca",
              color: "#fff",
              textAlign: "center",
              marginTop: 10,
              paddingHorizontal: 20,
              lineHeight: 25,
            }}
          >
            {onboarding[activeIndex].description}
          </Text>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              marginTop: 30,
            }}
          >
            {onboarding?.map((_, index) => renderDots(index))}
          </View>

          {!isLastSlide ? (
            <Pressable
              onPress={() =>
                isLastSlide
                  ? router.replace("../../(root)/(tabs)/home")
                  : swiperRef.current?.scrollBy(1)
              }
              style={{
                width: 74,
                height: 74,
                borderRadius: 37,
                marginBottom: 32,
                marginTop: 30,
                alignSelf: "center",
                backgroundColor: "#16783A",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <AntDesign name="arrowright" size={30} color="#ccc" />
            </Pressable>
          ) : (
            // <CustomButton
            //   onPress={() =>
            //     isLastSlide
            //       ? router.replace("/(root)/(auth)/sign-up")
            //       : swiperRef.current?.scrollBy(1)
            //   }
            //   IconLeft={() => (
            //     <AntDesign name="arrowright" size={30} color="#ccc" />
            //   )}
            //   style={{
            //     width: 74,
            //     height: 74,
            //     marginBottom: 32,
            //     marginTop: 20,
            //     alignSelf: "center",
            //   }}
            // />
            <CustomButton
              title="Get Started"
              onPress={() => router.replace("../../(root)/(tabs)/home")}
              style={{
                width: width * 0.75, // 75% of screen width
                marginBottom: 68,
                marginTop: 30,
                alignSelf: "center",
              }}
            />
          )}
        </View>
      </SafeAreaView>
    </>
  );
};

export default Home;
