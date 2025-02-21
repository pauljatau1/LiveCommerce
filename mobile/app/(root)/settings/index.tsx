import {
  View,
  Text,
  SafeAreaView,
  Dimensions,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import React, { useState } from "react";
import { FocusAwareStatusBar } from "@/components/ui/focus-aware-status-bar";
import Entypo from "@expo/vector-icons/Entypo";
import { Link, router } from "expo-router";
import { ScrollView } from "react-native-gesture-handler";
import { signOut } from "@/store/features/auth/authSlice";
import { useDispatch } from "react-redux";
import BottomSheet from "@/components/global/bottom-sheet";
import DeleteSheet from "@/components/settings/deleteSheet";

const { width, height } = Dimensions.get("window");

const Settings = () => {
  const dispatch = useDispatch();
  const [showDeleteSheet, setShowDeleteSheet] = useState<boolean>(false);

  const handleDelete = () => {
    setShowDeleteSheet(false);
    dispatch(signOut());
    router.push("/(root)/(auth)/sign-in");
  };
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
          Settings
        </Text>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pt-[20px]"
      >
        <View>
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>General</Text>

            <TouchableOpacity
              style={[styles.sectionRow, styles.inactiveRow]}
              activeOpacity={0.5}
            >
              <Text style={styles.sectionText}>Activity Status</Text>
              <Entypo
                name="chevron-right"
                size={18}
                color="rgba(204, 204, 204, 0.8)"
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sectionRow, styles.inactiveRow]}
              activeOpacity={0.5}
            >
              <Text style={styles.sectionText}>Blocked Users</Text>
              <Entypo
                name="chevron-right"
                size={18}
                color="rgba(204, 204, 204, 0.8)"
              />
            </TouchableOpacity>
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Notifications</Text>

            <TouchableOpacity
              style={styles.sectionRow}
              activeOpacity={0.5}
              onPress={() => router.push("/(root)/settings/orderUpdates")}
            >
              <Text style={styles.sectionText}>Order Updates</Text>
              <Entypo
                name="chevron-right"
                size={18}
                color="rgba(204, 204, 204, 0.8)"
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sectionRow}
              activeOpacity={0.5}
              onPress={() => router.push("/(root)/settings/liveStreamAlerts")}
            >
              <Text style={styles.sectionText}>Live Stream Alerts</Text>
              <Entypo
                name="chevron-right"
                size={18}
                color="rgba(204, 204, 204, 0.8)"
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sectionRow}
              activeOpacity={0.5}
              onPress={() => router.push("/(root)/settings/newMessages")}
            >
              <Text style={styles.sectionText}>New Messages</Text>
              <Entypo
                name="chevron-right"
                size={18}
                color="rgba(204, 204, 204, 0.8)"
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sectionRow}
              activeOpacity={0.5}
              onPress={() => router.push("/(root)/settings/communityActivity")}
            >
              <Text style={styles.sectionText}>Community Activity</Text>
              <Entypo
                name="chevron-right"
                size={18}
                color="rgba(204, 204, 204, 0.8)"
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sectionRow}
              activeOpacity={0.5}
              onPress={() => router.push("/(root)/settings/promotionSales")}
            >
              <Text style={styles.sectionText}>Promotions & Sales</Text>
              <Entypo
                name="chevron-right"
                size={18}
                color="rgba(204, 204, 204, 0.8)"
              />
            </TouchableOpacity>
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Data & Permissions</Text>

            <TouchableOpacity style={styles.sectionRow} activeOpacity={0.5}>
              <Link
                href="https://www.auqli.live/privacy-policy"
                style={styles.sectionText}
              >
                Privacy Policy
              </Link>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sectionRow} activeOpacity={0.5}>
              <Link
                href="https://www.auqli.live/terms"
                style={styles.sectionText}
              >
                Terms of Service
              </Link>
            </TouchableOpacity>
          </View>
          <View style={[styles.section, { borderBottomWidth: 0 }]}>
            <Text style={styles.sectionHeader}>Help & Support</Text>

            <TouchableOpacity
              style={[styles.sectionRow, styles.inactiveRow]}
              activeOpacity={0.5}
            >
              <Text style={styles.sectionText}>Chat Support</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sectionRow}
              activeOpacity={0.5}
              onPress={() => {
                dispatch(signOut());
                router.push("/(root)/(auth)/sign-in");
              }}
            >
              <Text style={styles.sectionText}>Logout</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sectionRow}
              activeOpacity={0.5}
              onPress={() => {
                setShowDeleteSheet(true);
              }}
            >
              <Text style={[styles.sectionText, { color: "red" }]}>
                Delete Account
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <BottomSheet
        bgColor="#121212"
        childrenStyle="!px-[11px]"
        showCloseIcon={false}
        title=""
        show={showDeleteSheet}
        titleColor="!text-white"
        snapPoints={["25%"]}
        enableDynamicSizing={false}
        onRequestClose={() => {
          setShowDeleteSheet(false);
        }}
        keyboardBehavior="interactive"
      >
        <DeleteSheet
          closeSheet={() => {
            setShowDeleteSheet(false);
          }}
          handleDelete={handleDelete}
        />
      </BottomSheet>
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
  sectionRow: {
    padding: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionText: {
    fontSize: 13,
    fontFamily: "LexendDeca",
    color: "#ccc",
  },
  inactiveRow: {
    opacity: 0.3,
  },
});

export default Settings;
