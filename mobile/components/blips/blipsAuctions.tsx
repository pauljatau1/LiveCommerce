import { View, Text, FlatList } from "react-native";
import React, { useCallback, useState } from "react";
import { useIsFocused } from "@react-navigation/native";
import { useGetAllAuctionProductsQuery } from "@/services/products";
import AuctionCard from "../global/auction-card";

const BlipsAuctions = ({ id, closeSheet }: { id: string; closeSheet: any }) => {
  const isFocused = useIsFocused();
  const [page, setPage] = useState<number>(1);

  const {
    data: products,
    error,
    isLoading,
    isFetching,
    refetch,
  } = useGetAllAuctionProductsQuery({
    id,
    status: "ongoing",
    page: 1,
    limit: 10,
  });

  const getMoreAuctions = () => {
    if (!isFetching && !isLoading) {
      setPage((prevPage) => prevPage + 1);
    }
  };

  const renderShopProducts = useCallback(
    ({ item }: any) => {
      return (
        <View
          className="w-[100%] basis-[45%]"
          style={{
            flexBasis: "47%",
          }}
        >
          <AuctionCard item={item} showNike={false} />
        </View>
      );
    },
    [id],
  );
  return (
    <View>
      <FlatList
        data={products?.products}
        renderItem={renderShopProducts}
        keyExtractor={(item, index) => item?._id.toString()}
        numColumns={2}
        // onEndReached={getMoreAuctions}
        columnWrapperStyle={{
          justifyContent: "space-between",
          marginBottom: 16,
          paddingHorizontal: 16,
        }}
        contentContainerStyle={{
          paddingBottom: 10,
        }}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      />
    </View>
  );
};

export default BlipsAuctions;
