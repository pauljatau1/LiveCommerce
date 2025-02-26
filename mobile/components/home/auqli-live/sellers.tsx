import { View, Text, FlatList, ActivityIndicator } from "react-native";
import React, { useEffect, useState } from "react";
import SectionHeader from "@/components/global/section-header";
import FollowCard from "../../global/followers-card/followers-card";
import axios from "axios";

const Sellers = () => {
  const [sellers, setSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getSellers = async () => {
    try {
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_API_URL}api/public/sellers`,
      );

      if (response.status === 200) {
        setSellers(
          response.data
            .filter((seller: any) => seller.verification?.isFeatured)
            .slice(0, 5),
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
      ) : (
        <FlatList
          data={sellers}
          renderItem={({ item }) => (
            <View className="space-x-4">
              <FollowCard item={item._id} data={item} />
            </View>
          )}
          keyExtractor={(item) => item._id}
          horizontal
          showsHorizontalScrollIndicator={false}
          className="pl-[16px] gap-4 pr-[16px]"
        />
      )}
    </View>
  );
};

export default Sellers;
