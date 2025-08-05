import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import React, { useEffect, useState } from "react";
import { FocusAwareStatusBar } from "@/components/ui/focus-aware-status-bar";
import Entypo from "@expo/vector-icons/Entypo";
import { Link, router } from "expo-router";
import { ScrollView } from "react-native-gesture-handler";
import { signOut } from "@/store/features/auth/authSlice";
import { Switch } from "react-native-paper";
import { AntDesign, MaterialIcons } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import axios from "axios";
import { toast } from "@/core/toast";
import SafeAreaView from "@/components/global/safeareaview/SafeAreaView";

const NewMessages = () => {
  const token = useSelector((state: RootState) => state.authState.token);
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const toggleSwitch = () => {
    if (loading) {
      return;
    }
    handleUpdateNotification({ fromSellers: !isEnabled });
    setIsEnabled((previousState) => !previousState);
  };

  const handleUpdateNotification = async (notificationObject: any) => {
    setLoading(true);
    try {
      const payload = {
        messages: notificationObject,
      };
      const config = {
        method: "PUT",
        url:
          process.env.EXPO_PUBLIC_API_URL +
          `api/v2/buyers/notification-preferences`,
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        data: { preferences: payload },
      };

      const response = await axios(config);
      console.log("notification update response", response.data);
    } catch (e) {
      console.log("Error updating notification", e);
      toast.error("Error updating notification");
    } finally {
      setLoading(false);
    }
  };

  const handleGetNotification = async () => {
    setLoading(true);
    try {
      const payload = {};
      const config = {
        method: "GET",
        url:
          process.env.EXPO_PUBLIC_API_URL +
          `api/v2/buyers/notification-preferences`,
        headers: {
          Authorization: "Bearer " + token,
        },
        data: null,
      };

      const response = await axios(config);
      setIsEnabled(response.data?.data?.preferences?.messages?.fromSellers);

      console.log("get notification update response", response.data);
    } catch (e) {
      console.log("Error getting notification", e);
      toast.error("Error getting notification");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleGetNotification();
  }, []);
  return (
    <SafeAreaView className="h-full flex-1 bg-[#121212] ">
      <FocusAwareStatusBar barStyle="light-content" backgroundColor="#121212" />
      <View className="flex flex-row items-center justify-center gap-[10px] px-[16px] py-[20px]">
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

        <Text className="text-white font-LexendDecaMedium text-[20px]">
          Notification Settings
        </Text>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pt-[10px]"
      >
        <View className="w-[60px] h-[60px] rounded-[30px] bg-[#94A3B1] justify-center items-center mb-[24px] mx-[16px]">
          <MaterialIcons name="message" size={24} color="white" />
        </View>
        <View>
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>New Messages</Text>
            <Text style={styles.sectionSubHeader}>
              Manage who can message you and get notified about new
              conversations.
            </Text>

            <View style={styles.sectionRow}>
              <View style={styles.sectionRowLeft}>
                <AntDesign name="message1" size={20} color="white" />
                <Text style={styles.sectionText}>Messages from sellers</Text>
              </View>

              <Switch
                trackColor={{ false: "#ccc", true: "#fff" }}
                thumbColor={isEnabled ? "#16783A" : "#fff"}
                ios_backgroundColor="#3e3e3e"
                onValueChange={toggleSwitch}
                value={isEnabled}
                style={styles.switch}
              />
            </View>
            {/* <View style={styles.sectionRow}>
              <Text style={styles.sectionText}>
                Messages from buyers (if selling)
              </Text>
              <Switch
                trackColor={{ false: "#ccc", true: "#fff" }}
                thumbColor={isEnabledShipping ? "#16783A" : "#fff"}
                ios_backgroundColor="#3e3e3e"
                onValueChange={toggleSwitchShipping}
                value={isEnabledShipping}
                style={styles.switch}
              />
            </View>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionText}>Chat Replies & mentions</Text>
              <Switch
                trackColor={{ false: "#ccc", true: "#fff" }}
                thumbColor={isEnabledRefund ? "#16783A" : "#fff"}
                ios_backgroundColor="#3e3e3e"
                onValueChange={toggleSwitchRefund}
                value={isEnabledRefund}
                style={styles.switch}
              />
            </View> */}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  section: {
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(204, 204, 204, 0.60)",
    marginBottom: 14,
  },
  sectionHeader: {
    marginBottom: 10,
    paddingLeft: 16,
    fontSize: 18,
    fontFamily: "LexendDeca-Medium",
    color: "#ccc",
  },
  sectionSubHeader: {
    marginBottom: 10,
    paddingLeft: 16,
    fontSize: 12,
    fontFamily: "LexendDeca-Light",
    color: "#ccc",
    lineHeight: 16,
  },

  sectionRow: {
    padding: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    flexShrink: 1,
  },
  sectionText: {
    fontSize: 13,
    fontFamily: "LexendDeca",
    color: "#ccc",
  },
  inactiveRow: {
    opacity: 0.3,
  },
  switch: {},
});

export default NewMessages;
