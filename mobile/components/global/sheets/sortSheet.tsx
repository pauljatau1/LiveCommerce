import RadioButton from "@/components/Primitives/Buttons/radioButton";
import { memo, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";

const sortMap = {
  None: "",
  "Price: High to Low": "price_desc",
  "Price: Low to High": "price_asc",
  "Newest to Oldest": "newest",
  "Oldest to Newest": "oldest",
} as any;

const options = [
  "None",
  "Price: High to Low",
  "Price: Low to High",
  "Newest to Oldest",
  "Oldest to Newest",
];

const SortSheet = memo(
  ({
    selectSortType,
    currentSelection,
  }: {
    selectSortType: any;
    currentSelection: any;
  }) => {
    const [selectedType, setSelectedType] = useState<string>(currentSelection);
    return (
      <View className="mb-[20px]">
        <Text className="self-center font-LexendDeca text-[18px] text-[#fff]">
          Sort
        </Text>
        <View style={{ paddingBottom: 20 }}>
          {options.map((option, index) => (
            <Pressable
              key={index}
              style={{
                paddingVertical: 15,
                paddingHorizontal: 10,
                borderBottomColor: "#888787",
                borderBottomWidth: StyleSheet.hairlineWidth,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
              onPress={() => setSelectedType(option)}
            >
              <Text className="text-[14px] text-[#fff] font-LexendDeca">
                {option}
              </Text>
              <RadioButton
                active={
                  selectedType == option ||
                  sortMap[options[index]] == selectedType
                }
                size={22}
                color="#fff"
                onPress={() => setSelectedType(option)}
              />
            </Pressable>
          ))}
        </View>
        <View className="px-[10px] py-[2px]">
          <Pressable
            className="w-full py-[12px] items-center justify-center bg-[#16783A]"
            style={{ borderRadius: 25 }}
            onPress={() => selectSortType(selectedType)}
          >
            <Text className="text-[14px] text-[#fff] font-LexendDeca">
              Show Results
            </Text>
          </Pressable>
        </View>
      </View>
    );
  },
);

export default SortSheet;
