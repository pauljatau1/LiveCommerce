import {
  View,
  Text,
  Dimensions,
  TouchableOpacity,
  Image,
  Pressable,
} from "react-native";
import React, { useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { FocusAwareStatusBar } from "@/components/ui/focus-aware-status-bar";
import { Entypo } from "@expo/vector-icons";
import MainReviewCard from "@/components/reviews/mainReviewCard";
import { getToken } from "@/store/features/auth/utils";
import axios from "axios";
import { formatDate } from "@/helpers/helpers";
import { ActivityIndicator } from "react-native-paper";
import SafeAreaView from "@/components/global/safeareaview/SafeAreaView";

const { width, height } = Dimensions?.get("window");

const ReviewDetails = () => {
  const { reviewId, productId } = useLocalSearchParams();

  const [review, setReview] = useState<any>();
  const [loading, setLoading] = useState<boolean>(true);

  const getSellerReviews = async () => {
    try {
      const userToken = await getToken();
      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL +
          `api/seller/product/${productId}/review/${reviewId}`,
        {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        },
      );

      if (response.status == 200) {
        setReview(response?.data);
      }
    } catch (e: any) {
      if (e.response) {
        console.log("error returning product reviews", e.response.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getSellerReviews();
  }, []);

  return (
    <SafeAreaView
      className="h-full flex-1 bg-[#121212]"
      style={{ minHeight: height }}
    >
      <FocusAwareStatusBar barStyle="light-content" backgroundColor="#121212" />

      <View
        className="flex flex-row items-center justify-center gap-[10px] px-[12px] py-[17px] mb-[8px] mt-8"
        style={{ backgroundColor: "rgba(255, 255, 255, 0.23)" }}
      >
        <TouchableOpacity
          className="absolute left-[12px]"
          onPress={() => router.back()}
        >
          <Entypo
            name="chevron-left"
            size={24}
            color="rgba(204, 204, 204, 0.8)"
          />
        </TouchableOpacity>

        <Text className="text-white font-LexendDecaMedium text-[20px]">
          Review Details
        </Text>
      </View>
      {loading ? (
        <ActivityIndicator
          size={"small"}
          color="white"
          style={{ marginTop: 30 }}
        />
      ) : (
        <>
          <View className="p-[16px]">
            <MainReviewCard
              name={
                review?.buyer?.firstName + " " + review?.buyer?.lastName ||
                review?.buyer?.name
              }
              rating={review?.rating}
              comment={review?.comment}
              date={review?.createdAt}
              images={review?.images}
              buyerImage={review?.buyer?.profileImage || ""}
              reviewId={review?._id}
              productId={review?.product?._id}
            />
          </View>

          <Pressable
            className="flex-row gap-[16px] bg-white p-[8px] rounded-[8px] mb-[20px] items-center mx-[16px]"
            onPress={() => router.push(`/product/${productId}`)}
          >
            <Image
              source={{ uri: review?.product?.image }}
              resizeMode="cover"
              style={{ width: 70, height: 70, borderRadius: 4 }}
            />
            <View className="justify-between py-2 gap-[20px] shrink">
              <Text
                className="text-[12px] font-LexendDecaMedium leading-[18px]"
                numberOfLines={2}
              >
                {review?.product?.name}
              </Text>
              <View className="flex-row items-center gap-[8px]">
                <Text className="text-[16px] font-LexendDecaMedium leading-[18px]">
                  ₦{review?.product?.price?.toLocaleString()}
                </Text>
              </View>
            </View>
          </Pressable>

          {review?.reply?.content && (
            <View className="p-[4px] mr-2 gap-[4px] px-[16px]">
              <View className="flex-row item-center gap-[6px] w-full mb-[10px]">
                <Image
                  source={{ uri: review?.reply?.seller?.avatar }}
                  resizeMode="cover"
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 15,
                  }}
                />
                <View className="gap-[2px] w-full shrink">
                  <Text className="text-white text-[13px] font-LexendDecaMedium">
                    Sellers Response
                  </Text>
                  <Text className="text-white text-[13px] font-LexendDecaMedium">
                    {review?.reply?.seller?.name}
                  </Text>
                  <Text
                    className="text-white text-[11px] opacity-60 font-LexendDecaLight"
                    style={{
                      position: "absolute",
                      right: 0,
                    }}
                  >
                    {formatDate(review?.reply?.createdAt, "DD MMMM YYYY")}
                  </Text>
                </View>
              </View>

              <Text className="text-white text-[14px] leading-[18px] font-LexendDeca mb-[12px] ml-[36px]">
                {review?.reply?.content}
              </Text>
            </View>
          )}
        </>
      )}
    </SafeAreaView>
  );
};

export default ReviewDetails;
