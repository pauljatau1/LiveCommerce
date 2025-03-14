import { View, Text, FlatList, ActivityIndicator } from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import SectionHeader from "@/components/global/section-header";
import FollowCard from "../../global/followers-card/followers-card";
import axios from "axios";
import { getToken } from "@/store/features/auth/utils";

const Sellers = () => {
  const [sellers, setSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getSellers = async () => {
    try {
      const token = await getToken();
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_API_URL}api/buyer/sellers?page=1&limit=10&sort=rating`,
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        },
      );

      if (response.status === 200) {
        setSellers(
          response.data?.sellers
            .filter((seller: any) => seller?.isFeatured)
            .slice(0, 10),
        );
      }
    } catch (err) {
      setError("Failed to load sellers");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getSellers();
  }, []);

  const renderEmptySellers = useCallback(() => {
    return (
      <View
        style={{
          marginVertical: 40,
          width: "100%",
        }}
      >
        <Text className="font-LexendDecaMedium text-[14px] text-[#ccc] text-center">
          No Sellers to Follow
        </Text>
      </View>
    );
  }, [sellers]);

  if (error) {
    return (
      <View className="pt-[35px] w-[100%] items-center">
        <Text className="text-red-500">{error}</Text>
      </View>
    );
  }

  return (
    <View className="pt-[35px] w-[100%]">
      <SectionHeader title="Sellers to follow" btnText="" />
      {loading ? (
        <ActivityIndicator color="#CCCCCC" className="py-4" />
      ) : sellers?.length > 0 ? (
        <FlatList
          data={sellers}
          renderItem={({ item }) => (
            <View className="space-x-4 w-[150px]">
              <FollowCard item={item._id} data={item} />
            </View>
          )}
          keyExtractor={(item) => item._id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
          }}
          className=" gap-4"
        />
      ) : (
        renderEmptySellers()
      )}
    </View>
  );
};

export default Sellers;
