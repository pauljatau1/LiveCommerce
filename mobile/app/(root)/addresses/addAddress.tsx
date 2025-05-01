import {
  View,
  Text,
  KeyboardAvoidingView,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Platform,
  Dimensions,
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import React, { useEffect, useMemo, useState } from "react";
import { FocusAwareStatusBar } from "@/components/ui/focus-aware-status-bar";
import Entypo from "@expo/vector-icons/Entypo";
import { router, useLocalSearchParams } from "expo-router";
import { Dropdown } from "react-native-element-dropdown";
import getCities from "../../../helpers/country-state-city/lib/getCities";
import getStates from "../../../helpers/country-state-city/lib/getStates";
import { TextInput } from "react-native-gesture-handler";
import { toast } from "@/core/toast";
import axios from "axios";
import { getToken } from "@/store/features/auth/utils";
import LoadingModal from "@/components/global/loading-modal";
import {
  validatePhoneNumber,
  validateZipCode,
  validateEmail,
} from "../../../helpers/helpers";

const { width, height } = Dimensions.get("window");
const addressTypes = [{ name: "home" }, { name: "work" }, { name: "other" }];
const AddAddress = () => {
  const { prevRoute } = useLocalSearchParams();
  const states = useMemo(() => getStates("nigeria"), []);
  const [cities, setCities] = useState<any>(null);
  const [state, setState] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [firstname, setFirstname] = useState<string>("");
  const [lastname, setLastname] = useState<string>("");
  const [address1, setAddress1] = useState<string>("");
  const [address2, setAddress2] = useState<string>("");
  const [zipCode, setzipCode] = useState<string>("");
  const [zipCodeError, setzipCodeError] = useState<string>("");

  const [phone, setPhone] = useState<string>("");
  const [phoneError, setPhoneError] = useState<string>("");

  const [email, setEmail] = useState<string>("");
  const [emailError, setEmailError] = useState<string>("");

  const [addressType, setAddressType] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handlePhoneChange = (value: string) => {
    if (value.length > 0) {
      if (validatePhoneNumber(value)) {
        setPhoneError("");
        setPhone(value);
      } else {
        setPhoneError("invalid phone number");

        setPhone(value);
      }
    } else setPhoneError("");
  };
  const handleEmailChange = (value: string) => {
    if (value.length > 0) {
      if (validateEmail(value)) {
        setEmailError("");
        setEmail(value);
      } else {
        setEmailError("invalid email");

        setEmail(value);
      }
    } else setEmailError("");
  };
  const handleZipCodeChange = (value: string) => {
    if (value.length > 0) {
      if (validateZipCode(value)) {
        setzipCodeError("");
        setzipCode(value);
      } else {
        setzipCodeError("invalid zipcode");
        setzipCode(value);
      }
    } else setzipCodeError("");
  };

  const handleAddAddress = async () => {
    if (loading) {
      return;
    }
    if (!addressType || !city || !address1 || !zipCode || !state) {
      return toast.info("enter empty fields");
    }
    if (phoneError || emailError || zipCodeError) {
      return toast.info("enter correct fields");
    }
    setLoading(true);
    try {
      const token = await getToken();
      const payload = {
        addressType,
        country: "NG",
        city,
        addressLine1: address1,
        addressLine2: address2,
        zipCode,
        state: state.split("_")[1],
      };
      const config = {
        method: "POST",
        url: process.env.EXPO_PUBLIC_API_URL + `api/buyer/addresses`,
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        data: payload,
      };

      const response = await axios(config);
      console.log("address creation Response ==> ", response.data);
      if (response.status == 201) {
        setLoading(false);

        toast.success("Address added successfully");
        setTimeout(() => {
          if (prevRoute && prevRoute == "checkout") {
            return router.replace("/checkout/checkout");
          }
          router.back();
        }, 2000);
      }
    } catch (e) {
      console.log("cant create address", e);
      toast.error("unable to add address");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        // keyboardVerticalOffset={Platform.select({ ios: 0, android: 60 })}
        style={{ flex: 1, backgroundColor: "#121212" }}
      >
        <FocusAwareStatusBar
          barStyle="light-content"
          backgroundColor="#121212"
        />

        <SafeAreaView style={{ flex: 1, backgroundColor: "#121212" }}>
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              paddingHorizontal: 12,
              paddingVertical: 20,
              marginBottom: 8,
              marginTop: 4,
              position: "relative",
            }}
          >
            <TouchableOpacity
              style={{ position: "absolute", left: 12 }}
              onPress={() => {
                router.back();
              }}
            >
              <Entypo
                name="chevron-left"
                size={24}
                color="rgba(204, 204, 204, 0.8)"
              />
            </TouchableOpacity>
            <Text
              style={{
                color: "white",
                fontFamily: "LexendDeca-Medium",
                fontSize: 20,
              }}
            >
              Add Address
            </Text>
          </View>

          {/* Form */}
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingBottom: 100,
            }}
            showsVerticalScrollIndicator={false}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={{ gap: 20 }}>
                {/* Name Fields */}
                {/* <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <View style={styles.inputSection}>
                    <Text style={styles.textLabel}>First Name</Text>
                    <View style={[{ flexShrink: 1 }, styles.inputContainer]}>
                      <TextInput
                        placeholder="First Name"
                        placeholderTextColor={"rgba(130, 130, 130, 0.8)"}
                        style={styles.textInput}
                        onChangeText={setFirstname}
                      />
                    </View>
                  </View>

                  <View style={styles.inputSection}>
                    <Text style={styles.textLabel}>Last Name</Text>
                    <View style={[{ flexShrink: 1 }, styles.inputContainer]}>
                      <TextInput
                        placeholder="Last Name"
                        style={styles.textInput}
                        onChangeText={setLastname}
                      />
                    </View>
                  </View>
                </View> */}

                {/* State Dropdown */}
                <View style={styles.inputSection}>
                  <Text style={styles.textLabel}>State</Text>
                  <Dropdown
                    style={styles.dropdown}
                    placeholderStyle={styles.placeholderStyle}
                    selectedTextStyle={styles.selectedTextStyle}
                    inputSearchStyle={styles.inputSearchStyle}
                    itemTextStyle={styles.itemTextStyle}
                    data={states}
                    search
                    labelField="name"
                    valueField="name"
                    placeholder="Select State"
                    searchPlaceholder="Search..."
                    onChange={(item) => {
                      setState(item.slug);
                      setCities(getCities(item.slug));
                    }}
                  />
                </View>

                {/* City Dropdown */}
                {cities && (
                  <View style={styles.inputSection}>
                    <Text style={styles.textLabel}>City</Text>
                    <Dropdown
                      style={styles.dropdown}
                      placeholderStyle={styles.placeholderStyle}
                      selectedTextStyle={styles.selectedTextStyle}
                      inputSearchStyle={styles.inputSearchStyle}
                      itemTextStyle={styles.itemTextStyle}
                      data={cities}
                      search
                      labelField="name"
                      valueField="name"
                      placeholder="Select City"
                      searchPlaceholder="Search..."
                      onChange={(item) => setCity(item.name)}
                    />
                  </View>
                )}

                {/* Address Fields */}
                <View style={styles.inputSection}>
                  <Text style={styles.textLabel}>Street Address</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      placeholder="Street Address"
                      placeholderTextColor={"rgba(130, 130, 130, 0.8)"}
                      style={styles.textInput}
                      onChangeText={setAddress1}
                    />
                  </View>
                </View>

                <View style={styles.inputSection}>
                  <Text style={styles.textLabel}>Address Line 2</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      placeholder="Address 2"
                      placeholderTextColor={"rgba(130, 130, 130, 0.8)"}
                      style={styles.textInput}
                      onChangeText={setAddress2}
                    />
                  </View>
                </View>

                <View style={styles.inputSection}>
                  <Text style={styles.textLabel}>Zip Code</Text>
                  <View
                    style={[
                      styles.inputContainer,
                      {
                        borderWidth: 1,
                        borderColor: zipCodeError ? "#ff0a0a" : "#2e2e2e",
                      },
                    ]}
                  >
                    <TextInput
                      placeholder="Zip Code"
                      placeholderTextColor={"rgba(130, 130, 130, 0.8)"}
                      style={styles.textInput}
                      maxLength={6}
                      inputMode="numeric"
                      onChangeText={handleZipCodeChange}
                    />
                    {zipCodeError && (
                      <Text
                        className="text-[10px] font-LexendDecaLight "
                        style={{
                          color: "#ff0a0a",
                          position: "absolute",
                          bottom: -14,
                          left: 8,
                        }}
                      >
                        *{zipCodeError}
                      </Text>
                    )}
                  </View>
                </View>

                {/* <View style={styles.inputSection}>
                  <Text style={styles.textLabel}>Phone Number</Text>

                  <View
                    style={[
                      styles.inputContainer,
                      {
                        borderWidth: 1,
                        borderColor: phoneError ? "#ff0a0a" : "#2e2e2e",
                      },
                    ]}
                  >
                    <TextInput
                      placeholder="Phone"
                      style={styles.textInput}
                      inputMode="numeric"
                      maxLength={11}
                      onChangeText={handlePhoneChange}
                    />
                    {phoneError && (
                      <Text
                        className="text-[10px] font-LexendDecaLight"
                        style={{
                          color: "#ff0a0a",
                          position: "absolute",
                          bottom: -14,
                          left: 8,
                        }}
                      >
                        *{phoneError}
                      </Text>
                    )}
                  </View>
                </View>

                <View style={styles.inputSection}>
                  <Text style={styles.textLabel}>Email</Text>

                  <View
                    style={[
                      styles.inputContainer,
                      {
                        borderWidth: 1,
                        borderColor: emailError ? "#ff0a0a" : "#2e2e2e",
                      },
                    ]}
                  >
                    <TextInput
                      placeholder="Email"
                      style={styles.textInput}
                      inputMode="email"
                      onChangeText={handleEmailChange}
                    />
                    {emailError && (
                      <Text
                        className="text-[10px] font-LexendDecaLight"
                        style={{
                          color: "#ff0a0a",
                          position: "absolute",
                          bottom: -14,
                          left: 8,
                        }}
                      >
                        *{emailError}
                      </Text>
                    )}
                  </View>
                </View> */}

                <View style={styles.inputSection}>
                  <Text style={styles.textLabel}>Address Type</Text>
                  <Dropdown
                    search={false}
                    style={styles.dropdown}
                    placeholderStyle={styles.placeholderStyle}
                    selectedTextStyle={styles.selectedTextStyle}
                    inputSearchStyle={styles.inputSearchStyle}
                    itemTextStyle={styles.itemTextStyle}
                    data={addressTypes}
                    labelField="name"
                    valueField="name"
                    placeholder="Select Type"
                    searchPlaceholder="Search..."
                    onChange={(item) => setAddressType(item.name)}
                  />
                </View>
              </View>
            </TouchableWithoutFeedback>
          </ScrollView>

          <View
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              padding: 16,
              paddingBottom: 24,
              width: "100%",
              backgroundColor: "#121212",
            }}
          >
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddAddress}
            >
              <Text style={styles.addButtonText}>Add Address</Text>
            </TouchableOpacity>
          </View>
          <LoadingModal isVisible={loading} />

          {/* Add Address Button */}
        </SafeAreaView>
      </KeyboardAvoidingView>
    </>
  );
};

const styles = StyleSheet.create({
  dropdown: {
    height: 50,
    borderColor: "gray",
    borderWidth: 0.5,
    borderRadius: 8,
    paddingHorizontal: 20,
    backgroundColor: "#2e2e2e",
  },
  inputSection: {
    flexBasis: "100%",
    flexShrink: 1,
    gap: 6,
  },
  inputContainer: {
    padding: 16,
    backgroundColor: "#2e2e2e",
    borderRadius: 8,
    position: "relative",
    // marginBottom: 20,
    flexBasis: "100%",
  },
  textLabel: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "LexendDeca-Medium",
    opacity: 0.8,
  },
  textInput: {
    fontSize: 13,
    color: "#fff",
    paddingVertical: 0,
    fontFamily: "LexendDeca",
  },
  placeholderStyle: {
    fontSize: 13,
    color: "rgba(130, 130, 130, 0.8)",
    marginVertical: 10,
    height: 20,
    fontFamily: "LexendDeca",
  },
  selectedTextStyle: {
    fontSize: 12,
    color: "#fff",
    paddingVertical: 5,
    height: 30,
    top: 1.5,
    fontFamily: "LexendDeca",
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 12,
    color: "#00000090",
  },
  itemTextStyle: {
    color: "#00000070",
    fontSize: 12,
    fontFamily: "LexendDeca",
  },
  addButton: {
    backgroundColor: "#16783A",
    padding: 12,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonText: {
    color: "white",
    fontSize: 16,
    fontFamily: "LexendDeca-Medium",
  },
});

export default AddAddress;
