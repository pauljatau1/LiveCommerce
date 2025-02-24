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
    <View className="px-[20px] h-[90%]">
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

    useEffect(() => {
      handleModifyCart("includeInOrder", { ...cartItem, includeInOrder });
    }, [includeInOrder]);

    useEffect(() => {
      setIncludeInOrder(cartItem.includeInOrder);
    }, [cartItem]);

    useEffect(() => {
      handleModifyCart("changeQuantity", { ...cartItem, quantity });
    }, [quantity]);

    return (
      <View className="border-[2px] border-[#CCCCCC] rounded-[16px] p-[14px] flex-row mb-[20px]">
        <View className="mt-[2px]">
          <BouncyCheckbox
            isChecked={includeInOrder}
            size={18}
            fillColor="#16783A"
            iconStyle={{ borderColor: "red" }}
            innerIconStyle={{ borderWidth: 1 }}
            onPress={(isChecked: boolean) => {
              setIncludeInOrder(isChecked);
            }}
          />
        </View>
        <View className="gap-[16px] shrink">
          <View className=" flex-row items-center justify-between">
            <Text className="text-[16px] text-white font-LexendDecaSemiBold">
              {cartItem?.seller?.storeInfo?.storeName}
              {/* {includeInOrder.toString()} */}
            </Text>
            <TouchableOpacity
              className="rounded-[8px] px-[8px] py-[6px] bg-white flex-row items-center gap-2"
              onPress={() =>
                router.push({
                  pathname: `/(root)/messageRoom/${cartItem.seller._id}`,
                  params: {
                    name:
                      cartItem.seller?.storeName ||
                      cartItem.seller?.personalInfo?.firstName +
                        " " +
                        cartItem.seller?.personalInfo?.lastName ||
                      "Default",
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
              <Text className="text-[#16783A] text-[10px]">Message Seller</Text>
              <AntDesign name="arrowright" size={12} color="#16783A" />
            </TouchableOpacity>
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
              <Text className="text-[14px] text-white font-LexendDecaLight">
                {cartItem?.seller?.storeInfo?.storeName}
              </Text>
              <Text className="text-[14px] text-[#16783A] font-LexendDecaSemiBold">
                {cartItem.name.length > 20
                  ? cartItem.name.slice(0, 20) + "..."
                  : cartItem.name}
              </Text>
              <Text className="text-[16px] text-[#F2F2F2] font-LexendDecaSemiBold">
                ₦
                {cartItem?.discount?.isActive
                  ? cartItem?.discount?.discountedPrice?.toLocaleString() || 0
                  : cartItem?.price?.toLocaleString()}
              </Text>
              <View className="flex-row items-center gap-[11px]">
                <TouchableOpacity
                  className="w-[24px] h-[24px] border-white border-[1px] rounded-[24px] items-center justify-center"
                  onPress={() => setQuantity(quantity === 1 ? 1 : quantity - 1)}
                >
                  <AntDesign name="minus" size={14} color="white" />
                </TouchableOpacity>
                <Text className="text-white text-[11px] font-LexendDecaMedium">
                  {quantity}
                </Text>
                <TouchableOpacity
                  className="w-[24px] h-[24px] bg-white rounded-[24px] items-center justify-center"
                  onPress={() => setQuantity(quantity + 1)}
                >
                  <AntDesign name="plus" size={14} color="black" />
                </TouchableOpacity>
              </View>
              <View className="flex-row justify-between items-center gap-8 mt-[4px]">
                <TouchableOpacity
                  className="w-[110px] py-[8px] px-[16px] bg-[#16783A] rounded-[4px]"
                  onPress={() => handleModifyCart("moveToWishList", cartItem)}
                >
                  <Text className="text-white text-[10px]">
                    Move to wishlist
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className=""
                  onPress={() => handleModifyCart("remove", cartItem)}
                >
                  <Ionicons name="trash-outline" size={20} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  },
);

export default memo(CartList);
