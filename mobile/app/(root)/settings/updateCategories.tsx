import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useForm } from "react-hook-form";

import {
  useGetAllCategoriesQuery,
  useUploadCategoriesMutation,
} from "@/services/categories";
import { toast } from "@/core/toast";
import { router } from "expo-router";
import { icons, images } from "@/constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDispatch, useSelector } from "react-redux";
import { signIn } from "@/store/features/auth/authSlice";
import { Skeleton } from "@rneui/themed";
import { FocusAwareStatusBar } from "@/components/ui/focus-aware-status-bar";
import CustomButton from "@/components/global/button/CustomButton";
import BottomSheet from "@/components/global/bottom-sheet";
import { AntDesign, Entypo } from "@expo/vector-icons";
import { setUser } from "@/store/features/auth/utils";
import axios from "axios";
import { RootState } from "@/store";

type FormData = {
  selectedCategories: {
    name: string;
    subCategories: { name: string }[];
  }[];
};

const { width } = Dimensions.get("window");

const Categories = () => {
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.authState.token);
  const { control, handleSubmit, setValue, watch } = useForm<FormData>({
    defaultValues: {
      selectedCategories: [],
    },
  });

  const [show, setShow] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [strippedCategories, setStrippedCategories] = useState<any[]>([]);

  const selectedCategories = watch("selectedCategories");
  const [uploadCategories, { isLoading }] = useUploadCategoriesMutation();
  const { data: categoriesData, isLoading: categoriesLoading } =
    useGetAllCategoriesQuery({});

  const getSelectedCategories = async () => {
    try {
      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL + "api/buyer/selected-categories",
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        },
      );

      setValue("selectedCategories", response.data?.categories);
    } catch (e) {
      console.log(e);
      toast.error("Could not get Selected Categories");
    }
  };

  const toggleCategory = (categoryId: string, title: string) => {
    if (selectedCategories.find((val) => val.name == title)) {
      setValue(
        "selectedCategories",
        selectedCategories.filter((val) => val.name !== title),
      );
      setSelectedCategory(
        selectedCategories.filter((val) => val.name !== title).slice(-1)[0]
          ?.name || null,
      );
    } else {
      const subCategories =
        categoriesData?.find((category: any) => category.name === title)
          ?.subCategories || [];
      setSubCategories(subCategories);
      setValue("selectedCategories", [
        ...selectedCategories,
        {
          name: title,
          subCategories,
        },
      ]);
      setSelectedCategory(title);
    }
  };

  const handleContinue = async (data: FormData) => {
    setLoading(true);
    try {
      const result = await uploadCategories({ selectedCategories }).unwrap();
      await setUser(result?.buyer);
      setLoading(false);
      toast.success(result.message);
      router.back();
    } catch (error: any) {
      setLoading(false);
      console.log("result", error);
      toast.error(error.data.message);
    }
  };

  const renderSkeletonLoader = () => {
    return (
      <View className="flex-row gap-[18px] justify-between items-center flex-wrap">
        <Skeleton
          style={{
            backgroundColor: "#121212",
            borderRadius: 8,
          }}
          skeletonStyle={{
            backgroundColor: "rgba(0,0,0,0.05)",
            borderRadius: 5,
          }}
          animation="wave"
          width={(width - 66) / 2}
          height={173}
        />

        <Skeleton
          style={{
            backgroundColor: "#121212",
            borderRadius: 8,
          }}
          skeletonStyle={{
            backgroundColor: "rgba(0,0,0,0.05)",
            borderRadius: 5,
          }}
          animation="wave"
          width={(width - 66) / 2}
          height={173}
        />
        <Skeleton
          style={{
            backgroundColor: "#121212",
            borderRadius: 8,
          }}
          skeletonStyle={{
            backgroundColor: "rgba(0,0,0,0.05)",
            borderRadius: 5,
          }}
          animation="wave"
          width={(width - 66) / 2}
          height={173}
        />
        <Skeleton
          style={{
            backgroundColor: "#121212",
            borderRadius: 8,
          }}
          skeletonStyle={{
            backgroundColor: "rgba(0,0,0,0.05)",
            borderRadius: 5,
          }}
          animation="wave"
          width={(width - 66) / 2}
          height={173}
        />
      </View>
    );
  };

  useEffect(() => {
    getSelectedCategories();
  }, []);

  // useEffect(() => {
  //   if (categoriesData) {
  //     setStrippedCategories(
  //       categoriesData?.map((cat: any) => ({
  //         _id: cat._id,
  //         name: cat?.name,
  //         image: {
  //           url: cat.image.url,
  //         },
  //       })),
  //     );
  //   }
  // }, [categoriesData]);

  const renderCategoryCards = useCallback(
    ({ item }: any) => {
      console.log("selected category ", selectedCategory);

      return (
        <TouchableOpacity
          onPress={() => toggleCategory(item.id, item.name)}
          className="rounded-md overflow-visible relative w-full shrink h-[173px]"
          style={{
            overflow: "visible",
          }}
          activeOpacity={0.5}
        >
          <Image
            source={{ uri: item.image.url }}
            className="rounded-md border-[0.6px] border-gray-200 h-full opacity-50"
            resizeMode="cover"
          />
          {selectedCategories.some((val) => val.name == item.name) && (
            <View
              className="bg-white"
              style={{
                position: "absolute",
                top: -10,
                right: -10,
                borderRadius: 11,
                width: 22,
                height: 22,
              }}
            >
              <AntDesign
                name="checkcircle"
                size={22}
                color="#16783A"
                style={{
                  alignSelf: "center",
                }}
              />
            </View>

            // <Image
            //   source={images.checkmarkIcon}
            //   className="absolute top-[-10px] right-[1px] w-6 h-6 z-50"
            // />
          )}
          <Text className=" font-LexendDecaSemiBold text-white absolute bottom-3 text-lg px-[8.41px]">
            {item.name}
          </Text>
        </TouchableOpacity>
      );
    },
    [selectedCategory, selectedCategories],
  );

  const renderListHeader = useCallback(() => {
    return (
      <View className="flex-row items-center justify-between mb-[36px] mt-[20px]">
        <TouchableOpacity className="" onPress={() => router.back()}>
          <Entypo
            name="chevron-left"
            size={24}
            color="rgba(204, 204, 204, 0.8)"
          />
        </TouchableOpacity>
        <Text className="text-gray-200 font-LexendDecaBold text-center text-[20px] self-center">
          What’s your style ?
        </Text>
        <Text> </Text>
      </View>
    );
  }, []);

  return (
    <>
      <FocusAwareStatusBar barStyle="light-content" backgroundColor="black" />
      <SafeAreaView className="h-full bg-black">
        <View className="flex-1 ">
          <FlatList
            data={categoriesData}
            numColumns={2}
            keyExtractor={(item) => item._id}
            ListEmptyComponent={renderSkeletonLoader}
            ListHeaderComponent={renderListHeader}
            columnWrapperStyle={{
              justifyContent: "center",
              columnGap: 18,
              paddingVertical: 10,
              overflow: "visible",
              paddingHorizontal: 16,
            }}
            renderItem={renderCategoryCards}
            showsVerticalScrollIndicator={false}
          />
          <View className="mx-5 mt-[10px]">
            <CustomButton
              title="Continue"
              onPress={handleSubmit(handleContinue)}
              disabled={!selectedCategory || isLoading}
              className="mb-4 bg-primary-100 !rounded !text-white text-sm font-LexendDecaBold"
            />
          </View>
        </View>
      </SafeAreaView>
    </>
  );
};

export default Categories;
