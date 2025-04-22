import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Pressable } from "react-native";
import { icons, images } from "@/constants";
import { ProductCardProps } from "@/types/types";
import CustomButton from "../button/CustomButton";
import { router, useRouter } from "expo-router";
import AntDesign from "@expo/vector-icons/AntDesign";
import Ionicons from "@expo/vector-icons/Ionicons";
import BottomSheet from "../bottom-sheet";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { toast } from "@/core/toast";
import AuthSheet from "@/components/auth/authSheet";
import { getToken } from "@/store/features/auth/utils";
import AddedToCart from "@/components/product/productAddedToCart";
import CartSheet from "@/components/product/productCartSheet";
import { formatNumber } from "@/helpers/helpers";
import { Image } from "expo-image";

const ProductCard: React.FC<ProductCardProps | any> = ({
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
  width,
  ...props
}) => {
  const firstImage =
    imageUrl && imageUrl.length > 0 ? imageUrl[0] : images.diamondsImage;

  const router = useRouter();

  const [showCartSheet, setShowCartSheet] = useState<boolean>(false);
  const [showAddedToCartSheet, setShowAddedToCartSheet] =
    useState<boolean>(false);
  const [token, setToken] = useState<string>("");
  const [showAuthSheet, setShowAuthSheet] = useState<boolean>(false);

  const getAuthUser = async () => {
    const authToken = await getToken();

    setToken(authToken);
  };

  useEffect(() => {
    getAuthUser();
  }, []);

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
      className={`bg-black rounded-lg p-[11.85px]`}
      style={{
        width: width || 173,
      }}
      onPress={() => router.push(`/product/${id}`)}
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
          contentFit="cover"
          // className="w-[100%] h-[157px]"
          style={{
            width: "100%",
            height: 157,
          }}
        />
      )}
      {/* Product Details */}
      <View className="">
        <Text
          className="text-white text-[12px] capitalize font-LexendDecaSemiBold  text-normal pt-3 mb-[4px]"
          numberOfLines={1}
        >
          {title}
        </Text>
        {moreDetails?.discount?.isActive ? (
          <View className="flex-row items-center gap-[4px] flex-wrap mb-[4px]">
            <Text className="text-white text-[12px] font-LexendDecaMedium">
              ₦
              {moreDetails?.discount?.isActive
                ? moreDetails?.discount?.discountedPrice?.toLocaleString()
                : price?.toLocaleString()}
            </Text>
            <Text className="text-[#16783A] text-[8px] font-LexendDecaMedium line-through">
              ₦{moreDetails?.discount?.isActive && price.toLocaleString()}
            </Text>
            {/* <Text className="text-[8px] text-[#16783A] font-LexendDecaBold">
              {moreDetails?.discount?.value?.toFixed(0)}
              {moreDetails?.discount?.type == "percentage" && "%"} off
            </Text> */}
          </View>
        ) : (
          <Text className="text-white font-LexendDecaBold  text-[12px] mb-[4px]">
            ₦{price?.toLocaleString()}
          </Text>
        )}
        <Text className="text-[#027CEC] text-[8px] pb-[4px] font-LexendDecaSemiBold">
          #{category}
        </Text>
      </View>
      {/* Seller Information */}
      <View className=" flex-row  justify-between items-center shrink">
        <View className="flex-row gap-x-2  items-center">
          <Image
            source={
              moreDetails?.seller?.storeAvatar.url
                ? { uri: moreDetails?.seller?.storeAvatar.url }
                : require("../../../assets/icons/user-image-empty.png")
            }
            contentFit="contain"
            style={{
              width: 20,
              height: 20,
              borderRadius: 20,
            }}
          />
          <View>
            <Text className="text-gray-200 text-[8.5px] font-LexendDeca font-semibold">
              {sellerName || moreDetails?.seller?.businessName}
            </Text>
            <View className="flex-row items-center gap-[4px]">
              {moreDetails?.seller?.isVerified && (
                <View
                  style={{
                    paddingHorizontal: 6,
                    paddingVertical: 1,
                    borderRadius: 1.5,
                    backgroundColor: "#A0EEBD",
                  }}
                >
                  <Text
                    className="font-LexendDecaMedium text-[4px] "
                    style={{
                      fontSize: 5,
                    }}
                  >
                    Verified
                  </Text>
                </View>
              )}
              {moreDetails?.seller?.stats?.averageRating > 0 && (
                <View className="flex-row items-center">
                  {/* <Text className="text-white text-[8px] font-LexendDecaMedium">
                Rating:{"  "}
              </Text> */}
                  <Image source={icons.starIcon} />
                  <Text className="text-white flex justify-center items-center px-[2.329px] py-[0.582px] text-[8px] font-LexendDecaMedium">
                    {moreDetails?.seller?.stats?.averageRating?.toFixed(1)}
                  </Text>
                </View>
              )}
            </View>

            {/* <View className="flex-row items-center gap-x-1"> 
            <View className="flex-row items-center gap-x-2">
              <Text className="text-black bg-[#E8C300] rounded-[1.747px] flex justify-center items-center px-[2.329px] py-[0.582px] text-[2.912px] font-LexendDeca font-bold">
                Top seller
              </Text>
            </View>
            <View className="flex-row items-center">
              <Image source={icons.starIcon} />
              <Text className="text-white flex justify-center items-center px-[2.329px] py-[0.582px] text-[6px] font-LexendDeca font-bold">
                4.7
              </Text>
            </View>
          </View> */}
          </View>
        </View>
        <Text
          className="font-LexendDecaMedium"
          style={{
            fontSize: 8,
            color: "#E8C300",
          }}
        >
          {formatNumber(moreDetails?.stock)}pcs
        </Text>
      </View>

      {/* <Text className="text-[#425466] text-[8px] font-LexendDeca  font-semibold mt-[2px]">
        Lagos, Nigeria
      </Text> */}

      <CustomButton
        textStyle="!text-[8px] !font-semibold  !py-0"
        title="Add to cart"
        className="w-full mt-[8px] bg-primary-200 !p-0 !px-[9.872px] !rounded-[2.962px] py-[5px] self-center"
        onPress={() => {
          if (token) {
            return setShowCartSheet(true);
          }
          setShowAuthSheet(true);
        }}
      />

      <BottomSheet
        bgColor="#3A3A3A"
        childrenStyle="!px-[11px]"
        showCloseIcon={false}
        title=""
        show={showCartSheet}
        titleColor="!text-white"
        onRequestClose={() => setShowCartSheet(false)}
        keyboardBehavior={"interactive"}
      >
        <CartSheet
          productDetails={moreDetails}
          closeSheet={() => setShowCartSheet(false)}
          addToCart={handleAddToCart}
        />
      </BottomSheet>

      <BottomSheet
        bgColor="#3A3A3A"
        childrenStyle="!px-[11px]"
        showCloseIcon={false}
        title=""
        show={showAddedToCartSheet}
        titleColor="!text-white"
        onRequestClose={() => setShowAddedToCartSheet(false)}
        keyboardBehavior={"interactive"}
      >
        <AddedToCart
          cartData={moreDetails}
          closeSheet={() => setShowAddedToCartSheet(false)}
        />
      </BottomSheet>

      <BottomSheet
        bgColor="#121212"
        childrenStyle="!px-[11px]"
        showCloseIcon={false}
        title=""
        show={showAuthSheet}
        titleColor="!text-white"
        snapPoints={["20%"]}
        enableDynamicSizing={false}
        onRequestClose={() => setShowAuthSheet(false)}
        keyboardBehavior="interactive"
      >
        <AuthSheet closeSheet={() => setShowAuthSheet(false)} />
      </BottomSheet>
    </TouchableOpacity>
  );
};

export default ProductCard;
