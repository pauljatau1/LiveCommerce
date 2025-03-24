import {
  View,
  Text,
  SafeAreaView,
  TextInput,
  Pressable,
  Platform,
  Keyboard,
  KeyboardAvoidingView,
} from "react-native";
import React, { useEffect, useRef, useState } from "react";
import { FocusAwareStatusBar } from "@/components/ui/focus-aware-status-bar";
import EvilIcons from "@expo/vector-icons/EvilIcons";
import { router, useLocalSearchParams } from "expo-router";
import { TouchableWithoutFeedback } from "react-native-gesture-handler";
import { useIsFocused } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

const Search = () => {
  const searchRef = useRef<TextInput>(null);
  const isFocused = useIsFocused();
  const { searchTab } = useLocalSearchParams();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

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
    if (isFocused) searchRef.current?.focus();
    getSearchHistory();
  }, [searchRef, isFocused]);
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
              borderRadius: 6,
              borderWidth: 1,
              borderColor: "#c6c6c6",
              paddingVertical: 12,
            }}
          >
            <EvilIcons
              name="search"
              size={24}
              color="#888787"
              className={Platform.OS === "android" ? "mt-[-4px]" : ""}
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

        <View className="mt-[20px] px-[16px] w-full flex-row items-center justify-between">
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

        <View className="mt-[10px] px-[16px]">
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Search;
