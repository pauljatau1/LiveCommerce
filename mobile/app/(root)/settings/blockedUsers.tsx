import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  Pressable,
} from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import { FocusAwareStatusBar } from "@/components/ui/focus-aware-status-bar";
import { Entypo } from "@expo/vector-icons";
import { router } from "expo-router";
import axios from "axios";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { Image } from "expo-image";
import { ActivityIndicator } from "react-native-paper";
import { icons } from "@/constants";

const BlockedUsers = () => {
  const token = useSelector((state: RootState) => state.authState.token);

  const [loading, setLoading] = useState<boolean>(true);
  const [blocking, setBlocking] = useState<string>("");
  const [users, setUsers] = useState<any[]>([]);

  const getBlockedUsers = async () => {
    try {
      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL + "api/conversations/blocked-users",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setUsers(response.data?.blockedUsers);
    } catch (e) {
      console.log("error fetching blocked users ", e);
    } finally {
      setLoading(false);
    }
  };

  const blockUser = async (userId: string, conversationId: string) => {
    setBlocking(userId);
    try {
      const response = await axios.put(
        process.env.EXPO_PUBLIC_API_URL +
          `api/conversations/${conversationId}/unblock`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setUsers(users?.filter((user: any) => user.id !== userId));
    } catch (e) {
      console.log("error unblocking user ", e);
    } finally {
      setBlocking("");
    }
  };

  const renderBlockedUsers = useCallback(
    ({ item }: any) => {
      return (
        <View className="flex-row items-center justify-between">
          <View className="flex-row gap-[8px] items-center">
            <Image
              source={{ uri: item?.profileImage }}
              style={{
                width: 35,
                height: 35,
                borderRadius: 35 / 2,
              }}
            />
            <Text className="text-white text-[14px] font-LexendDeca">
              {item?.name}
            </Text>
          </View>
          <Pressable
            className="rounded-[5px] bg-[#16783A] items-center justify-center w-[100px] h-[25px]"
            onPress={() => blockUser(item?.id, item?.conversationId)}
          >
            {blocking == item?.id ? (
              <ActivityIndicator size={8} color="white" />
            ) : (
              <Text className="text-[9px] text-white font-LexendDeca">
                unblock
              </Text>
            )}
          </Pressable>
        </View>
      );
    },
    [users, blocking],
  );

  const renderEmptyComponent = useCallback(() => {
    return (
      <View
        style={{
          paddingHorizontal: 16,
          alignItems: "center",
        }}
      >
        <View
          style={{
            marginVertical: 24,
            padding: 24,
            paddingHorizontal: 48,
            alignItems: "center",
            // backgroundColor: "#000",
            borderRadius: 8,
            flexShrink: 1,
            paddingBottom: 40,
          }}
        >
          <View
            style={{
              width: 102,
              height: 102,
              borderRadius: "50%",
              backgroundColor: "#DDF9E7",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 32,
            }}
          >
            <Image
              source={icons.sadEmoji}
              contentFit="contain"
              style={{
                width: 40,
                height: 40,
              }}
            />
          </View>

          <Text
            className="mb-[10px] text-center text-[16px] font-LexendDecaSemiBold text-white"
            style={{
              lineHeight: 22,
            }}
          >
            No Blocked Users!
          </Text>
          <Text
            className="font-LexendDeca text-[14px] text-[#8F9099] text-center"
            style={{
              lineHeight: 22,
            }}
          >
            If you have any blocked users, they will appear here.
          </Text>
        </View>
      </View>
    );
  }, [users]);

  useEffect(() => {
    getBlockedUsers();
  }, []);

  return (
    <SafeAreaView className="h-full flex-1 bg-[#121212] ">
      <FocusAwareStatusBar barStyle="light-content" backgroundColor="#121212" />
      <View className="w-full flex-row items-center justify-center gap-[10px]  px-[12px] py-[20px]">
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

        <Text className="text-white font-LexendDecaMedium text-[20px] self-center">
          Blocked Users
        </Text>
      </View>
      <View className="px-[16px]">
        <Text
          style={{
            marginTop: 12,
            marginBottom: 50,
            fontSize: 12,
            fontFamily: "LexendDeca-Light",
            color: "#ccc",
            lineHeight: 16,
            textAlign: "center",
          }}
        >
          This is a list of blocked users who can’t interact with you. You can
          unblock any at your convenience
        </Text>
      </View>

      <View>
        {loading ? (
          <ActivityIndicator size={"small"} color="white" />
        ) : (
          <FlatList
            data={users}
            renderItem={renderBlockedUsers}
            keyExtractor={(item) => item?.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              gap: 30,
              paddingHorizontal: 16,
            }}
            ListEmptyComponent={renderEmptyComponent}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

export default BlockedUsers;
