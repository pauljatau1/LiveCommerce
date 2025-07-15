import React, { useEffect, useState, memo, useCallback } from "react";
import { View, Text, TouchableOpacity, Pressable } from "react-native";
import { icons, images } from "@/constants";
import { ProductCardProps } from "@/types/types";
import CustomButton from "../global/button/CustomButton";
import { router, useRouter } from "expo-router";
import AntDesign from "@expo/vector-icons/AntDesign";
import Ionicons from "@expo/vector-icons/Ionicons";
import BottomSheet from "../global/bottom-sheet";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { toast } from "@/core/toast";
import { getToken } from "@/store/features/auth/utils";
import AuthSheet from "../auth/authSheet";
import AddedToCart from "../product/productAddedToCart";
import CartSheet from "../product/productCartSheet";
import { formatNumber } from "@/helpers/helpers";
import { Image } from "expo-image";

const CatalogCard: React.FC<ProductCardProps | any> = ({
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
  ...props
}) => {
  const firstImage =
    imageUrl && imageUrl?.length > 0 ? imageUrl[0] : images.diamondsImage;

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

  const handleAddToCart = useCallback(async (cartItem: any) => {
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
  }, []);

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      className=" bg-black rounded-lg  w-[100%] overflow-hidden"
      onPress={() => router.push(`/product/${id}`)}
    >
      {/* Product Image */}
      {firstImage && (
        <Image
          source={{ uri: imageUrl?.[0]?.url, width: 300, height: 300 }}
          contentFit="cover"
          recyclingKey={`image-${imageUrl?.[0]?.url}`}
          // className="w-[100%] h-[157px]"
          style={{
            width: "100%",
            height: 157,
            backgroundColor: "#2e2e2e",
          }}
          enableLiveTextInteraction={false}
          // cachePolicy="none"
        />
      )}
      {/* Product Details */}
      <View
        style={{
          paddingHorizontal: 8,
          paddingBottom: 8,
        }}
      >
        <View className="gap-[2px]">
          <Text
            className="text-white text-[12px] capitalize font-LexendDecaSemiBold  text-normal pt-3 mb-[4px]"
            numberOfLines={1}
          >
            {title}
          </Text>
          {moreDetails?.discount?.isActive ? (
            <View className="flex-row items-center gap-[4px] flex-wrap">
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
            <Text className="text-white font-LexendDecaBold  text-[12px]">
              ₦{price?.toLocaleString()}
            </Text>
          )}
          <Text className="text-[#027CEC] text-[8px] pb-[4px] font-LexendDecaSemiBold">
            #{category}
          </Text>
        </View>
        {/* Seller Information */}
        <View className=" flex-row  justify-between items-center shrink gap-[4px]">
          <View className="flex-row gap-x-2  items-center shrink">
            <Image
              source={
                moreDetails?.seller?.storeAvatar?.url
                  ? { uri: moreDetails?.seller?.storeAvatar?.url }
                  : {
                      uri: "https://cdn2.iconfinder.com/data/icons/facebook-ui-colored/48/JD-15-512.png",
                    }
              }
              resizeMode="contain"
              style={{
                width: 20,
                height: 20,
                borderRadius: 20,
                backgroundColor: "#2e2e2e",
              }}
            />
            <View className="shrink">
              <Text
                className="text-gray-200 text-[8.5px] font-LexendDeca font-semibold"
                numberOfLines={1}
              >
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
                    <Text className="text-white flex justify-center items-center px-[2.329px] text-[6px] font-LexendDecaMedium">
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

        <View className="mt-[4px] flex-row items-center justify-between">
          {moreDetails?.reviewCount > 0 ||
          moreDetails?.stats?.totalReviews > 0 ? (
            <View className="flex-row items-center gap-[6px]">
              <View className="flex-row gap-[2px] items-center">
                {Array(5)
                  .fill(0)
                  .map((_, index) =>
                    parseInt(
                      moreDetails?.averageRating ||
                        moreDetails?.stats?.averageRating,
                    ) <
                    index + 1 ? (
                      <AntDesign
                        key={index}
                        name="star"
                        size={11}
                        color="#rgba(255, 255, 255, 0.62)"
                      />
                    ) : (
                      <AntDesign
                        name="star"
                        size={11}
                        color="#FFD700"
                        key={index}
                      />
                    ),
                  )}
              </View>
              <Text className="text-white text-[8.5px] font-LexendDecaMedium font-semibold">
                {formatNumber(
                  moreDetails?.reviewCount || moreDetails?.stats?.totalReviews,
                )}
              </Text>
            </View>
          ) : (
            <Text className="text-gray-200 text-[8.5px] font-LexendDeca font-semibold">
              No Reviews
            </Text>
          )}
          <View className=" bg-[#0EA245] py-[2px] px-[5px] rounded-[14px] shrink">
            <Text className="text-[6px] text-white font-LexendDecaBold">
              Free Shipping
            </Text>
          </View>
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
      </View>

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

// const CartSheet = ({
//   productDetails,
//   closeSheet,
//   addToCart,
// }: {
//   productDetails: any;
//   closeSheet: () => void;
//   addToCart: (cartItem: any) => Promise<void>;
// }) => {
//   const [quantity, setQuantity] = useState<number>(1);
//   const [selectedVariant, setSelectedVariant] = useState<any>({});
//   const [selectedSpec, setSelectedSpec] = useState<any>({});

//   const handleVariantSelect = (data: any) => {
//     if (selectedVariant && selectedVariant?._id == data._id) {
//       setSelectedSpec({});
//       return setSelectedVariant({});
//     }
//     setSelectedVariant(data);
//     setSelectedSpec({
//       specifications: {
//         color: data.name == "color" ? data.value : "",
//         size: data.size == "size" ? data.value : "",
//         material: data.material == "material" ? data.value : "",
//       },
//     });
//   };

//   const handleCreateCartItem = () => {
//     if (selectedVariant?._id) {
//       addToCart({
//         ...productDetails,
//         quantity,
//         includeInOrder: true,
//         ...selectedSpec,
//         price: selectedVariant.price,
//         images: [
//           {
//             url: selectedVariant.images[0].data,
//           },
//         ],
//       });
//     } else {
//       addToCart({ ...productDetails, quantity, includeInOrder: true });
//     }
//   };

//   useEffect(() => {
//     if (quantity < 1) {
//       setQuantity(1);
//     }
//   }, [quantity]);
//   return (
//     <View className="p-[8px] pb-[16px]">
//       <View className="flex-row justify-between mb-[23px] ">
//         <View className="flex-row gap-[16px]">
//           <Image
//             source={{
//               uri:
//                 (selectedVariant?.images && selectedVariant?.images[0]?.data) ||
//                 productDetails?.images[0]?.url,
//             }}
//             contentFit="cover"
//             className="w-[79px] h-[74px] rounded-[8px]"
//           />
//           <View className="gap-[2px]">
//             <Text className="text-white text-[22px] font-LexendDecaMedium">
//               ₦
//               {selectedVariant?.discount?.isActive
//                 ? selectedVariant?.discount?.discountedPrice?.toLocaleString()
//                 : selectedVariant?.price?.toLocaleString() ||
//                   (productDetails?.discount?.isActive
//                     ? productDetails?.discount?.discountedPrice?.toLocaleString()
//                     : productDetails?.price?.toLocaleString())}
//             </Text>
//             {productDetails?.discount?.isActive && (
//               <View className="flex-row items-center gap-[8px]">
//                 <Text className="text-white text-[11px] font-LexendDecaMedium line-through">
//                   ₦
//                   {productDetails?.discount?.isActive &&
//                     productDetails?.price.toLocaleString()}
//                 </Text>
//                 <Text className="text-[11px] text-[#16783A] font-LexendDecaBold">
//                   {productDetails?.discount?.value}
//                   {productDetails?.discount?.type == "percentage" && "%"} off
//                 </Text>
//               </View>
//             )}

//             <Text className="text-white text-[11px] font-LexendDecaMedium">
//               {productDetails?.category}
//             </Text>
//           </View>
//         </View>
//         <Pressable onPress={closeSheet}>
//           <View className="bg-[#EE571C] w-[30px] h-[30px] rounded-[50%]">
//             <AntDesign name="closecircle" size={30} color="#F9C7B3" />
//           </View>
//         </Pressable>
//       </View>
//       {/* <View className="flex-row items-center gap-[15px] mb-[26px] rounded-[4px] bg-black px-[14px] py-[7px]">
//         <Ionicons name="shield-checkmark-outline" size={20} color="white" />
//         <Text className="text-white text-[11px]">7 Days Free Returns</Text>
//       </View> */}

//       {productDetails.variants?.length > 0 && (
//         <View className="mb-[13px]">
//           <Text className="text-white text-[11px] font-LexendDecaMedium mb-[8px]">
//             {productDetails.variants[0]?.name}
//           </Text>
//           <View className="flex-row items-center gap-[22px] flex-wrap">
//             {productDetails.variants.map((variant: any, index: number) => (
//               <TouchableOpacity
//                 className={`rounded-[4px] bg-white relative border-[2px] border-[#3A3A3A] ${selectedVariant._id == variant._id ? "!border-[2px] !border-[#16783A]" : null}`}
//                 key={index}
//                 onPress={() => handleVariantSelect(variant)}
//               >
//                 <Image
//                   source={{
//                     uri:
//                       variant?.images[0]?.data || productDetails.images[0].url,
//                   }}
//                   contentFit="cover"
//                   className="w-[79px] h-[74px] bg-white p-[1px] self-center"
//                 />
//                 <View className="bg-white p-[2px] items-center justify-center border-t-[1px] border-[#9f9f9f]">
//                   <Text className="text-black text-[11px] font-LexendDecaMedium">
//                     {variant.value}
//                   </Text>
//                 </View>
//                 {selectedVariant._id == variant._id && (
//                   <AntDesign
//                     name="checkcircle"
//                     size={14}
//                     color="#16783A"
//                     className="absolute top-[-10px] right-[-10px]"
//                   />
//                 )}
//               </TouchableOpacity>
//             ))}
//           </View>
//         </View>
//       )}

//       <View className="flex-row items-center justify-between mb-[14px]">
//         <Text className="text-white text-[11px] font-LexendDecaMedium">
//           Quantity
//         </Text>
//         <View className="flex-row items-center gap-[6px]">
//           <TouchableOpacity
//             className="w-[24px] h-[24px] bg-[#16783A] rounded-[4px] items-center justify-center"
//             onPress={() => setQuantity(quantity - 1)}
//           >
//             <AntDesign name="minus" size={14} color="white" />
//           </TouchableOpacity>
//           <Text className="text-white text-[11px] font-LexendDecaMedium">
//             {quantity}
//           </Text>
//           <TouchableOpacity
//             className="w-[24px] h-[24px] bg-[#16783A] rounded-[4px] items-center justify-center"
//             onPress={() => setQuantity(quantity + 1)}
//           >
//             <AntDesign name="plus" size={14} color="white" />
//           </TouchableOpacity>
//         </View>
//       </View>

//       <TouchableOpacity
//         className="py-[10px] rounded-[6px] bg-[#16783A] items-center justify-center"
//         onPress={() => handleCreateCartItem()}
//       >
//         <Text className="text-white text-[14px] font-LexendDecaMedium">
//           Add to Cart
//         </Text>
//       </TouchableOpacity>
//     </View>
//   );
// };

// const AddedToCart = ({
//   cartData,
//   closeSheet,
// }: {
//   cartData: any;
//   closeSheet: () => void;
// }) => {
//   return (
//     <View className="p-[16px] pb-[20px]">
//       <Text className="text-white text-[16px] mb-[20px] text-center font-LexendDecaMedium ">
//         Item Added To Cart
//       </Text>
//       <View className="flex-row gap-[16px] bg-white p-[8px] rounded-[8px] mb-[20px] items-center ">
//         <Image
//           source={{ uri: cartData?.images[0]?.url }}
//           contentFit="cover"
//           style={{ width: 73, height: 73, borderRadius: 4 }}
//         />
//         <View className="justify-between py-2 gap-[20px] shrink">
//           <Text
//             className="text-[12px] font-LexendDecaMedium leading-[18px]"
//             numberOfLines={2}
//           >
//             {cartData?.name}
//           </Text>
//           <View className="flex-row items-center gap-[8px]">
//             <Text className="text-[16px] font-LexendDecaMedium leading-[18px]">
//               ₦
//               {cartData?.discount?.isActive
//                 ? cartData?.discount?.discountedPrice?.toLocaleString() || 0
//                 : cartData?.price?.toLocaleString()}
//             </Text>
//             {cartData?.discount?.isActive && (
//               <Text className="text-[11px] text-[#16783A] font-LexendDecaBold">
//                 -{cartData?.discount?.value}
//                 {cartData?.discount?.type == "percentage" && "%"} off
//               </Text>
//             )}
//           </View>
//         </View>

//         <View className="absolute right-[-10px]">
//           <Image source={require("../../assets/icons/elements.png")} />
//         </View>
//       </View>

//       <View className="flex-row items-center justify-between">
//         <TouchableOpacity
//           className="w-full py-[12px] bg-white rounded-[4px] items-center justify-center border-[#16783A] border-[2px] basis-[47%]"
//           onPress={closeSheet}
//         >
//           <Text className="text-[#16783A] font-LexendDecaBold text-[12px]">
//             Continue Shopping
//           </Text>
//         </TouchableOpacity>
//         <TouchableOpacity
//           className="w-full py-[12px] bg-[#16783A] rounded-[4px] items-center justify-center border-[#16783A] border-[2px] basis-[47%]"
//           onPress={() => {
//             closeSheet();
//             router.push("/checkout/checkout");
//           }}
//         >
//           <Text className="text-white font-LexendDecaBold text-[12px]">
//             Checkout Now
//           </Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// };

export default memo(CatalogCard);
