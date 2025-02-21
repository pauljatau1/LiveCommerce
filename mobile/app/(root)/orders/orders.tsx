import {
  View,
  Text,
  SafeAreaView,
  Dimensions,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Pressable,
  ScrollViewComponent,
} from "react-native";
import React, { useEffect, useRef, useState } from "react";
import { FocusAwareStatusBar } from "@/components/ui/focus-aware-status-bar";
import Entypo from "@expo/vector-icons/Entypo";
import { router } from "expo-router";
import { ScrollView } from "react-native-gesture-handler";
import { getToken } from "@/store/features/auth/utils";
import axios from "axios";
import { useIsFocused } from "@react-navigation/native";
import { formatDate } from "@/helpers/helpers";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width, height } = Dimensions.get("window");

const tabs = ["All", "Processing", "In Transit", "Delivered", "My Returns"];
const statusColor = {
  pending: { name: "Processing", color: "#FFF8DE" },
  pickup_arranged: { name: "In Transit", color: "rgb(219 234 254)" },
  delivered: { name: "Delivered", color: "#DEFFEE" },
} as any;

const Orders = () => {
  const scrollViewRef = useRef<ScrollView>(null);
  const isFocused = useIsFocused();
  const [selectedTab, setSelectedTab] = useState<string>(tabs[0]);
  const [ordersLoading, setOrdersLoading] = useState<boolean>(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [token, setToken] = useState<string>("");

  const handleTabSelection = (selection: string) => {
    const actualSelection = {
      processing: "pending",
      "in transit": "pickup_arranged",
      delivered: "delivered",
    } as any;
    setSelectedTab(selection);

    if (selection.toLowerCase() == "all") {
      return setOrders(allOrders);
    }

    setOrders(
      allOrders.filter(
        (order) =>
          order.shipping.tracking.status ==
          actualSelection[selection.toLowerCase()],
      ),
    );
  };

  const handleGetOrders = async () => {
    try {
      const token = await getToken();
      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL + "api/buyer/orders?page=1",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      setSelectedTab("All");
      setAllOrders(response.data.orders);
      setOrders(response.data.orders);
    } catch (e) {
      console.log("failed to retrieve orders ", e);
    } finally {
      setOrdersLoading(false);
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
  useEffect(() => {
    handleGetOrders();
  }, []);

  useEffect(() => {
    if (isFocused) {
      handleGetConversations();
    }
  }, [isFocused]);

  useEffect(() => {
    scrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: false });
  }, [selectedTab]);

  return (
    <View>
      <FocusAwareStatusBar barStyle="light-content" backgroundColor="#121212" />
      <SafeAreaView
        className="h-full flex-1 bg-[#121212] "
        style={{ minHeight: height }}
      >
        <View className="mb-[12px]">
          <View className="flex flex-row items-center justify-center gap-[10px] px-[12px] py-[17px] mb-[8px] mt-4 relative">
            <TouchableOpacity
              className="absolute left-[18px]"
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
          <View
            className="flex-row items-center justify-between px-[23px]"
            style={{
              borderBottomColor: "rgba(204, 204, 204, 0.25)",
              borderBottomWidth: 0.5,
            }}
          >
            {tabs.map((tab, index) => (
              <TouchableOpacity
                onPress={() => handleTabSelection(tab)}
                className={`py-[4px] pb-[16px] ${selectedTab == tab ? "border-b-[1px] border-b-white" : ""}`}
                key={index}
              >
                <Text
                  className={` font-LexendDecaMedium text-[12px] ${selectedTab == tab ? "text-white" : "text-[#94A3B1]"}`}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        {ordersLoading ? (
          <ActivityIndicator
            size={"small"}
            color={"#16783A"}
            className="m-[20px]"
          />
        ) : (
          <ScrollView
            ref={scrollViewRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingVertical: 20,
              paddingHorizontal: 30,
              // backgroundColor: "red",
              // height: "100%",
            }}
          >
            <View className="gap-[30px]">
              <View className="p-30px gap-[20px] shrink">
                {orders?.length > 0 ? (
                  orders.map((orderItem, index) => (
                    <View key={index}>
                      {orderItem?.shipping?.tracking?.status == "delivered" && (
                        <View
                          style={{
                            flexDirection: "row",
                            borderRadius: 16,
                            paddingHorizontal: 16,
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
                                orderItem.shipping?.tracking?.history[2]
                                  ?.timestamp,
                                "MMM DD",
                              )}{" "}
                              - Package has been delivered. Please pickup and
                              enjoy your order
                            </Text>
                            <Text className="text-[#ccc] opacity-70 text-[8px] font-LexendDecaLight leading-[20px]">
                              You can request for refund / return of product
                            </Text>
                          </View>
                        </View>
                      )}

                      <OrderItem
                        key={index}
                        orderItem={orderItem}
                        conversations={conversations}
                        token={token}
                      />
                    </View>
                  ))
                ) : (
                  <EmptyOrders />
                )}
              </View>

              <View className="gap-[24px] p-[30px]">
                <Text className="self-center text-[#ccc] text-[20px] font-LexendDecaMedium">
                  Finding Great Deals ?
                </Text>

                <View className="flex-row items-center justify-between relative shrink">
                  <TouchableOpacity className="justify-center items-center p-[10.5px] w-[47%] rounded-[8.5px] border-[1px] border-[#16783A]">
                    <Text className="text-white text-[12px]">
                      Watch Live Shows
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity className="justify-center items-center p-[10.5px] w-[47%] rounded-[8.5px] border-[1px] border-[#16783A] bg-[#16783A]">
                    <Text className="text-white text-[12px]">
                      Go to Marketplace
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
};

const OrderItem = ({
  orderItem,
  conversations,
  token,
}: {
  orderItem: any;
  conversations: any;
  token: string;
}) => {
  return (
    <TouchableOpacity
      className="border-b-[1px] p-[14px] pb-[25px] flex-row justify-center"
      style={{
        borderColor: "rgba(242, 242, 242, 0.50)",
      }}
      onPress={() => {
        if (!orderItem.paid) return;
        router.push({
          pathname: `../../(root)/orders/${orderItem._id}`,
          params: {
            token,
            conversationId:
              conversations?.find(
                (convo: any) => convo.participant.id == orderItem.seller,
              )?._id || "",
          },
        });
      }}
    >
      <View className="w-[100%] gap-[16px] shrink relative">
        <View className=" flex-row items-center justify-between">
          <Text className="text-[16px] text-white font-LexendDecaSemiBold">
            {orderItem?.items[0]?.seller?.storeName ||
              orderItem?.items[0]?.seller?.businessName ||
              "Kicks Store"}
          </Text>
          <View
            className="rounded-[3px] px-[6px] py-[4px] justify-center items-center"
            style={{
              backgroundColor: orderItem.paid
                ? statusColor[orderItem?.shipping?.tracking?.status]?.color
                : "red",
            }}
          >
            <Text
              className={`text-[8px] font-LexendDeca ${orderItem.paid ? null : "text-white"}`}
            >
              {orderItem.paid
                ? statusColor[orderItem.shipping.tracking.status]?.name
                : "Pending Payment"}
            </Text>
          </View>
        </View>
        <View className="gap-[16px]">
          <View>
            <Image
              source={{ uri: orderItem?.items[0]?.product?.images[0].url }}
              resizeMode="cover"
              style={{
                width: 115,
                height: 103,
                borderRadius: 14,
              }}
            />
          </View>
          <View className="gap-[8px] relative shrink">
            <View className="flex-row items-center justify-between gap-[11px] flex-wrap">
              <Text className="text-[14px] text-[#16783A] font-LexendDecaSemiBold">
                {orderItem?.items[0]?.productName?.length > 20
                  ? orderItem?.items[0]?.productName?.slice(0, 20) + "..."
                  : orderItem?.items[0]?.productName}
              </Text>
              <View
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 6,
                  backgroundColor: "#E5FDFF",
                }}
              >
                <Text className="text-[12px] text-[#16783A] font-LexendDecaSemiBold">
                  N{orderItem?.totalAmount.toLocaleString()}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center justify-between gap-[11px] flex-wrap">
              <Text className="text-[12px] text-[#F2F2F2] font-LexendDecaLight">
                Order ID: {orderItem._id?.toLocaleString().slice(0, 15)}...
              </Text>
              <Text className="text-white text-[11px] font-LexendDecaMedium">
                Quantity: {orderItem?.items[0].quantity}
              </Text>
            </View>
          </View>
        </View>
        <View className="flex-row justify-between items-center flex-wrap relative">
          <Pressable
            className="px-[4px] py-[12px] justify-center items-center border-[1px] border-[#EDF2F7] rounded-[6px]"
            style={{ width: "30%" }}
            onPress={() =>
              router.push({
                pathname: `../../(root)/messageRoom/${orderItem.seller}`,
                params: {
                  name:
                    orderItem.items?.[0]?.product?.seller?.storeName ||
                    orderItem.items?.[0]?.product?.seller?.firstName +
                      " " +
                      orderItem.items?.[0]?.product?.seller?.lastName ||
                    "Default",
                  avatar:
                    orderItem.items?.[0]?.product?.seller?.storeAvatar?.url,
                  conversationId:
                    conversations?.find(
                      (convo: any) => convo.participant.id == orderItem.seller,
                    )?._id || "",
                  userId: orderItem?.buyer,
                  token: token,
                  model: "Seller",
                },
              })
            }
          >
            <Text className="text-white text-[10px]">Chat Seller</Text>
          </Pressable>
          {orderItem.shipping.tracking.status == "pending" && orderItem.paid ? (
            <Pressable
              className="px-[4px] py-[12px] justify-center items-center border-[1px] border-[#16783A] rounded-[6px] bg-[#16783A]"
              style={{ width: "30%" }}
            >
              <Text className="text-white text-[10px]">Cancel Order</Text>
            </Pressable>
          ) : null}
          {orderItem.shipping.tracking.status == "delivered" && (
            <Pressable
              className="px-[4px] py-[12px] justify-center items-center border-[1px] border-[#EDF2F7] rounded-[6px]"
              style={{ width: "30%" }}
            >
              <Text className="text-white text-[10px]">Return/Refund</Text>
            </Pressable>
          )}

          {["pickup_arranged"].includes(orderItem.shipping.tracking.status) && (
            <Pressable
              className="px-[4px] py-[12px] justify-center items-center border-[1px] border-[#16783A] rounded-[6px] bg-[#16783A]"
              style={{ width: "30%" }}
            >
              <Text className="text-white text-[10px]">Track Order</Text>
            </Pressable>
          )}

          {!orderItem.paid && (
            <Pressable
              className="px-[4px] py-[12px] justify-center items-center border-[1px] border-[#16783A] rounded-[6px] bg-[#16783A]"
              style={{ width: "30%" }}
              onPress={async () => {
                console.log(orderItem._id);
                await AsyncStorage.setItem(
                  "orders",
                  JSON.stringify([{ ...orderItem, orderId: orderItem._id }]),
                );
                router.push(`/checkout/${orderItem._id}`);
              }}
            >
              <Text className="text-white text-[10px]">Pay</Text>
            </Pressable>
          )}
        </View>
      </View>
    </TouchableOpacity>
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
    </View>
  );
};
export default Orders;
