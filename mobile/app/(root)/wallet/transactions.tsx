import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Pressable,
  Platform,
} from "react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { FocusAwareStatusBar } from "@/components/ui/focus-aware-status-bar";
import { AntDesign, Entypo, Feather, FontAwesome5 } from "@expo/vector-icons";
import { router } from "expo-router";
import { formatDate } from "@/helpers/helpers";
import { ActivityIndicator } from "react-native-paper";
import { getToken } from "@/store/features/auth/utils";
import axios from "axios";
import LottieView from "lottie-react-native";
import BottomSheet from "@/components/global/bottom-sheet";
import TransactionDetails from "@/components/wallet/transaction-details";
import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import IOSDatePicker from "@/components/wallet/IOSDatePicker";
import SafeAreaView from "@/components/global/safeareaview/SafeAreaView";

const Transactions = () => {
  const [page, setPage] = useState<number>(1);
  const [hasReachedEnd, setHasReachedEnd] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [type, setType] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [showTransaction, setShowTransaction] = useState<boolean>(false);
  const [index, setIndex] = useState<number>();
  const [walletTransactions, setWalletTransactions] = useState<any>([]);

  const [date, setDate] = useState<any>(null);
  const [endDate, setEndDate] = useState<any>(null);
  const activeDate = useRef<any>();
  const [show, setShow] = useState(false);
  const [showIOSDatePicker, setShowIOSDatePicker] = useState<boolean>(false);

  const onChange = (event: any, selectedDate: any) => {
    setShowIOSDatePicker(false);

    if (event?.type == "dismissed") {
      return;
    }
    if (selectedDate == date) {
      return;
    }
    setPage(1);
    setHasReachedEnd(false);
    if (activeDate?.current == "start") {
      return setDate(selectedDate);
    }
    setEndDate(selectedDate);
  };

  const openDatePicker = () => {
    if (Platform.OS == "android") {
      return openDateAndroid();
    }

    setShowIOSDatePicker(true);
  };

  const openDateAndroid = () => {
    DateTimePickerAndroid.open({
      value: date || new Date(Date.now()),
      onChange,
      mode: "date",
      is24Hour: true,
    });
  };

  const getWalletTransactions = async () => {
    if (isFetching || hasReachedEnd) {
      return;
    }
    if (page == 1) {
      setLoading(true);
    } else {
      setIsFetching(true);
    }

    try {
      const token = await getToken();
      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL +
          `api/v2/buyers/wallet/transactions?page=${page}&limit=10&startDate=${date ? new Date(date)?.toDateString() : ""}&endDate=${endDate ? new Date(endDate)?.toDateString() : ""}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (page == 1) {
        setWalletTransactions(response.data?.data);
      } else {
        setWalletTransactions([...walletTransactions, ...response.data?.data]);
      }

      if (response.data.pagination?.hasMore) {
        setPage((prevPage) => prevPage + 1);
      } else {
        setHasReachedEnd(true);
      }
    } catch (e) {
      console.log("error fetching buyer wallet transactions ", e);
    } finally {
      setIsFetching(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    getWalletTransactions();
  }, [date, endDate]);

  const renderTransactions = useCallback(({ item, index }: any) => {
    return (
      <Pressable
        key={index}
        className={`flex-row justify-between items-end gap-[12px] py-[12px] px-[6px]`}
        onPress={() => {
          setIndex(index);
          setShowTransaction(true);
        }}
      >
        <View className="flex-row items-center justify-between gap-[8px] shrink">
          <View
            style={{
              backgroundColor: item.type == "credit" ? "#DEFFEE" : "#fae4e7",
              width: 35,
              height: 35,
              borderRadius: 35 / 2,
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
            className="items-start justify-between gap-[10px] shrink"
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
  }, []);

  const renderEmptyTransactions = useCallback(() => {
    return (
      <View
        style={{
          marginVertical: 60,
          width: "100%",
          alignItems: "center",
          gap: 10,
        }}
      >
        <FontAwesome5
          name="money-check"
          size={35}
          color="#ccc"
          style={{ opacity: 0.5 }}
        />

        <Text className="font-LexendDecaMedium text-[14px] text-[#ccc] text-center opacity-50">
          You have no transactions yet
        </Text>
      </View>
    );
  }, [Transactions]);

  const renderListFooter = useCallback(() => {
    if (isFetching && !hasReachedEnd) {
      return (
        <View
          style={{
            marginTop: 20,
            width: "100%",

            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <LottieView
            source={require("../../../assets/lottie/dots-loading.json")}
            autoPlay
            loop
            style={{
              width: 70,
              height: 30,
            }}
          />
        </View>
      );
    } else {
      return null;
    }
  }, [isFetching, hasReachedEnd]);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#121212" }}>
      <FocusAwareStatusBar barStyle="light-content" backgroundColor="#121212" />

      <View
        style={{
          paddingTop: 20,
          paddingBottom: 10,
          paddingHorizontal: 16,
          backgroundColor: "#121212",
          flex: 1,
        }}
      >
        <View className="gap-[12px] mb-[20px]">
          <TouchableOpacity className="" onPress={() => router.back()}>
            <Entypo
              name="chevron-left"
              size={24}
              color="rgba(204, 204, 204, 0.8)"
            />
          </TouchableOpacity>
          <Text style={styles.userName}>Transaction History</Text>
        </View>

        <View className="mb-[10px] px-[6px] items-start flex-row gap-[12px]">
          <View className="gap-[6px]">
            <Text className="text-[#fff] font-LexendDeca text-[10px]">
              Start Date
            </Text>
            <Pressable
              className="border-[1px] border-[#ccc] rounded-[6px] flex-row items-center justify-between px-[10px] py-[8px] gap-[8px]"
              onPress={() => {
                activeDate.current = "start";
                openDatePicker();
              }}
            >
              <AntDesign name="calendar" size={14} color="white" />
              <Text className="text-[#fff] font-LexendDeca text-[12px]">
                {!date ? "Select Start Date" : formatDate(date, "MMM DD YYYY")}
              </Text>
              {date && (
                <Pressable
                  onPress={() => {
                    activeDate.current = "start";
                    onChange(null, null);
                  }}
                >
                  <AntDesign name="close" size={14} color="#ccc" />
                </Pressable>
              )}
            </Pressable>
          </View>
          <View className="gap-[6px]">
            <Text className="text-[#fff] font-LexendDeca text-[10px]">
              End Date
            </Text>
            <Pressable
              className="border-[1px] border-[#ccc] rounded-[6px] flex-row items-center justify-between px-[10px] py-[8px] gap-[8px]"
              onPress={() => {
                activeDate.current = "end";
                openDatePicker();
              }}
            >
              <AntDesign name="calendar" size={14} color="white" />
              <Text className="text-[#fff] font-LexendDeca text-[12px]">
                {!endDate
                  ? "Select End Date"
                  : formatDate(endDate, "MMM DD YYYY")}
              </Text>
              {endDate && (
                <Pressable
                  onPress={() => {
                    activeDate.current = "end";
                    onChange(null, "");
                  }}
                >
                  <AntDesign name="close" size={14} color="#ccc" />
                </Pressable>
              )}
            </Pressable>
          </View>
        </View>

        <View
          style={{
            flex: 1,
          }}
        >
          {loading ? (
            <ActivityIndicator
              size={"small"}
              color={"white"}
              style={{ marginVertical: 20 }}
            />
          ) : (
            <FlatList
              data={walletTransactions}
              renderItem={renderTransactions}
              keyExtractor={(item, index) => item?._id || index.toString()}
              onEndReached={getWalletTransactions}
              onEndReachedThreshold={0.8}
              ListEmptyComponent={renderEmptyTransactions}
              ListFooterComponent={renderListFooter}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </View>

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

      <BottomSheet
        bgColor="#121212"
        childrenStyle="!px-[11px]"
        showCloseIcon={false}
        show={showIOSDatePicker}
        onRequestClose={() => setShowIOSDatePicker(false)}
        // snapPoints={["35%"]}
        // enableDynamicSizing={false}
        keyboardBehavior={"interactive"}
      >
        <IOSDatePicker date={date} onChangeDate={onChange} />
      </BottomSheet>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  userName: {
    fontSize: 20,
    color: "#ccc",
    fontFamily: "LexendDeca-Medium",
    marginLeft: 4,
  },
});

export default Transactions;
