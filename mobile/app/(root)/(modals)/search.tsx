import {
  View,
  Text,
  SafeAreaView,
  TextInput,
  Pressable,
  Platform,
  Keyboard,
  KeyboardAvoidingView,
  Image,
  FlatList,
  TouchableOpacity,
} from "react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { FocusAwareStatusBar } from "@/components/ui/focus-aware-status-bar";
import EvilIcons from "@expo/vector-icons/EvilIcons";
import { router, useLocalSearchParams } from "expo-router";
import { TouchableWithoutFeedback } from "react-native-gesture-handler";
import { useIsFocused } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import axios from "axios";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { ActivityIndicator } from "react-native-paper";
import { ScrollView } from "react-native-virtualized-view";

const Search = () => {
  const token = useSelector((state: RootState) => state.authState.token);
  const searchRef = useRef<TextInput>(null);
  const isFocused = useIsFocused();
  const { searchTab } = useLocalSearchParams();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [sellers, setSellers] = useState<any[]>([]);
  const [keyboardFocused, setKeyboardFocused] = useState<boolean>(false);

  const fetchSellers = async () => {
    if (!searchQuery) {
      return setSellers([]);
    }
    setLoading(true);
    try {
      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL +
          `api/seller/search?query=${searchQuery}&page=1&limit=5`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (response.status === 200) {
        setSellers(response.data?.sellers);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const getSearchHistory = async () => {
    const history = await AsyncStorage.getItem("searchHistory");
    if (history)
      return setSearchHistory(JSON.parse(history).reverse().slice(0, 5));
    // return setSearchHistory([]);
  };

  const handleSearch = async () => {
    if (/^[a-zA-Z0-9\s]+$/.test(searchQuery)) {
      const newHistory = [...searchHistory, searchQuery];
      await AsyncStorage.setItem("searchHistory", JSON.stringify(newHistory));
      router.replace({
        pathname: `../../(root)/catalog/${searchQuery}`,
        params: { searchTab },
      });
      return;
    }
    return Keyboard.dismiss();
  };

  const clearHistory = async () => {
    setSearchHistory([]);
    await AsyncStorage.removeItem("searchHistory");
  };

  useEffect(() => {
    getSearchHistory();
  }, []);

  useEffect(() => {
    if (isFocused) searchRef.current?.focus();
    if (searchRef?.current) {
      if (searchRef?.current?.isFocused()) {
        setKeyboardFocused(true);
      } else {
        setKeyboardFocused(false);
      }
    }
  }, [searchRef, isFocused]);

  useEffect(() => {
    // if (searchQuery) {
    fetchSellers();
    // }
  }, [searchQuery]);

  const renderSellers = useCallback(({ item }: any) => {
    return (
      <TouchableOpacity
        className="py-[12px] w-full flex-row items-center justify-between"
        onPress={() =>
          router.push({
            pathname: "/(root)/sellerProfile",
            params: { sellerId: item?._id, sellerAvatar: item?.sellerAvatar },
          })
        }
      >
        <View className="flex-row items-center gap-[8px]">
          <Image
            source={{ uri: item?.storeAvatar }}
            style={{
              width: 30,
              height: 30,
              borderRadius: 15,
              backgroundColor: "#cccccc",
            }}
            resizeMode="cover"
          />
          <View>
            <Text className="text-[14px] text-[#ccc] font-LexendDecaMedium">
              {item?.storeName || item?.businessName || "Filler Store"}
            </Text>
            <Text className="text-[10px] text-[#ccc] font-LexendDecaLight">
              {item?.followerCount || 0} followers
            </Text>
          </View>
        </View>
        <MaterialCommunityIcons
          name="arrow-top-left"
          size={16}
          color="#16783A"
        />
      </TouchableOpacity>
    );
  }, []);

  const renderFooterComponent = useCallback(() => {
    return (
      <>
        <View className="mt-[20px] w-full flex-row items-center justify-between">
          <Text className="text-[15px] text-[#ccc] font-LexendDeca">
            Recent Searches
          </Text>
          {searchHistory.length > 0 && (
            <Pressable onPress={clearHistory}>
              <Text className="text-[14px] text-[#16783A] font-LexendDeca">
                Clear
              </Text>
            </Pressable>
          )}
        </View>

        <View className="mt-[10px]">
          {searchHistory.map((term: string, index: number) => (
            <Pressable
              className="py-[12px] w-full flex-row items-center justify-between"
              key={index}
              onPress={() =>
                router.replace({
                  pathname: `../../(root)/catalog/${term}`,
                  params: { searchTab },
                })
              }
            >
              <Text className="text-[14px] text-[#ccc] font-LexendDecaLight">
                {term}
              </Text>
              <MaterialCommunityIcons
                name="arrow-top-left"
                size={16}
                color="#16783A"
              />
            </Pressable>
          ))}
        </View>
      </>
    );
  }, [searchHistory]);
  return (
    <SafeAreaView className="h-full w-full flex-1 bg-[#121212] ">
      <FocusAwareStatusBar barStyle="light-content" backgroundColor="#121212" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View className="mt-[30px] px-[16px] flex-row items-center justify-between gap-[10px]">
          <View
            className="flex-row w-full px-[12px] items-center gap-[5px] shrink"
            style={{
              borderRadius: 15,
              // borderWidth: 1,
              // borderColor: keyboardFocused ? "#16783A" : "#c6c6c6",
              backgroundColor: "#232323",
              paddingVertical: 13,
            }}
          >
            <EvilIcons
              name="search"
              size={20}
              color="#909090"
              className={Platform.OS === "android" ? "mt-[-2px]" : ""}
            />
            <TextInput
              ref={searchRef}
              placeholder="Search"
              placeholderTextColor={"#888787"}
              className="text-[#c6c6c6] text-[14px] font-LexendDecaLight w-[100%]"
              autoFocus
              returnKeyType="search"
              value={searchQuery}
              onChangeText={(text) => setSearchQuery(text)}
              onSubmitEditing={handleSearch}
              style={{
                fontSize: 14,
                padding: 0,
              }}
            />
          </View>
          <Pressable
            onPress={() => {
              router.back();
            }}
          >
            <Text className="text-[14px] text-[#ccc] font-LexendDeca">
              Cancel
            </Text>
          </Pressable>
        </View>

        <View className="">
          <FlatList
            data={sellers}
            renderItem={renderSellers}
            keyExtractor={(item, index) => item?._id || index.toString()}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingTop: sellers?.length > 0 ? 10 : 0,
            }}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={renderFooterComponent}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Search;
