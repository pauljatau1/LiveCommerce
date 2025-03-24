import { View, Text, FlatList } from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import Tags from "../global/tags";

import { ScrollView } from "react-native-virtualized-view";
import CustomButton from "../global/button/CustomButton";
import { router } from "expo-router";
import ForYou from "./for-you";
import Jewellery from "./jewellery";
import Shoes from "./shoes";
import Suits from "./suits";
import Denim from "./denim";
import HomeHeader from "../home/home-header";
import { useGetAllProductsQuery } from "@/services/products";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { getToken, getUser } from "@/store/features/auth/utils";
import { useGetAllCategoriesQuery } from "@/services/categories";
import GeneralCategory from "./general";
import axios from "axios";
import TabHeader from "../skeleton/tabHeader";
import TabHeaderSkeleton from "../skeleton/tabHeader";
import { useSelector } from "react-redux";
import { RootState } from "@/store";

const Marketplace = () => {
  const { user, token } = useSelector((state: RootState) => state.authState);
  const tabBarHeight = useBottomTabBarHeight();
  const {
    data: allCategories,
    error,
    isLoading,
  } = useGetAllCategoriesQuery({});
  const [selected, setSelected] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const tags = ["For You", "Jewellery", "Shoes", "Suits", "Denim"];

  // console.log("subCats ", subCategories);

  const getSelectedCategories = async () => {
    try {
      let cat = user?.selectedCategories;

      if (!cat || cat?.length < 1) {
        const response = await axios.get(
          process.env.EXPO_PUBLIC_API_URL + "api/buyer/selected-categories",
          {
            headers: {
              Authorization: "Bearer " + token,
            },
          },
        );
        cat = response.data.categories;
      }
      if (token && cat) {
        setCategories(["For You", ...cat.map((ct: any) => ct.name)]);
        return setSelected("For You");
      }
      setCategories(allCategories.map((ct: any) => ct.name));
      setSelected(allCategories[0]?.name);
    } catch (e) {
      console.log(e);
      setCategories(allCategories.map((ct: any) => ct.name));
    }
  };

  useEffect(() => {
    getSelectedCategories();
  }, [allCategories]);

  const renderContent = useCallback(() => {
    if (selected == "For You") {
      return <ForYou />;
    }

    return (
      <GeneralCategory
        name={selected}
        category={allCategories?.find((cat: any) => cat.name == selected)}
      />
    );
  }, [selected]);

  return (
    <View className="pt-[30px]" style={{ flex: 1 }}>
      <HomeHeader />
      <View className="">
        {categories?.length < 1 ? (
          <TabHeaderSkeleton />
        ) : (
          <Tags
            tags={categories}
            selected={selected}
            setSelected={setSelected}
          />
        )}
      </View>
      <ScrollView
        style={{ flex: 1 }}
        className="w-full"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: 20,
          paddingBottom: 80,
        }}
      >
        {selected && renderContent()}
        <View>
          <View className="w-full relative px-[23px] ">
            <Text className="text-center text-[#fff] text-[16px] font-LexendDecaBold pt-[40px]">
              Still Searching
            </Text>
            <View className="flex-row w-full space-x-3 gap-4 justify-center pt-[18px]">
              <CustomButton
                title="Explore Categories"
                textStyle="!font-LexendDecaSemiBold text-xs"
                className="border !w-[47%]  rounded-md border-[#EDF2F7] bg-transparent"
                onPress={() => {
                  router.push("/(root)/(tabs)/explore/explore");
                }}
              />
              <CustomButton
                title="Visit Community"
                textStyle="!font-LexendDecaSemiBold text-xs"
                className="!w-[47%] !bg-primary-200  rounded-md  "
                onPress={() => {
                  router.push("/(root)/(tabs)/connect");
                }}
              />
            </View>
          </View>
        </View>
      </ScrollView>

      <View className="flex-row justify-around w-[260px] mx-auto absolute bottom-[20px] self-center">
        <CustomButton
          title="Live Show"
          textStyle="!text-[#141B34]"
          className="!w-[130px] !bg-[#F2F2F2]  rounded-tr-none rounded-br-none"
          onPress={() => {
            router.push("/(root)/(tabs)/home/home");
          }}
        />
        <CustomButton
          title="Markets"
          className="!w-[130px] rounded-tl-none rounded-bl-none rounded-[40px] !bg-primary-200 "
          onPress={() => {
            router.push("/(root)/(tabs)/home/marketplace");
          }}
        />
      </View>
    </View>
  );
};

export default Marketplace;
