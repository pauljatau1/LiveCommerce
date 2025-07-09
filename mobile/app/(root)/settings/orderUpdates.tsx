import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import React, { useEffect, useState } from "react";
import { FocusAwareStatusBar } from "@/components/ui/focus-aware-status-bar";
import Entypo from "@expo/vector-icons/Entypo";
import { Link, router } from "expo-router";
import { ScrollView } from "react-native-gesture-handler";
import { signOut } from "@/store/features/auth/authSlice";
import { Switch } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { toast } from "@/core/toast";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import axios from "axios";
import SafeAreaView from "@/components/global/safeareaview/SafeAreaView";

const OrderUpdates = () => {
  const token = useSelector((state: RootState) => state.authState.token);
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const [isEnabledShipping, setIsEnabledShipping] = useState<boolean>(false);
  const [isEnabledRefund, setIsEnabledRefund] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const toggleSwitch = () => {
    if (loading) {
      return;
    }
    handleUpdateNotification({ orderConfirmation: !isEnabled });
    setIsEnabled((previousState) => !previousState);
  };
  const toggleSwitchShipping = () => {
    if (loading) {
      return;
    }
    handleUpdateNotification({ shippingAndDelivery: !isEnabledShipping });
    setIsEnabledShipping((previousState) => !previousState);
  };
  const toggleSwitchRefund = () => {
    if (loading) {
      return;
    }
    handleUpdateNotification({
      orderCancellation: !isEnabledRefund,
      refundUpdates: !isEnabledRefund,
    });
    setIsEnabledRefund((previousState) => !previousState);
  };

  const handleUpdateNotification = async (notificationObject: any) => {
    setLoading(true);
    try {
      const payload = {
        orderUpdates: notificationObject,
      };
      const config = {
        method: "PUT",
        url:
          process.env.EXPO_PUBLIC_API_URL +
          `api/buyer/notification-preferences`,
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
          `api/buyer/notification-preferences`,
        headers: {
          Authorization: "Bearer " + token,
        },
        data: null,
      };

      const response = await axios(config);
      setIsEnabled(response.data?.preferences?.orderUpdates?.orderConfirmation);
      setIsEnabledShipping(
        response.data?.preferences?.orderUpdates?.shippingAndDelivery,
      );
      setIsEnabledRefund(
        response.data?.preferences?.orderUpdates?.orderCancellation,
      );
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
        <View>
          <View style={styles.section}>
            <View className="w-[60px] h-[60px] rounded-[30px] bg-[#94A3B1] justify-center items-center mb-[24px] mx-[16px]">
              <MaterialCommunityIcons
                name="package-variant-closed"
                size={24}
                color="white"
              />
            </View>
            <Text style={styles.sectionHeader}>Order Updates</Text>
            <Text style={styles.sectionSubHeader}>
              Stay updated on your orders from confirmation to delivery.
            </Text>

            <View style={styles.sectionRow}>
              <View style={styles.sectionRowLeft}>
                <MaterialCommunityIcons
                  name="calendar-check-outline"
                  size={20}
                  color="white"
                />
                <Text style={styles.sectionText}>Order confirmation</Text>
              </View>

              <Switch
                trackColor={{ false: "#ccc", true: "#fff" }}
                thumbColor={isEnabled ? "#16783A" : "#fff"}
                ios_backgroundColor="#3e3e3e"
                onValueChange={toggleSwitch}
                value={isEnabled}
                style={[styles.switch, { opacity: loading ? 0.5 : 1 }]}
              />
            </View>
            <View style={styles.sectionRow}>
              <View style={styles.sectionRowLeft}>
                <MaterialCommunityIcons
                  name="truck-fast-outline"
                  size={20}
                  color="white"
                />
                <Text style={styles.sectionText}>
                  Shipping and delivery update
                </Text>
              </View>

              <Switch
                trackColor={{ false: "#ccc", true: "#fff" }}
                thumbColor={isEnabledShipping ? "#16783A" : "#fff"}
                ios_backgroundColor="#3e3e3e"
                onValueChange={toggleSwitchShipping}
                value={isEnabledShipping}
                style={[styles.switch, { opacity: loading ? 0.5 : 1 }]}
              />
            </View>
            <View style={styles.sectionRow}>
              <View style={styles.sectionRowLeft}>
                <MaterialCommunityIcons
                  name="book-cancel-outline"
                  size={20}
                  color="white"
                />
                <Text style={styles.sectionText}>
                  Order Cancellation and Refund
                </Text>
              </View>
              <Switch
                trackColor={{ false: "#ccc", true: "#fff" }}
                thumbColor={isEnabledRefund ? "#16783A" : "#fff"}
                ios_backgroundColor="#3e3e3e"
                onValueChange={toggleSwitchRefund}
                value={isEnabledRefund}
                style={[styles.switch, { opacity: loading ? 0.5 : 1 }]}
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

export default OrderUpdates;
