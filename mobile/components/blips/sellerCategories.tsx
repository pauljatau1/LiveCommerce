import { View, Text, Pressable, FlatList } from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import { getToken } from "@/store/features/auth/utils";
import axios from "axios";
import { MaterialIcons } from "@expo/vector-icons";

const SellerCategories = ({ sellerId }: any) => {
  const [categories, setCategories] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("0");

  const getCategories = useCallback(async () => {
    const token = await getToken();
    try {
      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL +
          `api/products/seller/${sellerId}/categories`,
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        },
      );
      setCategories(response.data?.data);
    } catch (error) {
      console.error("Error fetching blips:", error);
    }
  }, []);

  useEffect(() => {
    getCategories();
  }, []);

  const handleSelectCategory = (index: string) => {
    if (index == activeCategory) {
      setActiveCategory("");
    } else {
      setActiveCategory(index);
    }
  };

  const renderCategories = useCallback(
    ({ item, index }: any) => {
      return (
        <View className=" border-b-[#ccc] border-b-[0.3px] px-[20px]">
          <Pressable
            className="py-[15px] justify-between items-center flex-row"
            onPress={() => handleSelectCategory(index.toString())}
          >
            <Text className="text-[#ccc] text-[16px] font-LexendDecaSemiBold">
              {item?.name}
            </Text>
            {item?.subCategories?.length > 0 && (
              <MaterialIcons
                name={
                  activeCategory && activeCategory == index?.toString()
                    ? "keyboard-arrow-down"
                    : "keyboard-arrow-right"
                }
                size={20}
                color="#ccc"
              />
            )}
          </Pressable>
          {activeCategory && activeCategory == index?.toString() ? (
            <View className="flex-row gap-[8.5px] items-center flex-wrap pb-[10px]">
              {item?.subCategories?.map((subcategory: any, index: number) => (
                <Pressable
                  key={index}
                  className="rounded-[4px] px-[12px] py-[8px]"
                  style={{
                    backgroundColor: "rgba(204, 204, 204, 0.25);",
                  }}
                >
                  <Text className="text-[#ccc] text-[10px] font-LexendDeca">
                    {subcategory?.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
      );
    },
    [activeCategory],
  );
  return (
    <View>
      <FlatList
        data={categories}
        renderItem={renderCategories}
        keyExtractor={(item: any, index) => item?._id || index.toString()}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export default SellerCategories;
