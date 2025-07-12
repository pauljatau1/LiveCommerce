import {
  View,
  Text,
  Pressable,
  TouchableOpacity,
  Image,
  FlatList,
} from "react-native";
import React, { memo, useEffect, useState } from "react";
import AntDesign from "@expo/vector-icons/AntDesign";
import Ionicons from "@expo/vector-icons/Ionicons";
import BouncyCheckbox from "react-native-bouncy-checkbox";
import { router } from "expo-router";
import { getToken, getUser } from "@/store/features/auth/utils";
import { toast } from "@/core/toast";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const CartList = ({
  cart,
  handleModifyCart,
  conversations,
}: {
  cart: any[];
  handleModifyCart: (action: string, data: any) => Promise<void>;
  conversations: any;
}) => {
  const [user, setUser] = useState<any>({});

  const getUserData = async () => {
    const userData = await getUser();
    const token = await getToken();
    setUser({
      id: userData._id,
      token,
    });
  };

  useEffect(() => {
    getUserData();
  }, []);

  return (
    <View className="px-[20px] h-[100%]">
      {/* <ScrollView className="w-full" showsVerticalScrollIndicator={false}> */}
      <FlatList
        data={cart}
        renderItem={({ item }) => (
          <CartItem
            cartItem={item}
            handleModifyCart={handleModifyCart}
            key={item._id}
            conversations={conversations}
            user={user}
          />
        )}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => (
          <View className="h-[1px] bg-white opacity-20 w-full"></View>
        )}
      />
    </View>
  );
};

const CartItem = memo(
  ({
    cartItem,
    handleModifyCart,
    conversations,
    user,
  }: {
    cartItem: any;
    handleModifyCart: (action: string, data: any) => Promise<void>;
    conversations: any;
    user: any;
  }) => {
    const [quantity, setQuantity] = useState<number>(cartItem?.quantity);
    const [includeInOrder, setIncludeInOrder] = useState<boolean>(
      cartItem?.includeInOrder,
    );
    const wishlistBtnScale = useSharedValue(1);

    const wishlistBtnStyle = useAnimatedStyle(() => ({
      transform: [{ scale: wishlistBtnScale.value }],
    }));

    useEffect(() => {
      handleModifyCart("includeInOrder", { ...cartItem, includeInOrder });
    }, [includeInOrder]);

    useEffect(() => {
      setIncludeInOrder(cartItem.includeInOrder);
    }, [cartItem]);

    useEffect(() => {
      handleModifyCart("changeQuantity", { ...cartItem, quantity });
    }, [quantity]);

    const modifyCart = () => {
      handleModifyCart("moveToWishList", cartItem);
    };

    return (
      <TouchableOpacity
        className=" rounded-[16px] py-[30px] px-[8px] flex-row "
        activeOpacity={0.8}
        onPress={() => router.push(`/product/${cartItem?._id}`)}
      >
        <View className="gap-[16px] shrink">
          <View className=" flex-row items-center justify-between w-full gap-[8px]">
            <View className="shrink">
              <BouncyCheckbox
                isChecked={includeInOrder}
                size={18}
                fillColor="#16783A"
                iconStyle={{ borderColor: "red" }}
                innerIconStyle={{ borderWidth: 1 }}
                onPress={(isChecked: boolean) => {
                  setIncludeInOrder(isChecked);
                }}
                textComponent={
                  <Text
                    className="text-[16px] ml-[8px] text-white font-LexendDeca shrink"
                    numberOfLines={1}
                  >
                    {cartItem?.seller?.storeInfo?.storeName ||
                      cartItem?.seller?.storeName}
                  </Text>
                }
              />
            </View>

            <TouchableOpacity
              className="rounded-[12px] px-[8px] py-[6px] bg-white flex-row items-center gap-2"
              onPress={() =>
                router.push({
                  pathname: `/(root)/messageRoom/${cartItem.seller._id}`,
                  params: {
                    name:
                      cartItem.seller?.storeName ||
                      cartItem?.seller?.storeInfo?.storeName ||
                      cartItem.seller?.personalInfo?.firstName +
                        " " +
                        cartItem.seller?.personalInfo?.lastName ||
                      "Store",
                    avatar: cartItem.seller?.storeAvatar?.url,
                    conversationId:
                      conversations?.find(
                        (convo: any) =>
                          convo.participant.id == cartItem.seller._id,
                      )?._id || "",
                    userId: user?.id,
                    token: user?.token,
                    model: "Seller",
                  },
                })
              }
            >
              <Text className="text-[#16783A] text-[10px] font-LexendDecaMedium">
                Message Seller
              </Text>
              {/* <AntDesign name="arrowright" size={12} color="#16783A" /> */}
            </TouchableOpacity>
          </View>
          <View className="flex-row gap-[16px]">
            <View>
              <Image
                source={{ uri: cartItem?.images[0].url }}
                resizeMode="cover"
                className="w-[100px] h-[100px] rounded-[12px]"
                style={
                  {
                    // backgroundColor: "white",
                  }
                }
              />
            </View>
            <View className="relative shrink">
              {/* <Text className="text-[14px] text-white font-LexendDecaLight">
                {cartItem?.seller?.storeInfo?.storeName}
              </Text> */}
              <Text
                className="text-[14px] text-[#ffffff] opacity-80 font-LexendDeca mb-[4px] leading-[20px]"
                numberOfLines={2}
              >
                {cartItem.name}
              </Text>
              {/* <Text className="text-[16px] text-[#F2F2F2] font-LexendDecaSemiBold">
                ₦
                {cartItem?.discount?.isActive
                  ? cartItem?.discount?.discountedPrice?.toLocaleString() || 0
                  : cartItem?.price?.toLocaleString()}
              </Text> */}
              {cartItem?.discount?.isActive ? (
                <View className="flex-row items-end gap-[4px] flex-wrap">
                  <Text className="text-white text-[16px] font-LexendDecaMedium tracking-wide">
                    ₦
                    {cartItem?.discount?.isActive
                      ? cartItem?.discount?.discountedPrice?.toLocaleString()
                      : cartItem?.price?.toLocaleString()}
                  </Text>
                  <Text className="text-[#16783A] text-[10px] font-LexendDecaMedium line-through">
                    ₦
                    {cartItem?.discount?.isActive &&
                      cartItem?.price.toLocaleString()}
                  </Text>
                  <Text className="text-[10px] text-[#16783A] font-LexendDecaMedium">
                    {cartItem?.discount?.value?.toFixed(0)}
                    {cartItem?.discount?.type == "percentage" && "%"} off
                  </Text>
                </View>
              ) : (
                <Text className="text-white font-LexendDecaMedium tracking-wide  text-[16px]">
                  ₦{cartItem?.price?.toLocaleString()}
                </Text>
              )}
              {(cartItem?.seller?.offersStorePickup ||
                cartItem?.seller?.shippingInfo?.offersStorePickup) && (
                <View className="mt-[6px] p-[4px] px-[8px] bg-[#1683da33] items-center justify-center self-start rounded-[10px]">
                  <Text className="text-[8px] text-[#1683da] font-LexendDeca">
                    Store Pickup Available
                  </Text>
                </View>
              )}
              <View className="flex-row justify-between items-center gap-8 mt-auto w-full">
                <View className="flex-row items-center gap-[11px]">
                  <TouchableOpacity
                    className="w-[24px] h-[24px] border-white border-[1px] rounded-[24px] items-center justify-center"
                    onPress={() =>
                      setQuantity(quantity === 1 ? 1 : quantity - 1)
                    }
                  >
                    <AntDesign name="minus" size={14} color="white" />
                  </TouchableOpacity>
                  <Text className="text-white text-[11px] font-LexendDecaMedium">
                    {quantity}
                  </Text>
                  <TouchableOpacity
                    className="w-[24px] h-[24px] bg-white rounded-[24px] items-center justify-center"
                    onPress={() => {
                      if (quantity >= cartItem?.stock) {
                        return toast.error("max stock reached");
                      }
                      setQuantity(quantity + 1);
                    }}
                  >
                    <AntDesign name="plus" size={14} color="black" />
                  </TouchableOpacity>
                </View>
                <View className="flex-row items-center gap-[12px]">
                  <AnimatedPressable
                    onPressIn={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
                      wishlistBtnScale.value = withTiming(0.95, {
                        duration: 100,
                        easing: Easing.out(Easing.ease),
                      });
                    }}
                    onPressOut={() => {
                      wishlistBtnScale.value = withTiming(
                        1,
                        {
                          duration: 100,
                        },

                        () => runOnJS(modifyCart)(),
                      );
                    }}
                    style={[wishlistBtnStyle]}
                    className="h-[24px] w-[24px] rounded-[24px] bg-[#ffffff33] items-center justify-center"
                    // onPress={() => handleModifyCart("moveToWishList", cartItem)}
                  >
                    <AntDesign name="hearto" size={14} color="white" />
                  </AnimatedPressable>
                  <TouchableOpacity
                    className=""
                    onPress={() => handleModifyCart("remove", cartItem)}
                  >
                    <Ionicons name="trash-outline" size={20} color="white" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* <View
                className="flex-row justify-between items-center gap-8 mt-[4px] w-full"
                style={{
                  marginTop: "auto",
                }}
              >
                <TouchableOpacity
                  className="px-[12px] py-[8px] justify-center items-center px-[16px] bg-[#16783A] rounded-[4px]"
                  onPress={() => handleModifyCart("moveToWishList", cartItem)}
                >
                  <Text className="text-white text-[10px] font-LexendDecaMedium">
                    Move to wishlist
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className=""
                  onPress={() => handleModifyCart("remove", cartItem)}
                >
                  <Ionicons name="trash-outline" size={20} color="white" />
                </TouchableOpacity>
              </View> */}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  },
);

export default memo(CartList);
