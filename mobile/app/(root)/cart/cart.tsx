import {
  View,
  Text,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Pressable,
  Image,
} from "react-native";
import React, { memo, useCallback, useEffect, useState } from "react";
import { FocusAwareStatusBar } from "@/components/ui/focus-aware-status-bar";
import { router } from "expo-router";
import Entypo from "@expo/vector-icons/Entypo";
import { ActivityIndicator } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CartList from "@/components/cart/cart-list";
import { useIsFocused } from "@react-navigation/native";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { toast } from "@/core/toast";
import { toast as sonnerToast } from "sonner-native";
import BouncyCheckbox from "react-native-bouncy-checkbox";
import axios from "axios";
import { getToken } from "@/store/features/auth/utils";
import WishList from "@/components/cart/wishlist";
import { trackEvent } from "@/utils/analytics";
import { trackEvent as trackEventMixpanel } from "@/utils/mixpanel";
import { trackEvent as trackEventCustomerio } from "@/utils/customerio";
import { trackFacebookEvent } from "@/utils/facebook-analytics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import SafeAreaView from "@/components/global/safeareaview/SafeAreaView";
import AntDesign from "@expo/vector-icons/AntDesign";
import CartEmptyIcon from "@/components/global/empty-states/cartEmptyIcon";
import { FlatList } from "react-native-gesture-handler";

const { width, height } = Dimensions.get("window");

const CartScreen = () => {
  const insets = useSafeAreaInsets();
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const isFocused = useIsFocused();

  const [cartTotal, setCartTotal] = useState<number>(0);
  const [cartLength, setCartLength] = useState<number>(0);

  const [tab, setTab] = useState<string>("cart");
  const [wishList, setWishList] = useState<any[]>([]);
  const [wishListLoading, setWishListLoading] = useState<boolean>(true);
  const [conversations, setConversations] = useState<any[]>([]);
  const [segmentedCartGroup, setSegmentedCartGroup] = useState<any>();
  const [uniqueSellersGroup, setUniqueSellersGroup] = useState<any>();

  const handleIncludeAllinCart = (isChecked: boolean) => {
    handleModifyCart("includeAll", {
      ...cart[0],
      includeInOrder: isChecked,
    });
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
    setCartLength(cartLength);
  };

  const handleCheckout = async (sellerId: string) => {
    if (cartTotal < 1) {
      return toast.info("Select Items to Checkout");
    }

    const segmentedCart = cart?.filter(
      (item: any) => item?.seller?._id == sellerId,
    );
    await AsyncStorage.setItem("segmentedCart", JSON.stringify(segmentedCart));
    return router.push("/checkout/checkout");
  };
  useEffect(() => {
    handleCalculateTotal();
  }, [cart]);

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

  const segmentCartBySeller = useCallback(() => {
    if (cart?.length > 0) {
      const segmentedCart = {} as any;
      const uniqueSellers = new Set() as Set<string>;

      cart?.forEach((item: any) => {
        const sellerId = item?.seller?._id;
        if (segmentedCart[sellerId]) {
          segmentedCart[sellerId].push(item);
        } else {
          segmentedCart[sellerId] = [item];
        }
        uniqueSellers.add(sellerId);
      });

      setSegmentedCartGroup(segmentedCart);
      setUniqueSellersGroup(Array.from(uniqueSellers));
      setLoading(false);
    }

    // console.log(uniqueSellers);

    // console.log({ segmentedCart, uniqueSellers });
  }, [cart]);

  const handleGetCart = async () => {
    setLoading(true);
    try {
      const cartData = await AsyncStorage.getItem("cart");
      setCart(JSON.parse(cartData!));
      if (!cartData) {
        setLoading(false);
      }
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const handleModifyCart = useCallback(
    async (action: string, data: any) => {
      try {
        switch (action) {
          case "remove":
            const cartData = await AsyncStorage.getItem("cart");
            const cartArray = JSON.parse(cartData!);
            const newCart = cartArray.filter(
              (item: any) => item._id !== data._id,
            );
            await AsyncStorage.setItem("cart", JSON.stringify(newCart));
            setCart(newCart);
            break;
          case "changeQuantity":
            const cartData2 = await AsyncStorage.getItem("cart");
            const cartArray2 = JSON.parse(cartData2!);
            const newCart2 = cartArray2.map((item: any) => {
              if (item._id == data._id) {
                return { ...item, quantity: data.quantity };
              }
              return item;
            });
            await AsyncStorage.setItem("cart", JSON.stringify(newCart2));
            setCart(newCart2);
            break;
          case "includeInOrder":
            const cartData3 = await AsyncStorage.getItem("cart");
            const cartArray3 = JSON.parse(cartData3!);
            const newCart3 = cartArray3.map((item: any) => {
              if (item._id == data._id) {
                return { ...item, includeInOrder: data.includeInOrder };
              }
              return item;
            });
            await AsyncStorage.setItem("cart", JSON.stringify(newCart3));
            setCart(newCart3);
            break;
          case "includeAll":
            const cartData4 = await AsyncStorage.getItem("cart");
            const cartArray4 = JSON.parse(cartData4!);
            const newCart4 = cartArray4.map((item: any) => {
              return { ...item, includeInOrder: data.includeInOrder };
            });
            await AsyncStorage.setItem("cart", JSON.stringify(newCart4));
            setCart(newCart4);
            break;
          case "moveToWishList":
            try {
              const userData = await AsyncStorage.getItem("user");
              const user = JSON.parse(userData || "{}");
              trackEventMixpanel("product_added_to_wishlist", {
                productId: data._id,
                productName: data?.name,
                productPrice: data?.price,
                productImage: data?.images[0]?.url,
                userId: user?._id,
                email: user?.email,
                firstName: user?.firstName,
                lastName: user?.lastName,
                username: user?.username,
                timestamp: new Date().toISOString(),
              });

              trackEventCustomerio("product_added_to_wishlist", {
                productId: data._id,
                productName: data?.name,
                productPrice: data?.price,
                productImage: data?.images[0]?.url,
                userId: user?._id,
                email: user?.email,
                firstName: user?.firstName,
                lastName: user?.lastName,
                username: user?.username,
                timestamp: new Date().toISOString(),
              });

              trackFacebookEvent("AddToWishlist", {
                productId: data._id,
                productName: data?.name,
                productPrice: `₦${data?.price?.toLocaleString()}`,
                productImage: data?.images[0]?.url,
                email: user?.email,
                firstName: user?.firstName,
                lastName: user?.lastName,
                username: user?.username,
                timestamp: new Date().toISOString(),
              });
            } catch (error) {
              console.log(error);
            }
            handleModifyCart("remove", data);
            handleModifyWishList("add", data._id);
        }
      } catch (e) {
        console.log(e);
      }
    },
    [cart],
  );

  const handleCreateWishList = async (id: string) => {
    try {
      const token = await getToken();
      const response = await axios.post(
        process.env.EXPO_PUBLIC_API_URL + "api/buyer/wishlist",
        {
          productId: id,
        },
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        },
      );
      sonnerToast("Moved To Wishlist", {
        icon: <AntDesign name="heart" size={24} color="black" />,
        position: "bottom-center",
      });
    } catch (e) {
      console.log(e);
    }
  };

  const handleGetWishList = async () => {
    try {
      const token = await getToken();
      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL + "api/buyer/wishlist",
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        },
      );

      setWishList(response.data);
    } catch (e) {
      console.log(e);
    } finally {
      setWishListLoading(false);
    }
  };

  const handleRemoveWishtList = async (id: string) => {
    try {
      const token = await getToken();
      const response = await axios.delete(
        process.env.EXPO_PUBLIC_API_URL + "api/buyer/wishlist/" + id,
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        },
      );
    } catch (e) {
      console.log(e);
    }
  };

  const handleModifyWishList = useCallback(
    async (action: string, data: any) => {
      switch (action) {
        case "add":
          handleCreateWishList(data);
          break;
        case "delete":
          setWishList(wishList.filter((item) => item?.product?._id !== data));
          handleRemoveWishtList(data);
          break;
        default:
          console.log(data);
      }
    },
    [wishList],
  );

  const renderCartGroups = useCallback(
    ({ item, index }: any) => {
      return (
        <CartSegment
          item={segmentedCartGroup[item]}
          handleModifyCart={handleModifyCart}
          conversations={conversations}
          handleCheckout={handleCheckout}
        />
      );
    },
    [uniqueSellersGroup, segmentedCartGroup],
  );

  // useEffect(() => {},[wishList])

  useEffect(() => {
    if (isFocused) {
      handleGetCart();
      handleGetWishList();
      handleGetConversations();
    }
  }, [isFocused]);

  useEffect(() => {
    if (tab == "wishlist") {
      handleGetWishList();
    }
  }, [tab]);

  useEffect(() => {
    if (cart) segmentCartBySeller();
  }, [cart]);
  return (
    <SafeAreaView className={`flex-1 bg-[#121212] relative`}>
      <FocusAwareStatusBar barStyle="light-content" backgroundColor="#121212" />

      <View className="relative h-full relative flex-1">
        <View className="p-[20px] pt-[30px]">
          <TouchableOpacity className="" onPress={() => router.back()}>
            <Entypo
              name="chevron-left"
              size={24}
              color="rgba(204, 204, 204, 0.8)"
            />
          </TouchableOpacity>
        </View>
        <View className="px-[20px]">
          <View className="border-white border-[2px] flex-row mb-[10px]">
            <Pressable
              className={`basis-1/2 py-[18px] ${tab == "cart" ? "bg-white" : null} items-center justify-center relative`}
              onPress={() => setTab("cart")}
            >
              <Text
                className={`${tab == "cart" ? "text-black" : "text-white"} font-LexendDecaMedium text-[12px]`}
              >
                Cart
              </Text>
              <View className="absolute top-[-13.5px] right-[33px] w-[23px] h-[23px] items-center justify-center rounded-[50%] bg-[#DD0000]">
                <Text className="text-white text-[11px]">
                  {cart?.length || 0}
                </Text>
              </View>
            </Pressable>
            <Pressable
              className={`basis-1/2 py-[18px] flex-row ${tab == "wishlist" ? "bg-white" : null} items-center justify-between pl-[27px] pr-[17px] gap-[12px]`}
              onPress={() => setTab("wishlist")}
            >
              <Text
                className={`${tab == "wishlist" ? "text-black" : "text-white"} text-[12px] self-center font-LexendDecaMedium`}
              >
                Wishlist
              </Text>
              <FontAwesome6
                name="caret-right"
                size={16}
                color={tab == "wishlist" ? "black" : "white"}
              />
            </Pressable>
          </View>
        </View>

        {tab == "cart" && (
          <View className=" relative flex-1">
            {cart?.length > 0 ? (
              <FlatList
                data={uniqueSellersGroup}
                renderItem={renderCartGroups}
                keyExtractor={(item, index) => item?.toString() || index}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                  gap: 20,
                }}
              />
            ) : // <CartList
            //   cart={cart}
            //   handleModifyCart={handleModifyCart}
            //   conversations={conversations}
            // />
            loading ? (
              <ActivityIndicator
                size="small"
                color={"#fff"}
                style={{ marginTop: 30 }}
              />
            ) : (
              <EmptyCart />
            )}
          </View>
        )}

        {tab == "wishlist" && (
          <View className="flex-1">
            {wishListLoading ? (
              <ActivityIndicator size="small" color={"#16783A"} />
            ) : wishList?.length > 0 ? (
              <WishList
                wishlist={wishList}
                handleModifyWishList={handleModifyWishList}
              />
            ) : (
              <EmptyWishList />
            )}
          </View>
        )}

        {/* {tab == "cart" && cart?.length > 0 && (
          <View
            className="px-[20px] py-[10px] flex-row items-center justify-between gap-[20px] w-full flex-wrap justify-end bg-[#121212]"
            
          >
            <View className="flex-row items-center">
              <View>
                <BouncyCheckbox
                  isChecked={cartLength < cart?.length ? false : true}
                  size={18}
                  fillColor="#16783A"
                  iconStyle={{ borderColor: "red" }}
                  innerIconStyle={{ borderWidth: 1 }}
                  onPress={(isChecked: boolean) => {
                    if (cart?.length > 0) handleIncludeAllinCart(isChecked);
                  }}
                />
              </View>
              <Text className="text-white text-[12px] font-LexendDecaMedium mr-2 ">
                All
              </Text>
              <View className="flex-row items-center gap-[12px]">
                <Text className="text-white text-[12px] font-LexendDecaMedium ">
                  Subtotal:
                </Text>
                <Text className="text-[#16783A] text-[12px] font-LexendDecaMedium ">
                  {cartTotal?.toLocaleString()}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              className={`py-[8px] w-[140px] px-[16px] ${cartTotal < 1 ? "bg-[#C6C6C6]" : "bg-[#16783A]"} rounded-[10px] items-center justify-center`}
              onPress={handleCheckout}
            >
              <Text className="text-white text-[14px] font-LexendDecaMedium ">
                Checkout ({cartLength})
              </Text>
            </TouchableOpacity>
          </View>
        )} */}
      </View>
    </SafeAreaView>
  );
};

const CartSegment = memo((props: any) => {
  return (
    <CartList
      cart={props?.item}
      handleModifyCart={props?.handleModifyCart}
      conversations={props?.conversations}
      handleCheckout={props?.handleCheckout}
    />
  );
});

const EmptyCart = () => {
  return (
    <View className=" flex-1 items-center p-[50px] justify-center mb-[80px]">
      <View className="mb-[16px]">
        <CartEmptyIcon />
      </View>

      <View className="items-center gap-[8px] justify-center">
        <Text className="text-[16px] text-[#fff] font-LexendDecaSemiBold">
          Your Cart is Empty
        </Text>
        <Text className="text-[15px] text-[#cccccc] font-LexendDeca text-center mb-[6px]">
          Preview some of the available products and add them to cart.
        </Text>
        <Pressable
          className="bg-[#16783A] rounded-[18px] items-center justify-center h-[36px] px-[24px]"
          onPress={() => router.replace("/home/marketplace")}
        >
          <Text className="text-[14px] text-[#ffffff] font-LexendDecaMedium text-center">
            Continue Shopping
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

const EmptyWishList = () => {
  return (
    <View className=" flex-1 items-center p-[50px] justify-center mb-[80px]">
      <View className="mb-[16px]">
        <CartEmptyIcon />
      </View>

      <View className="items-center gap-[8px] justify-center">
        <Text className="text-[16px] text-[#fff] font-LexendDecaSemiBold">
          Your Wishlist is Empty
        </Text>
        <Text className="text-[15px] text-[#cccccc] font-LexendDeca text-center mb-[6px]">
          Tap the heart button on an item to start saving your favorite
          products.
        </Text>
        <Pressable
          className="bg-[#16783A] rounded-[18px] items-center justify-center h-[36px] px-[24px]"
          onPress={() => router.replace("/home/marketplace")}
        >
          <Text className="text-[14px] text-[#ffffff] font-LexendDecaMedium text-center">
            Continue Shopping
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

export default CartScreen;
