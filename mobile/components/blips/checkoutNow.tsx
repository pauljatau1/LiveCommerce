import {
  View,
  Text,
  Pressable,
  TouchableOpacity,
  TextInput,
  BackHandler,
} from "react-native";
import { ActivityIndicator } from "react-native-paper";

import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link, router } from "expo-router";
import { toast } from "@/core/toast";
import { getToken, getUser } from "@/store/features/auth/utils";
import axios from "axios";
import { products, useGetSingleProductQuery } from "@/services/products";
import Entypo from "@expo/vector-icons/Entypo";
import { Image } from "expo-image";
import { Paystack } from "react-native-paystack-webview";
import LoadingModal from "../global/loading-modal";
import { useToast } from "@/contexts/ToastContext";
import {
  AntDesign,
  FontAwesome5,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import { trackEvent } from "@/utils/analytics";
import {
  BottomSheetTextInput,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import BottomSheet from "../global/bottom-sheet";
import SelectRatesSheet from "../orders/selectRatesSheet";

const mockDeliveryOtions = [
  {
    name: "Standard Delivery",
    description: "Guaranteed delivery within 2-4 business days",
    icon: (
      <MaterialCommunityIcons
        name="truck-fast-outline"
        size={24}
        color="white"
      />
    ),
  },
  {
    name: "Store Pickup",
    description:
      "Go to the seller's store and pick up your order, Present your order ID. You can also chat seller to arrange pick ups",
    icon: <MaterialIcons name="storefront" size={24} color="white" />,
  },
];

const paymentOptions = [
  {
    icon: require("../../assets/icons/paystack.png"),
    name: "Paystack",
    description: "Secure payment via card, bank transfer, e-Wallets",
  },
  {
    icon: require("../../assets/icons/wallet.png"),
    name: "Auqli Wallet",
    description: "",
  },
  // {
  //   icon: require("../../assets/icons/cod.png"),
  //   name: "Cash on Delivery",
  //   description: "Pay with cash on Delivery",
  // },
];

interface Props {
  sellerId: string;
  productId: string;
  closeSheet: () => void;
  channel: string;
  streamId?: string;
  blipId: string;
}

const CheckoutNow = ({
  productId,
  sellerId,
  closeSheet,
  channel = "marketplace",
  streamId,
  blipId,
}: Props) => {
  const {
    data: product,
    error,
    isLoading,
    refetch,
    isFetching,
  } = useGetSingleProductQuery(productId);
  // const { popup } = usePaystack();
  const [loading, setLoading] = useState<boolean>(true);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [pickupAddress, setPickupAddress] = useState<any>({});
  const [user, setUser] = useState<any>(null);
  const [cart, setCart] = useState<any[]>([]);
  const [uniqueSellers, setUniqueSellers] = useState<any[]>([]);
  const [selectedDeliveryOpt, setSelectedDeliveryOpt] = useState<number>(0);
  const [cartTotal, setCartTotal] = useState<number>(0);
  const [orderLoading, setOrderloading] = useState<boolean>(false);
  const [deliveryFee, setDeliveryFee] = useState<number | null>(null);
  const [deliveryFeeObject, setDeliveryFeeObject] = useState<any[]>([]);

  const [showPaystack, setShowPaystack] = useState(false);
  const [payLoading, setPayLoading] = useState<boolean>(false);
  const [orderId, setOrderId] = useState<string>("");
  const [selectedPayment, setSelectedPayment] = useState<number>(0);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [shippingFeeLoading, setShippingFeeLoading] = useState<boolean>(false);
  const { show } = useToast();

  const [paystackKey, setPaystackKey] = useState<any>();
  const [fetchedShippingFee, setFetchedShippingFee] = useState<number>(0);
  const [couponCode, setCouponCode] = useState<string>("");
  const [couponMessage, setCouponMessage] = useState<string>("");
  const [couponApplied, setCouponApplied] = useState<any>(null);
  const [couponLoading, setCouponLoading] = useState<boolean>(false);
  const [couponInputFocused, setCouponInputFocused] = useState<boolean>(false);
  const [walletCredit, setWalletCredit] = useState<number>(0);
  const [showWalletCredit, setShowWalletCredit] = useState<boolean>(false);
  const [freeShipping, setFreeShipping] = useState<boolean>(false);
  const [isInternational, setIsInternational] = useState<boolean>(false);
  const [showRatesSheet, setShowRatesSheet] = useState<boolean>(false);
  const [orderTotal, setOrderTotal] = useState<string>("");
  const [rates, setRates] = useState<any[]>([]);

  const eligibleForPickup = useMemo(() => {
    return product?.seller?.shippingInfo?.offersStorePickup;
  }, [product, productId]);

  const getPaystackKey = useCallback(async () => {
    const token = await getToken();
    try {
      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL +
          `api/public/paystack-keys/${process.env.EXPO_PUBLIC_PAYSTACK_CODE || 1122}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setPaystackKey(response.data?.data);
    } catch (e) {
      console.log("error getting keys");
    }
  }, []);

  const generateReference = (): string => {
    const prefix = "ORDER";
    const newReference = `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    return newReference;
  };

  const productTotal = useMemo(() => {
    const price = product?.discount?.isActive
      ? product?.discount?.discountedPrice
      : product?.price;
    return price;
  }, [product]);

  const handleApplyCoupon = async () => {
    if (couponApplied) {
      setCouponApplied(null);
      setCouponCode("");
      setCouponMessage("");
      return;
    }
    setCouponLoading(true);
    try {
      const token = await getToken();
      const response = await axios.post(
        process.env.EXPO_PUBLIC_API_URL + `api/coupons/apply`,
        {
          code: couponCode,
          productId: product?._id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setCouponApplied({
        discount: response.data.product?.discountPercentage,
        discountedPrice: response.data.product?.discountedPrice,
        amountSaved: response.data.product?.savings,
        couponSubTotal: response.data.product?.discountedPrice,
        message: `🎉 Code applied! You saved ₦${response.data.product?.savings}`,
      });
      setCouponMessage(
        `🎉 Code applied! You saved ₦${response.data.product?.savings?.toLocaleString()}`,
      );
    } catch (e: any) {
      console.log("error applying coupon ", e);
      setCouponMessage(
        `⚠️ ${e?.response?.data?.message ? e?.response?.data?.message : "Error Appling Coupon"}`,
      );
      toast.error(
        e?.response?.data?.message
          ? e?.response?.data?.message
          : "Error Appling Coupon",
      );
    } finally {
      setCouponLoading(false);
    }
  };

  const getWalletBalance = async () => {
    try {
      const token = await getToken();
      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL + `api/v2/buyers/wallet/balance`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      setWalletBalance(response.data?.data?.balance);
    } catch (e) {
      console.log("error fetching buyer wallet balance ", e);
    }
  };

  const getAddresses = async () => {
    try {
      const token = await getToken();
      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL + "api/buyer/addresses",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setAddresses(response.data);
      if (response.data.length > 0) {
        const delivery_address = {
          first_name: user?.firstName,
          last_name: user?.lastName,
          email: user?.email,
          phone:
            user?.phoneNumber.replaceAll("-", "")?.length > 14
              ? user.phoneNumber
                  .replaceAll("-", "")
                  ?.replace("+234", "")
                  ?.replace("0", "")
              : user?.phoneNumber.replaceAll("-", ""),
          line1: response.data[0]?.addressLine1,
          state: response.data[0]?.state,
          city: response.data[0]?.city,
          zip: response.data[0]?.zipCode,
          country: response.data[0]?.country,
        };

        setSelectedAddress(delivery_address);
      } else {
        setLoading(false);
        // closeSheet();
        // router.push("/addresses/addAddress");
      }
    } catch (e) {
      console.log("error fetching buyer addresses ", e);
    } finally {
      setLoading(false);
    }
  };

  const getPickupAddress = async () => {
    try {
      const token = await getToken();
      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL + `api/public/sellers/${sellerId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const phoneNumber =
        response.data?.businessInfo.businessNumber ||
        response.data?.personalInfo.phoneNumber;

      const pickup_address = {
        senderName:
          response.data?.personalInfo?.firstName +
          " " +
          response.data?.personalInfo?.lastName,
        senderEmail:
          response.data?.contactInformation?.businessEmail ||
          response.data?.personalInfo?.email,
        senderPhone: phoneNumber?.includes("+")
          ? phoneNumber
          : `+${phoneNumber}`,
        senderAddress:
          response.data.warehouse?.address?.addressLine1 ||
          response.data?.contactInformation?.businessAddress.addressLine1 ||
          response.data?.contactInformation?.sellerAddress.addressLine1,

        pickUpState:
          response.data?.warehouse?.address?.state ||
          response.data?.contactInformation?.businessAddress?.state ||
          response.data?.contactInformation?.sellerAddress?.state,
      };

      setPickupAddress(pickup_address);
      // await getShippingFee(pickup_address?.pickUpState);
    } catch (e) {
      console.log("error fetching buyer addresses ", e);
    }
  };

  // const getShippingFee = async (pickupState = "") => {
  //   const payload = [
  //     {
  //       pickUpState: pickupAddress?.pickUpState,
  //       weight: product?.weight || 0.5,
  //       sellerId,
  //     },
  //   ];

  //   try {
  //     const token = await getToken();
  //     const response = await axios.post(
  //       process.env.EXPO_PUBLIC_API_URL + "api/order/delivery-cost",
  //       {
  //         state: selectedAddress.recipientState,
  //         pickupLocations: payload,
  //         fromCompatibleVersion: true,
  //       },

  //       {
  //         headers: {
  //           Authorization: `Bearer ${token}`,
  //         },
  //       },
  //     );
  //     setDeliveryFeeObject(response.data?.costs);
  //     setFetchedShippingFee(response.data?.totalCost);
  //     setFreeShipping(response.data?.freeShipping);
  //     // setDeliveryFee(response.data?.totalCost);
  //   } catch (e) {
  //     console.log("error fetching delivery fee ", e);
  //     // setDeliveryFeeObject([
  //     //   {
  //     //     sellerId: "682efb3e101c5c0990f06844",
  //     //     pickUpState: "Lagos",
  //     //     weight: 1,
  //     //     cost: 3225,
  //     //     status: "Success",
  //     //     error: null,
  //     //   },
  //     // ]);
  //     // setFetchedShippingFee(3225);
  //   } finally {
  //     setShippingFeeLoading(false);
  //     setLoading(false);
  //   }
  // };

  const handleCompleteOrder = async () => {
    // return setShowPaystack(true);
    if (orderLoading) {
      return;
    }
    if (!selectedAddress) {
      return show({
        text2: "Please add a delivery address",
        type: "info",
        duration: 3000,
        topPosition: 18,
      });
    }

    // if (!deliveryFee && selectedDeliveryOpt == 0 && !freeShipping) {
    //   return show({
    //     text2: "error getting delivery fee",
    //     type: "error",
    //     duration: 3000,
    //     topPosition: 18,
    //   });
    // }

    if (selectedPayment == 1) {
      if (walletBalance < deliveryFee! + productTotal) {
        return show({
          text2: "Insufficient Wallet Balance",
          type: "error",
          duration: 3000,
          topPosition: 18,
        });
      }
    }

    if (deliveryFee! + productTotal > 50000 && selectedPayment == 2) {
      return show({
        text2: "Cash on Delivery is unavailable for orders over ₦50,000",
        type: "info",
        duration: 3000,
        topPosition: 18,
      });
    }

    const order = {
      items: [
        {
          productId: product._id,
          quantity: 1,
          price: product?.discount?.isActive
            ? product?.discount?.discountedPrice
            : couponApplied
              ? couponApplied?.discountedPrice
              : product.price,
          weight: product.weight?.toFixed(0) * 1,
          // seller: {
          //   sellerId: product.seller._id,
          //   senderInfo: pickupAddress,
          //   shippingFee: deliveryFeeObject?.find(
          //     (obj: any) => obj?.sellerId == product.seller?._id,
          //   )?.cost,
          //   parcelInfo: {
          //     itemDescription: product?.name?.slice(0, 199),
          //   },
          // },
          specifications: product.specifications || {
            color: "",
            size: "",
            material: "",
          },
        },
      ],
      shippingAddress: selectedAddress,
      paymentMethod: paymentOptions[selectedPayment]?.name?.toLowerCase(),
      // isItemCod: selectedPayment == 2,
      // shippingFee: deliveryFee,
      // additionalDetails: "Please handle with care",
      // paidFromWallet: selectedPayment == 1,
      // isWalletCredit: walletCredit > 0 ? true : false,
      channel,
      streamId,
      isStorePickup: selectedDeliveryOpt == 1,
    };
    const token = await getToken();
    try {
      setOrderloading(true);
      const config = {
        method: "POST",
        url: process.env.EXPO_PUBLIC_API_URL + `api/v2/orders`,
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        data: order,
      };

      const response = await axios(config);
      if (response.status == 201) {
        setOrderId(response.data.orders[0]?.orderId);
        if (blipId) {
          try {
            const userData = await AsyncStorage.getItem("user");
            const user = JSON.parse(userData || "{}");
            trackEvent("blip_product_purchased", {
              productId: product._id,
              productName: product?.name,
              productPrice: product?.price,
              productImage: product?.images[0]?.url,
              blipId: blipId,
              userId: user?._id,
              email: user?.email,
              firstName: user?.firstName,
              lastName: user?.lastName,
              username: user?.username,
              timestamp: new Date().toISOString(),
            });
          } catch (error) {
            console.error("Error tracking blip product purchased:", error);
          }
        }
      }

      setFreeShipping(response.data?.orders[0]?.isFreeShipping);
      setIsInternational(response.data?.orders[0]?.isInternational);
      setRates(response?.data?.orders?.[0]?.rates);
      setOrderId(response?.data?.orders?.[0]?.orderId);
      setOrderTotal(response?.data?.orders?.[0]?.totalAmount);
      setOrderloading(false);
      setShowRatesSheet(true);
    } catch (e: any) {
      console.log("could not create order", e?.response);
      setOrderloading(false);
      show({
        text2: e?.response?.data?.message || "Could not create order",
        type: "error",
        duration: 3000,
        topPosition: 18,
      });
    }
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
          process.env.EXPO_PUBLIC_API_URL + `api/order/${orderId}/mark-as-paid`,
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        data: payload,
      };

      const response = await axios(config);
      console.log("order payment Response ==> ", response.data);
      closeSheet();

      // Only navigate to orders page if not in a livestream
      if (channel !== "liveshow") {
        return router.push("/(root)/orders/orders");
      } else {
        // For livestream purchases, just show success toast and stay on stream
        show({
          text2: "Order placed successfully!",
          type: "success",
          duration: 3000,
          topPosition: 18,
        });
        return;
      }

      if (response.status == 200) {
        await AsyncStorage.removeItem("order");
        show({
          text2: "Order paid successfully",
          type: "success",
          duration: 3000,
          topPosition: 18,
        });
        router.replace(`/`);
      }
    } catch (e: any) {
      if (e?.response.status == 400) {
        closeSheet();
        show({
          text2: "Order Placed successfully",
          type: "success",
          duration: 3000,
          topPosition: 18,
        });

        // Only navigate to orders page if not in a livestream
        if (!channel || channel !== "liveshow") {
          return router.push("/(root)/orders/orders");
        }
      }
      console.log("could not Pay for  order", e);
      show({
        text2: "Could not Pay for order",
        type: "error",
        duration: 3000,
        topPosition: 18,
      });
    } finally {
      setPayLoading(false);
    }
  };

  const onPaystackClose = () => {
    setShowPaystack(false);
    setPayLoading(false);
    show({
      text2: "Payment Cancelled",
      type: "info",
      duration: 3000,
      topPosition: 18,
    });
  };

  const handleCloseRatesSheet = useCallback(() => {
    setShowRatesSheet(false);
  }, []);

  useEffect(() => {
    if (selectedDeliveryOpt == 0 && fetchedShippingFee) {
      setDeliveryFee(fetchedShippingFee);
    } else {
      setDeliveryFee(0);
    }
  }, [fetchedShippingFee, selectedDeliveryOpt]);

  useEffect(() => {
    async function getUserInfo() {
      const user = await getUser();

      setUser(user);
    }
    getPaystackKey();
    getUserInfo();
    getWalletBalance();

    // getCart();
  }, []);

  useEffect(
    useCallback(() => {
      const onBackPress = () => {
        closeSheet();
        return true;
      };

      BackHandler.addEventListener("hardwareBackPress", onBackPress);

      return () => {
        BackHandler.removeEventListener("hardwareBackPress", onBackPress);
      };
    }, []),
  );

  // useEffect(() => {
  //   if (orderId) {
  //     if (selectedPayment == 0) {
  //       setTimeout(() => {
  //         setShowPaystack(true);
  //       }, 500);
  //     } else if (selectedPayment == 2) {
  //       closeSheet();
  //       show({
  //         text2: "Order Placed successfully",
  //         type: "success",
  //         duration: 3000,
  //         topPosition: 18,
  //       });
  //       if (channel !== "liveshow") {
  //         router.push("/(root)/orders/orders");
  //       }
  //     } else {
  //       closeSheet();
  //       show({
  //         text2: "Order Placed successfully",
  //         type: "success",
  //         duration: 3000,
  //         topPosition: 18,
  //       });
  //       if (channel !== "liveshow") {
  //         router.push("/(root)/orders/orders");
  //       }
  //     }
  //     setOrderloading(false);
  //   }
  // }, [orderId]);

  useEffect(() => {
    if (user) {
      getAddresses();
      getPickupAddress();
    }
  }, [user]);

  // useEffect(() => {
  //   if (
  //     selectedAddress?.recipientState &&
  //     product?._id &&
  //     pickupAddress?.pickUpState
  //   ) {
  //     getShippingFee();
  //   }
  // }, [selectedAddress, pickupAddress, product]);

  useEffect(() => {
    if (product?._id) {
      setCart(product);
    }
  }, [products]);

  useEffect(() => {
    if (selectedPayment == 1 || walletBalance == 0) {
      setShowWalletCredit(false);
      setWalletCredit(0);
      return;
    }

    const orderTotal = productTotal
      ? deliveryFee +
        (couponApplied ? couponApplied?.couponSubTotal : productTotal)
      : null;

    if (!orderTotal) {
      return;
    }

    if (walletBalance < orderTotal - 100) {
      setShowWalletCredit(true);
    }
  }, [
    productTotal,
    deliveryFee,
    couponApplied,
    selectedDeliveryOpt,
    selectedPayment,
    freeShipping,
  ]);

  const renderPaymentOptions = useCallback(
    (item: any, index: number) => {
      if (selectedDeliveryOpt == 1 && index == 2) return null;
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
                backgroundColor:
                  index !== 0 && index !== selectedPayment
                    ? "#CFCFCF"
                    : "#ffffff",
              }}
            >
              <Image
                source={item.icon}
                contentFit="contain"
                style={{
                  width: 25,
                  height: 25,
                }}
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
                {index == 1
                  ? "₦" +
                    walletBalance?.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
                  : item.description}
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
    [selectedPayment, walletBalance, selectedDeliveryOpt],
  );

  // useEffect(() => {
  //   if (showPaystack) {
  //     popup.checkout({
  //       email: user?.email,
  //       amount:
  //         selectedDeliveryOpt == 0
  //           ? deliveryFee! +
  //             (couponApplied ? couponApplied?.couponSubTotal : productTotal) -
  //             walletCredit
  //           : couponApplied
  //             ? couponApplied?.couponSubTotal - walletCredit
  //             : productTotal - walletCredit,
  //       reference: generateReference(),
  //       metadata: {
  //         orderId: orderId,
  //         buyerId: user?._id,
  //         transactionType: "order_payment",
  //         custom_fields: [
  //           {
  //             display_name: "Order ID",
  //             variable_name: "order_id",
  //             value: orderId,
  //           },
  //           {
  //             display_name: "Buyer ID",
  //             variable_name: "buyer_id",
  //             value: user?._id,
  //           },
  //           {
  //             display_name: "Transaction Type",
  //             variable_name: "transaction_type",
  //             value: "order_payment",
  //           },
  //         ],
  //       },
  //       onSuccess: onPaystackSuccess,
  //       onCancel: onPaystackClose,
  //       onLoad: (res) => console.log("WebView Loaded:", res),
  //       onError: (err) => console.log("WebView Error:", err),
  //     });
  //   }
  // }, [
  //   showPaystack,
  //   selectedDeliveryOpt,
  //   deliveryFee,
  //   couponApplied,
  //   productTotal,
  //   walletCredit,
  //   user,
  // ]);
  return (
    <View className="p-[8px] pb-[16px]">
      <BottomSheetScrollView
        className="bg-[#121212]"
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator size={"small"} color={"#fff"} />
        ) : (
          <>
            {addresses?.length < 1 ? (
              <View className="items-center justify-center gap-[20px] my-[60px]">
                <Text className=" text-[#ccc] text-[12px] self-center font-LexendDeca">
                  You have not added any addresses
                </Text>
                <Pressable
                  className="rounded-[50px] px-[20px] py-[8px] bg-[#16783A]"
                  onPress={() => {
                    closeSheet();
                    router.push("/addresses/addAddress");
                  }}
                >
                  <Text className="font-LexendDecaMedium text-[11px] text-[#fff]">
                    Add an address
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View>
                <View className="w-full flex-row items-center justify-between mb-[10px]">
                  <Text></Text>
                  <Pressable onPress={closeSheet} className="flex-end">
                    <AntDesign name="close" size={20} color="white" />
                  </Pressable>
                </View>

                <View className=" gap-[30px] pb-[20px]">
                  {/* {freeShipping && (
                    <View className="justify-center items-center flex-row px-[16px] py-[10px] gap-[8px] mb-[8px] bg-[#16783a]">
                      <FontAwesome5 name="truck" size={14} color="white" />
                      <Text className="font-LexendDeca text-[12px] text-[#ffffff]">
                        Free Shipping on All Orders!
                      </Text>
                    </View>
                  )} */}
                  <TouchableOpacity
                    className="p-[20px] rounded-[16px] flex-row items-center justify-between"
                    style={{ backgroundColor: "rgba(41, 41, 41, 0.81)" }}
                    onPress={() => {
                      closeSheet();
                      router.push("/settings/addresses");
                    }}
                  >
                    <View className="flex-row gap-[16px] shrink">
                      <View className="w-[23px] h-[23px] rounded-full bg-[#B190B6] flex-row items-center justify-center">
                        <Text className="text-white text-[9px]">
                          {user?.firstName?.split("")[0]}
                        </Text>
                        <Text className="text-white text-[9px]">
                          {user?.lastName?.split("")[0]}
                        </Text>
                      </View>
                      <View className="gap-[18px] shrink">
                        <Text className="text-[#ccc] text-[16px] font-LexendDecaMedium">
                          {user?.firstName + " " + user?.lastName}
                        </Text>
                        {selectedAddress ? (
                          <View>
                            <Text className="text-[#ccc] text-[10px] font-LexendDecaMedium mb-[4px]">
                              {selectedAddress && selectedAddress?.line1}
                            </Text>
                            <Text className="text-[#ccc] text-[10px] font-LexendDecaMedium">
                              Country: Nigeria
                            </Text>
                          </View>
                        ) : (
                          <Text className="text-[#ccc] text-[10px] font-LexendDecaMedium">
                            Click to add address
                          </Text>
                        )}
                      </View>
                    </View>
                    <View>
                      <Entypo
                        name="chevron-right"
                        size={16}
                        color="rgba(204, 204, 204, 0.8)"
                      />
                    </View>
                  </TouchableOpacity>

                  <CartItem cartItem={product} />

                  <View className="gap-[8px] mb-[10px]">
                    <Text className="text-[16px] text-[#ccc] font-LexendDecaSemiBold underline">
                      Auqli Buyer Protection
                    </Text>
                    <Text className="text-[12px] text-[#ccc] font-LexendDecaLight leading-[18px]">
                      Protect your orders from theft, damages up to 30 days
                      after receiving it{" "}
                      {/* <Link href={"/"} className="text-[#49A3F6]">
                  Learn More
                </Link> */}
                    </Text>
                  </View>

                  <View className="gap-[20px] mb-[10px]">
                    <Text className="text-[#CCC] text-[18px] leading-[20px] font-LexendDecaSemiBold underline">
                      Delivery Options
                    </Text>
                    {mockDeliveryOtions?.map((item: any, index: number) => (
                      <View key={index}>
                        <Pressable
                          className="p-[20px] rounded-[16px] flex-row items-center justify-between gap-[10px]"
                          style={{
                            backgroundColor: "rgba(41, 41, 41, 0.81)",
                            opacity: !eligibleForPickup && index == 1 ? 0.5 : 1,
                          }}
                          key={index}
                          onPress={() => {
                            if (!eligibleForPickup && index == 1) {
                              return;
                            }
                            setSelectedDeliveryOpt(index);
                          }}
                        >
                          <View className="flex-row gap-[16px] shrink items-center">
                            {item?.icon}
                            <View className="gap-[4px] shrink">
                              <Text className="text-[#ccc] text-[18px] font-LexendDecaSemiBold">
                                {item.name}
                              </Text>
                              <View className="gap-[2px]">
                                <Text className="text-[#ccc] text-[10px] font-LexendDeca whitespace-nowrap leading-[16px]">
                                  {item?.description}
                                </Text>
                              </View>
                            </View>
                          </View>
                          <View
                            className="w-[22px] h-[22px] rounded-[22px] justify-center items-center"
                            style={{
                              borderColor:
                                selectedDeliveryOpt == index
                                  ? "#16783A"
                                  : "#f2f2f2",
                              borderWidth: 2,
                            }}
                          >
                            <View
                              className="w-[12px] h-[12px] rounded-[12px]"
                              style={{
                                backgroundColor:
                                  selectedDeliveryOpt == index ? "#16783A" : "",
                              }}
                            ></View>
                          </View>
                        </Pressable>
                        {!eligibleForPickup && index == 1 && (
                          <Text className="text-[12px] font-LexendDecaMedium text-[#fefefe] ml-[4px] mt-[6px] opacity-50">
                            * This seller does not offer store pickup
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>

                  <View
                    className="p-[20px] rounded-[16px] gap-[10px] mb-[10px]"
                    style={{ backgroundColor: "rgba(41, 41, 41, 0.81)" }}
                  >
                    <View className="flex-row items-center justify-between">
                      <Text className="text-[18px] text-white font-LexendDecaSemiBold">
                        Select Payment methods
                      </Text>
                      {/* <Pressable>
                  <Text className="text-[#16783A] text-[12px]">Edit</Text>
                </Pressable> */}
                    </View>
                    <View className="gap-[16px] mt-[10px]">
                      {paymentOptions.map((option: any, index: number) =>
                        renderPaymentOptions(option, index),
                      )}
                    </View>
                  </View>

                  {/* {showWalletCredit && (
                    <TouchableOpacity
                      className="mb-[1px]"
                      style={{
                        marginBottom: 0,
                      }}
                      onPress={() =>
                        walletCredit > 0
                          ? setWalletCredit(0)
                          : setWalletCredit(walletBalance)
                      }
                    >
                      <View
                        className={`rounded-[10px] ${walletCredit > 0 ? "border-[#16783A]" : "border-[#cccccc25]"} border-[1px] px-[18px] flex-row items-center justify-between gap-[6px] py-[14px] `}
                      >
                        <View className="flex-row items-center gap-[10px]">
                          <View>
                            <AntDesign
                              name="checkcircle"
                              size={20}
                              color={walletCredit > 0 ? "#16783A" : "#cccccc"}
                            />
                          </View>
                          <Text
                            className="font-LexendDecaMedium text-[14px] text-[#f2f2f2] shrink"
                            numberOfLines={1}
                          >
                            Apply Auqli Credit
                          </Text>
                        </View>
                        <Text className="font-LexendDecaMedium text-[14px] text-[#f2f2f2]">
                          ₦{walletBalance?.toLocaleString()}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )} */}

                  <View className="mb-[10px]">
                    <View
                      className={`rounded-[10px] ${couponInputFocused ? "border-[#16783A]" : "border-[#cccccc25]"} border-[1px] px-[18px] flex-row items-center justify-between gap-[6px] `}
                    >
                      <BottomSheetTextInput
                        placeholder="Enter Promo Code"
                        placeholderTextColor={"rgb(204, 204, 204)"}
                        className={`${couponApplied ? "text-[#cccccc25]" : "text-white"} text-[14px] font-LexendDeca py-[15px] w-[100%] shrink`}
                        onChangeText={(text) => setCouponCode(text)}
                        value={couponCode}
                        onFocus={() => setCouponInputFocused(true)}
                        onBlur={() => setCouponInputFocused(false)}
                        readOnly={couponApplied !== null}
                        autoCapitalize="characters"
                      />
                      {couponLoading ? (
                        <ActivityIndicator size={16} color="#fff" />
                      ) : (
                        <Pressable onPress={handleApplyCoupon}>
                          {couponApplied ? (
                            <AntDesign
                              name="closecircle"
                              size={18}
                              color="#fff"
                            />
                          ) : (
                            <Text
                              className={`${couponCode ? "text-[#16783A]" : "text-[#cccccc80]"} text-[14px] font-LexendDecaMedium`}
                            >
                              APPLY
                            </Text>
                          )}
                        </Pressable>
                      )}
                    </View>
                    {couponMessage && (
                      <Text className="text-[12px] font-LexendDeca text-[#fff] mt-[6px] ml-[4px]">
                        {couponMessage}
                      </Text>
                    )}
                  </View>

                  <View
                    className="p-[20px] rounded-[10px] gap-[10px]"
                    style={{ backgroundColor: "rgba(41, 41, 41, 0.81)" }}
                  >
                    <View className="flex-row justify-between items-center">
                      <Text className="text-white text-[14px] font-LexendDeca shrink">
                        Merchandise Subtotal
                      </Text>
                      <Text className="text-[#fff] text-[14px] font-LexendDecaSemiBold">
                        ₦
                        {productTotal?.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </Text>
                    </View>
                    {couponApplied && (
                      <View className="flex-row justify-between items-center">
                        <Text className="text-white text-[14px] font-LexendDeca shrink">
                          Coupon Code Applied
                        </Text>
                        <Text className="text-[#16783A] text-[14px] font-LexendDecaSemiBold">
                          - ₦
                          {couponApplied?.amountSaved?.toLocaleString(
                            undefined,
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            },
                          )}
                        </Text>
                      </View>
                    )}
                    {walletCredit > 0 && (
                      <View className="flex-row justify-between items-center">
                        <Text className="text-white text-[14px] font-LexendDeca shrink">
                          Auqli Credit Applied
                        </Text>
                        <Text className="text-[#16783A] text-[14px] font-LexendDecaSemiBold">
                          - ₦
                          {walletCredit?.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </Text>
                      </View>
                    )}
                    {/* <View className="flex-row justify-between items-center">
                      <Text className="text-white text-[14px] font-LexendDecaSemiBold shrink">
                        Shipping Fee
                      </Text>
                      {shippingFeeLoading ? (
                        <ActivityIndicator size={10} color="white" />
                      ) : (
                        <Text className="text-[#16783A] text-[14px] font-LexendDecaSemiBold">
                          {deliveryFee
                            ? "₦" +
                              deliveryFee?.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })
                            : freeShipping
                              ? "FREE"
                              : "-"}
                        </Text>
                      )}
                    </View> */}
                    <View className="flex-row justify-between items-center">
                      <Text className="text-white text-[14px] font-LexendDeca shrink">
                        Total
                      </Text>
                      {shippingFeeLoading ? (
                        <ActivityIndicator size={10} color="white" />
                      ) : (
                        <Text className="text-[#fff] text-[14px] font-LexendDecaSemiBold">
                          {productTotal
                            ? "₦" +
                              (
                                (couponApplied
                                  ? couponApplied?.couponSubTotal
                                  : productTotal) - walletCredit
                              )?.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })
                            : "-"}
                        </Text>
                      )}
                    </View>
                  </View>

                  <TouchableOpacity
                    className="rounded-[15px] items-center justify-center px-[12px] h-[50px] bg-[#16783A]"
                    onPress={() => handleCompleteOrder()}
                  >
                    {orderLoading ? (
                      <ActivityIndicator size={"small"} color="white" />
                    ) : (
                      <Text className="text-white text-[16px] font-LexendDecaMedium">
                        Continue
                        {/* (
                        {productTotal
                          ? "₦" +
                            (
                              (couponApplied
                                ? couponApplied?.couponSubTotal
                                : productTotal) - walletCredit
                            )?.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })
                          : "-"}
                        ) */}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        )}
      </BottomSheetScrollView>

      <BottomSheet
        bgColor="#121212"
        childrenStyle="!px-[0px]"
        showCloseIcon={false}
        title=""
        show={showRatesSheet}
        titleColor="!text-white"
        onRequestClose={() => setShowRatesSheet(false)}
        keyboardBehavior="extend"
      >
        <SelectRatesSheet
          rates={rates}
          orderId={orderId}
          orderTotal={orderTotal}
          userEmail={selectedAddress?.email || user?.email}
          fromSheet={true}
          paymentMethod={paymentOptions[selectedPayment]?.name?.toLowerCase()}
          closeSheet={handleCloseRatesSheet}
          isInternational={isInternational}
          isFreeShipping={freeShipping}
          isStorePickup={selectedDeliveryOpt == 1}
        />
      </BottomSheet>
      {/* <LoadingModal isVisible={orderLoading} />
      {showPaystack && (
        <Paystack
          refNumber={generateReference()}
          paystackKey={paystackKey?.publicKey}
          amount={
            selectedDeliveryOpt == 0
              ? deliveryFee! +
                (couponApplied ? couponApplied?.couponSubTotal : productTotal) -
                walletCredit
              : couponApplied
                ? couponApplied?.couponSubTotal - walletCredit
                : productTotal - walletCredit
          }
          channels={[
            "card",
            "bank",
            "ussd",
            "qr",
            "mobile_money",
            "bank_transfer",
            "apple_pay",
          ]}
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
      )} */}
    </View>
  );
};

const CartItem = memo(({ cartItem }: { cartItem: any }) => {
  const [quantity, setQuantity] = useState<number>(1);

  const totalPrice = useMemo(() => {
    const price = cartItem?.discount?.isActive
      ? cartItem?.discount?.discountedPrice
      : cartItem?.price;
    return price * 1;
  }, [cartItem]);

  return (
    <View className=" py-[14px]">
      <View className="gap-[16px] shrink">
        <View className=" flex-row items-center justify-between">
          <Text className="text-[16px] text-white font-LexendDecaSemiBold">
            {cartItem?.seller?.businessName ||
              cartItem?.seller?.storeInfo?.storeName}
          </Text>
        </View>
        <View className="flex-row gap-[16px] ">
          <Image
            source={{ uri: cartItem?.images?.[0]?.url }}
            contentFit="cover"
            style={{
              width: 100,
              height: 100,
              borderRadius: 12,
            }}
          />
          <View className="gap-[6px] relative shrink">
            <Text
              className="text-[14px] text-[#ffffff] opacity-80 font-LexendDeca  leading-[20px]"
              numberOfLines={2}
            >
              {cartItem?.name}
            </Text>
            <Text className="text-white opacity-80 font-LexendDecaMedium tracking-wide  text-[16px]">
              ₦
              {cartItem?.discount?.isActive
                ? cartItem?.discount?.discountedPrice?.toLocaleString() || 0
                : cartItem?.price?.toLocaleString()}
              {"  "}
              {cartItem?.discount?.isActive && (
                <Text className="text-[11px] text-[#16783A] font-LexendDecaBold">
                  {cartItem?.discount?.value}
                  {cartItem?.discount?.type == "percentage" && "%"} off
                </Text>
              )}
            </Text>
            {/* <Text className="text-[12px] text-[#F2F2F2] font-LexendDecaLight">
              Item ID: {cartItem?._id?.toLocaleString()}
            </Text> */}
            {(cartItem?.seller?.offersStorePickup ||
              cartItem?.seller?.shippingInfo?.offersStorePickup) && (
              <View className=" p-[4px] px-[8px] bg-[#1683da33] items-center justify-center self-start rounded-[10px]">
                <Text className="text-[8px] text-[#1683da] font-LexendDeca">
                  Store Pickup Available
                </Text>
              </View>
            )}
            <View
              className="flex-row items-center justify-between gap-[8px] flex-wrap w-full"
              style={{
                marginTop: "auto",
              }}
            >
              <Text className="text-white text-[12px] font-LexendDecaMedium">
                Total:{" "}
                <Text className="text-[16px] text-[#fff] font-LexendDecaSemiBold">
                  ₦{totalPrice.toLocaleString()}
                </Text>
              </Text>
              <Text className="text-white text-[11px] font-LexendDecaMedium">
                Qty: {quantity}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
});

export default memo(CheckoutNow);
