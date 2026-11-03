import { View, Text } from "react-native";
import React, { memo } from "react";
import { Feather } from "@expo/vector-icons";
import { formatDate } from "@/helpers/helpers";

const statusColor = {
  completed: { name: "Completed", color: "#66CB9F", bg: "#DEFFEE" },
  failed: { name: "Failed", color: "#66CB9F", bg: "#DEFFEE" },
  cancelled: { name: "Cancelled", color: "#66CB9F", bg: "#DEFFEE" },
} as any;

const TransactionDetails = ({ item }: any) => {
  return (
    <View className="mt-[10px] my-[20px]">
      <View className="items-center justify-center ">
        <View
          style={{
            backgroundColor: item.type == "credit" ? "#DEFFEE" : "#FAE4E7",
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: "center",
            justifyContent: "center",
            // marginBottom: 12,
          }}
        >
          <Feather
            name={item.type == "credit" ? "arrow-down-left" : "arrow-down-left"}
            size={18}
            color={item.type == "credit" ? "#16783A" : "#CD000F"}
          />
        </View>
      </View>

      <Text className="text-white text-[18px] font-LexendDeca mb-[10px] text-center">
        {item?.type == "debit" && "- "}
        {"₦" +
          item.amount?.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
      </Text>

      <Text className="text-white text-[14px] font-LexendDeca mb-[30px] text-center">
        {item?.description}
      </Text>

      <View className="gap-[10px] px-[14px]">
        <View className="flex-row items-center justify-between">
          <Text className="text-white font-LexendDecaLight text-[12px]">
            Payment Reference:
          </Text>
          <Text className="text-white font-LexendDecaMedium text-[12px]">
            {item?.paymentReference}
          </Text>
        </View>
        <View className="flex-row items-center justify-between">
          <Text className="text-white font-LexendDecaLight text-[12px]">
            Status:
          </Text>
          <View
            style={{
              borderRadius: 6,
              paddingHorizontal: 8,
              paddingVertical: 2,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: statusColor[item.status]?.bg,
            }}
          >
            <Text
              className="text-white text-[10px] font-LexendDecaSemiBold text-center"
              style={{ color: statusColor[item.status]?.color }}
            >
              {item.status?.toUpperCase()}
            </Text>
          </View>
        </View>
        <View className="flex-row items-center justify-between">
          <Text className="text-white font-LexendDecaLight text-[12px]">
            Date:
          </Text>
          <Text className="text-white font-LexendDecaMedium text-[12px]">
            {formatDate(item?.createdAt, "MMM DD YYYY, HH:mm:ss")}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default memo(TransactionDetails);
