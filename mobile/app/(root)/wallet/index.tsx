import {
  View,
  Text,
  Dimensions,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Pressable,
  FlatList,
  ActivityIndicator,
} from "react-native";
import React, { memo, useCallback, useEffect, useState } from "react";
import { FocusAwareStatusBar } from "@/components/ui/focus-aware-status-bar";
import { router } from "expo-router";
import {
  AntDesign,
  Entypo,
  Feather,
  FontAwesome6,
  Octicons,
} from "@expo/vector-icons";
import { Image } from "expo-image";
import { getToken, getUser } from "@/store/features/auth/utils";
import axios from "axios";
import { useIsFocused } from "@react-navigation/native";
import { formatDate } from "@/helpers/helpers";
import { Paystack } from "react-native-paystack-webview";
import { toast } from "@/core/toast";
import BottomSheet from "@/components/global/bottom-sheet";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import TransactionDetails from "@/components/wallet/transaction-details";
import SafeAreaView from "@/components/global/safeareaview/SafeAreaView";

const paymentOptions = [
  {
    icon: require("../../../assets/icons/paystack.png"),
    name: "Paystack",
    description: "Secure payment via card, bank transfer, e-Wallets",
  },
];

const statusColor = {
  completed: { name: "Completed", color: "#66CB9F", bg: "#DEFFEE" },
  failed: { name: "Failed", color: "#66CB9F", bg: "#DEFFEE" },
  cancelled: { name: "Cancelled", color: "#66CB9F", bg: "#DEFFEE" },
} as any;

const Wallet = () => {
  const isFocused = useIsFocused();
  const [userInfo, setUserInfo] = useState<any>();
  const [walletBalance, setWalletBalance] = useState<any>();
  const [walletTransactions, setWalletTransactions] = useState<any>([]);
  const [walletLoading, setWalletLoading] = useState<boolean>(false);
  const [paymentReference, setPaymentReference] = useState<string>("");
  const [amount, setAmount] = useState<number>(0);
  const [showPaystack, setShowPaystack] = useState(false);
  const [showSuccessSheet, setShowSuccessSheet] = useState(false);
  const [showPaymentMethodSheet, setShowPaymentMethodSheet] = useState(false);
  const [showSelectAmount, setShowSelectAmount] = useState(false);
  const [payLoading, setPayLoading] = useState<boolean>(false);
  const [showTransaction, setShowTransaction] = useState<boolean>(false);
  const [index, setIndex] = useState<number>();
  const [showBalance, setShowBalance] = useState<boolean>(false);

  const [paystackKey, setPaystackKey] = useState<any>();

  const getPaystackKey = useCallback(async () => {
    const token = await getToken();
    try {
      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL +
          `api/public/paystack-keys/${process.env.EXPO_PUBLIC_PAYSTACK_CODE || 1122}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setPaystackKey(response.data?.data);
    } catch (e) {
      console.log("error getting keys");
    }
  }, []);

  const generateReference = () => {
    const newReference = `WALLET-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    return newReference;
  };

  const getUserInfo = async () => {
    const user = await getUser();
    setUserInfo(user);
  };

  const getWalletBalance = async () => {
    try {
      const token = await getToken();
      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL + `api/v2/buyers/wallet/balance`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      setWalletBalance(response.data?.data?.balance);
    } catch (e) {
      console.log("error fetching buyer wallet balance ", e);
    }
  };

  const getWalletTransactions = async () => {
    setWalletLoading(true);
    try {
      const token = await getToken();
      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL +
          `api/v2/buyers/wallet/transactions?page=1&limit=10`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      setWalletTransactions(response.data?.data);
    } catch (e) {
      console.log("error fetching buyer wallet balance ", e);
    } finally {
      setWalletLoading(false);
    }
  };

  const handleAmountSelect = useCallback(
    (amount: number) => {
      if (amount < 50) {
        return toast.error("Invalid Amount (minimum 50 naira)");
      }
      setAmount(amount);
      setShowPaymentMethodSheet(false);
      setShowPaystack(true);
    },
    [amount],
  );

  const closePaymentSheet = useCallback(() => {
    setShowPaymentMethodSheet(false);
  }, []);

  useEffect(() => {
    if (isFocused) {
      getPaystackKey();
      getUserInfo();
      getWalletBalance();
      getWalletTransactions();
    }
  }, [isFocused]);

  const onPaystackSuccess = async (paystackResponse: any) => {
    setShowPaystack(false);
    try {
      const token = await getToken();

      const paymentReference = paystackResponse.data.transactionRef.reference;

      const config = {
        method: "GET",
        url:
          process.env.EXPO_PUBLIC_API_URL +
          `api/v2/buyers/wallet/topup/verify?reference=${paymentReference}`,
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
      };

      const response = await axios(config);
      setWalletBalance(response.data.data?.newBalance);
      getWalletTransactions();
      setShowSuccessSheet(true);
      console.log("wallet topup response", response.data);
    } catch (e: any) {
      if (e?.response.status == 400) {
        return router.push("/(root)/orders/orders");
      }
      console.log("could not Pay for  order", e?.response?.message);
      toast.error("Could not Pay for order");
    } finally {
      setPayLoading(false);
    }
  };

  const onPaystackClose = () => {
    setShowPaystack(false);
    setPayLoading(false);
    toast.info("Payment Cancelled");
  };

  const renderTransactions = useCallback(
    ({ item, index }: any) => {
      return (
        <Pressable
          key={index}
          className={`flex-row justify-between items-end gap-[12px] p-[12px] ${index + 1 < walletTransactions?.length ? "border-b-[#ccc] border-b-[1px]" : ""}`}
          onPress={() => {
            setIndex(index);
            setShowTransaction(true);
          }}
        >
          <View className="flex-row items-center justify-between gap-[8px] shrink">
            <View
              style={{
                backgroundColor: item.type == "credit" ? "#DEFFEE" : "#fae4e7",
                width: 30,
                height: 30,
                borderRadius: 15,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {}
              <Feather
                name={
                  item.type == "credit" ? "arrow-down-left" : "arrow-up-right"
                }
                size={18}
                color={item.type == "credit" ? "#16783A" : "#cd000f"}
              />
            </View>
            <View
              className="items-start justify-between gap-[6px] shrink"
              // style={{ flexBasis: "33%" }}
            >
              <Text
                className="text-[#fff] text-[12px] font-LexendDeca "
                numberOfLines={1}
              >
                {item.description}
              </Text>
              <Text className="text-white text-[12px] font-LexendDecaMedium ">
                {item?.type == "debit" && "-"}
                {"₦" +
                  item.amount?.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
              </Text>
            </View>
          </View>

          <View
            style={{
              // flexBasis: "33%",
              alignItems: "flex-end",
              justifyContent: "space-between",
              gap: 10,
            }}
          >
            {/* <View
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
            </View> */}

            <Text
              className="text-[#16783A] text-[12px] font-LexendDecaMedium "
              style={{
                color: item?.type == "debit" ? "#cd000f" : "#16783A",
              }}
            >
              {item.type}
            </Text>
            <Text
              className="text-[#ccc] text-[10px] font-LexendDecaMedium text-center"
              style={{ flexBasis: "33%" }}
            >
              {formatDate(item?.createdAt, "MMM DD YYYY, HH:mm:ss")}
            </Text>
          </View>
        </Pressable>
      );
    },
    [walletTransactions, isFocused],
  );

  const renderEmptyList = useCallback(
    ({ item }: any) => {
      return (
        <View className="w-full my-[30px]">
          <Text className="text-white text-[14px] font-LexendDecaMedium self-center">
            No Transactions
          </Text>
        </View>
      );
    },
    [walletTransactions, isFocused],
  );
  return (
    <SafeAreaView className="h-full flex-1 bg-[#121212] ">
      <FocusAwareStatusBar barStyle="light-content" backgroundColor="#121212" />
      <View className="flex flex-row items-center justify-center gap-[10px] px-[16px] py-[20px]">
        <TouchableOpacity
          className="absolute left-[12px] pr-[8px]"
          onPress={() => router.back()}
        >
          <Entypo
            name="chevron-left"
            size={24}
            color="rgba(204, 204, 204, 0.8)"
          />
        </TouchableOpacity>

        <Text className="text-white font-LexendDecaMedium text-[20px]">
          Wallet
        </Text>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 30,
        }}
      >
        <View className="w-full h-[250px] flex-row items-start mb-[30px]">
          <Image
            source={require("../../../assets/images/wallet-hero.png")}
            style={{
              width: "100%",
              height: "100%",
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              opacity: 0.5,
            }}
          />
          <View className="px-[5px] py-[5px] pr-[10px] flex-row items-center gap-[10px] bg-[#fff] rounded-[24px] mt-[30px] ml-[30px] border-[1px] border-[#16783A]">
            <Image
              source={{ uri: userInfo?.profileImage?.url }}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
              }}
              contentFit="cover"
            />
            <Text className="text-[16px] font-LexendDecaMedium">
              {userInfo?.firstName + " " + userInfo?.lastName}
            </Text>
          </View>
        </View>

        <View className="mx-[16px] mb-[30px]">
          <Image
            source={require("../../../assets/images/wallet-banner.png")}
            style={{
              width: "100%",
              height: "100%",
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              opacity: 0.5,
            }}
          />
          <View className="p-[14px] flex-row items-center justify-between gap-[10px]">
            <View className="gap-[5px]">
              <View className="flex-row items-center gap-[8px]">
                <Text className="text-[14px] font-LexendDeca text-[#fff] opacity-70">
                  My Balance
                </Text>

                <Pressable onPress={() => setShowBalance(!showBalance)}>
                  {showBalance ? (
                    <Octicons name="eye" size={18} color="white" />
                  ) : (
                    <Octicons name="eye-closed" size={18} color="white" />
                  )}
                </Pressable>
              </View>

              {!showBalance ? (
                <Text className="text-[18px] font-LexendDeca text-[#fff] ">
                  ******
                </Text>
              ) : walletBalance?.toString() ? (
                <Text className="text-[18px] font-LexendDeca text-[#fff] ">
                  {"₦" +
                    walletBalance?.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                </Text>
              ) : (
                <ActivityIndicator size={"small"} color={"white"} />
              )}
            </View>
            <View className="flex-row gap-[10px] items-center">
              <Text className="text-[14px] font-LexendDecaMedium text-[#fff]">
                Top Up
              </Text>
              <Pressable
                className="w-[24px] h-[24px] rounded-[6px] bg-[#fff] items-center justify-center"
                onPress={() => {
                  setShowPaymentMethodSheet(true);
                }}
              >
                <FontAwesome6 name="plus" size={16} color="black" />
              </Pressable>
            </View>
          </View>
        </View>

        <View className="w-full px-[16px] mb-[30px] flex-row items-center justify-center">
          <Image
            source={require("../../../assets/images/wallet-card.png")}
            style={{
              width: "100%",
              height: undefined,
              aspectRatio: 1.5175953079178885,
            }}
            contentFit="contain"
          />
        </View>

        <View className="flex-row items-center justify-between gap-[10px] px-[16px] mb-[30px]">
          <Pressable
            className="rounded-[6px] py-[12px] border-[1px] border-[#16783A] bg-[#16783A] items-center justify-center shrink"
            style={{ flexBasis: "33%" }}
          >
            <Text className="text-white text-[12px] font-LexendDecaMedium">
              Refer & Earn
            </Text>
            <Image
              source={require("../../../assets/icons/coming-soon.png")}
              style={{
                width: 56,
                height: 22,
                position: "absolute",
                left: -5,
                top: -10,
              }}
              contentFit="contain"
            />
          </Pressable>
          <Pressable
            className="rounded-[6px] py-[12px] border-[1px] border-[#16783A] flex-row gap-[6px] items-center justify-center shrink "
            style={{ flexBasis: "33%" }}
            onPress={() => {
              setShowPaymentMethodSheet(true);
            }}
          >
            <Image
              source={require("../../../assets/icons/top-up.png")}
              style={{
                width: 15,
                height: 15,
              }}
            />
            <Text className="text-[#16783A] text-[12px] font-LexendDecaMedium">
              Top Up
            </Text>
          </Pressable>
          <Pressable
            className="rounded-[6px] py-[12px] border-[1px] border-[#16783A] flex-row gap-[6px] items-center justify-center shrink"
            style={{ flexBasis: "33%" }}
          >
            <Feather name="send" size={12} color="#16783A" />
            <Text className="text-[#16783A] text-[12px] font-LexendDecaMedium">
              Send
            </Text>
            <Image
              source={require("../../../assets/icons/coming-soon.png")}
              style={{
                width: 56,
                height: 22,
                position: "absolute",
                left: -5,
                top: -10,
              }}
              contentFit="contain"
            />
          </Pressable>
        </View>
        <View className="gap-[20px] px-[16px]">
          <View className="flex-row items-center justify-between">
            <Text className="text-white text-[18px] font-LexendDecaMedium">
              Transaction History
            </Text>
            <TouchableOpacity
              className="flex-row items-center gap-[2px]"
              onPress={() => router.push("/wallet/transactions")}
            >
              <Text className="text-[#16783A] text-[12px] font-LexendDecaMedium">
                View More
              </Text>
              <Entypo
                name="chevron-right"
                size={14}
                color="#16783A"
                style={{ marginTop: 3 }}
              />
            </TouchableOpacity>
          </View>

          <View className="bg-[#404040] rounded-[8px] overflow-hidden">
            {walletLoading && (
              <ActivityIndicator
                size={"small"}
                color={"white"}
                style={{ marginVertical: 20 }}
              />
            )}
            {walletTransactions.length > 0
              ? walletTransactions?.map((item: any, index: number) =>
                  renderTransactions({ item, index }),
                )
              : walletLoading
                ? null
                : renderEmptyList({})}
            {/* <FlatList
              data={walletTransactions}
              renderItem={renderTransactions}
              keyExtractor={(item, index) => item?._id || index.toString()}
              ListEmptyComponent={renderEmptyList}
            /> */}
          </View>
        </View>
      </ScrollView>

      {showPaystack && (
        <Paystack
          refNumber={generateReference()}
          paystackKey={paystackKey?.publicKey}
          amount={amount}
          channels={[
            "card",
            "bank",
            "ussd",
            "qr",
            "mobile_money",
            "bank_transfer",
            "apple_pay",
          ]}
          billingEmail={userInfo?.email}
          billingName={`${userInfo?.firstName + " " + userInfo?.lastName}`}
          onSuccess={onPaystackSuccess}
          onCancel={onPaystackClose}
          activityIndicatorColor="#16783A"
          autoStart={true}
          metadata={JSON.stringify({
            buyerId: userInfo?._id,
            transactionType: "wallet_topup",
            custom_fields: [
              {
                display_name: "Buyer ID",
                variable_name: "buyer_id",
                value: userInfo?._id,
              },
              {
                display_name: "Transaction Type",
                variable_name: "transaction_type",
                value: "wallet_topup",
              },
            ],
          })}
        />
      )}

      <BottomSheet
        bgColor="#ffffff"
        childrenStyle="!px-[11px]"
        showCloseIcon={false}
        show={showPaymentMethodSheet}
        enableDynamicSizing={true}
        onRequestClose={() => setShowPaymentMethodSheet(false)}
        keyboardBehavior="interactive"
      >
        <PaymentMethodSheet
          handleAmountSelect={handleAmountSelect}
          closeSheet={closePaymentSheet}
        />
      </BottomSheet>

      <BottomSheet
        bgColor="#ffffff"
        childrenStyle="!px-[11px]"
        showCloseIcon={false}
        show={showSuccessSheet}
        enableDynamicSizing={true}
        onRequestClose={() => setShowSuccessSheet(false)}
        keyboardBehavior="interactive"
      >
        <TopUpSuccess closeSheet={() => setShowSuccessSheet(false)} />
      </BottomSheet>

      <BottomSheet
        bgColor="#121212"
        childrenStyle="!px-[11px]"
        showCloseIcon={false}
        show={showTransaction}
        onRequestClose={() => setShowTransaction(false)}
        // snapPoints={["35%"]}
        // enableDynamicSizing={false}
        keyboardBehavior={"interactive"}
      >
        <TransactionDetails item={walletTransactions[index!]} />
      </BottomSheet>
    </SafeAreaView>
  );
};

const PaymentMethodSheet = ({ handleAmountSelect, closeSheet }: any) => {
  const [selectedPayment, setSelectedPayment] = useState<number>(0);
  const [amount, setAmount] = useState<string>("");

  const renderPaymentOptions = useCallback(
    (item: any, index: number) => {
      return (
        <Pressable
          key={index}
          className="rounded-[16px] border-[1px] border-[#1D272F] p-[16px] flex-row items-center justify-between gap-[8px] min-h-[100px]"
          onPress={() => setSelectedPayment(index)}
        >
          <View className="flex-row items-center gap-[16px] shrink">
            <View
              className="w-[50px] h-[50px] rounded-[10px] flex-row items-center justify-center bg-[#FFFFFF] "
              style={{
                backgroundColor: index !== 0 ? "#CFCFCF" : "#F2F4F9",
              }}
            >
              <Image
                source={item.icon}
                contentFit="contain"
                style={{
                  width: 25,
                  height: 25,
                }}
              />
            </View>
            <View className="shrink">
              <Text
                className="text-[16px] font-LexendDecaSemiBold text-[#ccc]"
                style={{
                  color: selectedPayment == index ? "#425466" : "#ccc",
                }}
              >
                {item.name}
              </Text>
              <Text
                className="text-[12px] font-LexendDeca text-[#ccc] leading-[19.5px] shrink"
                style={{
                  color: selectedPayment == index ? "#425466" : "#ccc",
                }}
              >
                {item.description}
              </Text>
            </View>
          </View>

          <View
            className="w-[22px] h-[22px] rounded-[22px] justify-center items-center"
            style={{
              backgroundColor: selectedPayment == index ? "#1D272F" : "#f2f2f2",
            }}
          >
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: selectedPayment == index ? "#fff" : "#fff",
              }}
            ></View>
          </View>
        </Pressable>
      );
    },
    [selectedPayment],
  );
  return (
    <View>
      <View className="p-[16px] gap-[10px] mb-[10px]">
        <View className="flex-row items-center justify-between">
          <Text className="text-[18px] text-[#191D31] font-LexendDecaSemiBold">
            Payment Method
          </Text>
        </View>
        <View className="gap-[16px] mt-[10px]">
          {paymentOptions.map((option: any, index: number) =>
            renderPaymentOptions(option, index),
          )}
        </View>
      </View>

      <View style={styles.editSingleSection} className="px-[16px] mb-[30px]">
        <Text style={styles.label}>Top-up Amount</Text>
        <BottomSheetTextInput
          style={styles.input}
          placeholder="Amount"
          value={amount}
          onChangeText={(text: any) => setAmount(text)}
          keyboardType="numeric"
          maxLength={9}
        />
      </View>

      <View className="absolute bottom-2 left-0 right-0 px-[20px] py-[2px]">
        <Pressable
          className="w-full py-[15px] items-center justify-center bg-[#16783A]"
          style={{ borderRadius: 25 }}
          onPress={() => {
            if (!amount) {
              return toast.info("enter a valid amount");
            }
            handleAmountSelect(parseFloat(amount));
          }}
        >
          <Text className="text-[16px] text-[#fff] font-LexendDecaMedium">
            Confirm Payment
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

const TopUpSuccess = ({ closeSheet }: any) => {
  useEffect(() => {
    setTimeout(() => closeSheet(), 5000);
  }, []);
  return (
    <View
      className="items-center"
      style={{
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: 13,
      }}
    >
      <View
        style={{
          width: 197,
          height: 197,
          borderRadius: 98.5,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#0BD443",
          marginBottom: 30,
        }}
      >
        <Entypo name="check" size={80} color="#fff" />
      </View>
      <Text
        className="mb-[10px] font-LexendDecaSemiBold text-[#191D31] text-[26px] text-center"
        style={{
          fontSize: 26,
        }}
      >
        Top Up Successful
      </Text>
      <Text className="mb-[12px] font-LexendDecaSemiBold text-[#191D31] text-[18px] text-center opacity-70">
        Congratulations! Your balance is updated
      </Text>
      <Pressable
        className="w-full py-[15px] items-center justify-center bg-[#16783A] self-center"
        style={{ borderRadius: 25 }}
        onPress={closeSheet}
      >
        <Text className="text-[16px] text-[#fff] font-LexendDecaMedium">
          Return
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  editSingleSection: {
    width: "100%",
    marginBottom: 120,
    // flexShrink: 1,
  },
  label: {
    fontSize: 14,
    fontFamily: "LexendDeca-Medium",
    color: "#191D31",
    marginBottom: 4,
  },
  input: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: "LexendDeca",
    color: "#191D31",
    backgroundColor: "#f2f2f2",
    borderRadius: 8,
  },
});
export default Wallet;
