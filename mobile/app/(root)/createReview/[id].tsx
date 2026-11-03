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
  Alert,
  Linking,
} from "react-native";
import React, { useState } from "react";
import { router, useGlobalSearchParams } from "expo-router";
import { FocusAwareStatusBar } from "@/components/ui/focus-aware-status-bar";
import Entypo from "@expo/vector-icons/Entypo";
import AntDesign from "@expo/vector-icons/AntDesign";
import { Pressable, TextInput } from "react-native-gesture-handler";
import * as ImagePicker from "expo-image-picker";
import { toast } from "@/core/toast";
import LoadingModal from "@/components/global/loading-modal";
import { getToken } from "@/store/features/auth/utils";
import SafeAreaView from "@/components/global/safeareaview/SafeAreaView";

const { width, height } = Dimensions.get("window");

const createReview = () => {
  const { id } = useGlobalSearchParams();
  const [rating, setRating] = useState<number>(1);
  const [title, setTitle] = useState<string>("");
  const [comment, setComment] = useState<string>("");
  const [images, setImages] = useState<any[]>([]);
  const [color, setColor] = useState<string>("");
  const [selectedImages, setSelectedImages] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const pickImage = async () => {
    const permission = await ImagePicker.getMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      if (permission.canAskAgain) {
        const newPermission =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!newPermission.granted) {
          return;
        }
      } else {
        return Alert.alert(
          "Permission Required",
          "Please enable media library access in Settings to continue",
          [
            { text: "Cancel" },
            { text: "Open Settings", onPress: () => Linking.openSettings() },
          ],
        );
      }
    }
    // Check if the number of selected images is less than 4
    if (selectedImages.length >= 4) {
      alert("You can only upload up to 4 images.");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      allowsMultipleSelection: true,
      allowsEditing: false,
      base64: true,
    });

    if (!result.canceled && result.assets.length > 0) {
      const newImages = result.assets.map((asset) => ({
        uri: asset.uri,
        name: `media_${Date.now()}.${asset.mimeType?.split("/")[1] || "application/octet-stream"}`,
        type: asset.mimeType,
      }));
      const remainingSlots = 4 - selectedImages.length;
      const imagesToAdd = newImages.slice(0, remainingSlots);

      setSelectedImages((prevMedia) => [...prevMedia, ...imagesToAdd]);
    }
  };

  // Function to clear selected images
  const clearSelectedImages = () => {
    setSelectedImages([]);
  };

  const submitReview = async () => {
    if (!title && !comment) {
      toast.error("Please enter empty fields");
      return;
    }
    setLoading(true);

    try {
      const token = await getToken();
      // return;
      const formData = new FormData();
      formData.append("rating", rating.toString());
      formData.append("title", title);
      formData.append("comment", comment);
      selectedImages.forEach((image, index) => {
        formData.append(`images`, image);
      });
      formData.append("purchasedVariant", JSON.stringify({}));

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}api/products/${id}/reviews`,
        {
          method: "POST",
          body: formData,
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: "Bearer " + token,
          },
        },
      );
      const data = await response.json();
      console.log("review response", data);

      toast.success("Review submitted successfully");
      setLoading(false);
      router.back();
    } catch (e: any) {
      toast.error(e.data.message);
      console.log(e);
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
            Write Review
          </Text>
        </View>
        <View className="px-[16px] py-[20px] flex-row justify-between items-center">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-[16px] text-white opacity-70">Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="border-2 px-[16px] py-[8px]"
            style={[
              {
                borderColor: "rgba(255, 255, 255, 0.12)",
                backgroundColor: "rgba(255, 255, 255, 0.12)",
              },
              title && comment
                ? {
                    backgroundColor: "#16783A",
                    borderRadius: 8,
                    borderColor: "#16783A",
                  }
                : null,
            ]}
            onPress={() => submitReview()}
          >
            <Text className="text-[16px] text-white opacity-70">Post</Text>
          </TouchableOpacity>
        </View>
        <View className="px-[16px] mb-[20px]">
          <Text className="text-white opacity-70 text-[12px] mb-[8px]">
            Score:
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
        <TextInput
          value={title}
          onChangeText={(text) => setTitle(text)}
          placeholder="Title"
          placeholderTextColor={"rgba(255, 255, 255, 0.70)"}
          style={{
            fontSize: 16,
            color: "rgba(255, 255, 255, 0.70)",
            paddingVertical: 16,
            paddingHorizontal: 12,
            marginHorizontal: 16,
            borderWidth: 1,
            borderColor: "rgba(255, 255, 255, 0.70)",
            marginBottom: 20,
          }}
        />

        <TextInput
          value={comment}
          onChangeText={(text) => setComment(text)}
          placeholder="Review:"
          placeholderTextColor={"rgba(255, 255, 255, 0.70)"}
          multiline
          numberOfLines={6}
          style={{
            fontSize: 16,
            color: "rgba(255, 255, 255, 0.70)",
            paddingVertical: 16,
            paddingHorizontal: 12,
            marginHorizontal: 16,
            borderWidth: 1,
            borderColor: "rgba(255, 255, 255, 0.70)",
            marginBottom: 20,
            minHeight: 150,
            textAlignVertical: "top",
          }}
        />

        {selectedImages.length < 1 && (
          <Pressable
            style={{
              paddingVertical: 2,
              paddingHorizontal: 2,
              marginHorizontal: 16,
              borderWidth: 1,
              borderColor: "rgba(255, 255, 255, 0.70)",
              marginBottom: 4,
              minHeight: 72,
              justifyContent: "center",
              alignItems: "center",
            }}
            onPress={() => pickImage()}
          >
            <AntDesign
              name="plus"
              size={24}
              color="rgba(255, 255, 255, 0.56)"
            />
          </Pressable>
        )}
        {selectedImages.length > 0 && (
          <TouchableOpacity
            onPress={clearSelectedImages}
            style={{ marginRight: 16, alignSelf: "flex-end", marginBottom: 4 }}
          >
            <Text className="text-[#ff0000] text-[10px]">Clear Images</Text>
          </TouchableOpacity>
        )}
        {selectedImages.length > 0 && (
          <View
            style={{
              paddingVertical: 2,
              paddingHorizontal: 2,
              marginHorizontal: 16,
              borderWidth: 1,
              borderColor: "rgba(255, 255, 255, 0.70)",
              marginBottom: 20,
              minHeight: 72,
            }}
          >
            {selectedImages.length > 0 ? (
              <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                {selectedImages.map((uri, index) => (
                  <View key={index} style={{ marginLeft: 4, width: "23.5%" }}>
                    <Image
                      source={{ uri: uri.uri }}
                      style={{
                        width: "100%",
                        height: 70,
                        aspectRatio: 10 / 10,
                        borderRadius: 10,
                      }}
                      resizeMode="cover"
                    />
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        )}
        <LoadingModal isVisible={loading} />
      </SafeAreaView>
    </TouchableWithoutFeedback>

    // </ScrollView>
  );
};

export default createReview;
