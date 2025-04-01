import { View, Text, Pressable } from "react-native";
import React, { useEffect, useMemo, useState, memo } from "react";
import { AntDesign, SimpleLineIcons } from "@expo/vector-icons";
import { formatTimeFromNow, formatTimeFromNowLive } from "@/helpers/helpers";

const streamEnum = {
  open_show: "Liveshow",
  auction: "Auction",
} as any;

const RsvpSheet = ({ streamDetails, closeSheet }: any) => {
  const [updateTimer, setUpdateTimer] = useState<number>(1);
  const rsvpDateArray = useMemo(() => {
    return formatTimeFromNowLive(streamDetails?.scheduledStartTime)?.split(":");
  }, [streamDetails?.scheduledStartTime, updateTimer]);

  useEffect(() => {
    const interval = setInterval(() => {
      setUpdateTimer((prevState) => prevState + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);
  return (
    <View className="mt-[10px] my-[20px]">
      <View className="flex-row items-center justify-center w-full mb-[8px]">
        <Text className="text-[20px] font-LexendDecaMedium text-white">
          Upcoming {streamEnum[streamDetails?.type]}
        </Text>
        <Pressable
          onPress={closeSheet}
          style={{
            position: "absolute",
            right: 12,
          }}
        >
          <View className="bg-[#EE571C] w-[30px] h-[30px] rounded-[50%]">
            <AntDesign name="closecircle" size={30} color="#F9C7B3" />
          </View>
        </Pressable>
      </View>
      <View className="flex-row items-center justify-center gap-[8px] mb-[40px]">
        <SimpleLineIcons name="people" size={16} color="#16783A" />
        <Text className="text-[14px] text-[#ccc] font-LexendDecaMedium">
          500 waiting to join
        </Text>
      </View>
      <Pressable
        className="mb-[12px] border-[2px] border-[#16783A] rounded-[8px] bg-white items-center justify-center h-[60px] w-[90%] self-center"
        style={{
          width: "90%",
        }}
      >
        <Text className="text-[16px] text-[#16783A] font-LexendDecaSemiBold">
          RSVP and Notify me?
        </Text>
      </Pressable>
      <Text className="mb-[12px] text-[14px] text-[#fff] font-LexendDecaMedium text-center">
        {streamEnum[streamDetails?.type]} Starts in
      </Text>

      <View className="flex-row items-center justify-center flex-wrap gap-[16px]">
        {rsvpDateArray.length > 0 &&
          rsvpDateArray?.map((date: any, index: number) => (
            <View
              className="px-[8px] py-[4px] rounded-[6px] bg-[#D0F6DE]"
              key={index}
              style={{
                backgroundColor: "#D0F6DE",
              }}
            >
              <Text className="text-[10px] text-[#16783A] font-LexendDecaSemiBold">
                {date}
              </Text>
            </View>
          ))}
      </View>
    </View>
  );
};

export default memo(RsvpSheet);
