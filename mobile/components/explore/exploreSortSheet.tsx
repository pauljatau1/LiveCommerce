import { View, Text, Pressable, StyleSheet } from "react-native";
import React, { useState } from "react";

const SortSheet = ({
  selectSortType,
  currentSelection,
}: {
  selectSortType: any;
  currentSelection: any;
}) => {
  const options = [
    { label: "Views: Highest to Lowest", value: "desc" },
    { label: "Views: Lowest to Highest", value: "asc" },
  ];
  const [selectedType, setSelectedType] = useState<string>(currentSelection);
  return (
    <View className="my-[10px] h-full">
      <Text className="self-center font-LexendDeca text-[18px] text-[#fff] mb-[20px]">
        Sort
      </Text>
      <View style={{ paddingBottom: 20 }}>
        {options.map((option, index) => (
          <Pressable
            key={index}
            style={{
              paddingVertical: 15,
              paddingHorizontal: 16,
              borderBottomColor: "#888787",
              borderBottomWidth: StyleSheet.hairlineWidth,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
            onPress={() => setSelectedType(option.value)}
          >
            <Text className="text-[14px] text-[#fff] font-LexendDeca">
              {option.label}
            </Text>
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 22,
                borderColor: "#fff",
                borderWidth: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 12,
                  backgroundColor: selectedType == option.value ? "#fff" : "",
                }}
              ></View>
            </View>
          </Pressable>
        ))}
      </View>

      <View
        className="absolute left-0 right-0 py-[2px] px-[16px] flex-row items-center justify-between"
        style={{
          bottom: 50,
        }}
      >
        <Pressable
          className=" py-[12px] items-center justify-center border-[1px] border-[#16783A]"
          style={{ borderRadius: 8.5, flexBasis: "23%" }}
          onPress={() => selectSortType("")}
        >
          <Text className="text-[14px] text-[#fff] font-LexendDeca">Clear</Text>
        </Pressable>
        <Pressable
          className=" py-[12px] items-center justify-center bg-[#16783A] border-[1px] border-[#16783A]"
          style={{ borderRadius: 8.5, flexBasis: "75%" }}
          onPress={() => selectSortType(selectedType)}
        >
          <Text className="text-[14px] text-[#fff] font-LexendDeca">
            Show Results
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

export default SortSheet;
