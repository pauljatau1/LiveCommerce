import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Dimensions,
  Pressable,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { ActivityIndicator } from "react-native-paper";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, router } from "expo-router";
import Entypo from "@expo/vector-icons/Entypo";
import { FocusAwareStatusBar } from "@/components/ui/focus-aware-status-bar";
import { getToken, getUser } from "@/store/features/auth/utils";
import axios from "axios";
import AntDesign from "@expo/vector-icons/AntDesign";
import Ionicons from "@expo/vector-icons/Ionicons";
import BouncyCheckbox from "react-native-bouncy-checkbox";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { TextInput } from "react-native-gesture-handler";
import { data } from "@/constants";
import { toast } from "@/core/toast";
import LoadingModal from "@/components/global/loading-modal";
import BottomSheet from "@/components/global/bottom-sheet";
import { useIsFocused } from "@react-navigation/native";
import { Paystack } from "react-native-paystack-webview";
import OrderPopup from "@/components/global/orders/order-popup";
import { useSelector } from "react-redux";
import { RootState } from "@/store";

const { width, height } = Dimensions.get("window");

const mockDeliveryOtions = [
  {
    name: "Standard Delivery",
    description: "Guaranteed delivery within 2-4 business days",
  },
];

const paymentOptions = [
  {
    icon: require("../../../assets/icons/paystack.png"),
    name: "Paystack",
    description: "Secure payment via card, bank transfer, e-Wallets",
  },
  {
    icon: require("../../../assets/icons/wallet.png"),
    name: "Auqli Wallet",
    description: "",
  },
  {
    icon: require("../../../assets/icons/cod.png"),
    name: "Cash on Delivery",
    description: "Pay with cash on Delivery",
  },
];

const Checkout = () => {
  const isFocused = useIsFocused();
  const token = useSelector((state: RootState) => state.authState.token);
  const [loading, setLoading] = useState<boolean>(true);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [pickupAddress, setPickupAddress] = useState<any>({});
  const [user, setUser] = useState<any>(null);
  const [cart, setCart] = useState<any[]>([]);
  const [uniqueSellers, setUniqueSellers] = useState<any[]>([]);
  const [selectedDeliveryOpt, setSelectedDeliveryOpt] = useState<any>(
    mockDeliveryOtions[0],
  );
  const [cartTotal, setCartTotal] = useState<number>(0);
  const [orderLoading, setOrderloading] = useState<boolean>(false);
  const [deliveryFee, setDeliveryFee] = useState<number | null>(null);
  const [deliveryFeeObject, setDeliveryFeeObject] = useState<any[]>([]);

  const [showPaystack, setShowPaystack] = useState(false);
  const [payLoading, setPayLoading] = useState<boolean>(false);
  const [orderId, setOrderId] = useState<string>("");

  const [showAddressSheet, setShowAddressSheet] = useState<boolean>(false);
  const [selectedPayment, setSelectedPayment] = useState<number>(0);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [totalWalletBalance, setTotalWalletBalance] = useState<number>(0);
  const [isSuccessVisible, setIsSuccessVisible] = useState<boolean>(false);
  const [shippingFeeLoading, setShippingFeeLoading] = useState<boolean>(true);

  const [paystackKey, setPaystackKey] = useState<any>();

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
      console.log(response.data?.data?.publicKey);
      setPaystackKey(response.data?.data);
    } catch (e) {
      console.log("error getting keys");
    }
  }, []);

  const closeSuccessPopup = useCallback(
    (form: string) => {
      setIsSuccessVisible(false);
      if (form == "home") {
        router.replace("/(root)/(tabs)/home/home");
      } else {
        router.replace("/(root)/orders/orders");
      }
    },
    [isSuccessVisible],
  );

  const handleSelectAddress = (address: any) => {
    const delivery_address = {
      recipientName: user.firstName + " " + user.lastName,
      recipientEmail: user.email,
      recipientPhone:
        user.phoneNumber.replaceAll("-", "")?.length > 14
          ? user.phoneNumber
              .replaceAll("-", "")
              ?.replace("+234", "")
              ?.replace("0", "")
          : user.phoneNumber.replaceAll("-", ""),
      recipientAddress: address.addressLine1,
      recipientState: address.state,
    };
    setSelectedAddress(delivery_address);
    setShowAddressSheet(false);
  };
  const handleCalculateTotal = () => {
    let total = 0;
    let cartLength = 0;
    cart?.forEach((item: any) => {
      if (item.includeInOrder) {
        const price = item.discount?.isActive
          ? item.discount?.discountedPrice
          : item.price;
        total += price * item.quantity;
        cartLength += 1;
      }
    });
    setCartTotal(total);
  };

  const getWalletBalance = async () => {
    try {
      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL + `api/buyer/wallet/balance`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      console.log("wallet ", response.data);

      setWalletBalance(
        response.data?.availableBalance || response.data?.balance,
      );
      setTotalWalletBalance(response.data?.balance);
    } catch (e) {
      console.log("error fetching buyer wallet balance ", e);
    }
  };
  const getAddresses = async () => {
    try {
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
          recipientName: user.firstName + " " + user.lastName,
          recipientEmail: user.email,
          recipientPhone:
            user.phoneNumber.replaceAll("-", "")?.length > 14
              ? user.phoneNumber
                  .replaceAll("-", "")
                  ?.replace("+234", "")
                  ?.replace("0", "")
              : user.phoneNumber.replaceAll("-", ""),
          recipientAddress: response.data[0].addressLine1,
          recipientState: response.data[0].state,
        };

        setSelectedAddress(delivery_address);
        // await getShippingFee();
      } else {
        router.replace({
          pathname: "/addresses/addAddress",
          params: { prevRoute: "checkout" },
        });
      }
    } catch (e) {
      console.log("error fetching buyer addresses ", e);
    } finally {
      setLoading(false);
    }
  };

  const getCart = async () => {
    try {
      const cart = await AsyncStorage.getItem("cart");
      const filteredCart = JSON.parse(cart!).filter(
        (item: any) => item.includeInOrder,
      );
      setCart(filteredCart);

      const sellerObj = {} as any;
      filteredCart.forEach((cart: any) => {
        if (sellerObj[cart.seller._id]) {
          return;
        }
        console.log("seller cart info", cart?.seller);

        const phoneNumber =
          cart.seller.businessInfo?.businessNumber ||
          cart.seller.phoneNumber ||
          cart.seller.shippingInfo?.warehouseDetails?.contactNumber ||
          cart.seller.personalInfo?.phoneNumber;

        const pickup_address = {
          first_name:
            cart.seller.personalInfo?.firstName || cart.seller.firstName,
          last_name: cart.seller.personalInfo?.lastName || cart.seller.lastName,
          email:
            cart.seller.businessInfo?.businessEmail ||
            cart.seller.personalInfo?.email ||
            cart?.seller?.email,
          phone: phoneNumber?.includes("+") ? phoneNumber : `+${phoneNumber}`,
          line1:
            cart.seller.businessInfo?.businessAddress?.addressLine1 ||
            cart.seller.businessAddress?.addressLine1 ||
            cart.seller.warehouseDetails?.address?.addressLine1,
          line2:
            cart.seller.businessInfo?.businessAddress?.addressLine2 ||
            cart.seller?.businessAddress?.addressLine2 ||
            cart.seller.warehouseDetails?.address?.addressLine2 ||
            "",
          city: cart.seller?.businessAddress?.city || "Amuwo-Odofin",
          // || response.data.contactInformation.businessAddress.city,
          state:
            cart.seller.businessInfo?.businessAddress?.state ||
            cart.seller.businessAddress?.state ||
            cart.seller.warehouseDetails?.address?.state,
          country: "NG",

          // cart.seller.businessInfo?.businessAddress?.country ||
          // cart.seller.businessAddress?.country,
          zip:
            cart.seller.businessInfo?.businessAddress?.zipCode ||
            cart.seller.businessAddress?.zipCode ||
            cart.seller.warehouseDetails?.address?.zipCode,
        };

        sellerObj[cart.seller._id] = pickup_address;
      });

      setPickupAddress(sellerObj);
    } catch (e) {
      console.log("cannot get cart", e);
    }
  };

  const getShippingFee = async () => {
    const payload = cart?.map((ct: any) => {
      return {
        pickUpState:
          ct?.seller?.warehouseDetails?.state ||
          ct?.seller?.warehouseDetails?.address?.state ||
          ct?.seller?.addresses?.sellerAddress?.state ||
          ct?.seller?.addresses?.warehouseAddress?.state,
        weight: ct.weight * ct.quantity || 0.5,
        sellerId: ct.seller._id,
      };
    });
    try {
      const response = await axios.post(
        process.env.EXPO_PUBLIC_API_URL + "api/order/delivery-cost",
        {
          state: selectedAddress.recipientState,
          pickupLocations: payload,
        },

        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      setDeliveryFeeObject(response.data?.costs);
      setDeliveryFee(response.data?.totalCost);
    } catch (e) {
      console.log("error fetching delivery fee ", e);
    } finally {
      setShippingFeeLoading(false);
    }
  };

  const onPaystackSuccess = useCallback(
    async (paystackResponse: any) => {
      setShowPaystack(false);
      try {
        const payload = {
          paymentReference: paystackResponse.data.transactionRef.reference,
        };
        const config = {
          method: "PATCH",
          url:
            process.env.EXPO_PUBLIC_API_URL +
            `api/order/${orderId}/mark-as-paid`,
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
          },
          data: payload,
        };

        const response = await axios(config);
        console.log("order payment Response ==> ", response.data);
        return setIsSuccessVisible(true);
        return router.push("/(root)/orders/orders");

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
    },
    [showPaystack, orderId],
  );

  const onPaystackClose = useCallback(() => {
    setShowPaystack(false);
    setPayLoading(false);
    toast.info("Payment Cancelled");
  }, [showPaystack]);

  const generateReference = () => {
    const prefix = "ORDER";
    const newReference = `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    return newReference;
  };

  useEffect(() => {
    if (selectedAddress?.recipientState) {
      getShippingFee();
    }
  }, [selectedAddress]);

  const handleCompleteOrder = useCallback(async () => {
    if (!selectedAddress) {
      return toast.info("Please add a delivery address");
    }
    if (!deliveryFee) {
      return toast.error("error getting delivery fee");
    }

    if (selectedPayment == 1) {
      if (walletBalance < deliveryFee + cartTotal) {
        return toast.error("Insufficient Wallet Balance");
      }
    }

    if (deliveryFee + cartTotal > 50000 && selectedPayment == 2) {
      return toast.info(
        "Cash on Delivery is unavailable for orders over ₦50,000",
      );
    }

    const order = {
      items: cart?.map((item) => {
        return {
          productId: item._id,
          quantity: item.quantity,
          price: item?.discount?.isActive
            ? item?.discount?.discountedPrice
            : item.price,
          weight: item.weight?.toFixed(0) * item.quantity,
          seller: {
            sellerId: item.seller._id,
            senderInfo: {
              senderName:
                item?.seller?.firstName + " " + item?.seller?.lastName,
              senderAddress:
                item?.seller?.warehouseDetails?.address?.addressLine1,
              senderPhone: item?.seller?.phoneNumber?.includes("+")
                ? item?.seller?.phoneNumber
                : `+${item?.seller?.phoneNumber}`,
              senderEmail: item?.seller?.email,
              pickUpState: item?.seller?.warehouseDetails?.address?.state,
            },
            shippingFee: deliveryFeeObject?.find(
              (obj: any) => obj?.sellerId == item.seller?._id,
            )?.cost,
            parcelInfo: {
              itemDescription: item?.name?.slice(0, 199),
            },
          },
          specifications: item.specifications || {
            color: "",
            size: "",
            material: "",
          },
        };
      }),
      shippingAddress: selectedAddress,
      paymentMethod: paymentOptions[selectedPayment]?.name?.toLowerCase(),
      isItemCod: selectedPayment == 2,
      shippingFee: deliveryFee,
      additionalDetails: "Please handle with care",
      paidFromWallet: selectedPayment == 1,
    };

    setOrderloading(true);
    try {
      const config = {
        method: "POST",
        url: process.env.EXPO_PUBLIC_API_URL + `api/order`,
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        data: order,
      };

      const response = await axios(config);

      if (selectedPayment == 0) {
        setOrderId(response.data.orders[0]?.orderId);
        setTimeout(() => setShowPaystack(true), 500);
      } else if (selectedPayment == 2) {
        setTimeout(() => setIsSuccessVisible(true), 500);
      } else {
        setTimeout(() => setIsSuccessVisible(true), 500);
      }

      const cart = await AsyncStorage.getItem("cart");

      if (cart) {
        const newCart = JSON.parse(cart!)?.filter(
          (item: any) => !item.includeInOrder,
        );
        if (newCart?.length < 1) {
          await AsyncStorage.removeItem("cart");
        } else {
          await AsyncStorage.setItem("cart", JSON.stringify(newCart));
        }
      }
    } catch (e: any) {
      setOrderloading(false);
      console.log("could not create order", e);
      toast.error("Could not create order");
    } finally {
      setOrderloading(false);
    }
  }, [selectedAddress, deliveryFee, selectedPayment, cartTotal, cart]);

  useEffect(() => {
    async function getUserInfo() {
      const user = await getUser();
      setUser(user);
    }
    getPaystackKey();
    getUserInfo();
    getCart();
    getWalletBalance();
  }, []);

  useEffect(() => {
    if (user && isFocused) getAddresses();
  }, [user, isFocused]);

  useEffect(() => {
    handleCalculateTotal();
  }, [uniqueSellers, cart]);

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
                backgroundColor:
                  index !== 0 && index !== selectedPayment
                    ? "#CFCFCF"
                    : "#ffffff",
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
    [selectedPayment, walletBalance],
  );
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "padding"}
      keyboardVerticalOffset={Platform.select({ ios: 0, android: 40 })}
      style={{ backgroundColor: "#121212" }}
    >
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
            Checkout
          </Text>
        </View>
        <ScrollView className="bg-[#121212]">
          {loading ? (
            <ActivityIndicator
              size={"small"}
              color={"#fff"}
              style={{ marginTop: 30 }}
            />
          ) : (
            <View className="px-[20px] gap-[30px] pb-[20px]">
              <TouchableOpacity
                className="p-[20px] rounded-[16px] flex-row items-center justify-between"
                style={{ backgroundColor: "rgba(41, 41, 41, 0.81)" }}
                onPress={() => setShowAddressSheet(true)}
              >
                <View className="flex-row gap-[16px] shrink">
                  <View className="w-[23px] h-[23px] rounded-full bg-[#B190B6] flex-row items-center justify-center overflow-hidden">
                    {user?.profileImage?.url ? (
                      <Image
                        source={{ uri: user?.profileImage?.url }}
                        resizeMode="cover"
                        style={{ width: "100%", height: "100%" }}
                      />
                    ) : (
                      <>
                        <Text className="text-white text-[9px]">
                          {user?.firstName?.split("")[0]}
                        </Text>
                        <Text className="text-white text-[9px]">
                          {user?.lastName?.split("")[0]}
                        </Text>
                      </>
                    )}
                  </View>
                  <View className="gap-[18px] shrink">
                    <Text className="text-[#ccc] text-[16px] font-LexendDecaMedium">
                      {user?.firstName + " " + user?.lastName}
                    </Text>
                    {selectedAddress ? (
                      <View>
                        <Text className="text-[#ccc] text-[10px] font-LexendDecaMedium mb-[4px]">
                          {selectedAddress && selectedAddress?.recipientAddress}
                        </Text>
                        <Text className="text-[#ccc] text-[10px] font-LexendDecaMedium mb-[4px]">
                          Phone: {selectedAddress?.recipientPhone}
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

              {cart?.length > 0
                ? cart.map((cartItem, index) => (
                    <CartItem cartItem={cartItem} key={index} />
                  ))
                : null}

              <View className="gap-[8px] mb-[10px]">
                <Text className="text-[16px] text-[#ccc] font-LexendDecaSemiBold underline">
                  Auqli Buyer Protection
                </Text>
                <Text className="text-[12px] text-[#ccc] font-LexendDecaLight leading-[18px]">
                  Protect your orders from theft, damages up to 30 days after
                  receiving it{" "}
                  {/* <Link href={"/"} className="text-[#49A3F6]">
                    Learn More
                  </Link> */}
                </Text>
              </View>

              <View className="gap-[20px] mb-[10px]">
                <Text className="text-[#CCC] text-[18px] leading-[20px] font-LexendDecaSemiBold underline">
                  Delivery Options
                </Text>
                <Pressable
                  className="p-[20px] rounded-[16px] flex-row items-center justify-between gap-[10px]"
                  style={{ backgroundColor: "rgba(41, 41, 41, 0.81)" }}
                >
                  <View className="flex-row gap-[16px] shrink">
                    <Image
                      source={require("../../../assets/icons/delivery-icon.png")}
                      resizeMode="contain"
                      style={{ width: 23, height: 23, marginTop: 4 }}
                    />
                    <View className="gap-[16px] shrink">
                      <Text className="text-[#ccc] text-[18px] font-LexendDecaSemiBold">
                        {selectedDeliveryOpt.name}
                      </Text>
                      <View className="gap-[2px]">
                        <Text className="text-[#ccc] text-[10px] font-LexendDeca whitespace-nowrap leading-[16px]">
                          {selectedDeliveryOpt?.description}
                        </Text>
                        <Text className="text-[#ccc] text-[8px] font-LexendDecaLight whitespace-nowrap leading-[16px]">
                          Your order will be processed and shipped with care,
                          ensuring delivery within the estimated timeframe.
                          Enjoy a smooth and hassle-free shopping experience!
                        </Text>
                      </View>
                    </View>
                  </View>
                  {/* <View>
                    <Entypo
                      name="chevron-right"
                      size={16}
                      color="rgba(204, 204, 204, 0.8)"
                    />
                  </View> */}
                </Pressable>
              </View>

              <View
                className="p-[20px] rounded-[16px] gap-[10px] mb-[10px]"
                style={{ backgroundColor: "rgba(41, 41, 41, 0.81)" }}
              >
                <View className="flex-row items-center justify-between">
                  <Text className="text-[16px] text-white font-LexendDecaMedium">
                    Select Payment Method
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

              {/* <View className="rounded-[3px] border-[#ccc] border-[0.3px] pr-[12px] flex-row items-center justify-between mb-[10px]">
                <TextInput
                  placeholder="Enter Promo Code"
                  placeholderTextColor={"rgba(204, 204, 204, 0.25)"}
                  className="text-white p-[12px] text-[12px] font-LexendDecaLight"
                />
                <Pressable>
                  <Text className="text-[#ccc] text-[12px] font-LexendDecaLight">
                    Apply
                  </Text>
                </Pressable>
              </View> */}

              <View
                className="p-[20px] rounded-[5px] gap-[10px]"
                style={{ backgroundColor: "rgba(41, 41, 41, 0.81)" }}
              >
                <View className="flex-row justify-between items-center">
                  <Text className="text-white text-[16px] font-LexendDecaSemiBold">
                    Merchandise Subtotal
                  </Text>
                  <Text className="text-[#16783A] text-[16px] font-LexendDecaSemiBold">
                    ₦
                    {cartTotal?.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Text>
                </View>
                <View className="flex-row justify-between items-center">
                  <Text className="text-white text-[16px] font-LexendDecaSemiBold">
                    Shipping Fee
                  </Text>
                  {shippingFeeLoading ? (
                    <ActivityIndicator size={10} color="white" />
                  ) : (
                    <Text className="text-[#16783A] text-[16px] font-LexendDecaSemiBold">
                      {deliveryFee
                        ? "₦" +
                          deliveryFee?.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })
                        : "-"}
                    </Text>
                  )}
                </View>
                <View className="flex-row justify-between items-center">
                  <Text className="text-white text-[16px] font-LexendDecaSemiBold">
                    Net Total
                  </Text>
                  {shippingFeeLoading ? (
                    <ActivityIndicator size={10} color="white" />
                  ) : (
                    <Text className="text-[#16783A] text-[16px] font-LexendDecaSemiBold">
                      {deliveryFee && cartTotal
                        ? "₦" +
                          (deliveryFee + cartTotal)?.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })
                        : "-"}
                    </Text>
                  )}
                </View>
              </View>

              <TouchableOpacity
                className="rounded-[5px] items-center justify-center p-[12px] bg-[#16783A]"
                onPress={handleCompleteOrder}
              >
                <Text className="text-white text-[16px] font-LexendDecaMedium">
                  Pay (
                  {deliveryFee && cartTotal
                    ? "₦" +
                      (deliveryFee + cartTotal)?.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    : "-"}
                  )
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {showPaystack && (
          <Paystack
            refNumber={generateReference()}
            paystackKey={paystackKey?.publicKey}
            amount={deliveryFee! + cartTotal}
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

        <LoadingModal isVisible={orderLoading} />
        <OrderPopup
          isVisible={isSuccessVisible}
          closePopup={closeSuccessPopup}
        />
        <BottomSheet
          bgColor="#3A3A3A"
          childrenStyle="!px-[11px]"
          showCloseIcon={false}
          title=""
          show={showAddressSheet}
          titleColor="!text-white"
          onRequestClose={() => setShowAddressSheet(false)}
          keyboardBehavior="interactive"
        >
          <AddressSheet
            addresses={addresses}
            closeSheet={() => setShowAddressSheet(false)}
            selectAddress={handleSelectAddress}
          />
        </BottomSheet>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const CartItem = ({ cartItem }: { cartItem: any }) => {
  const [quantity, setQuantity] = useState<number>(cartItem?.quantity);

  const totalPrice = useMemo(() => {
    const price = cartItem.discount?.isActive
      ? cartItem.discount?.discountedPrice
      : cartItem.price;
    return price * cartItem.quantity;
  }, [quantity]);

  return (
    <View className="border-[2px] border-[#CCCCCC] rounded-[16px] p-[14px] flex-row">
      <View className="gap-[16px] shrink">
        <View className=" flex-row items-center justify-between">
          <Text className="text-[16px] text-white font-LexendDecaSemiBold">
            {cartItem?.seller?.businessName ||
              cartItem?.seller?.storeInfo?.storeName ||
              cartItem?.seller?.storeName}
          </Text>
        </View>
        <View className="flex-row gap-[16px]">
          <View>
            <Image
              source={{ uri: cartItem?.images[0].url }}
              resizeMode="contain"
              className="w-[115px] h-[136px]"
            />
          </View>
          <View className="gap-[6px] relative shrink">
            <Text className="text-[14px] text-[#16783A] font-LexendDecaSemiBold">
              {cartItem?.name.length > 50
                ? cartItem?.name.slice(0, 50) + "..."
                : cartItem?.name}
            </Text>
            <Text className="text-[22px] text-[#F2F2F2] font-LexendDecaSemiBold">
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
            <Text className="text-[12px] text-[#F2F2F2] font-LexendDecaLight">
              Item ID: {cartItem._id}
            </Text>
            <View
              className="flex-row items-center justify-between gap-[8px] flex-wrap"
              style={{
                marginTop: "auto",
              }}
            >
              <Text className="text-white text-[12px] font-LexendDecaMedium">
                Total:{" "}
                <Text className="text-[16px] text-[#16783A] font-LexendDecaSemiBold">
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
};

const AddressSheet = ({
  addresses,
  closeSheet,
  selectAddress,
}: {
  addresses: any;
  closeSheet: () => void;
  selectAddress: (address: any) => void;
}) => {
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [checked, setChecked] = useState<number>(-1);

  const handleSelectAddress = () => {
    if (!selectedAddress) {
      return;
    }
    selectAddress(selectedAddress);
  };

  useEffect(() => {
    if (addresses?.length > 0) {
      setSelectedAddress(addresses[checked]);
    }
  }, [checked]);

  return (
    <View className="p-[8px] pb-[16px]">
      <View className="flex-row justify-center items-center mb-[23px] w-full">
        <View className="">
          <Text className="text-[18px] text-[#ccc] font-LexendDecaBold">
            Select Shipping Address
          </Text>
        </View>
        <Pressable
          onPress={closeSheet}
          className="bg-[#EE571C] w-[30px] h-[30px] rounded-[50%] absolute"
          style={{
            right: 8,
          }}
        >
          <AntDesign name="closecircle" size={30} color="#F9C7B3" />
        </Pressable>
      </View>

      <View className="mb-[20px] gap-[10px]">
        {addresses?.length > 0 ? (
          addresses.map((address: any, index: any) => (
            <TouchableOpacity
              key={index}
              className="p-[20px] rounded-[16px] flex-row items-center justify-between"
              style={{ backgroundColor: "rgba(41, 41, 41, 0.81)" }}
              onPress={() => {
                setChecked(index);
              }}
            >
              <View className="flex-row gap-[16px] shrink">
                <View className="w-[23px] h-[23px] rounded-full bg-[#B190B6] flex-row items-center justify-center">
                  <Text className="text-white text-[9px]">
                    {address?.first_name?.split("")[0]}
                  </Text>
                  <Text className="text-white text-[9px]">
                    {address?.last_name?.split("")[0]}
                  </Text>
                </View>
                <View className="gap-[18px] shrink">
                  {/* <Text className="text-[#ccc] text-[16px] font-LexendDecaMedium">
                  {address?.first_name + " " + address?.last_name}
                </Text> */}

                  <View className="gap-[4px]">
                    <Text className="text-[#ccc] text-[10px] font-LexendDecaMedium">
                      Country: {address?.country}
                    </Text>
                    <Text className="text-[#ccc] text-[10px] font-LexendDecaMedium">
                      State: {address?.state}
                    </Text>
                    <Text className="text-[#ccc] text-[10px] font-LexendDecaMedium">
                      City: {address?.city}
                    </Text>
                    <Text className="text-[#ccc] text-[10px] font-LexendDecaMedium">
                      Street Address: {address?.addressLine1}
                    </Text>
                    <Text className="text-[#ccc] text-[10px] font-LexendDecaMedium">
                      Zip Code: {address?.zipCode}
                    </Text>
                  </View>
                </View>
              </View>
              <View
                className={`border-[1px] ${checked == index ? "border-[#16783A]" : "border-[#ccc]"} rounded-[20px] w-[20px] h-[20px] justify-center items-center`}
              >
                <View
                  className={` ${checked == index ? "bg-[#16783A]" : ""} rounded-[12px] w-[12px] h-[12px] justify-center items-center`}
                ></View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text className="p-4 text-[#ccc] text-[12px] self-center">
            No addresses found
          </Text>
        )}
      </View>

      <Pressable
        className="px-[20px] py-[12px] self-center mb-[20px] rounded-[8px] border-dashed border-[1px] border-[#ccc] max-w-[200px] items-center justify-center"
        style={{ backgroundColor: "rgba(255, 255, 255, 0.20)" }}
        onPress={() => {
          closeSheet();
          router.push("/addresses/addAddress");
        }}
      >
        <Text className="text-[#ccc] text-[14px] ">Add New Address</Text>
      </Pressable>

      <TouchableOpacity
        className="py-[10px] rounded-[6px] bg-[#16783A] items-center justify-center"
        onPress={handleSelectAddress}
      >
        <Text className="text-white text-[14px] font-LexendDecaMedium">
          Confirm Delivery method
        </Text>
      </TouchableOpacity>
    </View>
  );
};
export default Checkout;
