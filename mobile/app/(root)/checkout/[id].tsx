import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  Pressable,
  Dimensions,
  Image,
} from "react-native";
import React, { useEffect, useMemo, useState } from "react";
import { router, useGlobalSearchParams } from "expo-router";
import LoadingModal from "@/components/global/loading-modal";
import { FocusAwareStatusBar } from "@/components/ui/focus-aware-status-bar";
import Entypo from "@expo/vector-icons/Entypo";
import { getToken, getUser } from "@/store/features/auth/utils";
import axios from "axios";
import { ActivityIndicator } from "react-native-paper";
import { toast } from "@/core/toast";
import { Paystack } from "react-native-paystack-webview";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width, height } = Dimensions.get("window");

const CheckoutSummary = () => {
  const { id } = useGlobalSearchParams();
  const [orders, setOrders] = useState<any[]>([]);
  const [showPaystack, setShowPaystack] = useState(false);

  const [user, setUser] = useState<any>(null);
  const [addresses, setAddresses] = useState<any>({});
  const [order, setOrder] = useState<any>(null);
  const [subtotal, setSubtotal] = useState<number>(0);
  // const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [payLoading, setPayLoading] = useState<boolean>(false);
  const [shippingInfo, setShippingInfo] = useState<any[]>([]);
  const [selectedProviders, setSelectedProviders] = useState<any>(null);
  const [selectedProviderName, setSelectedProviderName] = useState<string>("");
  const [shippingFee, setShippingFee] = useState<number>(0);

  const getOrderInfo = async (orderId: string) => {
    try {
      const token = await getToken();
      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL + `api/order/${orderId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      setSubtotal((prevState) => prevState + response.data.order.totalAmount);
      setAddresses(response.data.addresses);
      setOrder(response.data.order);
      getShippingInfo(response.data.shipping.shipment_id);
    } catch (e) {
      console.log("error fetching buyer addresses ", e);
    }
  };

  const getShippingInfo = async (shipmentId: string) => {
    try {
      const token = await getToken();
      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL +
          `api/order/shipping-rates/${shipmentId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setShippingInfo((prevState) => {
        const newShippingInfo = [...prevState];
        newShippingInfo.push(response.data.data);
        return newShippingInfo;
      });
      // setSelectedProviders(response.data.data[0]);
      // setSelectedProviderName(response.data.data[0].carrier_name);
      setLoading(false);
    } catch (e) {
      console.log("error fetching buyer addresses ", e);
      setLoading(false);
    }
  };

  const handlePayOrder = async () => {
    if (payLoading) return;
    if (total < 1) {
      return toast.info("select shipping provider");
    }
    if (selectedProviders) {
      setPayLoading(true);
      setShowPaystack(true);
    } else {
      toast.info("select shipping provider");
    }
  };

  const calculateOrderTotal = (items: any) => {
    const total = items.reduce((a: any, b: any) => a + b.price * b.quantity, 0);
    return total;
  };

  const onPaystackSuccess = async (response: any) => {
    setShowPaystack(false);
    try {
      const token = await getToken();
      const payload = selectedProviders.map(
        (selectedProvider: any, index: number) => ({
          orderId: orders[index]?.orderId,
          amount: calculateOrderTotal(orders[index]?.items),
          carrier_reference: selectedProvider.carrier_reference,
          shipping_fee: selectedProvider.amount,
          carrier_name: selectedProvider.carrier_name,
          rate_id: selectedProvider.rate_id,
          estimatedDeliveryDate: selectedProvider.delivery_date,
          estimatedPickupDate: selectedProvider.pickup_time,
        }),
      );
      const config = {
        method: "POST",
        url: process.env.EXPO_PUBLIC_API_URL + `api/order/mark-as-paid`,
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        data: { orders: payload },
      };

      const response = await axios(config);
      console.log("order payment Response ==> ", response.data);
      if (response.status == 200) {
        await AsyncStorage.removeItem("order");
        toast.success("Order paid successfully");
        router.replace(`/`);
      }
    } catch (e: any) {
      console.log("could not Pay for  order", e?.response?.message);
      toast.error("Could not Pay for order");
    } finally {
      setPayLoading(false);
    }
  };

  const onPaystackClose = () => {
    setShowPaystack(false);
    setPayLoading(false);
    toast.info("Payment Cancelled");
  };

  useEffect(() => {
    async function getUserInfo() {
      const user = await getUser();
      const orders = await AsyncStorage.getItem("orders");
      setOrders(JSON.parse(orders!));
      setUser(user);
    }
    getUserInfo();
  }, []);

  useEffect(() => {
    if (orders?.length > 0) {
      orders.forEach((order) => {
        getOrderInfo(order.orderId);
      });
    }
  }, [orders]);

  const total = useMemo(() => {
    if (selectedProviders?.length > 0) {
      const totalShipping = selectedProviders.reduce(
        (a: any, b: any) => a + b.amount,
        0,
      );
      setShippingFee(totalShipping);
      return subtotal + totalShipping;
    }
    return subtotal;
  }, [selectedProviders]);

  useEffect(() => {
    const selectedProvider = [] as any[];
    shippingInfo.forEach((item: []) => {
      item.forEach((obj: any) => {
        if (obj.carrier_name == selectedProviderName) {
          selectedProvider.push(obj);
        }
      });
    });
    // console.log("selected provider", selectedProvider);
    setSelectedProviders(selectedProvider);
  }, [selectedProviderName]);
  return (
    <>
      <FocusAwareStatusBar barStyle="light-content" backgroundColor="#121212" />
      <SafeAreaView
        className="h-full flex-1 bg-[#121212] "
        style={{ minHeight: height }}
      >
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
            Checkout Summary
          </Text>
        </View>

        <ScrollView
          className="bg-[#121212]"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: 50,
          }}
        >
          {loading ? (
            <ActivityIndicator
              size={"small"}
              color={"#16783A"}
              style={{ marginTop: 30 }}
            />
          ) : (
            <>
              <View className="px-[20px] gap-[30px] pb-[20px]">
                <View
                  className="p-[20px] rounded-[5px] gap-[10px]"
                  style={{ backgroundColor: "rgba(41, 41, 41, 0.81)" }}
                >
                  <View className="flex-row justify-between items-center">
                    <Text className="text-white text-[16px] font-LexendDecaSemiBold">
                      Subtotal:
                    </Text>
                    <Text className="text-[#16783A] text-[16px] font-LexendDecaSemiBold">
                      ₦{subtotal?.toLocaleString()}
                    </Text>
                  </View>
                  <View className="flex-row justify-between items-center">
                    <Text className="text-white text-[16px] font-LexendDecaSemiBold">
                      Shipping fee:
                    </Text>
                    <Text className="text-[#16783A] text-[16px] font-LexendDecaSemiBold">
                      ₦{shippingFee?.toLocaleString()}
                    </Text>
                  </View>
                  <View className="flex-row justify-between items-center border-t-[#ccc] border-t-[0.5px] pt-[5px]">
                    <Text className="text-white text-[16px] font-LexendDecaSemiBold">
                      Total:
                    </Text>
                    <Text className="text-[#16783A] text-[16px] font-LexendDecaSemiBold">
                      {total <= subtotal ? "-" : "₦" + total?.toLocaleString()}
                    </Text>
                  </View>
                </View>

                <Pressable
                  className="p-[20px] rounded-[16px] flex-row items-center justify-between"
                  style={{ backgroundColor: "rgba(41, 41, 41, 0.81)" }}
                >
                  <View className="flex-row gap-[16px]">
                    <View className="gap-[18px]">
                      <Text className="text-[#ccc] text-[16px] font-LexendDecaMedium">
                        Ship To {user?.firstName + " " + user?.lastName}
                      </Text>
                      <View>
                        <Text className="text-[#ccc] text-[10px] font-LexendDecaMedium mb-[4px]">
                          {addresses?.delivery?.line1}
                        </Text>
                        <Text className="text-[#ccc] text-[10px] font-LexendDecaMedium">
                          Country: {addresses?.delivery?.country}
                        </Text>
                      </View>
                    </View>
                  </View>
                </Pressable>

                <View
                  className="p-[20px] rounded-[16px] gap-[10px] mb-[10px]"
                  style={{ backgroundColor: "rgba(41, 41, 41, 0.81)" }}
                >
                  <View className="flex-row items-center justify-between">
                    <Text className="text-[18px] text-white font-LexendDecaSemiBold">
                      Select Shipping Provider
                    </Text>
                  </View>
                  <View>
                    {shippingInfo &&
                      shippingInfo[0]?.map((provider: any, index: number) => (
                        <Pressable
                          key={index}
                          className={`flex-row items-center justify-between gap-[16px] mb-[16px] p-[5px] px-[12px] ${selectedProviderName == provider.carrier_name ? "bg-[#16783A]" : "bg-[#121212]"} rounded-[8px]`}
                          onPress={() =>
                            setSelectedProviderName(provider.carrier_name)
                          }
                        >
                          <View className="flex-row items-center gap-[16px]">
                            <Image
                              source={{ uri: provider.carrier_logo }}
                              style={{
                                width: 30,
                                height: 30,
                                borderRadius: 30,
                              }}
                              resizeMode="cover"
                            />
                            <View>
                              <Text className="text-white mb-[4px] font-LexendDeca">
                                {provider.carrier_name}
                              </Text>
                              <Text className="text-white font-LexendDeca text-[10px]">
                                Delivery Time: {provider.delivery_time}
                              </Text>
                            </View>
                          </View>

                          <View className="">
                            <Text className="font-LexendDeca text-[12px] text-[#f2f2f2]">
                              ₦{provider.amount.toLocaleString()}
                            </Text>
                          </View>
                        </Pressable>
                      ))}
                  </View>
                </View>

                <View
                  className="p-[20px] rounded-[16px] gap-[10px] mb-[10px]"
                  style={{ backgroundColor: "rgba(41, 41, 41, 0.81)" }}
                >
                  <View className="flex-row items-center justify-between">
                    <Text className="text-[18px] text-white font-LexendDecaSemiBold">
                      Payment
                    </Text>
                  </View>
                  <View>
                    <Text className="text-[14px] text-[#ccc] font-LexendDecaSemiBold">
                      Paystack
                    </Text>
                  </View>
                </View>
              </View>
            </>
          )}
        </ScrollView>

        {/* <LoadingModal isVisible={loading} /> */}
      </SafeAreaView>
      {loading ? null : (
        <View
          className={`absolute w-full bottom-0 left-0 p-[16px] bg-[#121212] ${total <= subtotal ? "opacity-50" : " "}`}
        >
          <TouchableOpacity
            className="rounded-[5px] items-center justify-center p-[12px] bg-[#16783A] "
            onPress={handlePayOrder}
          >
            {payLoading ? (
              <ActivityIndicator size={"small"} color="white" />
            ) : (
              <Text className="text-white text-[16px] font-LexendDecaMedium">
                {total <= subtotal
                  ? "Select Shipping Provider"
                  : `Pay ₦${total?.toLocaleString()}`}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {showPaystack && (
        <Paystack
          paystackKey="pk_test_a3b5afa78a80b71c20a6ac4e571b6447d0343852"
          amount={100}
          billingEmail={user?.email}
          billingName={`${user?.firstName + " " + user?.lastName}`}
          onSuccess={onPaystackSuccess}
          onCancel={onPaystackClose}
          activityIndicatorColor="#16783A"
          autoStart={true}
        />
      )}
    </>
  );
};

export default CheckoutSummary;
