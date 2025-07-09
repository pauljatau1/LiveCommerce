import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import React, { useEffect, useState } from "react";
import { FocusAwareStatusBar } from "@/components/ui/focus-aware-status-bar";
import Entypo from "@expo/vector-icons/Entypo";
import { Link, router } from "expo-router";
import { ScrollView } from "react-native-gesture-handler";
import { signOut } from "@/store/features/auth/authSlice";
import { Switch } from "react-native-paper";
import { RootState } from "@/store";
import { useSelector } from "react-redux";
import axios from "axios";
import { toast } from "@/core/toast";
import SafeAreaView from "@/components/global/safeareaview/SafeAreaView";

const PromotionSales = () => {
  const token = useSelector((state: RootState) => state.authState.token);
  const [flashSales, setFlashSales] = useState<boolean>(false);
  const [couponsAndDeals, setCouponsAndDeals] = useState<boolean>(false);
  const [trendingProducts, setTrendingProducts] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const toggleSwitch = () => {
    if (loading) {
      return;
    }
    handleUpdateNotification({ flashSales: !flashSales });
    setFlashSales((previousState) => !previousState);
  };
  const toggleCouponsAndDeals = () => {
    if (loading) {
      return;
    }
    handleUpdateNotification({ couponsAndDeals: !couponsAndDeals });
    setCouponsAndDeals((previousState) => !previousState);
  };
  const toggleTrendingProducts = () => {
    if (loading) {
      return;
    }
    handleUpdateNotification({
      trendingProducts: !trendingProducts,
      recommendations: !trendingProducts,
    });
    setTrendingProducts((previousState) => !previousState);
  };

  const handleUpdateNotification = async (notificationObject: any) => {
    setLoading(true);
    try {
      const payload = {
        promotionsAndSales: notificationObject,
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
      setFlashSales(response.data?.preferences?.promotionsAndSales?.flashSales);
      setCouponsAndDeals(
        response.data?.preferences?.promotionsAndSales?.couponsAndDeals,
      );
      setTrendingProducts(
        response.data?.preferences?.promotionsAndSales?.trendingProducts,
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
          className="absolute left-[12px] pr-[8px]"
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
              <Entypo name="sound" size={24} color="white" />
            </View>
            <Text style={styles.sectionHeader}>Promotion & Sales</Text>
            <Text style={styles.sectionSubHeader}>
              Be the first to know about discounts, exclusive deals, and flash
              sales.
            </Text>

            <View style={styles.sectionRow}>
              <View style={styles.sectionRowLeft}>
                <Text style={styles.sectionText}>Flash sales & Discounts</Text>
              </View>

              <Switch
                trackColor={{ false: "#ccc", true: "#fff" }}
                thumbColor={flashSales ? "#16783A" : "#fff"}
                ios_backgroundColor="#3e3e3e"
                onValueChange={toggleSwitch}
                value={flashSales}
                style={styles.switch}
              />
            </View>
            <View style={styles.sectionRow}>
              <View style={styles.sectionRowLeft}>
                <Text style={styles.sectionText}>
                  Coupons & Exclusive deals
                </Text>
              </View>
              <Switch
                trackColor={{ false: "#ccc", true: "#fff" }}
                thumbColor={couponsAndDeals ? "#16783A" : "#fff"}
                ios_backgroundColor="#3e3e3e"
                onValueChange={toggleCouponsAndDeals}
                value={couponsAndDeals}
                style={styles.switch}
              />
            </View>
            <View style={styles.sectionRow}>
              <View style={styles.sectionRowLeft}>
                <Text style={styles.sectionText}>
                  Trending products & Recommendations
                </Text>
              </View>

              <Switch
                trackColor={{ false: "#ccc", true: "#fff" }}
                thumbColor={trendingProducts ? "#16783A" : "#fff"}
                ios_backgroundColor="#3e3e3e"
                onValueChange={toggleTrendingProducts}
                value={trendingProducts}
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

export default PromotionSales;
