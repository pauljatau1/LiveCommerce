import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
} from "react-native";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { Image } from "expo-image";
import { ResizeMode, Video } from "expo-av";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import Entypo from "@expo/vector-icons/Entypo";
import Octicons from "@expo/vector-icons/Octicons";
import Ionicons from "@expo/vector-icons/Ionicons";
import { timeFromNow } from "@/helpers/helpers";
import { router } from "expo-router";
import BottomSheet from "../global/bottom-sheet";
import AntDesign from "@expo/vector-icons/AntDesign";
import SimpleLineIcons from "@expo/vector-icons/SimpleLineIcons";
import { getUser } from "@/store/features/auth/utils";
import moment from "moment";
import { useCommentPostMutation, useReactPostMutation } from "@/services/posts";

const { width } = Dimensions.get("window");

const blurhash =
  "|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[";

// Memoized Media Item Component
const MediaItem = memo(({ item }: { item: any }) => {
  const isVideo = item?.public_id?.split("/")[1] === "videos";

  if (isVideo) {
    return (
      <Video
        source={{ uri: item.url }}
        style={styles.mediaItem}
        resizeMode={ResizeMode.CONTAIN}
        useNativeControls
        isLooping
        shouldPlay={false}
      />
    );
  }

  return (
    <Image
      source={{ uri: item?.url }}
      placeholder={blurhash}
      contentFit="contain"
      transition={500}
      style={styles.mediaItem}
      cachePolicy="memory-disk"
    />
  );
});

// Memoized Product Item Component
const ProductItem = memo(
  ({ product, onPress }: { product: any; onPress: () => void }) => (
    <TouchableOpacity style={styles.productContainer} onPress={onPress}>
      <Image
        source={{
          uri:
            product?.productId?.images?.[0]?.url ||
            product?.images?.[0]?.url ||
            "",
        }}
        contentFit="cover"
        style={styles.productImage}
        cachePolicy="memory-disk"
      />
      <View style={styles.productInfo}>
        <Text style={styles.productName}>
          {product?.productId?.name?.slice(0, 50) ||
            product?.name?.slice(0, 50)}
        </Text>
      </View>
    </TouchableOpacity>
  ),
);

const PostItem2 = ({ item }: { item: any }) => {
  const [reactPost, { isLoading }] = useReactPostMutation({});
  const [state, setState] = useState({
    media: [...(item?.images || []), ...(item?.videos || [])],
    products: item?.products || [],
    activeIndex: 0,
  });
  const [reactions, setReactions] = useState<number>(item.reactions?.length);
  const [isReacted, setIsReacted] = useState<boolean>(false);
  const [showComments, setShowComments] = useState<boolean>(false);
  const [showOptionsSheet, setShowOptionsSheet] = useState<boolean>(false);
  const [allComments, setAllComments] = useState<any[]>(item.comments);
  const [comments, setComments] = useState<number>(item.comments?.length);

  const handleIncreaseCommentCount = () => {
    setComments(comments + 1);
  };

  const handleAddComment = (comment: any) => {
    setAllComments([...allComments, comment]);
  };

  const handleReact = async () => {
    setReactions(reactions + 1);
    try {
      const result = await reactPost({
        id: item._id,
        type: "like",
      });

      console.log("successfully added reaction ", result.data);
    } catch (e: any) {
      console.log("cannot like post", e.message);
    }
  };

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
  }).current;

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: any }) => {
      if (viewableItems.length > 0) {
        setState((prev) => ({ ...prev, activeIndex: viewableItems[0].index }));
      }
    },
    [],
  );

  const renderMedia = useCallback(
    ({ item: mediaItem }: { item: any }) => <MediaItem item={mediaItem} />,
    [],
  );

  const renderProduct = useCallback(
    ({ item: product }: { item: any }) => (
      <ProductItem
        product={product}
        onPress={() =>
          router.push({
            pathname: `/product/${product?.productId?._id || product?.id}`,
          })
        }
      />
    ),
    [],
  );

  const mediaKeyExtractor = useCallback(
    (_: any, index: number) => `media-${index}`,
    [],
  );
  const productKeyExtractor = useCallback(
    (item: any) => item?._id?.toString() || item?.id?.toString(),
    [],
  );

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Image
            source={require("../../assets/icons/animoji.png")}
            contentFit="contain"
            style={styles.avatar}
            cachePolicy="memory-disk"
          />
          <View style={styles.userMetadata}>
            <Text style={styles.userName}>{item?.author?.name}</Text>
            <Text style={styles.timestamp}>{timeFromNow(item?.createdAt)}</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() =>
            setState((prev) => ({ ...prev, showOptionsSheet: true }))
          }
        >
          <Entypo name="dots-three-vertical" size={12} color="#ccc" />
        </TouchableOpacity>
      </View>

      {/* Post Content */}
      <Text style={styles.postBody}>{item.body}</Text>

      {/* Media Section */}
      {state.media.length > 0 && (
        <View style={styles.mediaContainer}>
          <FlatList
            data={state.media}
            renderItem={renderMedia}
            keyExtractor={mediaKeyExtractor}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            removeClippedSubviews={true}
            initialNumToRender={1}
            maxToRenderPerBatch={2}
            windowSize={3}
          />
        </View>
      )}

      {/* Products Section */}
      {state.products.length > 0 && (
        <FlatList
          data={state.products}
          renderItem={renderProduct}
          keyExtractor={productKeyExtractor}
          horizontal
          showsHorizontalScrollIndicator={false}
          removeClippedSubviews={true}
          initialNumToRender={2}
          maxToRenderPerBatch={3}
          windowSize={3}
        />
      )}

      <View
        style={{
          marginTop: 12,
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <TouchableOpacity
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
          }}
          onPress={handleReact}
        >
          <Text>❤️</Text>
          <Text
            style={{
              color: "#ccc",
              fontSize: 10,
              fontFamily: "LexendDeca",
            }}
          >
            {reactions} Reactions
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
          }}
          onPress={() => setShowComments(true)}
        >
          <Octicons name="comment" size={12} color="#ccc" />

          <Text
            style={{
              color: "#ccc",
              fontSize: 10,
              fontFamily: "LexendDeca",
            }}
          >
            {comments} Comments
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
          }}
        >
          <Ionicons name="arrow-redo-sharp" size={12} color="#ccc" />

          <Text
            style={{
              color: "#ccc",
              fontSize: 10,
              fontFamily: "LexendDeca",
            }}
          >
            Share
          </Text>
        </TouchableOpacity>
      </View>

      <BottomSheet
        bgColor="#121212"
        childrenStyle="!px-[11px]"
        showCloseIcon={false}
        title=""
        show={showComments}
        titleColor="!text-white"
        snapPoints={["60%"]}
        enableDynamicSizing={false}
        onRequestClose={() => setShowComments(false)}
        keyboardBehavior="interactive"
      >
        <CommentsSheet
          handleIncreaseCommentCount={handleIncreaseCommentCount}
          allComments={allComments}
          commentsCount={comments}
          handleAddComment={handleAddComment}
          id={item._id}
        />
      </BottomSheet>

      <BottomSheet
        bgColor="#3A3A3A"
        childrenStyle="!px-[11px]"
        showCloseIcon={false}
        title=""
        show={showOptionsSheet}
        titleColor="!text-white"
        onRequestClose={() => setShowOptionsSheet(false)}
        keyboardBehavior={"interactive"}
      >
        <OptionsSheet />
      </BottomSheet>

      {/* Rest of your component... */}
    </View>
  );
};

const CommentsSheet = ({
  handleIncreaseCommentCount,
  allComments,
  commentsCount,
  handleAddComment,
  id,
}: {
  handleIncreaseCommentCount: () => void;
  allComments: any;
  commentsCount: number;
  handleAddComment: any;
  id: string;
}) => {
  const [commentPost, { isLoading }] = useCommentPostMutation({});
  const [comments, setComments] = useState<any[]>(allComments);
  const [comment, setComment] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);

  const handleCreateComment = async () => {
    const user = await getUser();

    const constructComment = {
      author: {
        firstName: user.firstName,
        lastName: user.lastName,
      },
      content: comment,
      createdAt: moment().toISOString(),
    };
    setComments([...comments, constructComment]);
    setComment("");
    handleIncreaseCommentCount();
    handleAddComment(constructComment);
    try {
      const result = await commentPost({
        id,
        content: comment,
      }).unwrap();
      // setComments(response.data.comments);
      setPage(1);
      setLoading(false);
    } catch (e: any) {
      console.log("error creating comment ", e.response.data);
    }
  };

  //   useEffect(() => {
  //     setComments(data);
  //   }, [data]);

  return (
    <View className="px-[10px] w-full h-full items-center">
      {/* {isLoading ? (
        <ActivityIndicator size={"small"} color={"white"} />
      ) : ( */}
      <View className="h-full pb-[50px] w-full">
        <Text className="text-white text-center mb-[30px]">
          {commentsCount || "No"} {commentsCount > 1 ? "comments" : "comment"}
        </Text>
        <View
          style={{
            paddingBottom: 60,
          }}
        >
          <FlatList
            data={comments.slice().reverse()}
            renderItem={({ item, index }) => (
              <View key={index} className="flex-row gap-2 mb-[16px]">
                <View className="rounded-[50%] bg-[#16783a] justify-center items-center w-[24px] h-[24px]">
                  <Text className="text-white text-[10px]">
                    {item.author.firstName.charAt(0).toUpperCase() +
                      item.author.lastName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View className="shrink">
                  <Text className="text-[#ccc] mb-[4px]">
                    {item.author.firstName + " " + item.author.lastName}
                  </Text>
                  <Text className="text-white leading-20 font-[400] mb-[12px]">
                    {item?.content}
                  </Text>
                  <Text className="text-[#f2f2f2] text-[12px] opacity-50">
                    {timeFromNow(item.createdAt)}
                  </Text>
                </View>
              </View>
            )}
            keyExtractor={(item, index) => index?.toString()}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>
      {/* )} */}
      <View className="w-[100%] rounded-[22px] py-[12px] px-[12px] bg-[#2e2e2e] absolute bottom-2 mx-auto">
        <BottomSheetTextInput
          placeholder="Add comment..."
          placeholderTextColor={"#ccc"}
          style={{
            fontSize: 15,
            color: "#fff",
          }}
          returnKeyType="send"
          value={comment}
          onChangeText={(text) => setComment(text)}
          onSubmitEditing={handleCreateComment}
        />
      </View>
    </View>
  );
};

const OptionsSheet = () => {
  return (
    <View className="w-full">
      <TouchableOpacity className="py-[15px] flex-row gap-[20px] px-[5px] items-center">
        <AntDesign name="eyeo" size={22} color="#ccc" />
        <Text className="text-[14px] text-[#ccc] font-LexendDeca">
          Hide Post
        </Text>
      </TouchableOpacity>
      <TouchableOpacity className="py-[15px] flex-row gap-[20px] px-[5px] items-center">
        <Octicons name="report" size={20} color="#ccc" />
        <Text className="text-[14px] text-[#ccc] font-LexendDeca">
          Report Post
        </Text>
      </TouchableOpacity>
      <TouchableOpacity className="py-[15px] flex-row gap-[20px] px-[5px] items-center">
        <SimpleLineIcons name="user-unfollow" size={20} color="#ccc" />
        <Text className="text-[14px] text-[#ccc] font-LexendDeca">
          Report This User
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 10,
    borderBottomColor: "#888787",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 32.5,
  },
  userMetadata: {
    gap: 5,
  },
  userName: {
    fontSize: 16,
    color: "#ccc",
    fontFamily: "LexendDeca-Medium",
  },
  timestamp: {
    fontSize: 8,
    color: "#ccc",
    fontFamily: "LexendDeca-Light",
  },
  postBody: {
    color: "#ccc",
    fontFamily: "LexendDeca",
    fontSize: 12,
    marginBottom: 10,
  },
  mediaContainer: {
    width: width - 32,
    height: "auto",
    maxHeight: 300,
    position: "relative",
    backgroundColor: "#111",
    borderRadius: 4,
  },
  mediaItem: {
    width: width - 32,
    height: 250,
    maxHeight: 250,
  },
  productContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: 200,
    borderRadius: 4,
    overflow: "hidden",
    marginRight: 20,
    marginVertical: 10,
    padding: 1,
    paddingHorizontal: 3,
    backgroundColor: "#f2f2f2",
  },
  productImage: {
    width: 25,
    height: 25,
    borderRadius: 4,
  },
  productInfo: {
    backgroundColor: "#f2f2f2",
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 5,
    height: 30,
  },
  productName: {
    color: "#3A3A3A",
    fontSize: 10,
    fontFamily: "LexendDeca-Medium",
  },
});

export default memo(PostItem2);
