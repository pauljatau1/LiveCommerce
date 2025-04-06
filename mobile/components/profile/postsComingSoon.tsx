import { View, Text, StyleSheet, Dimensions } from "react-native";
import React, { memo } from "react";
import { Image } from "expo-image";

const PostsComingSoon = () => {
  const contentContainerStyle = {
    // paddingTop: 220,
  };
  return (
    <View style={contentContainerStyle}>
      <View
        style={{
          alignItems: "center",
          paddingTop: 50,
          paddingHorizontal: 40,
        }}
      >
        <Image
          source={require("../../assets/images/posts-coming-soon.png")}
          contentFit="contain"
          style={{
            width: 200,
            height: 200,
            marginBottom: 20,
            flexShrink: 1,
          }}
        />
        <Text className="text-[20px] text-[#ccc] font-LexendDecaSemiBold opacity-80">
          Posts is coming soon!
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  userMetadata: {
    gap: 5,
  },
  userName: {
    fontSize: 18,
    color: "#ccc",
    fontFamily: "LexendDeca-Medium",
  },
});

export default memo(PostsComingSoon);
