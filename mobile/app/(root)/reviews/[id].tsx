import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { ActivityIndicator } from "react-native-paper";
import React, { useEffect, useState } from "react";
import { router, useGlobalSearchParams } from "expo-router";
import { FocusAwareStatusBar } from "@/components/ui/focus-aware-status-bar";
import axios from "axios";
import ReviewCard from "@/components/reviews";
import { useGetSingleProductQuery } from "@/services/products";
import Entypo from "@expo/vector-icons/Entypo";
import AntDesign from "@expo/vector-icons/AntDesign";
import { getToken } from "@/store/features/auth/utils";

const { width, height } = Dimensions.get("window");

const ReviewsPage = () => {
  const { id, sellerId, storeName, storeAvatar } = useGlobalSearchParams();

  const [productReviews, setProductReviews] = useState<any>([]);
  const [isProductReviewsLoading, setIsProductReviewsLoading] =
    useState<boolean>(true);
  const [averageRating, setAverageRating] = useState<string>("");
  const [totalReviews, setTotalReviews] = useState<string>("");
  const [token, setToken] = useState<string>("");

  const getProductReviews = async () => {
    try {
      const userToken = await getToken();
      setToken(userToken);
      setIsProductReviewsLoading(true);
      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL + `api/products/${id}/reviews`,
      );

      if (response.status == 200) {
        setProductReviews(response.data.reviews);
        const totalRating = response.data.reviews.reduce(
          (acc: number, review: any) => acc + review.rating,
          0,
        );
        const averageRating = (
          totalRating / response.data.reviews.length
        ).toFixed(1);
        setAverageRating(averageRating);
        setTotalReviews(response.data.totalReviews);
      }
    } catch (e: any) {
      if (e.response) {
        console.log("error returning product reviews", e.response.data);
      }
    } finally {
      setIsProductReviewsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      getProductReviews();
    }
  }, [id]);

  return (
    <>
      <FocusAwareStatusBar barStyle="light-content" backgroundColor="#121212" />
      <SafeAreaView
        className="h-full flex-1 bg-[#121212]"
        style={{ minHeight: height }}
      >
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
            Product Reviews
          </Text>
        </View>
        {isProductReviewsLoading ? (
          <ActivityIndicator
            size={"small"}
            color={"#16783A"}
            style={{ marginTop: 30 }}
          />
        ) : (
          <ScrollView>
            <View className="mt-[20px]">
              <Text className="text-[#fff] opacity-70 text-[16px] text-center my-0">
                Summary
              </Text>

              <View
                className="flex-row px-[16px] py-[8px] gap-[40px]"
                style={{ gap: 40 }}
              >
                <View className="gap-2 relative w-[65%]">
                  {[5, 4, 3, 2, 1].map((val, index) => {
                    let count = productReviews.filter(
                      (pr: any) => pr.rating == val,
                    );
                    let percentage =
                      (count.length / productReviews.length) * 100;
                    return (
                      <View
                        className="flex-row items-center gap-[8px] shrink"
                        key={index}
                      >
                        <Text className="text-[14px] text-white opacity-70">
                          {val}
                        </Text>
                        <RatingBar width={percentage.toString() + "%"} />
                      </View>
                    );
                  })}
                </View>

                <View>
                  <View>
                    <View className="flex-row items-center gap-[8px]">
                      <Text className="text-[24px] text-white">
                        {averageRating}
                      </Text>
                      <AntDesign name="star" size={16} color="#FFB400" />
                    </View>
                    <Text className="text-white text-[12px] opacity-50">
                      {totalReviews} Reviews
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* {token && (
              <TouchableOpacity
                className="bg-[#16783A] px-[16px] py-[8px] mt-[16px] mb-[8px] mx-[18px] justify-center items-center"
                onPress={() =>
                  router.push({
                    pathname: "/createReview/sellerReview",
                    params: {
                      id: sellerId,
                      storeName: storeName,
                      storeAvatar: storeAvatar,
                    },
                  })
                }
              >
                <Text className="text-white text-[15px] light">
                  Write a review
                </Text>
              </TouchableOpacity>
            )} */}

            <Text
              className="px-[18px] text-[14px] leading-[20px] mb-[23px]"
              style={{ color: "text-[rgba(255, 255, 255, 0.30)]" }}
            >
              Product reviews are managed by a third party to verify
              authenticity and compliance with our{" "}
              <Text className="text-[#90CAF9] underline">
                Ratings & Reviews Guidelines
              </Text>
            </Text>

            <View className="px-[21px]">
              {productReviews?.map((review: any, index: number) => (
                <View
                  key={index}
                  style={{
                    borderTopWidth: 0.5,
                    borderTopColor: "#fff",
                    paddingVertical: 12,
                  }}
                >
                  <ReviewCard
                    name={review.buyer.firstName + " " + review.buyer.lastName}
                    rating={review.rating}
                    comment={review.comment}
                    date={review.createdAt}
                    imageUrl={review?.images[0]?.url || ""}
                    imageDimensions={
                      review?.images[0]?.url
                        ? {
                            width: "100%",
                            height: 194,
                          }
                        : { width: "100%", height: 0 }
                    }
                  />
                </View>
              ))}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </>
  );
};

const RatingBar = ({ width }: { width: any }) => {
  return (
    <View
      className="w-full h-[8px] bg-[rgba(255, 255, 255, 0.09)] relative rounded-[2px]"
      style={{ backgroundColor: "rgba(255, 255, 255, 0.09)" }}
    >
      <View className={`h-full bg-[#FFB400]`} style={{ width: width }}></View>
    </View>
  );
};

export default ReviewsPage;
