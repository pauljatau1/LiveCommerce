import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useState } from "react";

const Tags = ({ tags, setSelected, selected }: any) => {
  return (
    <View
      style={[
        // styles.container,
        {
          borderBottomColor: "rgba(255, 255, 255, 0.38)",
          alignItems: "center",
        },
      ]}
      className=" mt-8 border-b-[1px]"
    >
      <FlatList
        horizontal
        data={tags}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item, index }) => {
          return (
            <TouchableOpacity onPress={() => setSelected(item)}>
              <Text
                style={[
                  styles.tagText,
                  item == selected ? styles.isSelected : null,
                  // index == 0 ? { marginLeft: 23 } : {},
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={styles.container}
        keyExtractor={(item, index) => item?.toString()}
      />
    </View>
  );
};

export default Tags;

const styles = StyleSheet.create({
  tagText: {
    fontSize: 13,
    paddingVertical: 11,
    paddingHorizontal: 14,
    color: "#938F8F",
    fontWeight: "400",
    fontFamily: "LexendDeca",
  },
  isSelected: {
    color: "#00A353",
    borderBottomWidth: 2,
    borderColor: "#00A353",
    fontWeight: "600",
  },
  container: {
    marginVertical: 0,
    paddingHorizontal: 12,
    // marginHorizontal: -16,
  },
});
