import { View, Image, Text, Dimensions, Pressable } from "react-native";
import Entypo from "@expo/vector-icons/Entypo";
import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useCallback, useEffect, useState } from "react";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from "react-native-reanimated";
import Carousel, {
  ICarouselInstance,
  Pagination,
} from "react-native-reanimated-carousel";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AnimatedButton from "@/components/Primitives/Buttons/animatedButton";
import { useRouter } from "expo-router";
import BackButton from "@/components/Primitives/Buttons/backButton";
import { FocusAwareStatusBar } from "@/components/ui/focus-aware-status-bar";
import Feather from "@expo/vector-icons/Feather";
import SafeAreaView from "@/components/global/safeareaview/SafeAreaView";

const { width, height } = Dimensions.get("window");

const walkthroughData = [
  {
    id: 1,
    title: "shop live, discover more",
    body: "Experience shopping like never before! Connect with sellers in real-time streams.",
    image: require("@/assets/images/onboarding-1.png"),
  },
  {
    id: 2,
    title: "Shop Your Style, Faster.",
    body: "Browse bite-sized videos from your favorite brands and discover new products instantly.",
    image: require("@/assets/images/onboarding-2.png"),
  },
  {
    id: 3,
    title: "Connect, Interact, Buy.",
    body: "Chat with sellers, ask questions, and buy products directly from streams and videos.",
    image: require("@/assets/images/onboarding-3.png"),
  },
];

const WalkThrough = () => {
  const router = useRouter();
  const CAROUSEL_WIDTH = width;
  const IMAGE_WIDTH = width * 0.75;
  const insets = useSafeAreaInsets();
  const progress = useSharedValue<number>(0);
  const backBtnOpacity = useSharedValue<number>(0);

  const [currentIndex, setCurrentIndex] = useState(0);

  const ref = React.useRef<ICarouselInstance>(null);

  const onPressPagination = () => {};

  const backBtnStyle = useAnimatedStyle(() => {
    return {
      opacity: backBtnOpacity.value,
    };
  });

  const renderCarouselData = useCallback(
    ({ item, index }: any) => {
      return (
        <View className="items-center px-[20px]">
          <Image
            source={item?.image}
            resizeMode="cover"
            style={{
              width: IMAGE_WIDTH,
              height: undefined,
              aspectRatio: 1,
              marginBottom: 20,
            }}
          />
          <Text className="text-white font-LexendDeca text-[42px] leading-[60px] capitalize tracking-[-0.22px] mb-[6px] text-center">
            {item?.title}
          </Text>
          <Text className="text-[#FFFFFFB2] font-LexendDecaLight text-[16px] leading-[28px] capitalize text-center">
            {item?.body}
          </Text>
        </View>
      );
    },
    [IMAGE_WIDTH],
  );

  const handleCarouselBtn = useCallback(() => {
    if (currentIndex === walkthroughData?.length - 1) {
      return router.replace("/(root)/(tabs)/blips");
    } else ref.current?.next();
  }, [ref, router, currentIndex]);

  useEffect(() => {
    if (currentIndex > 0) {
      backBtnOpacity.set(
        withTiming(1, {
          duration: 50,
          easing: Easing.inOut(Easing.linear),
        }),
      );
    } else {
      backBtnOpacity.set(
        withTiming(0, {
          duration: 50,
          easing: Easing.inOut(Easing.linear),
        }),
      );
    }
  }, [currentIndex, backBtnOpacity]);

  return (
    <SafeAreaView className="flex-1 bg-[#090D0B]" edges={["bottom"]}>
      <FocusAwareStatusBar barStyle="light-content" backgroundColor="#121212" />

      <View>
        <Image
          source={require("@/assets/icons/watermark.png")}
          style={{
            width: width,
            height: height,
          }}
          className="absolute top-0 left-0 "
          resizeMode="contain"
        />
      </View>
      <View
        className="flex-row items-center justify-between px-[20px]"
        style={{
          marginTop: insets.top + 5,
        }}
      >
        <Animated.View style={[backBtnStyle]}>
          <BackButton onPress={() => ref.current?.prev()} />
        </Animated.View>
        <Pressable onPress={() => router.replace("/(root)/(tabs)/blips")}>
          <Text
            className="text-white font-LexendDecaMedium text-[16px] capitalize tracking-[-0.22px]"
            style={{
              opacity: currentIndex < walkthroughData?.length - 1 ? 1 : 0,
            }}
          >
            Skip
          </Text>
        </Pressable>
      </View>

      <View className="flex-1 items-center justify-center mt-[20px]">
        <Carousel
          ref={ref}
          enabled={false}
          width={CAROUSEL_WIDTH}
          loop={false}
          onProgressChange={progress}
          onSnapToItem={(index) => setCurrentIndex(index)}
          style={{
            width: CAROUSEL_WIDTH,
          }}
          data={walkthroughData}
          renderItem={renderCarouselData}
        />
      </View>
      <View
        style={{
          // marginTop: 15,
          marginBottom: 30,
          paddingHorizontal: 20,
          flexShrink: 0,
        }}
      >
        <View className="items-center justify-between">
          <Pagination.Custom
            progress={progress}
            data={walkthroughData}
            size={20}
            dotStyle={{
              height: 7,
              width: 7,
              borderRadius: 7,
              backgroundColor: "#B7D5C2",
            }}
            activeDotStyle={{
              borderRadius: 8,
              width: 25,
              height: 7,
              overflow: "hidden",
              backgroundColor: "#16783A",
            }}
            containerStyle={{
              gap: 5,
              marginBottom: 10,
              alignItems: "center",
              height: 10,
            }}
            horizontal
            onPress={onPressPagination}
            customReanimatedStyle={(progress, index, length) => {
              let val = Math.abs(progress - index);
              if (index === 0 && progress > length - 1) {
                val = Math.abs(progress - length);
              }

              return {
                transform: [
                  {
                    translateY: interpolate(
                      val,
                      [0, 1],
                      [0, 0],
                      Extrapolation.CLAMP,
                    ),
                  },
                ],
              };
            }}
          />
          <AnimatedButton
            btnClassname="w-full h-[50px] flex-row gap-[8px] items-center justify-center bg-[#16783A] rounded-[10px]"
            onPress={handleCarouselBtn}
          >
            <Text className="text-white text-[15px] font-LexendDecaMedium tracking-[-0.22px]">
              {currentIndex === walkthroughData?.length - 1
                ? "Welcome"
                : "Next"}
            </Text>
            {currentIndex !== walkthroughData?.length - 1 && (
              <Feather
                name="arrow-right"
                size={20}
                color="white"
                className="mt-[2px]"
              />
            )}
          </AnimatedButton>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default WalkThrough;
