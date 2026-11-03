import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import React, { useState } from "react";
import { FocusAwareStatusBar } from "@/components/ui/focus-aware-status-bar";
import Entypo from "@expo/vector-icons/Entypo";
import { Link, router } from "expo-router";
import { ScrollView } from "react-native-gesture-handler";
import { signOut } from "@/store/features/auth/authSlice";
import { Switch } from "react-native-paper";
import SafeAreaView from "@/components/global/safeareaview/SafeAreaView";

const CommunityActivity = () => {
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const [isEnabledShipping, setIsEnabledShipping] = useState<boolean>(false);
  const [isEnabledRefund, setIsEnabledRefund] = useState<boolean>(false);
  const toggleSwitch = () => setIsEnabled((previousState) => !previousState);
  const toggleSwitchShipping = () =>
    setIsEnabledShipping((previousState) => !previousState);
  const toggleSwitchRefund = () =>
    setIsEnabledRefund((previousState) => !previousState);
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
        contentContainerClassName="pt-[20px]"
      >
        <View>
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Community Activity</Text>
            <Text style={styles.sectionSubHeader}>
              Select which livestreams you receive notifications for. You may
              still receive occasional recommendations from Auqli
            </Text>

            <View style={styles.sectionRow}>
              <View style={styles.sectionRowLeft}>
                <Text style={styles.sectionText}>Comments on my posts</Text>
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
            <View style={styles.sectionRow}>
              <Text style={styles.sectionText}>Likes on my posts</Text>
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
              <Text style={styles.sectionText}>Replies & Mentions</Text>
              <Switch
                trackColor={{ false: "#ccc", true: "#fff" }}
                thumbColor={isEnabledRefund ? "#16783A" : "#fff"}
                ios_backgroundColor="#3e3e3e"
                onValueChange={toggleSwitchRefund}
                value={isEnabledRefund}
                style={styles.switch}
              />
            </View>
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
    fontSize: 16,
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

export default CommunityActivity;
