import { View, Text } from "react-native";
import React, { memo } from "react";
import { useRouter } from "expo-router";
import AnimatedButton from "@/components/Primitives/Buttons/animatedButton";
import { Image } from "expo-image";

const FollowingUnAuth = ({
  message = "you can view the following content after logging in",
}: {
  message?: string;
}) => {
  const router = useRouter();
  return (
    <View className="w-full h-full items-center justify-center px-[50px] gap-[12px]">
      <Image
        source={require("@/assets/images/following-unauth-illustration.png")}
        style={{
          width: 80,
          height: 80,
        }}
      />
      <Text className="text-[#FFFFFFCC] font-LexendDecaMedium text-[20px] tracking-[-0.2px] text-center">
        you&apos;re not logged in
      </Text>
      <Text className="text-[#FFFFFF99] font-LexendDecaLight text-[14px] tracking-[-0.14px] text-center">
        {message}
      </Text>
      <AnimatedButton
        btnClassname="p-[16px] rounded-[10px] bg-primary-200 w-[116px]"
        onPress={() => router.push("/sign-in")}
      >
        <Text className="text-[#FFFFFF] font-LexendDecaMedium text-[15px] tracking-[-0.14px] text-center">
          Log In
        </Text>
      </AnimatedButton>
    </View>
  );
};

export default memo(FollowingUnAuth);
