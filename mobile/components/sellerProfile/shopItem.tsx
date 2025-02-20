import React, { useEffect, useState } from "react";
import { View, Text, Image, TouchableOpacity, Pressable } from "react-native";
import { icons, images } from "@/constants";
import { ProductCardProps } from "@/types/types";
import CustomButton from "../global/button/CustomButton";
import { router, useRouter } from "expo-router";
import AntDesign from "@expo/vector-icons/AntDesign";
import Ionicons from "@expo/vector-icons/Ionicons";
import BottomSheet from "../global/bottom-sheet";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { toast } from "@/core/toast";

const ShopCard: React.FC<ProductCardProps> = ({
  imageUrl,
  id,
  profileImage,
  title,
  price,
  category,
  location,
  sellerName,
  sellerRating,
  isTopSeller,
  isLive,
  isOnline,
  isVerified,
  showNike = true,
  moreDetails,
  closeSheet,
  discount,
  ...props
}) => {
  const firstImage =
    imageUrl && imageUrl.length > 0 ? imageUrl[0] : images.diamondsImage;

  const router = useRouter();

  const [showCartSheet, setShowCartSheet] = useState<boolean>(false);
  const [showAddedToCartSheet, setShowAddedToCartSheet] =
    useState<boolean>(false);

  const handleAddToCart = async (cartItem: any) => {
    try {
      const cartItems = await AsyncStorage.getItem("cart");

      if (cartItems) {
        const cart = JSON.parse(cartItems);
        const item = cart.find((item: any) => item._id === cartItem._id);
        if (item) {
          return toast.info("Item already in cart");
        }
        const newCart = [...cart, cartItem];
        await AsyncStorage.setItem("cart", JSON.stringify(newCart));
        setShowCartSheet(false);
        setShowAddedToCartSheet(true);
      } else {
        await AsyncStorage.setItem("cart", JSON.stringify([cartItem]));
        setShowCartSheet(false);
        setShowAddedToCartSheet(true);
      }
    } catch (e) {
      console.log(e);
      toast.error("error adding item to cart");
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      className="rounded-lg  w-[100%]"
      onPress={() => {
        closeSheet();
        router.push(`/product/${id}`);
      }}
    >
      {/* Product Image */}
      {firstImage && (
        <Image
          source={
            firstImage.url
              ? {
                  uri: firstImage.url,
                }
              : images.diamondsImage
          }
          resizeMode="cover"
          className="w-[100%] h-[157px] rounded-[6px]"
          style={{ marginBottom: 4 }}
        />
      )}
      <View>
        {discount?.isActive ? (
          <View className="flex-row items-center gap-[4px] flex-wrap">
            <Text className="text-white text-[10px] font-LexendDecaMedium">
              ₦
              {discount?.isActive
                ? discount?.discountedPrice?.toLocaleString()
                : price?.toLocaleString()}
            </Text>
            <Text className="text-[#16783A] text-[8px] font-LexendDecaMedium line-through">
              ₦{discount?.isActive && price.toLocaleString()}
            </Text>
            <Text className="text-[8px] text-[#16783A] font-LexendDecaBold">
              {discount?.value?.toFixed(1)}
              {discount?.type == "percentage" && "%"} off
            </Text>
          </View>
        ) : (
          <Text className="text-white font-LexendDecaBold  text-[10px]">
            ₦{price?.toLocaleString()}
          </Text>
        )}
      </View>

      {/* Product Details */}
      <View>
        <Text
          className="text-white text-[10px] capitalize font-LexendDecaBold  text-normal pt-3"
          style={{
            height: 50,
          }}
        >
          {title?.length > 40 ? title?.slice(0, 40) + "..." : title}
        </Text>
      </View>

      {/* <View className="flex-row gap-[2px] items-center">
        {Array(5)
          .fill(0)
          .map((_, index) =>
            parseInt(moreDetails?.reviews?.length) < index + 1 ? (
              <AntDesign
                key={index}
                name="star"
                size={8}
                color="#rgba(255, 255, 255, 0.62)"
              />
            ) : (
              <AntDesign name="star" size={8} color="#FFD700" key={index} />
            ),
          )}
      </View> */}

      <CustomButton
        textStyle="!text-[8px] !font-semibold  !py-0"
        title="Buy"
        className="w-full mt-[8px] bg-primary-200 !p-0 !px-[9.872px] !rounded-[2.962px] py-[8px] self-center"
        onPress={() => {
          setShowCartSheet(true);
        }}
      />
    </TouchableOpacity>
  );
};

export default ShopCard;
