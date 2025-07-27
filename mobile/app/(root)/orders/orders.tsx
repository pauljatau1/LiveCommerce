import {
  View,
  Text,
  Dimensions,
  TouchableOpacity,
  Image,
  Pressable,
  ScrollViewComponent,
  FlatList,
} from "react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { FocusAwareStatusBar } from "@/components/ui/focus-aware-status-bar";
import Entypo from "@expo/vector-icons/Entypo";
import { router } from "expo-router";
import { ScrollView } from "react-native-gesture-handler";
import { getToken } from "@/store/features/auth/utils";
import axios from "axios";
import { useIsFocused } from "@react-navigation/native";
import { formatDate } from "@/helpers/helpers";
import AsyncStorage from "@react-native-async-storage/async-storage";
import OrderItem from "@/components/orders/mainOrderItem";
import { ActivityIndicator } from "react-native-paper";
import LottieView from "lottie-react-native";
import SafeAreaView from "@/components/global/safeareaview/SafeAreaView";

const { width, height } = Dimensions.get("window");

const tabs = [
  "All",
  "Pending",
  "Picked-Up",
  "Dispatched",
  "Delivered",
  "Cancelled",
  "My Returns",
];

// const tabs = [
//   "All",
//   "Processing",
//   "Shipped",
//   "Delivered",
//   "Cancelled",
//   "Failed",
//   "My Returns",
// ];
const statusColor = {
  pending: { name: "Processing", color: "#FFF8DE" },
  pickup_arranged: { name: "In Transit", color: "rgb(219 234 254)" },
  delivered: { name: "Delivered", color: "#DEFFEE" },
  cancelled: { name: "cancelled", color: "rgba(238, 87, 28, 0.85)" },
  refunded: { name: "cancelled", color: "rgba(238, 87, 28, 0.85)" },
} as any;

const Orders = () => {
  const scrollViewRef = useRef<ScrollView>(null);
  const isFocused = useIsFocused();
  const [selectedTab, setSelectedTab] = useState<string>(tabs[0]);
  const [ordersLoading, setOrdersLoading] = useState<boolean>(true);
  const [ordersFetching, setOrdersFetching] = useState<boolean>(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [token, setToken] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [hasReachedEnd, setHasReachedEnd] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const handleTabSelection = (selection: string) => {
    const actualSelection = {
      processing: "pending",
      "in transit": "pickup_arranged",
      delivered: "delivered",
    } as any;
    setPage(1);
    setHasReachedEnd(false);
    setSelectedTab(selection);

    // if (selection.toLowerCase() == "all") {
    //   return setOrders(allOrders);
    // }

    // if (selection.toLowerCase() == "my returns") {
    //   return setOrders(
    //     allOrders.filter(
    //       (order) =>
    //         ["returned", "cancelled"].includes(
    //           order.shipping.tracking.status,
    //         ) || order?.orderStatus?.hasReturn,
    //     ),
    //   );
    // }
    // setOrders(
    //   allOrders.filter(
    //     (order) =>
    //       order.shipping.tracking.status ==
    //         actualSelection[selection.toLowerCase()] &&
    //       !order?.orderStatus?.hasReturn,
    //   ),
    // );
  };

  const handleGetOrders = async () => {
    if (page == 1) {
      setOrdersLoading(true);
    } else {
      setOrdersFetching(true);
    }
    try {
      const token = await getToken();
      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL +
          `api/v2/buyers/orders?page=${page}&limit=${selectedTab == "My Returns" ? 100 : 10}&trackingStatus=${selectedTab}&hasReturn=${selectedTab == "My Returns"}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      // setSelectedTab("All");
      // setAllOrders(response.data.orders);
      if (page == 1) {
        setOrders(response.data.data);
      } else {
        setOrders([...orders || [], ...response.data.data]);
      }

      if (response.data?.data?.length < 1) {
        setHasReachedEnd(true);
      }
    } catch (e) {
      console.log("failed to retrieve orders ", e);
    } finally {
      setOrdersLoading(false);
      setOrdersFetching(false);
      setRefreshing(false);
    }
  };

  const fetchMoreOrders = () => {
    console.log("fetching here ,", { ordersFetching, hasReachedEnd });

    if (!ordersFetching && !hasReachedEnd) {
      setPage((prevPage) => prevPage + 1);
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
      console.log("unable to get conversations in product details page", e);
    }
  };

  const refreshOrders = () => {
    setRefreshing(true);
    if (page == 1) {
      return handleGetOrders();
    }
    setPage(1);
    setHasReachedEnd(false);
  };

  useEffect(() => {
    handleGetOrders();
  }, [selectedTab, page]);

  useEffect(() => {
    if (isFocused) {
      handleGetConversations();
    }
  }, [isFocused]);

  useEffect(() => {
    scrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: false });
  }, [selectedTab]);

  const renderOrderItems = useCallback(
    ({ item: orderItem }: any) => {
      return (
        <View>
          {orderItem?.shipping?.tracking?.status == "delivered" && (
            <View
              style={{
                flexDirection: "row",
                borderRadius: 16,
                paddingHorizontal: 16,
                marginHorizontal: 16,
                paddingVertical: 18,
                gap: 10,
                backgroundColor: "rgba(41,41,41,0.8)",
              }}
            >
              <Image
                source={require("../../../assets/icons/delivery-icon.png")}
                resizeMode="contain"
                style={{
                  width: 24,
                  height: 24,
                  marginTop: 6,
                }}
              />
              <View className="shrink">
                <Text className="text-[#ccc] text-[11px] font-LexendDecaMedium leading-[20px]">
                  {formatDate(
                    orderItem.shipping?.tracking?.history[2]?.timestamp,
                    "MMM DD",
                  )}{" "}
                  - Package has been delivered. Please pickup and enjoy your
                  order
                </Text>
                <Text className="text-[#ccc] opacity-70 text-[8px] font-LexendDecaLight leading-[20px]">
                  You can request for refund / return of product
                </Text>
              </View>
            </View>
          )}

          <OrderItem
            orderItem={orderItem}
            conversations={conversations}
            token={token}
          />
        </View>
      );
    },
    [page, orders],
  );

  const renderListFooter = useCallback(() => {
    if (ordersFetching && !hasReachedEnd) {
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
  }, [ordersFetching, hasReachedEnd]);

  return (
    <SafeAreaView className="flex-1 bg-[#121212] ">
      <FocusAwareStatusBar barStyle="light-content" backgroundColor="#121212" />

      <View>
        <View className="flex flex-row items-center justify-center gap-[10px] px-[12px] py-[17px] mb-[8px] mt-4 relative">
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

          <Text className="text-white font-LexendDecaMedium text-[24px]">
            My Orders
          </Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="flex-row items-center justify-between px-[16px]"
          style={{
            borderBottomColor: "rgba(204, 204, 204, 0.25)",
            borderBottomWidth: 0.5,
          }}
        >
          {tabs.map((tab, index) => (
            <TouchableOpacity
              onPress={() => handleTabSelection(tab)}
              className={`py-[4px] pb-[16px] mr-[16px] ${selectedTab == tab ? "border-b-[1px] border-b-white" : ""}`}
              key={index}
            >
              <Text
                className={` font-LexendDecaMedium text-[12px] ${selectedTab == tab ? "text-white" : "text-[#94A3B1]"}`}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      {ordersLoading ? (
        <ActivityIndicator size={"small"} color={"#fff"} className="m-[20px]" />
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrderItems}
          // nestedScrollEnabled={true}
          keyExtractor={(item, index) => item?._id || index?.toString()}
          contentContainerStyle={{
            paddingVertical: 20,
            gap: 20,
          }}
          onEndReached={fetchMoreOrders}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={EmptyOrders}
          ListFooterComponent={renderListFooter}
          refreshing={refreshing}
          onRefresh={refreshOrders}
        />
      )}
    </SafeAreaView>
  );
};

const EmptyOrders = () => {
  return (
    <View className="relative justify-center items-center">
      <Image
        source={require("../../../assets/images/empty-orders.png")}
        resizeMode="contain"
        style={{
          width: 300,
          height: 300,
          marginBottom: 24,
        }}
      />
      <Text className="self-center text-[#ccc] text-[24px] mb-[24px] font-LexendDecaBold">
        Your Order list is empty
      </Text>
      <Text className="self-center text-[#ccc] text-[14px] font-LexendDecaLight">
        Start exploring and finding great deals
      </Text>

      <View className="gap-[24px] p-[30px]">
        <Text className="self-center text-[#ccc] text-[20px] font-LexendDecaMedium">
          Finding Great Deals ?
        </Text>

        <View className="flex-row items-center justify-between relative shrink">
          <TouchableOpacity
            className="justify-center items-center p-[10.5px] w-[47%] rounded-[8.5px] border-[1px] border-[#16783A]"
            onPress={() => router.push("/(root)/(tabs)/home/home")}
          >
            <Text className="text-white text-[12px]">Watch Live Shows</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="justify-center items-center p-[10.5px] w-[47%] rounded-[8.5px] border-[1px] border-[#16783A] bg-[#16783A]"
            onPress={() => router.push("/(root)/(tabs)/home/marketplace")}
          >
            <Text className="text-white text-[12px]">Go to Marketplace</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};
export default Orders;
