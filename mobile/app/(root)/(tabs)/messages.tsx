import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import React, { useEffect, useState } from "react";
import { FocusAwareStatusBar } from "@/components/ui/focus-aware-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { getToken, getUser, setUser } from "@/store/features/auth/utils";
import axios from "axios";

import { Image } from "expo-image";
import { formatDate, formatMessageDate } from "@/helpers/helpers";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ActivityIndicator } from "react-native-paper";
import { router } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import BottomSheet from "@/components/global/bottom-sheet";
import AuthSheet from "@/components/auth/authSheet";

const Message = () => {
  const isFocused = useIsFocused();
  const [conversations, setConversations] = useState<any[]>([]);
  const [unreadConvos, setUnreadConvos] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [user, setUser] = useState<any>({});
  const [filter, setFilter] = useState<string>("all");
  const [token, setToken] = useState<string>("");
  const [showAuthSheet, setShowAuthSheet] = useState<boolean>(false);

  const getUserInfo = async () => {
    try {
      const user = await getUser();
      setUser(user);
    } catch (e) {
      console.log("error getting user info");
    }
  };

  const handleGetConversations = async () => {
    try {
      const token = await getToken();
      if (!token) {
        setShowAuthSheet(true);
      }
      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL + "api/conversations",
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        },
      );
      setConversations(response.data.conversations);
      sortUnreadMessages(response.data.conversations);
      setToken(token);
    } catch (e) {
      console.log("unable to get conversations ", e);
    } finally {
      setLoading(false);
    }
  };

  const sortUnreadMessages = (conversations: any) => {
    const unread = conversations.filter((convo: any) => convo.unreadCount > 0);
    setUnreadConvos(unread);
  };

  const renderConversations = (item: any) => {
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        className=" px-[17px] py-[16px] flex-row gap-[12px] items-end justify-between relative border-b-[0.5px] border-b-[#888787]"
        onPress={() =>
          router.push({
            pathname: `../../messageRoom/${item.participant.id}`,
            params: {
              name: item.participant.name,
              avatar: item.participant.avatar,
              conversationId: item._id,
              userId: user._id,
              token: token,
              model: item.participant.model,
              isOnline: item.participant.isOnline ? "online" : "",
              lastActive: item.participant.lastActive,
              isBlocked: item.settings?.isBlocked,
              isMuted: item.settings?.isMuted,
            },
          })
        }
      >
        <View className="flex-row items-center gap-[12px] shrink">
          <View>
            <Image
              source={{ uri: item.participant.avatar }}
              contentFit="cover"
              style={{ width: 40, height: 40, borderRadius: 20 }}
            />
            {item.participant.isOnline && (
              <View
                className=" top-[10px] right-[10px] bg-[#16783A] w-[10px] h-[10px] rounded-[50%]"
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: "#16783A",
                  position: "absolute",
                  top: 0,
                  right: -2,
                }}
              ></View>
            )}
          </View>
          <View className="gap-[5px] shrink">
            <Text className="text-[14px] text-[#ccc] font-LexendDecaMedium">
              {item.participant.name}
            </Text>
            <Text className="text-[13px] text-[#ccc] font-LexendDecaLight shrink">
              {item.lastMessage.messageType == "text"
                ? item.lastMessage.content?.length > 40
                  ? item.lastMessage.content.slice(0, 40) + "..."
                  : item.lastMessage.content
                : "Shared " + item.lastMessage.messageType}
            </Text>
          </View>
        </View>

        {item.unreadCount > 0 && (
          <View className="w-[20px] h-[20px] bg-[#16783A] rounded-full items-center justify-center">
            <Text className="text-white text-[8px] font-LexendDeca">
              {item.unreadCount}
            </Text>
          </View>
        )}

        <Text
          className="text-[12px] text-[#ccc] font-LexendDecaMedium absolute right-[16px]"
          style={{
            top: 10,
            right: 16,
          }}
        >
          {formatMessageDate(item.lastMessage?.createdAt)}
        </Text>
      </TouchableOpacity>
    );
  };

  useEffect(() => {
    if (isFocused) handleGetConversations();
  }, [isFocused]);

  useEffect(() => {
    getUserInfo();
    handleGetConversations();
  }, []);
  return (
    <SafeAreaView className="h-full flex-1 bg-[#121212]">
      <FocusAwareStatusBar barStyle="light-content" backgroundColor="#121212" />
      <View className="flex-row items-center gap-[12px] px-[16px] pt-[20px] pb-[12px] border-b-[1px] border-b-[#f2f2f2] mb-[12px]">
        <View>
          <Image
            source={
              user?.profileImage?.url
                ? { uri: user?.profileImage?.url }
                : require("../../../assets/icons/profile.jpg")
            }
            contentFit="cover"
            style={{
              width: 40,
              height: 40,
              borderRadius: 40,
            }}
          />
          <View
            className=" top-[10px] right-[10px] bg-[#16783A] w-[10px] h-[10px] rounded-[50%]"
            style={{
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: "#16783A",
              position: "absolute",
              top: 0,
              right: -2,
            }}
          ></View>
        </View>

        <View className="gap-[2px]">
          <Text className="text-[18px] text-[#ccc] font-LexendDecaMedium">
            {user?.username ||
              (user?.firstName && user?.firstName + " " + user?.lastName) ||
              ""}
          </Text>
          {user?._id && (
            <Text className="text-[12px] text-[#ccc] font-LexendDecaLight">
              Online
            </Text>
          )}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size={"small"} color="#16783A" />
      ) : conversations?.length > 0 ? (
        <View style={{ flex: 1 }}>
          <View className="flex-row items-center gap-[8px] mb-[16px] px-[16px]">
            <TouchableOpacity
              className={` rounded-[8px] py-[8px] px-[12px] justify-center items-center`}
              style={{
                backgroundColor:
                  filter == "all" ? "#fff" : "rgba(204, 204, 204, 0.25)",
              }}
              onPress={() => setFilter("all")}
            >
              <Text
                className={`${filter == "all" ? "text-[#2F2E41]" : "text-[#f2f2f2]"}  text-[12px] font-LexendDecaMedium`}
              >
                All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={` rounded-[8px] py-[8px] px-[12px] justify-center items-center`}
              style={{
                backgroundColor:
                  filter == "unread" ? "#fff" : "rgba(204, 204, 204, 0.25)",
              }}
              onPress={() => setFilter("unread")}
            >
              <Text
                className={`${filter == "unread" ? "text-[#2F2E41]" : "text-[#f2f2f2]"}  text-[12px] font-LexendDecaMedium`}
              >
                Unread Messages ({unreadConvos?.length || 0})
              </Text>
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1 }}>
            <FlatList
              data={filter == "all" ? conversations : unreadConvos}
              renderItem={({ item }) => renderConversations(item)}
              keyExtractor={(item) => item._id}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      ) : null}

      {!loading && conversations?.length < 1 ? <EmptyMessages /> : null}

      <BottomSheet
        bgColor="#121212"
        childrenStyle="!px-[11px]"
        showCloseIcon={false}
        title=""
        show={showAuthSheet}
        titleColor="!text-white"
        snapPoints={["20%"]}
        enableDynamicSizing={false}
        onRequestClose={() => setShowAuthSheet(false)}
        keyboardBehavior="interactive"
      >
        <AuthSheet closeSheet={() => setShowAuthSheet(false)} />
      </BottomSheet>
    </SafeAreaView>
  );
};

const EmptyMessages = () => {
  return (
    <View
      className="relative justify-center items-center px-[17px]"
      style={StyleSheet.absoluteFillObject}
    >
      <Image
        source={require("../../../assets/images/messages-empty.png")}
        contentFit="contain"
        style={{
          width: 300,
          height: 300,
          marginBottom: 24,
        }}
      />
      <Text className="self-center text-[#ccc] text-[24px] mb-[24px] font-LexendDecaBold">
        Your Message is empty
      </Text>
      <Text className="text-center text-[#ccc] text-[14px] font-LexendDecaLight leading-6">
        Tap the heart button on an item to start saving your favorite products
        here
      </Text>
    </View>
  );
};

export default Message;
