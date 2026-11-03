import {
  View,
  Text,
  Pressable,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from "react-native";
import React, { useState } from "react";
import { AntDesign } from "@expo/vector-icons";
import axios from "axios";
import { router } from "expo-router";
import { ActivityIndicator } from "react-native-paper";
import { getToken } from "@/store/features/auth/utils";
import { toast } from "@/core/toast";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";

const ReportUserSheet = ({
  userId,
  userType,
  closeSheet,
}: {
  userId: string;
  userType: string;
  closeSheet: any;
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [reason, setReason] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  const handleReportUser = async () => {
    if (!reason || !description) {
      return toast.info("Please fill in all fields");
    }
    setLoading(true);
    try {
      const token = await getToken();
      const response = await axios.post(
        process.env.EXPO_PUBLIC_API_URL + "api/v2/buyers/report-user",
        {
          userId,
          userType: userType.toLowerCase(),
          reason,
          description,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      toast.success("Report has been submitted");
      closeSheet();
    } catch (e: any) {
      toast.error(
        e?.response?.data?.errors?.[0]?.message || "could not report user",
      );
      console.log("error reporting user ", e);
    } finally {
      setLoading(false);
    }
  };
  return (
    <View>
      <View className="flex-row justify-center items-center mb-[23px] w-full mt-[10px]">
        <View className="">
          <Text className="text-[18px] text-[#ccc] font-LexendDecaBold text-center">
            Report This User
          </Text>
        </View>
      </View>
      <View style={styles.editSingleSection}>
        <BottomSheetTextInput
          style={styles.reason}
          placeholder="Reason"
          value={reason}
          onChangeText={(text) => setReason(text)}
        />
      </View>
      <View style={styles.editSingleSection}>
        <BottomSheetTextInput
          style={styles.input}
          placeholder="More Details"
          value={description}
          onChangeText={(text) => setDescription(text)}
          multiline
          numberOfLines={4}
        />
      </View>
      <View className="px-[16px] mb-[12px]">
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
          onPress={handleReportUser}
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

const styles = StyleSheet.create({
  editSingleSection: {
    width: "100%",
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  input: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: "LexendDeca",
    color: "#fff",
    backgroundColor: "#2e2e2e",
    borderRadius: 8,
    minHeight: 100,
    textAlignVertical: "top",
  },
  reason: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: "LexendDeca",
    color: "#fff",
    backgroundColor: "#2e2e2e",
    borderRadius: 8,
  },
});

export default ReportUserSheet;
