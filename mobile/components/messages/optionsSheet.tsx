import { View, Text, TouchableOpacity, Switch, Alert } from "react-native";
import React, { useEffect, useState } from "react";
import { MaterialIcons, Octicons, SimpleLineIcons } from "@expo/vector-icons";
import { toast } from "@/core/toast";
import { getToken } from "@/store/features/auth/utils";
import axios from "axios";

const ChatSettings = ({
  handleShowReportUser,
  closeSheet,
  sellerId,
  sellerName,
  isBlocked,
  isMuted,
  conversationId,
  updateMessageSettings,
}: any) => {
  const [isUserBlocked, setIsBlocked] = useState<boolean>(isBlocked);
  const [muteNotifications, setMuteNotifications] = useState<boolean>(isMuted);

  const handleBlock = () => {
    if (isUserBlocked) {
      return handleBlockUser();
    }
    Alert.alert(
      `Block ${sellerName}`,
      `Are you sure you want to Block ${sellerName}? `,
      [
        {
          text: "Cancel",
          onPress: () => {
            return;
          },
          style: "cancel",
        },
        { text: "Block", onPress: () => handleBlockUser() },
      ],
    );
  };

  const handleBlockUser = async () => {
    setIsBlocked((previousState) => !previousState);
    try {
      const token = await getToken();
      const config = {
        url:
          process.env.EXPO_PUBLIC_API_URL +
          `api/conversations/${conversationId}/${isUserBlocked ? "unblock" : "block"}`,
        method: "PUT",
        headers: {
          Authorization: "Bearer " + token,
        },
        data: {},
      };
      const response = await axios(config);
      console.log("block response", response.data);
    } catch (e) {
      console.log("error blocking user ", e);
      toast.error("could not block user");
    }
  };

  const handleMuteUser = async () => {
    setMuteNotifications((previousState) => !previousState);
    try {
      const token = await getToken();
      const config = {
        url:
          process.env.EXPO_PUBLIC_API_URL +
          `api/conversations/${conversationId}/${isUserBlocked ? "unmute" : "mute"}`,
        method: "PUT",
        headers: {
          Authorization: "Bearer " + token,
        },
        data: {},
      };
      const response = await axios(config);
      console.log("mute response", response.data);
    } catch (e) {
      console.log("error muting user ", e);
      toast.error("could not mute user");
    }
  };

  useEffect(() => {
    updateMessageSettings({
      isBlocked: isUserBlocked,
      isMuted: muteNotifications,
    });
  }, [isUserBlocked, muteNotifications]);
  return (
    <View className="w-full">
      <View>
        <Text className="text-white text-center mb-[30px] font-LexendDecaSemiBold text-[20px]">
          Chat Settings
        </Text>
      </View>
      <View className="py-[15px] flex-row gap-[20px]  items-center justify-between  border-b-[#ccc] border-b-[0.3px] px-[16px]">
        <Text className="text-[16px] text-[#ccc] font-LexendDecaMedium">
          Mute Notifications
        </Text>
        <Switch
          trackColor={{ false: "#ccc", true: "#fff" }}
          thumbColor={muteNotifications ? "#16783A" : "#fff"}
          ios_backgroundColor="#3e3e3e"
          onValueChange={handleMuteUser}
          value={muteNotifications}
        />
      </View>

      <TouchableOpacity
        className="py-[15px] flex-row gap-[20px]  items-center justify-between  border-b-[#ccc] border-b-[0.3px] px-[16px]"
        onPress={handleShowReportUser}
      >
        <Text className="text-[16px] text-[#ccc] font-LexendDecaMedium">
          Report Chat
        </Text>
        <MaterialIcons name={"keyboard-arrow-right"} size={24} color="#ccc" />
      </TouchableOpacity>
      <TouchableOpacity
        className="py-[15px] flex-row gap-[20px]  items-center justify-between  border-b-[#ccc] border-b-[0.3px] px-[16px]"
        onPress={() => handleBlock()}
      >
        <Text className="text-[16px] text-[#ccc] font-LexendDecaMedium">
          {isUserBlocked ? "unBlock" : "Block"} {sellerName}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default ChatSettings;
