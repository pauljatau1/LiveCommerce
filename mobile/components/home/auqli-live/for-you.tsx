import { View, Text, FlatList, Pressable, Image } from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import LiveCardTemp from "@/components/global/live-product-card/LiveCardTemp";
import axios from "axios";
import LiveProductCard from "@/components/global/live-product-card";
import HomepageSkeleton from "@/components/skeleton/homepageSkeleton";
import SectionHeader from "@/components/global/section-header";
import { router } from "expo-router";
import { icons } from "@/constants";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { getToken, setUser } from "@/store/features/auth/utils";

const ForYou = () => {
  const [userToken, setUserToken] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [foryou, setFouyou] = useState<any[]>([]);
  const fetchForYouLiveStreams = async () => {
    const token = await getToken();
    try {
      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL +
          `api/streams/for-you?status=live&page=1&limit=10`,
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        },
      );
      if (response.status === 200) {
        setFouyou(response.data?.streams);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
      setUserToken(token);
    }
  };

  useEffect(() => {
    fetchForYouLiveStreams();
  }, []);

  const renderEmptyStreams = useCallback(() => {
    return (
      <View
        style={{
          paddingHorizontal: 16,
          alignItems: "center",
        }}
      >
        <View
          style={{
            marginVertical: 24,
            padding: 24,
            paddingHorizontal: 48,
            alignItems: "center",
            backgroundColor: "#000",
            borderRadius: 8,
            flexShrink: 1,
            paddingBottom: 40,
          }}
        >
          <View
            style={{
              width: 102,
              height: 102,
              borderRadius: "50%",
              backgroundColor: "#DDF9E7",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 32,
            }}
          >
            <Image
              source={icons.sadEmoji}
              resizeMode="contain"
              className="w-[40px] h-[40px]"
            />
          </View>

          <Text
            className="mb-[10px] text-center text-[16px] font-LexendDecaSemiBold text-white"
            style={{
              lineHeight: 22,
            }}
          >
            No Live Shopping events right now!
          </Text>
          <Text
            className="font-LexendDeca text-[14px] text-[#8F9099] text-center"
            style={{
              lineHeight: 22,
            }}
          >
            Follow your favourite sellers to get notified when they go live.
          </Text>

          {userToken ? (
            <Pressable
              className="px-[20px] py-[12px] items-center justify-center rounded-[6px] bg-[#16783A] mt-[16px]"
              onPress={() => router.push("/settings/updateCategories")}
            >
              <Text className="text-white text-[12px] font-LexendDecaSemiBold">
                Add a Category
              </Text>
            </Pressable>
          ) : (
            <Pressable
              className="px-[20px] py-[12px] items-center justify-center rounded-[6px] bg-[#16783A] mt-[16px]"
              onPress={() => router.push("/(root)/(auth)/sign-in")}
            >
              <Text className="text-white text-[12px] font-LexendDecaSemiBold">
                Login
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  }, [foryou]);

  return (
    <View className="mt-[9px] w-[100%] pb-[15.5px]">
      <SectionHeader title="For You" btnText="" />
      {loading ? (
        <HomepageSkeleton numOfLoaders={4} height={220} padding={16} />
      ) : foryou?.length > 0 ? (
        <View
          style={{
            paddingHorizontal: 16,
          }}
        >
          <FlatList
            data={foryou}
            renderItem={({ item }) => (
              <View className="w-1/2 py-2 shrink">
                <LiveProductCard item={item} />
              </View>
            )}
            keyExtractor={(item, index) => item?._id || index.toString()}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: "space-between", gap: 12 }}
          />
        </View>
      ) : (
        renderEmptyStreams()
      )}
    </View>
  );
};

export default ForYou;
