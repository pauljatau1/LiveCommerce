import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Pressable,
  Image,
  Platform,
  FlatList,
  StatusBar,
} from "react-native";
import { ActivityIndicator } from "react-native-paper";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
import OrderPopup from "@/components/global/orders/order-popup";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import {
  FontAwesome5,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import { trackEvent } from "@/utils/analytics";
import { trackEvent as trackEventMixpanel } from "@/utils/mixpanel";
import { trackEvent as trackEventCustomerio } from "@/utils/customerio";
import {
  trackFacebookPurchase,
  trackFacebookEvent,
} from "@/utils/facebook-analytics";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import SafeAreaView from "@/components/global/safeareaview/SafeAreaView";
import CartItem from "@/components/orders/cartItem";
import AddressSheet from "@/components/orders/addressSheet";
// import CallPaystack from "./callPaystack";
import SelectRatesSheet from "@/components/orders/selectRatesSheet";
import { normalizeNGNNumber } from "@/helpers/helpers";

const { width, height } = Dimensions.get("window");

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
    icon: require("../../../assets/icons/paystack.png"),
    name: "Paystack",
    description: "Secure payment via card, bank transfer, e-Wallets",
  },
  {
    icon: require("../../../assets/icons/wallet.png"),
    name: "Auqli Wallet",
    description: "",
  },
  // {
  //   icon: require("../../../assets/icons/cod.png"),
  //   name: "Cash on Delivery",
  //   description: "Pay with cash on Delivery",
  // },
];

const Checkout = () => {
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const token = useSelector((state: RootState) => state.authState.token);
  // const { openPaystackPopup } = CallPaystack();
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
  const [orderTotal, setOrderTotal] = useState<string>("");
  const [rates, setRates] = useState<any[]>([]);

  const [showAddressSheet, setShowAddressSheet] = useState<boolean>(false);
  const [selectedPayment, setSelectedPayment] = useState<number>(0);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [totalWalletBalance, setTotalWalletBalance] = useState<number>(0);
  const [isSuccessVisible, setIsSuccessVisible] = useState<boolean>(false);
  const [shippingFeeLoading, setShippingFeeLoading] = useState<boolean>(false);
  const [fetchedShippingFee, setFetchedShippingFee] = useState<number>(0);
  const [paystackKey, setPaystackKey] = useState<any>();
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

  const eligibleForPickup = useMemo(() => {
    return !cart?.some(
      (ct: any) =>
        ct?.seller?.offersStorePickup == false ||
        ct?.seller?.shippingInfo?.offersStorePickup == false,
    );
  }, [cart]);

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

  const handleApplyCoupon = async () => {
    if (cart?.length > 1) {
      return setCouponMessage(
        `⚠️ ${"Coupons can only be applied to a single product"}`,
      );
    }
    if (couponApplied) {
      setCouponApplied(null);
      setCouponCode("");
      setCouponMessage("");
      return;
    }
    setCouponLoading(true);
    try {
      const response = await axios.post(
        process.env.EXPO_PUBLIC_API_URL + `api/coupons/apply`,
        {
          code: couponCode,
          productId: cart[0]?._id,
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
        amountSaved: response.data.product?.savings * cart[0]?.quantity,
        couponSubTotal:
          response.data.product?.discountedPrice * cart[0]?.quantity,
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

  const handleSelectAddress = (address: any) => {
    const delivery_address = {
      _id: address?._id,
      first_name: address?.firstName || user?.firstName,
      last_name: address?.lastName || user?.lastName,
      email: user?.email,
      phone: normalizeNGNNumber(address?.phoneNumber || user?.phoneNumber),
      line1: address?.addressLine1,
      state: address?.state,
      city: address?.city,
      zip: address?.zipCode,
      country: address?.country,
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
        process.env.EXPO_PUBLIC_API_URL + `api/v2/buyers/wallet/balance`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      console.log("wallet ", response.data);

      setWalletBalance(
        response.data?.data?.availableBalance || response.data?.data?.balance,
      );
      setTotalWalletBalance(response.data?.data?.balance);
    } catch (e) {
      console.log("error fetching buyer wallet balance ", e);
    }
  };
  const getAddresses = async () => {
    try {
      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL + "api/v2/buyers/addresses",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setAddresses(response.data?.data);
      const responseAddress = response?.data?.data?.[0];
      if (responseAddress) {
        const delivery_address = {
          _id: responseAddress?._id,
          first_name: responseAddress?.firstName || user?.firstName,
          last_name: responseAddress?.lastName || user?.lastName,
          email: user?.email,
          phone: normalizeNGNNumber(
            responseAddress?.phoneNumber || user?.phoneNumber,
          ),
          line1: responseAddress?.addressLine1,
          state: responseAddress?.state,
          city: responseAddress?.city,
          zip: responseAddress?.zipCode,
          country: responseAddress?.country,
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
      const cart = await AsyncStorage.getItem("segmentedCart");
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
          fromCompatibleVersion: true,
        },

        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      console.log(response.data);

      setDeliveryFeeObject(response.data?.costs);
      setFetchedShippingFee(response.data?.totalCost);
      setFreeShipping(response.data?.freeShipping);
      // setDeliveryFee(response.data?.totalCost);
    } catch (e) {
      console.log("error fetching delivery fee ", e);
      // setDeliveryFeeObject([
      //   {
      //     sellerId: "682efb3e101c5c0990f06844",
      //     pickUpState: "Lagos",
      //     weight: 1,
      //     cost: 3225,
      //     status: "Success",
      //     error: null,
      //   },
      // ]);
      // setFetchedShippingFee(3225);
    } finally {
      setShippingFeeLoading(false);
      setLoading(false);
    }
  };

  const handleCloseRatesSheet = useCallback(() => {
    setShowRatesSheet(false);
  }, []);

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
    if (selectedDeliveryOpt == 0 && fetchedShippingFee) {
      setDeliveryFee(fetchedShippingFee);
    } else {
      setDeliveryFee(0);
    }
  }, [fetchedShippingFee, selectedDeliveryOpt]);

  // useEffect(() => {
  //   if (selectedAddress?.state) {
  //     getShippingFee();
  //   }
  // }, [selectedAddress]);

  // const payNow = () => {
  //   openPaystackPopup({
  //     email: "jane.doe@example.com",
  //     amount: 5000,
  //     reference: "TXN_123451",
  //     metadata: {
  //       custom_fields: [
  //         {
  //           display_name: "Order ID",
  //           variable_name: "order_id",
  //           value: "OID1234",
  //         },
  //       ],
  //     },
  //     onSuccess: (res: any) => console.log("Success:", res),
  //     onCancel: () => console.log("User cancelled"),
  //     onLoad: (res: any) => console.log("WebView Loaded:", res),
  //     onError: (err: any) => console.log("WebView Error:", err),
  //   });
  // };

  const handleCompleteOrder = useCallback(async () => {
    if (!selectedAddress) {
      return toast.info("Please add a delivery address");
    }
    // if (!deliveryFee && selectedDeliveryOpt == 0 && !freeShipping) {
    //   return toast.error("error getting delivery fee");
    // }

    // if (selectedPayment == 1) {
    //   if (walletBalance < deliveryFee! + cartTotal) {
    //     return toast.error("Insufficient Wallet Balance");
    //   }
    // }

    if (deliveryFee! + cartTotal > 50000 && selectedPayment == 2) {
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
            : couponApplied
              ? couponApplied?.discountedPrice
              : item.price,
          weight: item.weight?.toFixed(0) * item.quantity,
          // seller: {
          //   sellerId: item.seller._id,
          //   senderInfo: {
          //     senderName:
          //       item?.seller?.firstName + " " + item?.seller?.lastName,
          //     senderAddress:
          //       item?.seller?.warehouseDetails?.address?.addressLine1,
          //     senderPhone: item?.seller?.phoneNumber?.includes("+")
          //       ? item?.seller?.phoneNumber
          //       : `+${item?.seller?.phoneNumber}`,
          //     senderEmail: item?.seller?.email,
          //     pickUpState: item?.seller?.warehouseDetails?.address?.state,
          //   },
          //   shippingFee: deliveryFeeObject?.find(
          //     (obj: any) => obj?.sellerId == item.seller?._id,
          //   )?.cost,
          //   parcelInfo: {
          //     itemDescription: item?.name?.slice(0, 199),
          //   },
          // },
          specifications: item.specifications || {
            color: "",
            size: "",
            material: "",
          },
        };
      }),
      shippingAddress: selectedAddress,
      // paymentMethod: paymentOptions[selectedPayment]?.name?.toLowerCase(),
      // isItemCod: selectedPayment == 2,
      // shippingFee: deliveryFee,
      // additionalDetails: "Please handle with care",
      // paidFromWallet: selectedPayment == 1,
      // isWalletCredit: walletCredit > 0 ? true : false,
      isStorePickup: selectedDeliveryOpt == 1,
    };

    // return;
    // return console.log(JSON.stringify(order));

    setOrderloading(true);
    try {
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
      setFreeShipping(response.data?.orders[0]?.isFreeShipping);
      setIsInternational(response.data?.orders[0]?.isInternational);
      const cart = await AsyncStorage.getItem("segmentedCart");
      const cartData = JSON.parse(cart || "{}");

      if (response.status == 201) {
        try {
          const userData = await AsyncStorage.getItem("user");
          const user = JSON.parse(userData || "{}");

          const itemsTotal =
            (deliveryFee && cartTotal) ||
            (selectedDeliveryOpt == 1 && deliveryFee?.toString())
              ? "₦" +
                (
                  deliveryFee +
                  (couponApplied ? couponApplied?.couponSubTotal : cartTotal) -
                  walletCredit
                )?.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })
              : 0;

          if (user) {
            console.log("order created", JSON.stringify(response.data));
            console.log("cart data", cartData);
            trackEventMixpanel("order_created", {
              // Buyer Information
              userId: response.data.complexOrderDetails?.buyer_id,
              email: response.data.complexOrderDetails?.buyer_email,
              firstName: response.data.complexOrderDetails?.buyer_first_name,
              lastName: response.data.complexOrderDetails?.buyer_last_name,
              username: response.data.complexOrderDetails?.buyer_username,
              buyerPhone: response.data.complexOrderDetails?.buyer_phone,

              // Order Information
              orderId: response.data.complexOrderDetails?.order_id,
              orderItemsTotal:
                response.data.complexOrderDetails?.order_items_total,
              shippingFee: response.data.complexOrderDetails?.shipping_fee,
              orderGrandTotal:
                response.data.complexOrderDetails?.order_grand_total,
              paymentMethod: response.data.complexOrderDetails?.payment_method,
              paymentStatus: response.data.complexOrderDetails?.payment_status,

              // Order Details
              isCashOnDelivery:
                response.data.complexOrderDetails?.is_cash_on_delivery,
              isWalletCredit:
                response.data.complexOrderDetails?.is_wallet_credit,
              walletAmountUsed:
                response.data.complexOrderDetails?.wallet_amount_used,
              isStorePickup: response.data.complexOrderDetails?.is_store_pickup,
              orderChannel: response.data.complexOrderDetails?.order_channel,
              totalItemsInOrder:
                response.data.complexOrderDetails?.total_items_in_order,
              totalOrdersInBatch:
                response.data.complexOrderDetails?.total_orders_in_batch,

              // Delivery Information
              deliveryAddressLine1:
                response.data.complexOrderDetails?.delivery_address_line1,
              deliveryCity: response.data.complexOrderDetails?.delivery_city,
              deliveryState: response.data.complexOrderDetails?.delivery_state,
              deliveryCountry:
                response.data.complexOrderDetails?.delivery_country,
              deliveryRecipientName:
                response.data.complexOrderDetails?.delivery_recipient_name,
              deliveryRecipientPhone:
                response.data.complexOrderDetails?.delivery_recipient_phone,
              deliveryRecipientEmail:
                response.data.complexOrderDetails?.delivery_recipient_email,

              // Shipping Information
              fezOrderNumber:
                response.data.complexOrderDetails?.fez_order_number,
              carrierName: response.data.complexOrderDetails?.carrier_name,
              trackingNumber:
                response.data.complexOrderDetails?.tracking_number,

              // Product Information
              orderProductId1:
                response.data.complexOrderDetails?.orderProductId1,
              orderProductName1:
                response.data.complexOrderDetails?.orderProductName1,
              orderProductPrice1:
                response.data.complexOrderDetails?.orderProductPrice1,
              orderProductQuantity1:
                response.data.complexOrderDetails?.orderProductQuantity1,
              orderProductWeight1:
                response.data.complexOrderDetails?.orderProductWeight1,
              orderProductTotal1:
                response.data.complexOrderDetails?.orderProductTotal1,
              orderProductSpecifications1:
                response.data.complexOrderDetails?.orderProductSpecifications1,

              // Campaign and Stream Information
              campaignId: response.data.complexOrderDetails?.campaign_id,
              streamId: response.data.complexOrderDetails?.stream_id,

              // Timestamp
              orderCreatedAt:
                response.data.complexOrderDetails?.order_created_at,
              timestamp: new Date().toISOString(),
            });

            trackEventCustomerio("order_created", {
              // Buyer Information
              userId: response.data.complexOrderDetails?.buyer_id,
              email: response.data.complexOrderDetails?.buyer_email,
              firstName: response.data.complexOrderDetails?.buyer_first_name,
              lastName: response.data.complexOrderDetails?.buyer_last_name,
              username: response.data.complexOrderDetails?.buyer_username,
              buyerPhone: response.data.complexOrderDetails?.buyer_phone,

              // Order Information
              orderId: response.data.complexOrderDetails?.order_id,
              orderItemsTotal:
                response.data.complexOrderDetails?.order_items_total,
              shippingFee: response.data.complexOrderDetails?.shipping_fee,
              orderGrandTotal:
                response.data.complexOrderDetails?.order_grand_total,
              paymentMethod: response.data.complexOrderDetails?.payment_method,
              paymentStatus: response.data.complexOrderDetails?.payment_status,

              // Order Details
              isCashOnDelivery:
                response.data.complexOrderDetails?.is_cash_on_delivery,
              isWalletCredit:
                response.data.complexOrderDetails?.is_wallet_credit,
              walletAmountUsed:
                response.data.complexOrderDetails?.wallet_amount_used,
              isStorePickup: response.data.complexOrderDetails?.is_store_pickup,
              orderChannel: response.data.complexOrderDetails?.order_channel,
              totalItemsInOrder:
                response.data.complexOrderDetails?.total_items_in_order,
              totalOrdersInBatch:
                response.data.complexOrderDetails?.total_orders_in_batch,

              // Delivery Information
              deliveryAddressLine1:
                response.data.complexOrderDetails?.delivery_address_line1,
              deliveryCity: response.data.complexOrderDetails?.delivery_city,
              deliveryState: response.data.complexOrderDetails?.delivery_state,
              deliveryCountry:
                response.data.complexOrderDetails?.delivery_country,
              deliveryRecipientName:
                response.data.complexOrderDetails?.delivery_recipient_name,
              deliveryRecipientPhone:
                response.data.complexOrderDetails?.delivery_recipient_phone,
              deliveryRecipientEmail:
                response.data.complexOrderDetails?.delivery_recipient_email,

              // Shipping Information
              fezOrderNumber:
                response.data.complexOrderDetails?.fez_order_number,
              carrierName: response.data.complexOrderDetails?.carrier_name,
              trackingNumber:
                response.data.complexOrderDetails?.tracking_number,

              // Product Information
              orderProductId1:
                response.data.complexOrderDetails?.orderProductId1,
              orderProductName1:
                response.data.complexOrderDetails?.orderProductName1,
              orderProductPrice1:
                response.data.complexOrderDetails?.orderProductPrice1,
              orderProductQuantity1:
                response.data.complexOrderDetails?.orderProductQuantity1,
              orderProductWeight1:
                response.data.complexOrderDetails?.orderProductWeight1,
              orderProductTotal1:
                response.data.complexOrderDetails?.orderProductTotal1,
              orderProductSpecifications1:
                response.data.complexOrderDetails?.orderProductSpecifications1,

              // Campaign and Stream Information
              campaignId: response.data.complexOrderDetails?.campaign_id,
              streamId: response.data.complexOrderDetails?.stream_id,

              // Timestamp
              orderCreatedAt:
                response.data.complexOrderDetails?.order_created_at,
              timestamp: new Date().toISOString(),
            });

            // Track Facebook purchase for each item in the order
            // Using liveShowOrders as it contains the actual item details
            response.data.liveShowOrders?.forEach((liveOrder: any) => {
              const orderDetails = liveOrder.orderDetails;

              orderDetails?.items?.forEach((orderItem: any) => {
                // Find the corresponding cart item to get product details
                const cartItem = cartData?.find(
                  (cartProduct: any) => cartProduct._id === orderItem.product,
                );

                console.log("cartItem check", cartItem);

                if (cartItem) {
                  // Calculate individual item total (price * quantity)
                  const itemTotal = orderItem.price * orderItem.quantity;

                  trackFacebookEvent("Purchase", {
                    // Facebook Standard Commerce Properties
                    content_id: cartItem._id,
                    content_name: orderItem.productName || cartItem.name,
                    content_type: "product",
                    content_category: cartItem.category,
                    _valueToSum: itemTotal,
                    num_items: orderItem.quantity,
                    fb_currency: "NGN",
                  });
                }
              });
            });
          }
        } catch (trackError) {
          console.log("error tracking order created", trackError);
        }
      }

      // if (selectedPayment == 0) {
      //   setOrderId(response.data.orders[0]?.orderId);
      //   setTimeout(() => setShowPaystack(true), 1000);
      // } else if (selectedPayment == 2) {
      //   setTimeout(() => setIsSuccessVisible(true), 500);
      // } else {
      //   setTimeout(() => setIsSuccessVisible(true), 500);
      // }

      setRates(response?.data?.orders?.[0]?.rates);
      setOrderId(response?.data?.orders?.[0]?.orderId);
      setOrderTotal(response?.data?.orders?.[0]?.totalAmount);
      setOrderloading(false);
      setShowRatesSheet(true);

      try {
        const userData = await AsyncStorage.getItem("user");
        const user = JSON.parse(userData || "{}");
        if (user) {
          trackEvent("payment_initiated", {
            userId: user?._id,
            email: user?.email,
            firstName: user?.firstName,
            lastName: user?.lastName,
            username: user?.username,
            cartItems: cartData?.length,
            products: cartData?.map((item: any) => {
              return {
                name: item.name,
                price: item.price,
                productId: item._id,
              };
            }),
            totalAmount: cartTotal,
            paymentMethod: paymentOptions[selectedPayment]?.name?.toLowerCase(),
            timestamp: new Date().toISOString(),
          });
        }
      } catch (trackError) {
        console.log("error tracking payment initiated", trackError);
      }

      // const generalCart = await AsyncStorage.getItem("cart");
      // if (cart && generalCart) {
      //   const segmentedCartData = JSON.parse(cart!);
      //   const newCart = JSON.parse(generalCart!)?.filter(
      //     (item: any) =>
      //       !item.includeInOrder ||
      //       !segmentedCartData?.find((sg: any) => sg?._id == item?._id),
      //   );
      //   if (newCart?.length < 1) {
      //     await AsyncStorage.removeItem("cart");
      //   } else {
      //     await AsyncStorage.setItem("cart", JSON.stringify(newCart));
      //   }
      // }
    } catch (e: any) {
      setOrderloading(false);
      console.log("could not create order", e?.response?.data?.message);
      toast.error(e?.response?.data?.message || "Could not create order");
    } finally {
      setOrderloading(false);
    }
  }, [
    selectedAddress,
    deliveryFee,
    selectedPayment,
    cartTotal,
    cart,
    couponApplied,
    walletCredit,
    selectedDeliveryOpt,
    freeShipping,
  ]);

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

  useEffect(() => {
    const trackCheckout = async () => {
      try {
        const userData = await AsyncStorage.getItem("user");
        const user = JSON.parse(userData || "{}");
        if (user) {
          const cart = await AsyncStorage.getItem("cart");
          const cartData = JSON.parse(cart || "{}");
          trackEventMixpanel("checkout_started", {
            userId: user?._id,
            email: user?.email,
            firstName: user?.firstName,
            lastName: user?.lastName,
            username: user?.username,
            cartItems: cart?.length,
            products: cartData?.map((item: any) => {
              return {
                name: item.name,
                price: item.price,
                productId: item._id,
              };
            }),
            totalAmount: cartTotal,
            timestamp: new Date().toISOString(),
          });

          trackEventCustomerio("checkout_started", {
            userId: user?._id,
            email: user?.email,
            firstName: user?.firstName,
            lastName: user?.lastName,
            username: user?.username,
            cartItems: cart?.length,
            products: cartData?.map((item: any) => {
              return {
                name: item.name,
                price: item.price,
                productId: item._id,
              };
            }),
            totalAmount: cartTotal,
            timestamp: new Date().toISOString(),
          });

          trackFacebookEvent("InitiateCheckout", {
            content_id: cartData?.[0]?._id,
            content_name: cartData?.[0]?.name,
            content_type: "product",
            currency: "NGN",
            value: `₦${cartTotal?.toLocaleString()}`,
            description: cartData?.[0]?.description,
            email: user?.email,
            firstName: user?.firstName,
            lastName: user?.lastName,
            username: user?.username,
            cartItems: cart?.length,
            products: cartData?.map((item: any) => {
              return {
                name: item.name,
                price: item.price,
                productId: item._id,
              };
            }),
            totalAmount: cartTotal,
            timestamp: new Date().toISOString(),
          });
        }
      } catch (trackError) {
        console.log("error tracking checkout started", trackError);
      }
    };

    trackCheckout();
  }, []);

  useEffect(() => {
    if (selectedPayment == 1 || walletBalance == 0) {
      setShowWalletCredit(false);
      setWalletCredit(0);
      return;
    }

    const orderTotal =
      (deliveryFee && cartTotal) ||
      (selectedDeliveryOpt == 1 && deliveryFee?.toString()) ||
      (freeShipping && cartTotal)
        ? deliveryFee +
          (couponApplied ? couponApplied?.couponSubTotal : cartTotal)
        : null;

    if (!orderTotal) {
      return;
    }

    if (walletBalance < orderTotal - 100) {
      setShowWalletCredit(true);
    }
  }, [
    cartTotal,
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
    [selectedPayment, walletBalance, selectedDeliveryOpt],
  );
  return (
    <SafeAreaView className="flex-1 bg-[#121212]">
      <KeyboardAvoidingView
        behavior={"padding"}
        style={{ flex: 1, backgroundColor: "#121212" }}
      >
        <FocusAwareStatusBar
          barStyle="light-content"
          backgroundColor="#121212"
        />
        <View className="flex-1 bg-[#121212] ">
          <View className="flex flex-row items-center justify-center gap-[10px] px-[12px] py-[17px] mb-[8px] mt-4 relative">
            <TouchableOpacity
              className="absolute left-[12px]"
              onPress={async () => {
                try {
                  const userData = await AsyncStorage.getItem("user");
                  const user = JSON.parse(userData || "{}");
                  const cart = await AsyncStorage.getItem("cart");
                  const cartData = JSON.parse(cart || "{}");

                  trackEvent("checkout_abandoned", {
                    userId: user?._id,
                    email: user?.email,
                    firstName: user?.firstName,
                    lastName: user?.lastName,
                    username: user?.username,
                    cartItems: cart?.length,
                    products: cartData?.map((item: any) => {
                      return {
                        name: item.name,
                        price: item.price,
                        productId: item._id,
                      };
                    }),
                    totalAmount: cartTotal,
                    timestamp: new Date().toISOString(),
                  });
                } catch (error) {
                  console.log(error);
                }
                router.back();
              }}
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
          {/* {freeShipping && (
            <View className="justify-center items-center flex-row px-[16px] py-[10px] gap-[8px] mb-[8px] bg-[#16783a]">
              <FontAwesome5 name="truck" size={14} color="white" />
              <Text className="font-LexendDeca text-[12px] text-[#ffffff]">
                Free Shipping on All Orders!
              </Text>
            </View>
          )} */}

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
                            {selectedAddress && selectedAddress?.line1}
                          </Text>
                          <Text className="text-[#ccc] text-[10px] font-LexendDecaMedium mb-[4px]">
                            Phone: {selectedAddress?.phone}
                          </Text>
                          <Text className="text-[#ccc] text-[10px] font-LexendDecaMedium">
                            Country: {selectedAddress?.country}
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

                {/* <FlatList
                  data={cart}
                  renderItem={({ item, index }) => (
                    <CartItem cartItem={item} index={index} />
                  )}
                  keyExtractor={(item) => item._id}
                  showsVerticalScrollIndicator={false}
                  ItemSeparatorComponent={() => (
                    <View className="h-[1px] bg-white opacity-20 w-full"></View>
                  )}
                /> */}
                <View>
                  {cart?.length > 0
                    ? cart.map((cartItem, index) => (
                        <CartItem
                          cartItem={cartItem}
                          key={index}
                          index={index}
                          isLastItem={index == cart?.length - 1}
                        />
                      ))
                    : null}
                </View>

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
                  {mockDeliveryOtions?.map((item: any, index: number) => (
                    <View key={index}>
                      <Pressable
                        className="p-[20px] rounded-[16px] flex-row items-center justify-between gap-[10px]"
                        style={{
                          backgroundColor: "rgba(41, 41, 41, 0.81)",
                          opacity: !eligibleForPickup && index == 1 ? 0.5 : 1,
                        }}
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
                          * One or more items are not eligible for store pickup
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
                    <TextInput
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
                      {cartTotal?.toLocaleString(undefined, {
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
                        {couponApplied?.amountSaved?.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </Text>
                    </View>
                  )}
                  {walletCredit > 0 && (
                    <View className="flex-row justify-between items-center">
                      <Text className="text-white text-[14px] font-LexendDecaSemiBold shrink">
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
                        {cartTotal
                          ? "₦" +
                            (
                              (couponApplied
                                ? couponApplied?.couponSubTotal
                                : cartTotal) - walletCredit
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
                  disabled={orderLoading}
                  className="rounded-[16px] items-center justify-center px-[12px] h-[50px] bg-[#16783A]"
                  onPress={handleCompleteOrder}
                >
                  {orderLoading ? (
                    <ActivityIndicator size={"small"} color="white" />
                  ) : (
                    <Text className="text-white text-[16px] font-LexendDecaMedium">
                      {/* Pay (
                      {cartTotal
                        ? "₦" +
                          (
                            deliveryFee +
                            (couponApplied
                              ? couponApplied?.couponSubTotal
                              : cartTotal) -
                            walletCredit
                          )?.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })
                        : "-"}
                      ) */}
                      Continue
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>

          {/* {showPaystack && (
            <Paystack
              refNumber={generateReference()}
              paystackKey={paystackKey?.publicKey}
              amount={
                selectedDeliveryOpt == 0
                  ? deliveryFee! +
                    (couponApplied
                      ? couponApplied?.couponSubTotal
                      : cartTotal) -
                    walletCredit
                  : couponApplied
                    ? couponApplied?.couponSubTotal - walletCredit
                    : cartTotal - walletCredit
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

          {/* <LoadingModal isVisible={orderLoading} /> */}
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
              activeAddress={selectedAddress?._id}
            />
          </BottomSheet>

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
              fromSheet={false}
              paymentMethod={paymentOptions[
                selectedPayment
              ]?.name?.toLowerCase()}
              closeSheet={handleCloseRatesSheet}
              isInternational={isInternational}
              isFreeShipping={freeShipping}
              isStorePickup={selectedDeliveryOpt == 1}
            />
          </BottomSheet>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Checkout;
