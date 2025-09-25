import { View, Text, Pressable, Linking, BackHandler } from "react-native";
import React, { useEffect } from "react";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FocusAwareStatusBar } from "@/components/ui/focus-aware-status-bar";
import { useLocalSearchParams, useNavigation } from "expo-router";

const UpdatePage = () => {
  const insets = useSafeAreaInsets();
  const { url } = useLocalSearchParams();
  const navigation = useNavigation();

  useEffect(() => {
    let parent = navigation.getParent();
    while (parent) {
      parent.setOptions({ gestureEnabled: false });
      parent = parent.getParent();
    }
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        console.log("in back handler");
        return true;
      },
    );

    return () => {
      let parent = navigation.getParent();
      while (parent) {
        parent.setOptions({ gestureEnabled: true });
        parent = parent.getParent();
      }
      backHandler.remove();
    };
  }, [navigation]);

  return (
    <View className="flex-1 bg-[#000]">
      <FocusAwareStatusBar barStyle="light-content" backgroundColor="black" />

      <View className="w-full h-full absolute">
        <Image
          source={require("@/assets/images/update-background.png")}
          style={{
            width: "100%",
            height: "75%",
          }}
        />
      </View>

      <View
        className="w-full h-full justify-end gap-[30px] px-[20px]"
        style={{
          paddingBottom: insets.bottom + 30,
        }}
      >
        <Text className="text-white text-[45px] font-LexendDecaBold tracking-[-0.22px] leading-[54px]">
          New{"\n"}Update{"\n"}Available
        </Text>
        <Text className="text-[#FFFFFF99] text-[18px] font-LexendDeca tracking-[-0.22px] capitalize">
          a newer version of Auqli is now available. please navigate to the
          store to download now
        </Text>
        <Pressable
          className="h-[50px] w-full items-center justify-center rounded-[10px] bg-white"
          style={{ borderCurve: "continuous" }}
          onPress={() => {
            Linking.openURL(decodeURIComponent(url?.toString()));
          }}
        >
          <Text className="text-[#16783A] text-[15px] font-LexendDecaMedium tracking-[-0.22px]">
            Update Now
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

export default UpdatePage;
