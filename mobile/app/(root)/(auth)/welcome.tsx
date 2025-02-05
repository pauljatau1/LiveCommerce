import { router } from "expo-router";
import React, { useRef, useState } from "react";
import { Image, Text, TouchableOpacity, View, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Swiper from "react-native-swiper";
import { icons, onboarding } from "@/constants";
import CustomButton from '@/components/global/button/CustomButton';
import { FocusAwareStatusBar } from '@/components/ui/focus-aware-status-bar';

const { width, height } = Dimensions.get("window");

const Home = () => {
    const swiperRef = useRef<Swiper>(null);
    const [activeIndex, setActiveIndex] = useState(0);


    const isLastSlide = activeIndex === onboarding.length - 1;
    const dotSize = Math.min(width, height) * 0.02; // Adjust based on smaller dimension
    const activeDotWidth = Math.min(width, height) * 0.1; // Active dot width scales dynamically


    return (
        <>
            <FocusAwareStatusBar barStyle="light-content" backgroundColor="black" />
            <SafeAreaView style={{ flex: 1, backgroundColor: 'black' }}>
                <TouchableOpacity
                    onPress={() => router.replace("/(root)/(auth)/sign-up")}
                    style={{
                        alignItems: "flex-end",
                        padding: 20,
                        opacity: isLastSlide ? 0 : 1, // Hide the button on the last slide
                    }}
                    disabled={isLastSlide} // Disable the button on the last slide to prevent interaction
                >
                    <Text style={{ color: "#ccc", fontSize: 14, fontFamily: "LexendDeca", fontWeight: "300" }}>
                        Skip
                    </Text>
                </TouchableOpacity>

                <Swiper
                    ref={swiperRef}
                    loop={false}
                    dot={
                        <View style={{
                            marginHorizontal: 4,
                            height: dotSize,
                            width: dotSize,
                            borderRadius: dotSize / 2,
                            backgroundColor: "#E8E8E8"
                        }} />
                    }
                    activeDot={
                        <View style={{
                            marginHorizontal: 4,
                            height: dotSize,
                            width: activeDotWidth,
                            borderRadius: dotSize / 2,
                            backgroundColor: "#CCCCCC"
                        }} />

                    }
                    onIndexChanged={(index) => setActiveIndex(index)}
                >
                    {onboarding.map((item) => (
                        <View key={item.id} style={{ alignItems: "center", padding: 20 }}>
                            <Image
                                source={item.image}
                                style={{
                                    height: height * 0.45, // Adjust based on screen height
                                    width: width * 0.85,   // Adjust based on screen width
                                    borderRadius: 10
                                }}
                                resizeMode="cover"
                            />
                            <View style={{ marginTop: 20, width: "100%", alignItems: "center" }}>
                                <Text style={{
                                    color: "#ccc",
                                    fontSize: 24,
                                    fontFamily: "LexendDeca",
                                    fontWeight: "700",
                                    textAlign: "center",
                                    marginHorizontal: 20
                                }}>
                                    {item.title}
                                </Text>
                            </View>
                            <Text style={{
                                fontSize: 14,
                                fontFamily: "LexendDeca",
                                color: "#aaa",
                                textAlign: "center",
                                marginTop: 10,
                                paddingHorizontal: 20
                            }}>
                                {item.description}
                            </Text>
                        </View>
                    ))}
                </Swiper>

                {!isLastSlide ? (
                    <CustomButton
                        onPress={() =>
                            isLastSlide
                                ? router.replace("/(root)/(auth)/sign-up")
                                : swiperRef.current?.scrollBy(1)
                        }
                        IconLeft={() => (
                            <Image
                                source={icons.arrowRight}
                                resizeMode="contain"
                                style={{ width: 29, height: 29 }}
                            />
                        )}
                        style={{
                            width: 74,
                            height: 74,
                            marginBottom: 32,
                            marginTop: 20,
                            alignSelf: "center"
                        }}
                    />
                ) : (
                    <CustomButton
                        title="Get Started"
                        onPress={() => router.replace("/(root)/(auth)/sign-up")}
                        style={{
                            width: width * 0.75, // 75% of screen width
                            marginBottom: 68,
                            marginTop: 20,
                            alignSelf: "center"
                        }}
                    />
                )}
            </SafeAreaView>
        </>
    );
};

export default Home;
