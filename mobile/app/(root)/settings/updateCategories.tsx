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
import { Entypo } from "@expo/vector-icons";
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
      setSelectedCategory(title);
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
    }
  };

  const addSubCategory = (categoryName: string, subCategoryName: string) => {
    const updatedCategories = [...selectedCategories];
    const categoryIndex = updatedCategories.findIndex(
      (category) => category.name === categoryName,
    );

    if (categoryIndex !== -1) {
      const category = updatedCategories[categoryIndex];
      const isAlreadyAdded = category.subCategories.some(
        (sub) => sub.name === subCategoryName,
      );

      if (isAlreadyAdded) {
        category.subCategories = category.subCategories.filter(
          (sub) => sub.name !== subCategoryName,
        );
      } else {
        category.subCategories.push({ name: subCategoryName });
      }
    } else {
      updatedCategories.push({
        name: categoryName,
        subCategories: [{ name: subCategoryName }],
      });
    }

    setValue("selectedCategories", updatedCategories);
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

  const renderCategoryCards = useCallback(
    ({ item }: any) => {
      return (
        <TouchableOpacity
          onPress={() => toggleCategory(item.id, item.name)}
          className="rounded-md overflow-visible relative w-full shrink h-[173px]"
          activeOpacity={0.5}
        >
          <Image
            source={{ uri: item.image.url }}
            className="rounded-md border-[0.6px] border-gray-200 h-full opacity-50"
            resizeMode="cover"
          />
          {selectedCategories.find((val) => val.name == item.name) && (
            <Image
              source={images.checkmarkIcon}
              className="absolute top-[-10px] right-[1px] w-6 h-6 z-50"
            />
          )}
          <Text className=" font-LexendDecaSemiBold text-white absolute bottom-3 text-lg px-[8.41px]">
            {item.name}
          </Text>
        </TouchableOpacity>
      );
    },
    [categoriesData, selectedCategories],
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
        <View className="flex-1 px-[24px]">
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
            }}
            renderItem={renderCategoryCards}
            showsVerticalScrollIndicator={false}
          />
          <View className="mx-5 mt-5">
            <CustomButton
              title="Continue"
              onPress={handleSubmit(handleContinue)}
              disabled={!selectedCategory || isLoading}
              className="mb-4 mt-[18px] bg-primary-100 !rounded !text-white text-sm font-LexendDecaBold"
            />
            {/* <CustomButton
              title="Add Preference"
              onPress={() => setShow(true)}
              textVariant="success"
              disabled={!selectedCategory || isLoading}
              className="mb-16 mt-[18px] bg-transparent border border-[#16783A] !rounded text-sm font-LexendDecaBold"
              IconLeft={() => (
                <Image
                  source={icons.addCircle}
                  resizeMode="contain"
                  className="mx-1"
                />
              )}
            /> */}
            <BottomSheet
              bgColor="#3A3A3A"
              childrenStyle="!px-[11px]"
              showCloseIcon={false}
              title="Sub Category"
              show={show}
              titleColor="!text-white"
              keyboardBehavior="interactive"
            >
              <View className="rounded-t-3xl">
                <FlatList
                  data={subCategories}
                  numColumns={2}
                  columnWrapperStyle={{
                    columnGap: 22,
                    justifyContent: "space-between",
                  }}
                  keyExtractor={(item) => item._id}
                  renderItem={({ item: subCategory }) => {
                    const isSelected = selectedCategories.some(
                      (category) =>
                        category.name === selectedCategory &&
                        category.subCategories.some(
                          (sub) => sub.name === subCategory.name,
                        ),
                    );

                    return (
                      <TouchableOpacity
                        style={{
                          backgroundColor: isSelected
                            ? "#16783A"
                            : "rgba(69, 193, 51, 0.15)",
                          padding: 16,
                          marginBottom: 26,
                        }}
                        className="rounded-[26.928px] flex-1 items-center flex-row justify-between px-[22px] text-center w-[168px] font-LexendDeca font-normal text-sm border-gray-200 border-[0.861px]"
                        onPress={() =>
                          addSubCategory(
                            selectedCategory ||
                              // selectedCategories[0]?.name ||
                              "",
                            subCategory.name,
                          )
                        }
                      >
                        <Text
                          className={
                            isSelected ? "text-white" : "text-gray-200"
                          }
                          style={{ fontSize: 14.362 }}
                        >
                          {subCategory.name}
                        </Text>
                        <Image
                          source={
                            isSelected
                              ? icons.checkmarkCircleSelectIcon
                              : icons.checkmarkCircleIcon
                          }
                        />
                      </TouchableOpacity>
                    );
                  }}
                />
              </View>
              <View className="mx-3">
                <CustomButton
                  title="Continue"
                  onPress={() => setShow(false)}
                  className="mb-8 mt-[18px] bg-primary-200 !rounded !text-white text-[14.512px] font-LexendDecaBold"
                />
              </View>
            </BottomSheet>
          </View>
        </View>
      </SafeAreaView>
    </>
  );
};

export default Categories;
