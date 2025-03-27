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
import React, { useCallback, useEffect, useMemo, useState } from "react";
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

const paymentOptions = [
  {
    icon: require("../../../assets/icons/paystack.png"),
    name: "Paystack",
    description: "Secure payment via card, bank transfer, e-Wallets",
  },
];

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
  const [selectedPayment, setSelectedPayment] = useState<number>(0);
  const [orderId, setOrderId] = useState<string>("");

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
      setOrderId(response.data.order?.orderId);
      // getShippingInfo(response.data.shipping.shipment_id);
      setShippingFee(response.data.shipping.fee.amount);
      setLoading(false);
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
    if (!(shippingFee && subtotal)) {
      return toast.error("Cannot complete payment");
    }
    if (shippingFee && subtotal) {
      setPayLoading(true);
      setShowPaystack(true);
    } else {
      toast.error("payment cant be processed");
    }
  };

  const calculateOrderTotal = (items: any) => {
    const total = items.reduce((a: any, b: any) => a + b.price * b.quantity, 0);
    return total;
  };

  const onPaystackSuccess = async (paystackResponse: any) => {
    setShowPaystack(false);
    try {
      const token = await getToken();
      const payload = {
        paymentReference: paystackResponse.data.transactionRef.reference,
      };
      const config = {
        method: "PATCH",
        url:
          process.env.EXPO_PUBLIC_API_URL +
          `api/order/${order?._id}/mark-as-paid`,
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        data: payload,
      };

      const response = await axios(config);
      console.log("order payment Response ==> ", response.data);
      return router.replace("/(root)/orders/orders");

      if (response.status == 200) {
        await AsyncStorage.removeItem("order");
        toast.success("Order paid successfully");
        router.replace(`/`);
      }
    } catch (e: any) {
      if (e?.response.status == 400) {
        return router.replace("/(root)/orders/orders");
      }
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

  const generateReference = () => {
    const prefix = "ORDER";
    const newReference = `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    return newReference;
  };

  useEffect(() => {
    async function getUserInfo() {
      const user = await getUser();
      const orders = await AsyncStorage.getItem("orders");
      setOrders(JSON.parse(orders!));
      setUser(user);
    }
    getUserInfo();
    getOrderInfo(id?.toString());
  }, []);

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

  const renderPaymentOptions = useCallback(
    (item: any, index: number) => {
      return (
        <Pressable
          key={index}
          className="rounded-[16px] border-[1px] border-[#f2f2f2] p-[16px] flex-row items-center justify-between gap-[8px] min-h-[100px]"
          style={{
            backgroundColor: selectedPayment == index ? "#BEF3D2" : "#121212",
            borderColor:
              selectedPayment == index
                ? "#BEF3D2"
                : "rgba(242, 242, 242, 0.30)",
          }}
          onPress={() => setSelectedPayment(index)}
        >
          <View className="flex-row items-center gap-[16px] shrink">
            <View
              className="w-[50px] h-[50px] rounded-[10px] flex-row items-center justify-center bg-[#FFFFFF] "
              style={{
                backgroundColor: index !== 0 ? "#CFCFCF" : "#ffffff",
              }}
            >
              <Image
                source={item.icon}
                resizeMode="contain"
                className="w-[25px] h-[25px]"
              />
            </View>
            <View className="shrink">
              <Text
                className="text-[16px] font-LexendDecaSemiBold text-[#ccc]"
                style={{
                  color: selectedPayment == index ? "#425466" : "#ccc",
                }}
              >
                {item.name}
              </Text>
              <Text
                className="text-[12px] font-LexendDeca text-[#ccc] leading-[19.5px] shrink"
                style={{
                  color: selectedPayment == index ? "#425466" : "#ccc",
                }}
              >
                {item.description}
              </Text>
            </View>
          </View>

          <View
            className="w-[22px] h-[22px] rounded-[22px] justify-center items-center"
            style={{
              borderColor: selectedPayment == index ? "#16783A" : "#f2f2f2",
              borderWidth: 2,
            }}
          >
            <View
              className="w-[12px] h-[12px] rounded-[12px]"
              style={{
                backgroundColor: selectedPayment == index ? "#16783A" : "",
              }}
            ></View>
          </View>
        </Pressable>
      );
    },
    [selectedPayment],
  );
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
                      {!(subtotal && shippingFee)
                        ? "-"
                        : "₦" + (subtotal + shippingFee)?.toLocaleString()}
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

                {/* <View
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
                </View> */}

                <View
                  className="p-[20px] rounded-[16px] gap-[10px] mb-[10px]"
                  style={{ backgroundColor: "rgba(41, 41, 41, 0.81)" }}
                >
                  <View className="flex-row items-center justify-between">
                    <Text className="text-[18px] text-white font-LexendDecaSemiBold">
                      Payment
                    </Text>
                  </View>
                  <View className="gap-[16px] mt-[10px]">
                    {paymentOptions.map((option: any, index: number) =>
                      renderPaymentOptions(option, index),
                    )}
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
          className={`absolute w-full bottom-[20px] left-0 p-[16px] bg-[#121212] ${!(shippingFee && subtotal) ? "opacity-50" : " "}`}
        >
          <TouchableOpacity
            className="rounded-[5px] items-center justify-center p-[12px] bg-[#16783A] "
            onPress={handlePayOrder}
          >
            {payLoading ? (
              <ActivityIndicator size={"small"} color="white" />
            ) : (
              <Text className="text-white text-[16px] font-LexendDecaMedium">
                {`Pay ₦${(subtotal + shippingFee)?.toLocaleString()}`}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {showPaystack && (
        <Paystack
          refNumber={generateReference()}
          paystackKey="pk_test_4362c6ccfe78d91e6216122d1b36c848fa051362"
          amount={shippingFee! + subtotal}
          billingEmail={user?.email}
          billingName={`${user?.firstName + " " + user?.lastName}`}
          onSuccess={onPaystackSuccess}
          onCancel={onPaystackClose}
          activityIndicatorColor="#16783A"
          autoStart={true}
          metadata={JSON.stringify({
            orderId: orderId,
            buyerId: user?._id,
            transactionType: "order_payment",
            custom_fields: [
              {
                display_name: "Order ID",
                variable_name: "order_id",
                value: orderId,
              },
              {
                display_name: "Buyer ID",
                variable_name: "buyer_id",
                value: user?._id,
              },
              {
                display_name: "Transaction Type",
                variable_name: "transaction_type",
                value: "order_payment",
              },
            ],
          })}
        />
      )}
    </>
  );
};

export default CheckoutSummary;
