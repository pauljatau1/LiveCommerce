import { View, Text, Pressable, StyleSheet } from "react-native";
import React, { memo, useCallback, useState } from "react";
import { toast as sonnerToast } from "sonner-native";
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { getToken } from "@/store/features/auth/utils";
import axios from "axios";
import { router } from "expo-router";
import CallPaystack from "@/app/(root)/checkout/callPaystack";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import LoadingModal from "../global/loading-modal";
import { Image } from "expo-image";

const rates = [
  {
    amount: 14000,
    carrier_id: "loYZh5J47D6gJUKOExXeO1RLcMARScLi",
    carrier_logo:
      "https://ucarecdn.com/dcdd8109-af8c-4057-8104-192be821dd6e/download4.png",
    carrier_name: "DHL Express",
    carrier_rate_description: "EXPRESS 12:00 DOC",
    currency: "NGN",
    delivery_time: "Within 5 days.",
    id: "bQVMwQZndHbIq6PQD5oiaGWxetLCXGkp",
    includes_insurance: false,
    insurance_coverage: 0,
    insurance_fee: 0,
    metadata: {},
    pickup_time: "Tue Jul 13 2021 before 17:00 GMT",
    rate_id: "RT-30798955894",
    shipment: "RAl6LhWojcnJtlojLcw4XWgSpjBsjF38",
    created_at: "2021-07-13T20:25:53.011Z",
    updated_at: "2021-07-13T20:25:53.011Z",
  },
  {
    amount: 12500,
    carrier_id: "hWiA1ZLw3SIr3VeCEbUKpjqVsijHrNjZ",
    carrier_logo:
      "https://ucarecdn.com/c2d4dcb2-1483-47a5-ab14-447a990f5827/60dc7947195c0078fabff349_1200pxUnited_Parcel_Service_logo_2014svg.png",
    carrier_name: "United Parcel Services",
    carrier_rate_description: "",
    currency: "NGN",
    delivery_time:
      "Delivery within 1, 2, or 3 days based on where your package started and where it’s being sent.",
    id: "eDcN2a86N5OdWp3rzJLF2qoovG2BqLkC",
    includes_insurance: false,
    insurance_coverage: 0,
    insurance_fee: 0,
    metadata: {},
    pickup_time: "Tue Jul 13 2021 before 17:00 GMT",
    rate_id: "RT-97421991024",
    shipment: "RAl6LhWojcnJtlojLcw4XWgSpjBsjF38",
    created_at: "2021-07-13T20:25:53.011Z",
    updated_at: "2021-07-13T20:25:53.011Z",
  },
  {
    amount: 11000,
    carrier_id: "xOkhPcycBm75msJ8l6BU81vWRaA3p0tp",
    carrier_logo:
      "https://ucarecdn.com/3273a236-bd33-4c37-9f87-2bcf4e59275f/6035307b31150075cabc780d_EeNJnpVz_400x400.jpg",
    carrier_name: "Sendbox",
    carrier_rate_description: "Standard Delivery",
    currency: "NGN",
    delivery_time: "Between 5 - 7 business days.",
    id: "A7c64epPiVyz2NZ5Cs3uNWuPznXUKFwj",
    includes_insurance: false,
    insurance_coverage: 0,
    insurance_fee: 0,
    metadata: {},
    pickup_time: "Between 12 - 24 hours",
    rate_id: "RT-49826156746",
    shipment: "RAl6LhWojcnJtlojLcw4XWgSpjBsjF38",
    created_at: "2021-07-13T20:25:53.011Z",
    updated_at: "2021-07-13T20:25:53.011Z",
  },
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const SelectRatesSheet = (props: any) => {
  const { user } = useSelector((state: RootState) => state?.authState);
  const { openPaystackPopup } = CallPaystack();
  const [selectedRate, setSelectedRate] = useState<any>(
    props?.rates[0] || rates[0],
  );
  const [loading, setLoading] = useState<boolean>(false);

  const payBtnScale = useSharedValue(1);

  const payBtnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: payBtnScale.value }],
  }));

  const generateReference = () => {
    const prefix = "ORDER";
    const newReference = `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    return newReference;
  };

  const handlePay = () => {
    if (props?.paymentMethod == "paystack") {
      try {
        openPaystackPopup({
          email: props?.userEmail,
          amount: props?.orderTotal + selectedRate?.amount,
          reference: generateReference(),
          metadata: {
            orderId: props?.orderId,
            buyerId: user?._id,
            transactionType: "order_payment",
            custom_fields: [
              {
                display_name: "Order ID",
                variable_name: "order_id",
                value: props?.orderId,
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
          },
          onSuccess: onPaystackSuccess,
          onCancel: onPaystackClose,
          onLoad: (res: any) => console.log("Paystack WebView Loaded:", res),
          onError: (err: any) =>
            sonnerToast.info(
              "We had a problem initiating payment. Please Try Again.",
            ),
        });
      } catch (e) {
        console.log("Paystack error ", e);
        sonnerToast.info(
          "We had a problem initiating payment. Please Try Again.",
        );
      }
    }
  };

  const onPaystackSuccess = (paystackResponse: any) => {
    const paystackReference = paystackResponse?.reference;

    console.log("Paystack payment succesful ", paystackReference);

    payForOrder(paystackReference);
  };

  const onPaystackClose = () => {
    sonnerToast.info("Payment Cancelled");
  };

  const payForOrder = useCallback(async (reference: string) => {
    setLoading(true);
    try {
      const token = await getToken();
      const data = {
        carrier: selectedRate,
        paymentDetails: {
          method: props?.paymentMethod,
          reference: props?.paymentMethod == "paystack" ? reference : null,
        },
      };
      const config = {
        method: "POST",
        url:
          process.env.EXPO_PUBLIC_API_URL +
          `api/v2/orders/${props?.orderId}/pay`,
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        data,
      };

      const response = await axios(config);

      if (response?.data?.paid) {
        sonnerToast.success("Order Placed Successfully", {
          position: "top-center",
          richColors: true,
        });
      }

      setLoading(false);
      props?.fromSheet
        ? router?.push("/orders/orders")
        : router?.replace("/orders/orders");
      props?.closeSheet();
    } catch (e) {
      setLoading(false);
      console.log("error paying for order ", e);
      sonnerToast.error("Failed to Create Order", {
        position: "top-center",
        richColors: true,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const renderRateCard = useCallback(
    ({ rate, index }: any) => {
      return (
        <AnimatedPressable
          key={rate?.carrier_id || rate?._id || index}
          style={[
            {
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              padding: 8,
              borderRadius: 14,
              borderColor: selectedRate?.id == rate?.id ? "#16783A" : "#2e2e2e",
              borderWidth: 1,
            },
          ]}
          onPress={() => setSelectedRate(rate)}
        >
          <View className="flex-row items-center gap-[12px]">
            <Image
              source={{ uri: rate?.carrier_logo }}
              style={{
                width: 50,
                height: 50,
                borderRadius: 12,
              }}
              contentFit="cover"
            />
            <View className="gap-[4px]">
              <Text className="font-LexendDeca text-[12px] text-white">
                {rate?.carrier_name}
              </Text>
              <Text className="font-LexendDecaMedium text-[16px] text-white">
                ₦{rate?.amount?.toLocaleString()}
              </Text>
            </View>
          </View>
          <View
            style={{
              borderColor: selectedRate?.id == rate?.id ? "#16783A" : "#2e2e2e",
              borderWidth: 1,
              width: 20,
              height: 20,
              borderRadius: 20,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {selectedRate?.id == rate?.id && (
              <Animated.View
                entering={FadeIn.duration(300).easing(
                  Easing.inOut(Easing.quad),
                )}
                style={{
                  backgroundColor: "#16783A",
                  width: 15,
                  height: 15,
                  borderRadius: 15,
                }}
              ></Animated.View>
            )}
          </View>
        </AnimatedPressable>
      );
    },
    [props?.rates, selectedRate],
  );

  return (
    <View className="p-[12px]">
      <View className="gap-[10px] mb-[30px]">
        {props?.rates?.length > 0
          ? props?.rates?.map((rate: any, index: number) =>
              renderRateCard({ rate, index }),
            )
          : rates?.map((rate: any, index: number) =>
              renderRateCard({ rate, index }),
            )}
      </View>
      {selectedRate && (
        <View className="flex-row items-center justify-between mb-[10] mx-[6]">
          <Text className="text-white text-[14px] font-LexendDeca">Total</Text>
          <Text className="text-white text-[14px] font-LexendDeca">
            ₦
            {(props?.orderTotal + selectedRate?.amount)?.toLocaleString(
              undefined,
              {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              },
            )}
          </Text>
        </View>
      )}

      <AnimatedPressable
        disabled={!selectedRate}
        onPressIn={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          payBtnScale.value = withTiming(0.98, {
            duration: 100,
            easing: Easing.out(Easing.ease),
          });
        }}
        onPressOut={() => {
          payBtnScale.value = withTiming(
            1,
            {
              duration: 100,
            },

            () => runOnJS(handlePay)(),
          );
        }}
        style={[
          payBtnStyle,
          {
            height: 55,
            borderRadius: 14,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: selectedRate ? "#16783A" : "#C6C6C6",
            opacity: selectedRate ? 1 : 0.8,
            marginHorizontal: 6,
          },
        ]}
      >
        <Text className="font-LexendDecaMedium text-[14px] text-white">
          Pay
        </Text>
      </AnimatedPressable>
      <LoadingModal isVisible={loading} />
    </View>
  );
};

export default memo(SelectRatesSheet);
