import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import React from "react";
import { router } from "expo-router";
import { Image } from "expo-image";
import { formatNumber } from "@/helpers/helpers";
import { Ionicons } from "@expo/vector-icons";

const BlipCard = ({ item }: any) => {
  return (
    <Pressable
      className=" bg-black rounded-[8px] w-[100%] h-[250px]"
      onPress={() =>
        router.push({
          pathname: "/singleBlip",
          params: { id: item?._id, blipId: item?.blipId },
        })
      }
    >
      <Image
        source={{ uri: item.thumbnail }}
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 8,
        }}
        contentFit="cover"
      />
      <View style={styles.viewsContainer}>
        <View style={styles.buttonShadow}>
          <Ionicons name="play-outline" size={20} color="#f2f2f2" />
        </View>
        <Text style={styles.text}>
          {formatNumber(item?.blipEngagement?.viewCount)}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  viewsContainer: {
    position: "absolute",
    left: 6,
    bottom: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  text: {
    color: "#f2f2f2",
    fontFamily: "LexendDeca",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  imageShadow: {
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 31,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  buttonShadow: {
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
});

export default BlipCard;
