import {
  View,
  Text,
  Dimensions,
  TouchableOpacity,
  Image,
  FlatList,
  Pressable,
} from "react-native";
import React, { useEffect, useMemo, useState } from "react";
import { FocusAwareStatusBar } from "@/components/ui/focus-aware-status-bar";
import { Link, router, useGlobalSearchParams } from "expo-router";
import Entypo from "@expo/vector-icons/Entypo";
import axios from "axios";
import { getToken } from "@/store/features/auth/utils";
import { ScrollView } from "react-native-gesture-handler";
import { findVariantType, formatDate } from "@/helpers/helpers";
import Feather from "@expo/vector-icons/Feather";
import { ActivityIndicator } from "react-native-paper";
import { toast } from "@/core/toast";

import * as Clipboard from "expo-clipboard";
import CancelledOrders from "@/components/orders/cancelledOrders";
import ReturnedOrders from "@/components/orders/ReturnedOrders";
import { MaterialCommunityIcons, SimpleLineIcons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import SafeAreaView from "@/components/global/safeareaview/SafeAreaView";

const statusColor = {
  pending: { name: "Processing", color: "#FFF8DE" },
  confirmed: { name: "Confirmed", color: "#FFF8DE" },
  pending_pickup: { name: "Pending Pick-Up", color: "rgb(219 234 254)" },
  picked_up: { name: "Picked Up", color: "rgb(219 234 254)" },
  in_transit: { name: "Dispatched", color: "rgb(219 234 254)" },
  delivered: { name: "Delivered", color: "#DEFFEE" },
  cancelled: { name: "cancelled", color: "rgba(238, 87, 28, 0.85)" },
  returned: { name: "refund request", color: "rgba(238, 87, 28, 0.85)" },
} as any;

const statusIcons = {
  pending: <Feather name="box" size={14} color="#fff" />,
  picked_up: <MaterialCommunityIcons name="forklift" size={18} color="#fff" />,
  in_transit: <Feather name="truck" size={18} color="#fff" />,
  delivered: <SimpleLineIcons name="home" size={18} color="#fff" />,
  cancelled: <SimpleLineIcons name="home" size={18} color="#fff" />,
  returned: <SimpleLineIcons name="home" size={18} color="#fff" />,
} as any;

const { width, height } = Dimensions.get("window");

const SingleOrder = () => {
  const isFocused = useIsFocused();
  const { id, token: userToken, conversationId } = useGlobalSearchParams();
  const [order, setOrder] = useState<any>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [conversations, setConversations] = useState<any[]>([]);

  const copyTrackingNumber = () => {
    Clipboard.setStringAsync(order?.shipping?.tracking.number);
    toast.info("Copied to Clipboard");
  };

  const handleGetOrder = async () => {
    try {
      const token = await getToken();

      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL + "api/order/" + id,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      setOrder(response.data);
    } catch (e) {
      console.log("error getting single order ", e);
    } finally {
      setLoading(false);
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
    } catch (e) {
      console.log("unable to get conversations in product details page", e);
    }
  };

  useEffect(() => {
    if (isFocused) {
      handleGetConversations();
    }
  }, [isFocused]);

  useEffect(() => {
    handleGetOrder();
  }, [id]);
  return (
    <SafeAreaView
      className="h-full flex-1 bg-[#121212] "
      style={{ minHeight: height }}
    >
      <FocusAwareStatusBar barStyle="light-content" backgroundColor="#121212" />

      <View className="flex flex-row items-center justify-center gap-[10px] px-[12px] py-[17px] mt-4 relative">
        <TouchableOpacity
          className="absolute left-[12px]"
          onPress={() => {
            router?.canGoBack()
              ? router.back()
              : router.push("/(root)/(tabs)/profile");
          }}
        >
          <Entypo
            name="chevron-left"
            size={24}
            color="rgba(204, 204, 204, 0.8)"
          />
        </TouchableOpacity>

        <Text className="text-white font-LexendDecaMedium text-[24px]">
          Order Details
        </Text>
      </View>
      {loading ? (
        <ActivityIndicator
          size={"small"}
          color="#fff"
          style={{ marginVertical: 10 }}
        />
      ) : (
        <View
          style={{
            paddingHorizontal: 16,
            flex: 1,
          }}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingTop: 12,
            }}
          >
            {order?.shipping?.tracking?.status == "cancelled" && (
              <CancelledOrders
                order={order}
                userToken={userToken}
                conversationId={conversationId}
              />
            )}

            {order?.order?.orderStatus?.hasReturn && (
              <ReturnedOrders
                order={order}
                userToken={userToken}
                conversationId={conversationId}
              />
            )}
            {[
              "pending",
              "confirmed",
              "pending_pickup",
              "picked_up",
              "dispatched",
              "in_transit",
              "delivered",
            ].includes(order?.shipping?.tracking?.status?.toLowerCase()) &&
              !order?.order?.orderStatus?.hasReturn && (
                <View>
                  {order?.shipping?.tracking?.status == "in_transit" && (
                    <View
                      className="bg-white rounded-[16px]"
                      style={{
                        paddingHorizontal: 24,
                        paddingVertical: 8,
                        marginBottom: 30,
                      }}
                    >
                      <Image
                        source={require("../../../assets/images/shipped.png")}
                        resizeMode="contain"
                        style={{
                          width: 90,
                          height: 90,
                          marginBottom: 8,
                        }}
                      />
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: 800,
                          marginBottom: 8,
                        }}
                      >
                        Shipped
                      </Text>
                      <Text
                        style={{
                          fontSize: 10,
                          marginBottom: 8,
                          color: "#16783A",
                          fontFamily: "LexendDeca",
                        }}
                      >
                        Package has been dispatched
                      </Text>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <View
                          style={{
                            paddingVertical: 8,
                            paddingHorizontal: 4,
                            backgroundColor: "#EBF2FA",
                            borderRadius: 6,
                            flexDirection: "row",
                            alignItems: "center",
                            alignSelf: "flex-start",
                            justifyContent: "center",
                            // maxWidth: 110,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 10,
                              color: "#A6B7D4",
                              fontFamily: "LexendDeca-Medium",
                            }}
                          >
                            Shipped by {order?.shipping?.carrier?.name}
                          </Text>
                        </View>
                        <Text
                          style={{
                            color: "#3A3A3A",
                            fontSize: 12,
                            fontFamily: "LexendDeca-Medium",
                          }}
                        >
                          {formatDate(
                            order?.shipping?.tracking?.lastUpdate,
                            "MMMM DD, YYYY",
                          )}
                        </Text>
                      </View>

                      <Text
                        style={{
                          position: "absolute",
                          top: 16,
                          right: 24,
                          fontSize: 8,
                          fontWeight: 900,
                        }}
                      >
                        Easily track your package
                      </Text>
                    </View>
                  )}

                  {order?.shipping?.tracking?.status == "delivered" && (
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
                            order.shipping?.tracking?.history[2]?.timestamp,
                            "MMM DD",
                          )}{" "}
                          - Package has been delivered. Please pickup and enjoy
                          your order
                        </Text>
                        <Text className="text-[#ccc] opacity-70 text-[8px] font-LexendDecaLight leading-[20px]">
                          You can request for refund / return of product
                        </Text>
                      </View>
                    </View>
                  )}

                  {order?.items?.map((item: any, index: number) => {
                    return (
                      <OrderItem
                        key={item._id || index}
                        orderItem={item}
                        orderStatus={order?.shipping?.tracking?.status}
                        seller={order.seller}
                        buyer={order.buyer}
                        token={userToken?.toString()}
                        orderId={order?.order?._id}
                        conversationId={conversationId?.toString()}
                      />
                    );
                  })}

                  <View className="flex-row justify-between items-center gap-[6px] relative mb-[20px]">
                    <Pressable
                      className="px-[4px] py-[12px] justify-center items-center border-[1px] border-[#EDF2F7] rounded-[6px] shrink"
                      style={{ width: "100%" }}
                      onPress={() =>
                        router.push({
                          pathname: `../../(root)/messageRoom/${order.seller?._id}`,
                          params: {
                            name:
                              order.items[0].product?.seller?.storeName ||
                              order.items[0].product?.seller?.firstName +
                                " " +
                                order.items[0].product?.seller?.lastName ||
                              "Default",
                            avatar:
                              order.items[0].product?.seller?.storeAvatar?.url,
                            conversationId:
                              conversations?.find(
                                (convo: any) =>
                                  convo.participant.id ==
                                  order.items[0].product?.seller?._id,
                              )?._id || "",
                            userId: order?.buyer?._id || order?.buyer,
                            token: userToken,
                            model: "Seller",
                            orderId: order?.id || order?.order?._id,
                          },
                        })
                      }
                    >
                      <Text className="text-white text-[10px] font-LexendDecaMedium">
                        Chat Seller
                      </Text>
                    </Pressable>
                    {/* {order.shipping.tracking.status == "delivered" &&
                    order?.order?.orderStatus?.isOpen ? (
                      <Pressable
                        className="px-[4px] py-[12px] justify-center items-center border-[1px] border-[#EDF2F7] rounded-[6px] shrink"
                        style={{ width: "100%" }}
                        onPress={() =>
                          router.push({
                            pathname: "/(root)/orders/returns",
                            params: {
                              productList: JSON.stringify(
                                order?.items?.map((item: any) => {
                                  return {
                                    name: item?.product?.name,
                                    description: item?.product.description,
                                    price: item?.price,
                                    quantity: item?.quantity,
                                    specifications: item?.specifications,
                                    id: item?.product._id,
                                    image: item?.product?.images?.[0]?.url,
                                  };
                                }),
                              ),
                              orderId: order?.order?._id,
                            },
                          })
                        }
                      >
                        <Text className="text-white text-[10px]">
                          Return/Refund
                        </Text>
                      </Pressable>
                    ) : null} */}

                    {["pickup_arranged"].includes(
                      order.shipping.tracking.status,
                    ) && (
                      <Link
                        className="px-[4px] py-[12px] justify-center items-center border-[1px] border-[#16783A] rounded-[6px] bg-[#16783A]"
                        style={{ width: "30%" }}
                        href={order?.shipping?.tracking?.url || ""}
                      >
                        <Text className="text-white text-[10px] self-center text-center font-LexendDecaMedium">
                          Track Order
                        </Text>
                      </Link>
                    )}
                  </View>

                  {order?.order?.isStorePickup && (
                    <StorePickupDetails
                      details={order.items[0]}
                      address={
                        order?.seller?.sellerAddress ||
                        order?.seller?.businessAddress
                      }
                    />
                  )}

                  <View>
                    <Text className="text-[14px] mb-[10px] font-LexendDecaSemiBold text-white">
                      Delivery Details
                    </Text>
                    <View className="bg-[#2a2a2a] rounded-[8px] p-[16px] gap-[16px] mb-[20px]">
                      <View className="flex-row items-center justify-between">
                        <Text className="text-white font-LexendDecaLight text-[12px]">
                          Order Total:
                        </Text>
                        <Text className="text-white font-LexendDecaMedium text-[12px]">
                          ₦{order?.order?.totalAmount.toLocaleString()}
                        </Text>
                      </View>
                      <View className="flex-row items-center justify-between">
                        <Text className="text-white font-LexendDecaLight text-[12px]">
                          Shipping Total:
                        </Text>
                        <Text className="text-white font-LexendDecaMedium text-[12px]">
                          ₦{order?.shipping?.fee?.amount.toLocaleString()}
                        </Text>
                      </View>
                      <View className="flex-row items-center justify-between">
                        <Text className="text-white font-LexendDecaLight text-[12px]">
                          Channel:
                        </Text>
                        <Text className="text-white font-LexendDecaMedium text-[12px]">
                          {order?.order?.channel}
                        </Text>
                      </View>
                      <View className="flex-row items-center justify-between">
                        <Text className="text-white font-LexendDecaLight text-[12px]">
                          Payment Method:
                        </Text>
                        <Text className="text-white font-LexendDecaMedium text-[12px]">
                          {order?.order?.paymentInfo?.method}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View
                    className="flex-row items-center"
                    style={{ marginBottom: 36 }}
                  >
                    <Text className="font-LexendDeca text-[12px] text-[#ccc]">
                      Tracking Number -{" "}
                    </Text>
                    <Pressable onPress={copyTrackingNumber}>
                      <Text className="text-[12px] text-[#027CEC] font-LexendDeca">
                        {order?.shipping?.tracking.number || ""}
                      </Text>
                    </Pressable>

                    {order?.shipping?.tracking?.number && (
                      <Feather
                        name="copy"
                        size={12}
                        color="#027CEC"
                        style={{ marginLeft: 2 }}
                      />
                    )}
                  </View>

                  <View
                    style={{
                      justifyContent: "center",
                      gap: 14,
                      paddingHorizontal: 16,
                      paddingLeft: 30,
                      paddingBottom: 40,
                    }}
                  >
                    <OrderHistory
                      history={{
                        timestamp: order?.order?.createdAt,
                        status: "Order Placed",
                        description: "Your order has been placed successfully",
                      }}
                    />
                    {order?.shipping?.tracking?.history?.map(
                      (data: any, index: number) => (
                        <OrderHistory history={data} key={index} />
                      ),
                    )}
                  </View>
                </View>
              )}
          </ScrollView>
        </View>
      )}
    </SafeAreaView>
  );
};

const StorePickupDetails = ({ details, address }: any) => {
  return (
    <View>
      <Text className="text-[14px] mb-[10px] font-LexendDecaSemiBold text-white">
        Store Pickup Details
      </Text>
      <View className="bg-[#2a2a2a] rounded-[8px] p-[16px] gap-[16px] mb-[20px]">
        <View className="flex-row items-center justify-between">
          <Text className="text-white font-LexendDecaLight text-[12px]">
            Seller Phone:
          </Text>
          <Text className="text-white font-LexendDecaMedium text-[12px]">
            {details?.seller?.phoneNumber}
          </Text>
        </View>
        <View className="flex-row items-center justify-between">
          <Text className="text-white font-LexendDecaLight text-[12px]">
            Seller Email:
          </Text>
          <Text className="text-white font-LexendDecaMedium text-[12px]">
            {details?.seller?.email}
          </Text>
        </View>
        <View className="flex-row items-center justify-between gap-[8px]">
          <Text className="text-white font-LexendDecaLight text-[12px]">
            Seller State:
          </Text>
          <Text className="text-white font-LexendDecaMedium text-[12px] shrink">
            {address?.state}
          </Text>
        </View>
        <View className="flex-row items-center justify-between gap-[8px]">
          <Text className="text-white font-LexendDecaLight text-[12px]">
            Seller Address:
          </Text>
          <Text className="text-white font-LexendDecaMedium text-[12px] shrink">
            {address?.addressLine1}
          </Text>
        </View>
        {/* <View className="flex-row items-center justify-between">
          <Text className="text-white font-LexendDecaLight text-[12px]">
            Payment Method:
          </Text>
          <Text className="text-white font-LexendDecaMedium text-[12px]"></Text>
        </View> */}
      </View>
    </View>
  );
};

const OrderHistory = ({ history }: any) => {
  return (
    <View className="flex-row">
      <View
        style={{
          gap: 8,
          marginRight: 21,
          width: 60,
        }}
      >
        <Text className={`text-[16px] text-[#ccc] font-LexendDecaSemiBold`}>
          {formatDate(history?.timestamp, "MMM DD")}
        </Text>
        <Text className={`text-[12px] text-[#ccc] font-LexendDecaLight`}>
          {formatDate(history?.timestamp, "HH:mm")}
        </Text>
      </View>
      <View
        style={{
          gap: 5,
          flexShrink: 1,
        }}
      >
        <View className="flex-row items-center" style={{ gap: 11 }}>
          <View
            style={{
              width: 35,
              height: 35,
              borderRadius: 35 / 2,
              alignItems: "center",
              justifyContent: "center",
              // padding: 10,

              backgroundColor: "#16783A",
            }}
          >
            {statusIcons[history?.status] || (
              <Feather name="box" size={18} color="#fff" />
            )}
            {/* <Feather name="box" size={14} color="#fff" /> */}
          </View>
          <Text
            style={{
              fontSize: 16,
              fontFamily: "LexendDeca-SemiBold",

              color: "#16783A",
            }}
          >
            {history?.status?.replaceAll("_", " ")}
          </Text>
        </View>
        <View
          style={{
            borderLeftColor: "#16783A",

            borderLeftWidth: 1,
            paddingLeft: 30,
            paddingVertical: 10,
            marginLeft: 35 / 2,
          }}
        >
          <Text
            className={`text-[12px] text-[#ccc] font-LexendDecaSemiBold shrink`}
          >
            {history?.description}
          </Text>
        </View>
      </View>
    </View>
  );
};

const OrderItem = ({
  orderItem,
  orderStatus,
  seller,
  buyer,
  token,
  conversationId,
  orderId,
}: {
  orderItem: any;
  orderStatus: string;
  seller: string;
  buyer: string;
  token: string;
  conversationId: string;
  orderId: string;
}) => {
  const [variant, setVariant] = useState<any>(null);
  const imageUrl = useMemo(() => {
    const type = findVariantType(orderItem?.specifications);
    if (type) {
      const variant = orderItem?.product?.variants?.find(
        (vr: any) =>
          vr.name == type && vr.value == orderItem.specifications[type],
      );
      if (variant) {
        setVariant({
          name: variant.name,
          value: variant.value,
          image: variant.images[0]?.data,
        });
        return variant.images[0]?.data;
      }
      return orderItem?.product?.images[0]?.url;
    } else {
      return orderItem?.product?.images[0]?.url;
    }
  }, [orderItem]);
  return (
    <View
      className="border-b-[1px] py-[14px] pb-[25px] flex-row justify-center"
      style={{
        borderColor: "rgba(242, 242, 242, 0.50)",
        marginBottom: 15,
      }}
    >
      <View className="w-[100%] gap-[16px] shrink relative">
        <View className=" flex-row items-center justify-between">
          <Text className="text-[16px] text-white font-LexendDecaSemiBold">
            {orderItem?.seller?.storeName ||
              orderItem?.seller?.businessName ||
              "Kicks Store"}
          </Text>
          <View
            className="rounded-[3px] px-[6px] py-[4px] w-[60px] justify-center items-center"
            style={{
              backgroundColor: statusColor[orderStatus?.toLowerCase()]?.color,
            }}
          >
            <Text className=" text-[8px] font-LexendDecaMedium">
              {statusColor[orderStatus]?.name}
            </Text>
          </View>
        </View>
        <View className="gap-[16px]">
          <View>
            <Image
              source={{ uri: imageUrl }}
              resizeMode="cover"
              style={{
                width: 115,
                height: 103,
                borderRadius: 14,
              }}
            />
          </View>
          <View className="gap-[8px] relative shrink">
            <View className="flex-row items-center justify-between gap-[11px]">
              <Text className="text-[14px] text-[#16783A] font-LexendDecaSemiBold shrink">
                {orderItem?.productName?.length > 50
                  ? orderItem?.productName?.slice(0, 50) + "..."
                  : orderItem?.productName}
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
                  N{orderItem?.price.toLocaleString()}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center justify-between gap-[11px]">
              <Text className="text-[12px] text-[#F2F2F2] font-LexendDecaLight shrink">
                Item ID: {orderItem.product._id}
              </Text>
              <Text className="text-white text-[11px] font-LexendDecaMedium">
                Quantity: {orderItem?.quantity}
              </Text>
            </View>
            {variant && (
              <View>
                <Text className="text-white text-[11px] font-LexendDecaMedium">
                  {variant?.name}: {variant?.value}
                </Text>
              </View>
            )}
          </View>
        </View>
        {orderStatus == "delivered" && (
          <View className="flex-row justify-end items-center flex-wrap relative">
            <Pressable
              className="px-[4px] py-[12px] justify-center items-center border-[1px] border-[#EDF2F7] rounded-[6px]"
              style={{ width: "30%" }}
              onPress={() =>
                router.push(`/createReview/${orderItem.product._id}`)
              }
            >
              <Text className="text-white text-[10px] font-LexendDecaMedium">
                Review
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
};
export default SingleOrder;
