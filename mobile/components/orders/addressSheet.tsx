import { View, Text, TouchableOpacity, Pressable } from "react-native";
import React, { useEffect, useState } from "react";
import { router } from "expo-router";
import AntDesign from "@expo/vector-icons/AntDesign";

const AddressSheet = ({
  addresses,
  closeSheet,
  selectAddress,
}: {
  addresses: any;
  closeSheet: () => void;
  selectAddress: (address: any) => void;
}) => {
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [checked, setChecked] = useState<number>(-1);

  const handleSelectAddress = () => {
    if (!selectedAddress) {
      return;
    }
    selectAddress(selectedAddress);
  };

  useEffect(() => {
    if (addresses?.length > 0) {
      setSelectedAddress(addresses[checked]);
    }
  }, [checked]);

  return (
    <View className="p-[8px] pb-[16px]">
      <View className="flex-row justify-center items-center mb-[23px] w-full">
        <View className="">
          <Text className="text-[18px] text-[#ccc] font-LexendDecaBold">
            Select Shipping Address
          </Text>
        </View>
        <Pressable
          onPress={closeSheet}
          className="bg-[#EE571C] w-[30px] h-[30px] rounded-[50%] absolute"
          style={{
            right: 8,
          }}
        >
          <AntDesign name="closecircle" size={30} color="#F9C7B3" />
        </Pressable>
      </View>

      <View className="mb-[20px] gap-[10px]">
        {addresses?.length > 0 ? (
          addresses.map((address: any, index: any) => (
            <TouchableOpacity
              key={index}
              className="p-[20px] rounded-[16px] flex-row items-center justify-between"
              style={{ backgroundColor: "rgba(41, 41, 41, 0.81)" }}
              onPress={() => {
                setChecked(index);
              }}
            >
              <View className="flex-row gap-[16px] shrink">
                <View className="w-[23px] h-[23px] rounded-full bg-[#B190B6] flex-row items-center justify-center">
                  <Text className="text-white text-[9px]">
                    {address?.first_name?.split("")[0]}
                  </Text>
                  <Text className="text-white text-[9px]">
                    {address?.last_name?.split("")[0]}
                  </Text>
                </View>
                <View className="gap-[18px] shrink">
                  {/* <Text className="text-[#ccc] text-[16px] font-LexendDecaMedium">
                  {address?.first_name + " " + address?.last_name}
                </Text> */}

                  <View className="gap-[4px]">
                    <Text className="text-[#ccc] text-[10px] font-LexendDecaMedium">
                      Country: {address?.country}
                    </Text>
                    <Text className="text-[#ccc] text-[10px] font-LexendDecaMedium">
                      State: {address?.state}
                    </Text>
                    <Text className="text-[#ccc] text-[10px] font-LexendDecaMedium">
                      City: {address?.city}
                    </Text>
                    <Text className="text-[#ccc] text-[10px] font-LexendDecaMedium">
                      Street Address: {address?.addressLine1}
                    </Text>
                    <Text className="text-[#ccc] text-[10px] font-LexendDecaMedium">
                      Zip Code: {address?.zipCode}
                    </Text>
                  </View>
                </View>
              </View>
              <View
                className={`border-[1px] ${checked == index ? "border-[#16783A]" : "border-[#ccc]"} rounded-[20px] w-[20px] h-[20px] justify-center items-center`}
              >
                <View
                  className={` ${checked == index ? "bg-[#16783A]" : ""} rounded-[12px] w-[12px] h-[12px] justify-center items-center`}
                ></View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text className="p-4 text-[#ccc] text-[12px] self-center">
            No addresses found
          </Text>
        )}
      </View>

      <Pressable
        className="px-[20px] py-[12px] self-center mb-[20px] rounded-[8px] border-dashed border-[1px] border-[#ccc] max-w-[200px] items-center justify-center"
        style={{ backgroundColor: "rgba(255, 255, 255, 0.20)" }}
        onPress={() => {
          closeSheet();
          router.push("/addresses/addAddress");
        }}
      >
        <Text className="text-[#ccc] text-[14px] ">Add New Address</Text>
      </Pressable>

      <TouchableOpacity
        className="py-[10px] rounded-[6px] bg-[#16783A] items-center justify-center"
        onPress={handleSelectAddress}
      >
        <Text className="text-white text-[14px] font-LexendDecaMedium">
          Confirm Delivery method
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default AddressSheet;
