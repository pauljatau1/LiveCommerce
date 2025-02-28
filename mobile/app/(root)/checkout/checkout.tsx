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
import React, { useEffect, useMemo, useState } from "react";
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

const { width, height } = Dimensions.get("window");

const mockDeliveryOtions = [
  {
    name: "Standard Delivery",
    description:
      "Guaranteed delivery within 3 business days.Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ",
  },
];

const Checkout = () => {
  const isFocused = useIsFocused();
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

  const [showAddressSheet, setShowAddressSheet] = useState<boolean>(false);
  const handleSelectAddress = (address: any) => {
    const delivery_address = {
      first_name: user.firstName,
      last_name: user.lastName,
      email: user.email,
      phone: user.phoneNumber,
      line1: address.addressLine1,
      line2: address.addressLine2 ? address.addressLine2 : address.addressLine1,
      city: address.city,
      state: address.state,
      country: address.country,
      zip: address.zipCode,
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

  const getPickupAddress = async (sellerId: string) => {
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
        first_name: response.data.personalInfo.firstName,
        last_name: response.data.personalInfo.lastName,
        email: response.data.contactInformation.businessEmail
          ? response.data.contactInformation.businessEmail
          : "bolu@gmail.com",
        phone:
          "+234" +
          (response.data.businessInfo.businessNumber
            ? response.data.businessInfo.businessNumber
            : "8083412865"),
        line1: response.data.contactInformation.businessAddress.addressLine1
          ? response.data.contactInformation.businessAddress.addressLine1
          : "ajayi crowder way",
        line2: response.data.contactInformation.businessAddress.addressLine2
          ? response.data.contactInformation.businessAddress.addressLine2
          : "boluwa street",
        city: "Amuwo-Odofin",
        // || response.data.contactInformation.businessAddress.city,
        state: response.data.contactInformation.businessAddress.state
          ? response.data.contactInformation.businessAddress.state
          : "lagos",
        country: response.data.contactInformation.businessAddress.country
          ? response.data.contactInformation.businessAddress.country
          : "NG",
        zip: response.data.contactInformation.businessAddress.zipCode
          ? response.data.contactInformation.businessAddress.zipCode
          : "100001",
      };
      return { [`${sellerId}`]: pickup_address };
    } catch (e) {
      console.log("error fetching buyer addresses ", e);
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

        const pickup_address = {
          first_name:
            cart.seller.personalInfo?.firstName || cart.seller.firstName,
          last_name: cart.seller.personalInfo?.lastName || cart.seller.lastName,
          email:
            cart.seller.businessInfo?.businessEmail ||
            cart.seller.personalInfo?.email ||
            cart?.seller?.email,
          phone: cart.seller.phoneNumber?.includes("+")
            ? cart.seller.phoneNumber
            : `+${cart.seller.phoneNumber}`,
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

  const handleCompleteOrder = async () => {
    if (!selectedAddress) {
      return toast.info("Please add a delivery address");
    }
    console.log("info ", cart[0].seller);

    const order = {
      items: cart.map((item) => {
        return {
          productId: item._id,
          quantity: item.quantity,
          name: item.name,
          description: item.description,
          weight: item.weight * item.quantity,
          price: item?.discount?.discountedPrice || item.price,
          sellerId: item.seller._id,
          specifications: item.specifications,
        };
      }),
      pickup_addresses: pickupAddress,
      delivery_address: selectedAddress,
      paymentMethod: "paystack",
    };

    try {
      setOrderloading(true);
      const token = await getToken();
      // console.log("order ==> ", order);
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
      // console.log("order Response ==> ", response.data);
      if (response.status == 201) {
        await AsyncStorage.setItem(
          "orders",
          JSON.stringify(response.data.orders),
        );
        const cart = await AsyncStorage.getItem("cart");
        const newCart = JSON.parse(cart!).filter(
          (item: any) => !item.includeInOrder,
        );
        if (newCart.length < 1) {
          await AsyncStorage.removeItem("cart");
        } else {
          await AsyncStorage.setItem("cart", JSON.stringify(newCart));
        }
        router.replace(`/checkout/${response.data.orders[0].orderId}`);
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
    getCart();
  }, []);

  useEffect(() => {
    if (user && isFocused) getAddresses();
  }, [user, isFocused]);

  useEffect(() => {
    handleCalculateTotal();
  }, [uniqueSellers, cart]);
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
              color={"#16783A"}
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

              {cart?.length > 0
                ? cart.map((cartItem, index) => (
                    <CartItem cartItem={cartItem} key={index} />
                  ))
                : null}

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
                      source={require("../../../assets/icons/delivery-icon.png")}
                      resizeMode="contain"
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

              <View className="rounded-[3px] border-[#ccc] border-[0.3px] pr-[12px] flex-row items-center justify-between mb-[10px]">
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
              </View>

              <View
                className="p-[20px] rounded-[5px] gap-[10px]"
                style={{ backgroundColor: "rgba(41, 41, 41, 0.81)" }}
              >
                <View className="flex-row justify-between items-center">
                  <Text className="text-white text-[16px] font-LexendDecaSemiBold">
                    Merchandise Subtotal
                  </Text>
                  <Text className="text-[#16783A] text-[16px] font-LexendDecaSemiBold">
                    ₦{cartTotal.toLocaleString()}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                className="rounded-[5px] items-center justify-center p-[12px] bg-[#16783A]"
                onPress={handleCompleteOrder}
              >
                <Text className="text-white text-[16px] font-LexendDecaMedium">
                  Complete Order
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        <LoadingModal isVisible={orderLoading} />
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
              cartItem?.seller?.storeInfo?.storeName}
          </Text>
        </View>
        <View className="flex-row gap-[16px]">
          <View>
            <Image
              source={{ uri: cartItem?.images[0].url }}
              resizeMode="cover"
              className="w-[115px] h-[136px]"
            />
          </View>
          <View className="gap-[6px] relative shrink">
            <Text className="text-[14px] text-[#16783A] font-LexendDecaSemiBold">
              {cartItem?.name.length > 20
                ? cartItem?.name.slice(0, 20) + "..."
                : cartItem?.name}
            </Text>
            <Text className="text-[16px] text-[#F2F2F2] font-LexendDecaSemiBold">
              ₦
              {cartItem?.discount?.isActive
                ? cartItem?.discount?.discountedPrice?.toLocaleString() || 0
                : cartItem?.price?.toLocaleString()}
            </Text>
            <Text className="text-[12px] text-[#F2F2F2] font-LexendDecaLight">
              Item ID: {cartItem._id?.toLocaleString().slice(0, 12)}...
            </Text>
            <View className="flex-row items-center gap-[11px]">
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
