import {
  View,
  Text,
  Pressable,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from "react-native";
import { ActivityIndicator } from "react-native-paper";

import React, { memo, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link, router } from "expo-router";
import { toast } from "@/core/toast";
import { getToken, getUser } from "@/store/features/auth/utils";
import axios from "axios";
import { products, useGetSingleProductQuery } from "@/services/products";
import Entypo from "@expo/vector-icons/Entypo";
import { Image } from "expo-image";

const mockDeliveryOtions = [
  {
    name: "Standard Delivery",
    description:
      "Guaranteed delivery within 3 business days.Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ",
  },
];

interface Props {
  sellerId: string;
  productId: string;
  closeSheet: () => void;
}

const CheckoutNow = ({ productId, sellerId, closeSheet }: Props) => {
  const {
    data: product,
    error,
    isLoading,
    refetch,
    isFetching,
  } = useGetSingleProductQuery(productId);
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

  const productTotal = useMemo(() => {
    const price = product?.discount?.isActive
      ? product?.discount?.discountedPrice
      : product?.price;
    return price;
  }, [product]);

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
          first_name: user.firstName,
          last_name: user.lastName,
          email: user.email,
          phone: user.phoneNumber,
          line1: response.data[0].addressLine1,
          line2: response.data[0].addressLine2
            ? response.data[0].addressLine2
            : response.data[0].addressLine1,
          city: response.data[0].city,
          state: response.data[0].state,
          country: response.data[0].country,
          zip: response.data[0].zipCode,
        };

        setSelectedAddress(delivery_address);
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

      const pickup_address = {
        first_name: response.data?.personalInfo?.firstName,
        last_name: response.data?.personalInfo?.lastName,
        email: response.data?.contactInformation?.businessEmail
          ? response.data?.contactInformation?.businessEmail
          : "bolu@gmail.com",
        phone:
          //   "+" + response.data?.businessInfo?.businessNumber
          //     ? response.data?.personalInfo?.phoneNumber
          //     :
          "+2348083412865",
        line1: response.data?.contactInformation?.businessAddress.addressLine1
          ? response.data.warehouse?.address?.addressLine1
          : "ajayi crowder way",
        line2: response.data?.contactInformation?.businessAddress.addressLine2
          ? response.data.warehouse?.addrress?.addressLine2
          : "boluwa street",
        city: response.data.warehouse.address.city || "Amuwo-Odofin",
        state: response.data?.contactInformation?.businessAddress?.state
          ? response.data?.warehouse?.address?.state
          : "lagos",
        country: "NG",
        zip: response.data?.contactInformation?.businessAddress?.zipCode
          ? response.data?.warehouse?.address?.zipCode
          : "100001",
      };

      setPickupAddress({ [`${sellerId}`]: pickup_address });
    } catch (e) {
      console.log("error fetching buyer addresses ", e);
    }
  };

  const handleCompleteOrder = async () => {
    if (orderLoading) {
      return;
    }
    if (!selectedAddress) {
      return toast.info("Please add a delivery address");
    }

    const order = {
      items: [
        {
          productId: productId,
          quantity: 1,
          name: product.name,
          description: product.description,
          weight: product.weight,
          price: product.price,
          sellerId: sellerId,
          specifications: null,
        },
      ],
      pickup_addresses: pickupAddress,
      delivery_address: selectedAddress,
      paymentMethod: "paystack",
    };

    try {
      setOrderloading(true);
      const token = await getToken();
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
      if (response.status == 201) {
        await AsyncStorage.setItem(
          "orders",
          JSON.stringify(response.data.orders),
        );
        await AsyncStorage.removeItem("buyNow");
        closeSheet();
        router.push(`/checkout/${response.data.orders[0].orderId}`);
      }
    } catch (e: any) {
      console.log("could not create order", e?.response);
      toast.error("Could not create order");
    } finally {
      setOrderloading(false);
    }
  };
  useEffect(() => {
    async function getUserInfo() {
      const user = await getUser();

      setUser(user);
    }
    getUserInfo();
    // getCart();
  }, []);

  useEffect(() => {
    if (user) {
      getAddresses();
      getPickupAddress();
    }
  }, [user]);

  useEffect(() => {
    if (product?._id) {
      setCart(product);
    }
  }, [products]);
  return (
    <View className="p-[8px] pb-[16px]">
      <ScrollView className="bg-[#121212]" showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator
            size={"small"}
            color={"#16783A"}
            style={{ marginTop: 30 }}
          />
        ) : (
          <View className=" gap-[30px] pb-[20px]">
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
                        Country: {selectedAddress && selectedAddress?.country}
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
              <Text className="text-[16px] text-[#ccc] font-LexendDecaSemiBold">
                Auqli Buyer Protection
              </Text>
              <Text className="text-[12px] text-[#ccc] font-LexendDecaLight leading-[18px]">
                Protect your orders from theft, damages up to 30 days after
                receiving it{" "}
                <Link href={"/"} className="text-[#49A3F6]">
                  Learn More
                </Link>
              </Text>
            </View>

            <View className="gap-[20px] mb-[10px]">
              <Text className="text-[#CCC] text-[18px] leading-[20px] font-LexendDecaSemiBold">
                Delivery Options
              </Text>
              <Pressable
                className="p-[20px] rounded-[16px] flex-row items-center justify-between gap-[10px]"
                style={{ backgroundColor: "rgba(41, 41, 41, 0.81)" }}
              >
                <View className="flex-row gap-[16px] shrink">
                  <Image
                    source={require("../../assets/icons/delivery-icon.png")}
                    contentFit="contain"
                    style={{ width: 23, height: 23, marginTop: 4 }}
                  />
                  <View className="gap-[16px] shrink">
                    <Text className="text-[#ccc] text-[18px] font-LexendDecaSemiBold">
                      {selectedDeliveryOpt.name}
                    </Text>
                    <View className="">
                      <Text className="text-[#ccc] text-[10px] font-LexendDecaLight whitespace-nowrap leading-[16px]">
                        {selectedDeliveryOpt?.description}
                      </Text>
                    </View>
                  </View>
                </View>
                <View>
                  <Entypo
                    name="chevron-right"
                    size={16}
                    color="rgba(204, 204, 204, 0.8)"
                  />
                </View>
              </Pressable>
            </View>

            <View
              className="p-[20px] rounded-[16px] gap-[10px] mb-[10px]"
              style={{ backgroundColor: "rgba(41, 41, 41, 0.81)" }}
            >
              <View className="flex-row items-center justify-between">
                <Text className="text-[18px] text-white font-LexendDecaSemiBold">
                  Select Payment methods
                </Text>
                <Pressable>
                  <Text className="text-[#16783A] text-[12px]">Edit</Text>
                </Pressable>
              </View>
              <View>
                <Text className="text-[14px] text-[#ccc] font-LexendDecaSemiBold">
                  Paystack
                </Text>
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
                  ₦{productTotal?.toLocaleString()}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              className="rounded-[5px] items-center justify-center p-[12px] bg-[#16783A]"
              onPress={handleCompleteOrder}
            >
              {orderLoading ? (
                <ActivityIndicator size={"small"} color="white" />
              ) : (
                <Text className="text-white text-[16px] font-LexendDecaMedium">
                  Complete Order
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
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
    <View className="border-[2px] border-[#CCCCCC] rounded-[16px] p-[14px] flex-row">
      <View className="gap-[16px] shrink">
        <View className=" flex-row items-center justify-between">
          <Text className="text-[16px] text-white font-LexendDecaSemiBold">
            {cartItem?.seller?.businessName ||
              cartItem?.seller?.storeInfo?.storeName}
          </Text>
        </View>
        <View className="flex-row gap-[16px]">
          <Image
            source={{ uri: cartItem?.images?.[0]?.url }}
            contentFit="cover"
            style={{
              width: 115,
              height: 136,
              borderRadius: 8,
            }}
          />
          <View className="gap-[6px] relative shrink">
            <Text className="text-[14px] text-[#16783A] font-LexendDecaSemiBold">
              {cartItem?.name.length > 20
                ? cartItem?.name.slice(0, 20) + "..."
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
              Item ID: {cartItem?._id?.toLocaleString().slice(0, 12)}...
            </Text>
            <View
              className="flex-row items-center gap-[11px] flex-wrap"
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
});

export default CheckoutNow;
