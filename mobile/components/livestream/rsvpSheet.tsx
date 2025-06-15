import { View, Text, Pressable, Image } from "react-native";
import React, { useEffect, useMemo, useState, memo } from "react";
import { AntDesign, SimpleLineIcons } from "@expo/vector-icons";
import { formatTimeFromNow, formatTimeFromNowLive } from "@/helpers/helpers";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { toast } from "@/core/toast";
import axios from "axios";
import { ActivityIndicator } from "react-native-paper";
import { GlassImage } from "@/app/(root)/livestream/components";

const streamEnum = {
  open_show: "Liveshow",
  auction: "Auction",
} as any;

const RsvpSheet = ({ streamDetails, closeSheet }: any) => {
  const token = useSelector((state: RootState) => state.authState.token);
  const [updateTimer, setUpdateTimer] = useState<number>(1);
  const rsvpDateArray = useMemo(() => {
    return formatTimeFromNowLive(streamDetails?.scheduledStartTime)?.split(":");
  }, [streamDetails?.scheduledStartTime, updateTimer]);
  const [loading, setLoading] = useState<boolean>(false);
  const [subscribed, setSubscribed] = useState<boolean>(false);
  const [gettingStatus, setGettingStatus] = useState<boolean>(true);

  const subscribe = async () => {
    console.log(streamDetails);

    setLoading(true);
    try {
      if (!token) {
        return toast.info("Login to RSVP into a stream");
      }
      const response = await axios.post(
        process.env.EXPO_PUBLIC_API_URL +
          `api/streams/${streamDetails?._id}/${subscribed ? "unsubscribe" : "subscribe"}`,
        {},
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        },
      );
      setSubscribed(!subscribed);
    } catch (e) {
      console.log("unable to rsvp", e);
    } finally {
      setLoading(false);
    }
  };

  const getIsSubscribed = async () => {
    try {
      console.log("streamid", streamDetails?._id);
      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL +
          `api/streams/${streamDetails?._id}/is-subscribed`,

        {
          headers: {
            Authorization: "Bearer " + token,
          },
        },
      );
      setSubscribed(response.data?.isSubscribed);
    } catch (e) {
      console.log("unable to get subscribed status", e);
    } finally {
      setGettingStatus(false);
    }
  };
  useEffect(() => {
    getIsSubscribed();
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
      { streamDetails?.seller && (
        <View className="flex-row items-center justify-center gap-[8px] mb-[5px]">
          <GlassImage source={{ uri: streamDetails?.seller?.storeAvatar?.url }} containerClassName="w-[30px] h-[30px] rounded-full" imageClassName="w-full h-full rounded-full" glassClassName="w-full h-full rounded-full" placeholderColor="rgba(255, 255, 255, 0.1)" blurIntensity={20} tint="dark" showActivityIndicator={false} />
          <Text className="text-[14px] text-[#ccc] font-LexendDecaMedium">
            {streamDetails?.seller?.storeName}
          </Text>
        </View>
      )}
      <View className="flex-row items-center justify-center gap-[8px] mb-[40px]">
        <SimpleLineIcons name="people" size={16} color="#16783A" />
        <Text className="text-[14px] text-[#ccc] font-LexendDecaMedium">
          {streamDetails?.subscribersCount} waiting to join
        </Text>
      </View>

      {gettingStatus ? (
        <ActivityIndicator
          size={"small"}
          color="white"
          style={{ marginBottom: 12 }}
        />
      ) : subscribed ? (
        <Pressable
          className="mb-[12px] border-[2px] border-[#16783A] rounded-[8px] bg-[#16783A] items-center justify-center h-[60px] w-[90%] self-center"
          style={{
            width: "90%",
          }}
          onPress={() => subscribe()}
        >
          {loading ? (
            <ActivityIndicator size={14} color="#fff" />
          ) : (
            <Text className="text-[16px] text-[#fff] font-LexendDecaSemiBold">
              You're in!
            </Text>
          )}
        </Pressable>
      ) : (
        <Pressable
          className="mb-[12px] border-[2px] border-[#16783A] rounded-[8px] bg-white items-center justify-center h-[60px] w-[90%] self-center"
          style={{
            width: "90%",
          }}
          onPress={() => subscribe()}
        >
          {loading ? (
            <ActivityIndicator size={14} color="#16783A" />
          ) : (
            <Text className="text-[16px] text-[#16783A] font-LexendDecaSemiBold">
              RSVP and Notify me?
            </Text>
          )}
        </Pressable>
      )}

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
