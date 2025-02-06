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
      style={[styles.container, { marginLeft: 23 }]}
      className=" mt-8 border-b-[2px] border-b-gray-200"
    >
      <FlatList
        horizontal
        data={tags}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => {
          return (
            <TouchableOpacity onPress={() => setSelected(item)}>
              <Text
                style={[
                  styles.tagText,
                  item == selected ? styles.isSelected : null,
                ]}
                className={`${tags.length - 1 === tags.indexOf(item) ? "" : ""}`}
              >
                {item}
              </Text>
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={styles.container}
      />
    </View>
  );
};

export default Tags;

const styles = StyleSheet.create({
  tagText: {
    fontSize: 12,
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
    // marginHorizontal: -16,
  },
});
