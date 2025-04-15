import { View, Text, TouchableOpacity, Image, Pressable } from "react-native";
import React, { memo, useCallback, useEffect, useState } from "react";
import { AntDesign } from "@expo/vector-icons";
import { toast } from "@/core/toast";

const CartSheet = ({
  productDetails,
  closeSheet,
  addToCart,
}: {
  productDetails: any;
  closeSheet: () => void;
  addToCart: (cartItem: any) => Promise<void>;
}) => {
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedVariant, setSelectedVariant] = useState<any>({});
  const [selectedSpec, setSelectedSpec] = useState<any>({});

  const handleVariantSelect = (data: any) => {
    if (data.totalStock < 1) {
      return;
    }
    // if (selectedVariant && selectedVariant?._id == data._id) {
    //   setSelectedSpec({});
    //   return setSelectedVariant({});
    // }
    setSelectedVariant(data);
    setSelectedSpec({
      specifications: {
        color: data.name == "color" ? data.value : "",
        size: data.size == "size" ? data.value : "",
        material: data.material == "material" ? data.value : "",
      },
    });
  };

  const handleCreateCartItem = () => {
    if (productDetails?.stock < 1) {
      return;
    }
    if (selectedVariant?._id) {
      addToCart({
        ...productDetails,
        quantity,
        includeInOrder: true,
        ...selectedSpec,
        price: selectedVariant.price,
        images: [
          {
            url:
              selectedVariant.images?.length > 0
                ? selectedVariant.images?.[0]?.data
                : productDetails.images?.[0]?.url,
          },
        ],
      });
    } else {
      addToCart({ ...productDetails, quantity, includeInOrder: true });
    }
  };

  const selectFirstVariant = useCallback(() => {
    const data = productDetails?.variants?.find(
      (variant: any, index: number) => variant.totalStock > 0,
    );

    if (data) {
      setSelectedVariant(data);
      setSelectedSpec({
        specifications: {
          color: data.name == "color" ? data.value : "",
          size: data.size == "size" ? data.value : "",
          material: data.material == "material" ? data.value : "",
        },
      });
    }
  }, []);

  useEffect(() => {
    selectFirstVariant();
  }, []);

  useEffect(() => {
    if (quantity < 1) {
      setQuantity(1);
    }
  }, [quantity]);
  return (
    <View className="p-[8px] pb-[16px]">
      <View className="flex-row justify-between mb-[23px] ">
        <View className="flex-row gap-[16px]">
          <Image
            source={{
              uri:
                (selectedVariant?.images?.length > 0 &&
                  selectedVariant?.images[0]?.data) ||
                productDetails?.images[0]?.url,
            }}
            resizeMode="cover"
            className="w-[79px] h-[74px] rounded-[8px]"
          />
          <View className="gap-[2px]">
            <Text className="text-white text-[22px] font-LexendDecaMedium">
              ₦
              {selectedVariant?.discount?.isActive
                ? selectedVariant?.discount?.discountedPrice?.toLocaleString()
                : selectedVariant?.price?.toLocaleString() ||
                  (productDetails?.discount?.isActive
                    ? productDetails?.discount?.discountedPrice?.toLocaleString()
                    : productDetails?.price?.toLocaleString())}
            </Text>
            {productDetails?.discount?.isActive && (
              <View className="flex-row items-center gap-[8px]">
                <Text className="text-white text-[11px] font-LexendDecaMedium line-through">
                  ₦
                  {productDetails?.discount?.isActive &&
                    productDetails?.price.toLocaleString()}
                </Text>
                <Text className="text-[11px] text-[#16783A] font-LexendDecaBold">
                  {productDetails?.discount?.value}
                  {productDetails?.discount?.type == "percentage" && "%"} off
                </Text>
              </View>
            )}

            <Text className="text-white text-[11px] font-LexendDecaMedium">
              {productDetails?.category}
            </Text>
          </View>
        </View>
        <Pressable onPress={closeSheet}>
          <View className="bg-[#EE571C] w-[30px] h-[30px] rounded-[50%]">
            <AntDesign name="closecircle" size={30} color="#F9C7B3" />
          </View>
        </Pressable>
      </View>
      {/* <View className="flex-row items-center gap-[15px] mb-[26px] rounded-[4px] bg-black px-[14px] py-[7px]">
        <Ionicons name="shield-checkmark-outline" size={20} color="white" />
        <Text className="text-white text-[11px]">7 Days Free Returns</Text>
      </View> */}

      {productDetails.variants?.length > 0 && (
        <View className="mb-[13px]">
          <Text className="text-white text-[11px] font-LexendDecaMedium mb-[8px]">
            {productDetails.variants[0]?.name}
          </Text>
          <View className="flex-row items-center gap-[22px] flex-wrap">
            {productDetails.variants.map((variant: any, index: number) => (
              <TouchableOpacity
                className={`rounded-[4px] bg-white relative border-[2px] border-[#3A3A3A] ${selectedVariant._id == variant._id ? "!border-[2px] !border-[#16783A]" : null} ${variant.totalStock < 1 ? "opacity-30" : null}`}
                key={index}
                onPress={() => handleVariantSelect(variant)}
              >
                <Image
                  source={{
                    uri:
                      variant?.images[0]?.data || productDetails.images[0].url,
                  }}
                  resizeMode="cover"
                  className="w-[79px] h-[74px] bg-white p-[1px] self-center"
                />
                <View className="bg-white p-[2px] items-center justify-center border-t-[1px] border-[#9f9f9f]">
                  <Text className="text-black text-[11px] font-LexendDecaMedium">
                    {variant.value}
                  </Text>
                </View>
                {selectedVariant._id == variant._id && (
                  <AntDesign
                    name="checkcircle"
                    size={14}
                    color="#16783A"
                    className="absolute top-[-10px] right-[-10px]"
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <View className="flex-row items-center justify-between mb-[14px]">
        <Text className="text-white text-[11px] font-LexendDecaMedium">
          Quantity
        </Text>
        <View className="flex-row items-center gap-[6px]">
          <TouchableOpacity
            className="w-[24px] h-[24px] bg-[#16783A] rounded-[4px] items-center justify-center"
            onPress={() => setQuantity(quantity - 1)}
          >
            <AntDesign name="minus" size={14} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-[11px] font-LexendDecaMedium">
            {quantity}
          </Text>
          <TouchableOpacity
            className="w-[24px] h-[24px] bg-[#16783A] rounded-[4px] items-center justify-center"
            onPress={() => {
              if (quantity >= productDetails?.stock) {
                return toast.error("max stock reached");
              }
              setQuantity(quantity + 1);
            }}
          >
            <AntDesign name="plus" size={14} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        className="py-[10px] rounded-[6px] bg-[#16783A] items-center justify-center"
        onPress={() => handleCreateCartItem()}
        style={{
          opacity: productDetails?.stock < 1 ? 0.3 : 1,
        }}
      >
        <Text className="text-white text-[14px] font-LexendDecaMedium">
          {productDetails?.stock < 1 ? "Out of Stock" : "Add to Cart"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default memo(CartSheet);
