import { View, FlatList, Text } from "react-native";
import { ActivityIndicator } from "react-native-paper";
import React, { useEffect, useState } from "react";
import {
  useGetAllPostsQuery,
  useGetNewPostsQuery,
  useGetTrendingPostsQuery,
} from "@/services/posts";
import PostItem from "./post-item";

const TrendingPostsList = () => {
  const [page, setPage] = useState<number>(1);
  const [posts, setPosts] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [hasReachedEnd, setHasReachedEnd] = useState<boolean>(false);

  const { data, isLoading, isFetching, refetch } = useGetTrendingPostsQuery({
    page: page,
    limit: 10,
  });

  // Update posts when data changes
  useEffect(() => {
    if (data?.posts.length > 0) {
      if (page > 1) {
        // Append new posts for pagination
        setPosts((prevPosts) => [...prevPosts, ...data.posts]);
      } else {
        // Replace posts on refresh or initial load
        setPosts(data.posts);
      }
    }

    if (data?.posts.length < 1 && page > 1) setHasReachedEnd(true);
  }, [data]);

  // Trigger refetch when page changes
  useEffect(() => {
    refetch();
  }, [page]); // Refetch whenever page changes

  // Fetch more posts for pagination
  const fetchMorePosts = () => {
    if (!isFetching && !hasReachedEnd) {
      setPage((prev) => prev + 1);
    }
  };

  // Refresh posts
  const refreshPosts = async () => {
    setRefreshing(true); // Show refresh indicator
    try {
      setHasReachedEnd(false);
      setPage(1); // Reset page to 1 (this will trigger the useEffect above)
    } catch (error) {
      console.error("Error refreshing posts:", error);
    } finally {
      setRefreshing(false); // Hide refresh indicator
    }
  };

  // Render footer with loading spinner
  const renderFooter = () => {
    if (hasReachedEnd)
      return (
        <Text className="self-center my-[10px] text-white font-LexendDeca text-[12px]">
          Sorry , you've reached the end 😔
        </Text>
      );
    if (!isFetching) return null;
    return (
      <View style={{ paddingVertical: 20 }}>
        <ActivityIndicator size="small" color="#16783A" />
      </View>
    );
  };

  return (
    <View className="py-[10px]" style={{ gap: 10, height: "80%" }}>
      {isLoading && page === 1 ? (
        <ActivityIndicator
          size={"small"}
          color="#16783A"
          className="my-[20px]"
        />
      ) : (
        <FlatList
          data={posts}
          renderItem={({ item }) => <PostItem item={item} />}
          keyExtractor={(item, index) => item._id.toString()}
          onEndReached={fetchMorePosts}
          onEndReachedThreshold={0.5}
          refreshing={refreshing}
          onRefresh={refreshPosts}
          maxToRenderPerBatch={5}
          windowSize={5}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={renderFooter}
          initialNumToRender={10}
          removeClippedSubviews={true}
          updateCellsBatchingPeriod={100}
        />
      )}
    </View>
  );
};

export default TrendingPostsList;
