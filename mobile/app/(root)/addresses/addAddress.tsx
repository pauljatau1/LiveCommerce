import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
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
import {
  validatePhoneNumber,
  validateZipCode,
  validateEmail,
  normalizeNGNNumber,
} from "../../../helpers/helpers";
import SafeAreaView from "@/components/global/safeareaview/SafeAreaView";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import FormInput from "@/components/Primitives/Inputs/formInput";
import SubmitButton from "@/components/Primitives/Buttons/submitButton";

const addressTypes = [{ name: "home" }, { name: "work" }, { name: "other" }];
const AddAddress = () => {
  const { prevRoute, address } = useLocalSearchParams();
  const parsedAddress = useMemo(() => {
    if (address) return JSON.parse(address?.toString());
    return null;
  }, [address]);

  const insets = useSafeAreaInsets();
  // const states = useMemo(() => getStates("nigeria"), []);
  const [pageLoading, setPageLoading] = useState<boolean>(true);
  const [cities, setCities] = useState<any[] | null>(null);
  const [states, setStates] = useState<any[] | null>(null);
  const [state, setState] = useState<string>(parsedAddress?.state ?? "");
  const [city, setCity] = useState<string>(parsedAddress?.city ?? "");
  const [firstname, setFirstname] = useState<string>(
    parsedAddress?.firstName ?? "",
  );
  const [lastname, setLastname] = useState<string>(
    parsedAddress?.lastName ?? "",
  );
  const [address1, setAddress1] = useState<string>(
    parsedAddress?.addressLine1 ?? "",
  );
  const [address2, setAddress2] = useState<string>(
    parsedAddress?.addressLine2 ?? "",
  );
  const [zipCode, setzipCode] = useState<string>(parsedAddress?.zipCode ?? "");
  const [zipCodeError, setzipCodeError] = useState<string>("");

  const [phone, setPhone] = useState<string>(
    normalizeNGNNumber(parsedAddress?.phoneNumber) ?? "",
  );
  const [phoneError, setPhoneError] = useState<string>("");

  const [email, setEmail] = useState<string>("");
  const [emailError, setEmailError] = useState<string>("");

  const [addressType, setAddressType] = useState<string>(
    parsedAddress?.addressType ?? "",
  );
  const [loading, setLoading] = useState<boolean>(false);

  const getTerminalStates = async () => {
    try {
      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL + "api/v2/orders/states",
      );

      const terminalStates = response?.data?.data?.map((states: any) => ({
        name: states?.name?.toLowerCase(),
        isoCode: states?.isoCode,
      }));
      setStates(terminalStates);
    } catch (e) {
      console.log("error getting states from terminal", e);
      toast.error("There was a problem fetching location information");
    } finally {
      setPageLoading(false);
    }
  };

  const getTerminalCities = async (stateCode: string) => {
    try {
      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL + `api/v2/orders/cities/${stateCode}`,
      );

      const cities = response?.data?.data?.map((cities: any) => ({
        name: cities?.name,
        stateCode: cities?.stateCode,
      }));
      setCities(cities);
    } catch (e) {
      console.log(
        "error getting cities from terminal for state " + stateCode,
        e,
      );
    }
  };

  const handlePhoneChange = (value: string) => {
    if (value?.length > 0) {
      if (validatePhoneNumber(value)) {
        setPhoneError("");
      } else {
        if (value?.length < 11) {
          setPhoneError("Phone number must be 11 digits long e.g 08000000000");
        } else setPhoneError("invalid phone number");
      }
    } else {
      setPhoneError("");
    }
    setPhone(value);
  };
  const handleEmailChange = (value: string) => {
    if (value?.length > 0) {
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
    if (value?.length > 0) {
      if (validateZipCode(value)) {
        setzipCodeError("");
      } else {
        setzipCodeError("invalid zipcode");
      }
    } else {
      setzipCodeError("");
    }
    setzipCode(value);
  };

  const handleAddAddress = async () => {
    if (loading) {
      return;
    }
    if (!city || !address1 || !zipCode || !state) {
      return toast.info("enter empty fields");
    }
    if (phoneError || emailError || zipCodeError) {
      return toast.info("enter correct fields");
    }
    setLoading(true);
    try {
      const token = await getToken();
      const payload = {
        country: "NG",
        city,
        addressLine1: address1,
        addressLine2: address2,
        zipCode,
        state: state?.includes("_") ? state.split("_")[1] : state,
        firstName: firstname,
        lastName: lastname,
        phoneNumber: phone,
        addressType: "home",
      };
      const config = {
        method: address ? "PUT" : "POST",
        url:
          process.env.EXPO_PUBLIC_API_URL +
          `api/v2/buyers/addresses${address ? "/" + parsedAddress._id : ""}`,
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        data: payload,
      };

      const response = await axios(config);
      console.log("address creation Response ==> ", response.data);
      if (response.status == 201 || response.status == 200) {
        setLoading(false);

        toast.customSuccess({
          message: "Address added successfully",
          statusBarHeight: insets.top,
        });
        setTimeout(() => {
          if (prevRoute && prevRoute == "checkout") {
            return router.replace("/checkout/checkout");
          }
          router.back();
        }, 1000);
      }
    } catch (e: any) {
      console.log("cant create address", e?.response?.data);
      toast.error(
        e?.response?.data?.errors?.[0]?.message ||
          e?.response?.data?.message ||
          "Unable to Add Address. Please try Again!",
      );
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = useMemo(() => {
    if (
      state &&
      city &&
      address1 &&
      zipCode &&
      firstname &&
      lastname &&
      phone &&
      !phoneError &&
      !zipCodeError
    ) {
      return true;
    }
    return false;
  }, [state, city, address1, zipCode, firstname, lastname, phone]);

  useEffect(() => {
    getTerminalStates();
  }, []);

  useEffect(() => {
    if (!cities && states && states?.length > 1 && state) {
      getTerminalCities(states?.find((st) => st?.name == state)?.isoCode);
    }
  }, [state, states]);

  // useEffect(() => {
  //   if (parsedAddress) setCities(getCities(`nigeria_${parsedAddress.state}`));
  // }, [parsedAddress]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#121212" }}>
      <FocusAwareStatusBar barStyle="light-content" backgroundColor="#121212" />

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
          <Entypo name="chevron-left" size={24} color="white" />
        </TouchableOpacity>
        <Text
          style={{
            color: "white",
            fontFamily: "LexendDeca",
            fontSize: 20,
            letterSpacing: -0.22,
          }}
        >
          Add Address
        </Text>
      </View>

      {pageLoading ? (
        <ActivityIndicator
          size={"small"}
          color="#ffffff"
          style={{ marginVertical: 10 }}
        />
      ) : (
        <>
          {/* Form */}
          <KeyboardAwareScrollView
            bottomOffset={20}
            style={{
              flex: 1,
            }}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingBottom: 20,
            }}
            showsVerticalScrollIndicator={false}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={{ gap: 20 }}>
                {/* State Dropdown */}
                {states && states?.length > 0 && (
                  <View style={styles.inputSection}>
                    <Text style={styles.textLabel}>State</Text>
                    <Dropdown
                      style={styles.dropdown}
                      placeholderStyle={styles.placeholderStyle}
                      selectedTextStyle={styles.selectedTextStyle}
                      inputSearchStyle={styles.inputSearchStyle}
                      containerStyle={styles.dropdownContainer}
                      itemTextStyle={styles.itemTextStyle}
                      data={states}
                      search
                      labelField="name"
                      valueField="name"
                      placeholder="Select State"
                      searchPlaceholder="Search..."
                      fontFamily="LexendDeca-Light"
                      onChange={(item) => {
                        console.log(item);

                        setState(item.name);
                        getTerminalCities(item?.isoCode);
                        // setCities(getCities("nigeria_lagos"));
                      }}
                      value={state}
                    />
                  </View>
                )}

                {/* City Dropdown */}
                {cities && cities?.length > 0 && (
                  <View style={styles.inputSection}>
                    <Text style={styles.textLabel}>City</Text>
                    <Dropdown
                      style={styles.dropdown}
                      placeholderStyle={styles.placeholderStyle}
                      selectedTextStyle={styles.selectedTextStyle}
                      inputSearchStyle={styles.inputSearchStyle}
                      containerStyle={styles.dropdownContainer}
                      itemTextStyle={styles.itemTextStyle}
                      data={cities}
                      search
                      labelField="name"
                      valueField="name"
                      placeholder="Select City"
                      searchPlaceholder="Search..."
                      fontFamily="LexendDeca-Light"
                      onChange={(item) => setCity(item.name)}
                      value={city}
                    />
                  </View>
                )}

                {/* Address Fields */}
                <View style={styles.inputSection}>
                  <FormInput
                    name="Street Address"
                    placeholder="Street Address"
                    showLabel={true}
                    onChangeText={setAddress1}
                    maxLength={45}
                    hasError={false}
                    value={address1}
                  />
                </View>

                <View style={styles.inputSection}>
                  <FormInput
                    name="Address Line 2 (Optional)"
                    placeholder="Address Line 2"
                    showLabel={true}
                    onChangeText={setAddress2}
                    maxLength={45}
                    hasError={false}
                    value={address2}
                  />
                </View>

                <View style={styles.inputSection}>
                  <FormInput
                    name="Zip Code"
                    placeholder="Zip Code"
                    showLabel={true}
                    onChangeText={handleZipCodeChange}
                    inputMode="numeric"
                    maxLength={6}
                    hasError={!!zipCodeError}
                    error={zipCodeError}
                    value={zipCode}
                  />
                </View>

                <View style={[styles.inputSection, styles.flexInputSection]}>
                  <FormInput
                    name="First Name"
                    placeholder="First Name"
                    showLabel={true}
                    onChangeText={setFirstname}
                    hasError={false}
                    value={firstname}
                  />
                  <FormInput
                    name="Last Name"
                    placeholder="Last Name"
                    showLabel={true}
                    onChangeText={setLastname}
                    hasError={false}
                    value={lastname}
                  />
                </View>

                <View style={styles.inputSection}>
                  <FormInput
                    name="Phone Number"
                    placeholder="Enter Phone Number"
                    showLabel={true}
                    onChangeText={handlePhoneChange}
                    inputMode="numeric"
                    maxLength={11}
                    hasError={!!phoneError}
                    error={phoneError}
                    leftText="+234"
                    value={phone}
                  />
                </View>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAwareScrollView>

          <View
            style={{
              padding: 16,
              width: "100%",
              backgroundColor: "#121212",
            }}
          >
            <SubmitButton
              text="Save address"
              isLoading={loading}
              canSubmit={canSubmit}
              onPress={handleAddAddress}
            />
          </View>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  dropdownContainer: {
    height: 400,
    borderRadius: 10,
    borderCurve: "continuous",
  },
  dropdown: {
    height: 50,
    borderColor: "#FFFFFF33",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF05",
    borderCurve: "continuous",
  },
  inputSection: {
    flexBasis: "100%",
    flexShrink: 1,
    gap: 8,
  },
  flexInputSection: {
    flexDirection: "row",
  },
  inputContainer: {
    padding: 16,
    backgroundColor: "#2e2e2e",
    borderRadius: 8,
    position: "relative",
    flexBasis: "100%",
  },
  textLabel: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "LexendDeca-Light",
    letterSpacing: -0.22,
  },
  textInput: {
    fontSize: 13,
    color: "#fff",
    paddingVertical: 0,
    fontFamily: "LexendDeca",
  },
  placeholderStyle: {
    fontSize: 16,
    color: "#FFFFFF99",
    fontFamily: "LexendDeca-Light",
    letterSpacing: -0.22,
  },
  selectedTextStyle: {
    fontSize: 16,
    color: "#fff",
    fontFamily: "LexendDeca-light",
    letterSpacing: -0.22,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 14,
    fontFamily: "LexendDeca-light",
    borderRadius: 8,
    borderCurve: "continuous",
    color: "#000000",
    letterSpacing: -0.22,
  },
  itemTextStyle: {
    color: "#000000",
    fontSize: 14,
    fontFamily: "LexendDeca-Light",
    letterSpacing: -0.22,
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
