import {
  View,
  Text,
  SafeAreaView,
  Dimensions,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ScrollView,
  Pressable,
} from "react-native";
import React, { memo, useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { FocusAwareStatusBar } from "@/components/ui/focus-aware-status-bar";
import Entypo from "@expo/vector-icons/Entypo";
import { Image } from "expo-image";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import * as ImagePicker from "expo-image-picker";
import { getToken, getUser, setUser } from "@/store/features/auth/utils";
import axios from "axios";
import BottomSheet from "@/components/global/bottom-sheet";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import LoadingModal from "@/components/global/loading-modal";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");
const offset = 20;

const EditProfile = () => {
  const insets = Platform.OS == "ios" ? useSafeAreaInsets() : { top: 0 };
  const { avatar, username, bio, email, phoneNumber, firstName, lastName } =
    useLocalSearchParams();

  const [editUsernameVal, setEditUsernameVal] = useState<string>(
    username?.toString(),
  );
  const [editFirstNameVal, setEditFirstNameVal] = useState<string>(
    firstName?.toString(),
  );
  const [editLastNameVal, setEditLastNameVal] = useState<string>(
    lastName?.toString(),
  );
  const [editBioVal, setEditBioVal] = useState<string>(bio?.toString());
  const [editEmailVal, setEditEmailVal] = useState<string>(email?.toString());
  const [editPhoneVal, setEditPhoneVal] = useState<string>(
    phoneNumber?.toString(),
  );
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const [selectedMedia, setSelectedMedia] = useState<any[]>(
    avatar
      ? [
          {
            uri: avatar,
          },
        ]
      : [],
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [showPasswordValidation, setShowPasswordValidation] =
    useState<boolean>(false);
  const [hasChanged, setHasChanged] = useState<boolean>(false);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      allowsMultipleSelection: false,
      base64: false,
    });

    if (!result.canceled && result.assets.length > 0) {
      const newImages = result.assets.map((asset) => ({
        uri: asset.uri,
        name: `media_${Date.now()}.${asset.mimeType?.split("/")[1] || "application/octet-stream"}`,
        mimeType: asset.mimeType,
      }));
      const remainingSlots = 4 - selectedMedia.length;
      const imagesToAdd = newImages.slice(0, remainingSlots);

      setSelectedMedia(imagesToAdd);
      setHasChanged(true);
    }
  };

  const updateAvatar = async () => {
    try {
      setLoading(true);

      const token = await getToken();
      const formData = new FormData();
      selectedMedia.forEach((image, index) => {
        formData.append(`avatar`, image);
      });
      const response = await axios.put(
        process.env.EXPO_PUBLIC_API_URL + "api/buyer/profile/avatar",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: "Bearer " + token,
          },
        },
      );
      const user = await getUser();
      console.log(response.data);

      await setUser({
        ...user,
        profileImage: { url: response.data.buyer?.profileImage?.url },
      });
      updateProfile();
    } catch (e) {
      console.log("error updating avatar", e);
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    try {
      const token = await getToken();
      const payload = {
        username: editUsernameVal,
        phoneNumber: editPhoneVal,
        bio: editBioVal,
        firstName: editFirstNameVal,
        lastName: editLastNameVal,
      };
      const response = await axios.put(
        process.env.EXPO_PUBLIC_API_URL + "api/buyer/profile/update",
        payload,
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        },
      );
      router.back();

      setLoading(false);
    } catch (e) {
      console.log(e);
    }
  };

  const handleUpdateProfile = () => {
    setShowPasswordValidation(false);
    if (hasChanged) {
      updateAvatar();
    } else {
      updateProfile();
    }
  };

  useEffect(() => {
    const showSubscription = Keyboard.addListener("keyboardDidShow", () => {
      setKeyboardOffset(offset);
    });

    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardOffset(0);
    });
  }, []);

  return (
    <View
      className="h-full flex-1 bg-[#121212] "
      style={{ minHeight: height, paddingTop: insets.top }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.select({
          ios: 0,
          android: keyboardOffset,
        })}
        style={{ flex: 1 }}
      >
        <FocusAwareStatusBar
          barStyle="light-content"
          backgroundColor="#121212"
        />

        <View
          style={{
            // height: 0,
            paddingVertical: 20,
            paddingHorizontal: 16,
            backgroundColor: "#121212",
            zIndex: 3,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View className="flex-row items-center gap-[18px]">
            <TouchableOpacity className="" onPress={() => router.back()}>
              <Entypo
                name="chevron-left"
                size={24}
                color="rgba(204, 204, 204, 0.8)"
              />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Edit Profile</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.mainSection}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Pressable style={{ marginBottom: 40 }} onPress={pickImage}>
            <Image
              source={
                selectedMedia?.length > 0
                  ? { uri: selectedMedia?.[0]?.uri }
                  : require("../../../assets/icons/profile.jpg")
              }
              style={styles.avatar}
              contentFit="cover"
            />

            <View style={styles.editBtn}>
              <FontAwesome6 name="edit" size={14} color="#ccc" />
            </View>
            <Pressable onPress={() => setSelectedMedia([])}>
              <Text style={styles.removeImageBtn}>Remove</Text>
            </Pressable>
          </Pressable>

          <View style={{ width: "100%" }}>
            <View style={styles.editSingleSection}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={styles.input}
                placeholder="Username"
                value={editUsernameVal}
                onChangeText={(text) => setEditUsernameVal(text)}
              />
            </View>
            <View style={styles.editSingleSection}>
              <Text style={styles.label}>FirstName</Text>
              <TextInput
                style={styles.input}
                placeholder="FirstName"
                value={editFirstNameVal}
                onChangeText={(text) => setEditFirstNameVal(text)}
              />
            </View>
            <View style={styles.editSingleSection}>
              <Text style={styles.label}>LastName</Text>
              <TextInput
                style={styles.input}
                placeholder="LastName"
                value={editLastNameVal}
                onChangeText={(text) => setEditLastNameVal(text)}
              />
            </View>
            <View style={styles.editSingleSection}>
              <Text style={styles.label}>Bio</Text>
              <TextInput
                style={styles.input}
                placeholder="Bio"
                value={editBioVal}
                onChangeText={(text) => setEditBioVal(text)}
                multiline
                maxLength={150}
                numberOfLines={4}
              />
            </View>
            <View style={styles.editSingleSection}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, { opacity: 0.3 }]}
                placeholder="Email"
                value={editEmailVal}
                onChangeText={(text) => setEditEmailVal(text)}
                readOnly
              />
            </View>
            <View style={styles.editSingleSection}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={[styles.input, { opacity: 0.3 }]}
                placeholder="Phone Number"
                value={editPhoneVal}
                onChangeText={(text) => setEditPhoneVal(text)}
                readOnly
              />
            </View>
          </View>

          <Pressable
            style={styles.updateBtn}
            onPress={() => setShowPasswordValidation(true)}
          >
            <Text style={styles.updateBtnText}>Update</Text>
          </Pressable>
        </ScrollView>
        <LoadingModal isVisible={loading} />

        <BottomSheet
          bgColor="#121212"
          childrenStyle="!px-[11px]"
          showCloseIcon={false}
          show={showPasswordValidation}
          // snapPoints={["40%"]}
          enableDynamicSizing={true}
          onRequestClose={() => setShowPasswordValidation(false)}
          keyboardBehavior="interactive"
        >
          <ValidationSheet handleUpdateProfile={handleUpdateProfile} />
        </BottomSheet>
      </KeyboardAvoidingView>
    </View>
  );
};

const ValidationSheet = memo(
  ({ handleUpdateProfile }: { handleUpdateProfile: any }) => {
    const [password, setPassword] = useState<string>("");
    return (
      <View style={{ paddingVertical: 20 }}>
        <View className="w-[100%] rounded-[22px] py-[12px] px-[12px] bg-[#2e2e2e]">
          <BottomSheetTextInput
            placeholder="Enter Password"
            placeholderTextColor={"#ccc"}
            style={{
              fontSize: 15,
              color: "#fff",
              padding: 0,
            }}
            returnKeyType="send"
            value={password}
            onChangeText={(text) => setPassword(text)}
          />
        </View>
        <Pressable
          style={{
            paddingVertical: 12,
            width: "100%",
            borderRadius: 30,
            backgroundColor: "#16783A",
            justifyContent: "center",
            alignItems: "center",
            marginTop: 20,
          }}
          onPress={handleUpdateProfile}
        >
          <Text style={styles.updateBtnText}>Submit</Text>
        </Pressable>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  headerTitle: {
    fontSize: 14,
    fontFamily: "LexendDeca",
    color: "#ccc",
  },
  mainSection: {
    paddingVertical: 30,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  avatar: {
    width: 160,
    height: 160,
    borderRadius: 160,
  },
  editBtn: {
    position: "absolute",
    right: 10,
    bottom: 30,
  },
  editSingleSection: {
    width: "100%",
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontFamily: "LexendDeca",
    color: "#ccc",
    marginBottom: 4,
  },
  input: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: "LexendDeca",
    color: "#fff",
    backgroundColor: "#2e2e2e",
    borderRadius: 8,
  },
  updateBtn: {
    paddingVertical: 12,
    width: "100%",
    borderRadius: 30,
    backgroundColor: "#16783A",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 30,
  },
  updateBtnText: {
    fontSize: 14,
    color: "#fff",
    fontFamily: "LexendDeca",
  },
  removeImageBtn: {
    color: "red",
    fontSize: 10,
    fontFamily: "LexendDeca",
    textAlign: "center",
    marginTop: 20,
    opacity: 0.6,
  },
});

export default EditProfile;
