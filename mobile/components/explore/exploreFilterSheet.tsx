import {
  View,
  Text,
  Pressable,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";
import React, { useState } from "react";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";

const conditions = [
  { label: "Open Shows", value: "open_shows" },
  { label: "Live Auctions", value: "auction" },
];

const ExploreFilterSheet = ({
  selectFilterType,
  currentSelection,
}: {
  selectFilterType: any;
  currentSelection: any;
}) => {
  const [selectedFilters, setSelectedFilters] = useState<any>(
    currentSelection || { condtion: null },
  );

  const conditionChange = (text: any) => {
    setSelectedFilters((prevFilters: any) => {
      return {
        condition: prevFilters.condition?.value == text ? null : text,
      };
    });
  };

  return (
    <View className="my-[10px] h-full" style={{ paddingBottom: 60 }}>
      <Text className="self-center font-LexendDecaMedium text-[18px] text-[#fff]">
        Filters
      </Text>
      <View style={{ padding: 20 }}>
        <View className="gap-[8px]">
          <Text style={styles.label}>Sales</Text>
          <View className="flex-row items-center gap-[10px] px-[10px]">
            {conditions.map((condition, index) => (
              <TouchableOpacity
                key={index}
                className={` rounded-[8px] py-[8px] px-[12px] flex-row justify-center items-center`}
                style={{
                  backgroundColor:
                    selectedFilters.condition == condition?.value
                      ? "#fff"
                      : "rgba(204, 204, 204, 0.25)",
                }}
                onPress={() => conditionChange(condition?.value)}
              >
                <Text
                  className={`${selectedFilters.condition == condition?.value ? "text-[#2F2E41]" : "text-[#f2f2f2]"}  text-[10px] font-LexendDecaMedium`}
                >
                  {condition?.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <View className="absolute bottom-[50px] left-0 right-0 px-[20px] py-[2px]">
        <Pressable
          className="w-full py-[12px] items-center justify-center bg-[#16783A]"
          style={{ borderRadius: 25 }}
          onPress={() => selectFilterType(selectedFilters?.condition)}
        >
          <Text className="text-[14px] text-[#fff] font-LexendDeca">
            Show Results
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  editSingleSection: {
    width: "100%",
    flexBasis: "47%",
    // flexShrink: 1,
  },
  label: {
    fontSize: 12,
    fontFamily: "LexendDeca",
    color: "#ccc",
    marginBottom: 4,
  },
  input: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: "LexendDeca",
    color: "#fff",
    backgroundColor: "#2e2e2e",
    borderRadius: 8,
  },
});

export default ExploreFilterSheet;
