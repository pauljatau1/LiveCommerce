import { View, Text, TouchableOpacity, Image, FlatList } from "react-native";
import React, { memo, useCallback, useEffect, useState } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";

const WishList = ({
  wishlist,
  handleModifyWishList,
}: {
  wishlist: any[];
  handleModifyWishList: (action: string, data: any) => Promise<void>;
}) => {
  const renderWishlistItem = useCallback(({ item }: { item: any }) => {
    return (
      <WishlistItem
        wishlistItem={item.product}
        handleModifyWishList={handleModifyWishList}
        key={item._id}
      />
    );
  }, []);
  return (
    <View className="px-[20px] h-[90%]">
      <FlatList
        data={wishlist}
        renderItem={renderWishlistItem}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
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
    <TouchableOpacity
      className="border-[2px] border-[#CCCCCC] rounded-[16px] p-[14px] flex-row mb-[20px]"
      onPress={() => router.push(`/product/${wishlistItem._id}`)}
    >
      <View className="gap-[16px] shrink">
        {/* <View className=" flex-row items-center justify-between">
          <Text className="text-[16px] text-white font-LexendDecaSemiBold">
            {wishlistItem.seller.storeName}
          </Text>
          <TouchableOpacity className="rounded-[8px] px-[8px] py-[6px] bg-white flex-row items-center gap-2">
            <Text className="text-[#16783A] text-[10px]">Message Seller</Text>
            <AntDesign name="arrowright" size={12} color="#16783A" />
          </TouchableOpacity>
        </View> */}
        <View className="flex-row gap-[16px]">
          <View>
            <Image
              source={{ uri: wishlistItem?.images[0].url }}
              resizeMode="cover"
              className="w-[115px] h-[136px]"
            />
          </View>
          <View className="gap-[6px] relative shrink">
            <Text className="text-[14px] text-white font-LexendDecaLight">
              {wishlistItem.seller.storeName}
            </Text>
            <Text className="text-[14px] text-[#16783A] font-LexendDecaSemiBold">
              {wishlistItem.name.length > 50
                ? wishlistItem.name.slice(0, 50) + "..."
                : wishlistItem.name}
            </Text>
            <Text className="text-[16px] text-[#F2F2F2] font-LexendDecaSemiBold">
              ₦
              {wishlistItem?.discount?.isActive
                ? wishlistItem?.discount?.discountedPrice?.toLocaleString() || 0
                : wishlistItem?.price?.toLocaleString()}
            </Text>
            <Text className="text-[12px] text-[#F2F2F2] font-LexendDecaLight">
              Item ID: {wishlistItem._id?.toLocaleString().slice(0, 12)}...
            </Text>

            <View className="flex-row justify-between items-center gap-[4px] mt-[4px]">
              <TouchableOpacity
                className=""
                onPress={() => handleModifyWishList("delete", wishlistItem._id)}
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
    </TouchableOpacity>
  );
};

export default memo(WishList);
