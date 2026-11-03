import {
  View,
  Text,
  TouchableOpacity,
  Image,
  FlatList,
  Pressable,
} from "react-native";
import React, { memo, useCallback, useEffect, useState } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import AntDesign from "@expo/vector-icons/AntDesign";

const WishList = ({
  wishlist,
  handleModifyWishList,
}: {
  wishlist: any[];
  handleModifyWishList: (action: string, data: any) => Promise<void>;
}) => {
  const renderWishlistItem = useCallback(
    ({ item }: { item: any }) => {
      return (
        <WishlistItem
          wishlistItem={item?.product}
          handleModifyWishList={handleModifyWishList}
          key={item?._id}
        />
      );
    },
    [wishlist],
  );
  return (
    <View className="px-[20px] flex-1">
      <FlatList
        data={wishlist}
        renderItem={renderWishlistItem}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => (
          <View className="h-[1px] bg-white opacity-20 w-full"></View>
        )}
      />
    </View>
  );
};

const WishlistItem = ({
  wishlistItem,
  handleModifyWishList,
}: {
  wishlistItem: any;
  handleModifyWishList: (action: string, data: any) => Promise<void>;
}) => {
  return (
    <Pressable
      className=" py-[30px] px-[8px]"
      onPress={() => router.push(`/product/${wishlistItem?._id}`)}
    >
      <View className="gap-[16px] shrink">
        <View className=" flex-row items-center justify-between">
          <Text className="text-[16px] text-white font-LexendDecaSemiBold">
            {wishlistItem?.seller.storeName}
          </Text>
        </View>
        <View className="flex-row gap-[16px]">
          <View>
            <Image
              source={{ uri: wishlistItem?.images[0].url }}
              resizeMode="contain"
              resizeMethod="resize"
              className="w-[100px] h-[100px] rounded-[12px]"
            />
          </View>
          <View className="gap-[6px] relative shrink w-full">
            <Text
              className="text-[14px] text-[#ffffff] opacity-80 font-LexendDeca leading-[20px]"
              numberOfLines={2}
            >
              {wishlistItem?.name}
            </Text>
            {wishlistItem?.discount?.isActive ? (
              <View className="flex-row items-end gap-[4px] flex-wrap">
                <Text className="text-white opacity-80 font-LexendDecaMedium tracking-wide  text-[16px]">
                  ₦
                  {wishlistItem?.discount?.isActive
                    ? wishlistItem?.discount?.discountedPrice?.toLocaleString()
                    : wishlistItem?.price?.toLocaleString()}
                </Text>
                <Text className="text-[#16783A] text-[10px] font-LexendDecaMedium line-through">
                  ₦
                  {wishlistItem?.discount?.isActive &&
                    wishlistItem?.price.toLocaleString()}
                </Text>
                <Text className="text-[10px] text-[#16783A] font-LexendDecaBold">
                  {wishlistItem?.discount?.value?.toFixed(0)}
                  {wishlistItem?.discount?.type == "percentage" && "%"} off
                </Text>
              </View>
            ) : (
              <Text className="text-white font-LexendDecaMedium tracking-wide  text-[16px]">
                ₦{wishlistItem?.price?.toLocaleString()}
              </Text>
            )}

            <View className="flex-row justify-between items-center gap-[4px] mt-[4px] ml-auto">
              <TouchableOpacity
                className=""
                onPress={() =>
                  handleModifyWishList("delete", wishlistItem?._id)
                }
              >
                <Ionicons name="trash-outline" size={20} color="white" />
              </TouchableOpacity>
              {/* <TouchableOpacity className="w-[110px] py-[8px] px-[16px] bg-[#16783A] rounded-[4px]" onPress={() => handleModifyWishList('add',wishlistItem)}>
                <Text className="text-white text-[10px]">Add to Cart</Text>
              </TouchableOpacity> */}
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

export default memo(WishList);
