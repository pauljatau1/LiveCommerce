import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import React, { memo, useEffect, useRef, useState } from "react";
import {
  useCommentPostMutation,
  useGetAllPostsQuery,
  useLikePostMutation,
  useReactPostMutation,
} from "@/services/posts";
import { ActivityIndicator } from "react-native-paper";
import { timeFromNow } from "@/helpers/helpers";
import Entypo from "@expo/vector-icons/Entypo";
import Octicons from "@expo/vector-icons/Octicons";
import Ionicons from "@expo/vector-icons/Ionicons";
import { ResizeMode, Video } from "expo-av";
import { Image } from "expo-image";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import moment from "moment";
import { getUser } from "@/store/features/auth/utils";
import BottomSheet from "../global/bottom-sheet";
import { router } from "expo-router";
import AntDesign from "@expo/vector-icons/AntDesign";
import SimpleLineIcons from "@expo/vector-icons/SimpleLineIcons";

const { width } = Dimensions.get("window");
const blurhash =
  "'|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj['";
const PostItem = ({ item }: { item: any }) => {
  const [reactPost, { isLoading }] = useReactPostMutation({});
  const [reactions, setReactions] = useState<number>(item.reactions?.length);
  const [isReacted, setIsReacted] = useState<boolean>(false);
  const [allComments, setAllComments] = useState<any[]>(item.comments);
  const [comments, setComments] = useState<number>(item.comments?.length);
  const [showComments, setShowComments] = useState<boolean>(false);
  const [media, setMedia] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [showOptionsSheet, setShowOptionsSheet] = useState<boolean>(false);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: any }) => {
      if (viewableItems.length > 0) {
        setActiveIndex(viewableItems[0].index);
      }
    },
  ).current;

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 60,
  };

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

  const RenderDots = () => {
    return (
      <View
        className="flex-row items-center justify-center"
        style={{ marginVertical: 8, gap: 2, marginLeft: 50 }}
      >
        {Array(media?.length)
          .fill(0)
          .map((_, index) => (
            <View
              key={index}
              style={{
                width: 5,
                height: 5,
                borderRadius: 5,
                backgroundColor: activeIndex == index ? "#16783A" : "#ccc",
              }}
            ></View>
          ))}
      </View>
    );
  };

  const renderProducts = (product: any, index: number) => {
    return (
      <TouchableOpacity
        key={index}
        className="relative flex-row items-center w-[200px] rounded-[4px] overflow-hidden"
        style={{
          marginRight: 20,
          marginVertical: 10,
          padding: 1,
          paddingHorizontal: 3,
          backgroundColor: "#f2f2f2",
        }}
        onPress={() =>
          router.push({
            pathname: `/product/${product?.productId?._id || product?.id}`,
          })
        }
      >
        <Image
          source={{
            uri:
              product?.productId?.images?.[0]?.url ||
              product?.images?.[0]?.url ||
              "",
          }}
          contentFit="cover"
          style={{
            width: 25,
            height: 25,
            borderRadius: 4,
          }}
        />
        <View
          className="bg-[#f2f2f2] w-full shrink flex-row items-center justify-between"
          style={{
            paddingHorizontal: 5,
            height: 30,
          }}
        >
          <Text className="text-[#3A3A3A] text-[10px] font-LexendDecaMedium">
            {product?.productId?.name?.slice(0, 50) ||
              product?.name?.slice(0, 50)}
          </Text>
          {/* <FontAwesome6 name="caret-right" size={16} color="#ccc" /> */}
        </View>
      </TouchableOpacity>
    );
  };

  useEffect(() => {
    setAllComments(item?.comments);
    setComments(item?.comments?.length);
    setReactions(item?.reactions?.length);
    // if (media?.length! < 1) {
    setMedia([...item?.images, ...item?.videos]);
    // }
    setProducts(item?.products);
  }, [item]);

  return (
    <View
      style={{
        paddingBottom: 10,
        borderBottomColor: "#D9D9D9",
        borderBottomWidth: 0.5,
      }}
    >
      <View className="flex-row items-center justify-between py-[10px]">
        <View className="flex-row items-center gap-[12px]">
          <Image
            source={require("../../assets/icons/animoji.png")}
            contentFit="contain"
            style={{
              width: 40,
              height: 40,
              borderRadius: 32.5,
            }}
          />
          <View style={{ gap: 5 }}>
            <Text className="text-[16px] text-[#ccc] font-LexendDecaMedium">
              {item?.author?.name}
            </Text>
            <Text className="text-[8px] text-[#ccc] font-LexendDecaLight">
              {timeFromNow(item?.createdAt)}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => setShowOptionsSheet(true)}>
          <Entypo name="dots-three-vertical" size={12} color="#ccc" />
        </TouchableOpacity>
      </View>
      <Text
        key={item._id}
        className="text-[#ccc] font-LexendDeca text-[12px] shrink ml-[50px]"
        style={{
          marginBottom: 10,
          marginLeft: 50,
        }}
      >
        {item.body}
      </Text>

      <View
        style={{
          width: width - 32 - 50,
          height: "auto",
          maxHeight: 300,
          position: "relative",
          backgroundColor: "#111",
          borderRadius: 4,
          marginLeft: 50,
        }}
      >
        <FlatList
          data={media}
          renderItem={({ item }) =>
            item?.public_id?.split("/")[1] == "videos" ? (
              <Video
                // ref={videoRef}
                source={{
                  uri: item.url,
                }}
                style={{
                  height: 250,
                  width: width - 32 - 50,
                  maxHeight: 250,
                }}
                resizeMode={ResizeMode.CONTAIN}
                // shouldPlay={isVisible}

                useNativeControls
                isLooping
                // onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
              />
            ) : (
              <Image
                source={{ uri: item?.url }}
                placeholder={{ blurhash }}
                contentFit="contain"
                transition={500}
                style={{
                  //   backgroundColor: "red",
                  width: width - 32 - 50,
                  height: 250,
                  maxHeight: 300,
                }}
              />
            )
          }
          keyExtractor={(item, index) => index.toString()}
          pagingEnabled
          horizontal
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
        />
      </View>
      {RenderDots()}
      <View
        style={{
          width: "100%",
          height: "auto",
          maxHeight: 300,
          position: "relative",
          backgroundColor: "#111",
          borderRadius: 4,
          // marginLeft: 50,
        }}
      >
        {products && products?.length > 0 && (
          <FlatList
            data={products}
            keyExtractor={(item, index) =>
              item?._id?.toString() || item?.id?.toString()
            }
            renderItem={({ item, index }) => renderProducts(item, index)}
            // style={{
            //   gap: 24,
            //   paddingBottom: 100,
            // }}
            horizontal
            showsHorizontalScrollIndicator={false}
          />
        )}
      </View>

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
      <TouchableOpacity className="py-[15px] flex-row gap-[20px] px-[5px]">
        <AntDesign name="eyeo" size={22} color="#ccc" />
        <Text className="text-[16px] text-[#ccc] ">Hide Post</Text>
      </TouchableOpacity>
      <TouchableOpacity className="py-[15px] flex-row gap-[20px] px-[5px]">
        <Octicons name="report" size={20} color="#ccc" />
        <Text className="text-[16px] text-[#ccc] ">Report Post</Text>
      </TouchableOpacity>
      <TouchableOpacity className="py-[15px] flex-row gap-[20px] px-[5px]">
        <SimpleLineIcons name="user-unfollow" size={20} color="#ccc" />
        <Text className="text-[16px] text-[#ccc] ">Report This User</Text>
      </TouchableOpacity>
    </View>
  );
};

export default memo(PostItem);
