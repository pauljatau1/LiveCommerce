import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Keyboard,
} from "react-native";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { router, useGlobalSearchParams } from "expo-router";
import { getToken } from "@/store/features/auth/utils";
import axios from "axios";
import { FocusAwareStatusBar } from "@/components/ui/focus-aware-status-bar";
import { formatDate, formatMessageDate } from "@/helpers/helpers";
import { ActivityIndicator } from "react-native-paper";
import { Image } from "expo-image";
import Entypo from "@expo/vector-icons/Entypo";
import * as ImagePicker from "expo-image-picker";

import { io } from "socket.io-client";
import { Pressable, TextInput } from "react-native-gesture-handler";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import AntDesign from "@expo/vector-icons/AntDesign";
import SimpleLineIcons from "@expo/vector-icons/SimpleLineIcons";
import BottomSheet from "@/components/global/bottom-sheet";
import Ionicons from "@expo/vector-icons/Ionicons";
import ConnectProductCard from "@/components/connect/product-card";
import { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import {
  products,
  useGetAllProductsQuery,
  useGetSellerProductsQuery,
} from "@/services/products";

const { width, height } = Dimensions.get("window");

const MessageRoom = () => {
  const { id, name, avatar, conversationId, userId, token, model } =
    useGlobalSearchParams();
  const socket = io(process.env.EXPO_PUBLIC_API_URL, {
    transports: ["websocket"],
    auth: {
      token: token,
    },
  });
  socket.connect();

  const [selectedMedia, setSelectedMedia] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [messagesLoading, setMessagesLoading] = useState<boolean>(false);
  const [newMessage, setNewMessage] = useState<any>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [showProducts, setShowProducts] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<any>({});
  const [showOptions, setShowOptions] = useState<boolean>(false);
  const [isFirstTimer, setIsFirstTimer] = useState<boolean>(false);
  const listRef = useRef<FlatList>(null);
  const isInitialLoad = useRef(true);

  const pickImage = async () => {
    if (selectedMedia.length >= 1) {
      alert("You can only upload up to 1 immage.");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      allowsMultipleSelection: false,
      base64: false,
    });

    if (!result.canceled && result.assets.length > 0) {
      const newImages = result.assets.map((asset) => ({
        uri: asset.uri,
        name: `media_${Date.now()}.${asset.mimeType?.split("/")[1] || "application/octet-stream"}`,
        mimeType: asset.mimeType,
      }));
      const remainingSlots = 4 - selectedMedia.length;
      const imagesToAdd = newImages.slice(0, remainingSlots);

      setSelectedMedia((prevMedia) => [...prevMedia, ...imagesToAdd]);
    }
  };

  const getAllMessages = async () => {
    if (!conversationId) {
      setMessages([]);
      setLoading(false);
      setIsFirstTimer(true);
      return;
    }
    try {
      const token = await getToken();
      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL + "api/messages/" + conversationId,
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        },
      );
      setMessages(response.data);
    } catch (e) {
      console.log("error getting message history ", e);
    } finally {
      setMessagesLoading(false);
      handleReadMessages();
    }
  };

  const handleReadMessages = async () => {
    try {
      const token = await getToken();
      await axios.put(
        process.env.EXPO_PUBLIC_API_URL +
          `api/conversations/${conversationId}/read`,
        {},
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        },
      );
    } catch (e) {
      console.log("error marking conversation as read ", e);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage) return;
    setNewMessage("");
    const socketPayload = {
      sender: { id: userId },
      content: newMessage,
      createdAt: new Date().toISOString(),
      error: "",
      conversationId: conversationId,
    };
    setIsFirstTimer(false);

    setMessages([...messages, socketPayload]);
    scrollToBottom();
    try {
      const token = await getToken();
      const response = await axios.post(
        process.env.EXPO_PUBLIC_API_URL + "api/messages",
        {
          recipientId: id,
          recipientModel: model || "Seller",
          content: newMessage,
        },
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        },
      );

      socket.emit("new_message", {
        conversationId,
        message: response.data.message,
      });
      console.log("http message sent ", response.data);
    } catch (e) {
      setMessages((prevData) => {
        const newData = [...prevData]; // Copy array to avoid mutation
        const lastIndex = newData
          .map((obj) => obj.sender.id)
          .lastIndexOf(userId);

        if (lastIndex !== -1) {
          newData[lastIndex] = {
            ...newData[lastIndex],
            error: "Not sent!", // Replace error string
          };
        }

        return newData; // Update state
      });
      console.log("error getting message history ", e);
    }
  };

  const handleSendMedia = async () => {
    const mediaPayload = {
      sender: { id: userId },
      media: [
        {
          url: selectedMedia?.[0].uri,
        },
      ],
      messageType: "image",
      content: "",
      createdAt: new Date().toISOString(),
      error: "",
      conversationId: conversationId,
    };
    setMessages([...messages, mediaPayload]);
    scrollToBottom();
    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append("recipientId", id.toString());
      formData.append("recipientModel", model.toString());
      formData.append("messageType", "image");
      formData.append("content", "");
      selectedMedia.forEach((image, index) => {
        formData.append(`media`, image);
      });
      const response = await axios.post(
        process.env.EXPO_PUBLIC_API_URL + "api/messages/media",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: "Bearer " + token,
          },
        },
      );

      console.log("http media message sent ", response.data);
    } catch (e) {
      setMessages((prevData) => {
        const newData = [...prevData]; // Copy array to avoid mutation
        const lastIndex = newData
          .map((obj) => obj.sender.id)
          .lastIndexOf(userId);

        if (lastIndex !== -1) {
          newData[lastIndex] = {
            ...newData[lastIndex],
            error: "Not sent!", // Replace error string
          };
        }

        return newData; // Update state
      });
      console.log("error sending media message ", e);
    } finally {
      setSelectedMedia([]);
    }
  };

  const handleSendProduct = async () => {
    const productPayload = {
      sender: { id: userId },
      product: { id: selectedProduct },
      messageType: "product",
      content: "",
      createdAt: new Date().toISOString(),
      error: "",
      conversationId: conversationId,
    };
    setMessages([...messages, productPayload]);
    scrollToBottom();
    try {
      const token = await getToken();
      const response = await axios.post(
        process.env.EXPO_PUBLIC_API_URL + "api/messages/product",
        {
          recipientId: id,
          recipientModel: model,
          productId: selectedProduct._id,
          content: "",
        },
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        },
      );

      console.log("http product message sent ", response.data);
    } catch (e) {
      setMessages((prevData) => {
        const newData = [...prevData]; // Copy array to avoid mutation
        const lastIndex = newData
          .map((obj) => obj.sender.id)
          .lastIndexOf(userId);

        if (lastIndex !== -1) {
          newData[lastIndex] = {
            ...newData[lastIndex],
            error: "Not sent!", // Replace error string
          };
        }

        return newData; // Update state
      });
      console.log("error sending product message ", e);
    } finally {
      setSelectedProduct({});
    }
  };

  const handleSubmitSelectedProducts = useCallback(
    (product: any) => {
      setSelectedProduct(product);
      setShowProducts(false);
    },
    [showProducts, selectedProduct],
  );

  useEffect(() => {
    getAllMessages();
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      if (isInitialLoad.current) {
        // On first load, scroll without animation
        setTimeout(() => {
          listRef.current?.scrollToEnd({ animated: false });
          isInitialLoad.current = false;
        }, 100);
        setLoading(false);
      } else {
        // For new messages, scroll with animation
        listRef.current?.scrollToEnd({ animated: true });
      }
    }
  }, [messages]);

  useEffect(() => {
    if (selectedMedia.length > 0) handleSendMedia();
  }, [selectedMedia]);

  useEffect(() => {
    if (selectedProduct?._id) handleSendProduct();
  }, [selectedProduct]);

  useEffect(() => {
    console.log(token);

    socket.on("connect", () => {
      console.log("Connected to backend");
    });
    socket.emit("join", userId);

    const messageHandler = (newMessage: any) => {
      console.log("message recieved");

      const messageData = newMessage.message || newMessage;
      if (messageData.conversation === conversationId) {
        setMessages((prev) => [...prev, messageData]);
        handleReadMessages();
        scrollToBottom();
      }
    };

    socket.on("receive_message", messageHandler);

    return () => {
      socket.off("receive_message", messageHandler);
      socket.disconnect();
    };
  }, []);

  const scrollToBottom = useCallback(() => {
    if (listRef.current && messages.length > 0) {
      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const renderMessage = useCallback(
    ({ item }: { item: any }) => (
      <MessageItem
        message={item}
        userId={userId.toString()}
        senderId={item.sender?.id}
        messageType={item.messageType || "text"}
        media={item.media || null}
      />
    ),
    [],
  );
  const keyExtractor = useCallback(
    (item: any, index: number) => item._id || index.toString(),
    [],
  );
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.select({ ios: 0, android: 0 })}
      style={{ flex: 1, backgroundColor: "#121212" }}
    >
      <FocusAwareStatusBar barStyle="light-content" backgroundColor="#121212" />
      <SafeAreaView className="flex-1 h-full">
        <View className="flex-row items-center justify-between gap-[12px] px-[17px] pt-[30px] pb-[12px] border-b-[1px] border-b-[#888787]">
          <View className="flex-row items-center gap-[12px]">
            <TouchableOpacity className="" onPress={() => router.back()}>
              <Entypo
                name="chevron-left"
                size={24}
                color="rgba(204, 204, 204, 0.8)"
              />
            </TouchableOpacity>
            <Image
              source={{ uri: avatar }}
              contentFit="cover"
              style={{
                width: 40,
                height: 40,
                borderRadius: 40,
              }}
            />
            <View className="gap-[2px]">
              <Text className="text-[18px] text-[#ccc] font-LexendDecaMedium">
                {name}
              </Text>
              {/* <Text className="text-[12px] text-[#ccc] font-LexendDecaLight">
                Online
              </Text> */}
            </View>
          </View>
          <View className="flex-row items-center gap-[24px]">
            <Pressable>
              <Image
                source={require("../../../assets/icons/store.png")}
                contentFit="contain"
                style={{
                  width: 22,
                  height: 22,
                }}
              />
            </Pressable>
            <Pressable>
              <Image
                source={require("../../../assets/icons/dots.png")}
                contentFit="contain"
                style={{
                  width: 22,
                  height: 22,
                }}
              />
            </Pressable>
          </View>
        </View>
        {loading ? (
          <ActivityIndicator
            size={"small"}
            color="#16783A"
            style={{ marginTop: 20 }}
          />
        ) : (
          <View style={styles.container}>
            <FlatList
              ref={listRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={keyExtractor}
              // onEndReached={onLoadMore}
              onEndReachedThreshold={0.5}
              ListHeaderComponent={
                messagesLoading ? <ActivityIndicator /> : null
              }
              maintainVisibleContentPosition={{
                minIndexForVisible: 0,
                autoscrollToTopThreshold: 0,
              }}
              contentContainerStyle={[
                styles.contentContainer,
                messages.length === 0 && styles.emptyList,
              ]}
              removeClippedSubviews={false}
              windowSize={10}
              maxToRenderPerBatch={10}
              updateCellsBatchingPeriod={50}
              onLayout={() => {
                if (isInitialLoad.current && messages.length > 0) {
                  listRef.current?.scrollToEnd({ animated: true });
                }
              }}
              showsVerticalScrollIndicator={false}
            />
            {isFirstTimer && (
              <View
                style={{
                  alignItems: "center",
                  width: "100%",
                  gap: 20,
                  position: "absolute",
                  top: 50,
                  paddingHorizontal: 85,
                }}
              >
                <Text className="text-[17px] text-[#ccc] font-LexendDeca">
                  Welcome!
                </Text>
                <Text
                  className="text-[12px] text-[#ccc] font-LexendDeca"
                  style={{
                    textAlign: "center",
                  }}
                >
                  Speak freely to {name} about your concerns or inquiries.
                </Text>
              </View>
            )}
            <View
              className="gap-[12px] flex-col items-center"
              style={{
                alignSelf: "baseline",
              }}
            >
              <View className="flex-row items-center gap-[12px] pt-[12px] pb-[12px] border-t-[0.5px] border-t-[#888787] px-[17px]">
                <View className="flex-row justify-between gap-[4px] px-[12px] py-[8px] rounded-[24px] items-center w-full shrink border-[1px] border-[#ccc]">
                  <TextInput
                    placeholder="Type a message..."
                    placeholderTextColor={"rgba(204,204,204,0.25)"}
                    className="text-[15px] text-[#f2f2f2] font-LexendDeca w-full shrink p-0"
                    value={newMessage}
                    multiline
                    onChangeText={(text) => setNewMessage(text)}
                    onFocus={() => setShowOptions(false)}
                  />
                  <Pressable onPress={handleSendMessage}>
                    <MaterialCommunityIcons
                      name="send-circle"
                      size={30}
                      color="#16783A"
                    />
                  </Pressable>
                </View>
                {!newMessage && (
                  <View className="flex-row items-center gap-[4px]">
                    <Pressable onPress={() => setShowOptions(!showOptions)}>
                      {showOptions ? (
                        <AntDesign
                          name="closecircle"
                          size={28}
                          color="#f2f2f2"
                        />
                      ) : (
                        <AntDesign
                          name="pluscircle"
                          size={28}
                          color="#f2f2f2"
                        />
                      )}
                    </Pressable>
                  </View>
                )}
              </View>
              {showOptions && (
                <View className="flex-row items-center justify-center gap-[50] flex-wrap self-center">
                  <TouchableOpacity
                    className="flex-col items-center gap-[5px]"
                    onPress={() => pickImage()}
                  >
                    <View className="w-[50px] h-[50px] rounded-[50px] justify-center items-center bg-[#DAE3EA]">
                      <AntDesign name="picture" size={15} color="#94A3B1" />
                    </View>
                    <Text className="text-[12px] font-LexendDeca text-[#94A3B1]">
                      Media
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className="flex-col items-center gap-[5px]"
                    onPress={() => {
                      Keyboard.dismiss();
                      setShowProducts(true);
                    }}
                  >
                    <View className="w-[50px] h-[50px] rounded-[50px] justify-center items-center bg-[#DAE3EA]">
                      <SimpleLineIcons name="chart" size={15} color="#94A3B1" />
                    </View>
                    <Text className="text-[12px] font-LexendDeca text-[#94A3B1]">
                      Product
                    </Text>
                  </TouchableOpacity>

                  {/* <LoadingModal isVisible={isLoading} /> */}
                </View>
              )}
            </View>
          </View>
        )}

        <BottomSheet
          bgColor="#121212"
          childrenStyle="!px-[11px]"
          showCloseIcon={false}
          title=""
          show={showProducts}
          titleColor="!text-white"
          snapPoints={["80%"]}
          enableDynamicSizing={false}
          onRequestClose={() => setShowProducts(false)}
          keyboardBehavior="interactive"
        >
          <ProductsSheet
            handleSubmitSelectedProducts={handleSubmitSelectedProducts}
            id={id}
          />
        </BottomSheet>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const MediaItem = memo(({ item }: { item: any }) => {
  return (
    <Image
      source={{ uri: item?.[0]?.url }}
      contentFit="contain"
      transition={500}
      style={{
        width: 200,
        height: undefined,
        aspectRatio: 1,
        // maxHeight: 200,
        borderRadius: 10,
      }}
      cachePolicy="memory-disk"
    />
  );
});

const ProductItem = memo(({ item }: { item: any }) => {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      className="flex-row gap-[12px] p-[12px] shrink"
      style={{
        flexShrink: 1,
        maxWidth: 250,
      }}
      onPress={() => router.push(`/(root)/product/${item.id._id}`)}
    >
      <View>
        <Image
          source={{ uri: item.id?.images?.[0]?.url }}
          contentFit="contain"
          style={{ width: 100, height: 100, borderRadius: 10 }}
        />
      </View>
      <View className="gap-[2px] shrink">
        <Text className="text-[14px] text-[#111] font-LexendDecaMedium">
          {item.id.name}
        </Text>
        {<DeterminePrice productDetails={item.id} />}
        <Text className="text-[10px] text-[#111] font-LexendDecaLight">
          {item.id.description?.slice(0, 40)}
        </Text>
      </View>
    </TouchableOpacity>
  );
});
const MessageItem = memo(
  ({
    message,
    userId,
    senderId,
    messageType,
    media,
  }: {
    message: any;
    userId: string;
    senderId: string;
    messageType: string;
    media: any;
  }) => {
    const isMyMessage = senderId == userId;
    const RenderMessageType = (type: string) => {
      switch (type) {
        case "text":
          return (
            <Text
              style={isMyMessage ? styles.messageText : styles.otherMessageText}
            >
              {message.content}
            </Text>
          );
        case "image":
          return <MediaItem item={media} />;
        case "product":
          return <ProductItem item={message.product} />;
      }
    };
    return (
      <View>
        <View
          style={[
            styles.messageContainer,
            isMyMessage
              ? styles.myMessageContainer
              : styles.otherMessageContainer,
          ]}
        >
          <View
            style={[
              // styles.messageContainer,
              isMyMessage ? styles.myMessage : styles.otherMessage,
            ]}
          >
            {RenderMessageType(messageType)}

            <Text style={styles.timestamp}>
              {formatMessageDate(message.createdAt)}
            </Text>
          </View>
          {isMyMessage && message.error && (
            <Text className="text-[#F24822] text-[8px] font-LexendDeca ml-[4px]">
              <AntDesign name="exclamationcircle" size={18} color="#F24822" />{" "}
              {message.error}
            </Text>
          )}
        </View>
      </View>
    );
  },
);

const DeterminePrice = memo(({ productDetails }: { productDetails: any }) => {
  return (
    <View className="flex-row items-center gap-[8px]">
      <Text className="text-[12px] font-LexendDecaMedium leading-[18px]">
        ₦
        {productDetails?.discount?.isActive
          ? productDetails?.discount?.discountedPrice?.toLocaleString() || 0
          : productDetails?.price?.toLocaleString()}
      </Text>
      {productDetails?.discount?.isActive && (
        <Text className="text-[11px] text-[#16783A] font-LexendDecaBold">
          -{productDetails?.discount?.value}
          {productDetails?.discount?.type == "percentage" && "%"} off
        </Text>
      )}
    </View>
  );
});

const ProductsSheet = ({
  handleSubmitSelectedProducts,
  id,
}: {
  handleSubmitSelectedProducts: any;
  id: any;
}) => {
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>(".");
  const [query, setQuery] = useState<string>(".");
  // const [products]
  const { data, isLoading, isFetching, isError, refetch } =
    useGetSellerProductsQuery(id);

  const handleFinalSubmit = () => {
    handleSubmitSelectedProducts(selectedProducts[0]);
  };

  const handleSelectItem = (item: any) => {
    if (isFetching) return;
    const existingItem = selectedProducts.find((prod) => prod._id == item._id);
    if (existingItem) {
      return setSelectedProducts(
        selectedProducts.filter((prod) => prod._id != item._id),
      );
    }
    // if (selectedProducts.length >= 1) {
    //   return;
    // }
    setSelectedProducts([item]);
  };

  return (
    <View className="h-full">
      <View
        style={{
          paddingBottom: 80,
          height: "100%",
        }}
      >
        <Text className="text-center text-[#ccc] text-[14px]  mb-[30px] font-LexendDeca">
          Select a product to send
        </Text>
        {isLoading ? (
          <ActivityIndicator size={"small"} color="#16783A" />
        ) : (
          <BottomSheetFlatList
            data={data.products}
            // scrollEnabled={true}

            nestedScrollEnabled={true}
            renderItem={({ item }: { item: any }) => (
              <TouchableOpacity
                className="w-[49%] h-[300px] mb-[10px]"
                style={{
                  opacity: isFetching ? 0.3 : 1,
                }}
                onPress={() => handleSelectItem(item)}
              >
                <ConnectProductCard
                  name={item.name}
                  price={item.price}
                  category={item.category}
                  seller={item.seller}
                  image_url={item?.images[0]?.url}
                  rating={item?.stats?.averageRating}
                />
                <View
                  className="absolute right-[4px] top-[4px] bg-[#000] w-[25px] h-[25px] rounded-full items-center justify-center"
                  style={{
                    borderWidth: 2,
                    borderColor: "#16783A",
                    backgroundColor: selectedProducts.find(
                      (prod) => prod._id == item._id,
                    )
                      ? "#16783A"
                      : "#f2f2f2",
                  }}
                >
                  {selectedProducts.find((prod) => prod._id == item._id) && (
                    <AntDesign name="check" size={14} color="white" />
                  )}
                </View>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            columnWrapperStyle={{
              // columnGap: ,
              justifyContent: "space-between",
            }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      <View className="absolute bottom-0 self-center w-full flex-row items-center justify-between py-[20px] px-[10px] bg-[#121212]">
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 5,
            flexWrap: "wrap",
          }}
        >
          {selectedProducts.map((product: any, index: number) => (
            <View
              key={index}
              style={{
                marginRight: 4,
                width: 30,
                height: 30,
                backgroundColor: "#111",
              }}
            >
              <Image
                source={{ uri: product?.images[0]?.url }}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 10,
                }}
                contentFit="cover"
              />
              <Pressable
                className="absolute right-[-4px] top-[-4px] bg-[#000] w-[15px] h-[15px] rounded-full items-center justify-center"
                onPress={() => handleSelectItem(product)}
              >
                <Ionicons name="close-sharp" size={8} color="white" />
              </Pressable>
            </View>
          ))}
        </View>
        <TouchableOpacity
          className="rounded-[4px] px-[15px] py-[10px] items-center justify-center bg-[#16783A]"
          onPress={() => handleFinalSubmit()}
          style={{
            marginLeft: "auto",
          }}
        >
          <Text className="text-white text-[10px]">Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: 10,
    // flexGrow: 1,
    justifyContent: "flex-end",
  },
  messageContainer: {
    maxWidth: "80%",
    flex: 1,
    marginVertical: 4,
    marginHorizontal: 17,
    flexDirection: "row",
    alignItems: "flex-end",
  },
  myMessageContainer: {
    alignSelf: "flex-end",
  },
  otherMessageContainer: {
    alignSelf: "flex-start",
  },
  myMessage: {
    backgroundColor: "#F2F2F2",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderTopRightRadius: 12,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 0,
  },
  otherMessage: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderTopRightRadius: 8,
    borderTopLeftRadius: 8,
    borderBottomRightRadius: 8,
    backgroundColor: "rgba(204, 204, 204, 0.25)",
  },
  messageText: {
    fontSize: 15,
    fontFamily: "LexendDeca",
    marginRight: 6,
  },
  otherMessageText: {
    fontSize: 15,
    color: "#fff",
    marginRight: 6,
    fontFamily: "LexendDeca",
  },
  timestamp: {
    fontSize: 10,
    color: "#7C7C7C",
    marginTop: 4,
    alignSelf: "flex-end",
    fontFamily: "LexendDeca",
  },
  emptyList: {
    flex: 1,
    justifyContent: "flex-end",
  },
});

export default MessageRoom;
