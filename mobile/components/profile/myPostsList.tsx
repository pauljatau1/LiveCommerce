import {
  View,
  FlatList,
  Text,
  Platform,
  Animated,
  Pressable,
} from "react-native";
import { ActivityIndicator } from "react-native-paper";
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  useGetAllPostsQuery,
  useGetNewPostsQuery,
  useGetUserPostsQuery,
} from "@/services/posts";
import PostItem2 from "../connect/post-item2";
import { StyleSheet } from "nativewind";

interface Props {
  scrollY: any;
  headerHeight: number;
  userId: string;
  type: string;
  index: any;
}

const AllPostsList = ({
  scrollY,
  headerHeight,
  userId,
  type,
  index,
}: Props) => {
  const [page, setPage] = useState<number>(1);
  const [posts, setPosts] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [hasReachedEnd, setHasReachedEnd] = useState<boolean>(false);
  const flatListRef = useRef<FlatList>(null);

  const { data, isLoading, isFetching, refetch } = useGetUserPostsQuery({
    page: page,
    id: userId,
    type: type,
    limit: 10,
  });

  // Update posts when data changes
  useEffect(() => {
    if (data?.posts?.length > 0) {
      if (page > 1) {
        // Append new posts for pagination
        setPosts((prevPosts) => [...prevPosts, ...data.posts]);
      } else {
        // Replace posts on refresh or initial load
        setPosts(data?.posts);
      }
    }

    if (data?.posts?.length < 1 && page > 1) setHasReachedEnd(true);
  }, [data]);

  // Trigger refetch when page changes
  useEffect(() => {
    refetch();
  }, [page]);
  // Refetch whenever page changes

  // Fetch more posts for pagination
  const fetchMorePosts = useCallback(() => {
    if (!isFetching && !hasReachedEnd) {
      setPage((prev) => prev + 1);
    }
  }, [isFetching, hasReachedEnd]);

  // Refresh posts
  const refreshPosts = useCallback(async () => {
    setRefreshing(true); // Show refresh indicator
    try {
      setHasReachedEnd(false);
      setPage(1); // Reset page to 1 (this will trigger the useEffect above)
    } catch (error) {
      console.error("Error refreshing posts:", error);
    } finally {
      setRefreshing(false); // Hide refresh indicator
    }
  }, [refreshing]);

  // Render footer with loading spinner
  const renderFooter = useCallback(() => {
    if (hasReachedEnd)
      return posts?.length > 0 ? (
        <Text className="self-center my-[10px] text-white font-LexendDeca text-[12px]">
          Sorry , you've reached the end 😔
        </Text>
      ) : null;
    if (!isFetching) return null;
    return posts?.length > 0 ? (
      <View style={{ paddingVertical: 20 }}>
        <ActivityIndicator size="small" color="#16783A" />
      </View>
    ) : null;
  }, [hasReachedEnd]);

  const renderPosts = useCallback(({ item }: { item: any }) => {
    return <PostItem2 item={item} />;
  }, []);

  useEffect(() => {
    if (flatListRef.current) {
      flatListRef?.current?.scrollToOffset({ offset: 0, animated: false });
    }
  }, [index]);

  return (
    <View className="" style={{ flex: 1, gap: 10 }}>
      {posts.length < 1 && !isLoading && !isFetching && type == "Buyer" ? (
        <View className="items-center gap-[24px] " style={{ marginTop: 300 }}>
          <Text className="text-[#ccc] text-[22px] font-LexendDecaBold opacity-70">
            Your wall is empty
          </Text>
          <Pressable
            className="bg-[#16783A]"
            style={{
              paddingVertical: 15,
              paddingHorizontal: 30,
              borderRadius: 30,
            }}
          >
            <Text className="text-[#ccc] text-[16px] font-LexendDeca">
              Make First Post
            </Text>
          </Pressable>
        </View>
      ) : null}
      {isLoading && page === 1 ? (
        <ActivityIndicator
          size={"small"}
          color="#16783A"
          className="my-[20px]"
        />
      ) : posts?.length > 0 ? (
        <Animated.FlatList
          ref={flatListRef}
          data={posts}
          renderItem={renderPosts}
          keyExtractor={(item, index) => item?._id}
          onEndReached={fetchMorePosts}
          onEndReachedThreshold={0.5}
          refreshing={refreshing}
          onRefresh={refreshPosts}
          maxToRenderPerBatch={5}
          contentContainerStyle={{
            paddingTop: headerHeight,
          }}
          windowSize={5}
          showsVerticalScrollIndicator={false}
          // ListFooterComponent={renderFooter}
          initialNumToRender={10}
          nestedScrollEnabled={true}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true },
          )}
        />
      ) : null}
    </View>
  );
};

export default memo(AllPostsList);
