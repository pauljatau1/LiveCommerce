import { View, Text, Animated, Pressable, StyleSheet } from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import { getToken } from "@/store/features/auth/utils";
import axios from "axios";
import ReviewCard from "../reviews";
import { ActivityIndicator } from "react-native-paper";
import { router } from "expo-router";
import MainReviewCard from "../reviews/mainReviewCard";

const SellerReviews = ({
  sellerId,
  storeName,
  storeAvatar,
  scrollY,
  headerHeight,
  index,
}: {
  sellerId: string;
  storeName: string;
  storeAvatar: string;
  scrollY: any;
  headerHeight: any;
  index: any;
}) => {
  const [sellerReviews, setSellerReviews] = useState<any>([]);
  const [issellerReviewsLoading, setIsSellerReviewsLoading] =
    useState<boolean>(true);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [hasReachedEnd, setHasReachedEnd] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);

  const getSellerReviews = async () => {
    try {
      const userToken = await getToken();
      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL +
          `api/seller/${sellerId}/product-reviews?page=${page}&limit=10`,
        {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        },
      );

      if (response.status == 200) {
        setSellerReviews([...sellerReviews, ...response.data.reviews]);
        if (!response.data.pagination.hasMore) {
          setHasReachedEnd(true);
        }
      }
    } catch (e: any) {
      if (e.response) {
        console.log("error returning product reviews", e.response.data);
      }
    } finally {
      setIsSellerReviewsLoading(false);
      setIsFetching(false);
    }
  };

  const fetchMoreReviews = useCallback(() => {
    if (!isFetching && !hasReachedEnd) {
      setIsFetching(true);
      setPage((prev) => prev + 1);
    }
  }, [isFetching, hasReachedEnd]);

  const renderReview = useCallback(({ item: review }: { item: any }) => {
    return (
      <View
        key={index}
        style={{
          borderBottomWidth: 0.5,
          borderBottomColor: "#fff",
          paddingVertical: 12,
          width: "100%",
          //   marginTop: 12,
        }}
      >
        <MainReviewCard
          name={
            review.buyer.firstName + " " + review.buyer.lastName ||
            review?.buyer?.name
          }
          rating={review?.rating}
          comment={review?.comment}
          date={review?.createdAt}
          images={review?.images}
          buyerImage={review?.buyer?.profileImage || ""}
          reviewId={review?.reviewId}
          productId={review?.product?._id}
        />
      </View>
    );
  }, []);

  const renderListHeader = useCallback(() => {
    return (
      <Pressable
        style={{
          paddingVertical: 10,
          width: "100%",
          borderRadius: 5,
          backgroundColor: "#16783A",
          justifyContent: "center",
          alignItems: "center",
          marginBottom: 20,
        }}
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
        <Text style={styles.updateBtnText}>Write a review</Text>
      </Pressable>
    );
  }, [sellerReviews]);

  const renderListFooter = useCallback(() => {
    return (
      <View>
        {isFetching ? (
          <ActivityIndicator size={"small"} color="$16783A" />
        ) : null}
      </View>
    );
  }, [isFetching, hasReachedEnd]);

  const renderListEmpty = useCallback(() => {
    return (
      <View className="w-full px-[16px] py-[20px] items-center justify-center">
        <Text className="text-white text-center font-LexendDeca">
          No reviews!
        </Text>
      </View>
    );
  }, [isFetching, hasReachedEnd]);

  useEffect(() => {
    getSellerReviews();
  }, [page]);
  return (
    <View style={{ flex: 1, paddingHorizontal: 16 }}>
      {issellerReviewsLoading ? (
        <View className="pt-[16px]">
          <ActivityIndicator size={"small"} color="#16783A" />
        </View>
      ) : (
        <View>
          <Animated.FlatList
            data={sellerReviews}
            renderItem={renderReview}
            keyExtractor={(item, index) => item?._id || index.toString()}
            onEndReached={fetchMoreReviews}
            onEndReachedThreshold={0.5}
            contentContainerStyle={{
              paddingTop: headerHeight + 12,
            }}
            // ListHeaderComponent={renderListHeader}
            ListFooterComponent={renderListFooter}
            ListEmptyComponent={renderListEmpty}
            showsVerticalScrollIndicator={false}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: true },
            )}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  updateBtnText: {
    fontSize: 14,
    color: "#fff",
    fontFamily: "LexendDeca",
  },
});

export default SellerReviews;
