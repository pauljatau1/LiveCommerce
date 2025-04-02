import {
  View,
  Text,
  SafeAreaView,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { ScrollView } from "react-native-virtualized-view";
import { ActivityIndicator } from "react-native-paper";
import React, { useCallback, useEffect, useState } from "react";
import { router, useGlobalSearchParams } from "expo-router";
import { FocusAwareStatusBar } from "@/components/ui/focus-aware-status-bar";
import axios from "axios";
import ReviewCard from "@/components/reviews";
import { useGetSingleProductQuery } from "@/services/products";
import Entypo from "@expo/vector-icons/Entypo";
import AntDesign from "@expo/vector-icons/AntDesign";
import { getToken } from "@/store/features/auth/utils";
import MainReviewCard from "@/components/reviews/mainReviewCard";
import { FlatList } from "react-native-gesture-handler";
import LottieView from "lottie-react-native";

const { width, height } = Dimensions.get("window");

const ReviewsPage = () => {
  const { id, sellerId, storeName, storeAvatar, averageRating } =
    useGlobalSearchParams();

  const [productReviews, setProductReviews] = useState<any>([]);
  const [isProductReviewsLoading, setIsProductReviewsLoading] =
    useState<boolean>(true);
  // const [averageRating, setAverageRating] = useState<string>("");
  const [totalReviews, setTotalReviews] = useState<string>("");
  const [token, setToken] = useState<string>("");
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [hasReachedEnd, setHasReachedEnd] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);

  const getProductReviews = async () => {
    if (page == 1) {
      setIsProductReviewsLoading(true);
    } else {
      setIsFetching(true);
    }
    try {
      const userToken = await getToken();
      setToken(userToken);
      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL +
          `api/products/${id}/reviews?page=${page}&limit=3`,
      );

      if (response.status == 200) {
        if (page == 1) {
          setProductReviews(response.data.reviews);
        } else {
          setProductReviews([...productReviews, ...response.data.reviews]);
        }

        if (
          response.data.currentPage == response.data.totalPages ||
          response.data.totalPages < 1
        ) {
          setHasReachedEnd(true);
        }
        setTotalReviews(response.data.totalReviews);
      }
    } catch (e: any) {
      if (e.response) {
        console.log("error returning product reviews", e.response.data);
      }
    } finally {
      setIsFetching(false);
      setIsProductReviewsLoading(false);
    }
  };

  const fetchMoreReviews = () => {
    console.log("more page ", { page, isFetching, hasReachedEnd });

    if (!isFetching && !hasReachedEnd) {
      setPage((prev) => prev + 1);
    }
  };

  useEffect(() => {
    getProductReviews();
  }, [page]);

  const renderListFooter = useCallback(() => {
    if (isFetching && !hasReachedEnd) {
      return (
        <View
          style={{
            width: "100%",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <LottieView
            source={require("../../../assets/lottie/dots-loading.json")}
            autoPlay
            loop
            style={{
              width: 70,
              height: 30,
            }}
          />
        </View>
      );
    } else {
      return null;
    }
  }, [isFetching, hasReachedEnd]);

  const renderListHeader = useCallback(() => {
    return (
      <View>
        <View className="mt-[20px]">
          <Text className="text-[#fff] opacity-70 text-[16px] text-center my-0 font-LexendDeca">
            Summary
          </Text>

          <View className="flex-row py-[8px] gap-[40px]" style={{ gap: 40 }}>
            <View className="gap-2 relative w-[100%] shrink">
              {[5, 4, 3, 2, 1].map((val, index) => {
                let count = productReviews.filter(
                  (pr: any) => pr.rating == val,
                );
                let percentage = (count.length / productReviews.length) * 100;
                return (
                  <View
                    className="flex-row items-center gap-[8px] shrink"
                    key={index}
                  >
                    <Text className="text-[14px] text-white opacity-70 font-LexendDeca">
                      {val}
                    </Text>
                    <RatingBar width={percentage.toString() + "%"} />
                  </View>
                );
              })}
            </View>

            <View className="">
              <View>
                <View className="flex-row items-center gap-[8px] shrink">
                  <Text className="text-[24px] text-white font-LexendDecaSemiBold shrink">
                    {averageRating}
                  </Text>
                  <AntDesign name="star" size={16} color="#FFB400" />
                </View>
                <Text className="text-white text-[12px] opacity-50 font-LexendDeca">
                  {totalReviews} Reviews
                </Text>
              </View>
            </View>
          </View>
        </View>

        <Text
          className=" text-[14px] leading-[20px] mb-[23px]"
          style={{ color: "text-[rgba(255, 255, 255, 0.30)]" }}
        >
          Product reviews are managed by a third party to verify authenticity
          and compliance with our{" "}
          <Text className="text-[#90CAF9] underline">
            Ratings & Reviews Guidelines
          </Text>
        </Text>
      </View>
    );
  }, [productReviews, totalReviews]);

  const renderReviews = useCallback(({ item: review }: any) => {
    return (
      <View
        style={{
          borderTopWidth: 0.5,
          borderTopColor: "#fff",
          paddingVertical: 12,
        }}
      >
        <MainReviewCard
          name={review.buyer.firstName + " " + review.buyer.lastName}
          rating={review.rating}
          comment={review.comment}
          date={review.createdAt}
          images={review?.images}
          buyerImage={review?.buyer?.profileImage?.url || ""}
          reviewId={review?._id}
          productId={id}
        />
      </View>
    );
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
          Product Reviews
        </Text>
      </View>
      {isProductReviewsLoading ? (
        <ActivityIndicator
          size={"small"}
          color={"#fff"}
          style={{ marginTop: 30 }}
        />
      ) : (
        <View className="px-[16px] flex-1">
          <FlatList
            data={productReviews}
            renderItem={renderReviews}
            keyExtractor={(item, index) => item?._id || index.toString()}
            showsVerticalScrollIndicator={false}
            onEndReached={fetchMoreReviews}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderListFooter}
            ListHeaderComponent={renderListHeader}
          />
        </View>
      )}
    </SafeAreaView>
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
