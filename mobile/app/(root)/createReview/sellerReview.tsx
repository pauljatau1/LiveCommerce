import {
  View,
  Text,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  TouchableWithoutFeedback,
  Keyboard,
  StyleSheet,
} from "react-native";
import React, { useEffect, useState } from "react";
import { router, useGlobalSearchParams } from "expo-router";
import { FocusAwareStatusBar } from "@/components/ui/focus-aware-status-bar";
import Entypo from "@expo/vector-icons/Entypo";
import AntDesign from "@expo/vector-icons/AntDesign";
import { Pressable, TextInput } from "react-native-gesture-handler";
import * as ImagePicker from "expo-image-picker";
import { toast } from "@/core/toast";
import LoadingModal from "@/components/global/loading-modal";
import { getToken } from "@/store/features/auth/utils";
import axios from "axios";
import SafeAreaView from "@/components/global/safeareaview/SafeAreaView";

const { width, height } = Dimensions.get("window");

const SellerReview = () => {
  const { id, storeName, storeAvatar } = useGlobalSearchParams();
  const [rating, setRating] = useState<number>(1);
  const [comment, setComment] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const submitReview = async () => {
    if (!comment) {
      toast.error("Please enter empty fields");
      return;
    }
    setLoading(true);

    try {
      const token = await getToken();
      const payload = {
        rating,
        comment,
      };
      const response = await axios.post(
        `${process.env.EXPO_PUBLIC_API_URL}api/v2/buyers/seller/${id}/review`,
        payload,
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        },
      );

      console.log("review response", response.data);

      toast.success("Review submitted successfully");
      setLoading(false);
      setTimeout(() => router.back(), 1000);
    } catch (e: any) {
      toast.error(e.data.message);
      console.log(e);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    // <ScrollView>
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} style={{ flex: 1 }}>
      <SafeAreaView
        className="h-full flex-1 bg-[#121212]"
        style={{ minHeight: height }}
      >
        <FocusAwareStatusBar
          barStyle="light-content"
          backgroundColor="#121212"
        />

        <View
          className="flex flex-row items-center justify-center gap-[10px] px-[12px] py-[17px] mb-[8px] mt-8"
          style={{ backgroundColor: "rgba(255, 255, 255, 0.23)" }}
        >
          <TouchableOpacity
            className="absolute left-[12px]"
            onPress={() => router.back()}
          >
            <Entypo
              name="chevron-left"
              size={24}
              color="rgba(204, 204, 204, 0.8)"
            />
          </TouchableOpacity>

          <Text className="text-white font-LexendDecaMedium text-[20px]">
            Review Seller
          </Text>
        </View>
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{
            flex: 1,
          }}
          contentContainerStyle={{
            flex: 1,
          }}
        >
          <View
            style={{
              alignItems: "center",
              paddingTop: 24,
              paddingBottom: 12,
              paddingHorizontal: 20,
              gap: 16,
            }}
          >
            <Image
              source={{ uri: storeAvatar?.toString() }}
              resizeMode="cover"
              style={{ width: 100, height: 100, borderRadius: 50 }}
            />
            <Text className="text-center text-[16px] font-LexendDecaMedium text-white">
              How was your experience with {storeName}?
            </Text>
            <View className="flex-row gap-[16px] items-center">
              {Array(5)
                .fill(0)
                .map((val, index) => (
                  <Pressable onPress={() => setRating(index + 1)} key={index}>
                    <AntDesign
                      name="star"
                      size={24}
                      color={
                        rating >= index + 1
                          ? "rgba(255, 180, 0, 1)"
                          : "rgba(255, 255, 255, 0.23)"
                      }
                    />
                  </Pressable>
                ))}
            </View>
          </View>

          <View style={styles.editSingleSection}>
            <Text style={styles.label}>Write your review</Text>
            <TextInput
              style={styles.input}
              placeholder="Comment"
              value={comment}
              onChangeText={(text) => setComment(text)}
              multiline
              numberOfLines={4}
            />
          </View>

          <Pressable
            style={{
              paddingVertical: 12,
              borderRadius: 30,
              width: "100%",
              flexShrink: 1,
              backgroundColor: "#16783A",
              justifyContent: "center",
              alignItems: "center",
              marginTop: 20,
              //   marginHorizontal: 16,
              position: "absolute",
              bottom: 16,
              //   left: 16,
              alignSelf: "center",
              maxWidth: width - 32,
            }}
            onPress={submitReview}
          >
            <Text style={styles.updateBtnText}>Submit</Text>
          </Pressable>
        </ScrollView>

        <LoadingModal isVisible={loading} />
      </SafeAreaView>
    </TouchableWithoutFeedback>

    // </ScrollView>
  );
};

const styles = StyleSheet.create({
  editSingleSection: {
    width: "100%",
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  label: {
    fontSize: 14,
    fontFamily: "LexendDeca",
    color: "#ccc",
    marginBottom: 8,
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
  updateBtnText: {
    fontSize: 14,
    color: "#fff",
    fontFamily: "LexendDeca",
  },
});

export default SellerReview;
