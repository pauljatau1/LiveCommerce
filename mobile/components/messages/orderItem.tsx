import { View, Text, StyleSheet, Pressable } from "react-native";
import React, { memo } from "react";
import { Image } from "expo-image";
import { router } from "expo-router";

const OrderItem = ({ item }: any) => {
  return (
    <View>
      {item?.status == "pending" ? (
        <OrderPlaced item={item} />
      ) : (
        <OrderStatus item={item} />
      )}
    </View>
  );
};

const OrderPlaced = ({ item }: any) => {
  return (
    <View style={styles.placedContainer}>
      <Text style={styles.placedHeaderText}>Thank you for your purchase!</Text>
      <Text style={styles.placedHeaderSubText}>
        You can review your order for any changes below
      </Text>
      <Image
        source={{ uri: item?.items[0]?.image }}
        style={styles.image}
        contentFit="contain"
      />
      <View style={styles.placedDetailsContainer}>
        <Text style={styles.placedName} numberOfLines={2}>
          {item?.items?.[0]?.name}
        </Text>
        <View style={styles.priceContainer}>
          <Text style={styles.placedPrice}>
            N{item?.totalAmount?.toLocaleString()}
          </Text>
        </View>
      </View>
      <View style={styles.placedIdContainer}>
        <Text style={styles.placedId}>Order ID: {item?.id}</Text>
      </View>
      <Pressable
        style={styles.placedViewBtn}
        onPress={() => router.push(`/(root)/orders/${item?.id}`)}
      >
        <Text style={styles.placedViewBtnText}>View</Text>
      </Pressable>
    </View>
  );
};

const OrderStatus = ({ item }: any) => {
  return <View></View>;
};

const styles = StyleSheet.create({
  container: {},
  placedContainer: {
    maxWidth: "75%",
    backgroundColor: "#14AE5C",
    padding: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginLeft: 16,
    marginVertical: 4,
    alignItems: "center",
  },
  placedHeaderText: {
    textAlign: "center",
    fontSize: 18,
    fontFamily: "LexendDeca-SemiBold",
    color: "#fff",
    marginBottom: 4,
  },
  placedHeaderSubText: {
    textAlign: "center",
    fontSize: 12,
    fontFamily: "LexendDeca",
    color: "#fff",
    marginBottom: 12,
    lineHeight: 20,
  },
  image: {
    width: 150,
    height: 100,
    borderRadius: 14,
    marginBottom: 12,
  },
  placedDetailsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    marginBottom: 8,
    width: "100%",
  },
  placedName: {
    fontSize: 14,
    fontFamily: "LexendDeca-SemiBold",
    flexShrink: 1,
    color: "#fff",
  },
  priceContainer: {
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E5FDFF",
  },
  placedPrice: {
    fontSize: 12,
    fontFamily: "LexendDeca-Medium",
    color: "#16783A",
  },
  placedIdContainer: {
    marginBottom: 12,
    width: "100%",
  },
  placedId: {
    fontSize: 10,
    fontFamily: "LexendDeca-Light",
    color: "#fff",
  },
  placedViewBtn: {
    borderRadius: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderColor: "#16783A",
    borderWidth: 2,
  },
  placedViewBtnText: {
    fontSize: 12,
    fontFamily: "LexendDeca-Medium",
    color: "#16783A",
  },
});

export default memo(OrderItem);
