import { View, Text, Image, Pressable } from "react-native";
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
          className=" rounded-[4.15px] h-full w-full"
          resizeMode="cover"
        />
      </View>
      <Text className="text-[12px] font-normal  !text-white font-LexendDecaSemiBold mt-[8.43px]">
        {item.name}
      </Text>
    </Pressable>
  );
};

export default ForYouCategoryCard;
