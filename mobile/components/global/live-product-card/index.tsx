import { View, Text, TouchableOpacity, Dimensions } from "react-native";
import React, { useState } from "react";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { useLivestream } from "../../../contexts/livestreamContext";
import { Link, useRouter } from "expo-router";
import BottomSheet from "../bottom-sheet";
import RsvpSheet from "@/components/livestream/rsvpSheet";
import { formatDate } from "@/helpers/helpers";
import { toast } from "@/core/toast";
import { GlassImage } from "@/app/(root)/livestream/components";

const { width } = Dimensions.get("window");

const LiveProductCard = ({ item, showBtn, showLive }: any) => {
  const router = useRouter();
  const { joinStream } = useLivestream();

  const [rsvpSheet, showRsvpSheet] = useState<boolean>(false);

  return (
    <>
      <TouchableOpacity
        onPress={() => {
          if (item?.status == "scheduled") {
            return showRsvpSheet(true);
          }
          if (item?.status !== "live") {
            return toast.info("Stream is not Active!");
          }
          return router.push(
            `/livestream/feed?id=${item?._id}&type=${item.type}`,
          );
          item.type === "auction"
            ? router.push(`/livestream/liveAuctionStudio?id=${item?._id}`)
            : router.push(`/livestream/livestreamStudio?id=${item?._id}`);
        }}
        className=" rounded-lg"
        style={{
          width: "100%",
          maxWidth: (width - 32) / 2 - 6,
          // maxWidth: 240,
        }}
      >
        {/* Seller Info */}

        <View className="flex-row items-center mb-2 justify-between ">
          <View className="flex-row items-center gap-2">
            <View className="w-8 h-8 rounded-full overflow-hidden">
              <GlassImage
                source={{ uri: item?.seller?.storeAvatar?.url }}
                imageClassName="w-full h-full"
                containerClassName="w-full h-full"
                placeholderColor="rgba(100, 100, 100, 0.3)"
                tint="dark"
                blurIntensity={15}
                resizeMode="cover"
              />
            </View>
            <Text
              numberOfLines={1}
              className="text-gray-200 text-sm font-medium capitalize font-LexendDecaMedium"
            >
              {item?.seller?.storeName}
            </Text>
          </View>
        </View>
        {/* Main Product Image */}
        <View className="relative">
          <View className="h-[240px] w-[100%] rounded-lg overflow-hidden">
            <GlassImage
              source={{ uri: item?.coverImage?.url }}
              imageClassName="w-full h-full"
              containerClassName="w-full h-full"
              placeholderColor="rgba(30, 30, 30, 0.5)"
              tint="dark"
              blurIntensity={25}
              showActivityIndicator={true}
              indicatorColor="#16783A"
              resizeMode="cover"
            />
          </View>
          <View className="absolute top-2 left-2">
            {item?.status === "scheduled" ? (
              <View className="bg-[#FE4C4C] flex-row items-center gap-2 px-2 py-1 rounded-md">
                <Text className="text-white text-[10px] font-LexendDeca">
                  {formatDate(item?.scheduledStartTime, "DD/MM/YY, HH:mm")}
                </Text>
              </View>
            ) : (
              <View className="bg-[#FE4C4C] flex-row items-center gap-2 px-2 animate-pulse py-1 rounded-md">
                {item?.status !== "live" ? (
                  <Text className="text-white text-[10px] font-LexendDeca">
                    {item?.status}
                  </Text>
                ) : (
                  <>
                    <Text className="text-white text-[10px] font-LexendDeca">
                      Live •
                    </Text>
                    <Text className="text-white text-[10px] font-LexendDeca">
                      {item?.viewers?.length || 0}
                    </Text>
                  </>
                )}
              </View>
            )}
          </View>

          {/* Play Button Overlay */}
          <View className="absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center">
            {/* <Link
              href={`${item.type === "auction" ? "/livestream/liveAuctionStudio" : "/livestream/livestreamStudio"}?id=${item?._id}`}
              asChild
            > */}
            {item?.status == "live" && (
              <View className="bg-black/30 rounded-full p-4">
                <Ionicons name="play" size={25} color="white" />
              </View>
            )}

            {/* </Link> */}
          </View>
        </View>

        {/* Content Below Image */}
        <View className="mt-2">
          {/* Title */}
          <Text
            numberOfLines={1}
            className="text-white text-base capitalize max-w-[150px] font-LexendDeca font-semibold"
          >
            {item?.title}
          </Text>

          {/* Tags */}
          <View className="flex-row">
            <Text
              numberOfLines={2}
              className="text-[#027CEC] max-w-[150px] text-xs font-LexendDeca"
            >
              {item?.category} • {item?.tags?.join(", ")}
            </Text>
          </View>

          <Text className="text-[#425466] text-[8px] font-LexendDeca mt-1">
            Lagos, Nigeria
          </Text>
        </View>
      </TouchableOpacity>

      <BottomSheet
        bgColor="#121212"
        childrenStyle="!px-[11px]"
        showCloseIcon={false}
        show={rsvpSheet}
        onRequestClose={() => showRsvpSheet(false)}
        snapPoints={["35%"]}
        enableDynamicSizing={false}
        keyboardBehavior={"interactive"}
      >
        <RsvpSheet
          streamDetails={item}
          closeSheet={() => showRsvpSheet(false)}
        />
      </BottomSheet>
    </>
  );
};

export default LiveProductCard;
