import { View, Text, FlatList, ActivityIndicator } from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import SectionHeader from "@/components/global/section-header";
import FollowCard from "../../global/followers-card/followers-card";
import axios from "axios";
import { getToken } from "@/store/features/auth/utils";
import { Entypo } from "@expo/vector-icons";

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

      if (response.status == 200) {
        var featuredShops = response.data?.sellers
          .filter((seller: any) => seller?.isFeatured)
          .slice(0, 10);

        if (featuredShops?.length < 1) {
          featuredShops = response.data?.sellers?.slice(0, 10);
        }
        setSellers(featuredShops);
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
          alignItems: "center",
          gap: 10,
        }}
      >
        <Entypo name="shop" size={35} color="#ccc" style={{ opacity: 0.5 }} />
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
      <SectionHeader title="Sellers to Follow" btnText="" />
      {loading ? (
        <ActivityIndicator color="#CCCCCC" className="py-4" />
      ) : sellers?.length > 0 ? (
        <View
          style={{
            paddingHorizontal: 16,
          }}
        >
          <FlatList
            data={sellers}
            renderItem={({ item }) => (
              <View
                className=" mb-[5.54px] w-[50%] shrink"
                style={{
                  flexShrink: 1,
                }}
              >
                <FollowCard item={item._id} data={item} />
              </View>
            )}
            keyExtractor={(item) => item._id}
            showsHorizontalScrollIndicator={false}
            numColumns={2}
            contentContainerStyle={{
              justifyContent: "space-between",
            }}
          />
        </View>
      ) : (
        renderEmptySellers()
      )}
    </View>
  );
};

export default Sellers;
