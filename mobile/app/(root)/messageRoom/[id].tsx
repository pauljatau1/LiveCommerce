import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { router, useGlobalSearchParams } from "expo-router";
import { getToken } from "@/store/features/auth/utils";
import axios from "axios";
import { FocusAwareStatusBar } from "@/components/ui/focus-aware-status-bar";
import { formatDate } from "@/helpers/helpers";
import { ActivityIndicator } from "react-native-paper";
import { Image } from "expo-image";
import Entypo from "@expo/vector-icons/Entypo";
import * as ImagePicker from "expo-image-picker";

import { io } from "socket.io-client";
import { Pressable, TextInput } from "react-native-gesture-handler";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import AntDesign from "@expo/vector-icons/AntDesign";

const MessageRoom = () => {
  const { id, name, avatar, conversationId, userId, token, model } =
    useGlobalSearchParams();
  const socket = io("https://deec-102-216-201-46.ngrok-free.app", {
    transports: ["websocket"],
    auth: {
      token: token,
    },
  });
  socket.connect();
  const [selectedMedia, setSelectedMedia] = useState<any[]>([]);

  const [messages, setMessages] = useState<any[]>([]);
  const [messagesLoading, setMessagesLoading] = useState<boolean>(false);
  const [newMessage, setNewMessage] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const listRef = useRef<FlatList>(null);
  const isInitialLoad = useRef(true);

  const getAllMessages = async () => {
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
    }
  };

  const handleSendMessage = async () => {
    const socketPayload = {
      sender: { id: userId },
      content: newMessage,
      createdAt: new Date().toISOString(),
      error: "",
      conversationId: conversationId,
    };
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

      socket.emit("new_message", { conversationId, message: newMessage });
      console.log("http message sent ", response.data);
    } catch (e) {
      setMessages((prevData) => {
        const newData = [...prevData]; // Copy array to avoid mutation
        const lastIndex = newData
          .map((obj) => obj.senderId)
          .lastIndexOf(userId);

        if (lastIndex !== -1) {
          newData[lastIndex] = {
            ...newData[lastIndex],
            error: "Disnt Send!", // Replace error string
          };
        }

        return newData; // Update state
      });
      console.log("error getting message history ", e);
    }
  };

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
    console.log(token);

    socket.on("connect", () => {
      console.log("Connected to backend");
    });
    socket.emit("join", userId);

    const messageHandler = (newMessage: any) => {
      const messageData = newMessage.message || newMessage;
      //   if (messageData.conversation === conversationId) {
      createdAt: new Date().toISOString(),
        setMessages((prev) => [
          ...prev,
          {
            content: messageData,
            sender: { id },
            userId,
            createdAt: new Date().toISOString(),
          },
        ]);
      //   }
    };

    socket.on("receive_message", messageHandler);

    return () => {
      socket.off("receive_message", messageHandler);
      socket.disconnect();
    };
  }, [id, conversationId, userId]);

  const scrollToBottom = useCallback(() => {
    if (listRef.current && messages.length > 0) {
      // Add a small delay to ensure content is laid out
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
  const keyExtractor = useCallback((item: any) => item._id, []);
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.select({ ios: 0, android: 60 })}
      style={{ flex: 1, backgroundColor: "#121212" }}
    >
      <FocusAwareStatusBar barStyle="light-content" backgroundColor="#121212" />
      <SafeAreaView className="flex-1 ">
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
              <Text className="text-[12px] text-[#ccc] font-LexendDecaLight">
                Online
              </Text>
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
          <>
            <View style={{ flexShrink: 1 }}>
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
                    listRef.current?.scrollToEnd({ animated: false });
                  }
                }}
                showsVerticalScrollIndicator={false}
              />
            </View>
            <View className="flex-row items-center gap-[12px] pt-[12px] pb-[12px] border-t-[0.5px] border-t-[#888787] px-[17px]">
              <View className="flex-row justify-between gap-[4px] px-[12px] py-[8px] rounded-[24px] items-center w-full shrink max-w-[300px] border-[1px] border-[#ccc]">
                <TextInput
                  placeholder="Type a message..."
                  placeholderTextColor={"rgba(204,204,204,0.25)"}
                  className="text-[14px] text-[#f2f2f2] font-LexendDeca w-full shrink p-0"
                  value={newMessage}
                  onChangeText={(text) => setNewMessage(text)}
                />
                <Pressable onPress={handleSendMessage}>
                  <MaterialCommunityIcons
                    name="send-circle"
                    size={30}
                    color="#16783A"
                  />
                </Pressable>
              </View>
              <View className="flex-row items-center gap-[4px]">
                <Pressable>
                  <AntDesign name="link" size={24} color="#f2f2f2" />
                </Pressable>

                {/* <Text className="text-[14px] text-[#fff] font-LexendDeca">
                  Media
                </Text>
                <Text className="text-[14px] text-[#fff] font-LexendDeca">
                  Prod
                </Text> */}
              </View>
            </View>
          </>
        )}
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

    return (
      <View
        style={[
          styles.messageContainer,
          isMyMessage ? styles.myMessage : styles.otherMessage,
        ]}
      >
        {messageType == "text" ? (
          <Text
            style={isMyMessage ? styles.messageText : styles.otherMessageText}
          >
            {message.content}
          </Text>
        ) : (
          <MediaItem item={media} />
        )}

        <Text style={styles.timestamp}>
          {formatDate(message.createdAt, "DD MMM HH:mm")}
        </Text>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: 0,
    flexGrow: 1,
    justifyContent: "flex-end",
    // paddingBottom: 20,
  },
  messageContainer: {
    // maxWidth: "80%",
    flex: 1,
    marginVertical: 4,
    marginHorizontal: 17,
    marginLeft: 27,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderTopRightRadius: 8,
    borderTopLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  myMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#F2F2F2",
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 0,
  },
  otherMessage: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(204, 204, 204, 0.25)",
  },
  messageText: {
    fontSize: 12,
    fontFamily: "LexendDeca",
  },
  otherMessageText: {
    fontSize: 12,
    color: "#fff",
    fontFamily: "LexendDeca",
  },
  timestamp: {
    fontSize: 8,
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
