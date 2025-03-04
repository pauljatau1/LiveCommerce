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

const conditions = ["New", "Fairly Used"];

const FilterSheet = ({
  selectFilterType,
  currentSelection,
}: {
  selectFilterType: any;
  currentSelection: any;
}) => {
  const [selectedFilters, setSelectedFilters] = useState<any>(
    currentSelection || { price: null, condtion: null },
  );

  const minPriceChange = (text: any) => {
    setSelectedFilters((prevFilters: any) => {
      return {
        price: {
          min: text,
          max: prevFilters.price?.max,
        },
        condition: prevFilters?.condition,
      };
    });
  };

  const maxPriceChange = (text: any) => {
    setSelectedFilters((prevFilters: any) => {
      return {
        price: {
          min: prevFilters.price?.min,
          max: text,
        },
        condition: prevFilters?.condition,
      };
    });
  };

  const conditionChange = (text: any) => {
    setSelectedFilters((prevFilters: any) => {
      return {
        price: {
          min: prevFilters.price?.min,
          max: prevFilters.price?.max,
        },
        condition: prevFilters.condition == text ? null : text,
      };
    });
  };

  return (
    <View className="my-[10px]" style={{ paddingBottom: 60 }}>
      <Text className="self-center font-LexendDecaMedium text-[18px] text-[#fff]">
        Filters
      </Text>
      <View style={{ padding: 20 }}>
        <View className="flex-row gap-[16px] items-center justify-between mb-[20px]">
          <View style={styles.editSingleSection}>
            <Text style={styles.label}>Min price</Text>
            <BottomSheetTextInput
              style={styles.input}
              placeholder="Min"
              value={selectedFilters.price?.min}
              onChangeText={(text) => minPriceChange(text)}
              keyboardType="numeric"
              maxLength={9}
            />
          </View>
          <View style={styles.editSingleSection}>
            <Text style={styles.label}>Max price</Text>
            <BottomSheetTextInput
              style={[styles.input]}
              placeholder="Max"
              value={selectedFilters.price?.max}
              onChangeText={(text) => maxPriceChange(text)}
              keyboardType="numeric"
              maxLength={9}
            />
          </View>
        </View>
        <View className="gap-[8px]">
          <Text style={styles.label}>Condition</Text>
          <View className="flex-row items-center gap-[10px] px-[10px]">
            {conditions.map((condition, index) => (
              <TouchableOpacity
                key={index}
                className={` rounded-[8px] py-[8px] px-[12px] flex-row justify-center items-center`}
                style={{
                  backgroundColor:
                    selectedFilters.condition == condition
                      ? "#fff"
                      : "rgba(204, 204, 204, 0.25)",
                }}
                onPress={() => conditionChange(condition)}
              >
                <Text
                  className={`${selectedFilters.condition == condition ? "text-[#2F2E41]" : "text-[#f2f2f2]"}  text-[10px] font-LexendDecaMedium`}
                >
                  {condition}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <View className="absolute bottom-0 left-0 right-0 px-[20px] py-[2px]">
        <Pressable
          className="w-full py-[12px] items-center justify-center bg-[#16783A]"
          style={{ borderRadius: 25 }}
          onPress={() => selectFilterType(selectedFilters)}
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

export default FilterSheet;
