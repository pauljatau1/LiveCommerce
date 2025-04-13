import {
  View,
  Text,
  SafeAreaView,
  Dimensions,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import { FocusAwareStatusBar } from "@/components/ui/focus-aware-status-bar";
import Entypo from "@expo/vector-icons/Entypo";
import { Link, router } from "expo-router";
import { FlatList, ScrollView } from "react-native-gesture-handler";
import { signOut } from "@/store/features/auth/authSlice";
import { useDispatch } from "react-redux";
import BottomSheet from "@/components/global/bottom-sheet";
import DeleteSheet from "@/components/settings/deleteSheet";
import { Image } from "expo-image";
import { icons } from "@/constants";
import { getToken } from "@/store/features/auth/utils";
import axios from "axios";
import { formatDate, formatMessageDate } from "@/helpers/helpers";
import { ActivityIndicator } from "react-native-paper";
import NotificationSheet from "@/components/notifications/notificationSheet";
import LottieView from "lottie-react-native";
import { Feather, Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");
const tabs = ["All", "Orders", "Posts", "From Auqli"];

const Notifications = () => {
  const dispatch = useDispatch();
  const [showDeleteSheet, setShowDeleteSheet] = useState<boolean>(false);
  const [data, setData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [page, setPage] = useState<number>(1);
  const [tab, setTab] = useState<string>("All");
  const [hasReachedEnd, setHasReachedEnd] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [activeNoti, setActiveNoti] = useState<any>();
  const [showSheet, setShowSheet] = useState<boolean>(false);

  const handleGetNotifications = useCallback(async () => {
    if (isFetching || hasReachedEnd) {
      return;
    }

    if (page == 1) {
      setIsLoading(true);
    } else {
      setIsFetching(true);
    }

    try {
      const token = await getToken();

      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL +
          (tab?.toLowerCase() == "from auqli"
            ? "api/public/announcements"
            : `api/notifications/buyer?page=${page}&limit=10&filter=${tab?.toLowerCase()}`),
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        },
      );
      const notifications = response.data.notifications || response.data;

      if (
        response.data.currentPage === response.data.totalPages ||
        response.data.totalPages < 1
      ) {
        setHasReachedEnd(true);
      }
      if (page == 1) {
        setFilteredData(notifications);
        handleMarkAllRead();
      } else {
        setFilteredData((prevData) => {
          return [...prevData, ...notifications];
        });
      }
    } catch (error) {
      console.error("Error fetching more notifications:", error);
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  }, [page, tab]);

  const handleMarkAllRead = async () => {
    try {
      const token = await getToken();

      const response = await axios.put(
        process.env.EXPO_PUBLIC_API_URL +
          `api/notifications/buyer/mark-all-read`,
        {},
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        },
      );
      console.log("marking read ", response.data);
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };

  const handleFilterData = (tabVal: string) => {
    setPage(1);
    setHasReachedEnd(false);
    setTab(tabVal);
  };

  const handleClickNotification = (item: any) => {
    if (item?.data?.orderId) {
      return router.push(`/orders/${item?.data?.orderId}`);
    }
    setActiveNoti(item);
    setShowSheet(true);
  };

  const renderNotification = useCallback(
    ({ item }: { item: any }) => {
      return (
        <TouchableOpacity
          style={styles.section}
          activeOpacity={0.7}
          onPress={() => {
            handleClickNotification(item);
          }}
        >
          <View style={styles.notiImage}>
            {item.type === "order_placed" ? (
              <Feather name="box" size={24} color="#fff" />
            ) : item?.description ? (
              <Image
                source={require("../../../assets/icons/auqli-logo.png")}
                contentFit="contain"
                style={{ width: 24, height: 24 }}
              />
            ) : (
              <Ionicons name="notifications" size={24} color="#fff" />
            )}
          </View>
          <View className="shrink w-full">
            <View style={styles.sectionHeaderContainer}>
              <Text style={styles.sectionHeader}>{item?.title}</Text>
              {!item?.isRead && item?.message ? (
                <View style={styles.unread}></View>
              ) : null}
            </View>

            <View style={styles.sectionRow}>
              <Text style={styles.sectionText} numberOfLines={2}>
                {item?.message || item?.description}
              </Text>
              <Text style={styles.date}>
                {formatMessageDate(item?.createdAt)}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [filteredData, page],
  );

  const renderListHeader = useCallback(() => {
    return (
      <View style={styles.tabs}>
        {tabs.map((tabLabel, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.tab, tabLabel == tab ? styles.activeTab : null]}
            onPress={() =>
              handleFilterData(tabLabel == "Community" ? "posts" : tabLabel)
            }
          >
            <Text
              style={[
                styles.tabText,
                tabLabel == tab ? styles.activeTabText : null,
              ]}
            >
              {tabLabel}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }, [tab]);

  const renderEmptyComponent = useCallback(() => {
    return (
      <View style={[styles.emptyComponent]}>
        <View style={styles.emptyWrapper}>
          <View style={styles.emptyImageContainer}>
            <Image
              source={icons.waving}
              contentFit="contain"
              style={{
                width: 56,
                height: 56,
                borderRadius: 56,
                backgroundColor: "#E4ECF7",
              }}
            />
          </View>

          <Text style={styles.emptyText}>You have no notifications!</Text>
          <Text style={styles.emptySubText}>
            if you will get any notifications we will tell you about it
          </Text>
        </View>
      </View>
    );
  }, [filteredData]);

  const renderListFooter = useCallback(() => {
    if (isFetching && !hasReachedEnd) {
      return (
        <View
          style={{
            width: "100%",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <LottieView
            source={require("../../../assets/lottie/dots-loading.json")}
            autoPlay
            loop
            style={{
              width: 70,
              height: 30,
            }}
          />
        </View>
      );
    } else {
      return null;
    }
  }, [isFetching, hasReachedEnd]);

  const fetchMoreNotifications = () => {
    if (!isFetching && !hasReachedEnd) {
      setPage((prevPage) => prevPage + 1);
    }
  };

  useEffect(() => {
    if (isFetching) {
      return;
    }
    handleGetNotifications();
  }, [page, tab]);

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
          Notifications
        </Text>
      </View>

      <View style={{ flex: 1 }}>
        {isLoading ? (
          <ActivityIndicator size={"small"} color="white" />
        ) : (
          <FlatList
            data={filteredData}
            keyExtractor={(item, index) => index.toString()}
            renderItem={renderNotification}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={renderListHeader}
            ListEmptyComponent={renderEmptyComponent}
            onEndReachedThreshold={0.5}
            onEndReached={fetchMoreNotifications}
            contentContainerStyle={{}}
            ListFooterComponent={renderListFooter}
          />
        )}
      </View>

      <BottomSheet
        bgColor="#121212"
        childrenStyle="!px-[11px]"
        showCloseIcon={false}
        show={showSheet}
        titleColor="!text-white"
        enableDynamicSizing={true}
        onRequestClose={() => {
          setShowSheet(false);
        }}
        keyboardBehavior="interactive"
      >
        <NotificationSheet data={activeNoti} />
      </BottomSheet>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  section: {
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(204, 204, 204, 0.60)",
    marginBottom: 14,
    flexDirection: "row",
    // alignItems: "center",
    gap: 16,
    paddingHorizontal: 16,
  },
  sectionHeaderContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexShrink: 1,
    width: "100%",
  },
  notiImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(54, 54, 54, 0.69)",
  },
  sectionHeader: {
    fontSize: 16,
    fontFamily: "LexendDeca-Medium",
    color: "#fff",
  },
  unread: {
    width: 8,
    height: 8,
    borderRadius: 8,
    backgroundColor: "#16783A",
  },
  sectionRow: {
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 16,
  },
  sectionText: {
    fontSize: 13,
    fontFamily: "LexendDeca-Light",
    color: "rgba(255, 255, 255, 0.50)",
    flexShrink: 1,
  },
  inactiveRow: {
    opacity: 0.3,
  },
  tabs: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: 25,
    paddingHorizontal: 16,
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 6,
    backgroundColor: "rgba(204, 204, 204, 0.25)",
  },
  activeTab: {
    backgroundColor: "#fff",
  },
  tabText: {
    fontSize: 10,
    fontFamily: "LexendDeca",
    color: "#ccc",
  },
  activeTabText: {
    color: "#2F2E41",
  },
  emptyComponent: {
    // position: "absolute",
    // left: 0,
    // right: 0,
    // top: 0,
    // bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    marginTop: height / 2 - 300,
  },
  emptyWrapper: {
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: "LexendDeca-Medium",
    color: "#fff",
    textAlign: "center",
  },
  emptySubText: {
    fontSize: 14,
    fontFamily: "LexendDeca",
    color: "#ccc",
    textAlign: "center",
  },
  emptyImageContainer: {
    width: 124,
    height: 124,
    borderRadius: "50%",
    backgroundColor: "#E4ECF7",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
  },
  date: {
    fontSize: 12,
    fontFamily: "LexendDeca",
    color: "#ccc",
  },
});

export default Notifications;
