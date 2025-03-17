import { View, Text, StyleSheet, Pressable } from "react-native";
import React, { memo } from "react";
import { Image } from "expo-image";
import { router } from "expo-router";
import { formatDate } from "@/helpers/helpers";
import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { toast } from "@/core/toast";

const OrderItem = ({ item }: any) => {
  return (
    <View>
      {item?.tracking?.status == "pending" ? (
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
  const copyTrackingNumber = () => {
    Clipboard.setStringAsync(item?.tracking?.number);
    toast.info("Copied to Clipboard");
  };
  return (
    <View style={styles.statusContainer}>
      <Text style={styles.statusHeader}>
        {item.tracking?.status?.replaceAll("_", " ")} Details
      </Text>

      <View style={styles.statusTrackingContainer}>
        <Text style={styles.statusTrackingText}>Tracking Number -</Text>
        <Pressable onPress={copyTrackingNumber}>
          <Text style={styles.statusTrackingNumber}>
            {item.tracking?.number}{" "}
            <Feather
              name="copy"
              size={12}
              color="#027CEC"
              style={{ marginLeft: 2 }}
            />
          </Text>
        </Pressable>
      </View>

      <View className="flex-row">
        <View
          style={{
            gap: 8,
            marginRight: 21,
            width: 60,
          }}
        >
          <>
            <Text
              className={`text-[16px] text-[#000] font-LexendDecaSemiBold `}
            >
              {formatDate(new Date(), "MMM DD")}
            </Text>
            <Text className={`text-[12px] text-[#000] font-LexendDecaLight`}>
              {formatDate(new Date(), "HH:mm")}
            </Text>
          </>
        </View>
        <View
          style={{
            gap: 5,
            flexShrink: 1,
          }}
        >
          <View className="flex-row items-center" style={{ gap: 11 }}>
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 10,

                backgroundColor: "#16783A",
              }}
            ></View>
            <Text
              style={{
                fontSize: 16,
                fontFamily: "LexendDeca-SemiBold",

                color: "#16783A",
              }}
            >
              {item.tracking?.status?.replaceAll("_", " ")}
            </Text>
          </View>
          <View
            style={{
              borderLeftColor: "#16783A",

              borderLeftWidth: 1,
              paddingLeft: 16,
              paddingVertical: 10,
              marginLeft: 4.5,
            }}
          >
            <Text
              className={`text-[12px] text-[#000] font-LexendDecaSemiBold shrink `}
            >
              The seller has prepared your order and is sending to dispatch
              company
            </Text>
          </View>
        </View>
      </View>

      <Pressable
        style={styles.statusTrackBtn}
        onPress={() => router.push(`/(root)/orders/${item?.id}`)}
      >
        <Text style={styles.statusTrackBtnText}>Track</Text>
      </Pressable>
    </View>
  );
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

  statusContainer: {
    maxWidth: "75%",
    backgroundColor: "#fff",
    padding: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginLeft: 16,
    marginVertical: 4,
    alignItems: "flex-start",
  },
  statusHeader: {
    textDecorationLine: "underline",
    fontSize: 16,
    fontFamily: "LexendDeca-SemiBold",
    marginBottom: 8,
  },
  statusTrackingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginBottom: 8,
  },
  statusTrackingText: {
    fontSize: 12,
    fontFamily: "LexendDeca-Medium",
    marginBottom: 8,
    color: "rgba(18, 18, 18, 0.64);",
  },
  statusTrackingNumber: {
    fontSize: 12,
    fontFamily: "LexendDeca-SemiBold",
    marginBottom: 8,
    color: "#027CEC",
  },
  statusTrackingHistory: {},
  statusTrackBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(69, 193, 51, 0.15);",
    alignSelf: "flex-end",
  },
  statusTrackBtnText: {
    color: "#16783A",
    fontSize: 12,
    fontFamily: "LexendDeca-SemiBold",
  },
});

export default memo(OrderItem);
