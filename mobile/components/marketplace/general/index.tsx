import { View, Text, TouchableOpacity, FlatList } from "react-native";
import React, { useEffect, useState } from "react";
import { useGetAllProductsQuery } from "@/services/products";
import { ActivityIndicator } from "react-native-paper";
import ProductCard from "@/components/global/product-card";

interface GeneralCategoryProps {
  name: string;
  category: any;
}

const GeneralCategory = ({ name, category }: GeneralCategoryProps) => {
  const [limit, setLimit] = useState<number>(10);
  const [subCategory, setSubCategory] = useState<string>("");
  const {
    data: categoryData,
    error,
    isLoading,
  } = useGetAllProductsQuery({ category: name, limit, subCategory });
  const strippedCategory = category?.subCategories?.map(
    (subcat: any) => subcat.name,
  );

  const renderSubCategory = (name: string) => {
    return (
      <TouchableOpacity
        className="bg-[#2e2e2e] rounded-[4px] items-center justify-center p-[8px] px-[10px]"
        style={{
          marginRight: 10,
        }}
        onPress={() => setSubCategory(name)}
      >
        <Text className="text-[#ccc] font-LexendDecaMedium text-[12px]">
          {name}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderCategoryData = (item: any) => {
    return (
      <View className="space-x-4 gap-[15px] space-y-4 mr-[4px] mb-[5.54px]">
        <ProductCard
          key={item.id}
          id={item._id}
          title={item.name}
          price={item.price}
          category={item.category}
          sellerName={item.seller?.storeName}
          imageUrl={item.images}
          sellerRating={item.stats?.averageRating}
        />
      </View>
    );
  };

  return (
    <View className="px-[23px]">
      <View className="mb-[20px]">
        <FlatList
          data={strippedCategory}
          renderItem={({ item }) => renderSubCategory(item)}
          keyExtractor={(item) => item.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
        />
      </View>

      <View>
        {isLoading ? (
          <ActivityIndicator size={"small"} color="#16783A" />
        ) : (
          <FlatList
            data={categoryData.data.products}
            renderItem={({ item, index }) => renderCategoryData(item)}
            keyExtractor={(item, index) => index.toString()}
            numColumns={2}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
};

export default GeneralCategory;
