import {
  View,
  Text,
  Platform,
  TouchableOpacity,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  Dimensions,
  Keyboard,
  Alert,
  Linking,
} from "react-native";
import React, { useEffect, useState } from "react";
import {
  router,
  useGlobalSearchParams,
  useLocalSearchParams,
} from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AntDesign, Entypo, MaterialIcons } from "@expo/vector-icons";
import { useGetSingleProductQuery } from "@/services/products";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { getToken, getUser } from "@/store/features/auth/utils";
import axios from "axios";
import BottomSheet from "@/components/global/bottom-sheet";
import AddressSheet from "./addressSheet";
import ReturnReasonSheet from "./returnReasonSheet";
import ResolutionOptionSheet from "./resolutionOptionSheet";
import LoadingModal from "@/components/global/loading-modal";
import { toast } from "@/core/toast";
import SafeAreaView from "@/components/global/safeareaview/SafeAreaView";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";

const { width, height } = Dimensions.get("window");
const offset = 20;

const resolutionEnum = {
  "Return item & Refund": "refund",
  "Return & Replace item": "replacement",
} as any;

const Returns = () => {
  const insets = useSafeAreaInsets();
  const { productList, orderId } = useLocalSearchParams();

  const [products, setProducts] = useState<any[]>([]);
  //   const {
  //     data: product,
  //     isLoading,
  //     isError,
  //   } = useGetSingleProductQuery(productId.toString());
  const [showAddressSheet, setShowAddressSheet] = useState<boolean>(false);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [userInfoLoading, setUserInfoLoading] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [comment, setComment] = useState<string>("");
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const [selectedMedia, setSelectedMedia] = useState<any[]>([]);
  const [refundReason, setRefundReason] = useState<string>("");
  const [refundOption, setRefundOption] = useState<string>("");
  const [showReasonSheet, setShowReasonSheet] = useState<boolean>(false);
  const [showOptionSheet, setShowOptionSheet] = useState<boolean>(false);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);

  const selectProduct = (prod: any) => {
    if (selectedProducts.find((sp) => sp.id == prod.id)) {
      return setSelectedProducts(
        selectedProducts.filter((sp) => sp.id != prod.id),
      );
    }

    setSelectedProducts([...selectedProducts, prod]);
  };

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
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      allowsMultipleSelection: false,
      allowsEditing: false,
      base64: false,
    });

    if (!result.canceled && result.assets.length > 0) {
      const newImages = result.assets.map((asset) => ({
        uri: asset.uri,
        name: `media_${Date.now()}.${asset.mimeType?.split("/")[1] || "application/octet-stream"}`,
        type: asset.mimeType,
      }));
      const remainingSlots = 4 - selectedMedia.length;
      const imagesToAdd = newImages.slice(0, remainingSlots);

      setSelectedMedia(imagesToAdd);
    }
  };

  const getAddresses = async () => {
    try {
      const userInfo = await getUser();
      setUser(userInfo);
      const token = await getToken();
      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL + "api/buyer/addresses",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setAddresses(response.data);
      if (response.data.length > 0) {
        const delivery_address = {
          first_name: userInfo.firstName,
          last_name: userInfo.lastName,
          email: userInfo.email,
          phone: userInfo.phoneNumber,
          line1: response.data[0].addressLine1,
          line2: response.data[0].addressLine2
            ? response.data[0].addressLine2
            : response.data[0].addressLine1,
          city: response.data[0].city,
          state: response.data[0].state,
          country: response.data[0].country,
          zip: response.data[0].zipCode,
        };

        setSelectedAddress(delivery_address);
      }
    } catch (e) {
      console.log("error fetching buyer addresses ", e);
    } finally {
      setUserInfoLoading(false);
    }
  };

  const handleSelectAddress = (address: any) => {
    const delivery_address = {
      first_name: user.firstName,
      last_name: user.lastName,
      email: user.email,
      phone: user.phoneNumber,
      line1: address.addressLine1,
      line2: address.addressLine2 ? address.addressLine2 : address.addressLine1,
      city: address.city,
      state: address.state,
      country: address.country,
      zip: address.zipCode,
    };
    setSelectedAddress(delivery_address);
    setShowAddressSheet(false);
  };

  const handleCompleteRequest = async () => {
    if (selectedProducts?.length < 1) {
      return toast.info("Select at least 1 product to refund");
    }
    if (!refundReason || !refundOption || !selectedAddress?.country) {
      return toast.info("Enter all required fields");
    }
    setLoading(true);
    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append("orderId", orderId?.toString());
      formData.append(
        `items`,
        JSON.stringify(
          selectedProducts?.map((prod: any) => {
            return {
              productId: prod.id,
              quantity: prod.quantity,
              reason: refundReason,
            };
          }),
        ),
      );
      formData.append("description", comment);
      formData.append("preferredResolution", resolutionEnum[refundOption]);

      selectedMedia.forEach((image, index) => {
        formData.append(`evidence`, image);
      });

      console.log(formData);

      const response = await axios.post(
        process.env.EXPO_PUBLIC_API_URL + `api/returns/request`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      router.replace(`/(root)/orders/${orderId}`);
    } catch (e: any) {
      console.log("error submitting return request ", e);
      return toast.error(e?.response?.data?.message || "Refund request failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getAddresses();

    const showSubscription = Keyboard.addListener("keyboardDidShow", () => {
      setKeyboardOffset(offset);
    });

    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardOffset(0);
    });
  }, []);

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: "#121212",
      }}
    >
      <KeyboardAvoidingView
        behavior={"padding"}
        keyboardVerticalOffset={Platform.select({
          ios: 0,
          android: keyboardOffset,
        })}
        style={{ flex: 1 }}
      >
        <View className="flex flex-row items-center justify-center gap-[10px] px-[12px] py-[17px] mb-[8px] mt-4 relative">
          <TouchableOpacity
            className="absolute left-[18px]"
            onPress={() => router.back()}
          >
            <Entypo
              name="chevron-left"
              size={24}
              color="rgba(204, 204, 204, 0.8)"
            />
          </TouchableOpacity>

          <Text className="text-white font-LexendDecaMedium text-[24px]">
            Return Request
          </Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text className="text-white font-LexendDecaMedium text-[12px] mb-[15px] mx-[16px]">
            Selected Item
          </Text>

          <View className="gap-[24px] mb-[24px] mx-[16px]">
            {JSON.parse(productList?.toString()).map(
              (prod: any, index: number) => (
                <TouchableOpacity
                  className="flex-row gap-[10px]"
                  key={index}
                  onPress={() => selectProduct(prod)}
                  activeOpacity={0.5}
                >
                  <Image
                    source={{ uri: prod.image }}
                    style={{ width: 115, height: 115 }}
                    contentFit="cover"
                  />
                  <View className="shrink gap-[8px]">
                    <Text className="text-white font-LexendDecaMedium text-[12px]">
                      {prod?.name}
                    </Text>
                    <Text className="text-white font-LexendDecaLight text-[10px] whitespace-normal">
                      {prod?.description?.slice(0, 100)}
                    </Text>
                    <View className="flex-row items-center justify-between gap-[11px]">
                      <Text className="text-[14px] text-[#F2F2F2] font-LexendDecaMedium shrink">
                        Price: N{prod.price.toLocaleString()}
                      </Text>
                      <Text className="text-white text-[14px] font-LexendDecaMedium">
                        Qty: {prod.quantity}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 20,
                      borderColor: "#ccc",
                      borderWidth: 1,
                      justifyContent: "center",
                      alignItems: "center",
                      marginLeft: "auto",
                    }}
                  >
                    {selectedProducts.find((sp: any) => sp.id == prod.id) && (
                      <View
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: 12,
                          backgroundColor: "#ccc",
                        }}
                      ></View>
                    )}
                  </View>
                </TouchableOpacity>
              ),
            )}
          </View>

          <View
            className="px-[16px]"
            style={{
              borderBottomColor: "rgba(204, 204, 204, 0.25)",
              borderBottomWidth: 0.5,
            }}
          >
            <Text className="text-white font-LexendDecaMedium text-[16px] mb-[12px]">
              Return Details
            </Text>
            <Pressable
              className="flex-row items-center justify-between gap-[10px] mb-[24px] rounded-[5.5px] px-[16px] py-[10px]"
              style={{
                borderColor: "#027CEC",
                borderWidth: 1,
              }}
            >
              <View className="flex-row items-center justify-between gap-[10px] ">
                <MaterialIcons name="info" size={18} color="#027CEC" />
                <Text className="text-[#027CEC] font-LexendDeca text-[10px]">
                  Change of mind is not available on returns
                </Text>
              </View>
              {/* <Entypo name="chevron-right" size={16} color="#027CEC" /> */}
            </Pressable>

            <View className="flex-row items-center justify-between mb-[16px]">
              <Text className="text-white font-LexendDecaMedium text-[14px]">
                Return Reason <Text className="text-[#f00]">*</Text>
              </Text>
              <TouchableOpacity onPress={() => setShowReasonSheet(true)}>
                {refundReason ? (
                  <Text className="text-[#fff] font-LexendDecaMedium text-[14px]">
                    {refundReason}
                  </Text>
                ) : (
                  <Text className="text-[#ccc] opacity-25 font-LexendDecaMedium text-[14px]">
                    Please Select
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* <View className="flex-row items-center justify-between mb-[16px]">
              <Text className="text-white font-LexendDecaMedium text-[14px]">
                Refund <Text className="text-[#f00]">*</Text>
              </Text>
              <TouchableOpacity>
                <Text className="text-[#ccc] opacity-25 font-LexendDecaMedium text-[14px]">
                  Please Select
                </Text>
              </TouchableOpacity>
            </View> */}
          </View>

          <View className="px-[16px] pt-[24px]">
            <Text className="text-white font-LexendDecaMedium text-[16px] mb-[12px]">
              Return Method
            </Text>

            <View className="flex-row items-center justify-between mb-[12px]">
              <Text className="text-white font-LexendDecaMedium text-[12px]">
                Package Location <Text className="text-[#f00]">*</Text>
              </Text>
            </View>

            <TouchableOpacity
              className="p-[20px] rounded-[16px] flex-row items-center justify-between"
              style={{ backgroundColor: "rgba(41, 41, 41, 0.81)" }}
              onPress={() => setShowAddressSheet(true)}
            >
              <View className="flex-row gap-[16px] shrink">
                <View className="w-[23px] h-[23px] rounded-full bg-[#B190B6] flex-row items-center justify-center">
                  <Text className="text-white text-[9px]">
                    {user?.firstName?.split("")[0]}
                  </Text>
                  <Text className="text-white text-[9px]">
                    {user?.lastName?.split("")[0]}
                  </Text>
                </View>
                <View className="gap-[18px] shrink">
                  <Text className="text-[#ccc] text-[16px] font-LexendDecaMedium">
                    {user?.firstName + " " + user?.lastName}
                  </Text>
                  {selectedAddress ? (
                    <View>
                      <Text className="text-[#ccc] text-[10px] font-LexendDecaMedium mb-[4px]">
                        {selectedAddress && selectedAddress?.line1}
                      </Text>
                      <Text className="text-[#ccc] text-[10px] font-LexendDecaMedium">
                        Country: {selectedAddress && selectedAddress?.country}
                      </Text>
                    </View>
                  ) : (
                    <Text className="text-[#ccc] text-[10px] font-LexendDecaMedium">
                      Click to add address
                    </Text>
                  )}
                </View>
              </View>
              <View>
                <Entypo
                  name="chevron-right"
                  size={16}
                  color="rgba(204, 204, 204, 0.8)"
                />
              </View>
            </TouchableOpacity>
          </View>

          <View className="px-[16px] pt-[24px] mb-[30px]">
            <View className="flex-row items-center justify-between mb-[12px]">
              <Text className="text-white font-LexendDecaMedium text-[14px]">
                Resolution Option <Text className="text-[#f00]">*</Text>
              </Text>
              <TouchableOpacity onPress={() => setShowOptionSheet(true)}>
                {refundOption ? (
                  <Text className="text-[#fff] font-LexendDecaMedium text-[14px]">
                    {refundOption}
                  </Text>
                ) : (
                  <Text className="text-[#ccc] opacity-25 font-LexendDecaMedium text-[14px]">
                    Please Select
                  </Text>
                )}
              </TouchableOpacity>
            </View>
            <View>
              <Text className="text-white font-LexendDecaMedium text-[12px] mb-[12px]">
                Comments
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Type Here"
                value={comment}
                onChangeText={(text) => setComment(text)}
                multiline
                maxLength={256}
                numberOfLines={4}
              />

              {selectedMedia?.length > 0 ? (
                <View className="justify-center items-center gap-[12px] mt-[24px]">
                  <Image
                    source={{ uri: selectedMedia[0]?.uri }}
                    style={styles.selectedMedia}
                    contentFit="cover"
                  />
                  <Pressable onPress={() => setSelectedMedia([])}>
                    <Text className="text-red-600 font-LexendDeca text-[12px]">
                      remove
                    </Text>
                  </Pressable>
                </View>
              ) : (
                <View>
                  <Pressable
                    className="w-full py-[16px] self-center mt-[24px] mb-[12px] rounded-[8px] border-dashed border-[1px] border-[#8A898F] flex-row gap-[20px] items-center justify-center"
                    onPress={() => pickImage()}
                  >
                    <AntDesign name="plus" size={24} color="#8A898F" />
                    <Text className="text-[#8A898F] text-[15px] ">
                      Upload Image
                    </Text>
                  </Pressable>
                  <Text className="text-[#8A898F] text-[10px] font-LexendDeca self-center">
                    Optional *
                  </Text>
                </View>
              )}
            </View>
          </View>

          <TouchableOpacity
            className=" items-center justify-center p-[12px] bg-[#16783A] rounded-[31px] mx-[16px] mb-[20px]"
            onPress={handleCompleteRequest}
          >
            <Text className="text-white text-[14px] font-LexendDeca">
              Submit
            </Text>
          </TouchableOpacity>
        </ScrollView>

        <BottomSheet
          bgColor="#3A3A3A"
          childrenStyle="!px-[11px]"
          showCloseIcon={false}
          title=""
          show={showAddressSheet}
          titleColor="!text-white"
          onRequestClose={() => setShowAddressSheet(false)}
          keyboardBehavior="interactive"
        >
          <AddressSheet
            addresses={addresses}
            closeSheet={() => setShowAddressSheet(false)}
            selectAddress={handleSelectAddress}
          />
        </BottomSheet>

        <BottomSheet
          bgColor="#121212"
          childrenStyle="!px-[0px]"
          showCloseIcon={false}
          show={showReasonSheet}
          enableDynamicSizing={true}
          onRequestClose={() => setShowReasonSheet(false)}
          keyboardBehavior="interactive"
        >
          <ReturnReasonSheet
            setRefundReason={(reason: any) => setRefundReason(reason)}
            closeSheet={() => setShowReasonSheet(false)}
          />
        </BottomSheet>

        <BottomSheet
          bgColor="#121212"
          childrenStyle="!px-[0px]"
          showCloseIcon={false}
          show={showOptionSheet}
          snapPoints={["80%"]}
          enableDynamicSizing={true}
          onRequestClose={() => setShowOptionSheet(false)}
          keyboardBehavior="interactive"
        >
          <ResolutionOptionSheet
            setResolutionOption={(reason: any) => setRefundOption(reason)}
            closeSheet={() => setShowOptionSheet(false)}
          />
        </BottomSheet>
        <LoadingModal isVisible={loading} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  input: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: "LexendDeca",
    color: "#fff",
    backgroundColor: "#2e2e2e",
    borderRadius: 8,
  },
  selectedMedia: {
    width: 150,
    height: 150,
    borderRadius: 8,
  },
});

export default Returns;
