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
import { formatDate } from "@/helpers/helpers";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ActivityIndicator } from "react-native-paper";
import { router } from "expo-router";

const Message = () => {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [user, setUser] = useState<any>({});
  const [filter, setFilter] = useState<string>("all");
  const [token, setToken] = useState<string>("");

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
      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL + "api/conversations",
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        },
      );
      setConversations(response.data.conversations);
      setToken(token);
    } catch (e) {
      console.log("unable to get conversations ", e);
    } finally {
      setLoading(false);
    }
  };

  const renderConversations = (item: any) => {
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        className=" mx-[17px] py-[16px] flex-row gap-[12px] items-center relative border-b-[0.5px] border-b-[#888787]"
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
            },
          })
        }
      >
        <View>
          <Image
            source={{ uri: item.participant.avatar }}
            contentFit="cover"
            style={{ width: 40, height: 40, borderRadius: 40 }}
          />
        </View>
        <View className="gap-[5px]">
          <Text className="text-[14px] text-[#ccc] font-LexendDecaMedium">
            {item.participant.name}
          </Text>
          <Text className="text-[13px] text-[#ccc] font-LexendDecaLight">
            {item.lastMessage.messageType == "text"
              ? item.lastMessage.content
              : ""}
          </Text>
        </View>

        <Text className="text-[8px] text-[#ccc] font-LexendDecaLight absolute top-[18px] right-0">
          {formatDate(item.createdAt, "DD MMM")}
        </Text>
      </TouchableOpacity>
    );
  };

  useEffect(() => {
    getUserInfo();
    handleGetConversations();
  }, []);
  return (
    <>
      <FocusAwareStatusBar barStyle="light-content" backgroundColor="#121212" />
      <SafeAreaView className="h-full flex-1 bg-[#121212]">
        <View className="flex-row items-center gap-[12px] px-[17px] pt-[30px] pb-[12px] border-b-[1px] border-b-[#f2f2f2] mb-[12px]">
          <Image
            source={require("../../../assets/icons/animoji.png")}
            contentFit="cover"
            style={{
              width: 40,
              height: 40,
              borderRadius: 40,
            }}
          />
          <View className="gap-[2px]">
            <Text className="text-[18px] text-[#ccc] font-LexendDecaMedium">
              {user?.username || user?.firstName + " " + user?.lastName}
            </Text>
            <Text className="text-[12px] text-[#ccc] font-LexendDecaLight">
              Online
            </Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size={"small"} color="#16783A" />
        ) : conversations.length > 0 ? (
          <>
            <View className="flex-row items-center gap-[8px] mb-[28px] px-[17px]">
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
                  Unread Messages (6)
                </Text>
              </TouchableOpacity>
            </View>
            <View>
              <FlatList
                data={conversations}
                renderItem={({ item }) => renderConversations(item)}
                keyExtractor={(item) => item._id}
                showsVerticalScrollIndicator={false}
              />
            </View>
          </>
        ) : null}

        {!loading && conversations.length < 1 ? <EmptyMessages /> : null}
      </SafeAreaView>
    </>
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
