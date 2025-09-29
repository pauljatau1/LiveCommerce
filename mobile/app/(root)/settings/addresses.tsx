import { View, Text, TouchableOpacity, Pressable, Alert } from "react-native";
import React, { useEffect, useState } from "react";
import { FocusAwareStatusBar } from "@/components/ui/focus-aware-status-bar";
import {
  AntDesign,
  Entypo,
  EvilIcons,
  Feather,
  Ionicons,
  MaterialIcons,
} from "@expo/vector-icons";
import { router } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import { getToken } from "@/store/features/auth/utils";
import axios from "axios";
import { ActivityIndicator } from "react-native-paper";
import SafeAreaView from "@/components/global/safeareaview/SafeAreaView";
import * as Haptics from "expo-haptics";

const addressTypeColors = {
  home: "#b4e23f",
  work: "#86bee2",
  other: "#d7253a",
} as any;

const Addresses = () => {
  const isFocused = useIsFocused();
  const [loading, setLoading] = useState<boolean>(true);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  const [addresses, setAddresses] = useState<any[]>([]);

  const getAddresses = async () => {
    try {
      const token = await getToken();
      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL + "api/v2/buyers/addresses",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setAddresses(response.data?.data);
    } catch (e) {
      console.log("error fetching buyer addresses ", e);
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteAddress = async (id: String) => {
    setDeleteLoading(true);
    try {
      const token = await getToken();
      const response = await axios.delete(
        process.env.EXPO_PUBLIC_API_URL + "api/v2/buyers/addresses/" + id,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setAddresses(addresses.filter((address: any) => address._id !== id));
    } catch (e) {
      console.log("error fetching buyer addresses ", e);
    } finally {
      setDeleteLoading(false);
    }
  };

  const deleteAddress = async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Delete Address",
      "Are you sure you want to delete this address?",

      [
        { text: "Cancel" },
        {
          text: "Delete",
          onPress: () => confirmDeleteAddress(id),
        },
      ],
    );
  };

  const updateAddress = async (address: any) => {
    router.push({
      pathname: "/addresses/addAddress",
      params: {
        address: JSON.stringify(address),
      },
    });
  };

  useEffect(() => {
    if (isFocused) {
      getAddresses();
    }
  }, [isFocused]);
  return (
    <SafeAreaView className="h-full flex-1 bg-[#121212] ">
      <FocusAwareStatusBar barStyle="light-content" backgroundColor="#121212" />
      <View className="w-full flex-row items-center justify-between gap-[10px]  px-[12px] py-[20px]">
        <TouchableOpacity className="" onPress={() => router.back()}>
          <Entypo
            name="chevron-left"
            size={24}
            color="rgba(204, 204, 204, 0.8)"
          />
        </TouchableOpacity>

        <Text className="text-white font-LexendDecaMedium text-[20px]">
          Addresses
        </Text>

        <Pressable
          className="mr-[4px]"
          onPress={() => router.push("/addresses/addAddress")}
        >
          <AntDesign name="pluscircle" size={24} color="#f2f2f2" />
        </Pressable>
      </View>

      <View className="flex-1 px-[16px] gap-[20px] pt-[15px]">
        {loading ? (
          <ActivityIndicator size={"small"} color="#16783A" />
        ) : addresses?.length > 0 && !loading ? (
          addresses.map((address: any, index: any) => (
            <View
              key={index}
              className="p-[16px] rounded-[16px]"
              style={{
                backgroundColor: "rgba(41, 41, 41, 0.81)",

                opacity: deleteLoading ? 0.5 : 1,
              }}
            >
              <View className="flex-row items-center gap-[6px] mb-[8px]">
                <Ionicons
                  name="location-outline"
                  size={16}
                  color="white"
                  style={{ marginLeft: -5, padding: 0 }}
                />
                <Text
                  className="font-LexendDecaMedium text-[12px] capitalize"
                  style={{
                    color:
                      addressTypeColors[address?.addressType?.toLowerCase()],
                  }}
                >
                  {address?.addressType}
                </Text>
              </View>
              <View className=" gap-[16px] shrink w-full">
                <View className="gap-[6px] shrink">
                  {/* <Text className="text-[#ccc] text-[12px] font-LexendDecaMedium">
                    Country:{"  "}
                    <Text className="font-LexendDeca">{address?.country}</Text>
                  </Text>
                  <Text className="text-[#ccc] text-[12px] font-LexendDecaMedium">
                    State:{"  "}
                    <Text className="font-LexendDeca">{address?.state}</Text>
                  </Text>
                  <Text className="text-[#ccc] text-[12px] font-LexendDecaMedium">
                    City:{"  "}
                    <Text className="font-LexendDeca">{address?.city}</Text>
                  </Text> */}
                  <Text className="text-[#fff] text-[14px] font-LexendDeca shrink">
                    {/* Street Address:{"  "} */}
                    <Text className="font-LexendDeca">
                      {address?.addressLine1}, {address?.city}, {address?.state}
                    </Text>
                  </Text>
                  {/* <Text className="text-[#ccc] text-[12px] font-LexendDecaMedium">
                    Zip Code:{"  "}
                    <Text className="font-LexendDeca">{address?.zipCode}</Text>
                  </Text> */}
                </View>

                <View className="flex-row justify-end items-center gap-[12px] flex-end w-full">
                  <TouchableOpacity
                    className="w-[26px] h-[26px] items-center justify-center rounded-[13px] bg-[#DEFFEE60]"
                    onPress={() => updateAddress(address)}
                  >
                    <Feather name="edit-2" size={14} color="#DEFFEE" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="w-[26px] h-[26px] items-center justify-center rounded-[13px] bg-[#d7253a60]"
                    onPress={() => deleteAddress(address?._id)}
                  >
                    <MaterialIcons
                      name="delete-outline"
                      size={20}
                      color="#d7253a"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        ) : (
          <View className="items-center justify-center gap-[20px] mt-[10px]">
            <Text className=" text-[#ccc] text-[12px] self-center font-LexendDeca">
              You have not added any addresses
            </Text>
            <Pressable
              className="rounded-[50px] px-[20px] py-[8px] bg-[#16783A]"
              onPress={() => router.push("/addresses/addAddress")}
            >
              <Text className="font-LexendDecaMedium text-[11px] text-[#fff]">
                Add an address
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

export default Addresses;
