import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useEffect, useRef, useState, memo } from "react";

const Tags = ({ tags, setSelected, selected }: any) => {
  const tabsRef = useRef<FlatList | any>();

  useEffect(() => {
    if (tabsRef.current) {
      tabsRef.current.scrollToIndex({
        index: tags.indexOf(selected),
        animated: true,
        viewPosition: 0.5,
      });
    }
  }, [selected, tags]);
  return (
    <View
      style={[
        // styles.container,
        {
          // borderBottomColor: "rgba(255, 255, 255, 0.38)",
          alignItems: "center",
        },
      ]}
      // className=" mt-[17px] border-b-[1px]"
      className=" mt-[17px]"
    >
      <FlatList
        ref={tabsRef}
        horizontal
        data={tags}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item, index }) => {
          return (
            <TouchableOpacity
              className="items-center"
              onPress={() => setSelected(item)}
            >
              <Text
                style={[
                  styles.tagText,
                  item == selected ? styles.isSelected : null,
                  // index == 0 ? { marginLeft: 23 } : {},
                ]}
              >
                {item}
              </Text>
              {item === selected && (
                <View className="w-[20px] h-[3px] rounded-full bg-[#16783A]"></View>
              )}
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={styles.container}
        keyExtractor={(item, index) => item?.toString()}
        onScrollToIndexFailed={({ index }) =>
          console.log("scroll failed ", { index })
        }
      />
    </View>
  );
};

export default memo(Tags);

const styles = StyleSheet.create({
  tagText: {
    fontSize: 14,
    paddingVertical: 6,
    paddingHorizontal: 8,
    color: "#938F8F",
    fontFamily: "LexendDeca-Light",
    letterSpacing: -0.22,
  },
  isSelected: {
    color: "#00A353",
    // borderBottomWidth: 1,
    // borderColor: "#00A353",
    fontFamily: "LexendDeca-Medium",
  },
  container: {
    marginVertical: 0,
    paddingHorizontal: 12,
    // marginHorizontal: -16,
  },
});
