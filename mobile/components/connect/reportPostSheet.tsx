import { View, Text, Pressable, TouchableOpacity } from "react-native";
import React, { useState } from "react";
import { AntDesign } from "@expo/vector-icons";
import axios from "axios";
import { router } from "expo-router";
import { ActivityIndicator } from "react-native-paper";
import { getToken } from "@/store/features/auth/utils";
import { toast } from "@/core/toast";

const reportReasons = [
  "inappropriate_content",
  "spam",
  "harassment",
  "hate_speech",
  "misinformation",
  "copyright_violation",
  "other",
];

const ReportPostSheet = ({
  postId,
  closeSheet,
}: {
  postId: string;
  closeSheet: any;
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedReason, setSelectedReason] = useState<string>("");

  const handleReportPost = async () => {
    if (!selectedReason) {
      return toast.info("Please select a reason");
    }
    setLoading(true);
    try {
      const token = await getToken();
      const response = await axios.post(
        process.env.EXPO_PUBLIC_API_URL + "api/posts/" + postId + "/report",
        {
          reason: selectedReason,
          description: selectedReason,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      toast.success("Report has been submitted");
      closeSheet();
    } catch (e) {
      toast.error("could not report post");
      console.log("error reporting post ", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectReason = (reason: string) => {
    setSelectedReason(reason);
  };

  const renderReason = (item: any, index: any) => {
    return (
      <TouchableOpacity
        activeOpacity={0.5}
        key={index}
        className="py-[18px] flex-row items-center justify-between border-b-[#ccc]"
        style={{
          paddingHorizontal: 24,
          borderBottomWidth: 0.3,
          borderBottomColor: "rgba(204, 204, 204, 0.70)",
        }}
        onPress={() => handleSelectReason(item)}
      >
        <Text className="font-LexendDeca text-[16px] text-[#ccc]">
          {item.split("_").join(" ")}
        </Text>
        <View
          className="w-[18px] h-[18px] rounded-[4px] items-center justify-center border-[#ccc] border-[1px]"
          style={{
            width: 18,
            height: 18,
          }}
        >
          {selectedReason == item && (
            <AntDesign name="check" size={12} color="#ccc" />
          )}
        </View>
      </TouchableOpacity>
    );
  };
  return (
    <View>
      <View className="flex-row justify-center items-center mb-[23px] w-full mt-[10px]">
        <View className="">
          <Text className="text-[18px] text-[#ccc] font-LexendDecaBold text-center">
            Why are you reporting this post?
          </Text>
        </View>
      </View>
      <View>
        {reportReasons.map((reason, index) => renderReason(reason, index))}
      </View>
      <View className="px-[16px]">
        <Pressable
          style={{
            paddingVertical: 12,
            width: "100%",
            borderRadius: 8,
            backgroundColor: "#16783A",
            justifyContent: "center",
            alignItems: "center",
            marginTop: 30,
          }}
          onPress={handleReportPost}
        >
          {loading ? (
            <ActivityIndicator size={"small"} color="#fff" />
          ) : (
            <Text
              style={{
                fontSize: 14,
                color: "#fff",
                fontFamily: "LexendDeca",
              }}
            >
              Submit Report
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
};

export default ReportPostSheet;
