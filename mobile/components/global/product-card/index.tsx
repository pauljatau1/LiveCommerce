import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { icons, images } from "@/constants";
import { ProductCardProps } from "@/types/types";
import CustomButton from "../button/CustomButton";
import { router, useRouter } from "expo-router";

const ProductCard: React.FC<ProductCardProps> = ({
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
  ...props
}) => {
  const firstImage =
    imageUrl && imageUrl.length > 0 ? imageUrl[0] : images.diamondsImage;

  const router = useRouter();

  return (
    <TouchableOpacity
      className=" bg-black rounded-lg p-[11.85px]  w-[173px] h-[299px]"
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
          resizeMode="cover"
          className="w-[149px] h-[157px]"
        />
      )}
      {/* Product Details */}
      <View>
        <Text className="text-white text-[10px] capitalize font-LexendDecaBold  text-normal pt-3">
          {title?.slice(0, 25)}
        </Text>
        <Text className="text-white font-LexendDecaBold  text-[10px]">
          ₦{price?.toLocaleString()}
        </Text>
        <Text className="text-[#027CEC] text-[8px] pb-[4px] font-LexendDecaSemiBold mt-[2px]">
          #{category}
        </Text>
      </View>
      {/* Seller Information */}
      <View className="relative flex-row gap-x-2">
        <View>
          <Text className="text-gray-200 text-[8.5px] font-LexendDeca font-semibold">
            {sellerName}
          </Text>
          {sellerRating > 0 && (
            <View className="flex-row items-center">
              <Text className="text-white text-[8px] font-LexendDecaMedium">
                Rating:{"  "}
              </Text>
              <Image source={icons.starIcon} />
              <Text className="text-white flex justify-center items-center px-[2.329px] py-[0.582px] text-[8px] font-LexendDecaMedium">
                {sellerRating}
              </Text>
            </View>
          )}

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
        {/* {isVerified && (
          <Image
            source={icons.verifyBadge}
            className="w-[17.06px] h-[17.06px]"
          />
        )} */}
      </View>
      <Text className="text-[#425466] text-[8px] font-LexendDeca  font-semibold mt-[2px]">
        Lagos, Nigeria
      </Text>

      <CustomButton
        textStyle="!text-[8px] !font-semibold  !py-0"
        title="Add to cart"
        className="w-full mt-[8px] bg-primary-200 !p-0 !px-[9.872px] !rounded-[2.962px] py-[5px] absolute bottom-2 self-center"
      />
    </TouchableOpacity>
  );
};

export default ProductCard;
