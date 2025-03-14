import { View, Text, Image, Pressable } from "react-native";
import React, { useState } from "react";
import { icons, images } from "@/constants";
import CustomButton from "@/components/global/button/CustomButton";
import { router } from "expo-router";
import { getToken } from "@/store/features/auth/utils";
import axios from "axios";
import BottomSheet from "../bottom-sheet";
import AuthSheet from "@/components/auth/authSheet";

const FollowCard = ({ item, data }: { item: string; data: any }) => {
  const [isFollowing, setFollowing] = useState<boolean>(false);
  const [showAuthSheet, setShowAuthSheet] = useState<boolean>(false);

  const handleFollow = async (action: string) => {
    const token = await getToken();

    if (!token) {
      return setShowAuthSheet(true);
    }
    let method = "";
    if (action == "follow") {
      setFollowing(true);
      method = "POST";
    } else {
      setFollowing(false);
      method = "DELETE";
    }
    const config = {
      url: process.env.EXPO_PUBLIC_API_URL + `api/buyer/follow/${item}`,
      method,
      headers: {
        Authorization: "Bearer " + token,
      },
      data: {},
    };
    try {
      const response = await axios(config);
    } catch (error) {
      console.error("Error following seller:", error);
    }
  };

  return (
    <Pressable
      className={`mt-[9px] mr-[30px] w-full px-[4px] gap-x-3  `}
      onPress={() =>
        router.push({
          pathname: "/sellerProfile",
          params: {
            sellerId: data?._id,
            sellerAvatar: data?.storePresence?.storeAvatar,
          },
        })
      }
    >
      <View className="border-[1.5px] border-[#CCCCCC1A] rounded-[10px] py-[8px] px-[12px] ">
        <View className="flex flex-col items-center justify-center">
          <Image
            source={{
              uri:
                data?.storeAvatar?.url ||
                "https://media.istockphoto.com/id/1315110986/vector/store-editable-stroke-outline-icon-isolated-on-white-background-flat-vector-illustration.jpg?s=612x612&w=0&k=20&c=mCrUUX3bWTZOvKrr3ontPWJKO_9HAOmboDxxd_XeIRI=",
            }}
            resizeMode="cover"
            className="relative rounded-full w-[60px] h-[60px] "
          />
          <Text className="text-[#CCCCCCCC] text-[12.28px] text-center font-LexendDecaBold pt-1">
            {data.storeName || data.businessName}
          </Text>
          <Text className="text-[#CCCCCCCC] text-[9px] pt-1 font-LexendDeca">
            {data?.followerCount} followers
          </Text>
          {data?.stats?.averageRating && (
            <View className="flex-row items-center pt-1 mb-2">
              <Image source={icons.starIcon} />
              <Text className="text-white flex justify-center items-center px-[2.329px] py-[0.582px] text-[8px] font-LexendDecaBold">
                {data?.stats?.averageRating?.toFixed(1)}
              </Text>
            </View>
          )}

          {/* <Text className="text-[#CCCCCC] text-[8px] font-LexendDeca pt-1  font-light">
            Lagos, Nigeria
          </Text> */}
        </View>
        {isFollowing ? (
          <CustomButton
            textStyle="!text-[8px] !font-LexendDecaSemiBold  !py-0"
            title="Following"
            className="mt-[2px] !bg-[#121212] !p-0 !px-[9.872px] !rounded-[2.962px] py-[5px] border-[#16783A] border-[1px]"
            IconLeft={() => <Image source={icons.basePlusIcon} />}
            onPress={() => handleFollow("unfollow")}
            style={{
              backgroundColor: "#121212",
            }}
          />
        ) : (
          <CustomButton
            textStyle="!text-[8px] !font-LexendDecaSemiBold  !py-0"
            title="Follow"
            className="mt-[2px] !bg-[#16783A] !p-0 !px-[9.872px] !rounded-[2.962px] py-[5px]"
            IconLeft={() => <Image source={icons.basePlusIcon} />}
            onPress={() => handleFollow("follow")}
          />
        )}
      </View>

      <BottomSheet
        bgColor="#121212"
        childrenStyle="!px-[11px]"
        showCloseIcon={false}
        title=""
        show={showAuthSheet}
        titleColor="!text-white"
        snapPoints={["20%"]}
        enableDynamicSizing={false}
        onRequestClose={() => setShowAuthSheet(false)}
        keyboardBehavior="interactive"
      >
        <AuthSheet closeSheet={() => setShowAuthSheet(false)} />
      </BottomSheet>
    </Pressable>
  );
};

export default FollowCard;
