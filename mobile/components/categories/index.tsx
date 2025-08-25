import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, Dimensions, Pressable } from "react-native";
import { FocusAwareStatusBar } from "../ui/focus-aware-status-bar";
import { toast } from "@/core/toast";
import { router, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDispatch } from "react-redux";
import { signIn } from "@/store/features/auth/authSlice";
import Feather from "@expo/vector-icons/Feather";
import { trackEvent } from "@/utils/analytics";
import SafeAreaView from "../global/safeareaview/SafeAreaView";
import axios from "axios";
import { getToken } from "@/store/features/auth/utils";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";
import AnimatedButton from "../global/button/AnimatedButton";
import { cn } from "@/core";
import { ActivityIndicator } from "react-native-paper";
import CategoriesPageSkeleton from "../skeleton/categoriesPageSkeleton";

const categoryEmojis: Record<string, string> = {
  "Womens Fashion & Accessories": "💄",
  "Gadgets & Electronics": "📱",
  "Mens Fashion": "👕",
  "Kids Fashion & Accessories": "👶",
  "Home & Lifestyle": "🛋️",
};

const Categories = () => {
  const { fromSettings } = useLocalSearchParams();
  const dispatch = useDispatch();
  const [pageLoading, setPageLoading] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const canSubmit = useMemo(
    () => !isLoading && !pageLoading && selectedCategories?.length > 0,
    [isLoading, pageLoading, selectedCategories],
  );

  const getCategories = async () => {
    try {
      const config = {
        url: process.env.EXPO_PUBLIC_API_URL + "api/public/major-categories",
        method: "GET",
      };
      const response = await axios(config);
      if (response?.data?.success) {
        return setCategories(response?.data?.data?.reverse());
      }
      return toast.error(response?.data?.message || "Unable to get Categories");
    } catch (e: any) {
      console.log(e);
      toast.error(
        e?.data?.errors?.[0]?.message ||
          e?.data?.message ||
          "Unable to get Categories",
      );
    } finally {
      setPageLoading(false);
    }
  };

  const getUsersExistingCategories = async () => {
    const token = await getToken();
    try {
      const config = {
        url:
          process.env.EXPO_PUBLIC_API_URL +
          "api/buyer/selected-major-categories",
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const response = await axios(config);
      if (response?.data?.success) {
        return setSelectedCategories(
          response?.data?.selectedMajorCategories?.map((cat: any) => cat?._id),
        );
      }
      return toast.error(
        response?.data?.message ||
          "We couldn't fetch your interests. Please try again.",
      );
    } catch (e: any) {
      console.log(e);
      toast.error(
        e?.data?.errors?.[0]?.message ||
          e?.data?.message ||
          "We couldn't fetch your interests. Please try again.",
      );
    }
  };

  const submitCategories = useCallback(async () => {
    const registerPayload = await AsyncStorage.getItem("registerPayload");
    const token = fromSettings
      ? await getToken()
      : JSON.parse(registerPayload!)?.token;
    setIsLoading(true);
    try {
      const config = {
        url:
          process.env.EXPO_PUBLIC_API_URL + "api/buyer/update-major-categories",
        method: "PUT",
        data: {
          majorCategoryIds: selectedCategories,
        },
        headers: {
          Authorization: "Bearer " + token,
        },
      };
      const response = await axios(config);
      if (response?.data?.success) {
        if (registerPayload && !fromSettings)
          dispatch(signIn(JSON.parse(registerPayload!)));
        try {
          const userData = await AsyncStorage.getItem("user");
          const user = JSON.parse(userData || "{}");
          trackEvent("buyer_profile_completed", {
            userId: user?._id,
            email: user?.email,
            firstName: user?.firstName,
            lastName: user?.lastName,
            username: user?.username,
            userType: "buyer",
            phoneNumber: user?.phoneNumber,
            country: user?.country,
            selectedCategories: categories
              ?.filter((cat: any) => selectedCategories.includes(cat?._id))
              ?.map((ct) => ct?.name),
            timestamp: new Date().toISOString(),
          });
        } catch (trackError) {
          console.log(
            "Customer.io profile completion tracking error:",
            trackError,
          );
          // Allow profile completion flow to continue even if tracking fails
        }
        if (fromSettings) toast.success("Successfully Updated Interest!");
        return fromSettings
          ? router.back()
          : router.replace("/(root)/(tabs)/blips");
      }
      toast.error(
        response?.data?.errors?.[0]?.message ||
          response?.data?.message ||
          "Error Selecting Categores. Please Try Again",
      );
    } catch (e: any) {
      console.log(e);
      toast.error(
        e?.response?.data?.errors?.[0]?.message ||
          e?.response?.data?.message ||
          "Error Selecting Categores. Please Try Again",
      );
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategories, fromSettings]);

  const renderCategory = useCallback(
    ({ item, index }: any) => {
      const isSelected = selectedCategories?.includes(item?._id);
      return (
        <AnimatedButton
          key={index}
          btnClassname={cn(
            "w-full gap-[10px] flex-row items-center justify-between px-[20px] py-[25px] rounded-[10px] bg-[#161917] border-[1px] border-[#FFFFFF1A]",
            {
              "border-[#16783A] bg-[#1B211D] ": isSelected,
            },
          )}
          btnStyle={{
            borderCurve: "continuous",
          }}
          onPress={() => {
            setSelectedCategories((cat) => {
              if (cat?.includes(item?._id)) {
                return cat?.filter((ct) => ct !== item?._id);
              }
              if (selectedCategories?.length > 2) return cat;
              return [...cat, item?._id];
            });
          }}
        >
          <Text className="text-white tracking-[-0.22px] leading-[19.6px]  text-[14px] font-LexendDecaMedium text-center shrink">
            {categoryEmojis[item?.name?.replaceAll("'", "")] || ""} {item?.name}
          </Text>

          <View className="w-[17px] h-[17px] rounded-full p-[2.5px] border-[1px] border-[#16783A]">
            {selectedCategories?.includes(item?._id) && (
              <Animated.View
                entering={FadeIn}
                exiting={FadeOut}
                style={{
                  width: 12,
                  height: 12,
                  aspectRatio: 1,
                  borderRadius: "100%",
                  backgroundColor: "#16783ACC",
                  flexShrink: 1,
                }}
              ></Animated.View>
            )}
          </View>
        </AnimatedButton>
      );
    },
    [selectedCategories],
  );

  const renderCategorySkeleton = useCallback(() => {
    return <CategoriesPageSkeleton numOfLoaders={5} padding={20} height={70} />;
  }, []);

  useEffect(() => {
    getCategories();
  }, []);

  useEffect(() => {
    if (fromSettings || fromSettings === "true") {
      getUsersExistingCategories();
    }
  }, [fromSettings]);

  return (
    <SafeAreaView className="flex-1 bg-[#090D0B]">
      <FocusAwareStatusBar barStyle="light-content" backgroundColor="black" />
      <Svg
        height={413}
        width={"85%"}
        style={{
          position: "absolute",
          top: 0,
          right: 0,
        }}
        fill="none"
      >
        <Circle
          cx={268.5}
          cy={144.5}
          r={268.5}
          fill="#D9D9D9"
          fillOpacity={0.03}
        />
      </Svg>
      <View className="flex-1 px-[20px] pb-[20px]">
        <View className="mb-[32px] py-[8px] flex-row items-center gap-[12px]">
          <Pressable
            className="p-[8px] bg-[#FFFFFF1A] items-center justify-center rounded-[5px]"
            onPress={() => router.back()}
          >
            <Feather name="chevron-left" size={20} color="#F4FFF8" />
          </Pressable>
          <Text className="text-white text-[20px] font-LexendDeca tracking-[-0.22px]">
            Your Interests
          </Text>
        </View>
        {pageLoading ? (
          renderCategorySkeleton()
        ) : (
          <>
            <View className="flex-1">
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                  paddingBottom: 20,
                }}
              >
                <View>
                  <Text className="text-white text-[24px] mb-[7px] font-LexendDecaMedium tracking-[-0.96px] leading-[32.4px]">
                    Select the things you are vibing with
                  </Text>
                  <Text className="text-[#FFFFFF99] text-[16px] mb-[21px] font-LexendDeca tracking-[-0.64px] leading-[21.6px]">
                    It’ll be highlighted on your profile above your interests.
                    You can change it anytime.
                  </Text>
                </View>
                <View className="gap-[20px]">
                  {categories?.map((cat: any, index: number) =>
                    renderCategory({ item: cat, index }),
                  )}
                </View>
              </ScrollView>
            </View>

            <AnimatedButton
              btnClassname={cn(
                "px-[16px] h-[51px] rounded-[10px] bg-[#16783A] items-center justify-center",
                {
                  "bg-[#BFBFBF]": !canSubmit,
                },
              )}
              btnStyle={{
                borderCurve: "continuous",
              }}
              onPress={submitCategories}
              disabled={!canSubmit}
            >
              {isLoading ? (
                <ActivityIndicator size={15} color="#F4FFF8" />
              ) : (
                <Text className="text-[15px] text-[#F4FFF8] font-LexendDecaMedium tracking-[-0.22px]">
                  Save
                </Text>
              )}
            </AnimatedButton>
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

export default Categories;
