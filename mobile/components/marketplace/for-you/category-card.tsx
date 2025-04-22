import { View, Text, Pressable } from "react-native";
import { Image } from "expo-image";
import React from "react";
import { router } from "expo-router";

const ForYouCategoryCard = ({ item }: any) => {
  const subCats = item?.subCategories?.map((sub: any) => sub?.name);
  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: `/(root)/(tabs)/explore/${item._id}`,
          params: {
            name: item.name,
            subCategories: subCats,
          },
        })
      }
    >
      <View className="w-[178px] relative h-[214.185px] mr-[8.43px] bg-[#2e2e2e] rounded-[6px]">
        <Image
          source={{ uri: item?.image?.url }}
          style={{
            width: "100%",
            height: "100%",
            borderRadius: 4.15,
          }}
          contentFit="cover"
        />
      </View>
      <Text className="text-[12px] font-normal  !text-white font-LexendDecaSemiBold mt-[8.43px]">
        {item.name}
      </Text>
    </Pressable>
  );
};

export default ForYouCategoryCard;
